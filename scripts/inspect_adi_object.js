import 'dotenv/config';
import sql from 'mssql';

async function inspectAdiObject() {
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

		// 1. Structure de l'objet ADI dans AOBJET
		console.log('[1] Objet ADI dans AOBJET (Filtres, Sélections, Tables liées) :');
		const aobjet = await pool.request().query(`
			SELECT *
			FROM ${schema}.AOBJET
			WHERE IDENT_0 = 'ADI'
		`);
		console.log(JSON.stringify(aobjet.recordset[0], null, 2));

		// 2. Colonnes de AFCTFCT
		console.log('\n[2] Fonctions liées à ADI dans AFCTFCT :');
		const fctCols = await pool.request().query(`
			SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
			WHERE TABLE_SCHEMA = '${schema}' AND TABLE_NAME = 'AFCTFCT'
		`);
		const colNames = fctCols.recordset.map(c => c.COLUMN_NAME);
		console.log('    Colonnes AFCTFCT:', colNames.join(', '));

		const fcts = await pool.request().query(`
			SELECT TOP 10 *
			FROM ${schema}.AFCTFCT
			WHERE FNC_0 LIKE '%ADI%' OR FNC_0 LIKE '%TAB%'
		`);
		console.table(fcts.recordset);

		// 3. Menus contenant ADI dans AMENU
		console.log('\n[3] Recherche dans AMENU / AMENLOC :');
		const menuCols = await pool.request().query(`
			SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
			WHERE TABLE_SCHEMA = '${schema}' AND TABLE_NAME = 'AMENU'
		`);
		console.log('    Colonnes AMENU:', menuCols.recordset.map(c => c.COLUMN_NAME).join(', '));

		const menus = await pool.request().query(`
			SELECT TOP 10 *
			FROM ${schema}.AMENU
			WHERE CODINT_0 LIKE '%ADI%' OR FNC_0 LIKE '%ADI%'
		`);
		console.table(menus.recordset);

		await pool.close();
	} catch (err) {
		console.error('[ERREUR]', err.message);
	}
}

inspectAdiObject();
