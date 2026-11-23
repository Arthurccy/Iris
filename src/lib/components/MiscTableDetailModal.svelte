<script lang="ts">
	import {
		AlertCircle,
		Check,
		CheckCircle2,
		ChevronDown,
		ChevronUp,
		Clipboard,
		Database,
		Lock,
		Mail,
		Pencil,
		Plus,
		Search,
		ShieldAlert,
		ShieldCheck,
		Sparkles,
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

	// Volet paramètres avancés (A1/N1)
	let showAdvancedParams = $state(false);

	// Garde-fou : étape de confirmation
	let isConfirming = $state(false);

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

	const existingCodes = $derived(localItems.map((i) => i.code.toUpperCase()));

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

	// Normalisation automatique du code X3 (Majuscules, pas d'espaces, sans accents)
	function normalizeX3Code(value: string): string {
		return value
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '') // Supprime accents
			.toUpperCase()
			.replace(/[^A-Z0-9_-]/g, '_') // Caractères non conformes remplacés par _
			.replace(/_+/g, '_') // Évite doubles underscores
			.slice(0, 15);
	}

	function handleCodeInput(e: Event) {
		const target = e.target as HTMLInputElement;
		formCode = normalizeX3Code(target.value);
	}

	// Suggestion automatique de code et de libellé court dès la saisie de la désignation
	function handleLabelInput(e: Event) {
		const target = e.target as HTMLInputElement;
		formLabel = target.value;

		// Si ajout et libellé court non personnalisé, auto-compléter
		if (formMode === 'add') {
			if (!formShortLabel || formShortLabel === formLabel.slice(0, 14)) {
				formShortLabel = formLabel.slice(0, 15);
			}

			// Si code encore vide, suggérer automatiquement
			if (!formCode) {
				generateCodeFromLabel();
			}
		}
	}

	function generateCodeFromLabel() {
		if (!formLabel.trim()) return;
		const words = formLabel
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toUpperCase()
			.replace(/[^A-Z0-9\s]/g, '')
			.split(/\s+/)
			.filter(Boolean);

		let candidate = '';
		if (words.length === 1) {
			candidate = words[0].slice(0, 10);
		} else if (words.length === 2) {
			candidate = `${words[0].slice(0, 6)}_${words[1].slice(0, 6)}`;
		} else {
			candidate = words.map((w) => w.slice(0, 3)).join('_').slice(0, 15);
		}

		candidate = candidate.slice(0, 15);
		if (existingCodes.includes(candidate)) {
			candidate = `${candidate.slice(0, 12)}_01`;
		}
		formCode = candidate;
	}

	const isCodeDuplicate = $derived.by(() => {
		if (formMode !== 'add') return false;
		const clean = formCode.trim().toUpperCase();
		if (!clean) return false;
		return existingCodes.includes(clean);
	});

	const canProceedToConfirm = $derived(
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
		showAdvancedParams = false;
		isConfirming = false;
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
		showAdvancedParams = Boolean(item.param_a1 || (item.param_n1 !== undefined && item.param_n1 !== ''));
		isConfirming = false;
		submitResult = null;
	}

	function closeForm() {
		formMode = 'none';
		isConfirming = false;
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

	function requestConfirmation(e: Event) {
		e.preventDefault();
		if (!canProceedToConfirm) return;
		isConfirming = true;
	}

	async function executeFinalSubmit() {
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
				isConfirming = false;
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
			isConfirming = false;
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
			`Dans le cadre de l'utilisation de Sage X3 Valdepharm, je sollicite l'application de la modification suivante :`,
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
		if (e.key === 'Escape' && !isSubmitting) {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Conteneur modal avec positionnement garanti depuis le haut (jamais tronqué) -->
<div class="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs">
	<!-- Arrière-plan cliquable pour fermer -->
	<button
		class="fixed inset-0 w-full h-full cursor-default"
		type="button"
		aria-label="Fermer la fenêtre"
		onclick={onClose}
	></button>

	<!-- Wrapper de centrage vertical ancré en haut (items-start) pour garantir que le haut est TOUJOURS visible -->
	<div class="min-h-full flex items-start justify-center p-3 sm:p-6 pt-5 sm:pt-8 pb-16 pointer-events-none">
		<!-- Boîte de dialogue centrée avec marge haute/basse garantie -->
		<div
			class="relative pointer-events-auto flex w-full max-w-5xl flex-col max-h-[85vh] overflow-hidden rounded-2xl border-2 border-slate-300 bg-white shadow-2xl"
			role="dialog"
			aria-modal="true"
			aria-label={`Table diverse #${table.numtab}`}
			tabindex="-1"
		>
			<!-- En-tête FIXE (toujours 100% visible) -->
			<div class="shrink-0 flex items-center justify-between gap-3 px-5 py-3.5 bg-slate-100 border-b border-slate-300">
				<div class="space-y-1">
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
					<h2 class="text-lg sm:text-xl font-extrabold text-slate-950">{table.title}</h2>
				</div>

				<button
					class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-100 transition"
					type="button"
					onclick={onClose}
				>
					<X class="size-4 text-slate-600" />
					<span>Fermer</span>
				</button>
			</div>

		<!-- Corps défilable -->
		<div class="modal-scroll overscroll-contain overflow-y-auto p-5 space-y-4">
			
			<!-- Information métier claire -->
			<div class="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700 space-y-1">
				<div class="flex items-center justify-between font-semibold text-slate-900">
					<span>{table.description || `Table diverse numéro ${table.numtab} de Sage X3.`}</span>
					<span class="text-[11px] text-slate-500 font-mono">X3 : GESTDU</span>
				</div>
				<p class="text-[11px] text-slate-500 leading-relaxed">
					Cette table alimente les menus déroulants de vos écrans Sage X3. Vous pouvez y ajouter de nouveaux choix ou corriger les libellés existants.
				</p>
			</div>

			<!-- Barre d'outils : Recherche + Bouton Ajouter -->
			<div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
				<div class="relative flex-1 max-w-sm">
					<Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
					<input
						class="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-950 outline-none transition focus:border-corporate-600 focus:ring-2 focus:ring-corporate-100"
						type="search"
						placeholder="Rechercher parmi les valeurs de cette table..."
						bind:value={itemSearch}
					/>
				</div>

				<div class="flex items-center gap-2.5">
					<span class="text-xs font-semibold text-slate-600">
						{filteredItems.length} entrée(s)
					</span>
					{#if formMode === 'none'}
						<button
							type="button"
							class="inline-flex items-center gap-1.5 rounded-xl bg-corporate-700 hover:bg-corporate-800 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition"
							onclick={openAddForm}
						>
							<Plus class="size-4" />
							<span>Ajouter une valeur</span>
						</button>
					{/if}
				</div>
			</div>

			<!-- FORMULAIRE GUIDÉ AVEC GARDE-FOUS (Ajout ou Modification) -->
			{#if formMode !== 'none'}
				<div class="rounded-2xl border-2 {
					formMode === 'edit'
						? 'border-amber-300 bg-amber-50/50'
						: 'border-corporate-200 bg-corporate-50/50'
				} p-4 sm:p-5 transition-all space-y-4 shadow-sm">
					
					<!-- En-tête formulaire -->
					<div class="flex items-center justify-between pb-3 border-b {
						formMode === 'edit' ? 'border-amber-200' : 'border-corporate-200'
					}">
						<div class="flex items-center gap-2">
							{#if formMode === 'edit'}
								<Pencil class="size-4 text-amber-700" />
								<h3 class="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-amber-950">
									Modifier la valeur {formCode} (Table #{table.numtab})
								</h3>
							{:else}
								<Plus class="size-4 text-corporate-700" />
								<h3 class="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-corporate-950">
									Ajouter une nouvelle valeur dans la table #{table.numtab}
								</h3>
							{/if}
						</div>

						<button
							type="button"
							class="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-white transition"
							onclick={closeForm}
							title="Annuler et fermer"
						>
							<X class="size-4" />
						</button>
					</div>

					<!-- ÉTAPE 1 : Saisie guidée -->
					{#if !isConfirming}
						<form onsubmit={requestConfirmation} class="space-y-4 text-xs">
							
							<!-- 1. Champ principal : La Désignation métier -->
							<div>
								<label for="formLabel" class="block font-bold text-slate-900 mb-1">
									Désignation complète <span class="text-rose-600">*</span>
									<span class="text-[11px] font-normal text-slate-500 ml-1">
										(Le nom complet qui s'affichera dans vos écrans Sage X3)
									</span>
								</label>
								<input
									id="formLabel"
									type="text"
									class="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-950 outline-none focus:border-corporate-600 focus:ring-2 focus:ring-corporate-100"
									placeholder="Ex : Flacon verre ambré 500ml type I ou Balance Mettler Toledo PM400..."
									value={formLabel}
									oninput={handleLabelInput}
									required
								/>
							</div>

							<!-- 2. Code X3 et Libellé court -->
							<div class="grid gap-4 sm:grid-cols-2">
								<div>
									<div class="flex items-center justify-between mb-1">
										<label for="formCode" class="block font-bold text-slate-900">
											Code technique X3
											{#if formMode === 'add'}
												<span class="text-rose-600">*</span>
											{/if}
										</label>
										{#if formMode === 'add' && formLabel.trim()}
											<button
												type="button"
												class="inline-flex items-center gap-1 text-[11px] font-bold text-corporate-700 hover:text-corporate-900 transition"
												onclick={generateCodeFromLabel}
												title="Générer un code normalisé à partir de la désignation"
											>
												<Sparkles class="size-3" />
												<span>Suggérer le code</span>
											</button>
										{/if}
									</div>

									<div class="relative">
										<input
											id="formCode"
											type="text"
											class="w-full rounded-xl border px-3 py-2 font-mono text-xs font-bold uppercase transition {
												formMode === 'edit'
													? 'border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed'
													: isCodeDuplicate
														? 'border-rose-400 bg-rose-50 text-rose-950'
														: 'border-slate-300 bg-white text-slate-950 focus:border-corporate-600 focus:ring-2 focus:ring-corporate-100'
											}"
											placeholder="Ex: FLAC_500ML"
											maxlength="15"
											readonly={formMode === 'edit'}
											value={formCode}
											oninput={handleCodeInput}
											required
										/>
										{#if formMode === 'edit'}
											<Lock class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
										{/if}
									</div>

									<!-- Aide et validation sur le code -->
									{#if formMode === 'edit'}
										<p class="mt-1 text-[10px] text-slate-500 font-medium">
											Garde-fou : Le code technique est verrouillé pour préserver les historiques de lots et de mouvements.
										</p>
									{:else if isCodeDuplicate}
										<p class="mt-1 text-[11px] font-bold text-rose-600 flex items-center gap-1">
											<ShieldAlert class="size-3.5 shrink-0" />
											<span>Garde-fou : Ce code existe déjà dans cette table. Choisissez-en un autre.</span>
										</p>
									{:else}
										<p class="mt-1 text-[10px] text-slate-500">
											Généré automatiquement. Max 15 caractères, sans espace ni accent.
											{#if table.items && table.items.length > 0}
												<span class="block text-slate-600 mt-0.5">
													Exemples existants : <strong class="font-mono">{table.items.slice(0, 3).map((i) => i.code).join(', ')}</strong>
												</span>
											{/if}
										</p>
									{/if}
								</div>

								<div>
									<label for="formShortLabel" class="block font-bold text-slate-900 mb-1">
										Libellé court
										<span class="text-[11px] font-normal text-slate-500 ml-1">
											(Abréviation max 15 caractères)
										</span>
									</label>
									<input
										id="formShortLabel"
										type="text"
										class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-950 outline-none focus:border-corporate-600 focus:ring-2 focus:ring-corporate-100"
										placeholder="Auto-complété"
										maxlength="15"
										bind:value={formShortLabel}
									/>
									<p class="mt-1 text-[10px] text-slate-500">
										Utilisé dans les colonnes étroites ou les listes d'écrans compactes.
									</p>
								</div>
							</div>

							<!-- 3. Volet repliable : Paramètres avancés X3 (A1 / N1) -->
							<div class="pt-2 border-t border-slate-200">
								<button
									type="button"
									class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 transition select-none"
									onclick={() => (showAdvancedParams = !showAdvancedParams)}
								>
									{#if showAdvancedParams}
										<ChevronUp class="size-3.5 text-slate-500" />
										<span>Masquer les paramètres techniques avancés (A1, N1)</span>
									{:else}
										<ChevronDown class="size-3.5 text-slate-500" />
										<span>Afficher les paramètres techniques avancés (A1, N1 - Optionnel)</span>
									{/if}
								</button>

								{#if showAdvancedParams}
									<div class="mt-3 p-3 rounded-xl bg-white border border-slate-200 grid gap-3 sm:grid-cols-2 text-xs">
										<div>
											<label for="formParamA1" class="block font-semibold text-slate-800 mb-1">
												Paramètre texte libre (A1)
											</label>
											<input
												id="formParamA1"
												type="text"
												class="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900 outline-none focus:border-corporate-600"
												placeholder="Optionnel"
												bind:value={formParamA1}
											/>
											<p class="mt-1 text-[10px] text-slate-500">Pour les tables nécessitant un identifiant annexe.</p>
										</div>

										<div>
											<label for="formParamN1" class="block font-semibold text-slate-800 mb-1">
												Paramètre numérique libre (N1)
											</label>
											<input
												id="formParamN1"
												type="number"
												step="any"
												class="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900 outline-none focus:border-corporate-600"
												placeholder="Ex: 0.000"
												bind:value={formParamN1}
											/>
											<p class="mt-1 text-[10px] text-slate-500">Pour les tables associées à un coefficient ou niveau.</p>
										</div>
									</div>
								{/if}
							</div>

							<!-- Actions principales du formulaire -->
							<div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
								<p class="text-[11px] text-slate-500 font-medium">
									* Champs obligatoires. Une vérification vous sera présentée avant enregistrement.
								</p>

								<div class="flex items-center gap-2">
									<button
										type="button"
										class="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
										onclick={closeForm}
									>
										Annuler
									</button>

									<a
										href={mailHref}
										class="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
										title="Transmettre par messagerie au support 3636"
									>
										<Mail class="size-3.5 text-slate-500" />
										<span>Transmettre au support</span>
									</a>

									<button
										type="submit"
										class="inline-flex items-center gap-1.5 rounded-xl {
											formMode === 'edit'
												? 'bg-amber-600 hover:bg-amber-700 text-white'
												: 'bg-corporate-700 hover:bg-corporate-800 text-white'
										} px-4 py-2 text-xs font-extrabold shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition"
										disabled={!canProceedToConfirm}
									>
										{#if formMode === 'edit'}
											<Check class="size-4" />
											<span>Valider la modification</span>
										{:else}
											<Plus class="size-4" />
											<span>Enregistrer la valeur</span>
										{/if}
									</button>
								</div>
							</div>
						</form>

					<!-- ÉTAPE 2 : GARDE-FOU & CONFIRMATION AVANT ÉCRITURE -->
					{:else}
						<div class="rounded-xl border-2 border-corporate-300 bg-white p-4 space-y-3">
							<div class="flex items-center gap-2 text-corporate-900 font-extrabold text-sm pb-2 border-b border-corporate-100">
								<ShieldCheck class="size-5 text-corporate-700 shrink-0" />
								<span>Confirmation avant enregistrement dans Sage X3</span>
							</div>

							<div class="text-xs text-slate-700 space-y-2">
								<p>
									Veuillez vérifier les informations ci-dessous avant d'appliquer l'opération :
								</p>
								<div class="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1.5 font-medium">
									<div>
										<span class="text-slate-500">Table cible :</span>
										<strong class="text-slate-900">Table #{table.numtab} ({table.title})</strong>
									</div>
									<div>
										<span class="text-slate-500">Code technique X3 :</span>
										<strong class="font-mono text-corporate-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">{formCode}</strong>
									</div>
									<div>
										<span class="text-slate-500">Désignation officielle :</span>
										<strong class="text-slate-900">{formLabel}</strong>
									</div>
									<div>
										<span class="text-slate-500">Libellé court :</span>
										<strong class="text-slate-900">{formShortLabel || formLabel.slice(0, 15)}</strong>
									</div>
									<div>
										<span class="text-slate-500">Environnement :</span>
										<strong class="text-amber-900">SANDBOX (FRVDRVMAS46)</strong>
									</div>
								</div>
							</div>

							<div class="flex items-center justify-end gap-2.5 pt-2">
								<button
									type="button"
									class="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
									onclick={() => (isConfirming = false)}
									disabled={isSubmitting}
								>
									Corriger la saisie
								</button>

								<button
									type="button"
									class="inline-flex items-center gap-1.5 rounded-xl bg-corporate-700 hover:bg-corporate-800 px-4 py-2 text-xs font-extrabold text-white shadow-xs disabled:opacity-40 transition"
									onclick={executeFinalSubmit}
									disabled={isSubmitting}
								>
									{#if isSubmitting}
										<span>Écriture en cours en base...</span>
									{:else}
										<Database class="size-4" />
										<span>Confirmer et enregistrer</span>
									{/if}
								</button>
							</div>
						</div>
					{/if}

					<!-- Résultat / Notification -->
					{#if submitResult}
						<div class="rounded-xl border-2 p-3 text-xs {
							submitResult.success
								? 'border-emerald-300 bg-emerald-50 text-emerald-950 font-semibold'
								: 'border-rose-300 bg-rose-50 text-rose-950 font-semibold'
						}">
							<div class="flex items-center gap-2">
								{#if submitResult.success}
									<CheckCircle2 class="size-5 text-emerald-600 shrink-0" />
									<span>{submitResult.message}</span>
								{:else}
									<AlertCircle class="size-5 text-rose-600 shrink-0" />
									<span>Erreur : {submitResult.error}</span>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- TABLEAU DES VALEURS EXISTANTES -->
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
</div>
