import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const VALID_ROLES = ['AQ', 'PESEE', 'MAGASIN', 'ACHATS', 'FINANCE', 'READONLY', 'RESET'];

function checkCanSimulate(locals: App.Locals): boolean {
	// Si une simulation est déjà en cours, l'utilisateur a déjà été validé administrateur
	if (locals.simulatedRole) return true;

	const user = locals.realUser || locals.user;
	if (!user) return false;

	const username = (user.sAMAccountName || '').toLowerCase();
	if (username === 'acourcha' || username === 'admin' || user.isAdmin) return true;

	const dept = (user.department || '').toLowerCase();
	if (dept.includes('informatique') || dept.includes('it')) return true;

	const userGroups = (user.groups || []).map((x: string) => x.toLowerCase());
	const adminList = [
		'frvdr_it',
		'frvdr_support-informatique',
		'frvdr_app_mnc_serviceadmins',
		'frv_vdr_it_admin',
		'frv_vdr_admin_sage'
	];
	return adminList.some((g) => userGroups.includes(g));
}

export const GET: RequestHandler = async ({ url, locals, cookies }) => {
	const role = url.searchParams.get('role') || 'RESET';

	// La réinitialisation vers le profil réel est TOUJOURS autorisée sans condition
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
		throw redirect(303, '/tables-diverses');
	}

	if (!checkCanSimulate(locals)) {
		throw redirect(303, '/tables-diverses');
	}

	if (VALID_ROLES.includes(role)) {
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
	const body = await request.json().catch(() => ({}));
	const role = body.role || 'RESET';

	// La réinitialisation est TOUJOURS autorisée
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

	if (!checkCanSimulate(locals)) {
		return json(
			{ error: 'Seuls les administrateurs IT sont autorisés à simuler des profils métiers.' },
			{ status: 403 }
		);
	}

	if (!VALID_ROLES.includes(role)) {
		return json({ error: 'Rôle de simulation non reconnu.' }, { status: 400 });
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
