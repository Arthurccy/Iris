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
		Trash2,
		X
	} from 'lucide-svelte';
	import { categoryMeta, type CategoryName } from '$lib/data/categoryMeta';
	import type { FieldDefinition } from '$lib/types';

	type Props = {
		categories: CategoryName[];
		groupedFields: Record<string, Record<string, FieldDefinition[]>>;
		selectedCodes: string[];
		selectedFields: FieldDefinition[];
		searchTerm: string;
		onToggleField: (code: string) => void;
		onClearSelection: () => void;
		onOpenResults: () => void;
		onSearchChange: (value: string) => void;
	};

	let {
		categories,
		groupedFields,
		selectedCodes,
		selectedFields,
		searchTerm,
		onToggleField,
		onClearSelection,
		onOpenResults,
		onSearchChange
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

	const totalVisible = $derived(categories.reduce((total, category) => total + countFields(category), 0));

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

<section class="grid gap-4 lg:grid-cols-[minmax(19rem,24rem),1fr]">
	<aside class="space-y-4 lg:sticky lg:top-6 lg:self-start">
		<div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.18em] text-corporate-600">IRIS</p>
			<h1 class="mt-2 text-2xl font-semibold text-slate-950">Trouver la bonne requête X3</h1>
			<p class="mt-3 text-sm leading-6 text-slate-600">
				Recherchez un champ métier, cochez les informations attendues, puis consultez les requêtes qui
				couvrent votre besoin.
			</p>

			<div class="mt-5 grid gap-2 text-sm">
				<div class="flex items-start gap-3 rounded-md bg-slate-50 p-3">
					<Search class="mt-0.5 size-4 text-corporate-700" />
					<span>1. Chercher par libellé, code, table ou mot-clé.</span>
				</div>
				<div class="flex items-start gap-3 rounded-md bg-slate-50 p-3">
					<ListChecks class="mt-0.5 size-4 text-corporate-700" />
					<span>2. Sélectionner uniquement les champs indispensables.</span>
				</div>
				<div class="flex items-start gap-3 rounded-md bg-slate-50 p-3">
					<CheckCircle2 class="mt-0.5 size-4 text-corporate-700" />
					<span>3. Lancer les résultats ou préparer une demande 3636.</span>
				</div>
			</div>
		</div>

		<div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
			<div class="flex items-center justify-between gap-3">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sélection</p>
					<p class="text-lg font-semibold text-slate-950">{selectedCodes.length} champ(s)</p>
				</div>
				<button
					class="inline-flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition-all duration-300 hover:border-corporate-200 hover:text-corporate-700 hover:shadow hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
					type="button"
					disabled={selectedCodes.length === 0}
					onclick={onClearSelection}
					title="Vider la sélection"
					aria-label="Vider la sélection"
				>
					<Trash2 class="size-4" />
				</button>
			</div>

			{#if selectedFields.length > 0}
				<div class="mt-4 max-h-56 space-y-2 overflow-y-auto pr-1">
					{#each selectedFields as field}
						<div class="group flex items-start gap-2 rounded-md border border-corporate-100 bg-corporate-50 px-3 py-2 transition-all duration-300 hover:shadow-md hover:border-corporate-200">
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-semibold text-corporate-950">{field.label}</p>
								<p class="truncate text-xs text-corporate-700">{field.code} · {field.table}</p>
							</div>
							<button
								class="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md text-corporate-700 transition hover:bg-white"
								type="button"
								onclick={() => onToggleField(field.code)}
								title="Retirer ce champ"
								aria-label={`Retirer ${field.label}`}
							>
								<X class="size-3.5" />
							</button>
						</div>
					{/each}
				</div>
			{:else}
				<div class="mt-4 rounded-md border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
					Aucun champ sélectionné. Commencez par une recherche simple comme “lot”, “article” ou “stock”.
				</div>
			{/if}

			<button
				class="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:shadow-md hover:scale-[1.02] disabled:hover:scale-100 disabled:hover:shadow-none disabled:cursor-not-allowed disabled:bg-slate-300 enabled:bg-corporate-600 enabled:hover:bg-corporate-700"
				type="button"
				disabled={selectedCodes.length === 0}
				onclick={onOpenResults}
			>
				<CheckCircle2 class="size-4" />
				Voir les résultats
			</button>
		</div>
	</aside>

	<div class="rounded-lg border border-slate-200 bg-white shadow-sm">
		<div class="border-b border-slate-200 p-5">
			<div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.18em] text-corporate-600">Catalogue métier</p>
					<h2 class="mt-1 text-xl font-semibold text-slate-950">Champs Sage X3</h2>
					<p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
						Les familles et dossiers servent de repères. La recherche ouvre automatiquement les dossiers
						qui contiennent des résultats.
					</p>
				</div>

				<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
					<label class="relative block min-w-0 sm:min-w-[20rem]">
						<Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
						<input
							class="w-full rounded-md border border-slate-200 bg-white px-10 py-3 text-sm outline-none transition focus:border-corporate-300 focus:ring-4 focus:ring-corporate-100"
							type="search"
							placeholder="Code, libellé, table..."
							value={searchTerm}
							oninput={(event) => onSearchChange((event.currentTarget as HTMLInputElement).value)}
						/>
					</label>
					<button
						class="rounded-md border border-slate-200 px-3 py-3 text-sm font-medium text-slate-700 transition hover:border-corporate-200 hover:text-corporate-700"
						type="button"
						onclick={expandAll}
					>
						Tout ouvrir
					</button>
					<button
						class="rounded-md border border-slate-200 px-3 py-3 text-sm font-medium text-slate-700 transition hover:border-corporate-200 hover:text-corporate-700"
						type="button"
						onclick={collapseAll}
					>
						Tout fermer
					</button>
				</div>
			</div>

			<div class="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
				<span class="rounded-full bg-slate-100 px-3 py-1">{totalVisible} champ(s) visible(s)</span>
				<span class="rounded-full bg-slate-100 px-3 py-1">{selectedCodes.length} sélectionné(s)</span>
				<span class="inline-flex items-center gap-1 rounded-full bg-corporate-50 px-3 py-1 text-corporate-800">
					<CircleHelp class="size-3.5" />
					Une requête peut contenir plus de champs que votre sélection.
				</span>
			</div>
		</div>

		<div class="max-h-[calc(100vh-9rem)] overflow-y-auto p-3 sm:p-4">
			{#if categories.every((category) => countFields(category) === 0)}
				<div class="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
					<p class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Aucun résultat</p>
					<p class="mt-2 text-sm leading-6 text-slate-600">
						Aucun champ ne correspond à votre recherche. Essayez un autre mot-clé.
					</p>
				</div>
			{:else}
				<div class="space-y-2">
					{#each categories as category}
						{@const meta = categoryMeta[category]}
						{@const totalInCategory = countFields(category)}
						{@const selectedInCategory = countSelectedInCategory(category)}
						{#if totalInCategory > 0}
							<div class="overflow-hidden rounded-lg border border-slate-200 bg-white">
								<button
									type="button"
									class="flex w-full items-center gap-2.5 px-3 py-3 text-left transition hover:bg-slate-50"
									onclick={() => toggleCategory(category)}
								>
									{#if isCategoryExpanded(category)}
										<ChevronDown class="size-4 text-slate-500" />
										<FolderOpen class="size-4 text-corporate-700" />
									{:else}
										<ChevronRight class="size-4 text-slate-500" />
										<Folder class="size-4 text-corporate-700" />
									{/if}
									<div class="min-w-0 flex-1">
										<p class="truncate text-sm font-semibold text-slate-950">{meta.title}</p>
										<p class="truncate text-xs text-slate-500">{meta.description}</p>
									</div>
									{#if selectedInCategory > 0}
										<span class="rounded-full bg-corporate-600 px-2.5 py-1 text-xs font-semibold text-white">
											{selectedInCategory} choisi(s)
										</span>
									{/if}
									<span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
										{countGroups(category)} dossier(s)
									</span>
									<span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
										{totalInCategory} champ(s)
									</span>
								</button>

								{#if isCategoryExpanded(category)}
									<div class="space-y-2 border-t border-slate-200 bg-slate-50 p-2">
										{#each Object.entries(groupedFields[category] ?? {}) as [groupName, fields]}
											<div class="overflow-hidden rounded-md border border-slate-200 bg-white">
												<button
													type="button"
													class="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-slate-50"
													onclick={() => toggleGroup(category, groupName)}
												>
													{#if isGroupExpanded(category, groupName)}
														<ChevronDown class="size-4 text-slate-500" />
														<FolderOpen class="size-4 text-slate-600" />
													{:else}
														<ChevronRight class="size-4 text-slate-500" />
														<Folder class="size-4 text-slate-600" />
													{/if}
													<p class="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{groupName}</p>
													<span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
														{fields.length}
													</span>
												</button>

												{#if isGroupExpanded(category, groupName)}
													<div class="grid gap-2 border-t border-slate-100 p-2 md:grid-cols-2 2xl:grid-cols-3">
														{#each fields as field}
															<label
																class={`flex min-h-32 cursor-pointer items-start gap-2 rounded-md border px-3 py-3 transition ${
																	isSelected(field.code)
																		? 'border-corporate-300 bg-corporate-50'
																		: 'border-slate-200 bg-white hover:border-corporate-200 hover:bg-slate-50'
																}`}
															>
																<input
																	class="mt-0.5 size-4 rounded border-slate-300 text-corporate-600 focus:ring-corporate-300"
																	type="checkbox"
																	checked={isSelected(field.code)}
																	onchange={() => onToggleField(field.code)}
																/>
																<FileText class="mt-0.5 size-4 shrink-0 text-slate-500" />
																<div class="min-w-0 flex-1">
																	<div class="flex items-start justify-between gap-2">
																		<div class="min-w-0">
																			<p class="text-sm font-semibold leading-5 text-slate-950">{field.label}</p>
																			<p class="mt-0.5 truncate text-[11px] uppercase text-slate-500">{field.code}</p>
																		</div>
																		{#if isSelected(field.code)}
																			<CheckCircle2 class="size-4 shrink-0 text-corporate-600" />
																		{/if}
																	</div>
																	<p class="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{field.description}</p>
																	<div class="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
																		<span class="rounded-full bg-slate-100 px-2 py-0.5">{field.table}</span>
																		{#each field.keywords.slice(0, 2) as keyword}
																			<span class="rounded-full bg-slate-100 px-2 py-0.5">{keyword}</span>
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
