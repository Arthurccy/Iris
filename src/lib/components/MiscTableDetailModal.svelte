<script lang="ts">
	import {
		AlertCircle,
		Check,
		CheckCircle2,
		Clipboard,
		Code,
		Database,
		FileCode,
		FileText,
		Layers,
		Mail,
		Plus,
		Search,
		ShieldCheck,
		X
	} from 'lucide-svelte';
	import type { MiscTableDefinition, MiscTableItem } from '$lib/types';

	type Props = {
		table: MiscTableDefinition;
		fallbackMailTo?: string;
		isLive?: boolean;
		onClose: () => void;
	};

	let {
		table,
		fallbackMailTo = '3636.valdepharm@fareva.com',
		isLive = false,
		onClose
	}: Props = $props();

	let itemSearch = $state('');
	let isFormOpen = $state(false);

	// Form inputs
	let newCode = $state('');
	let newShortLabel = $state('');
	let newLabel = $state('');
	let newParamA1 = $state('');
	let newParamN1 = $state('');
	let newReason = $state('');
	let requesterName = $state('');

	// State indicators
	let copiedCode = $state<string | null>(null);
	let copiedSql = $state(false);
	let isSubmitting = $state(false);
	let submitResult = $state<{
		success: boolean;
		mode?: string;
		message?: string;
		sqlScript?: string;
		error?: string;
	} | null>(null);

	// Local mutable list for live addition
	let localItems = $state<MiscTableItem[]>([]);

	$effect(() => {
		localItems = [...table.items];
	});

	const filteredItems = $derived.by(() => {
		const term = itemSearch.trim().toLowerCase();
		if (!term) return localItems;
		return localItems.filter(
			(item) =>
				item.code.toLowerCase().includes(term) ||
				(item.shortLabel && item.shortLabel.toLowerCase().includes(term)) ||
				(item.label && item.label.toLowerCase().includes(term)) ||
				(item.param_a1 && item.param_a1.toLowerCase().includes(term)) ||
				(item.param_n1 && String(item.param_n1).toLowerCase().includes(term))
		);
	});

	const isCodeDuplicate = $derived.by(() => {
		const clean = newCode.trim().toUpperCase();
		if (!clean) return false;
		return localItems.some((item) => item.code.toUpperCase() === clean);
	});

	const canSubmit = $derived(
		newCode.trim().length >= 1 &&
		newLabel.trim().length >= 2 &&
		!isCodeDuplicate &&
		!isSubmitting
	);

	const generatedSql = $derived.by(() => {
		const cCode = newCode.trim().toUpperCase() || 'CODE';
		const cLong = newLabel.trim() || 'Libelle long';
		const cShort = newShortLabel.trim() || cLong.slice(0, 15);
		const cA1 = newParamA1.trim();
		const cN1 = newParamN1.trim() ? parseFloat(newParamN1.trim()) : 0;

		return [
			`-- Insertion dans la table diverse #${table.numtab} (Dossier VDRSANDB)`,
			`INSERT INTO VDRSANDB.ATABDIV (NUMTAB_0, CODE_0, A1_0, N1_0, UPDDAT_0, UPDUSR_0)`,
			`VALUES (${table.numtab}, '${cCode.replace(/'/g, "''")}', '${cA1.replace(/'/g, "''")}', ${cN1}, GETDATE(), 'IRIS');`,
			``,
			`-- Intitulé long dans le dictionnaire multilingue`,
			`INSERT INTO VDRSANDB.ATEXTRA (CODFIC_0, ZONE_0, LANGUE_0, IDENT1_0, IDENT2_0, TEXTE_0)`,
			`VALUES ('ATABDIV', 'LNGDES', 'FRA', '${table.numtab}', '${cCode.replace(/'/g, "''")}', '${cLong.replace(/'/g, "''")}');`,
			``,
			`-- Intitulé court dans le dictionnaire multilingue`,
			`INSERT INTO VDRSANDB.ATEXTRA (CODFIC_0, ZONE_0, LANGUE_0, IDENT1_0, IDENT2_0, TEXTE_0)`,
			`VALUES ('ATABDIV', 'SHODES', 'FRA', '${table.numtab}', '${cCode.replace(/'/g, "''")}', '${cShort.replace(/'/g, "''")}');`
		].join('\n');
	});

	const mailHref = $derived.by(() => {
		const subject = `[IRIS - Sage X3] Demande d'ajout table diverse #${table.numtab} : ${newCode.trim().toUpperCase()}`;
		const body = [
			'Bonjour,',
			'',
			`Dans le cadre de l'utilisation de Sage X3 sur le site de Valdepharm, je sollicite l'ajout d'une nouvelle valeur dans la table diverse suivante :`,
			`- Numéro de table : #${table.numtab}`,
			`- Intitulé : ${table.title}`,
			`- Domaine : ${table.category}`,
			'',
			'Détails de la valeur à intégrer (GESTDU / ATABDIV) :',
			`- Code (CODE_0) : ${newCode.trim().toUpperCase()}`,
			`- Libellé long (LNGDES) : ${newLabel.trim()}`,
			`- Libellé court (SHODES) : ${newShortLabel.trim() || newLabel.trim().slice(0, 15)}`,
			`- Paramètre alphanumérique A1 : ${newParamA1.trim() || '(vide)'}`,
			`- Paramètre numérique N1 : ${newParamN1.trim() || '0'}`,
			`- Motif / Justification métier : ${newReason.trim() || 'Non spécifié'}`,
			`- Demandeur : ${requesterName.trim() || 'Utilisateur métier'}`,
			'',
			'Script SQL équivalent :',
			generatedSql,
			'',
			'Merci de procéder à la validation ou à la saisie dans Sage X3.',
			'Application IRIS — Portail métier Sage X3.'
		].join('\n');

		return `mailto:${fallbackMailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
	});

	async function copyCode(code: string) {
		if (!navigator.clipboard) return;
		await navigator.clipboard.writeText(code);
		copiedCode = code;
		setTimeout(() => {
			if (copiedCode === code) copiedCode = null;
		}, 1500);
	}

	async function copySqlScript() {
		if (!navigator.clipboard) return;
		await navigator.clipboard.writeText(generatedSql);
		copiedSql = true;
		setTimeout(() => {
			copiedSql = false;
		}, 2000);
	}

	async function handleDirectSubmit(e: Event) {
		e.preventDefault();
		if (!canSubmit) return;

		isSubmitting = true;
		submitResult = null;

		try {
			const res = await fetch('/api/tables-diverses/add', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					numtab: table.numtab,
					code: newCode.trim().toUpperCase(),
					libelle_long: newLabel.trim(),
					libelle_court: newShortLabel.trim() || newLabel.trim().slice(0, 15),
					param_a1: newParamA1.trim(),
					param_n1: newParamN1.trim()
				})
			});

			const data = await res.json();
			if (!res.ok) {
				submitResult = {
					success: false,
					error: data.error || 'Erreur lors du traitement de la requête.'
				};
			} else {
				submitResult = {
					success: true,
					mode: data.mode,
					message: data.message,
					sqlScript: data.sqlScript
				};

				// Add to local table view if successful
				if (data.item) {
					localItems.unshift(data.item);
				}
			}
		} catch (err) {
			submitResult = {
				success: false,
				error: (err as Error).message
			};
		} finally {
			isSubmitting = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
	<button
		class="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
		type="button"
		aria-label="Fermer la fenêtre"
		onclick={onClose}
	></button>

	<div
		class="relative z-10 flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-200"
		role="dialog"
		aria-modal="true"
		aria-label={`Table diverse #${table.numtab}`}
		tabindex="-1"
	>
		<!-- En-tête -->
		<div class="section-divider flex items-center justify-between gap-3 px-5 py-4 bg-slate-50/80">
			<div>
				<div class="flex items-center gap-2">
					<span class="rounded bg-corporate-100 font-mono text-[11px] font-semibold text-corporate-800 px-2 py-0.5">
						Table diverse #{table.numtab}
					</span>
					<span class="rounded bg-slate-200 text-slate-700 text-[11px] font-medium px-2 py-0.5">
						{table.category}
					</span>
					{#if table.numtab >= 1000}
						<span class="rounded bg-amber-100 text-amber-800 text-[11px] font-medium px-2 py-0.5">
							Spécifique Valdepharm
						</span>
					{:else}
						<span class="rounded bg-blue-100 text-blue-800 text-[11px] font-medium px-2 py-0.5">
							Standard Sage X3
						</span>
					{/if}
				</div>
				<h2 class="mt-1 text-lg font-semibold text-slate-950">{table.title}</h2>
			</div>

			<button
				class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
				type="button"
				onclick={onClose}
			>
				<X class="size-3.5" />
				Fermer
			</button>
		</div>

		<!-- Corps défilable -->
		<div class="modal-scroll overscroll-contain overflow-y-auto p-5 space-y-5">
			<!-- Métadonnées & Description -->
			<div class="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs space-y-2">
				<div class="flex items-center justify-between text-slate-600">
					<p class="font-medium text-slate-900">
						{table.description || `Table diverse numéro ${table.numtab} gérée dans la fonction X3 GESTDU.`}
					</p>
					<span class="font-mono text-[11px] text-slate-500">
						Structure : ATABDIV / ATEXTRA
					</span>
				</div>
				<p class="text-[11px] text-slate-500">
					Les tables diverses constituent des référentiels techniques sans cycle de vie ni statut de validation dans Sage X3 v6. Les valeurs sont directement exploitées par les menus déroulants et contrôles d'écrans.
				</p>
			</div>

			<!-- Barre d'outils du tableau : recherche + bouton d'ajout -->
			<div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
				<div class="relative flex-1 max-w-sm">
					<Search class="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
					<input
						class="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs outline-none transition focus:border-corporate-500 focus:ring-1 focus:ring-corporate-200"
						type="search"
						placeholder="Filtrer par code, libellé long, court ou paramètre..."
						bind:value={itemSearch}
					/>
				</div>

				<div class="flex items-center gap-2">
					<span class="text-xs text-slate-500">
						{filteredItems.length} entrée(s)
					</span>
					<button
						type="button"
						class="inline-flex items-center gap-1.5 rounded-lg bg-corporate-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-corporate-700"
						onclick={() => (isFormOpen = !isFormOpen)}
					>
						{#if isFormOpen}
							<X class="size-3.5" />
							<span>Masquer l'outil d'ajout</span>
						{:else}
							<Plus class="size-3.5" />
							<span>Ajouter / Proposer une valeur</span>
						{/if}
					</button>
				</div>
			</div>

			<!-- Formulaire de saisie autonome & génération SQL -->
			{#if isFormOpen}
				<div class="rounded-xl border border-corporate-200 bg-corporate-50/50 p-4 transition-all space-y-4">
					<div class="flex items-center justify-between pb-2 border-b border-corporate-200/60">
						<div class="flex items-center gap-2">
							<Plus class="size-4 text-corporate-700" />
							<h3 class="text-xs font-semibold uppercase tracking-wider text-corporate-900">
								Compléter la table #{table.numtab} ({table.title})
							</h3>
						</div>
						<span class="text-[11px] text-corporate-700 font-medium">
							Saisie autonome & génération SQL X3
						</span>
					</div>

					<form onsubmit={handleDirectSubmit} class="space-y-3 text-xs">
						<div class="grid gap-3 sm:grid-cols-3">
							<div>
								<label for="newCode" class="block font-semibold text-slate-800 mb-1">
									Code X3 (CODE_0) <span class="text-rose-500">*</span>
								</label>
								<input
									id="newCode"
									type="text"
									class="w-full rounded border px-2.5 py-1.5 font-mono uppercase transition {
										isCodeDuplicate
											? 'border-rose-400 bg-rose-50 text-rose-900'
											: 'border-slate-200 bg-white text-slate-900 focus:border-corporate-500'
									}"
									placeholder="Ex: FLAC01"
									maxlength="15"
									bind:value={newCode}
								/>
								{#if isCodeDuplicate}
									<p class="mt-1 text-[11px] text-rose-600 font-medium">
										Ce code existe déjà dans cette table.
									</p>
								{:else}
									<p class="mt-1 text-[10px] text-slate-500">Max 15 caractères, sans espace.</p>
								{/if}
							</div>

							<div>
								<label for="newShortLabel" class="block font-semibold text-slate-800 mb-1">
									Libellé court (SHODES)
								</label>
								<input
									id="newShortLabel"
									type="text"
									class="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-slate-900 focus:border-corporate-500"
									placeholder="Ex: Flacon ambré"
									maxlength="15"
									bind:value={newShortLabel}
								/>
								<p class="mt-1 text-[10px] text-slate-500">Max 15 caractères (menus compacts).</p>
							</div>

							<div>
								<label for="requesterName" class="block font-semibold text-slate-800 mb-1">
									Demandeur / Service
								</label>
								<input
									id="requesterName"
									type="text"
									class="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-slate-900 focus:border-corporate-500"
									placeholder="Ex: AQ / Laboratoire CQ"
									bind:value={requesterName}
								/>
								<p class="mt-1 text-[10px] text-slate-500">Identification pour le suivi.</p>
							</div>
						</div>

						<div>
							<label for="newLabel" class="block font-semibold text-slate-800 mb-1">
								Libellé long officiel (LNGDES) <span class="text-rose-500">*</span>
							</label>
							<input
								id="newLabel"
								type="text"
								class="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-slate-900 focus:border-corporate-500"
								placeholder="Ex: Flacon verre ambré 100ml type I avec capsule inviolable"
								bind:value={newLabel}
							/>
						</div>

						<div class="grid gap-3 sm:grid-cols-2">
							<div>
								<label for="newParamA1" class="block font-semibold text-slate-800 mb-1">
									Paramètre Alphanumérique libre (A1_0)
								</label>
								<input
									id="newParamA1"
									type="text"
									class="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-slate-900 focus:border-corporate-500"
									placeholder="Ex: ZONE_A (optionnel)"
									bind:value={newParamA1}
								/>
							</div>

							<div>
								<label for="newParamN1" class="block font-semibold text-slate-800 mb-1">
									Paramètre Numérique libre (N1_0)
								</label>
								<input
									id="newParamN1"
									type="number"
									step="any"
									class="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-slate-900 focus:border-corporate-500"
									placeholder="Ex: 1.000 (optionnel)"
									bind:value={newParamN1}
								/>
							</div>
						</div>

						<div>
							<label for="newReason" class="block font-semibold text-slate-800 mb-1">
								Justification ou contexte métier
							</label>
							<textarea
								id="newReason"
								rows="2"
								class="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-slate-900 focus:border-corporate-500"
								placeholder="Précisez pourquoi cette valeur est requise..."
								bind:value={newReason}
							></textarea>
						</div>

						<!-- Aperçu SQL en temps réel -->
						<div class="rounded-lg border border-slate-200 bg-slate-900 p-3 text-slate-100 font-mono text-[11px] space-y-1.5">
							<div class="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800">
								<span class="flex items-center gap-1.5">
									<FileCode class="size-3.5 text-corporate-400" />
									Instruction SQL Sage X3 prête à l'emploi :
								</span>
								<button
									type="button"
									class="inline-flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 px-2 py-0.5 text-[10px] text-slate-200 transition"
									onclick={copySqlScript}
								>
									{#if copiedSql}
										<Check class="size-3 text-emerald-400" />
										<span class="text-emerald-300">Script copié</span>
									{:else}
										<Clipboard class="size-3" />
										<span>Copier SQL</span>
									{/if}
								</button>
							</div>
							<pre class="overflow-x-auto text-[10px] leading-relaxed text-emerald-400 whitespace-pre-wrap">{generatedSql}</pre>
						</div>

						<!-- Actions -->
						<div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
							<p class="text-[11px] text-slate-500">
								* Champs obligatoires. Vous pouvez exécuter l'insertion ou transmettre le ticket 3636.
							</p>

							<div class="flex items-center gap-2">
								<button
									type="button"
									class="rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
									onclick={() => (isFormOpen = false)}
								>
									Annuler
								</button>

								<a
									href={mailHref}
									class="inline-flex items-center gap-1.5 rounded border border-corporate-300 bg-white px-3 py-1.5 text-xs font-semibold text-corporate-700 hover:bg-corporate-50"
									title="Transmettre par messagerie au support 3636"
								>
									<Mail class="size-3.5" />
									<span>Ticket par e-mail</span>
								</a>

								<button
									type="submit"
									class="inline-flex items-center gap-1.5 rounded bg-corporate-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-corporate-700 disabled:opacity-40 disabled:cursor-not-allowed"
									disabled={!canSubmit}
								>
									{#if isSubmitting}
										<span>Traitement en cours...</span>
									{:else}
										<Database class="size-3.5" />
										<span>Enregistrer la valeur</span>
									{/if}
								</button>
							</div>
						</div>
					</form>

					{#if submitResult}
						<div class="mt-3 rounded-lg border p-3 text-xs {
							submitResult.success
								? 'border-emerald-200 bg-emerald-50 text-emerald-950'
								: 'border-rose-200 bg-rose-50 text-rose-950'
						}">
							<div class="flex items-center gap-2 font-semibold mb-1">
								{#if submitResult.success}
									<CheckCircle2 class="size-4 text-emerald-600 shrink-0" />
									<span>{submitResult.message}</span>
								{:else}
									<AlertCircle class="size-4 text-rose-600 shrink-0" />
									<span>Erreur : {submitResult.error}</span>
								{/if}
							</div>
							{#if submitResult.success && submitResult.mode === 'script_only'}
								<p class="text-[11px] text-emerald-800">
									La valeur a été ajoutée à la vue locale. Le script SQL affiché ci-dessus peut être copié et exécuté dans SSMS sur la base SANDBOX.
								</p>
							{/if}
						</div>
					{/if}
				</div>
			{/if}

			<!-- Tableau des entrées réelles de la table diverse -->
			<div class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
				<table class="w-full text-left text-xs border-collapse">
					<thead>
						<tr class="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
							<th class="py-2.5 px-3">Code X3</th>
							<th class="py-2.5 px-3">Libellé court (SHODES)</th>
							<th class="py-2.5 px-3">Libellé long officiel (LNGDES)</th>
							<th class="py-2.5 px-3 font-mono">Param A1</th>
							<th class="py-2.5 px-3 font-mono">Param N1</th>
							<th class="py-2.5 px-3 text-right">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100">
						{#if filteredItems.length === 0}
							<tr>
								<td colspan="6" class="py-8 text-center text-slate-500">
									Aucune entrée ne correspond à votre recherche "{itemSearch}".
								</td>
							</tr>
						{:else}
							{#each filteredItems as item}
								<tr class="hover:bg-slate-50/70 transition">
									<td class="py-2.5 px-3 font-mono font-semibold text-slate-900">
										<span class="rounded bg-slate-100 px-1.5 py-0.5 border border-slate-200">
											{item.code}
										</span>
									</td>
									<td class="py-2.5 px-3 text-slate-700">
										{item.shortLabel || '-'}
									</td>
									<td class="py-2.5 px-3 text-slate-900 font-medium">
										{item.label}
									</td>
									<td class="py-2.5 px-3 font-mono text-[11px] text-slate-600">
										{item.param_a1 ? item.param_a1 : '-'}
									</td>
									<td class="py-2.5 px-3 font-mono text-[11px] text-slate-600">
										{item.param_n1 !== undefined && item.param_n1 !== '' ? item.param_n1 : '-'}
									</td>
									<td class="py-2.5 px-3 text-right">
										<button
											type="button"
											class="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-[11px] text-slate-600 hover:border-corporate-200 hover:text-corporate-700 transition"
											onclick={() => copyCode(item.code)}
											title="Copier le code technique X3"
										>
											{#if copiedCode === item.code}
												<Check class="size-3 text-emerald-600" />
												<span class="text-emerald-700">Copié</span>
											{:else}
												<Clipboard class="size-3" />
												<span>Copier</span>
											{/if}
										</button>
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>
