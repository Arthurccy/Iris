import { getLiveOrCachedTables } from '$lib/server/db';
import { getAuditLogs } from '$lib/server/audit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { isLive, tables } = await getLiveOrCachedTables();

	const isAdmin = Boolean(locals.permissions?.allTablesAllowed);
	const auditLogs = locals.user
		? await getAuditLogs({
				username: locals.user.sAMAccountName,
				isAdmin
			})
		: [];

	const realUser = locals.realUser || locals.user;
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

	return {
		isLive,
		tables,
		auditLogs,
		user: locals.user
			? {
					sAMAccountName: locals.user.sAMAccountName,
					displayName: locals.user.displayName,
					mail: locals.user.mail,
					department: locals.user.department,
					title: locals.user.title,
					isAdmin: locals.user.isAdmin
				}
			: null,
		permissions: locals.permissions,
		isRealAdmin,
		simulatedRole: locals.simulatedRole || null
	};
};
