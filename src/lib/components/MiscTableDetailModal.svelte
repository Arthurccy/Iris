<script lang="ts">
	import {
		AlertCircle,
		Check,
		CheckCircle2,
		Clipboard,
		FileText,
		Layers,
		Mail,
		Plus,
		Search,
		ShieldCheck,
		X
	} from 'lucide-svelte';
	import type { MiscTableDefinition } from '$lib/types';

	type Props = {
		table: MiscTableDefinition;
		fallbackMailTo?: string;
		onClose: () => void;
	};

	let { table, fallbackMailTo = '3636.valdepharm@fareva.com', onClose }: Props = $props();

	let itemSearch = $state('');
	let isFormOpen = $state(false);
	let newCode = $state('');
	let newShortLabel = $state('');
	let newLabel = $state('');
	let newReason = $state('');
	let requesterName = $state('');
	let copiedCode = $state<string | null>(null);
	let requestSentNotice = $state(false);

	const filteredItems = $derived.by(() => {
		const term = itemSearch.trim().toLowerCase();
		if (!term) return table.items;
		return table.items.filter(
			(item) =>
				item.code.toLowerCase().includes(term) ||
				item.shortLabel.toLowerCase().includes(term) ||
				item.label.toLowerCase().includes(term)
		);
	});

	const isCodeDuplicate = $derived.by(() => {
		const clean = newCode.trim().toUpperCase();
		if (!clean) return false;
		return table.items.some((item) => item.code.toUpperCase() === clean);
	});

	const canSubmitRequest = $derived(
		newCode.trim().length >= 2 &&
		newLabel.trim().length >= 3 &&
		newReason.trim().length >= 5 &&
		!isCodeDuplicate
	);

	const mailHref = $derived.by(() => {
		const subject = `[IRIS - Table Diverse #${table.numtab} ${table.name}] Demande d'ajout de valeur : ${newCode.trim().toUpperCase()}`;
		const body = [
			'Bonjour,',
			'',
			`Dans le cadre de l'utilisation de Sage X3, je demande l'ajout d'une nouvelle valeur dans la table diverse suivante :`,
			`- Table diverse : #${table.numtab} (${table.name}) - ${table.title}`,
			`- Domaine : ${table.category}`,
			`- Champs associés : ${table.usedInFields.join(', ')}`,
			'',
			'Détails de la nouvelle valeur demandée :',
			`- Code (X3) : ${newCode.trim().toUpperCase()}`,
			`- Libellé court : ${newShortLabel.trim() || newLabel.trim().slice(0, 15)}`,
			`- Libellé long : ${newLabel.trim()}`,
			`- Motif / Justification métier : ${newReason.trim()}`,
			`- Demandeur : ${requesterName.trim() || 'Utilisateur métier'}`,
			'',
			'Merci de procéder à la création dans la fonction GESTDU de Sage X3.',
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

	function handleFormSubmit(e: Event) {
		e.preventDefault();
		if (!canSubmitRequest) return;
		// Open email client
		window.location.href = mailHref;
		requestSentNotice = true;
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
						Table diverse #{table.numtab} · {table.name}
					</span>
					<span class="rounded bg-slate-200 text-slate-700 text-[11px] font-medium px-2 py-0.5">
						{table.category}
					</span>
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
			<!-- Métadonnées & Contexte X3 -->
			<div class="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs space-y-3">
				<p class="text-slate-700 leading-relaxed">{table.description}</p>
				<div class="grid gap-3 sm:grid-cols-2 pt-2 border-t border-slate-200/80 text-[11px]">
					<div>
						<p class="font-semibold text-slate-900 mb-1">Champs Sage X3 qui utilisent cette table :</p>
						<div class="flex flex-wrap gap-1">
							{#each table.usedInFields as fieldCode}
								<span class="rounded bg-white border border-slate-200 font-mono px-2 py-0.5 text-slate-700">
									{fieldCode}
								</span>
							{/each}
						</div>
					</div>
					<div>
						<p class="font-semibold text-slate-900 mb-1">Écrans et fonctions X3 associés :</p>
						<div class="flex flex-wrap gap-1">
							{#each table.usedInScreens as screenName}
								<span class="rounded bg-white border border-slate-200 px-2 py-0.5 text-slate-700">
									{screenName}
								</span>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Barre d'outils du tableau : recherche + bouton d'ajout -->
			<div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
				<div class="relative flex-1 max-w-sm">
					<Search class="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
					<input
						class="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs outline-none transition focus:border-corporate-500 focus:ring-1 focus:ring-corporate-200"
						type="search"
						placeholder="Filtrer parmi les valeurs..."
						bind:value={itemSearch}
					/>
				</div>

				<div class="flex items-center gap-2">
					<span class="text-xs text-slate-500">
						{filteredItems.length} valeur(s)
					</span>
					<button
						type="button"
						class="inline-flex items-center gap-1.5 rounded-lg bg-corporate-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-corporate-700"
						onclick={() => (isFormOpen = !isFormOpen)}
					>
						{#if isFormOpen}
							<X class="size-3.5" />
							<span>Masquer le formulaire</span>
						{:else}
							<Plus class="size-3.5" />
							<span>Proposer une nouvelle valeur</span>
						{/if}
					</button>
				</div>
			</div>

			<!-- Formulaire de demande d'ajout (Proposer une valeur) -->
			{#if isFormOpen}
				<div class="rounded-xl border border-corporate-200 bg-corporate-50/50 p-4 transition-all">
					<div class="flex items-center justify-between pb-2 border-b border-corporate-200/60 mb-3">
						<div class="flex items-center gap-2">
							<Plus class="size-4 text-corporate-700" />
							<h3 class="text-xs font-semibold uppercase tracking-wider text-corporate-900">
								Demande d'ajout d'une valeur dans la table #{table.numtab} ({table.name})
							</h3>
						</div>
						<span class="text-[11px] text-corporate-700">Génération d'un ticket normalisé 3636</span>
					</div>

					<form onsubmit={handleFormSubmit} class="space-y-3 text-xs">
						<div class="grid gap-3 sm:grid-cols-3">
							<div>
								<label for="newCode" class="block font-semibold text-slate-800 mb-1">
									Nouveau Code X3 <span class="text-rose-500">*</span>
								</label>
								<input
									id="newCode"
									type="text"
									class="w-full rounded border px-2.5 py-1.5 font-mono uppercase transition {
										isCodeDuplicate
											? 'border-rose-400 bg-rose-50 text-rose-900'
											: 'border-slate-200 bg-white text-slate-900 focus:border-corporate-500'
									}"
									placeholder="Ex: REB_AUTO"
									maxlength="15"
									bind:value={newCode}
								/>
								{#if isCodeDuplicate}
									<p class="mt-1 text-[11px] text-rose-600 font-medium">
										Ce code existe déjà dans la table #{table.numtab}.
									</p>
								{:else}
									<p class="mt-1 text-[10px] text-slate-500">Max 15 caractères, sans espace.</p>
								{/if}
							</div>

							<div>
								<label for="newShortLabel" class="block font-semibold text-slate-800 mb-1">
									Libellé court (15 car.)
								</label>
								<input
									id="newShortLabel"
									type="text"
									class="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-slate-900 focus:border-corporate-500"
									placeholder="Ex: Rebut auto"
									maxlength="15"
									bind:value={newShortLabel}
								/>
								<p class="mt-1 text-[10px] text-slate-500">Utilisé dans les listes compactes.</p>
							</div>

							<div>
								<label for="requesterName" class="block font-semibold text-slate-800 mb-1">
									Votre nom / service
								</label>
								<input
									id="requesterName"
									type="text"
									class="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-slate-900 focus:border-corporate-500"
									placeholder="Ex: J. Dupont (Production)"
									bind:value={requesterName}
								/>
							</div>
						</div>

						<div>
							<label for="newLabel" class="block font-semibold text-slate-800 mb-1">
								Libellé long officiel <span class="text-rose-500">*</span>
							</label>
							<input
								id="newLabel"
								type="text"
								class="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-slate-900 focus:border-corporate-500"
								placeholder="Ex: Rebut automatique détecté par le système de vision"
								bind:value={newLabel}
							/>
						</div>

						<div>
							<label for="newReason" class="block font-semibold text-slate-800 mb-1">
								Motif / Justification métier du besoin <span class="text-rose-500">*</span>
							</label>
							<textarea
								id="newReason"
								rows="2"
								class="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-slate-900 focus:border-corporate-500"
								placeholder="Expliquez pourquoi cette nouvelle option est nécessaire en production ou en qualité..."
								bind:value={newReason}
							></textarea>
						</div>

						<div class="flex items-center justify-between pt-2">
							<p class="text-[11px] text-slate-500">
								* Champs obligatoires. Le ticket sera envoyé vers {fallbackMailTo}.
							</p>

							<div class="flex items-center gap-2">
								<button
									type="button"
									class="rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
									onclick={() => (isFormOpen = false)}
								>
									Annuler
								</button>

								<button
									type="submit"
									class="inline-flex items-center gap-1.5 rounded bg-corporate-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-corporate-700 disabled:opacity-40 disabled:cursor-not-allowed"
									disabled={!canSubmitRequest}
								>
									<Mail class="size-3.5" />
									<span>Transmettre la demande</span>
								</button>
							</div>
						</div>
					</form>

					{#if requestSentNotice}
						<div class="mt-3 rounded border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-900 flex items-center gap-2">
							<CheckCircle2 class="size-4 text-emerald-600 shrink-0" />
							<span>Votre client de messagerie a été ouvert avec les informations préremplies.</span>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Tableau des entrées existantes -->
			<div class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
				<table class="w-full text-left text-xs border-collapse">
					<thead>
						<tr class="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
							<th class="py-2.5 px-3">Code X3</th>
							<th class="py-2.5 px-3">Libellé court</th>
							<th class="py-2.5 px-3">Libellé long officiel</th>
							<th class="py-2.5 px-3 text-center">Statut</th>
							<th class="py-2.5 px-3 text-right">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100">
						{#if filteredItems.length === 0}
							<tr>
								<td colspan="5" class="py-8 text-center text-slate-500">
									Aucune valeur ne correspond à votre filtre "{itemSearch}".
								</td>
							</tr>
						{:else}
							{#each filteredItems as item}
								<tr class="hover:bg-slate-50/70 transition">
									<td class="py-2.5 px-3 font-mono font-semibold text-slate-900">
										<span class="rounded bg-slate-100 px-1.5 py-0.5">
											{item.code}
										</span>
									</td>
									<td class="py-2.5 px-3 text-slate-700">
										{item.shortLabel}
									</td>
									<td class="py-2.5 px-3 text-slate-900 font-medium">
										{item.label}
									</td>
									<td class="py-2.5 px-3 text-center">
										{#if item.isActive}
											<span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
												<span class="size-1.5 rounded-full bg-emerald-500"></span>
												Actif
											</span>
										{:else}
											<span class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
												Inactif
											</span>
										{/if}
									</td>
									<td class="py-2.5 px-3 text-right">
										<button
											type="button"
											class="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-[11px] text-slate-600 hover:border-corporate-200 hover:text-corporate-700 transition"
											onclick={() => copyCode(item.code)}
											title="Copier le code technique"
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
