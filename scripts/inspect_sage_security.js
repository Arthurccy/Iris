import 'dotenv/config';
import sql from 'mssql';

async function inspectSecurity() {
	console.log('=====================================================');
	console.log('  AUDIT DE SÉCURITÉ & HABILITATIONS SAGE X3 / IRIS   ');
	console.log('=====================================================\n');

	const dbServer = process.env.SAGE_DB_SERVER || '10.103.7.128';
	const dbPort = parseInt(process.env.SAGE_DB_PORT || '1433', 10);
	const dbName = process.env.SAGE_DB_NAME || 'x3v6';
	const dbUser = process.env.SAGE_DB_USER;
	const dbPass = process.env.SAGE_DB_PASSWORD;
	const schema = process.env.SAGE_DB_SCHEMA || 'VDRSANDB';

	if (!dbUser || !dbPass) {
		console.error('[ERREUR] SAGE_DB_USER ou SAGE_DB_PASSWORD manquant dans .env');
		process.exit(1);
	}

	try {
		console.log(`[1] Connexion à SQL Server ${dbServer}:${dbPort}/${dbName} (Schéma: ${schema})...`);
		const pool = await new sql.ConnectionPool({
			server: dbServer,
			port: dbPort,
			database: dbName,
			user: dbUser,
			password: dbPass,
			options: {
				encrypt: false,
				trustServerCertificate: true,
				connectTimeout: 10000
			}
		}).connect();
		console.log('    -> Connexion SQL Server réussie !\n');

		// 1. Analyse des codes d'accès sur ATABTAB (Tables diverses)
		console.log('[2] Analyse de la table ATABTAB (Codes d\'accès sur les tables diverses)...');
		const atabtabCols = await pool.request().query(`
			SELECT COLUMN_NAME, DATA_TYPE
			FROM INFORMATION_SCHEMA.COLUMNS
			WHERE TABLE_SCHEMA = '${schema}' AND TABLE_NAME = 'ATABTAB'
		`);
		const hasAcsCol = atabtabCols.recordset.some((c) => c.COLUMN_NAME === 'ACS_0');
		console.log(`    Colonne ACS_0 (Code d'accès) présente dans ATABTAB : ${hasAcsCol ? 'OUI' : 'NON'}`);

		if (hasAcsCol) {
			const acsStats = await pool.request().query(`
				SELECT 
					COUNT(*) AS total_tables,
					SUM(CASE WHEN ISNULL(RTRIM(ACS_0), '') <> '' THEN 1 ELSE 0 END) AS tables_avec_code_acces,
					SUM(CASE WHEN ISNULL(RTRIM(ACS_0), '') = '' THEN 1 ELSE 0 END) AS tables_sans_code_acces
				FROM ${schema}.ATABTAB
			`);
			console.log('    Statistiques d\'accès ATABTAB :');
			console.table(acsStats.recordset);

			const distinctAcs = await pool.request().query(`
				SELECT RTRIM(ACS_0) AS code_acces, COUNT(*) AS nb_tables
				FROM ${schema}.ATABTAB
				WHERE ISNULL(RTRIM(ACS_0), '') <> ''
				GROUP BY RTRIM(ACS_0)
				ORDER BY nb_tables DESC
			`);
			if (distinctAcs.recordset.length > 0) {
				console.log('    Codes d\'accès configurés dans Sage X3 pour les tables diverses :');
				console.table(distinctAcs.recordset);
			} else {
				console.log('    [INFO] Aucun code d\'accès spécifique n\'est renseigné dans ATABTAB (toutes les tables ont ACS_0 vide).');
			}
		}

		// 2. Analyse de la table AUTILIS (Utilisateurs Sage X3)
		console.log('\n[3] Analyse de la table AUTILIS (Liaison comptes Windows & emails)...');
		const autilisCols = await pool.request().query(`
			SELECT COLUMN_NAME, DATA_TYPE
			FROM INFORMATION_SCHEMA.COLUMNS
			WHERE TABLE_SCHEMA = '${schema}' AND TABLE_NAME = 'AUTILIS'
		`);
		const colNames = autilisCols.recordset.map((c) => c.COLUMN_NAME);
		console.log('    Colonnes identifiées dans AUTILIS :');
		const relevantCols = ['USR_0', 'NOMUSR_0', 'ADDRES_0', 'LOGIN_0', 'CODSYR_0', 'PRFFCT_0', 'PRFMEN_0', 'ACS_0']
			.filter((c) => colNames.includes(c));
		console.log(`    -> ${relevantCols.join(', ')}`);

		// Échantillon utilisateurs
		const selectCols = relevantCols.map((c) => `RTRIM(${c}) AS ${c}`).join(', ');
		const usersSample = await pool.request().query(`
			SELECT TOP 10 ${selectCols}
			FROM ${schema}.AUTILIS
			WHERE ISNULL(RTRIM(ADDRES_0), '') <> '' OR ISNULL(RTRIM(USR_0), '') <> ''
			ORDER BY USR_0
		`);
		console.log('\n    Échantillon de 10 utilisateurs dans AUTILIS :');
		console.table(usersSample.recordset);

		// 3. Synthèse et recommandations
		console.log('\n=====================================================');
		console.log('               SYNTHÈSE POUR IRIS                    ');
		console.log('=====================================================');
		console.log('1. Si ACS_0 est vide sur ATABTAB :');
		console.log('   Sage X3 n\'applique pas de restriction par table nativement.');
		console.log('   La solution idéale est alors de lier les GROUPES AD aux DOMAINES (ex: Finance, Qualité, Production, IT).');
		console.log('2. Si ACS_0 est renseigné sur ATABTAB :');
		console.log('   On peut directement hériter des droits de Sage X3 via le profil de l\'utilisateur dans AUTILIS.\n');

		await pool.close();
	} catch (err) {
		console.error('[ERREUR]', err.message);
	}
}

inspectSecurity();
