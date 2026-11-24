<script lang="ts">
	import {
		CheckCircle2,
		ChevronDown,
		ChevronRight,
		CircleHelp,
		FileText,
		Folder,
		FolderOpen,
		ListChecks,
		Search,
		SlidersHorizontal,
		Trash2,
		X
	} from 'lucide-svelte';
	import { categoryMeta, type CategoryName } from '$lib/data/categoryMeta';
	import type { FieldDefinition, MatchResults } from '$lib/types';

	type Props = {
		categories: CategoryName[];
		groupedFields: Record<string, Record<string, FieldDefinition[]>>;
		selectedCodes: string[];
		selectedFields: FieldDefinition[];
		searchTerm: string;
		matchResults: MatchResults;
		activeCategoryFilter: CategoryName | null;
		onToggleField: (code: string) => void;
		onClearSelection: () => void;
		onOpenResults: () => void;
		onSearchChange: (value: string) => void;
		onSelectCategoryFilter: (category: CategoryName | null) => void;
	};

	let {
		categories,
		groupedFields,
		selectedCodes,
		selectedFields,
		searchTerm,
		matchResults,
		activeCategoryFilter,
		onToggleField,
		onClearSelection,
		onOpenResults,
		onSearchChange,
		onSelectCategoryFilter
	}: Props = $props();

	let expandedCategories = $state<CategoryName[]>([]);
	let expandedGroups = $state<string[]>([]);
	let didPrimeCategories = false;

	const isSelected = (code: string) => selectedCodes.includes(code);
	const categoryKey = (category: CategoryName) => category;
	const groupKey = (category: CategoryName, groupName: string) => `${category}::${groupName}`;
	const isCategoryExpanded = (category: CategoryName) => expandedCategories.includes(categoryKey(category));
	const isGroupExpanded = (category: CategoryName, groupName: string) =>
		expandedGroups.includes(groupKey(category, groupName));

	function toggleCategory(category: CategoryName) {
		expandedCategories = isCategoryExpanded(category)
			? expandedCategories.filter((entry) => entry !== categoryKey(category))
			: [...expandedCategories, categoryKey(category)];
	}

	function toggleGroup(category: CategoryName, groupName: string) {
		const key = groupKey(category, groupName);
		expandedGroups = isGroupExpanded(category, groupName)
			? expandedGroups.filter((entry) => entry !== key)
			: [...expandedGroups, key];
	}

	function expandAll() {
		expandedCategories = categories.filter((category) => countFields(category) > 0);
		expandedGroups = categories.flatMap((category) =>
			Object.keys(groupedFields[category] ?? {}).map((groupName) => groupKey(category, groupName))
		);
	}

	function collapseAll() {
		expandedCategories = [];
		expandedGroups = [];
	}

	const countFields = (category: CategoryName) =>
		Object.values(groupedFields[category] ?? {}).reduce((total, fields) => total + fields.length, 0);
	const countGroups = (category: CategoryName) => Object.keys(groupedFields[category] ?? {}).length;
	const countSelectedInCategory = (category: CategoryName) =>
		Object.values(groupedFields[category] ?? {})
			.flat()
			.filter((field) => selectedCodes.includes(field.code)).length;

	const totalVisible = $derived(
		categories.reduce((total, category) => {
			if (activeCategoryFilter && activeCategoryFilter !== category) {
				return total;
			}
			return total + countFields(category);
		}, 0)
	);

	const visibleCategories = $derived(
		activeCategoryFilter ? [activeCategoryFilter] : categories
	);

	$effect(() => {
		if (!didPrimeCategories && categories.length > 0) {
			expandedCategories = categories;
			didPrimeCategories = true;
		}

		if (!searchTerm.trim()) {
			return;
		}

		expandedCategories = categories.filter((category) => countFields(category) > 0);
		expandedGroups = categories.flatMap((category) =>
			Object.keys(groupedFields[category] ?? {}).map((groupName) => groupKey(category, groupName))
		);
	});
</script>

<section class="grid gap-6 lg:grid-cols-[minmax(20rem,24rem),1fr] pb-16 lg:pb-0">
	<!-- Aside: Guide & Sélection -->
	<aside class="space-y-4 lg:sticky lg:top-20 lg:self-start">
		<div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
			<div class="flex items-center justify-between">
				<p class="text-xs font-semibold uppercase tracking-[0.2em] text-corporate-600">IRIS</p>
				<span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
					Sage X3 Valdepharm
				</span>
			</div>
			<h1 class="mt-2 text-xl font-semibold text-slate-950">Trouver la bonne requête X3</h1>
			<p class="mt-2 text-xs leading-5 text-slate-600">
				Recherchez vos champs par libellé ou code technique, cochez les données attendues, puis consultez les requêtes correspondantes.
			</p>

			<div class="mt-4 grid gap-2 text-xs">
				<div class="flex items-start gap-2.5 rounded-lg bg-slate-50 p-2.5 text-slate-700">
					<Search class="mt-0.5 size-3.5 shrink-0 text-corporate-700" />
					<span>1. Chercher par libellé, code, table ou mot-clé.</span>
				</div>
				<div class="flex items-start gap-2.5 rounded-lg bg-slate-50 p-2.5 text-slate-700">
					<ListChecks class="mt-0.5 size-3.5 shrink-0 text-corporate-700" />
					<span>2. Sélectionner uniquement les champs nécessaires.</span>
				</div>
				<div class="flex items-start gap-2.5 rounded-lg bg-slate-50 p-2.5 text-slate-700">
					<CheckCircle2 class="mt-0.5 size-3.5 shrink-0 text-corporate-700" />
					<span>3. Consulter les requêtes existantes ou le fallback 3636.</span>
				</div>
			</div>
		</div>

		<!-- Panneau de sélection courante -->
		<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
			<div class="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
				<div>
					<p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Sélection</p>
					<p class="text-base font-semibold text-slate-950">{selectedCodes.length} champ(s) retenu(s)</p>
				</div>
				<button
					class="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-corporate-200 hover:text-corporate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
					type="button"
					disabled={selectedCodes.length === 0}
					onclick={onClearSelection}
					title="Vider la sélection"
					aria-label="Vider la sélection"
				>
					<Trash2 class="size-3.5" />
				</button>
			</div>

			<!-- Indicateur de matching dynamique en direct -->
			{#if selectedCodes.length > 0}
				<div class="mt-3 rounded-lg border p-3 text-xs {
					matchResults.totalExact > 0
						? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
						: matchResults.totalPartial > 0
							? 'border-amber-200 bg-amber-50/70 text-amber-950'
							: 'border-slate-200 bg-slate-50 text-slate-700'
				}">
					{#if matchResults.totalExact > 0}
						<div class="flex items-center gap-1.5 font-semibold text-emerald-900">
							<CheckCircle2 class="size-3.5 text-emerald-600" />
							<span>{matchResults.totalExact} requête(s) exacte(s) trouvée(s)</span>
						</div>
						<p class="mt-1 text-[11px] text-emerald-800">
							Couverture à 100% de vos {selectedCodes.length} critère(s).
						</p>
					{:else if matchResults.totalPartial > 0}
						<div class="flex items-center gap-1.5 font-semibold text-amber-900">
							<CircleHelp class="size-3.5 text-amber-600" />
							<span>0 exacte · {matchResults.totalPartial} requête(s) approchante(s)</span>
						</div>
						<p class="mt-1 text-[11px] text-amber-800">
							Des requêtes couvrent une partie de votre sélection.
						</p>
					{:else}
						<div class="flex items-center gap-1.5 font-semibold text-slate-800">
							<CircleHelp class="size-3.5 text-slate-500" />
							<span>Aucune requête existante</span>
						</div>
						<p class="mt-1 text-[11px] text-slate-600">
							Le ticket support 3636 est prêt à être envoyé.
						</p>
					{/if}
				</div>
			{/if}

			{#if selectedFields.length > 0}
				<div class="mt-3 max-h-52 space-y-1.5 overflow-y-auto pr-1">
					{#each selectedFields as field}
						<div class="group flex items-start gap-2 rounded-lg border border-corporate-100 bg-corporate-50/80 px-2.5 py-1.5 text-xs transition hover:border-corporate-200">
							<div class="min-w-0 flex-1">
								<p class="truncate font-semibold text-corporate-900">{field.label}</p>
								<p class="truncate text-[10px] text-corporate-700">{field.code} · {field.table}</p>
							</div>
							<button
								class="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded text-corporate-700 transition hover:bg-white"
								type="button"
								onclick={() => onToggleField(field.code)}
								title={`Retirer ${field.label}`}
								aria-label={`Retirer ${field.label}`}
							>
								<X class="size-3" />
							</button>
						</div>
					{/each}
				</div>
			{:else}
				<div class="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600">
					Aucun champ sélectionné. Cochez les informations attendues dans le catalogue pour évaluer la couverture des requêtes.
				</div>
			{/if}

			<button
				class="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 enabled:bg-corporate-600 enabled:hover:bg-corporate-700 shadow-sm"
				type="button"
				disabled={selectedCodes.length === 0}
				onclick={onOpenResults}
			>
				<CheckCircle2 class="size-4" />
				{#if selectedCodes.length === 0}
					Sélectionner des champs
				{:else if matchResults.totalExact > 0}
					Voir les résultats ({matchResults.totalExact})
				{:else if matchResults.totalPartial > 0}
					Voir les résultats ({matchResults.totalPartial} proches)
				{:else}
					Consulter la solution / 3636
				{/if}
			</button>
		</div>
	</aside>

	<!-- Section principale : Catalogue des champs -->
	<div class="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
		<!-- En-tête avec Recherche et Filtres -->
		<div class="border-b border-slate-200 p-5 space-y-4">
			<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.18em] text-corporate-600">Catalogue métier</p>
					<h2 class="mt-1 text-xl font-semibold text-slate-950">Champs et tables Sage X3</h2>
				</div>

				<!-- Barre de recherche avec bouton effacer -->
				<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
					<div class="relative min-w-0 sm:min-w-[22rem]">
						<Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
						<input
							class="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 py-2.5 text-sm outline-none transition focus:border-corporate-500 focus:ring-2 focus:ring-corporate-100"
							type="search"
							placeholder="Rechercher par libellé, code, table..."
							value={searchTerm}
							oninput={(event) => onSearchChange((event.currentTarget as HTMLInputElement).value)}
						/>
						{#if searchTerm.trim()}
							<button
								type="button"
								class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
								onclick={() => onSearchChange('')}
								title="Effacer la recherche"
								aria-label="Effacer la recherche"
							>
								<X class="size-3.5" />
							</button>
						{/if}
					</div>

					<div class="flex items-center gap-2">
						<button
							class="flex-1 sm:flex-none rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-corporate-200 hover:bg-slate-50"
							type="button"
							onclick={expandAll}
						>
							Tout ouvrir
						</button>
						<button
							class="flex-1 sm:flex-none rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-corporate-200 hover:bg-slate-50"
							type="button"
							onclick={collapseAll}
						>
							Tout fermer
						</button>
					</div>
				</div>
			</div>

			<!-- Filtres rapides par catégorie (Domain Chips) -->
			<div class="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
				<button
					type="button"
					class="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition {
						activeCategoryFilter === null
							? 'bg-corporate-600 text-white shadow-sm'
							: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
					}"
					onclick={() => onSelectCategoryFilter(null)}
				>
					<span>Toutes</span>
				</button>

				{#each categories as category}
					{@const totalCat = countFields(category)}
					{@const selectedCat = countSelectedInCategory(category)}
					<button
						type="button"
						class="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition {
							activeCategoryFilter === category
								? 'bg-corporate-600 text-white shadow-sm'
								: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
						}"
						onclick={() => onSelectCategoryFilter(activeCategoryFilter === category ? null : category)}
					>
						<span>{category}</span>
						<span class="rounded-full px-1.5 py-0.2 text-[10px] {
							activeCategoryFilter === category ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
						}">
							{totalCat}
						</span>
						{#if selectedCat > 0}
							<span class="rounded-full bg-emerald-500 size-2" title={`${selectedCat} sélectionné(s)`}></span>
						{/if}
					</button>
				{/each}
			</div>

			<!-- Compteurs contextuels -->
			<div class="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
				<span class="rounded-full bg-slate-100 px-2.5 py-1">{totalVisible} champ(s) affiché(s)</span>
				<span class="rounded-full bg-slate-100 px-2.5 py-1">{selectedCodes.length} sélectionné(s)</span>
				<span class="inline-flex items-center gap-1 rounded-full bg-corporate-50 px-2.5 py-1 text-corporate-800">
					<CircleHelp class="size-3" />
					Cochez un ou plusieurs champs pour identifier les requêtes associées
				</span>
			</div>
		</div>

		<!-- Liste des champs organisés par catégorie et dossier -->
		<div class="max-h-[calc(100vh-14rem)] overflow-y-auto p-4 sm:p-5">
			{#if visibleCategories.every((category) => countFields(category) === 0)}
				<div class="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
					<p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Aucun résultat</p>
					<p class="mt-2 text-sm text-slate-600">
						Aucun champ ne correspond à votre recherche "{searchTerm}". Essayez un autre mot-clé ou réinitialisez le filtre.
					</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each visibleCategories as category}
						{@const meta = categoryMeta[category]}
						{@const totalInCategory = countFields(category)}
						{@const selectedInCategory = countSelectedInCategory(category)}
						{#if totalInCategory > 0}
							<div class="overflow-hidden rounded-xl border border-slate-200 bg-white">
								<button
									type="button"
									class="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
									onclick={() => toggleCategory(category)}
								>
									{#if isCategoryExpanded(category)}
										<ChevronDown class="size-4 text-slate-400" />
										<FolderOpen class="size-4 text-corporate-700" />
									{:else}
										<ChevronRight class="size-4 text-slate-400" />
										<Folder class="size-4 text-corporate-700" />
									{/if}
									<div class="min-w-0 flex-1">
										<p class="truncate text-sm font-semibold text-slate-950">{meta.title}</p>
										<p class="truncate text-xs text-slate-500">{meta.description}</p>
									</div>
									{#if selectedInCategory > 0}
										<span class="rounded-full bg-corporate-600 px-2.5 py-0.5 text-xs font-semibold text-white">
											{selectedInCategory} choisi(s)
										</span>
									{/if}
									<span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
										{countGroups(category)} dossier(s)
									</span>
									<span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
										{totalInCategory} champ(s)
									</span>
								</button>

								{#if isCategoryExpanded(category)}
									<div class="space-y-2 border-t border-slate-200 bg-slate-50/70 p-3">
										{#each Object.entries(groupedFields[category] ?? {}) as [groupName, fields]}
											{@const selectedInGroup = fields.filter(f => isSelected(f.code)).length}
											<div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
												<button
													type="button"
													class="flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-slate-50"
													onclick={() => toggleGroup(category, groupName)}
												>
													{#if isGroupExpanded(category, groupName)}
														<ChevronDown class="size-3.5 text-slate-400" />
														<FolderOpen class="size-3.5 text-slate-600" />
													{:else}
														<ChevronRight class="size-3.5 text-slate-400" />
														<Folder class="size-3.5 text-slate-600" />
													{/if}
													<p class="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800">
														Table : {groupName}
													</p>
													{#if selectedInGroup > 0}
														<span class="rounded-full bg-corporate-100 px-2 py-0.2 text-[11px] font-semibold text-corporate-800">
															{selectedInGroup} sélectionné(s)
														</span>
													{/if}
													<span class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
														{fields.length}
													</span>
												</button>

												{#if isGroupExpanded(category, groupName)}
													<div class="grid gap-2.5 border-t border-slate-100 p-3 md:grid-cols-2 2xl:grid-cols-3 bg-slate-50/40">
														{#each fields as field}
															<label
																class="flex min-h-[7.5rem] cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition select-none {
																	isSelected(field.code)
																		? 'border-corporate-400 bg-corporate-50/70 shadow-sm ring-1 ring-corporate-200'
																		: 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
																}"
															>
																<input
																	class="mt-0.5 size-4 rounded border-slate-300 text-corporate-600 focus:ring-corporate-300"
																	type="checkbox"
																	checked={isSelected(field.code)}
																	onchange={() => onToggleField(field.code)}
																/>
																<div class="min-w-0 flex-1">
																	<div class="flex items-start justify-between gap-1.5">
																		<div class="min-w-0">
																			<p class="text-xs font-semibold leading-tight text-slate-950">
																				{field.label}
																			</p>
																			<p class="mt-0.5 font-mono text-[11px] font-medium uppercase text-slate-500">
																				{field.code}
																			</p>
																		</div>
																		{#if isSelected(field.code)}
																			<CheckCircle2 class="size-4 shrink-0 text-corporate-600" />
																		{/if}
																	</div>
																	<p class="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-slate-600">
																		{field.description}
																	</p>
																	<div class="mt-2 flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
																		<span class="rounded bg-slate-100 px-1.5 py-0.5 font-mono">
																			{field.table}
																		</span>
																		{#each field.keywords.slice(0, 2) as keyword}
																			<span class="rounded bg-slate-100 px-1.5 py-0.5">
																				{keyword}
																			</span>
																		{/each}
																	</div>
																</div>
															</label>
														{/each}
													</div>
												{/if}
											</div>
										{/each}
									</div>
								{/if}
							</div>
						{/if}
					{/each}
				</div>
			{/if}
		</div>
	</div>
</section>

<!-- Barre flottante mobile / tablette -->
{#if selectedCodes.length > 0}
	<div class="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur border-t border-slate-200 shadow-xl z-40 flex items-center justify-between gap-3">
		<div class="min-w-0">
			<p class="text-xs font-semibold text-slate-900 truncate">
				{selectedCodes.length} champ(s) sélectionné(s)
			</p>
			<p class="text-[11px] text-slate-600 truncate">
				{#if matchResults.totalExact > 0}
					{matchResults.totalExact} requête(s) exacte(s)
				{:else if matchResults.totalPartial > 0}
					{matchResults.totalPartial} requête(s) proche(s)
				{:else}
					0 requête (ticket 3636 prêt)
				{/if}
			</p>
		</div>
		<button
			class="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-corporate-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-corporate-700"
			type="button"
			onclick={onOpenResults}
		>
			<CheckCircle2 class="size-3.5" />
			Voir les résultats
		</button>
	</div>
{/if}
