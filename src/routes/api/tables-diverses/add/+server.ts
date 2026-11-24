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
					error: `Accès refusé : vous devez être authentifié avec un compte Windows habilité pour ajouter des valeurs dans la table diverse #${cleanNumtab}.`
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

		// Script SQL équivalent pour traçabilité ou exécution manuelle
		const sqlScript = `
-- Demande d'insertion : ${cleanRequester} | Motif : ${cleanReason || 'Non spécifié'}
-- 1. Insertion de la valeur dans la table diverse #${cleanNumtab} (avec valeurs par défaut Sage X3 pour toutes colonnes NOT NULL)
INSERT INTO ${schema}.ATABDIV (NUMTAB_0, CODE_0, A1_0, A2_0, N1_0, N2_0, DEFVAL_0, SOC_0, CREDAT_0, CREUSR_0, UPDDAT_0, UPDUSR_0)
VALUES (${cleanNumtab}, '${cleanCode.replace(/'/g, "''")}', '${cleanA1.replace(/'/g, "''")}', '', ${cleanN1}, 0, 0, '', GETDATE(), '${cleanUser}', GETDATE(), '${cleanUser}');

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

		// Récupération dynamique des métadonnées de colonnes pour respecter strictement le schéma NOT NULL de Sage X3
		const atabdivCols = await getTableColumns(activePool, schema, 'ATABDIV');
		const atextraCols = await getTableColumns(activePool, schema, 'ATEXTRA');
		console.log(`[SCHEMA ATABDIV] ${atabdivCols.length} colonnes détectées:`, atabdivCols.map((c) => c.name).join(', '));

		const transaction = activePool.transaction();
		await transaction.begin();

		try {
			// 1. Insertion sécurisée dans ATABDIV
			const atabdivInsert = buildSafeInsert(schema, 'ATABDIV', atabdivCols, {
				NUMTAB_0: cleanNumtab,
				CODE_0: cleanCode,
				A1_0: cleanA1,
				A2_0: '',
				N1_0: cleanN1,
				N2_0: 0,
				DEFVAL_0: 0,
				SOC_0: '',
				CREDAT_0: new Date(),
				CREUSR_0: cleanUser,
				UPDDAT_0: new Date(),
				UPDUSR_0: cleanUser
			});

			const req1 = transaction.request();
			for (const [k, v] of Object.entries(atabdivInsert.params)) {
				req1.input(k, v);
			}
			await req1.query(atabdivInsert.query);

			// 2. Insertion sécurisée dans ATEXTRA (LNGDES)
			const atextraLongInsert = buildSafeInsert(schema, 'ATEXTRA', atextraCols, {
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

			const req2 = transaction.request();
			for (const [k, v] of Object.entries(atextraLongInsert.params)) {
				req2.input(k, v);
			}
			await req2.query(atextraLongInsert.query);

			// 3. Insertion sécurisée dans ATEXTRA (SHODES)
			const atextraShortInsert = buildSafeInsert(schema, 'ATEXTRA', atextraCols, {
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

			const req3 = transaction.request();
			for (const [k, v] of Object.entries(atextraShortInsert.params)) {
				req3.input(k, v);
			}
			await req3.query(atextraShortInsert.query);

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

