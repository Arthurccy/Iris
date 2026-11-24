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
		console.log('[1] Colonnes de AOBJET et recherche objet ADI :');
		const aobjCols = await pool.request().query(`
			SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
			WHERE TABLE_SCHEMA = '${schema}' AND TABLE_NAME = 'AOBJET'
		`);
		const objColNames = aobjCols.recordset.map(c => c.COLUMN_NAME);
		console.log('    Colonnes AOBJET:', objColNames.slice(0, 15).join(', '));

		// Trouver la colonne identifiant principal de AOBJET (souvent ABREV_0 ou OBJ_0 ou CODOBJ_0)
		const idCol = ['ABREV_0', 'OBJ_0', 'CODOBJ_0', 'IDENT_0'].find(c => objColNames.includes(c)) || objColNames[0];
		console.log(`    Colonne identifiant objet : ${idCol}`);

		const aobjet = await pool.request().query(`
			SELECT TOP 1 *
			FROM ${schema}.AOBJET
			WHERE ${idCol} = 'ADI'
		`);
		if (aobjet.recordset.length > 0) {
			console.log('    Configuration Objet ADI trouvée :');
			console.log(JSON.stringify(aobjet.recordset[0], null, 2));
		} else {
			console.log('    Objet ADI non trouvé avec cette colonne. Échantillon d\'objets :');
			const sampleObj = await pool.request().query(`SELECT TOP 5 ${idCol} FROM ${schema}.AOBJET`);
			console.table(sampleObj.recordset);
		}

		// 2. Colonnes de AFCTFCT
		console.log('\n[2] Fonctions liées à ADI dans AFCTFCT :');
		try {
			const fctCols = await pool.request().query(`
				SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
				WHERE TABLE_SCHEMA = '${schema}' AND TABLE_NAME = 'AFCTFCT'
			`);
			const colNames = fctCols.recordset.map(c => c.COLUMN_NAME);
			console.log('    Colonnes AFCTFCT:', colNames.join(', '));

			const fctCol = colNames.find(c => c.startsWith('FNC') || c.startsWith('COD')) || colNames[0];
			const fcts = await pool.request().query(`
				SELECT TOP 10 *
				FROM ${schema}.AFCTFCT
				WHERE ${fctCol} LIKE '%ADI%' OR ${fctCol} LIKE '%TAB%'
			`);
			console.table(fcts.recordset);
		} catch (e) {
			console.log('    Erreur AFCTFCT:', e.message);
		}

		// 3. Menus contenant ADI dans AMENU
		console.log('\n[3] Recherche dans AMENU :');
		try {
			const menuCols = await pool.request().query(`
				SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
				WHERE TABLE_SCHEMA = '${schema}' AND TABLE_NAME = 'AMENU'
			`);
			const mCols = menuCols.recordset.map(c => c.COLUMN_NAME);
			console.log('    Colonnes AMENU:', mCols.join(', '));

			const mCol = mCols.find(c => c.startsWith('COD') || c.startsWith('FNC') || c.startsWith('MEN')) || mCols[0];
			const menus = await pool.request().query(`
				SELECT TOP 10 *
				FROM ${schema}.AMENU
				WHERE ${mCol} LIKE '%ADI%'
			`);
			console.table(menus.recordset);
		} catch (e) {
			console.log('    Erreur AMENU:', e.message);
		}

		await pool.close();
	} catch (err) {
		console.error('[ERREUR]', err.message);
	}
}

inspectAdiObject();
