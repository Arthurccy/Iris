import 'dotenv/config';
import ldap from 'ldapjs';

async function testLdap() {
	console.log('=====================================================');
	console.log('  TEST DE CONNEXION ACTIVE DIRECTORY / LDAP - IRIS');
	console.log('=====================================================\n');

	const host = process.env.LDAP_HOST;
	const domain = process.env.LDAP_DOMAIN || 'fareva.priv';
	const searchBase = process.env.LDAP_SEARCH_BASE;
	const serviceBind = process.env.LDAP_SERVICE_BIND;
	const servicePass = process.env.LDAP_SERVICE_PASS;
	const adminGroup = process.env.LDAP_ADMIN_GROUP;

	const targetUser = process.argv[2] || 'acourcha';

	console.log('[1] Paramètres de configuration détectés :');
	console.log(`    - LDAP_HOST        : ${host || '(NON DEFINI)'}`);
	console.log(`    - LDAP_DOMAIN      : ${domain}`);
	console.log(`    - LDAP_SEARCH_BASE : ${searchBase || '(NON DEFINI)'}`);
	console.log(`    - LDAP_SERVICE_BIND: ${serviceBind ? serviceBind.replace(/./g, (c, i) => i < 4 ? c : '*') : '(NON DEFINI)'}`);
	console.log(`    - LDAP_ADMIN_GROUP : ${adminGroup || '(NON DEFINI)'}`);
	console.log(`    - Utilisateur cible : ${targetUser}\n`);

	if (!host || !searchBase || !serviceBind || !servicePass) {
		console.error('[ERREUR] Des variables LDAP sont manquantes dans le fichier .env.');
		console.error('Veuillez vérifier LDAP_HOST, LDAP_SEARCH_BASE, LDAP_SERVICE_BIND et LDAP_SERVICE_PASS.');
		process.exit(1);
	}

	console.log('[2] Initialisation du client LDAP...');
	const client = ldap.createClient({
		url: host,
		timeout: 10000,
		connectTimeout: 10000,
		reconnect: false,
		tlsOptions: { rejectUnauthorized: false }
	});

	client.on('error', (err) => {
		console.error('[ERREUR CLIENT LDAP]', err.message);
	});

	// Étape 1 : Authentification du compte de service (Service Bind)
	console.log('[3] Authentification du compte de service (Bind)...');
	try {
		await new Promise((resolve, reject) => {
			client.bind(serviceBind, servicePass, (err) => {
				if (err) return reject(err);
				resolve(true);
			});
		});
		console.log('    -> Authentification du compte de service réussie !');
	} catch (err) {
		console.error('[ECHEC BIND SERVICE]', err.message);
		console.error('Détails : Vérifiez LDAP_SERVICE_BIND et LDAP_SERVICE_PASS.');
		client.unbind();
		process.exit(1);
	}

	// Étape 2 : Recherche de l'utilisateur cible
	console.log(`\n[4] Recherche de l'utilisateur "${targetUser}" dans ${searchBase}...`);
	const searchFilter = `(|(sAMAccountName=${targetUser})(mail=${targetUser}))`;

	try {
		const searchResults = await new Promise((resolve, reject) => {
			const entries = [];
			client.search(
				searchBase,
				{
					filter: searchFilter,
					scope: 'sub',
					attributes: [
						'dn',
						'sAMAccountName',
						'displayName',
						'mail',
						'department',
						'title',
						'memberOf',
						'userPrincipalName'
					]
				},
				(err, res) => {
					if (err) return reject(err);

					res.on('searchEntry', (entry) => {
						const raw = entry.pojo || entry;
						const attrMap = {};
						if (raw.attributes) {
							for (const attr of raw.attributes) {
								attrMap[attr.type] = attr.values && attr.values.length === 1 ? attr.values[0] : attr.values;
							}
						}
						entries.push({
							dn: entry.dn?.toString() || raw.objectName,
							...attrMap
						});
					});

					res.on('error', (searchErr) => {
						reject(searchErr);
					});

					res.on('end', (result) => {
						if (result.status !== 0) {
							return reject(new Error(`Recherche terminée avec code statut : ${result.status}`));
						}
						resolve(entries);
					});
				}
			);
		});

		if (searchResults.length === 0) {
			console.warn(`[AVERTISSEMENT] Aucun compte trouvé pour "${targetUser}".`);
			console.warn(`Filtre utilisé : ${searchFilter}`);
		} else {
			const user = searchResults[0];
			console.log(`    -> Utilisateur trouvé : ${user.displayName || user.sAMAccountName}`);
			console.log('    -------------------------------------------------');
			console.log(`    - DN               : ${user.dn}`);
			console.log(`    - sAMAccountName   : ${user.sAMAccountName}`);
			console.log(`    - Nom affiché      : ${user.displayName}`);
			console.log(`    - Email            : ${user.mail || '(Aucun)'}`);
			console.log(`    - Département      : ${user.department || '(Non renseigné)'}`);
			console.log(`    - Fonction/Titre   : ${user.title || '(Non renseigné)'}`);

			// Analyse des groupes AD
			let groups = [];
			if (user.memberOf) {
				const rawGroups = Array.isArray(user.memberOf) ? user.memberOf : [user.memberOf];
				groups = rawGroups.map((g) => {
					const match = g.match(/^CN=([^,]+)/i);
					return match ? match[1] : g;
				});
			}

			console.log(`    - Groupes AD (${groups.length}) :`);
			groups.slice(0, 15).forEach((g) => console.log(`        * ${g}`));
			if (groups.length > 15) {
				console.log(`        ... et ${groups.length - 15} autres groupes`);
			}

			// Vérification du statut Admin
			const isAdminFromEnv = adminGroup && groups.some((g) => g.toLowerCase() === adminGroup.toLowerCase());
			const isITAdmin = groups.some((g) => ['frvdr_it', 'frvdr_support-informatique'].includes(g.toLowerCase()));
			const isAdmin = isAdminFromEnv || isITAdmin;
			console.log('    -------------------------------------------------');
			console.log(`    - Statut Administrateur IRIS : ${isAdmin ? 'OUI (' + (isAdminFromEnv ? 'Groupe ' + adminGroup : 'Groupe IT') + ')' : 'NON'}`);
		}
	} catch (err) {
		console.error('[ECHEC RECHERCHE UTILISATEUR]', err.message);
	} finally {
		client.unbind();
		console.log('\n=====================================================');
		console.log('  TEST TERMINE');
		console.log('=====================================================');
	}
}

testLdap();
