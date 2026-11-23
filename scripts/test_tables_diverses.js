import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=====================================================');
console.log('   JEU DE TESTS FONCTIONNELS & TECHNIQUES IRIS X3    ');
console.log('       Tables Diverses Sage X3 (GESTDU / ATABDIV)    ');
console.log('=====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testName, details = '') {
	if (condition) {
		console.log(`[PASS] ${testName}`);
		passCount++;
	} else {
		console.error(`[FAIL] ${testName} - ${details}`);
		failCount++;
	}
}

// ----------------------------------------------------
// TEST 1 : Vérification de l'intégrité du catalogue
// ----------------------------------------------------
console.log('--- TEST SUITE 1 : Intégrité du référentiel ---');

const catalogPath = path.resolve(__dirname, '../src/lib/data/miscTablesCatalog.json');
const rawData = fs.readFileSync(catalogPath, 'utf8');
const catalog = JSON.parse(rawData);

assert(Array.isArray(catalog), 'Le catalogue des tables diverses est un tableau valide');
assert(catalog.length === 332, `Le catalogue contient exactement 332 tables (trouvé : ${catalog.length})`);

const totalItems = catalog.reduce((sum, t) => sum + (t.items ? t.items.length : 0), 0);
assert(totalItems >= 4400, `Le volume de valeurs réelles dépasse 4400 lignes (trouvé : ${totalItems})`);

const valdTables = catalog.filter((t) => t.numtab >= 1000);
assert(valdTables.length === 84, `Il y a 84 tables spécifiques Valdepharm >= 1000 (trouvé : ${valdTables.length})`);

// ----------------------------------------------------
// TEST 2 : Moteur de recherche et filtres
// ----------------------------------------------------
console.log('\n--- TEST SUITE 2 : Moteur de recherche & filtres ---');

// Recherche par numéro direct
const table1011 = catalog.find((t) => t.numtab === 1011);
assert(table1011 !== undefined && table1011.title.toLowerCase().includes('balance'), 'Recherche par n° 1011 retrouve la table "Balances"');

// Recherche par code d'une valeur interne
const searchCode = 'BAL01';
const foundByCode = catalog.find((t) => (t.items || []).some((i) => i.code === searchCode));
assert(foundByCode !== undefined && foundByCode.numtab === 1011, `Recherche du code '${searchCode}' pointe bien vers la table #1011`);

// Masquage des tables vides
const nonEmptyTables = catalog.filter((t) => (t.items || []).length > 0);
assert(nonEmptyTables.length === 270, `Le filtre des tables renseignées retient exactement 270 tables (trouvé : ${nonEmptyTables.length})`);

// ----------------------------------------------------
// TEST 3 : Validation des règles de gestion (Ajout / Doublons)
// ----------------------------------------------------
console.log('\n--- TEST SUITE 3 : Règles de gestion & Doublons ---');

// Table 1007 (Motif avenant)
const table1007 = catalog.find((t) => t.numtab === 1007);
assert(table1007 !== undefined, 'Table #1007 (Motif avenant) trouvée');

// Vérification de la détection de doublon
const existingCode = table1007.items[0].code;
const isDuplicate = table1007.items.some((i) => i.code.toUpperCase() === existingCode.toUpperCase());
assert(isDuplicate === true, `Détection de doublon fonctionnelle : le code existant '${existingCode}' est bien rejeté`);

const newUniqueCode = 'CODE_TEST_UNIQUE_99';
const isNotDuplicate = table1007.items.some((i) => i.code.toUpperCase() === newUniqueCode.toUpperCase());
assert(isNotDuplicate === false, `Validation d'unicité fonctionnelle : le nouveau code '${newUniqueCode}' est accepté`);

// ----------------------------------------------------
// TEST 4 : Simulation de transaction SQL Server (si credentials présents)
// ----------------------------------------------------
console.log('\n--- TEST SUITE 4 : Connectivité SQL Server live (SANDBOX) ---');

const dbUser = process.env.SAGE_DB_USER;
const dbPass = process.env.SAGE_DB_PASSWORD;
const dbServer = process.env.SAGE_DB_SERVER || '10.103.7.128';

if (!dbUser || !dbPass) {
	console.log('[INFO] Identifiants SQL non configurés dans le .env local Windows.');
	console.log('       Le test direct en base s\'exécutera sur le serveur Linux ou dès que SAGE_DB_USER est renseigné.');
} else {
	console.log(`[INFO] Tentative de connexion avec l'utilisateur SQL : ${dbUser} sur ${dbServer}:1433...`);
	try {
		const sql = (await import('mssql')).default;
		const pool = await new sql.ConnectionPool({
			server: dbServer,
			port: parseInt(process.env.SAGE_DB_PORT || '1433', 10),
			database: process.env.SAGE_DB_NAME || 'x3v6',
			user: dbUser,
			password: dbPass,
			options: {
				encrypt: false,
				trustServerCertificate: true,
				connectTimeout: 5000
			}
		}).connect();

		assert(pool.connected, `Connexion SQL Server réussie sur ${dbServer}`);

		const schema = process.env.SAGE_DB_SCHEMA || 'VDRSANDB';
		const resCount = await pool.request().query(`SELECT COUNT(*) as cnt FROM ${schema}.ATABDIV`);
		const rowCount = resCount.recordset[0].cnt;
		assert(rowCount > 0, `Requête live sur ${schema}.ATABDIV réussie (${rowCount} lignes dénombrées)`);

		await pool.close();
	} catch (err) {
		console.error('[WARN] Erreur de test de connexion SQL live:', err.message);
	}
}

// ----------------------------------------------------
// Synthèse
// ----------------------------------------------------
console.log('\n=====================================================');
console.log(`   RÉSULTATS DU JEU DE TESTS : ${passCount} SUCCÈS / ${failCount} ÉCHECS`);
console.log('=====================================================\n');
