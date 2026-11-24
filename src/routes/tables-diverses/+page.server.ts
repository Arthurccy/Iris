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
		permissions: locals.permissions
	};
};
