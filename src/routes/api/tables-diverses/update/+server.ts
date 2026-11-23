import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPool } from '$lib/server/db';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { numtab, code, libelle_long, libelle_court, param_a1, param_n1 } = body;

		if (!numtab || !code || !libelle_long) {
			return json(
				{ error: 'Les champs numtab, code et libelle_long sont obligatoires.' },
				{ status: 400 }
			);
		}

		const cleanNumtab = parseInt(String(numtab), 10);
		const cleanCode = String(code).trim().toUpperCase();
		const cleanLong = String(libelle_long).trim();
		const cleanShort = String(libelle_court || cleanLong.slice(0, 15)).trim();
		const cleanA1 = String(param_a1 || '').trim();
		const cleanN1 = param_n1 !== undefined && param_n1 !== '' ? parseFloat(param_n1) : 0;

		const schema = process.env.SAGE_DB_SCHEMA || env.SAGE_DB_SCHEMA || 'VDRSANDB';

		const activePool = await getPool();
		if (!activePool) {
			return json({
				success: true,
				mode: 'script_only',
				message: `Modifications enregistrées localement (la base SANDBOX n'est pas connectée en direct).`,
				item: {
					code: cleanCode,
					shortLabel: cleanShort,
					label: cleanLong,
					param_a1: cleanA1,
					param_n1: String(cleanN1)
				}
			});
		}

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
			await req1.query(`
				UPDATE ${schema}.ATABDIV
				SET A1_0 = @a1, N1_0 = @n1, UPDDAT_0 = GETDATE(), UPDUSR_0 = 'IRIS'
				WHERE NUMTAB_0 = @numtab AND CODE_0 = @code;
			`);

			// 2. Mise à jour ou insertion du libellé long dans ATEXTRA
			const req2 = transaction.request();
			req2.input('numtabStr', String(cleanNumtab));
			req2.input('code', cleanCode);
			req2.input('longLabel', cleanLong);
			await req2.query(`
				IF EXISTS (
					SELECT 1 FROM ${schema}.ATEXTRA 
					WHERE CODFIC_0 = 'ATABDIV' AND ZONE_0 = 'LNGDES' AND LANGUE_0 = 'FRA'
					  AND IDENT1_0 = @numtabStr AND IDENT2_0 = @code
				)
				BEGIN
					UPDATE ${schema}.ATEXTRA
					SET TEXTE_0 = @longLabel
					WHERE CODFIC_0 = 'ATABDIV' AND ZONE_0 = 'LNGDES' AND LANGUE_0 = 'FRA'
					  AND IDENT1_0 = @numtabStr AND IDENT2_0 = @code;
				END
				ELSE
				BEGIN
					INSERT INTO ${schema}.ATEXTRA (CODFIC_0, ZONE_0, LANGUE_0, IDENT1_0, IDENT2_0, TEXTE_0)
					VALUES ('ATABDIV', 'LNGDES', 'FRA', @numtabStr, @code, @longLabel);
				END
			`);

			// 3. Mise à jour ou insertion du libellé court dans ATEXTRA
			const req3 = transaction.request();
			req3.input('numtabStr', String(cleanNumtab));
			req3.input('code', cleanCode);
			req3.input('shortLabel', cleanShort);
			await req3.query(`
				IF EXISTS (
					SELECT 1 FROM ${schema}.ATEXTRA 
					WHERE CODFIC_0 = 'ATABDIV' AND ZONE_0 = 'SHODES' AND LANGUE_0 = 'FRA'
					  AND IDENT1_0 = @numtabStr AND IDENT2_0 = @code
				)
				BEGIN
					UPDATE ${schema}.ATEXTRA
					SET TEXTE_0 = @shortLabel
					WHERE CODFIC_0 = 'ATABDIV' AND ZONE_0 = 'SHODES' AND LANGUE_0 = 'FRA'
					  AND IDENT1_0 = @numtabStr AND IDENT2_0 = @code;
				END
				ELSE
				BEGIN
					INSERT INTO ${schema}.ATEXTRA (CODFIC_0, ZONE_0, LANGUE_0, IDENT1_0, IDENT2_0, TEXTE_0)
					VALUES ('ATABDIV', 'SHODES', 'FRA', @numtabStr, @code, @shortLabel);
				END
			`);

			await transaction.commit();

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
