import 'dotenv/config';
import sql from 'mssql';

async function deepSearchSecurity() {
	console.log('=====================================================');
	console.log('  RECHERCHE APPROFONDIE DES RESTRICTIONS SAGE X3     ');
	console.log('=====================================================\n');

	const dbServer = process.env.SAGE_DB_SERVER || '10.103.7.128';
	const dbPort = parseInt(process.env.SAGE_DB_PORT || '1433', 10);
	const dbName = process.env.SAGE_DB_NAME || 'x3v6';
	const dbUser = process.env.SAGE_DB_USER;
	const dbPass = process.env.SAGE_DB_PASSWORD;
	const schema = process.env.SAGE_DB_SCHEMA || 'VDRSANDB';

	try {
		const pool = await new sql.ConnectionPool({
			server: dbServer,
			port: dbPort,
			database: dbName,
			user: dbUser,
			password: dbPass,
			options: { encrypt: false, trustServerCertificate: true, connectTimeout: 10000 }
		}).connect();

		// 1. Quelles tables dans VDRSANDB contiennent une colonne NUMTAB ?
		console.log('[1] Tables contenant une colonne NUMTAB ou CODTAB :');
		const numtabTables = await pool.request().query(`
			SELECT DISTINCT TABLE_NAME, COLUMN_NAME
			FROM INFORMATION_SCHEMA.COLUMNS
			WHERE TABLE_SCHEMA = '${schema}'
			  AND (COLUMN_NAME LIKE '%NUMTAB%' OR COLUMN_NAME LIKE '%CODTAB%')
			ORDER BY TABLE_NAME
		`);
		console.table(numtabTables.recordset);

		// 2. Recherche de tables spécifiques Valdepharm (Y* ou Z* ou X*) liées aux droits/accès
		console.log('\n[2] Tables spécifiques Valdepharm (Y* / Z* / X*) liées aux accès, droits ou tables :');
		const specificTables = await pool.request().query(`
			SELECT TABLE_NAME
			FROM INFORMATION_SCHEMA.TABLES
			WHERE TABLE_SCHEMA = '${schema}'
			  AND (
				 TABLE_NAME LIKE 'Y%TAB%' OR TABLE_NAME LIKE 'Z%TAB%' OR TABLE_NAME LIKE 'X%TAB%'
				 OR TABLE_NAME LIKE 'Y%DROIT%' OR TABLE_NAME LIKE 'Z%DROIT%' OR TABLE_NAME LIKE 'X%DROIT%'
				 OR TABLE_NAME LIKE 'Y%ACCES%' OR TABLE_NAME LIKE 'Z%ACCES%' OR TABLE_NAME LIKE 'X%ACCES%'
				 OR TABLE_NAME LIKE 'Y%ADI%' OR TABLE_NAME LIKE 'Z%ADI%' OR TABLE_NAME LIKE 'X%ADI%'
			  )
			ORDER BY TABLE_NAME
		`);
		console.table(specificTables.recordset);

		// 3. Comment les fonctions Tables Diverses (GESADI, FONADI, etc.) sont-elles déclarées dans les menus ?
		console.log('\n[3] Fonctions liées aux Tables Diverses dans AFCTFCT / APROFIL :');
		try {
			const functions = await pool.request().query(`
				SELECT DISTINCT FNC_0, LIBFNC_0
				FROM ${schema}.AFCTFCT
				WHERE FNC_0 LIKE '%ADI%' OR LIBFNC_0 LIKE '%Table%' OR LIBFNC_0 LIKE '%diverse%'
				ORDER BY FNC_0
			`);
			console.table(functions.recordset);
		} catch (e) {
			console.log('    Table AFCTFCT non accessible ou différente:', e.message);
		}

		// 4. Recherche dans les menus Sage X3 (AMENLOC / AMENUT / APROFIL)
		console.log('\n[4] Entrées de menu Sage X3 associées aux Tables Diverses :');
		try {
			const menuEntries = await pool.request().query(`
				SELECT TOP 20 CODMEN_0, LIBMEN_0
				FROM ${schema}.AMENLOC
				WHERE LIBMEN_0 LIKE '%table%diverse%' OR LIBMEN_0 LIKE '%tables diverses%'
			`);
			console.table(menuEntries.recordset);
		} catch (e) {
			console.log('    Table AMENLOC:', e.message);
		}

		// 5. Quelles tables diverses spécifiques Valdepharm (>= 1000) sont le plus utilisées ?
		console.log('\n[5] Top 15 des tables diverses Valdepharm (>= 1000) avec le plus de valeurs :');
		const topTables = await pool.request().query(`
			SELECT TOP 15 NUMTAB_0, COUNT(*) AS nb_valeurs
			FROM ${schema}.ATABDIV
			WHERE NUMTAB_0 >= 1000
			GROUP BY NUMTAB_0
			ORDER BY nb_valeurs DESC
		`);
		console.table(topTables.recordset);

		await pool.close();
	} catch (err) {
		console.error('[ERREUR]', err.message);
	}
}

deepSearchSecurity();
