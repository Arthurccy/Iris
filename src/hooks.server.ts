import type { Handle } from '@sveltejs/kit';
import { verifySessionToken, SESSION_COOKIE_NAME } from '$lib/server/session';
import { getPermissionsForUser } from '$lib/server/permissions';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(SESSION_COOKIE_NAME);
	const user = verifySessionToken(sessionToken);

	event.locals.user = user;
	event.locals.permissions = getPermissionsForUser(user);

	return resolve(event);
};
