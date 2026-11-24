import 'dotenv/config';
import sql from 'mssql';

async function checkFct() {
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

		// Tables de fonctions
		const fctTables = await pool.request().query(`
			SELECT TABLE_NAME
			FROM INFORMATION_SCHEMA.TABLES
			WHERE TABLE_SCHEMA = '${schema}'
			  AND (TABLE_NAME LIKE 'AFONC%' OR TABLE_NAME LIKE 'AFCT%' OR TABLE_NAME LIKE 'AMEN%')
			ORDER BY TABLE_NAME
		`);
		console.log('Tables AFONC/AFCT/AMEN trouvées :');
		console.table(fctTables.recordset);

		// Si AFONCTION existe, chercher FONADI et GESADI
		const hasAfonc = fctTables.recordset.some(t => t.TABLE_NAME === 'AFONCTION');
		if (hasAfonc) {
			console.log('\nRecherche de FONADI, GESADI, ADILNG dans AFONCTION :');
			const foncs = await pool.request().query(`
				SELECT FNC_0, NOMFNC_0, MODULE_0, TYP_0
				FROM ${schema}.AFONCTION
				WHERE FNC_0 IN ('FONADI', 'GESADI', 'GESADI2', 'ADILNG')
			`);
			console.table(foncs.recordset);
		}

		await pool.close();
	} catch (e) {
		console.error('[ERREUR]', e.message);
	}
}

checkFct();
