import ldap from 'ldapjs';

export interface LdapUser {
	sAMAccountName: string;
	displayName: string;
	mail: string;
	department: string;
	title: string;
	groups: string[];
	isAdmin: boolean;
}

export interface AuthResult {
	success: boolean;
	user?: LdapUser;
	error?: string;
}

function getLdapConfig() {
	return {
		url: process.env.LDAP_HOST || '',
		domain: process.env.LDAP_DOMAIN || 'fareva.priv',
		searchBase: process.env.LDAP_SEARCH_BASE || '',
		serviceBind: process.env.LDAP_SERVICE_BIND || '',
		servicePass: process.env.LDAP_SERVICE_PASS || '',
		adminGroup: (process.env.LDAP_ADMIN_GROUP || '').toLowerCase(),
		authMode: process.env.AUTH_MODE || 'local'
	};
}

export function isLdapEnabled(): boolean {
	const cfg = getLdapConfig();
	return cfg.authMode === 'ldap' && Boolean(cfg.url && cfg.searchBase && cfg.serviceBind && cfg.servicePass);
}

function createClient(url: string) {
	return ldap.createClient({
		url,
		timeout: 8000,
		connectTimeout: 8000,
		reconnect: false,
		tlsOptions: { rejectUnauthorized: false }
	});
}

/**
 * Recherche un utilisateur dans l'Active Directory via le compte de service.
 */
export async function findLdapUser(identifier: string): Promise<{ dn: string; user: LdapUser } | null> {
	const cfg = getLdapConfig();
	if (!cfg.url || !cfg.searchBase) return null;

	const client = createClient(cfg.url);

	try {
		// Bind du compte de service
		await new Promise<void>((resolve, reject) => {
			client.bind(cfg.serviceBind, cfg.servicePass, (err) => {
				if (err) return reject(err);
				resolve();
			});
		});

		// Nettoyage de l'identifiant pour la recherche
		const cleanId = identifier.trim().replace(/[()\\*]/g, '');
		const filter = `(|(sAMAccountName=${cleanId})(mail=${cleanId}))`;

		const searchResult = await new Promise<any[]>((resolve, reject) => {
			const entries: any[] = [];
			client.search(
				cfg.searchBase,
				{
					filter,
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
						const raw = (entry as any).pojo || entry;
						const attrMap: Record<string, any> = {};
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

					res.on('error', (searchErr) => reject(searchErr));
					res.on('end', (result) => {
						if (result.status !== 0) {
							return reject(new Error(`LDAP status ${result.status}`));
						}
						resolve(entries);
					});
				}
			);
		});

		if (searchResult.length === 0) {
			return null;
		}

		const rawUser = searchResult[0];

		// Parsing des groupes AD
		let groups: string[] = [];
		if (rawUser.memberOf) {
			const rawGroups = Array.isArray(rawUser.memberOf) ? rawUser.memberOf : [rawUser.memberOf];
			groups = rawGroups.map((g: string) => {
				const match = g.match(/^CN=([^,]+)/i);
				return match ? match[1] : g;
			});
		}

		const isAdmin = Boolean(
			cfg.adminGroup && groups.some((g) => g.toLowerCase() === cfg.adminGroup)
		);

		const user: LdapUser = {
			sAMAccountName: rawUser.sAMAccountName || cleanId,
			displayName: rawUser.displayName || rawUser.sAMAccountName || cleanId,
			mail: rawUser.mail || '',
			department: rawUser.department || '',
			title: rawUser.title || '',
			groups,
			isAdmin
		};

		return {
			dn: rawUser.dn,
			user
		};
	} finally {
		client.unbind();
	}
}

/**
 * Authentifie un utilisateur Active Directory avec son mot de passe Windows.
 */
export async function authenticateLdap(username: string, password: string): Promise<AuthResult> {
	if (!username || !password) {
		return { success: false, error: 'Identifiant et mot de passe obligatoires.' };
	}

	const cfg = getLdapConfig();
	if (!isLdapEnabled()) {
		return { success: false, error: "L'authentification LDAP n'est pas configurée sur ce serveur." };
	}

	try {
		// 1. Trouver le compte dans l'AD
		const found = await findLdapUser(username);
		if (!found) {
			return { success: false, error: 'Identifiant Windows ou mot de passe incorrect.' };
		}

		// 2. Tester le bind avec le mot de passe utilisateur
		const userClient = createClient(cfg.url);
		try {
			await new Promise<void>((resolve, reject) => {
				userClient.bind(found.dn, password, (err) => {
					if (err) return reject(err);
					resolve();
				});
			});
		} catch (bindErr: any) {
			return { success: false, error: 'Identifiant Windows ou mot de passe incorrect.' };
		} finally {
			userClient.unbind();
		}

		return {
			success: true,
			user: found.user
		};
	} catch (err: any) {
		console.error('[LDAP AUTH ERROR]', err.message);
		return {
			success: false,
			error: 'Erreur de communication avec le serveur Active Directory.'
		};
	}
}
