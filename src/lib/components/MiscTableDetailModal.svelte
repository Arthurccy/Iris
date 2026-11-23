<script lang="ts">
	import {
		AlertCircle,
		Check,
		CheckCircle2,
		Clipboard,
		Database,
		Lock,
		Mail,
		Pencil,
		Plus,
		Search,
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
	let formMode = $state<'none' | 'add' | 'edit'>('none');

	// Champs du formulaire
	let formCode = $state('');
	let formShortLabel = $state('');
	let formLabel = $state('');
	let formParamA1 = $state('');
	let formParamN1 = $state('');
	let formReason = $state('');
	let requesterName = $state('');

	// Indicateurs d'état
	let copiedCode = $state<string | null>(null);
	let isSubmitting = $state(false);
	let submitResult = $state<{
		success: boolean;
		message?: string;
		error?: string;
	} | null>(null);

	// Liste locale réactive
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
		if (formMode !== 'add') return false;
		const clean = formCode.trim().toUpperCase();
		if (!clean) return false;
		return localItems.some((item) => item.code.toUpperCase() === clean);
	});

	const canSubmit = $derived(
		formCode.trim().length >= 1 &&
		formLabel.trim().length >= 2 &&
		!isCodeDuplicate &&
		!isSubmitting
	);

	function openAddForm() {
		formMode = 'add';
		formCode = '';
		formShortLabel = '';
		formLabel = '';
		formParamA1 = '';
		formParamN1 = '';
		formReason = '';
		submitResult = null;
	}

	function openEditForm(item: MiscTableItem) {
		formMode = 'edit';
		formCode = item.code;
		formShortLabel = item.shortLabel || '';
		formLabel = item.label || '';
		formParamA1 = item.param_a1 || '';
		formParamN1 = item.param_n1 !== undefined ? String(item.param_n1) : '';
		formReason = '';
		submitResult = null;
	}

	function closeForm() {
		formMode = 'none';
		submitResult = null;
	}

	async function copyCode(code: string) {
		if (!navigator.clipboard) return;
		await navigator.clipboard.writeText(code);
		copiedCode = code;
		setTimeout(() => {
			if (copiedCode === code) copiedCode = null;
		}, 1500);
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!canSubmit) return;

		isSubmitting = true;
		submitResult = null;

		const endpoint = formMode === 'add'
			? '/api/tables-diverses/add'
			: '/api/tables-diverses/update';

		try {
			const res = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					numtab: table.numtab,
					code: formCode.trim().toUpperCase(),
					libelle_long: formLabel.trim(),
					libelle_court: formShortLabel.trim() || formLabel.trim().slice(0, 15),
					param_a1: formParamA1.trim(),
					param_n1: formParamN1.trim()
				})
			});

			const data = await res.json();
			if (!res.ok) {
				submitResult = {
					success: false,
					error: data.error || 'Erreur lors de l\'enregistrement.'
				};
			} else {
				submitResult = {
					success: true,
					message: data.message || (formMode === 'add' ? 'Valeur ajoutée avec succès !' : 'Valeur mise à jour avec succès !')
				};

				if (formMode === 'add' && data.item) {
					localItems = [data.item, ...localItems];
				} else if (formMode === 'edit' && data.item) {
					localItems = localItems.map((i) =>
						i.code === data.item.code ? { ...i, ...data.item } : i
					);
				}

				// Fermer le formulaire après 1,5s si succès
				setTimeout(() => {
					if (submitResult?.success) {
						closeForm();
					}
				}, 1500);
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

	const mailHref = $derived.by(() => {
		const actionType = formMode === 'edit' ? 'Modification' : 'Ajout';
		const subject = `[IRIS - Sage X3] Demande de ${actionType} table diverse #${table.numtab} : ${formCode.trim().toUpperCase()}`;
		const body = [
			'Bonjour,',
			'',
			`Dans le cadre de l'utilisation de Sage X3 Valdepharm, je sollicite la validation ou l'application de la modification suivante :`,
			`- Numéro de table : #${table.numtab}`,
			`- Intitulé : ${table.title}`,
			`- Domaine : ${table.category}`,
			'',
			`Détails de la valeur (${actionType}) :`,
			`- Code (CODE_0) : ${formCode.trim().toUpperCase()}`,
			`- Libellé long (LNGDES) : ${formLabel.trim()}`,
			`- Libellé court (SHODES) : ${formShortLabel.trim() || formLabel.trim().slice(0, 15)}`,
			`- Paramètre alphanumérique A1 : ${formParamA1.trim() || '(vide)'}`,
			`- Paramètre numérique N1 : ${formParamN1.trim() || '0'}`,
			`- Motif / Justification métier : ${formReason.trim() || 'Non spécifié'}`,
			`- Demandeur : ${requesterName.trim() || 'Utilisateur métier'}`,
			'',
			'Application IRIS — Portail métier Sage X3 Valdepharm.'
		].join('\n');

		return `mailto:${fallbackMailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
	});

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
		<div class="section-divider flex items-center justify-between gap-3 px-5 py-4 bg-slate-50/90">
			<div>
				<div class="flex items-center gap-2">
					<span class="rounded bg-corporate-700 font-mono text-[11px] font-bold text-white px-2.5 py-0.5 shadow-2xs">
						Table #{table.numtab}
					</span>
					<span class="rounded bg-slate-200 text-slate-900 text-[11px] font-bold px-2 py-0.5">
						{table.category}
					</span>
					{#if table.numtab >= 1000}
						<span class="rounded bg-amber-100 text-amber-950 border border-amber-300 text-[11px] font-bold px-2 py-0.5">
							Spécifique Valdepharm
						</span>
					{:else}
						<span class="rounded bg-blue-100 text-blue-950 border border-blue-300 text-[11px] font-bold px-2 py-0.5">
							Standard Sage X3
						</span>
					{/if}
				</div>
				<h2 class="mt-1 text-lg font-bold text-slate-950">{table.title}</h2>
			</div>

			<button
				class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
				type="button"
				onclick={onClose}
			>
				<X class="size-3.5" />
				<span>Fermer</span>
			</button>
		</div>

		<!-- Corps défilable -->
		<div class="modal-scroll overscroll-contain overflow-y-auto p-5 space-y-4">
			
			<!-- Métadonnées & Information métier -->
			<div class="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 text-xs space-y-1.5">
				<div class="flex items-center justify-between text-slate-700 font-medium">
					<span>{table.description || `Table diverse Sage X3 numéro ${table.numtab}.`}</span>
					<span class="font-mono text-[11px] text-slate-500">Fonction X3 : GESTDU</span>
				</div>
				<p class="text-[11px] text-slate-500 leading-relaxed">
					Les codes existants constituent les clés techniques de référence de vos listes déroulantes Sage X3. Leurs libellés et paramètres peuvent être mis à jour ou enrichis sans impacter les liens historiques.
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
					{#if formMode === 'none'}
						<button
							type="button"
							class="inline-flex items-center gap-1.5 rounded-lg bg-corporate-700 hover:bg-corporate-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition"
							onclick={openAddForm}
						>
							<Plus class="size-3.5" />
							<span>Ajouter une valeur</span>
						</button>
					{/if}
				</div>
			</div>

			<!-- Formulaire rétractable : Ajout ou Modification -->
			{#if formMode !== 'none'}
				<div class="rounded-xl border {formMode === 'edit' ? 'border-amber-300 bg-amber-50/40' : 'border-corporate-200 bg-corporate-50/40'} p-4 transition-all space-y-3">
					<div class="flex items-center justify-between pb-2 border-b {formMode === 'edit' ? 'border-amber-200' : 'border-corporate-200/60'}">
						<div class="flex items-center gap-2">
							{#if formMode === 'edit'}
								<Pencil class="size-4 text-amber-700" />
								<h3 class="text-xs font-bold uppercase tracking-wider text-amber-950">
									Modifier l'entrée {formCode} (Table #{table.numtab})
								</h3>
							{:else}
								<Plus class="size-4 text-corporate-700" />
								<h3 class="text-xs font-bold uppercase tracking-wider text-corporate-950">
									Ajouter une valeur dans la table #{table.numtab}
								</h3>
							{/if}
						</div>

						<button
							type="button"
							class="rounded p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
							onclick={closeForm}
							title="Annuler et fermer"
						>
							<X class="size-3.5" />
						</button>
					</div>

					<form onsubmit={handleSubmit} class="space-y-3 text-xs">
						<div class="grid gap-3 sm:grid-cols-3">
							<div>
								<label for="formCode" class="block font-semibold text-slate-800 mb-1">
									Code X3
									{#if formMode === 'add'}
										<span class="text-rose-500">*</span>
									{/if}
								</label>
								<div class="relative">
									<input
										id="formCode"
										type="text"
										class="w-full rounded border px-2.5 py-1.5 font-mono uppercase transition {
											formMode === 'edit'
												? 'border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed'
												: isCodeDuplicate
													? 'border-rose-400 bg-rose-50 text-rose-900'
													: 'border-slate-200 bg-white text-slate-900 focus:border-corporate-500'
										}"
										placeholder="Ex: BAL01"
										maxlength="15"
										readonly={formMode === 'edit'}
										bind:value={formCode}
									/>
									{#if formMode === 'edit'}
										<Lock class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400" />
									{/if}
								</div>
								{#if formMode === 'edit'}
									<p class="mt-1 text-[10px] text-slate-500">
										Le code technique est verrouillé pour préserver l'intégrité et la traçabilité des enregistrements X3.
									</p>
								{:else if isCodeDuplicate}
									<p class="mt-1 text-[11px] text-rose-600 font-medium">
										Ce code existe déjà dans cette table.
									</p>
								{:else}
									<p class="mt-1 text-[10px] text-slate-500">Max 15 caractères, sans espace.</p>
								{/if}
							</div>

							<div>
								<label for="formShortLabel" class="block font-semibold text-slate-800 mb-1">
									Libellé court
								</label>
								<input
									id="formShortLabel"
									type="text"
									class="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-slate-900 focus:border-corporate-500"
									placeholder="Ex: Flacon ambré"
									maxlength="15"
									bind:value={formShortLabel}
								/>
								<p class="mt-1 text-[10px] text-slate-500">Max 15 car. (menus compacts).</p>
							</div>

							<div>
								<label for="requesterName" class="block font-semibold text-slate-800 mb-1">
									Service / Demandeur
								</label>
								<input
									id="requesterName"
									type="text"
									class="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-slate-900 focus:border-corporate-500"
									placeholder="Ex: Laboratoire CQ / Production"
									bind:value={requesterName}
								/>
								<p class="mt-1 text-[10px] text-slate-500">Pour le suivi interne.</p>
							</div>
						</div>

						<div>
							<label for="formLabel" class="block font-semibold text-slate-800 mb-1">
								Désignation complète officielle <span class="text-rose-500">*</span>
							</label>
							<input
								id="formLabel"
								type="text"
								class="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-slate-900 focus:border-corporate-500"
								placeholder="Ex: Flacon verre ambré 100ml type I avec bague à vis"
								bind:value={formLabel}
							/>
						</div>

						<div class="grid gap-3 sm:grid-cols-2">
							<div>
								<label for="formParamA1" class="block font-semibold text-slate-800 mb-1">
									Paramètre alphanumérique libre (A1)
								</label>
								<input
									id="formParamA1"
									type="text"
									class="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-slate-900 focus:border-corporate-500"
									placeholder="Optionnel"
									bind:value={formParamA1}
								/>
							</div>

							<div>
								<label for="formParamN1" class="block font-semibold text-slate-800 mb-1">
									Paramètre numérique libre (N1)
								</label>
								<input
									id="formParamN1"
									type="number"
									step="any"
									class="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-slate-900 focus:border-corporate-500"
									placeholder="Ex: 0.000 (optionnel)"
									bind:value={formParamN1}
								/>
							</div>
						</div>

						<!-- Actions du formulaire -->
						<div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
							<p class="text-[11px] text-slate-500">
								* Champs obligatoires. L'action s'applique directement sur l'environnement SANDBOX.
							</p>

							<div class="flex items-center gap-2">
								<button
									type="button"
									class="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
									onclick={closeForm}
								>
									Annuler
								</button>

								<a
									href={mailHref}
									class="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
									title="Transmettre par e-mail au support 3636"
								>
									<Mail class="size-3.5" />
									<span>Transmettre par e-mail</span>
								</a>

								<button
									type="submit"
									class="inline-flex items-center gap-1.5 rounded {
										formMode === 'edit'
											? 'bg-amber-600 hover:bg-amber-700'
											: 'bg-corporate-600 hover:bg-corporate-700'
									} px-4 py-1.5 text-xs font-semibold text-white shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition"
									disabled={!canSubmit}
								>
									{#if isSubmitting}
										<span>Enregistrement en cours...</span>
									{:else if formMode === 'edit'}
										<Check class="size-3.5" />
										<span>Mettre à jour la valeur</span>
									{:else}
										<Plus class="size-3.5" />
										<span>Créer la valeur</span>
									{/if}
								</button>
							</div>
						</div>
					</form>

					{#if submitResult}
						<div class="mt-2.5 rounded-lg border p-3 text-xs {
							submitResult.success
								? 'border-emerald-200 bg-emerald-50 text-emerald-950'
								: 'border-rose-200 bg-rose-50 text-rose-950'
						}">
							<div class="flex items-center gap-2 font-semibold">
								{#if submitResult.success}
									<CheckCircle2 class="size-4 text-emerald-600 shrink-0" />
									<span>{submitResult.message}</span>
								{:else}
									<AlertCircle class="size-4 text-rose-600 shrink-0" />
									<span>Erreur : {submitResult.error}</span>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Tableau des valeurs existantes -->
			<div class="rounded-xl border border-slate-300 bg-white overflow-hidden shadow-xs">
				<table class="w-full text-left text-xs border-collapse">
					<thead>
						<tr class="border-b-2 border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-800 uppercase tracking-wider">
							<th class="py-2.5 px-3 w-28">Code X3</th>
							<th class="py-2.5 px-3 w-44">Libellé court</th>
							<th class="py-2.5 px-3">Désignation complète officielle</th>
							<th class="py-2.5 px-3 font-mono w-24">Param A1</th>
							<th class="py-2.5 px-3 font-mono w-24">Param N1</th>
							<th class="py-2.5 px-3 text-right w-44">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-200">
						{#if filteredItems.length === 0}
							<tr>
								<td colspan="6" class="py-8 text-center text-slate-500 font-medium">
									Aucune entrée ne correspond à votre recherche "{itemSearch}".
								</td>
							</tr>
						{:else}
							{#each filteredItems as item}
								<tr class="hover:bg-slate-50 transition group">
									<td class="py-2 px-3 font-mono font-bold text-slate-950">
										<span class="rounded bg-slate-100 px-2 py-0.5 border border-slate-300 shadow-2xs">
											{item.code}
										</span>
									</td>
									<td class="py-2 px-3 text-slate-800 font-medium">
										{item.shortLabel || '-'}
									</td>
									<td class="py-2 px-3 text-slate-950 font-bold">
										{item.label}
									</td>
									<td class="py-2 px-3 font-mono text-[11px] text-slate-700 font-semibold">
										{item.param_a1 ? item.param_a1 : '-'}
									</td>
									<td class="py-2 px-3 font-mono text-[11px] text-slate-700 font-semibold">
										{item.param_n1 !== undefined && item.param_n1 !== '' ? item.param_n1 : '-'}
									</td>
									<td class="py-2 px-3 text-right">
										<div class="inline-flex items-center gap-1.5">
											<button
												type="button"
												class="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50/80 px-2.5 py-1 text-[11px] font-bold text-amber-950 hover:bg-amber-100 shadow-2xs transition"
												onclick={() => openEditForm(item)}
												title="Modifier les libellés ou paramètres de cette valeur"
											>
												<Pencil class="size-3 text-amber-700" />
												<span>Modifier</span>
											</button>

											<button
												type="button"
												class="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-800 hover:bg-slate-100 shadow-2xs transition"
												onclick={() => copyCode(item.code)}
												title="Copier le code technique"
											>
												{#if copiedCode === item.code}
													<Check class="size-3 text-emerald-600" />
													<span class="text-emerald-800">Copié</span>
												{:else}
													<Clipboard class="size-3 text-slate-500" />
													<span>Copier</span>
												{/if}
											</button>
										</div>
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
