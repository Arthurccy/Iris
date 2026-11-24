import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({
			authenticated: false,
			user: null,
			permissions: locals.permissions
		});
	}

	return json({
		authenticated: true,
		user: {
			sAMAccountName: locals.user.sAMAccountName,
			displayName: locals.user.displayName,
			mail: locals.user.mail,
			department: locals.user.department,
			title: locals.user.title,
			isAdmin: locals.user.isAdmin
		},
		permissions: locals.permissions
	});
};
