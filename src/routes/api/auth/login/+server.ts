import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authenticateLdap } from '$lib/server/ldap';
import { createSessionToken, SESSION_COOKIE_NAME, MAX_AGE_SECONDS } from '$lib/server/session';
import { getPermissionsForUser } from '$lib/server/permissions';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const body = await request.json();
		const { username, password } = body;

		if (!username || !password) {
			return json(
				{ success: false, error: 'Identifiant et mot de passe Windows obligatoires.' },
				{ status: 400 }
			);
		}

		const authResult = await authenticateLdap(username, password);

		if (!authResult.success || !authResult.user) {
			return json(
				{ success: false, error: authResult.error || 'Identifiant Windows ou mot de passe incorrect.' },
				{ status: 401 }
			);
		}

		const user = authResult.user;
		const permissions = getPermissionsForUser(user);
		const token = createSessionToken(user);

		// Dépôt du cookie sécurisé
		cookies.set(SESSION_COOKIE_NAME, token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: false, // En interne HTTP/HTTPS intranet
			maxAge: MAX_AGE_SECONDS
		});

		return json({
			success: true,
			user: {
				sAMAccountName: user.sAMAccountName,
				displayName: user.displayName,
				mail: user.mail,
				department: user.department,
				title: user.title,
				isAdmin: user.isAdmin
			},
			permissions
		});
	} catch (err: any) {
		console.error('[LOGIN API ERROR]', err);
		return json(
			{ success: false, error: 'Erreur interne lors de la tentative de connexion.' },
			{ status: 500 }
		);
	}
};
