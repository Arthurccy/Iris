<script lang="ts">
	import {
		AlertCircle,
		Check,
		CheckCircle2,
		Clipboard,
		Clock,
		Database,
		History,
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
	};

	let {
		table,
		fallbackMailTo = '3636.valdepharm@fareva.com',
		isLive = false,
		user = null,
		permissions = { canEdit: false, allowedTables: [], allTablesAllowed: false, roleLabel: 'Non connecté' },
		tableAuditLogs = [],
		onClose
	}: Props = $props();

	let viewTab = $state<'values' | 'audit'>('values');

	const canEditCurrentTable = $derived(
		permissions.allTablesAllowed || (permissions.allowedTables || []).includes(table.numtab)
	);

	const defaultRequester = $derived(
		user
			? `${user.displayName} (${user.department || user.mail || user.sAMAccountName})`
			: ''
	);

	let itemSearch = $state('');
	let formMode = $state<'none' | 'add' | 'edit'>('none');

	// Traçabilité & Champs du formulaire
	let requesterName = $state('');
	let formReason = $state('');
	let formCode = $state('');
	let formShortLabel = $state('');
	let formLabel = $state('');

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

	// Verrouillage propre du scroll de la page quand la modale est ouverte
	$effect(() => {
		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = originalOverflow;
		};
	});

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

	function handleLabelInput(e: Event) {
		const target = e.target as HTMLInputElement;
		formLabel = target.value;

		// Si ajout et libellé court non personnalisé, auto-compléter avec les 12 premiers caractères (standard Sage X3 SHODES)
		if (formMode === 'add') {
			if (!formShortLabel || formShortLabel === formLabel.slice(0, 11)) {
				formShortLabel = formLabel.slice(0, 12);
			}
		}
	}

	const isCodeDuplicate = $derived.by(() => {
		if (formMode !== 'add') return false;
		const clean = formCode.trim().toUpperCase();
		if (!clean) return false;
		return existingCodes.includes(clean);
	});

	// Validation stricte : Code, Désignation, Demandeur et Motif requis pour se couvrir
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
		formCode = '';
		formShortLabel = '';
		formLabel = '';
		requesterName = defaultRequester;
		formReason = '';
		isConfirming = false;
		submitResult = null;
	}

	function openEditForm(item: MiscTableItem) {
		if (!canEditCurrentTable) return;
		formMode = 'edit';
		formCode = item.code;
		formShortLabel = item.shortLabel || '';
		formLabel = item.label || '';
		requesterName = defaultRequester;
		formReason = '';
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
					libelle_long: formLabel.trim().slice(0, 30),
					libelle_court: (formShortLabel.trim() || formLabel.trim()).slice(0, 12),
					demandeur: requesterName.trim(),
					motif: formReason.trim()
				})
			});

			const data = await res.json();
			if (!res.ok) {
				submitResult = {
					success: false,
					error: data.error || "Erreur lors de l'enregistrement en base."
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

	// Lien email officiel de demande cadrée et traçable pour se couvrir
	const mailHref = $derived.by(() => {
		const actionType = formMode === 'edit' ? 'Modification' : 'Création';
		const subject = `[IRIS - Sage X3] Demande de ${actionType} table diverse #${table.numtab} (${table.title}) - Code : ${formCode.trim().toUpperCase() || '(à définir)'}`;
		const body = [
			'Bonjour l\'équipe Support Sage X3,',
			'',
			`Dans le cadre des activités sur le site Valdepharm, je vous transmets la demande formelle suivante :`,
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
			'Merci de bien vouloir procéder à l\'enregistrement dans la fonction GESTDU de Sage X3.',
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

<!-- Conteneur fixe plein écran centré, avec marges de sécurité garanties sur tous les écrans -->
<div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-slate-950/80 backdrop-blur-xs">
	<!-- Arrière-plan cliquable pour fermer -->
	<button
		class="fixed inset-0 w-full h-full cursor-default -z-10"
		type="button"
		aria-label="Fermer la fenêtre"
		onclick={onClose}
	></button>

	<!-- Boîte de dialogue : contrainte en hauteur avec scroll interne strict (ne dépasse JAMAIS de la fenêtre) -->
	<div
		class="relative z-10 flex flex-col w-full {formMode !== 'none' ? 'max-w-3xl' : 'max-w-5xl lg:max-w-6xl'} h-[86vh] max-h-[820px] rounded-2xl border-2 border-slate-300 bg-white shadow-2xl overflow-hidden"
		role="dialog"
		aria-modal="true"
		aria-label={`Table diverse #${table.numtab}`}
		tabindex="-1"
	>
		<!-- En-tête FIXE (toujours 100% visible, marges généreuses et aérées) -->
		<div class="shrink-0 flex items-center justify-between gap-4 px-6 py-4 bg-slate-100 border-b border-slate-300">
			<div class="space-y-1.5">
				<div class="flex flex-wrap items-center gap-2">
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
					{#if canEditCurrentTable}
						<span class="inline-flex items-center gap-1 rounded bg-emerald-100 text-emerald-950 border border-emerald-300 text-[11px] font-bold px-2 py-0.5 shadow-2xs">
							<ShieldCheck class="size-3 text-emerald-700" />
							Édition autorisée
						</span>
					{:else}
						<span class="inline-flex items-center gap-1 rounded bg-slate-200 text-slate-800 text-[11px] font-bold px-2 py-0.5 shadow-2xs">
							<Lock class="size-3 text-slate-600" />
							Consultation seule
						</span>
					{/if}
				</div>
				<h2 class="text-lg sm:text-xl font-extrabold text-slate-950 leading-tight">{table.title}</h2>
			</div>

			<button
				class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-100 transition shrink-0"
				type="button"
				onclick={onClose}
			>
				<X class="size-4 text-slate-600" />
				<span>Fermer</span>
			</button>
		</div>

		<!-- Corps défilable : prend tout l'espace disponible interne (flex-1 min-h-0) et fait défiler son contenu sans jamais forcer le conteneur externe -->
		<div class="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 space-y-4">
			{#if formMode === 'none'}
				<!-- VUE 1 : CONSULTATION & TABLEAU COMPLET DES VALEURS -->
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

				<!-- Barre d'outils : Recherche + Bouton Ajouter + Onglet Historique -->
				<div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
					<div class="flex items-center gap-2">
						{#if tableAuditLogs.length > 0}
							<div class="flex items-center gap-1 rounded-xl border border-slate-300 bg-slate-200/80 p-1 text-xs font-bold">
								<button
									type="button"
									class="rounded-lg px-3 py-1.5 transition {viewTab === 'values' ? 'bg-white text-slate-950 shadow-2xs' : 'text-slate-700 hover:text-slate-950'}"
									onclick={() => (viewTab = 'values')}
								>
									Valeurs ({filteredItems.length})
								</button>
								<button
									type="button"
									class="rounded-lg px-3 py-1.5 transition flex items-center gap-1.5 {viewTab === 'audit' ? 'bg-corporate-700 text-white shadow-2xs' : 'text-slate-700 hover:text-slate-950'}"
									onclick={() => (viewTab = 'audit')}
								>
									<History class="size-3.5" />
									<span>Historique IRIS ({tableAuditLogs.length})</span>
								</button>
							</div>
						{/if}

						{#if viewTab === 'values'}
							<div class="relative flex-1 sm:w-64">
								<Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
								<input
									class="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-950 outline-none transition focus:border-corporate-600 focus:ring-2 focus:ring-corporate-100"
									type="search"
									placeholder="Filtrer les valeurs..."
									bind:value={itemSearch}
								/>
							</div>
						{/if}
					</div>

					<div class="flex items-center gap-2.5">
						{#if canEditCurrentTable}
							<button
								type="button"
								class="inline-flex items-center gap-1.5 rounded-xl bg-corporate-700 hover:bg-corporate-800 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition"
								onclick={openAddForm}
							>
								<Plus class="size-4" />
								<span>Ajouter une valeur</span>
							</button>
						{:else}
							<div class="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500 border border-slate-200">
								<Lock class="size-3.5 text-slate-400" />
								<span>Consultation seule</span>
							</div>
						{/if}
					</div>
				</div>

				{#if viewTab === 'values'}
					<!-- TABLEAU DES VALEURS EXISTANTES -->
					<div class="rounded-xl border border-slate-300 bg-white overflow-hidden shadow-xs">
						<table class="w-full text-left text-xs border-collapse">
							<thead>
								<tr class="border-b-2 border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-800 uppercase tracking-wider">
									<th class="py-2.5 px-3 w-32">Code X3</th>
									<th class="py-2.5 px-3 w-48">Libellé court</th>
									<th class="py-2.5 px-3">Désignation complète officielle</th>
									<th class="py-2.5 px-3 text-right w-44">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-slate-200">
								{#if filteredItems.length === 0}
									<tr>
										<td colspan="4" class="py-8 text-center text-slate-500 font-medium">
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
											<td class="py-2 px-3 text-right">
												<div class="inline-flex items-center gap-1.5">
													{#if canEditCurrentTable}
														<button
															type="button"
															class="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50/80 px-2.5 py-1 text-[11px] font-bold text-amber-950 hover:bg-amber-100 shadow-2xs transition"
															onclick={() => openEditForm(item)}
															title="Modifier les libellés de cette valeur"
														>
															<Pencil class="size-3 text-amber-700" />
															<span>Modifier</span>
														</button>
													{/if}

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
				{:else if viewTab === 'audit'}
					<!-- HISTORIQUE DES ACTIONS SUR CETTE TABLE -->
					<div class="rounded-xl border border-slate-300 bg-white overflow-hidden shadow-xs">
						<table class="w-full text-left text-xs border-collapse">
							<thead>
								<tr class="border-b-2 border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-800 uppercase tracking-wider">
									<th class="py-2.5 px-3 w-36">Date</th>
									<th class="py-2.5 px-3 w-28 text-center">Action</th>
									<th class="py-2.5 px-3 w-28 font-mono">Code X3</th>
									<th class="py-2.5 px-3">Désignation</th>
									<th class="py-2.5 px-3">Demandeur certifié</th>
									<th class="py-2.5 px-3">Motif métier</th>
									<th class="py-2.5 px-3 text-center w-24">Statut</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-slate-200">
								{#each tableAuditLogs as log}
									<tr class="hover:bg-slate-50 transition">
										<td class="py-2.5 px-3 font-mono text-[11px] text-slate-700">
											{new Date(log.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
										</td>
										<td class="py-2.5 px-3 text-center">
											{#if log.action === 'ADD'}
												<span class="rounded bg-emerald-100 text-emerald-950 px-2 py-0.5 text-[10px] font-bold shadow-2xs">Création</span>
											{:else}
												<span class="rounded bg-amber-100 text-amber-950 px-2 py-0.5 text-[10px] font-bold shadow-2xs">Modification</span>
											{/if}
										</td>
										<td class="py-2.5 px-3 font-mono font-bold text-slate-950">
											<span class="rounded bg-slate-100 border border-slate-300 px-1.5 py-0.5">
												{log.code}
											</span>
										</td>
										<td class="py-2.5 px-3 font-bold text-slate-950">
											{log.label}
											{#if log.shortLabel}
												<span class="text-slate-500 font-normal text-[11px] ml-1">({log.shortLabel})</span>
											{/if}
										</td>
										<td class="py-2.5 px-3">
											<div class="font-bold text-slate-950">{log.user.displayName}</div>
											<div class="text-[10px] text-slate-500">{log.user.department || log.user.username}</div>
										</td>
										<td class="py-2.5 px-3 italic text-slate-700 text-xs">
											"{log.reason}"
										</td>
										<td class="py-2.5 px-3 text-center">
											<span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
												<Check class="size-3 text-emerald-600" />
												<span>Sage X3</span>
											</span>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}

			{:else}
				<!-- VUE 2 : FORMULAIRE DÉDIÉ ET CENTRÉ (Ajout ou Modification) -->
				<div class="rounded-2xl border-2 {
					formMode === 'edit'
						? 'border-amber-300 bg-amber-50/50'
						: 'border-corporate-200 bg-corporate-50/50'
				} p-4 sm:p-6 transition-all space-y-4 shadow-sm">
					
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

					<!-- ÉTAPE 1 : Saisie guidée & Cadrée -->
					{#if !isConfirming}
						<form onsubmit={requestConfirmation} class="space-y-4 text-xs">
							
							<!-- 1. Cadrage & Traçabilité (Obligatoire pour se couvrir) -->
							<div class="rounded-xl border border-corporate-200 bg-corporate-50/70 p-3.5 space-y-2.5">
								<div class="flex items-center gap-2 font-bold text-corporate-950">
									<ShieldCheck class="size-4 text-corporate-700" />
									<span>Cadrage & Traçabilité de la demande (Gestion des changements)</span>
								</div>
								<p class="text-[11px] text-corporate-800 leading-relaxed">
									Pour garantir la conformité et l'auditabilité sur le site Valdepharm, veuillez obligatoirement identifier le demandeur et justifier le besoin métier.
								</p>

								<div class="grid gap-3 sm:grid-cols-2 pt-1">
									<div>
										<label for="requesterName" class="block font-bold text-slate-900 mb-1">
											Demandeur (Nom & Service) <span class="text-rose-600">*</span>
										</label>
										{#if user}
											<div class="space-y-1">
												<input
													id="requesterName"
													type="text"
													class="w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-900 outline-none cursor-not-allowed shadow-inner"
													value={requesterName}
													readonly
													disabled
												/>
												<div class="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
													<ShieldCheck class="size-3 text-emerald-600" />
													<span>Identité certifiée Active Directory ({user.sAMAccountName})</span>
												</div>
											</div>
										{:else}
											<input
												id="requesterName"
												type="text"
												class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-950 outline-none focus:border-corporate-600 focus:ring-2 focus:ring-corporate-100"
												placeholder="Ex : Alain Prost / Informatique"
												bind:value={requesterName}
												required
											/>
										{/if}
									</div>

									<div>
										<label for="formReason" class="block font-bold text-slate-900 mb-1">
											Motif / Justification métier <span class="text-rose-600">*</span>
										</label>
										<input
											id="formReason"
											type="text"
											class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-950 outline-none focus:border-corporate-600 focus:ring-2 focus:ring-corporate-100"
											placeholder="Ex : Qualification nouvel équipement ou nouveau format flacon"
											bind:value={formReason}
											required
										/>
									</div>
								</div>
							</div>

							<!-- 2. Code X3 et Libellé court -->
							<div class="grid gap-4 sm:grid-cols-2">
								<div>
									<label for="formCode" class="block font-bold text-slate-900 mb-1">
										Code technique Sage X3
										{#if formMode === 'add'}
											<span class="text-rose-600">*</span>
										{/if}
									</label>

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
											placeholder="Ex: BAL01 ou FLAC_500"
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

									<!-- Garde-fous sur le code -->
									{#if formMode === 'edit'}
										<p class="mt-1 text-[10px] text-slate-500 font-medium">
											Garde-fou : Le code est verrouillé car il sert de clé primaire dans les historiques et mouvements ERP.
										</p>
									{:else if isCodeDuplicate}
										<p class="mt-1 text-[11px] font-bold text-rose-600 flex items-center gap-1">
											<ShieldAlert class="size-3.5 shrink-0" />
											<span>Garde-fou : Ce code existe déjà dans la table #{table.numtab}. Choisissez-en un autre.</span>
										</p>
									{:else}
										<p class="mt-1 text-[10px] text-slate-500">
											Max 15 caractères, sans espace ni accent (majuscules automatiques).
										</p>
									{/if}
								</div>

								<div>
									<label for="formShortLabel" class="block font-bold text-slate-900 mb-1">
										Libellé court
										<span class="text-[11px] font-normal text-slate-500 ml-1">
											(Abréviation max 12 car.)
										</span>
									</label>
									<input
										id="formShortLabel"
										type="text"
										class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-950 outline-none focus:border-corporate-600 focus:ring-2 focus:ring-corporate-100"
										placeholder="Auto-complété ou personnalisé"
										maxlength="12"
										bind:value={formShortLabel}
									/>
									<p class="mt-1 text-[10px] text-slate-500">
										Utilisé dans les colonnes étroites ou menus compacts de Sage X3.
									</p>
								</div>
							</div>

							<!-- 3. Désignation complète -->
							<div>
								<label for="formLabel" class="block font-bold text-slate-900 mb-1">
									Désignation complète officielle <span class="text-rose-600">*</span>
									<span class="text-[11px] font-normal text-slate-500 ml-1">
										(Nom complet affiché dans Sage X3, max 30 car.)
									</span>
								</label>
								<input
									id="formLabel"
									type="text"
									class="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-950 outline-none focus:border-corporate-600 focus:ring-2 focus:ring-corporate-100"
									placeholder="Ex : Balance Mettler Toledo PM400 salle de pesée n°2"
									maxlength="30"
									value={formLabel}
									oninput={handleLabelInput}
									required
								/>
							</div>

							<!-- Actions principales du formulaire -->
							<div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
								<p class="text-[11px] text-slate-500 font-medium">
									* Champs obligatoires pour valider la traçabilité.
								</p>

								<div class="flex flex-wrap items-center gap-2">
									<button
										type="button"
										class="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
										onclick={closeForm}
									>
										Annuler
									</button>

									<!-- Action officielle GxP pour se couvrir -->
									<a
										href={mailHref}
										class="inline-flex items-center gap-1.5 rounded-xl bg-corporate-700 hover:bg-corporate-800 text-white px-4 py-2 text-xs font-bold shadow-xs transition"
										title="Transmettre la demande officielle par messagerie au support 3636"
									>
										<Mail class="size-3.5" />
										<span>Transmettre au Support 3636</span>
									</a>

									<!-- Action directe SANDBOX -->
									<button
										type="submit"
										class="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 px-3.5 py-2 text-xs font-bold shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed transition"
										disabled={!canProceedToConfirm}
										title="Enregistrer directement dans la base SANDBOX"
									>
										{#if formMode === 'edit'}
											<Check class="size-3.5 text-amber-600" />
											<span>Écrire en direct (SANDBOX)</span>
										{:else}
											<Database class="size-3.5 text-corporate-700" />
											<span>Écrire en direct (SANDBOX)</span>
										{/if}
									</button>
								</div>
							</div>
						</form>

					<!-- ÉTAPE 2 : GARDE-FOU & CONFIRMATION AVANT ÉCRITURE DIRECTE -->
					{:else}
						<div class="rounded-xl border-2 border-corporate-300 bg-white p-4 space-y-3">
							<div class="flex items-center gap-2 text-corporate-900 font-extrabold text-sm pb-2 border-b border-corporate-100">
								<ShieldCheck class="size-5 text-corporate-700 shrink-0" />
								<span>Validation de responsabilité avant écriture dans Sage X3</span>
							</div>

							<div class="text-xs text-slate-700 space-y-2">
								<p>
									Veuillez vérifier les informations ci-dessous. En confirmant, cette écriture sera enregistrée avec votre identifiant :
								</p>
								<div class="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1.5 font-medium">
									<div>
										<span class="text-slate-500">Demandeur & Service :</span>
										<strong class="text-corporate-900">{requesterName}</strong>
									</div>
									<div>
										<span class="text-slate-500">Motif de la demande :</span>
										<strong class="text-slate-900">{formReason}</strong>
									</div>
									<div>
										<span class="text-slate-500">Table diverse cible :</span>
										<strong class="text-slate-900">Table #{table.numtab} ({table.title})</strong>
									</div>
									<div>
										<span class="text-slate-500">Code technique X3 :</span>
										<strong class="font-mono text-corporate-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">{formCode}</strong>
									</div>
									<div>
										<span class="text-slate-500">Désignation complète :</span>
										<strong class="text-slate-900">{formLabel}</strong>
									</div>
									<div>
										<span class="text-slate-500">Libellé court :</span>
										<strong class="text-slate-900">{(formShortLabel || formLabel).slice(0, 12)}</strong>
									</div>
									<div>
										<span class="text-slate-500">Environnement :</span>
										<strong class="text-amber-900">Base SANDBOX (FRVDRVMAS46)</strong>
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
										<span>Connexion et écriture en base...</span>
									{:else}
										<Database class="size-4" />
										<span>Confirmer l'écriture directe</span>
									{/if}
								</button>
							</div>
						</div>
					{/if}

					<!-- Résultat / Notification -->
					{#if submitResult}
						<div class="rounded-xl border-2 p-3.5 text-xs {
							submitResult.success
								? 'border-emerald-300 bg-emerald-50 text-emerald-950 font-semibold'
								: 'border-rose-300 bg-rose-50 text-rose-950'
						}">
							<div class="flex items-start gap-2.5">
								{#if submitResult.success}
									<CheckCircle2 class="size-5 text-emerald-600 shrink-0 mt-0.5" />
									<div class="space-y-1">
										<p class="font-bold">{submitResult.message}</p>
										<p class="text-[11px] text-emerald-800 font-normal">
											L'entrée a été enregistrée avec traçabilité dans Sage X3 SANDBOX.
										</p>
									</div>
								{:else}
									<AlertCircle class="size-5 text-rose-600 shrink-0 mt-0.5" />
									<div class="space-y-2 flex-1">
										<p class="font-bold">L'enregistrement direct a échoué :</p>
										<p class="text-rose-900 font-medium bg-white/80 p-2.5 rounded-lg border border-rose-200 leading-relaxed">
											{submitResult.error}
										</p>
										<div class="pt-1 flex items-center gap-2">
											<a
												href={mailHref}
												class="inline-flex items-center gap-1.5 rounded-lg bg-corporate-700 hover:bg-corporate-800 text-white px-3 py-1.5 text-xs font-bold shadow-xs transition"
											>
												<Mail class="size-3.5" />
												<span>Transmettre cette demande au Support 3636</span>
											</a>
										</div>
									</div>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>
