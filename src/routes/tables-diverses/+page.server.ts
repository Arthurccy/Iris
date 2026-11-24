import { getLiveOrCachedTables } from '$lib/server/db';
import { getAuditLogs } from '$lib/server/audit';
import type { MiscTableDefinition } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Sans authentification Windows, aucune donnée ni table n'est exposée
	if (!locals.user) {
		return {
			isLive: false,
			tables: [] as MiscTableDefinition[],
			auditLogs: [],
			user: null,
			permissions: locals.permissions,
			isRealAdmin: false,
			simulatedRole: null
		};
	}

	const isAdmin = Boolean(locals.permissions?.allTablesAllowed);
	const allowedTables = locals.permissions?.allowedTables || [];
	const hasAnyTableAccess = isAdmin || allowedTables.length > 0;

	// Un visiteur authentifié sans aucun droit ne voit aucune table
	let isLive = false;
	let visibleTables: MiscTableDefinition[] = [];

	if (hasAnyTableAccess) {
		const dbRes = await getLiveOrCachedTables();
		isLive = dbRes.isLive;
		visibleTables = isAdmin
			? dbRes.tables
			: dbRes.tables.filter((t) => allowedTables.includes(t.numtab));
	}

	const auditLogs = hasAnyTableAccess
		? await getAuditLogs({
				username: locals.user.sAMAccountName,
				isAdmin
			})
		: [];

	const realUser = locals.realUser || locals.user;
	const isRealAdmin = Boolean(
		locals.simulatedRole ||
			(realUser &&
				((realUser.sAMAccountName || '').toLowerCase() === 'acourcha' ||
					(realUser.sAMAccountName || '').toLowerCase() === 'admin' ||
					realUser.isAdmin ||
					(realUser.department || '').toLowerCase().includes('informatique') ||
					(realUser.department || '').toLowerCase().includes('it') ||
					[
						'frvdr_it',
						'frvdr_support-informatique',
						'frvdr_app_mnc_serviceadmins',
						'frv_vdr_it_admin',
						'frv_vdr_admin_sage'
					].some((g) => (realUser.groups || []).map((x) => x.toLowerCase()).includes(g))))
	);

	return {
		isLive,
		tables: visibleTables,
		auditLogs,
		user: {
			sAMAccountName: locals.user.sAMAccountName,
			displayName: locals.user.displayName,
			mail: locals.user.mail,
			department: locals.user.department,
			title: locals.user.title,
			isAdmin: locals.user.isAdmin
		},
		permissions: locals.permissions,
		isRealAdmin,
		simulatedRole: locals.simulatedRole || null
	};
};
