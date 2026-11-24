import { getLiveOrCachedTables } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { isLive, tables } = await getLiveOrCachedTables();
	return {
		isLive,
		tables,
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
