<script lang="ts">
	import {
		AlertCircle,
		ArrowRight,
		Check,
		CheckCircle2,
		Clipboard,
		Database,
		History,
		Loader2,
		Lock,
		Mail,
		Pencil,
		Plus,
		Search,
		ShieldAlert,
		ShieldCheck,
		X
	} from 'lucide-svelte';
	import type { MiscTableDefinition, MiscTableItem } from '$lib/types';
	import type { AuditLogEntry } from '$lib/server/audit';

	type Props = {
		table: MiscTableDefinition;
		fallbackMailTo?: string;
		isLive?: boolean;
		user?: {
			sAMAccountName: string;
			displayName: string;
			mail: string;
			department: string;
			title: string;
			isAdmin: boolean;
		} | null;
		permissions?: {
			canEdit: boolean;
			allowedTables: number[];
			allTablesAllowed: boolean;
			roleLabel: string;
		};
		tableAuditLogs?: AuditLogEntry[];
		onClose: () => void;
		onSuccess?: () => Promise<void> | void;
	};

	let {
		table,
		fallbackMailTo = '3636.valdepharm@fareva.com',
		isLive = false,
		user = null,
		permissions = {
			canEdit: false,
			allowedTables: [],
			allTablesAllowed: false,
			roleLabel: 'Non connecté'
		},
		tableAuditLogs = [],
		onClose,
		onSuccess
	}: Props = $props();

	let viewTab = $state<'values' | 'audit'>('values');

	const canEditCurrentTable = $derived(
		permissions.allTablesAllowed || (permissions.allowedTables || []).includes(table.numtab)
	);

	const defaultRequester = $derived(
		user ? `${user.displayName} (${user.department || user.mail || user.sAMAccountName})` : ''
	);

	let itemSearch = $state('');
	let formMode = $state<'none' | 'add' | 'edit'>('none');

	// Traçabilité & Champs du formulaire
	let requesterName = $state('');
	let formReason = $state('');
	let formCode = $state('');
	let formShortLabel = $state('');
	let formLabel = $state('');
	let originalEditItem = $state<MiscTableItem | null>(null);
	let shortLabelCustomized = $state(false);

	// Garde-fou : étape de confirmation
	let isConfirming = $state(false);

	// Indicateurs d'état
	let copiedCode = $state<string | null>(null);
	let highlightedCode = $state<string | null>(null);
	let isSubmitting = $state(false);
	let submitResult = $state<{
		success: boolean;
		message?: string;
		error?: string;
	} | null>(null);

	// Liste locale réactive synchronisée avec la table
	let localItems = $state<MiscTableItem[]>([]);

	$effect(() => {
		localItems = [...(table.items || [])];
	});

	// Verrouillage propre du scroll de la page quand la modale est ouverte
	$effect(() => {
		document.body.classList.add('modal-open');
		return () => {
			document.body.classList.remove('modal-open');
		};
	});

	function focusOnMount(node: HTMLElement) {
		requestAnimationFrame(() => node.focus());
	}

	const existingCodes = $derived(localItems.map((i) => i.code.toUpperCase()));

	const filteredItems = $derived.by(() => {
		const term = itemSearch.trim().toLowerCase();
		if (!term) return localItems;
		return localItems.filter(
			(item) =>
				item.code.toLowerCase().includes(term) ||
				(item.shortLabel && item.shortLabel.toLowerCase().includes(term)) ||
				(item.label && item.label.toLowerCase().includes(term))
		);
	});

	// Normalisation automatique du code X3 (Majuscules, pas d'espaces, sans accents)
	function normalizeX3Code(value: string): string {
		return value
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toUpperCase()
			.replace(/[^A-Z0-9_-]/g, '_')
			.replace(/_+/g, '_')
			.slice(0, 15);
	}

	function handleCodeInput(e: Event) {
		const target = e.target as HTMLInputElement;
		formCode = normalizeX3Code(target.value);
	}

	function handleLabelInput(e: Event) {
		const target = e.target as HTMLInputElement;
		formLabel = target.value;

		// Auto-complétion du libellé court (12 car.) en ajout tant que l'utilisateur ne l'a pas personnalisé
		if (formMode === 'add' && !shortLabelCustomized) {
			formShortLabel = formLabel.slice(0, 12);
		}
	}

	function handleShortLabelInput(e: Event) {
		const target = e.target as HTMLInputElement;
		formShortLabel = target.value;
		shortLabelCustomized = target.value.trim().length > 0;
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
			requesterName.trim().length >= 2 &&
			formReason.trim().length >= 3 &&
			!isCodeDuplicate &&
			!isSubmitting
	);

	function openAddForm() {
		if (!canEditCurrentTable) return;
		formMode = 'add';
		originalEditItem = null;
		formCode = '';
		formShortLabel = '';
		formLabel = '';
		shortLabelCustomized = false;
		requesterName = defaultRequester;
		formReason = '';
		isConfirming = false;
		submitResult = null;
		viewTab = 'values';
	}

	function openEditForm(item: MiscTableItem) {
		if (!canEditCurrentTable) return;
		formMode = 'edit';
		originalEditItem = item;
		formCode = item.code;
		formShortLabel = item.shortLabel || '';
		formLabel = item.label || '';
		shortLabelCustomized = Boolean(item.shortLabel);
		requesterName = defaultRequester;
		formReason = '';
		isConfirming = false;
		submitResult = null;
		viewTab = 'values';
	}

	function closeForm() {
		formMode = 'none';
		originalEditItem = null;
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

		const endpoint =
			formMode === 'add' ? '/api/tables-diverses/add' : '/api/tables-diverses/update';
		const savedCode = formCode.trim().toUpperCase();

		try {
			const res = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					numtab: table.numtab,
					code: savedCode,
					libelle_long: formLabel.trim().slice(0, 30),
					libelle_court: (formShortLabel.trim() || formLabel.trim()).slice(0, 12),
					demandeur: requesterName.trim(),
					motif: formReason.trim()
				})
			});

			const result = await res.json();
			if (!res.ok) {
				submitResult = {
					success: false,
					error: result.error || "Erreur lors de l'enregistrement en base."
				};
				isConfirming = false;
			} else {
				submitResult = {
					success: true,
					message:
						result.message ||
						(formMode === 'add'
							? 'Valeur ajoutée avec succès dans Sage X3.'
							: 'Valeur mise à jour avec succès dans Sage X3.')
				};

				if (formMode === 'add' && result.item) {
					localItems = [result.item, ...localItems];
				} else if (formMode === 'edit' && result.item) {
					localItems = localItems.map((i) =>
						i.code === result.item.code ? { ...i, ...result.item } : i
					);
				}

				highlightedCode = savedCode;
				setTimeout(() => {
					if (highlightedCode === savedCode) highlightedCode = null;
				}, 5000);

				// Rafraîchit les compteurs et l'Audit Trail sur la vue principale sans fermer le contexte
				if (onSuccess) {
					await onSuccess();
				}

				setTimeout(() => {
					if (submitResult?.success) {
						closeForm();
					}
				}, 1300);
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
		const actionType = formMode === 'edit' ? 'Modification' : 'Création';
		const subject = `[IRIS - Sage X3] Demande de ${actionType} table diverse #${table.numtab} (${table.title}) - Code : ${formCode.trim().toUpperCase() || '(à définir)'}`;
		const body = [
			"Bonjour l'équipe Support Sage X3,",
			'',
			'Dans le cadre des activités sur le site Valdepharm, je vous transmets la demande formelle suivante :',
			'',
			'1. RÉFÉRENTIEL CONCERNÉ :',
			`- Table diverse numéro : #${table.numtab}`,
			`- Intitulé officiel : ${table.title}`,
			`- Domaine / Catégorie : ${table.category}`,
			'',
			'2. CADRAGE & TRAÇABILITÉ (GESTION DES CHANGEMENTS) :',
			`- Demandeur (Nom & Service) : ${requesterName.trim() || 'Non spécifié'}`,
			`- Motif / Justification métier : ${formReason.trim() || 'Non spécifié'}`,
			`- Date de la demande : ${new Date().toLocaleDateString('fr-FR')}`,
			'',
			`3. DÉTAILS DE LA VALEUR (${actionType.toUpperCase()}) :`,
			`- Code technique X3 (CODE_0) : ${formCode.trim().toUpperCase() || 'À définir'}`,
			`- Désignation complète (LNGDES) : ${formLabel.trim().slice(0, 30) || 'Non renseignée'}`,
			`- Libellé court (SHODES) : ${(formShortLabel.trim() || formLabel.trim()).slice(0, 12) || 'Non renseigné'}`,
			'',
			"Merci de bien vouloir procéder à l'enregistrement dans la fonction GESTDU de Sage X3.",
			'',
			'Application IRIS — Portail métier Sage X3 Valdepharm.'
		].join('\n');

		return `mailto:${fallbackMailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key !== 'Escape' || isSubmitting) return;
		if (isConfirming) {
			isConfirming = false;
		} else if (formMode !== 'none') {
			closeForm();
		} else {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Conteneur fixe plein écran : centrage optique strict sans jamais couper les bords -->
<div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm">
	<button
		class="fixed inset-0 w-full h-full cursor-default -z-10"
		type="button"
		aria-label="Fermer la fenêtre"
		onclick={onClose}
	></button>

	<!-- Boîte de dialogue : hauteur adaptative (max 88dvh) pour épouser les petites tables et scroller uniquement en interne sur les grandes -->
	<div
		class="relative z-10 flex flex-col w-full {formMode !== 'none'
			? 'max-w-2xl'
			: 'max-w-5xl'} max-h-[88dvh] rounded-2xl border border-slate-300 bg-white shadow-2xl overflow-hidden"
		role="dialog"
		aria-modal="true"
		aria-label={`Table diverse #${table.numtab}`}
		tabindex="-1"
	>
		<!-- EN-TÊTE FIXE -->
		<div class="shrink-0 bg-slate-50 border-b border-slate-200 px-5 py-3.5">
			<div class="flex items-start justify-between gap-4">
				<div class="space-y-1 min-w-0">
					<div class="flex flex-wrap items-center gap-1.5">
						<span class="rounded-md bg-corporate-700 font-mono text-[11px] font-bold text-white px-2 py-0.5 shadow-sm">
							Table #{table.numtab}
						</span>
						<span class="rounded-md bg-slate-200/80 text-slate-800 text-[11px] font-semibold px-2 py-0.5">
							{table.category}
						</span>
						{#if table.numtab >= 1000}
							<span class="rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-semibold px-2 py-0.5">
								Spécifique Valdepharm
							</span>
						{:else}
							<span class="rounded-md bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-semibold px-2 py-0.5">
								Standard Sage X3
							</span>
						{/if}
						{#if canEditCurrentTable}
							<span class="inline-flex items-center gap-1 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-bold px-2 py-0.5">
								<ShieldCheck class="size-3 text-emerald-700" />
								Édition autorisée
							</span>
						{:else}
							<span class="inline-flex items-center gap-1 rounded-md bg-slate-200 text-slate-700 text-[11px] font-semibold px-2 py-0.5">
								<Lock class="size-3 text-slate-500" />
								Consultation seule
							</span>
						{/if}
					</div>

					<h2 class="text-base sm:text-lg font-extrabold text-slate-950 leading-snug truncate" title={table.title}>
						{table.title}
					</h2>
					{#if formMode === 'none'}
						<p class="text-xs text-slate-500 truncate">
							{table.description || `Référentiel des valeurs Sage X3 (Fonction GESTDU • Table #${table.numtab}).`}
						</p>
					{/if}
				</div>

				<button
					class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-100 hover:text-slate-950 transition shrink-0"
					type="button"
					onclick={onClose}
					title="Fermer (Échap)"
				>
					<X class="size-4 text-slate-500" />
					<span class="hidden sm:inline">Fermer</span>
				</button>
			</div>

			<!-- Barre d'outils / Onglets intégrée dans l'en-tête (en vue liste uniquement) -->
			{#if formMode === 'none'}
				<div class="mt-3 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
					<div class="flex flex-wrap items-center gap-2">
						<!-- Onglets Valeurs / Historique -->
						<div class="inline-flex items-center rounded-lg border border-slate-300 bg-slate-200/70 p-0.5 text-xs font-bold">
							<button
								type="button"
								class="rounded-md px-3 py-1 transition {viewTab === 'values'
									? 'bg-white text-slate-950 shadow-sm'
									: 'text-slate-600 hover:text-slate-900'}"
								onclick={() => (viewTab = 'values')}
							>
								Valeurs ({localItems.length})
							</button>
							<button
								type="button"
								class="rounded-md px-3 py-1 transition inline-flex items-center gap-1.5 {viewTab === 'audit'
									? 'bg-corporate-700 text-white shadow-sm'
									: 'text-slate-600 hover:text-slate-900'}"
								onclick={() => (viewTab = 'audit')}
							>
								<History class="size-3.5" />
								<span>Historique IRIS ({tableAuditLogs.length})</span>
							</button>
						</div>

						{#if viewTab === 'values' && localItems.length > 0}
							<div class="relative flex-1 sm:w-64">
								<Search class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
								<input
									class="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-7 py-1.5 text-xs font-medium text-slate-950 outline-none transition focus:border-corporate-600 focus:ring-2 focus:ring-corporate-100"
									type="search"
									placeholder="Filtrer par code ou libellé..."
									bind:value={itemSearch}
								/>
								{#if itemSearch}
									<button
										type="button"
										onclick={() => (itemSearch = '')}
										class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
										title="Effacer le filtre"
									>
										<X class="size-3.5" />
									</button>
								{/if}
							</div>
						{/if}
					</div>

					{#if canEditCurrentTable}
						<button
							type="button"
							class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-corporate-700 hover:bg-corporate-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition shrink-0"
							onclick={openAddForm}
						>
							<Plus class="size-3.5" />
							<span>Ajouter une valeur</span>
						</button>
					{/if}
				</div>
			{/if}
		</div>

		<!-- CORPS DÉFILABLE STRICT (flex-auto + min-h-0 : s'adapte aux petites tables, scrolle proprement pour les grandes) -->
		<div class="flex-auto min-h-0 overflow-y-auto overscroll-contain modal-scroll bg-white">
			{#if formMode === 'none'}
				{#if viewTab === 'values'}
					{#if localItems.length === 0}
						<div class="p-10 text-center space-y-2.5">
							<div class="mx-auto size-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
								<Database class="size-5" />
							</div>
							<p class="text-sm font-bold text-slate-900">Cette table est actuellement vide</p>
							<p class="text-xs text-slate-500 max-w-md mx-auto">
								Aucune valeur n'est encore paramétrée dans la table #{table.numtab} sur Sage X3.
							</p>
							{#if canEditCurrentTable}
								<div class="pt-2">
									<button
										type="button"
										class="inline-flex items-center gap-1.5 rounded-lg bg-corporate-700 hover:bg-corporate-800 px-4 py-2 text-xs font-bold text-white shadow-sm transition"
										onclick={openAddForm}
									>
										<Plus class="size-4" />
										<span>Créer la première valeur</span>
									</button>
								</div>
							{/if}
						</div>
					{:else if filteredItems.length === 0}
						<div class="p-10 text-center space-y-2">
							<p class="text-sm font-semibold text-slate-800">
								Aucune entrée ne correspond à « {itemSearch} ».
							</p>
							<button
								type="button"
								class="text-xs font-bold text-corporate-700 hover:underline"
								onclick={() => (itemSearch = '')}
							>
								Afficher les {localItems.length} valeurs
							</button>
						</div>
					{:else}
						<table class="w-full text-left text-xs border-collapse">
							<thead class="sticky top-0 z-10 bg-slate-100 border-b border-slate-300 shadow-sm">
								<tr class="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
									<th class="py-2.5 px-4 w-36">Code X3</th>
									<th class="py-2.5 px-3 w-44">Libellé court</th>
									<th class="py-2.5 px-3">Désignation complète officielle</th>
									<th class="py-2.5 px-4 text-right w-44">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-slate-200">
								{#each filteredItems as item}
									{@const isHighlighted = highlightedCode === item.code.toUpperCase()}
									<tr class="transition {isHighlighted ? 'bg-emerald-50' : 'hover:bg-slate-50/90'}">
										<td class="py-2 px-4 font-mono">
											<button
												type="button"
												onclick={() => copyCode(item.code)}
												class="inline-flex items-center gap-1.5 rounded bg-slate-100 hover:bg-slate-200 px-2 py-0.5 border border-slate-300 font-bold text-slate-900 transition"
												title="Cliquer pour copier le code"
											>
												<span>{item.code}</span>
												{#if copiedCode === item.code}
													<Check class="size-3 text-emerald-600" />
												{/if}
											</button>
										</td>
										<td class="py-2 px-3 text-slate-600 font-medium">
											{item.shortLabel || '-'}
										</td>
										<td class="py-2 px-3 text-slate-950 font-semibold">
											<div class="flex items-center gap-2">
												<span>{item.label}</span>
												{#if isHighlighted}
													<span class="rounded bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 text-[10px] font-bold">
														Enregistré
													</span>
												{/if}
											</div>
										</td>
										<td class="py-2 px-4 text-right">
											<div class="inline-flex items-center gap-1.5">
												{#if canEditCurrentTable}
													<button
														type="button"
														class="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-100 transition"
														onclick={() => openEditForm(item)}
														title="Modifier les libellés de cette valeur"
													>
														<Pencil class="size-3 text-amber-700" />
														<span>Modifier</span>
													</button>
												{/if}

												<button
													type="button"
													class="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition"
													onclick={() => copyCode(item.code)}
													title="Copier le code technique"
												>
													{#if copiedCode === item.code}
														<Check class="size-3 text-emerald-600" />
														<span class="text-emerald-700 font-bold">Copié</span>
													{:else}
														<Clipboard class="size-3 text-slate-400" />
														<span>Copier</span>
													{/if}
												</button>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					{/if}
				{:else}
					<!-- ONGLET HISTORIQUE -->
					{#if tableAuditLogs.length === 0}
						<div class="p-10 text-center space-y-2">
							<History class="size-8 text-slate-300 mx-auto" />
							<p class="text-sm font-bold text-slate-800">Aucune trace enregistrée sur cette table</p>
							<p class="text-xs text-slate-500">
								Les créations et modifications réalisées via IRIS apparaîtront ici avec leur motif et auteur certifié.
							</p>
						</div>
					{:else}
						<table class="w-full text-left text-xs border-collapse">
							<thead class="sticky top-0 z-10 bg-slate-100 border-b border-slate-300 shadow-sm">
								<tr class="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
									<th class="py-2.5 px-4 w-36">Date</th>
									<th class="py-2.5 px-3 w-28 text-center">Action</th>
									<th class="py-2.5 px-3 w-28 font-mono">Code X3</th>
									<th class="py-2.5 px-3">Désignation</th>
									<th class="py-2.5 px-3">Demandeur</th>
									<th class="py-2.5 px-4">Motif</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-slate-200">
								{#each tableAuditLogs as log}
									<tr class="hover:bg-slate-50 transition">
										<td class="py-2.5 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
											{new Date(log.timestamp).toLocaleString('fr-FR', {
												day: '2-digit',
												month: '2-digit',
												year: 'numeric',
												hour: '2-digit',
												minute: '2-digit'
											})}
										</td>
										<td class="py-2.5 px-3 text-center">
											{#if log.action === 'ADD'}
												<span class="rounded bg-emerald-100 text-emerald-900 px-2 py-0.5 text-[10px] font-bold">
													Création
												</span>
											{:else}
												<span class="rounded bg-amber-100 text-amber-900 px-2 py-0.5 text-[10px] font-bold">
													Modification
												</span>
											{/if}
										</td>
										<td class="py-2.5 px-3 font-mono font-bold text-slate-900">
											<span class="rounded bg-slate-100 border border-slate-300 px-1.5 py-0.5">
												{log.code}
											</span>
										</td>
										<td class="py-2.5 px-3 font-semibold text-slate-900">
											{log.label}
											{#if log.shortLabel}
												<span class="text-slate-500 font-normal text-[11px] ml-1">({log.shortLabel})</span>
											{/if}
										</td>
										<td class="py-2.5 px-3">
											<div class="font-bold text-slate-900">{log.user.displayName}</div>
											<div class="text-[10px] text-slate-500">{log.user.department || log.user.username}</div>
										</td>
										<td class="py-2.5 px-4 italic text-slate-600">
											« {log.reason} »
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					{/if}
				{/if}
			{:else}
				<!-- VUE FORMULAIRE (Ajout ou Modification) -->
				<div class="p-5 sm:p-6 space-y-5">
					<!-- Indicateur d'étape + Retour -->
					<div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
						<div class="flex items-center gap-2.5">
							<span class="inline-flex size-7 items-center justify-center rounded-lg {formMode === 'edit' ? 'bg-amber-100 text-amber-800' : 'bg-corporate-100 text-corporate-700'}">
								{#if formMode === 'edit'}
									<Pencil class="size-4" />
								{:else}
									<Plus class="size-4" />
								{/if}
							</span>
							<div>
								<h3 class="text-sm font-extrabold text-slate-950">
									{formMode === 'edit'
										? `Modifier la valeur ${formCode}`
										: `Nouvelle valeur dans la table #${table.numtab}`}
								</h3>
								<div class="flex items-center gap-2 text-[11px] font-semibold mt-0.5">
									<span class={!isConfirming ? 'text-corporate-700 font-bold' : 'text-slate-400'}>
										1. Saisie & justification
									</span>
									<span class="text-slate-300">/</span>
									<span class={isConfirming ? 'text-corporate-700 font-bold' : 'text-slate-400'}>
										2. Validation GxP
									</span>
								</div>
							</div>
						</div>

						<button
							type="button"
							class="text-xs font-bold text-slate-600 hover:text-slate-950 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
							onclick={closeForm}
							disabled={isSubmitting}
						>
							Retour à la liste
						</button>
					</div>

					{#if !isConfirming}
						<form onsubmit={requestConfirmation} class="space-y-4 text-xs">
							<!-- Identité Active Directory (compacte) + Motif -->
							<div class="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-3">
								<div class="flex flex-wrap items-center justify-between gap-2">
									<span class="text-[11px] font-bold uppercase tracking-wider text-slate-600">
										Traçabilité GxP
									</span>
									{#if user}
										<span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
											<ShieldCheck class="size-3.5 text-emerald-600" />
											<span>Demandeur certifié : {user.displayName} ({user.sAMAccountName})</span>
										</span>
									{/if}
								</div>

								{#if !user}
									<div>
										<label for="requesterName" class="block font-bold text-slate-900 mb-1">
											Demandeur (Nom & Service) <span class="text-rose-600">*</span>
										</label>
										<input
											id="requesterName"
											type="text"
											class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-950 outline-none focus:border-corporate-600 focus:ring-2 focus:ring-corporate-100"
											placeholder="Ex : Alain Prost / Informatique"
											bind:value={requesterName}
											required
										/>
									</div>
								{/if}

								<div>
									<label for="formReason" class="block font-bold text-slate-900 mb-1">
										Motif / Justification métier <span class="text-rose-600">*</span>
									</label>
									<input
										id="formReason"
										type="text"
										use:focusOnMount
										class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-950 outline-none focus:border-corporate-600 focus:ring-2 focus:ring-corporate-100"
										placeholder="Ex : Qualification nouvel équipement ou nouveau format flacon"
										bind:value={formReason}
										required
									/>
								</div>
							</div>

							<!-- Code X3 + Libellé court -->
							<div class="grid gap-4 sm:grid-cols-2">
								<div>
									<div class="flex items-center justify-between mb-1">
										<label for="formCode" class="font-bold text-slate-900">
											Code technique X3 {#if formMode === 'add'}<span class="text-rose-600">*</span>{/if}
										</label>
										<span class="font-mono text-[10px] font-semibold {formCode.length >= 14 ? 'text-amber-600' : 'text-slate-400'}">
											{formCode.length}/15
										</span>
									</div>

									<div class="relative">
										<input
											id="formCode"
											type="text"
											class="w-full rounded-lg border px-3 py-2 font-mono text-xs font-bold uppercase outline-none transition {formMode ===
											'edit'
												? 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed'
												: isCodeDuplicate
													? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-2 focus:ring-rose-100'
													: 'border-slate-300 bg-white text-slate-950 focus:border-corporate-600 focus:ring-2 focus:ring-corporate-100'}"
											placeholder="Ex : BAL01 ou FLAC_500"
											maxlength="15"
											readonly={formMode === 'edit'}
											value={formCode}
											oninput={handleCodeInput}
											required
										/>
										{#if formMode === 'edit'}
											<Lock class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
										{/if}
									</div>

									{#if formMode === 'edit'}
										<p class="mt-1 text-[10px] text-slate-500">
											Clé primaire Sage X3 verrouillée pour préserver l'intégrité historique.
										</p>
									{:else if isCodeDuplicate}
										<p class="mt-1 text-[11px] font-bold text-rose-600 flex items-center gap-1">
											<ShieldAlert class="size-3.5 shrink-0" />
											<span>Ce code existe déjà dans la table #{table.numtab}.</span>
										</p>
									{:else}
										<p class="mt-1 text-[10px] text-slate-500">
											Majuscules, chiffres et « _ » uniquement (normalisation auto).
										</p>
									{/if}
								</div>

								<div>
									<div class="flex items-center justify-between mb-1">
										<label for="formShortLabel" class="font-bold text-slate-900">
											Libellé court
										</label>
										<span class="font-mono text-[10px] font-semibold {formShortLabel.length >= 11 ? 'text-amber-600' : 'text-slate-400'}">
											{formShortLabel.length}/12
										</span>
									</div>
									<input
										id="formShortLabel"
										type="text"
										class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-950 outline-none focus:border-corporate-600 focus:ring-2 focus:ring-corporate-100"
										placeholder="Auto-généré si laissé vide"
										maxlength="12"
										value={formShortLabel}
										oninput={handleShortLabelInput}
									/>
									<p class="mt-1 text-[10px] text-slate-500">
										Affichage compact dans les colonnes étroites Sage X3.
									</p>
								</div>
							</div>

							<!-- Désignation complète -->
							<div>
								<div class="flex items-center justify-between mb-1">
									<label for="formLabel" class="font-bold text-slate-900">
										Désignation complète officielle <span class="text-rose-600">*</span>
									</label>
									<span class="font-mono text-[10px] font-semibold {formLabel.length >= 27 ? 'text-amber-600' : 'text-slate-400'}">
										{formLabel.length}/30
									</span>
								</div>
								<input
									id="formLabel"
									type="text"
									class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-950 outline-none focus:border-corporate-600 focus:ring-2 focus:ring-corporate-100"
									placeholder="Ex : Balance Mettler Toledo PM400"
									maxlength="30"
									value={formLabel}
									oninput={handleLabelInput}
									required
								/>
							</div>

							<!-- Boutons d'action avec hiérarchie claire -->
							<div class="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
								<a
									href={mailHref}
									class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 text-xs font-semibold transition"
									title="Préparer un e-mail de demande pour le Support 3636"
								>
									<Mail class="size-3.5 text-slate-500" />
									<span>Passer par e-mail (3636)</span>
								</a>

								<div class="flex items-center justify-end gap-2">
									<button
										type="button"
										class="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
										onclick={closeForm}
									>
										Annuler
									</button>

									<button
										type="submit"
										class="inline-flex items-center gap-1.5 rounded-lg bg-corporate-700 hover:bg-corporate-800 px-4 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition"
										disabled={!canProceedToConfirm}
									>
										<span>Vérifier et enregistrer</span>
										<ArrowRight class="size-3.5" />
									</button>
								</div>
							</div>
						</form>
					{:else}
						<!-- ÉTAPE 2 : RÉCAPITULATIF & CONFIRMATION -->
						<div class="space-y-4">
							<div class="rounded-xl border border-corporate-200 bg-corporate-50/40 p-4 space-y-3">
								<div class="flex items-center gap-2 text-corporate-900 font-bold text-xs">
									<ShieldCheck class="size-4 text-corporate-700 shrink-0" />
									<span>Confirmation avant écriture directe en base SANDBOX (FRVDRVMAS46)</span>
								</div>

								<div class="grid sm:grid-cols-2 gap-3 rounded-lg bg-white border border-slate-200 p-3.5 text-xs">
									<div>
										<span class="text-[11px] text-slate-500 block">Table cible</span>
										<strong class="text-slate-950">#{table.numtab} — {table.title}</strong>
									</div>
									<div>
										<span class="text-[11px] text-slate-500 block">Code technique X3</span>
										<strong class="font-mono text-corporate-800">{formCode}</strong>
									</div>
									<div>
										<span class="text-[11px] text-slate-500 block">Désignation complète</span>
										{#if formMode === 'edit' && originalEditItem && originalEditItem.label !== formLabel.trim()}
											<div class="text-slate-400 line-through text-[11px]">{originalEditItem.label}</div>
										{/if}
										<strong class="text-slate-950">{formLabel.trim()}</strong>
									</div>
									<div>
										<span class="text-[11px] text-slate-500 block">Libellé court</span>
										{#if formMode === 'edit' && originalEditItem && (originalEditItem.shortLabel || '') !== (formShortLabel.trim() || formLabel.trim()).slice(0, 12)}
											<div class="text-slate-400 line-through text-[11px]">{originalEditItem.shortLabel || '-'}</div>
										{/if}
										<strong class="text-slate-950">{(formShortLabel.trim() || formLabel.trim()).slice(0, 12)}</strong>
									</div>
									<div class="sm:col-span-2 pt-2 border-t border-slate-100 flex flex-wrap gap-x-6 gap-y-1">
										<div>
											<span class="text-slate-500">Demandeur : </span>
											<strong class="text-slate-900">{requesterName}</strong>
										</div>
										<div>
											<span class="text-slate-500">Motif : </span>
											<strong class="text-slate-900">« {formReason} »</strong>
										</div>
									</div>
								</div>
							</div>

							<div class="flex items-center justify-end gap-2.5">
								<button
									type="button"
									class="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
									onclick={() => (isConfirming = false)}
									disabled={isSubmitting}
								>
									Modifier la saisie
								</button>

								<button
									type="button"
									class="inline-flex items-center gap-1.5 rounded-lg bg-corporate-700 hover:bg-corporate-800 px-4 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50 transition"
									onclick={executeFinalSubmit}
									disabled={isSubmitting}
								>
									{#if isSubmitting}
										<Loader2 class="size-3.5 animate-spin" />
										<span>Enregistrement en cours...</span>
									{:else}
										<Database class="size-3.5" />
										<span>Confirmer l'écriture</span>
									{/if}
								</button>
							</div>
						</div>
					{/if}

					<!-- Notification résultat -->
					{#if submitResult}
						<div
							class="rounded-xl border p-3.5 text-xs {submitResult.success
								? 'border-emerald-300 bg-emerald-50 text-emerald-950'
								: 'border-rose-300 bg-rose-50 text-rose-950'}"
						>
							<div class="flex items-start gap-2.5">
								{#if submitResult.success}
									<CheckCircle2 class="size-5 text-emerald-600 shrink-0 mt-0.5" />
									<div>
										<p class="font-bold">{submitResult.message}</p>
										<p class="text-[11px] text-emerald-800 mt-0.5">
											Entrée tracée dans le journal d'audit et synchronisée avec Sage X3 SANDBOX.
										</p>
									</div>
								{:else}
									<AlertCircle class="size-5 text-rose-600 shrink-0 mt-0.5" />
									<div class="space-y-2 flex-1">
										<p class="font-bold">L'enregistrement a échoué :</p>
										<p class="text-rose-900 bg-white/80 p-2 rounded-lg border border-rose-200">
											{submitResult.error}
										</p>
										<a
											href={mailHref}
											class="inline-flex items-center gap-1.5 rounded-lg bg-corporate-700 hover:bg-corporate-800 text-white px-3 py-1.5 text-xs font-bold shadow-sm transition"
										>
											<Mail class="size-3.5" />
											<span>Transmettre au Support 3636</span>
										</a>
									</div>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- PIED DE MODALE FIXE (en vue liste uniquement) -->
		{#if formMode === 'none'}
			<div class="shrink-0 flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-2.5 text-[11px] text-slate-600">
				<div>
					{#if viewTab === 'values'}
						<span>
							<strong class="text-slate-900">{filteredItems.length}</strong>
							{filteredItems.length > 1 ? 'valeurs affichées' : 'valeur affichée'}
							{#if itemSearch.trim() && filteredItems.length !== localItems.length}
								sur {localItems.length}
							{/if}
							<span class="hidden sm:inline text-slate-400"> • Cliquer sur un code pour le copier</span>
						</span>
					{:else}
						<span>
							<strong class="text-slate-900">{tableAuditLogs.length}</strong> événement(s) tracé(s) sur la table #{table.numtab}
						</span>
					{/if}
				</div>
				<button
					type="button"
					class="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
					onclick={onClose}
				>
					Fermer
				</button>
			</div>
		{/if}
	</div>
</div>
