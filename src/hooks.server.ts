import type { Handle } from '@sveltejs/kit';
import { verifySessionToken, SESSION_COOKIE_NAME } from '$lib/server/session';
import { getPermissionsForUser } from '$lib/server/permissions';
import type { LdapUser } from '$lib/server/ldap';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(SESSION_COOKIE_NAME);
	const realUser = verifySessionToken(sessionToken);

	event.locals.realUser = realUser;

	const simulatedRole = event.cookies.get('iris_simulate_role');

	// Vérifier si l'utilisateur réel est administrateur IT
	const isRealAdmin = Boolean(
		realUser &&
			(realUser.isAdmin ||
				(realUser.department || '').toLowerCase().includes('informatique') ||
				[
					'frvdr_it',
					'frvdr_support-informatique',
					'frvdr_app_mnc_serviceadmins',
					'frv_vdr_it_admin',
					'frv_vdr_admin_sage'
				].some((g) => (realUser.groups || []).map((x) => x.toLowerCase()).includes(g)))
	);

	if (isRealAdmin && simulatedRole && simulatedRole !== 'RESET') {
		// Construction du profil métier simulé
		const simulatedUser: LdapUser = {
			sAMAccountName: realUser.sAMAccountName,
			displayName: `${realUser.displayName} (Test ${simulatedRole})`,
			mail: realUser.mail,
			department: '',
			title: `Profil de test ${simulatedRole}`,
			groups: [],
			isAdmin: false
		};

		switch (simulatedRole) {
			case 'AQ':
				simulatedUser.department = 'Assurance Qualité';
				simulatedUser.groups = ['FRVDR_MNC_APPROBATEUR_AQ'];
				break;
			case 'PESEE':
				simulatedUser.department = 'Atelier Pesée & Fabrication';
				simulatedUser.groups = ['FRV_VDR_PESEE'];
				break;
			case 'MAGASIN':
				simulatedUser.department = 'Magasin & Gestion des stocks';
				simulatedUser.groups = ['FRV_VDR_MAGASIN'];
				break;
			case 'ACHATS':
				simulatedUser.department = 'Achats & Approvisionnements';
				simulatedUser.groups = ['FRV_VDR_ACHATS'];
				break;
			case 'FINANCE':
				simulatedUser.department = 'Comptabilité & Finance';
				simulatedUser.groups = ['FRV_VDR_FINANCE'];
				break;
			case 'READONLY':
				simulatedUser.department = 'Visiteur sans droit';
				simulatedUser.groups = [];
				break;
		}

		event.locals.user = simulatedUser;
		event.locals.permissions = getPermissionsForUser(simulatedUser);
		event.locals.simulatedRole = simulatedRole;
	} else {
		event.locals.user = realUser;
		event.locals.permissions = getPermissionsForUser(realUser);
		event.locals.simulatedRole = null;
	}

	return resolve(event);
};
