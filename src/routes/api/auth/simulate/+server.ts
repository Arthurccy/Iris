import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const VALID_ROLES = ['AQ', 'PESEE', 'MAGASIN', 'ACHATS', 'FINANCE', 'READONLY', 'RESET'];

function checkIsAdmin(user: any): boolean {
	if (!user) return false;
	if (user.isAdmin) return true;
	const userGroups = (user.groups || []).map((x: string) => x.toLowerCase());
	const adminList = [
		'frvdr_it',
		'frvdr_support-informatique',
		'frvdr_app_mnc_serviceadmins',
		'frv_vdr_it_admin',
		'frv_vdr_admin_sage'
	];
	const hasAdminGroup = adminList.some((g) => userGroups.includes(g));
	const hasAdminDept = (user.department || '').toLowerCase().includes('informatique');
	return hasAdminGroup || hasAdminDept;
}

export const GET: RequestHandler = async ({ url, locals, cookies }) => {
	const realUser = locals.realUser || locals.user;
	if (!realUser || !checkIsAdmin(realUser)) {
		throw redirect(303, '/tables-diverses');
	}

	const role = url.searchParams.get('role') || 'RESET';
	if (!VALID_ROLES.includes(role)) {
		throw redirect(303, '/tables-diverses');
	}

	if (role === 'RESET') {
		cookies.set('iris_simulate_role', '', {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: false,
			maxAge: 0,
			expires: new Date(0)
		});
		cookies.delete('iris_simulate_role', { path: '/' });
	} else {
		cookies.set('iris_simulate_role', role, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: false,
			maxAge: 60 * 60 * 4 // 4 heures
		});
	}

	throw redirect(303, '/tables-diverses');
};

export const POST: RequestHandler = async ({ request, locals, cookies }) => {
	const realUser = locals.realUser || locals.user;
	if (!realUser) {
		return json({ error: 'Connexion Windows requise pour tester les profils.' }, { status: 401 });
	}

	if (!checkIsAdmin(realUser)) {
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
		cookies.set('iris_simulate_role', '', {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: false,
			maxAge: 0,
			expires: new Date(0)
		});
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
