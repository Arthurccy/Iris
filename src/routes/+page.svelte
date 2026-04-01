<script lang="ts">
	import { Database, LayoutGrid, Sparkles } from 'lucide-svelte';
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
	const fallbackMailbox = '3636@entreprise.local';

	let selectedCodes = $state<string[]>([]);
	let searchTerm = $state('');

	const filteredFields = $derived(filterFields(dictionary, searchTerm));
	const fieldsByCategory = $derived.by(() =>
		categories.reduce<Record<string, FieldDefinition[]>>((accumulator, category) => {
			accumulator[category] = filteredFields.filter((field) => field.category === category);
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
</script>

<svelte:head>
	<title>IRIS X3 Query Finder</title>
	<meta
		name="description"
		content="Interface de consultation read-only pour retrouver des requêtes Sage X3 à partir de champs métiers."
	/>
</svelte:head>

<div class="relative isolate overflow-hidden">
	<div class="absolute inset-0 -z-10 bg-grid bg-[size:22px_22px] opacity-40"></div>
	<div class="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
		<header class="glass-card overflow-hidden">
			<div class="grid gap-8 p-6 lg:grid-cols-[1.35fr,0.85fr] lg:p-8">
				<div class="space-y-6">
					<div class="inline-flex items-center gap-2 rounded-full border border-corporate-100 bg-corporate-50 px-3 py-1.5 text-sm font-medium text-corporate-700">
						<Database class="size-4" />
						Sage X3 • Query Finder
					</div>

					<div class="space-y-4">
						<h1 class="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
							Transformer les codes techniques en langage métier et retrouver la bonne requête SQL.
						</h1>
						<p class="max-w-3xl text-base leading-8 text-slate-600">
							Interface read-only pensée pour la production, la qualité et les stocks. Les utilisateurs
							cochent leurs champs, l’app traduit les codes Sage X3 et propose automatiquement les requêtes
							disponibles les plus proches du besoin.
						</p>
					</div>

					<div class="grid gap-3 sm:grid-cols-3">
						<div class="rounded-3xl border border-slate-200 bg-white/70 p-4">
							<p class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Dictionnaire</p>
							<p class="mt-3 text-3xl font-semibold text-slate-950">{dictionary.length}</p>
							<p class="mt-1 text-sm text-slate-600">champs métiers indexés</p>
						</div>
						<div class="rounded-3xl border border-slate-200 bg-white/70 p-4">
							<p class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Catalogue SQL</p>
							<p class="mt-3 text-3xl font-semibold text-slate-950">{queries.length}</p>
							<p class="mt-1 text-sm text-slate-600">requêtes read-only</p>
						</div>
						<div class="rounded-3xl border border-slate-200 bg-white/70 p-4">
							<p class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Logique</p>
							<p class="mt-3 text-3xl font-semibold text-slate-950">3636</p>
							<p class="mt-1 text-sm text-slate-600">fallback mail si aucun match</p>
						</div>
					</div>
				</div>

				<div class="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-slate-100">
					<div class="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-corporate-200">
						<Sparkles class="size-4" />
						Principes UX
					</div>

					<div class="mt-6 space-y-4">
						<div class="rounded-2xl border border-slate-800 bg-slate-900 p-4">
							<div class="flex items-center gap-3">
								<LayoutGrid class="size-5 text-corporate-300" />
								<p class="font-semibold">Bento grid orientée métiers</p>
							</div>
							<p class="mt-2 text-sm leading-6 text-slate-400">
								Navigation rapide par familles Production, Qualité et Stocks avec cartes lisibles et
								ouverts contextuels.
							</p>
						</div>

						<div class="rounded-2xl border border-slate-800 bg-slate-900 p-4">
							<p class="font-semibold">Matching “Qui peut le plus peut le moins”</p>
							<p class="mt-2 text-sm leading-6 text-slate-400">
								Une requête plus large reste pertinente si elle contient déjà tous les champs demandés.
							</p>
						</div>

						<div class="rounded-2xl border border-slate-800 bg-slate-900 p-4">
							<p class="font-semibold">Design corporate moderne</p>
							<p class="mt-2 text-sm leading-6 text-slate-400">
								Blanc pur, gris perle, bleu profond, séparateurs fins et glassmorphism léger pour un rendu
								premium mais lisible en environnement industriel.
							</p>
						</div>
					</div>
				</div>
			</div>
		</header>

		<FieldSelectorPanel
			{categories}
			{fieldsByCategory}
			{selectedCodes}
			{searchTerm}
			onToggleField={toggleField}
			onClearSelection={clearSelection}
			onSearchChange={(value) => (searchTerm = value)}
		/>

		<QueryResults
			{selectedFields}
			{matches}
			fallbackMailTo={fallbackMailbox}
			{fallbackHref}
		/>
	</div>
</div>
