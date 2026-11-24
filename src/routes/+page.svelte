<script lang="ts">
	import { browser } from '$app/environment';
	import { X } from 'lucide-svelte';
	import FieldSelectorPanel from '../lib/components/FieldSelectorPanel.svelte';
	import QueryResults from '../lib/components/QueryResults.svelte';
	import fieldDictionaryData from '$lib/data/fieldDictionary.json';
	import queriesCatalogData from '$lib/data/queriesCatalog.json';
	import { categoryMeta, type CategoryName } from '$lib/data/categoryMeta';
	import type { FieldDefinition, QueryDefinition } from '$lib/types';
	import { buildFallbackMail, filterFields, matchQueries } from '$lib/utils/matching';

	const dictionary = fieldDictionaryData as FieldDefinition[];
	const queries = queriesCatalogData as QueryDefinition[];
	const categories = Object.keys(categoryMeta) as CategoryName[];
	const fallbackMailbox = '3636.valdepharm@fareva.com';

	let selectedCodes = $state<string[]>([]);
	let searchTerm = $state('');
	let isResultsOpen = $state(false);
	let activeCategoryFilter = $state<CategoryName | null>(null);

	const filteredFields = $derived(filterFields(dictionary, searchTerm));
	const groupedFields = $derived.by(() =>
		categories.reduce<Record<string, Record<string, FieldDefinition[]>>>((accumulator, category) => {
			const categoryFields = filteredFields.filter((field) => field.category === category);
			accumulator[category] = categoryFields.reduce<Record<string, FieldDefinition[]>>((groups, field) => {
				if (!groups[field.group]) {
					groups[field.group] = [];
				}
				groups[field.group].push(field);
				return groups;
			}, {});
			return accumulator;
		}, {})
	);
	const selectedFields = $derived(
		dictionary.filter((field) => selectedCodes.includes(field.code)).sort((left, right) =>
			left.label.localeCompare(right.label, 'fr')
		)
	);
	const matchResults = $derived(matchQueries(selectedCodes, queries));
	const fallbackHref = $derived(buildFallbackMail(selectedFields, fallbackMailbox));

	function toggleField(code: string) {
		selectedCodes = selectedCodes.includes(code)
			? selectedCodes.filter((current) => current !== code)
			: [...selectedCodes, code];
	}

	function clearSelection() {
		selectedCodes = [];
	}

	function openResults() {
		isResultsOpen = true;
	}

	function closeResults() {
		isResultsOpen = false;
	}

	function handleCategoryFilter(category: CategoryName | null) {
		activeCategoryFilter = category;
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isResultsOpen) {
			closeResults();
		}
	}

	$effect(() => {
		if (!browser) {
			return;
		}

		if (!isResultsOpen) {
			return;
		}

		document.body.classList.add('modal-open');

		return () => {
			document.body.classList.remove('modal-open');
		};
	});
</script>

<svelte:head>
	<title>IRIS — Exploration des requêtes Sage X3</title>
	<meta
		name="description"
		content="Interface interne de consultation read-only pour retrouver les requêtes Sage X3 à partir des champs métiers."
	/>
</svelte:head>

<svelte:window onkeydown={handleWindowKeydown} />

<div class="relative min-h-screen bg-slate-50/60">
	<div class="pointer-events-none fixed inset-0 -z-10 bg-grid bg-[size:24px_24px] opacity-30"></div>
	
	<main class="w-full px-4 py-5 sm:px-6 lg:px-8 2xl:px-10 max-w-[1920px] mx-auto">
		<FieldSelectorPanel
			{categories}
			{groupedFields}
			{selectedCodes}
			{selectedFields}
			{searchTerm}
			{matchResults}
			{activeCategoryFilter}
			onToggleField={toggleField}
			onClearSelection={clearSelection}
			onOpenResults={openResults}
			onSearchChange={(value) => (searchTerm = value)}
			onSelectCategoryFilter={handleCategoryFilter}
		/>
	</main>
</div>

{#if isResultsOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm">
		<button
			class="fixed inset-0 w-full h-full cursor-default -z-10"
			type="button"
			aria-label="Fermer la fenêtre des résultats"
			onclick={closeResults}
		></button>

		<div
			class="relative z-10 flex flex-col w-full max-w-6xl max-h-[88dvh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
			role="dialog"
			aria-modal="true"
			aria-label="Résultats du matching"
			tabindex="-1"
		>
			<div class="shrink-0 flex items-center justify-between gap-3 px-5 py-3.5 bg-slate-50 border-b border-slate-200">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.2em] text-corporate-700">Explorateur IRIS</p>
					<p class="text-xs text-slate-600">
						{#if matchResults.totalExact > 0}
							<span class="font-semibold text-emerald-700">{matchResults.totalExact} requête(s) exacte(s)</span>
							{#if matchResults.totalPartial > 0}
								· {matchResults.totalPartial} approchante(s)
							{/if}
						{:else if matchResults.totalPartial > 0}
							<span class="font-semibold text-amber-700">0 correspondance exacte</span> · {matchResults.totalPartial} requête(s) approchante(s)
						{:else}
							<span>0 requête correspondante</span>
						{/if}
					</p>
				</div>
				<button
					class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 shadow-sm shrink-0"
					type="button"
					onclick={closeResults}
				>
					<X class="size-3.5" />
					<span>Fermer</span>
				</button>
			</div>

			<div class="flex-auto min-h-0 modal-scroll overscroll-contain overflow-y-auto p-4 sm:p-5 bg-white">
				<QueryResults
					{selectedFields}
					{matchResults}
					fallbackMailTo={fallbackMailbox}
					{fallbackHref}
				/>
			</div>

			<div class="shrink-0 flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-2.5 text-xs text-slate-600">
				<span>
					<strong class="text-slate-900">{selectedFields.length}</strong> critère(s) analysé(s) sur le catalogue Sage X3
				</span>
				<button
					type="button"
					class="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
					onclick={closeResults}
				>
					Fermer
				</button>
			</div>
		</div>
	</div>
{/if}
