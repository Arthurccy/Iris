import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPool, getLastDbError } from '$lib/server/db';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
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
		const cleanCode = String(code).trim().toUpperCase().slice(0, 15);
		const cleanLong = String(libelle_long).trim().slice(0, 30);
		const cleanShort = String(libelle_court || cleanLong.slice(0, 12)).trim().slice(0, 12);
		const cleanA1 = String(param_a1 || '').trim().slice(0, 10);
		const cleanN1 = param_n1 !== undefined && param_n1 !== '' ? parseFloat(param_n1) : 0;
		// Dans Sage X3, UPDUSR_0 est de type AUS (longueur stricte 5 caractères max).
		// On affecte l'identifiant applicatif IRIS (4 car.) pour éviter l'erreur SQL 8152 (String or binary data would be truncated).
		const cleanUser = 'IRIS';
		const cleanReason = String(motif || '').trim();
		const cleanRequester = String(demandeur || 'IRIS').trim();

		const schema = process.env.SAGE_DB_SCHEMA || env.SAGE_DB_SCHEMA || 'VDRSANDB';

		// Script SQL équivalent pour traçabilité ou exécution manuelle
		const sqlScript = `
-- Demande d'insertion : ${cleanRequester} | Motif : ${cleanReason || 'Non spécifié'}
-- 1. Insertion de la valeur dans la table diverse #${cleanNumtab}
INSERT INTO ${schema}.ATABDIV (NUMTAB_0, CODE_0, A1_0, N1_0, UPDDAT_0, UPDUSR_0)
VALUES (${cleanNumtab}, '${cleanCode.replace(/'/g, "''")}', '${cleanA1.replace(/'/g, "''")}', ${cleanN1}, GETDATE(), '${cleanUser}');

-- 2. Désignation longue dans le dictionnaire des textes traduits
INSERT INTO ${schema}.ATEXTRA (CODFIC_0, ZONE_0, LANGUE_0, IDENT1_0, IDENT2_0, TEXTE_0)
VALUES ('ATABDIV', 'LNGDES', 'FRA', '${cleanNumtab}', '${cleanCode.replace(/'/g, "''")}', '${cleanLong.replace(/'/g, "''")}');

-- 3. Désignation courte dans le dictionnaire des textes traduits
INSERT INTO ${schema}.ATEXTRA (CODFIC_0, ZONE_0, LANGUE_0, IDENT1_0, IDENT2_0, TEXTE_0)
VALUES ('ATABDIV', 'SHODES', 'FRA', '${cleanNumtab}', '${cleanCode.replace(/'/g, "''")}', '${cleanShort.replace(/'/g, "''")}');
`.trim();

		const activePool = await getPool();
		if (!activePool) {
			const dbErr = getLastDbError();
			return json(
				{
					error: `Échec de connexion directe SQL Server (10.103.7.128:1433 / ${schema}) : ${dbErr || 'Connexion refusée ou délai dépassé'}. Veuillez vérifier les identifiants ou transmettre votre demande par e-mail au Support 3636.`,
					canEmail: true,
					sqlScript
				},
				{ status: 503 }
			);
		}

		// Mode LIVE : Exécution directe dans la base SANDBOX
		// Vérification unicité du code
		const checkResult = await activePool.request()
			.input('numtab', cleanNumtab)
			.input('code', cleanCode)
			.query(`SELECT COUNT(*) AS cnt FROM ${schema}.ATABDIV WHERE NUMTAB_0 = @numtab AND CODE_0 = @code`);

		if (checkResult.recordset[0].cnt > 0) {
			return json(
				{ error: `Le code ${cleanCode} existe déjà dans la table diverse #${cleanNumtab}.` },
				{ status: 409 }
			);
		}

		const transaction = activePool.transaction();
		await transaction.begin();

		try {
			const req1 = transaction.request();
			req1.input('numtab', cleanNumtab);
			req1.input('code', cleanCode);
			req1.input('a1', cleanA1);
			req1.input('n1', cleanN1);
			req1.input('user', cleanUser);
			await req1.query(`
				INSERT INTO ${schema}.ATABDIV (NUMTAB_0, CODE_0, A1_0, N1_0, UPDDAT_0, UPDUSR_0)
				VALUES (@numtab, @code, @a1, @n1, GETDATE(), @user);
			`);

			const req2 = transaction.request();
			req2.input('numtabStr', String(cleanNumtab));
			req2.input('code', cleanCode);
			req2.input('longLabel', cleanLong);
			await req2.query(`
				INSERT INTO ${schema}.ATEXTRA (CODFIC_0, ZONE_0, LANGUE_0, IDENT1_0, IDENT2_0, TEXTE_0)
				VALUES ('ATABDIV', 'LNGDES', 'FRA', @numtabStr, @code, @longLabel);
			`);

			const req3 = transaction.request();
			req3.input('numtabStr', String(cleanNumtab));
			req3.input('code', cleanCode);
			req3.input('shortLabel', cleanShort);
			await req3.query(`
				INSERT INTO ${schema}.ATEXTRA (CODFIC_0, ZONE_0, LANGUE_0, IDENT1_0, IDENT2_0, TEXTE_0)
				VALUES ('ATABDIV', 'SHODES', 'FRA', @numtabStr, @code, @shortLabel);
			`);

			await transaction.commit();
			console.log(`[AUDIT GESTDU] Ajout #${cleanNumtab} [${cleanCode}] par "${cleanRequester}" - Motif: "${cleanReason}"`);

			return json({
				success: true,
				mode: 'live_db',
				message: `La valeur ${cleanCode} a été insérée avec succès en base SANDBOX !`,
				sqlScript,
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
			console.error("Erreur transaction insertion table diverse:", txErr);
			return json(
				{ error: `Erreur lors de l'insertion en base: ${(txErr as Error).message}` },
				{ status: 500 }
			);
		}
	} catch (err) {
		console.error("Erreur API ajout table diverse:", err);
		return json({ error: (err as Error).message }, { status: 500 });
	}
};
