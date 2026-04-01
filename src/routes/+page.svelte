<script lang="ts">
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
	<div class="flex min-h-screen w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 2xl:px-10">
		<header class="glass-card overflow-hidden">
			<div class="grid gap-8 p-6 lg:p-8 xl:grid-cols-[1.45fr,0.75fr]">
				<div class="space-y-6">
					<div class="inline-flex items-center rounded-full border border-corporate-100 bg-corporate-50 px-3 py-1.5 text-sm font-medium text-corporate-700">
						Sage X3 Query Finder
					</div>

					<div class="space-y-4">
						<h1 class="max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
							Transformer les codes techniques en langage métier et retrouver la bonne requête SQL.
						</h1>
						<p class="max-w-5xl text-base leading-8 text-slate-600">
							Interface read-only pensée pour la production, la qualité et les stocks. Les utilisateurs
							cochent leurs champs, l'application traduit les codes Sage X3 et propose automatiquement les
							requêtes disponibles les plus proches du besoin.
						</p>
					</div>

					<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
							<p class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Domaines</p>
							<p class="mt-3 text-3xl font-semibold text-slate-950">{categories.length}</p>
							<p class="mt-1 text-sm text-slate-600">groupes principaux</p>
						</div>
						<div class="rounded-3xl border border-slate-200 bg-white/70 p-4">
							<p class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Support</p>
							<p class="mt-3 text-3xl font-semibold text-slate-950">3636</p>
							<p class="mt-1 text-sm text-slate-600">fallback mail si aucun match</p>
						</div>
					</div>
				</div>

				<div class="rounded-[2rem] border border-corporate-800 bg-corporate-900 p-6 text-white">
					<div class="text-sm font-semibold uppercase tracking-[0.22em] text-corporate-200">Principes UX</div>

					<div class="mt-6 space-y-4">
						<div class="rounded-2xl border border-corporate-700 bg-corporate-800 p-4">
							<p class="font-semibold">Navigation orientée métiers</p>
							<p class="mt-2 text-sm leading-6 text-corporate-100/80">
								Navigation rapide par familles Production, Qualité et Stocks avec cartes lisibles et
								sous-catégories dédiées.
							</p>
						</div>

						<div class="rounded-2xl border border-corporate-700 bg-corporate-800 p-4">
							<p class="font-semibold">Matching qui peut le plus peut le moins</p>
							<p class="mt-2 text-sm leading-6 text-corporate-100/80">
								Une requête plus large reste pertinente si elle contient déjà tous les champs demandés.
							</p>
						</div>

						<div class="rounded-2xl border border-corporate-700 bg-corporate-800 p-4">
							<p class="font-semibold">Écran conçu pour des volumes élevés</p>
							<p class="mt-2 text-sm leading-6 text-corporate-100/80">
								La page occupe toute la largeur disponible et répartit les champs en sections pour garder
								une lecture claire.
							</p>
						</div>
					</div>
				</div>
			</div>
		</header>

		<FieldSelectorPanel
			{categories}
			{groupedFields}
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
