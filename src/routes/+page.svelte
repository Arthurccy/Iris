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
	const matches = $derived(matchQueries(selectedCodes, queries));
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
	<title>IRIS X3 Query Finder</title>
	<meta
		name="description"
		content="Interface de consultation read-only pour retrouver des requêtes Sage X3 à partir de champs métiers."
	/>
</svelte:head>

<svelte:window onkeydown={handleWindowKeydown} />

<div class="relative isolate overflow-hidden">
	<div class="absolute inset-0 -z-10 bg-grid bg-[size:22px_22px] opacity-40"></div>
	<div class="flex min-h-screen w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 2xl:px-10">
		<FieldSelectorPanel
			{categories}
			{groupedFields}
			{selectedCodes}
			{selectedFields}
			{searchTerm}
			onToggleField={toggleField}
			onClearSelection={clearSelection}
			onOpenResults={openResults}
			onSearchChange={(value) => (searchTerm = value)}
		/>
	</div>

	{#if isResultsOpen}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
			<button
				class="absolute inset-0 bg-slate-950/55"
				type="button"
				aria-label="Fermer la fenêtre des résultats"
				onclick={closeResults}
			></button>

			<div
				class="relative z-10 flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-2xl"
				role="dialog"
				aria-modal="true"
				aria-label="Résultats de matching"
				tabindex="-1"
			>
				<div class="section-divider flex items-center justify-between gap-3 px-5 py-4 sm:px-6">
					<div>
						<p class="text-xs font-semibold uppercase tracking-[0.2em] text-corporate-700">Résultats</p>
						<p class="text-sm text-slate-600">{matches.length} requête(s) trouvée(s)</p>
					</div>
					<button
						class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
						type="button"
						onclick={closeResults}
					>
						<X class="size-4" />
						Fermer
					</button>
				</div>

				<div class="modal-scroll overscroll-contain overflow-y-auto p-3 sm:p-4">
					<QueryResults
						{selectedFields}
						{matches}
						fallbackMailTo={fallbackMailbox}
						{fallbackHref}
					/>
				</div>
			</div>
		</div>
	{/if}
</div>
