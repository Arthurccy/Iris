import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPool, getLastDbError, getTableColumns, buildSafeInsert } from '$lib/server/db';
import { canUserEditTable } from '$lib/server/permissions';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const body = await request.json();
		const { numtab, code, libelle_long, libelle_court, param_a1, param_n1, demandeur, motif } = body;

		if (!numtab || !code || !libelle_long) {
			return json(
				{ error: 'Les champs numtab, code et libelle_long sont obligatoires.' },
				{ status: 400 }
			);
		}

		const cleanNumtab = parseInt(String(numtab), 10);

		// Contrôle d'habilitation RBAC / Active Directory
		const isAuthLdap = process.env.AUTH_MODE === 'ldap';
		if (isAuthLdap && !canUserEditTable(locals.user, cleanNumtab)) {
			return json(
				{
					error: `Accès refusé : vous devez être authentifié avec un compte Windows habilité pour modifier la table diverse #${cleanNumtab}.`
				},
				{ status: 403 }
			);
		}

		const cleanCode = String(code).trim().toUpperCase().slice(0, 15);
		const cleanLong = String(libelle_long).trim().slice(0, 30);
		const cleanShort = String(libelle_court || cleanLong.slice(0, 12)).trim().slice(0, 12);
		const cleanA1 = String(param_a1 || '').trim().slice(0, 10);
		const cleanN1 = param_n1 !== undefined && param_n1 !== '' ? parseFloat(param_n1) : 0;
		// Dans Sage X3, UPDUSR_0 est de type AUS (longueur stricte 5 caractères max).
		// On affecte l'identifiant applicatif IRIS (4 car.) pour éviter l'erreur SQL 8152 (String or binary data would be truncated).
		const cleanUser = 'IRIS';
		const cleanReason = String(motif || '').trim();
		const cleanRequester = locals.user
			? `${locals.user.displayName} (${locals.user.department || locals.user.mail || locals.user.sAMAccountName})`
			: String(demandeur || 'IRIS').trim();

		const schema = process.env.SAGE_DB_SCHEMA || env.SAGE_DB_SCHEMA || 'VDRSANDB';

		const activePool = await getPool();
		if (!activePool) {
			const dbErr = getLastDbError();
			return json(
				{
					error: `Échec de connexion directe SQL Server (10.103.7.128:1433 / ${schema}) : ${dbErr || 'Connexion refusée ou délai dépassé'}. Veuillez vérifier les identifiants ou transmettre votre demande par e-mail au Support 3636.`,
					canEmail: true
				},
				{ status: 503 }
			);
		}

		// Récupération dynamique des métadonnées de colonnes pour ATEXTRA en cas d'insertion
		const atextraCols = await getTableColumns(activePool, schema, 'ATEXTRA');

		// Mode LIVE : Exécution directe dans la base SANDBOX
		const transaction = activePool.transaction();
		await transaction.begin();

		try {
			// 1. Mise à jour de ATABDIV
			const req1 = transaction.request();
			req1.input('numtab', cleanNumtab);
			req1.input('code', cleanCode);
			req1.input('a1', cleanA1);
			req1.input('n1', cleanN1);
			req1.input('user', cleanUser);
			await req1.query(`
				UPDATE ${schema}.ATABDIV
				SET A1_0 = @a1, N1_0 = @n1, UPDDAT_0 = GETDATE(), UPDUSR_0 = @user
				WHERE NUMTAB_0 = @numtab AND CODE_0 = @code;
			`);

			// 2. Mise à jour ou insertion du libellé long dans ATEXTRA
			const checkLong = await transaction.request()
				.input('numtabStr', String(cleanNumtab))
				.input('code', cleanCode)
				.query(`
					SELECT COUNT(*) AS cnt FROM ${schema}.ATEXTRA 
					WHERE CODFIC_0 = 'ATABDIV' AND ZONE_0 = 'LNGDES' AND LANGUE_0 = 'FRA'
					  AND IDENT1_0 = @numtabStr AND IDENT2_0 = @code
				`);

			if (checkLong.recordset[0].cnt > 0) {
				const reqLongUpdate = transaction.request();
				reqLongUpdate.input('numtabStr', String(cleanNumtab));
				reqLongUpdate.input('code', cleanCode);
				reqLongUpdate.input('longLabel', cleanLong);
				await reqLongUpdate.query(`
					UPDATE ${schema}.ATEXTRA
					SET TEXTE_0 = @longLabel, UPDDAT_0 = GETDATE()
					WHERE CODFIC_0 = 'ATABDIV' AND ZONE_0 = 'LNGDES' AND LANGUE_0 = 'FRA'
					  AND IDENT1_0 = @numtabStr AND IDENT2_0 = @code;
				`);
			} else {
				const insertLong = buildSafeInsert(schema, 'ATEXTRA', atextraCols, {
					CODFIC_0: 'ATABDIV',
					ZONE_0: 'LNGDES',
					LANGUE_0: 'FRA',
					IDENT1_0: String(cleanNumtab),
					IDENT2_0: cleanCode,
					TEXTE_0: cleanLong,
					CREDAT_0: new Date(),
					CREUSR_0: cleanUser,
					UPDDAT_0: new Date(),
					UPDUSR_0: cleanUser
				});
				const reqLongInsert = transaction.request();
				for (const [k, v] of Object.entries(insertLong.params)) {
					reqLongInsert.input(k, v);
				}
				await reqLongInsert.query(insertLong.query);
			}

			// 3. Mise à jour ou insertion du libellé court dans ATEXTRA
			const checkShort = await transaction.request()
				.input('numtabStr', String(cleanNumtab))
				.input('code', cleanCode)
				.query(`
					SELECT COUNT(*) AS cnt FROM ${schema}.ATEXTRA 
					WHERE CODFIC_0 = 'ATABDIV' AND ZONE_0 = 'SHODES' AND LANGUE_0 = 'FRA'
					  AND IDENT1_0 = @numtabStr AND IDENT2_0 = @code
				`);

			if (checkShort.recordset[0].cnt > 0) {
				const reqShortUpdate = transaction.request();
				reqShortUpdate.input('numtabStr', String(cleanNumtab));
				reqShortUpdate.input('code', cleanCode);
				reqShortUpdate.input('shortLabel', cleanShort);
				await reqShortUpdate.query(`
					UPDATE ${schema}.ATEXTRA
					SET TEXTE_0 = @shortLabel, UPDDAT_0 = GETDATE()
					WHERE CODFIC_0 = 'ATABDIV' AND ZONE_0 = 'SHODES' AND LANGUE_0 = 'FRA'
					  AND IDENT1_0 = @numtabStr AND IDENT2_0 = @code;
				`);
			} else {
				const insertShort = buildSafeInsert(schema, 'ATEXTRA', atextraCols, {
					CODFIC_0: 'ATABDIV',
					ZONE_0: 'SHODES',
					LANGUE_0: 'FRA',
					IDENT1_0: String(cleanNumtab),
					IDENT2_0: cleanCode,
					TEXTE_0: cleanShort,
					CREDAT_0: new Date(),
					CREUSR_0: cleanUser,
					UPDDAT_0: new Date(),
					UPDUSR_0: cleanUser
				});
				const reqShortInsert = transaction.request();
				for (const [k, v] of Object.entries(insertShort.params)) {
					reqShortInsert.input(k, v);
				}
				await reqShortInsert.query(insertShort.query);
			}

			await transaction.commit();
			console.log(`[AUDIT GESTDU] Modification #${cleanNumtab} [${cleanCode}] par "${cleanRequester}" - Motif: "${cleanReason}"`);

			return json({
				success: true,
				mode: 'live_db',
				message: `La valeur ${cleanCode} a été mise à jour avec succès dans Sage X3 !`,
				item: {
					code: cleanCode,
					shortLabel: cleanShort,
					label: cleanLong,
					param_a1: cleanA1,
					param_n1: String(cleanN1)
				}
			});
		} catch (txErr) {
			await transaction.rollback();
			console.error("Erreur transaction mise à jour table diverse:", txErr);
			return json(
				{ error: `Erreur lors de la mise à jour en base: ${(txErr as Error).message}` },
				{ status: 500 }
			);
		}
	} catch (err) {
		console.error("Erreur API modification table diverse:", err);
		return json({ error: (err as Error).message }, { status: 500 });
	}
};

