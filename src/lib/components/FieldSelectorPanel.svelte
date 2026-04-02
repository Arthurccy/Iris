<script lang="ts">
	import { Search, CheckCircle2, ChevronRight, ChevronDown, Folder, FolderOpen, FileText } from 'lucide-svelte';
	import { categoryMeta, type CategoryName } from '$lib/data/categoryMeta';
	import type { FieldDefinition } from '$lib/types';

	type Props = {
		categories: CategoryName[];
		groupedFields: Record<string, Record<string, FieldDefinition[]>>;
		selectedCodes: string[];
		searchTerm: string;
		onToggleField: (code: string) => void;
		onClearSelection: () => void;
		onSearchChange: (value: string) => void;
		
	};

	let {
		categories,
		groupedFields,
		selectedCodes,
		searchTerm,
		onToggleField,
		onClearSelection,
		onSearchChange
	}: Props = $props();

	let expandedCategories = $state<CategoryName[]>([]);
	let expandedGroups = $state<string[]>([]);

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

	const countFields = (category: CategoryName) =>
		Object.values(groupedFields[category] ?? {}).reduce((total, fields) => total + fields.length, 0);
	const countGroups = (category: CategoryName) => Object.keys(groupedFields[category] ?? {}).length;
</script>

<section class="glass-card overflow-hidden">
	<div class="section-divider flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between">
		<div class="space-y-2">
			<p class="text-sm font-semibold uppercase tracking-[0.24em] text-corporate-600">Catalogue métier</p>
			<h2 class="text-2xl font-semibold text-slate-900">Sélection des champs Sage X3</h2>
			<p class="max-w-2xl text-sm leading-6 text-slate-600">
				Cliquez sur une famille, cochez les champs utiles, puis laissez le moteur retrouver les requêtes
				existantes qui couvrent au minimum votre besoin.
			</p>
		</div>

		<div class="flex flex-col gap-3 sm:flex-row">
			<label class="relative block min-w-[18rem]">
				<Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
				<input
					class="w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm outline-none transition focus:border-corporate-300 focus:ring-4 focus:ring-corporate-100"
					type="search"
					placeholder="Rechercher un code, un label, une table..."
					value={searchTerm}
					oninput={(event) => onSearchChange((event.currentTarget as HTMLInputElement).value)}
				/>
			</label>

			<button
				class="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-corporate-200 hover:text-corporate-700"
				type="button"
				onclick={onClearSelection}
			>
				Vider la sélection
			</button>
		</div>
	</div>

	<div class="p-6">
		<div class="rounded-3xl border border-slate-200 bg-white/75 p-4 sm:p-5">
			<div class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-pearl px-4 py-3">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Arborescence</p>
					<h3 class="text-lg font-semibold text-slate-900">Explorateur des champs</h3>
				</div>
				<div class="flex items-center gap-2 text-xs font-medium text-slate-600">
					<span class="rounded-full bg-white px-3 py-1">{selectedCodes.length} sélectionné(s)</span>
					<span class="rounded-full bg-white px-3 py-1">
						{categories.reduce((total, category) => total + countFields(category), 0)} visible(s)
					</span>
				</div>
			</div>

			<div class="max-h-[45rem] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 sm:p-3">
				{#if categories.every((category) => countFields(category) === 0)}
					<div class="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
						<p class="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Aucun résultat</p>
						<p class="mt-2 text-sm leading-6 text-slate-600">
							Aucun champ ne correspond à votre recherche. Essayez un autre mot-clé.
						</p>
					</div>
				{:else}
					<div class="space-y-1.5">
						{#each categories as category}
							{@const meta = categoryMeta[category]}
							{@const totalInCategory = countFields(category)}
							{#if totalInCategory > 0}
								<div class="rounded-2xl border border-slate-200 bg-slate-50/40">
									<button
										type="button"
										class="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-slate-100/80"
										onclick={() => toggleCategory(category)}
									>
										{#if isCategoryExpanded(category)}
											<ChevronDown class="size-4 text-slate-500" />
										{:else}
											<ChevronRight class="size-4 text-slate-500" />
										{/if}
										{#if isCategoryExpanded(category)}
											<FolderOpen class="size-4 text-corporate-700" />
										{:else}
											<Folder class="size-4 text-corporate-700" />
										{/if}
										<div class="min-w-0 flex-1">
											<p class="truncate text-sm font-semibold text-slate-900">{meta.title}</p>
											<p class="truncate text-xs text-slate-500">{meta.description}</p>
										</div>
										<span class="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
											{countGroups(category)} dossier(s)
										</span>
										<span class="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
											{totalInCategory} champ(s)
										</span>
									</button>

									{#if isCategoryExpanded(category)}
										<div class="space-y-1 pb-2 pl-4 pr-2">
											{#each Object.entries(groupedFields[category] ?? {}) as [groupName, fields]}
												<div class="rounded-xl border border-slate-200 bg-white">
													<button
														type="button"
														class="flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-slate-50"
														onclick={() => toggleGroup(category, groupName)}
													>
														{#if isGroupExpanded(category, groupName)}
															<ChevronDown class="size-4 text-slate-500" />
														{:else}
															<ChevronRight class="size-4 text-slate-500" />
														{/if}
														{#if isGroupExpanded(category, groupName)}
															<FolderOpen class="size-4 text-slate-600" />
														{:else}
															<Folder class="size-4 text-slate-600" />
														{/if}
														<p class="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{groupName}</p>
														<span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
															{fields.length}
														</span>
													</button>

													{#if isGroupExpanded(category, groupName)}
														<div class="space-y-1 pb-2 pl-5 pr-2">
															{#each fields as field}
																<label
																	class={`flex cursor-pointer items-start gap-2 rounded-lg border px-2.5 py-2 transition ${
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
																		<div class="flex items-center justify-between gap-2">
																			<div class="min-w-0">
																				<p class="truncate text-sm font-semibold text-slate-900">{field.label}</p>
																				<p class="truncate text-[11px] uppercase tracking-[0.16em] text-slate-500">
																					{field.code}
																				</p>
																			</div>
																			{#if isSelected(field.code)}
																				<CheckCircle2 class="size-4 shrink-0 text-corporate-600" />
																			{/if}
																		</div>
																		<p class="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{field.description}</p>
																		<div class="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
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
	</div>
</section>
