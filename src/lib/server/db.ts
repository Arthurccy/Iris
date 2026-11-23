import 'dotenv/config';
import sql from 'mssql';
import { env } from '$env/dynamic/private';
import miscTablesData from '$lib/data/miscTablesCatalog.json';
import type { MiscTableDefinition } from '$lib/types';

let pool: sql.ConnectionPool | null = null;
let lastDbError: string | null = null;

export function getLastDbError(): string | null {
	return lastDbError;
}

export function getDbConfig(): sql.config | null {
	const server = process.env.SAGE_DB_SERVER || env.SAGE_DB_SERVER || '10.103.7.128';
	const port = parseInt(process.env.SAGE_DB_PORT || env.SAGE_DB_PORT || '1433', 10);
	const database = process.env.SAGE_DB_NAME || env.SAGE_DB_NAME || 'x3v6';
	const user = process.env.SAGE_DB_USER || env.SAGE_DB_USER;
	const password = process.env.SAGE_DB_PASSWORD || env.SAGE_DB_PASSWORD;
	const domain = process.env.SAGE_DB_DOMAIN || env.SAGE_DB_DOMAIN;

	// Si aucun utilisateur n'est configuré, on ne tente pas de connexion
	if (!user) {
		lastDbError = 'La variable SAGE_DB_USER est vide ou non définie.';
		return null;
	}

	const config: sql.config = {
		server,
		port,
		database,
		user,
		password,
		domain: domain || undefined,
		options: {
			encrypt: false,
			trustServerCertificate: true,
			enableArithAbort: true,
			connectTimeout: 15000,
			requestTimeout: 20000
		}
	};

	return config;
}

export async function getPool(): Promise<sql.ConnectionPool | null> {
	const config = getDbConfig();
	if (!config) {
		return null;
	}

	if (!pool) {
		try {
			pool = await new sql.ConnectionPool(config).connect();
			console.log(`[IRIS] Connecté avec succès à SQL Server ${config.server}:${config.port}/${config.database} (Utilisateur: ${config.user})`);
			lastDbError = null;
		} catch (err) {
			const errorMsg = (err as Error).message || String(err);
			console.error('[IRIS] Erreur de connexion SQL Server Sage X3:', errorMsg);
			lastDbError = errorMsg;
			pool = null;
			return null;
		}
	}
	return pool;
}

export async function getLiveOrCachedTables(): Promise<{
	isLive: boolean;
	tables: MiscTableDefinition[];
}> {
	const activePool = await getPool();
	if (!activePool) {
		return {
			isLive: false,
			tables: miscTablesData as MiscTableDefinition[]
		};
	}

	try {
		const schema = process.env.SAGE_DB_SCHEMA || env.SAGE_DB_SCHEMA || 'VDRSANDB';

		// 1. Obtenir les titres des tables diverses depuis ATEXTRA
		const titlesResult = await activePool.request().query(`
			SELECT 
				CAST(IDENT1_0 AS INT) AS numtab,
				TEXTE_0 AS titre_table
			FROM ${schema}.ATEXTRA
			WHERE CODFIC_0 = 'ATABTAB'
			  AND ZONE_0 = 'LNGDES'
			  AND LANGUE_0 = 'FRA'
			ORDER BY CAST(IDENT1_0 AS INT);
		`);

		const titlesMap = new Map<number, string>();
		for (const row of titlesResult.recordset) {
			titlesMap.set(row.numtab, row.titre_table);
		}

		// 2. Obtenir les lignes de valeurs depuis ATABDIV + ATEXTRA
		const rowsResult = await activePool.request().query(`
			SELECT
				d.NUMTAB_0 AS numtab,
				RTRIM(d.CODE_0) AS code,
				ISNULL(RTRIM(t_long.TEXTE_0), RTRIM(d.CODE_0)) AS libelle_long,
				ISNULL(RTRIM(t_court.TEXTE_0), RTRIM(d.CODE_0)) AS libelle_court,
				RTRIM(ISNULL(d.A1_0, '')) AS param_a1,
				ISNULL(d.N1_0, 0) AS param_n1
			FROM ${schema}.ATABDIV d
			LEFT JOIN ${schema}.ATEXTRA t_long
				ON t_long.CODFIC_0 = 'ATABDIV'
				AND t_long.ZONE_0 = 'LNGDES'
				AND t_long.LANGUE_0 = 'FRA'
				AND t_long.IDENT1_0 = CAST(d.NUMTAB_0 AS VARCHAR(10))
				AND t_long.IDENT2_0 = d.CODE_0
			LEFT JOIN ${schema}.ATEXTRA t_court
				ON t_court.CODFIC_0 = 'ATABDIV'
				AND t_court.ZONE_0 = 'SHODES'
				AND t_court.LANGUE_0 = 'FRA'
				AND t_court.IDENT1_0 = CAST(d.NUMTAB_0 AS VARCHAR(10))
				AND t_court.IDENT2_0 = d.CODE_0
			ORDER BY d.NUMTAB_0, d.CODE_0;
		`);

		const rowsByTable = new Map<number, any[]>();
		for (const row of rowsResult.recordset) {
			if (!rowsByTable.has(row.numtab)) {
				rowsByTable.set(row.numtab, []);
			}
			rowsByTable.get(row.numtab)!.push({
				code: row.code,
				shortLabel: row.libelle_court,
				label: row.libelle_long,
				param_a1: row.param_a1,
				param_n1: row.param_n1 ? String(row.param_n1) : ''
			});
		}

		const allNums = new Set([...titlesMap.keys(), ...rowsByTable.keys()]);
		const sortedNums = Array.from(allNums).sort((a, b) => a - b);

		const tables: MiscTableDefinition[] = sortedNums.map((num) => {
			const title = titlesMap.get(num) || `Table diverse ${num}`;
			let category = 'Standard X3 - Général';
			if (num >= 6000) category = 'Valdepharm - Production & Tolling';
			else if (num >= 1000) category = 'Valdepharm - Spécifique Site';
			else if (num >= 500 && num < 600) category = 'Immobilisations';
			else if (num >= 400 && num < 500) category = 'CRM & Services';
			else if (num >= 300 && num < 400) category = 'Comptabilité & Banque';
			else if (num >= 100 && num < 300) category = 'Qualité & Contrôle';

			const items = rowsByTable.get(num) || [];
			return {
				numtab: num,
				title,
				category,
				description: `Table diverse Sage X3 numéro ${num} (${title}) gérée dans GESTDU / ATABDIV.`,
				itemCount: items.length,
				items
			};
		});

		return {
			isLive: true,
			tables
		};
	} catch (err) {
		console.error('[IRIS] Erreur lors de la lecture SQL Server live:', err);
		return {
			isLive: false,
			tables: miscTablesData as MiscTableDefinition[]
		};
	}
}
