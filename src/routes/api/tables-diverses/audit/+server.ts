import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuditLogs } from '$lib/server/audit';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		return json({ error: 'Connexion Windows requise pour consulter la traçabilité.' }, { status: 401 });
	}

	const numtabParam = url.searchParams.get('numtab');
	const numtab = numtabParam ? parseInt(numtabParam, 10) : undefined;

	const isAdmin = Boolean(locals.permissions?.allTablesAllowed);
	const logs = await getAuditLogs({
		username: locals.user.sAMAccountName,
		isAdmin,
		numtab
	});

	return json({
		success: true,
		isAdmin,
		total: logs.length,
		logs
	});
};
