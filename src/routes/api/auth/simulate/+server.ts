import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const VALID_ROLES = ['AQ', 'PESEE', 'MAGASIN', 'ACHATS', 'FINANCE', 'READONLY', 'RESET'];

export const POST: RequestHandler = async ({ request, locals, cookies }) => {
	const realUser = locals.realUser || locals.user;
	if (!realUser) {
		return json({ error: 'Connexion Windows requise pour tester les profils.' }, { status: 401 });
	}

	const isRealAdmin = Boolean(
		realUser.isAdmin ||
			['frvdr_it', 'frvdr_support-informatique', 'frvdr_app_mnc_serviceadmins'].some((g) =>
				(realUser.groups || []).map((x) => x.toLowerCase()).includes(g)
			)
	);

	if (!isRealAdmin) {
		return json(
			{ error: 'Seuls les administrateurs IT sont autorisés à simuler des profils métiers.' },
			{ status: 403 }
		);
	}

	const body = await request.json();
	const { role } = body;

	if (!VALID_ROLES.includes(role)) {
		return json({ error: 'Rôle de simulation non reconnu.' }, { status: 400 });
	}

	if (role === 'RESET') {
		cookies.delete('iris_simulate_role', { path: '/' });
		return json({
			success: true,
			simulatedRole: null,
			message: 'Retour au profil administrateur réel.'
		});
	}

	cookies.set('iris_simulate_role', role, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: false,
		maxAge: 60 * 60 * 4 // 4 heures
	});

	return json({
		success: true,
		simulatedRole: role,
		message: `Profil de test activé : ${role}`
	});
};
