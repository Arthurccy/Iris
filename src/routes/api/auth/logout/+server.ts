import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SESSION_COOKIE_NAME } from '$lib/server/session';

export const POST: RequestHandler = async ({ cookies }) => {
	const cookieOpts = {
		path: '/',
		httpOnly: true,
		sameSite: 'lax' as const,
		secure: false
	};
	cookies.delete(SESSION_COOKIE_NAME, cookieOpts);
	cookies.delete('iris_simulate_role', cookieOpts);
	return json({ success: true, message: 'Déconnexion réussie.' });
};
