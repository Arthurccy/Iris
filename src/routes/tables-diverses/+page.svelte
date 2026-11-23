<script lang="ts">
	import {
		AlertCircle,
		ArrowUpDown,
		Check,
		CheckCircle2,
		ChevronLeft,
		ChevronRight,
		Database,
		Eye,
		EyeOff,
		FileCode,
		FileText,
		Filter,
		Folder,
		Grid,
		Layers,
		List,
		Mail,
		Plus,
		Search,
		Server,
		SlidersHorizontal,
		Table as TableIcon,
		X
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import type { MiscTableDefinition } from '$lib/types';
	import MiscTableDetailModal from '$lib/components/MiscTableDetailModal.svelte';

	let { data }: { data: PageData } = $props();

	const tables = $derived(data.tables as MiscTableDefinition[]);
	const isLive = $derived(data.isLive ?? false);
	const fallbackMailbox = '3636.valdepharm@fareva.com';

	// Filtres et affichage
	let searchTerm = $state('');
	let selectedScope = $state<'all' | 'valdepharm' | 'standard'>('all');
	let selectedCategory = $state<string>('all');
	let hideEmptyTables = $state<boolean>(true);
	let viewMode = $state<'table' | 'grid'>('table');
	let sortBy = $state<'numtab' | 'itemsCount' | 'title'>('numtab');
	let sortAsc = $state<boolean>(true);

	// Pagination
	let pageSize = $state<number>(25);
	let currentPage = $state<number>(1);

	// Table active pour la modale
	let activeTable = $state<MiscTableDefinition | null>(null);

	// Catégories uniques
	const allCategories = [
		'Toutes les catégories',
		'Valdepharm - Spécifique Site',
		'Valdepharm - Production & Tolling',
		'Fiscalité & Taxes',
		'Finances & Règlements',
		'Stocks & Flux',
		'Tiers & Ventes',
		'Qualité & Contrôle',
		'Comptabilité & Banque',
		'CRM & Services',
		'Immobilisations',
		'Administration & Workflow',
		'Standard X3 - Général'
	];

	// Métriques globales
	const totalTablesCount = $derived(tables.length);
	const valdepharmCount = $derived(tables.filter((t) => t.numtab >= 1000).length);
	const standardCount = $derived(tables.filter((t) => t.numtab < 1000).length);
	const nonEmptyTablesCount = $derived(tables.filter((t) => (t.items?.length || 0) > 0).length);
	const totalItemsCount = $derived(
		tables.reduce((sum, t) => sum + (t.items ? t.items.length : 0), 0)
	);

	// Couleurs contrastées par domaine
	function getCategoryBadge(category: string) {
		switch (category) {
			case 'Valdepharm - Spécifique Site':
			case 'Valdepharm - Production & Tolling':
				return 'bg-amber-100 text-amber-950 border-amber-300 font-semibold';
			case 'Fiscalité & Taxes':
				return 'bg-purple-100 text-purple-950 border-purple-300 font-semibold';
			case 'Finances & Règlements':
			case 'Comptabilité & Banque':
				return 'bg-emerald-100 text-emerald-950 border-emerald-300 font-semibold';
			case 'Stocks & Flux':
				return 'bg-blue-100 text-blue-950 border-blue-300 font-semibold';
			case 'Tiers & Ventes':
			case 'CRM & Services':
				return 'bg-indigo-100 text-indigo-950 border-indigo-300 font-semibold';
			case 'Qualité & Contrôle':
				return 'bg-cyan-100 text-cyan-950 border-cyan-300 font-semibold';
			case 'Administration & Workflow':
				return 'bg-rose-100 text-rose-950 border-rose-300 font-semibold';
			default:
				return 'bg-slate-100 text-slate-800 border-slate-300 font-medium';
		}
	}

	// Filtrage
	const filteredTables = $derived.by(() => {
		let list = tables;

		// 1. Périmètre (Scope)
		if (selectedScope === 'valdepharm') {
			list = list.filter((t) => t.numtab >= 1000);
		} else if (selectedScope === 'standard') {
			list = list.filter((t) => t.numtab < 1000);
		}

		// 2. Masquer les tables vides
		if (hideEmptyTables) {
			list = list.filter((t) => (t.items?.length || 0) > 0);
		}

		// 3. Catégorie
		if (selectedCategory !== 'all' && selectedCategory !== 'Toutes les catégories') {
			list = list.filter((t) => t.category === selectedCategory);
		}

		// 4. Recherche textuelle
		const term = searchTerm.trim().toLowerCase();
		if (term) {
			list = list.filter((t) => {
				const numMatch = String(t.numtab) === term || `table ${t.numtab}`.includes(term) || String(t.numtab).includes(term);
				const titleMatch = t.title.toLowerCase().includes(term);
				const descMatch = (t.description || '').toLowerCase().includes(term);
				const itemMatch = (t.items || []).some(
					(i) =>
						i.code.toLowerCase().includes(term) ||
						(i.label && i.label.toLowerCase().includes(term)) ||
						(i.shortLabel && i.shortLabel.toLowerCase().includes(term))
				);
				return numMatch || titleMatch || descMatch || itemMatch;
			});
		}

		// 5. Tri
		const sorted = [...list].sort((a, b) => {
			if (sortBy === 'numtab') {
				return sortAsc ? a.numtab - b.numtab : b.numtab - a.numtab;
			}
			if (sortBy === 'itemsCount') {
				const countA = a.items?.length || 0;
				const countB = b.items?.length || 0;
				return sortAsc ? countA - countB : countB - countA;
			}
			if (sortBy === 'title') {
				return sortAsc
					? a.title.localeCompare(b.title, 'fr')
					: b.title.localeCompare(a.title, 'fr');
			}
			return 0;
		});

		return sorted;
	});

	// Pagination
	const totalPages = $derived(Math.max(1, Math.ceil(filteredTables.length / pageSize)));
	const paginatedTables = $derived.by(() => {
		const start = (currentPage - 1) * pageSize;
		return filteredTables.slice(start, start + pageSize);
	});

	// Réinitialiser la page si les filtres changent
	$effect(() => {
		const _ = `${searchTerm}_${selectedScope}_${selectedCategory}_${hideEmptyTables}_${pageSize}`;
		currentPage = 1;
	});

	function openTable(table: MiscTableDefinition) {
		activeTable = table;
	}

	function closeTable() {
		activeTable = null;
	}

	function toggleSort(field: 'numtab' | 'itemsCount' | 'title') {
		if (sortBy === field) {
			sortAsc = !sortAsc;
		} else {
			sortBy = field;
			sortAsc = field === 'title' ? true : false;
		}
	}

	const newTableMailHref = $derived.by(() => {
		const subject = `[IRIS - Sage X3] Demande de création d'une nouvelle Table Diverse`;
		const body = [
			'Bonjour,',
			'',
			'Dans le cadre de nos activités sur Sage X3 Valdepharm, aucune table diverse existante ne correspond à notre besoin.',
			'',
			'Description du besoin :',
			'- Domaine métier : (ex: Production, Qualité, Logistique, Maintenance...)',
			"- Rôle et utilisation : (ex: nouvelle liste déroulante pour...)",
			'- Écran ou champ X3 concerné :',
			'- Exemples de codes et intitulés attendus :',
			'',
			'Merci de revenir vers nous pour cadrer la création dans la fonction GESTDU de Sage X3.',
			'Application IRIS — Portail métier Sage X3.'
		].join('\n');

		return `mailto:${fallbackMailbox}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
	});
</script>

<svelte:head>
	<title>IRIS — Référentiel des Tables Diverses Sage X3</title>
	<meta
		name="description"
		content="Consultez et complétez en autonomie les tables diverses de Sage X3 Valdepharm."
	/>
</svelte:head>

<div class="relative isolate overflow-hidden min-h-screen bg-slate-100/60 pb-16">
	<div class="absolute inset-0 -z-10 bg-grid bg-[size:24px_24px] opacity-25"></div>

	<main class="w-full px-4 py-6 sm:px-6 lg:px-8 2xl:px-10 max-w-[1920px] mx-auto space-y-4">
		
		<!-- Bandeau d'en-tête & Indicateurs clés -->
		<div class="rounded-2xl border border-slate-300/80 bg-white p-5 sm:p-6 shadow-sm">
			<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
				<div class="space-y-1.5">
					<div class="flex items-center gap-2">
						<span class="rounded bg-corporate-700 text-white font-mono text-[11px] font-bold px-2.5 py-0.5 tracking-wide shadow-2xs">
							SAGE X3 VALDEPHARM
						</span>
						{#if isLive}
							<span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-300 px-3 py-0.5 text-[11px] font-bold text-emerald-950">
								<span class="size-2 rounded-full bg-emerald-600 animate-pulse"></span>
								DIRECT LIVE SANDBOX
							</span>
						{/if}
					</div>
					<h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
						Tables Diverses & Référentiels
					</h1>
					<p class="text-xs sm:text-sm font-medium text-slate-600 max-w-4xl leading-relaxed">
						Consultez, recherchez et enrichissez les listes de valeurs et menus déroulants de Sage X3 en toute autonomie.
					</p>
				</div>

				<!-- Compteurs clés en cartes à fort contraste -->
				<div class="flex flex-wrap items-center gap-3 shrink-0">
					<!-- Carte Total -->
					<div class="flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 shadow-2xs">
						<div>
							<div class="text-[10px] uppercase font-bold tracking-wider text-slate-500">Total Tables</div>
							<div class="text-base font-extrabold text-slate-950">{totalTablesCount}</div>
						</div>
					</div>

					<!-- Carte Avec Données -->
					<div class="flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50/70 px-3.5 py-2.5 shadow-2xs">
						<div>
							<div class="text-[10px] uppercase font-bold tracking-wider text-emerald-800">Avec Données</div>
							<div class="text-base font-extrabold text-emerald-950">{nonEmptyTablesCount} <span class="text-xs font-semibold text-emerald-800">({totalItemsCount} val.)</span></div>
						</div>
					</div>

					<!-- Carte Spécifique Valdepharm -->
					<div class="flex items-center gap-3 rounded-xl border border-amber-400 bg-amber-50/80 px-3.5 py-2.5 shadow-2xs">
						<div>
							<div class="text-[10px] uppercase font-bold tracking-wider text-amber-800">Valdepharm (Site)</div>
							<div class="text-base font-extrabold text-amber-950">{valdepharmCount} <span class="text-xs font-semibold text-amber-800">tables</span></div>
						</div>
					</div>

					<!-- Bouton Nouvelle table -->
					<a
						href={newTableMailHref}
						class="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 hover:border-corporate-600 hover:text-corporate-700 transition"
					>
						<Mail class="size-4 text-corporate-600" />
						<span>Demander une table</span>
					</a>
				</div>
			</div>

			<!-- Barre d'outils, Recherche et Filtres -->
			<div class="mt-5 pt-4 border-t border-slate-200 flex flex-col gap-3.5">
				<!-- Ligne 1 : Champ de recherche avec contraste fort -->
				<div class="relative w-full">
					<Search class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
					<input
						class="w-full rounded-xl border-2 border-slate-300 bg-slate-50/70 pl-10 pr-10 py-2.5 text-xs sm:text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-corporate-600 focus:bg-white focus:ring-4 focus:ring-corporate-500/10"
						type="search"
						placeholder="Rechercher par numéro (ex: 1007, 1011, 20), intitulé (ex: balance, avenant, taxe), ou code technique (ex: BAL01, AIT)..."
						bind:value={searchTerm}
					/>
					{#if searchTerm.trim()}
						<button
							type="button"
							class="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200"
							onclick={() => (searchTerm = '')}
							title="Effacer la recherche"
						>
							<X class="size-4" />
						</button>
					{/if}
				</div>

				<!-- Ligne 2 : Contrôles de filtrage, bascule de vue et options -->
				<div class="flex flex-wrap items-center justify-between gap-3 text-xs">
					
					<!-- Segmented control de périmètre avec couleurs affirmées -->
					<div class="flex items-center gap-1 rounded-xl border border-slate-300 bg-slate-200/70 p-1">
						<button
							type="button"
							class="rounded-lg px-3.5 py-1.5 font-bold transition {
								selectedScope === 'all'
									? 'bg-slate-900 text-white shadow-xs'
									: 'text-slate-700 hover:text-slate-950 hover:bg-slate-200'
							}"
							onclick={() => (selectedScope = 'all')}
						>
							Toutes ({totalTablesCount})
						</button>
						<button
							type="button"
							class="rounded-lg px-3.5 py-1.5 font-bold transition {
								selectedScope === 'valdepharm'
									? 'bg-amber-600 text-white shadow-xs'
									: 'text-amber-900 hover:bg-amber-100'
							}"
							onclick={() => (selectedScope = 'valdepharm')}
						>
							Valdepharm (84)
						</button>
						<button
							type="button"
							class="rounded-lg px-3.5 py-1.5 font-bold transition {
								selectedScope === 'standard'
									? 'bg-blue-600 text-white shadow-xs'
									: 'text-blue-900 hover:bg-blue-100'
							}"
							onclick={() => (selectedScope = 'standard')}
						>
							Standard X3 (248)
						</button>
					</div>

					<!-- Filtre par catégorie -->
					<div class="flex items-center gap-2">
						<label for="catSelect" class="text-slate-700 font-bold">Domaine :</label>
						<select
							id="catSelect"
							class="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 outline-none focus:border-corporate-600 focus:ring-2 focus:ring-corporate-100 shadow-2xs"
							bind:value={selectedCategory}
						>
							{#each allCategories as cat}
								<option value={cat === 'Toutes les catégories' ? 'all' : cat}>
									{cat}
								</option>
							{/each}
						</select>
					</div>

					<!-- Option : Masquer les tables vides -->
					<label class="inline-flex items-center gap-2 cursor-pointer select-none rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-slate-800 font-bold hover:bg-slate-100 transition shadow-2xs">
						<input
							type="checkbox"
							class="size-4 rounded border-slate-400 text-corporate-700 focus:ring-corporate-500"
							bind:checked={hideEmptyTables}
						/>
						<span>Masquer les tables vides ({totalTablesCount - nonEmptyTablesCount})</span>
					</label>

					<!-- Bascule Vue Tableau vs Vue Cartes -->
					<div class="flex items-center gap-1.5 ml-auto">
						<div class="flex items-center rounded-xl border border-slate-300 bg-slate-200/70 p-1">
							<button
								type="button"
								class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 font-bold transition {
									viewMode === 'table'
										? 'bg-white text-corporate-800 shadow-xs'
										: 'text-slate-700 hover:text-slate-950'
								}"
								onclick={() => (viewMode = 'table')}
								title="Affichage tableau synthétique"
							>
								<TableIcon class="size-3.5" />
								<span class="hidden sm:inline">Tableau</span>
							</button>
							<button
								type="button"
								class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 font-bold transition {
									viewMode === 'grid'
										? 'bg-white text-corporate-800 shadow-xs'
										: 'text-slate-700 hover:text-slate-950'
								}"
								onclick={() => (viewMode = 'grid')}
								title="Affichage grille de cartes"
							>
								<Grid class="size-3.5" />
								<span class="hidden sm:inline">Grille</span>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Barre de statut des résultats & Pagination supérieure -->
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1 text-xs text-slate-700">
			<div class="font-medium">
				<span class="font-extrabold text-slate-950 text-sm">{filteredTables.length} table(s)</span>
				{#if searchTerm}
					<span>correspondant à "<strong class="text-corporate-700">{searchTerm}</strong>"</span>
				{/if}
				{#if hideEmptyTables && !searchTerm}
					<span class="text-slate-500 font-normal">(tables avec valeurs uniquement)</span>
				{/if}
			</div>

			<!-- Pagination rapide -->
			{#if filteredTables.length > pageSize}
				<div class="flex items-center gap-2">
					<span class="font-semibold text-slate-700">
						Page <strong class="text-slate-950">{currentPage}</strong> sur {totalPages}
					</span>
					<div class="flex items-center gap-1">
						<button
							type="button"
							class="rounded-lg border border-slate-300 bg-white p-1 text-slate-800 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
							disabled={currentPage <= 1}
							onclick={() => (currentPage = Math.max(1, currentPage - 1))}
							title="Page précédente"
						>
							<ChevronLeft class="size-4" />
						</button>
						<button
							type="button"
							class="rounded-lg border border-slate-300 bg-white p-1 text-slate-800 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
							disabled={currentPage >= totalPages}
							onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
							title="Page suivante"
						>
							<ChevronRight class="size-4" />
						</button>
					</div>

					<select
						class="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 outline-none shadow-2xs"
						bind:value={pageSize}
					>
						<option value={15}>15 / page</option>
						<option value={25}>25 / page</option>
						<option value={50}>50 / page</option>
						<option value={100}>100 / page</option>
					</select>
				</div>
			{/if}
		</div>

		<!-- Contenu principal : VUE TABLEAU (Dense & Lisible) -->
		{#if filteredTables.length === 0}
			<div class="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center">
				<p class="text-xs font-bold uppercase tracking-wider text-slate-500">Aucune table trouvée</p>
				<p class="mt-2 text-base font-semibold text-slate-800">
					Aucun élément ne correspond à votre recherche "{searchTerm}".
				</p>
				<p class="mt-1 text-xs text-slate-500">
					Essayez de décocher "Masquer les tables vides" ou d'élargir votre mot-clé.
				</p>
			</div>
		{:else if viewMode === 'table'}
			<div class="rounded-2xl border border-slate-300 bg-white shadow-xs overflow-hidden">
				<div class="overflow-x-auto">
					<table class="w-full text-left text-xs border-collapse">
						<thead>
							<tr class="border-b-2 border-slate-200 bg-slate-100/90 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
								<th class="py-3 px-4 w-28">
									<button
										type="button"
										class="inline-flex items-center gap-1 hover:text-corporate-700 transition"
										onclick={() => toggleSort('numtab')}
									>
										<span>N° Table</span>
										<ArrowUpDown class="size-3.5 text-slate-500" />
									</button>
								</th>
								<th class="py-3 px-4">
									<button
										type="button"
										class="inline-flex items-center gap-1 hover:text-corporate-700 transition"
										onclick={() => toggleSort('title')}
									>
										<span>Intitulé officiel X3</span>
										<ArrowUpDown class="size-3.5 text-slate-500" />
									</button>
								</th>
								<th class="py-3 px-4 w-52">Domaine</th>
								<th class="py-3 px-4 w-32 text-center">
									<button
										type="button"
										class="inline-flex items-center gap-1 hover:text-corporate-700 transition"
										onclick={() => toggleSort('itemsCount')}
									>
										<span>Valeurs</span>
										<ArrowUpDown class="size-3.5 text-slate-500" />
									</button>
								</th>
								<th class="py-3 px-4">Exemples de codes</th>
								<th class="py-3 px-4 text-right w-36">Action</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-200">
							{#each paginatedTables as table}
								{@const count = table.items?.length || 0}
								{@const isVald = table.numtab >= 1000}
								<tr class="hover:bg-slate-50 transition group">
									<!-- Numéro -->
									<td class="py-2.5 px-4 font-mono">
										<span class="inline-flex items-center font-extrabold px-2.5 py-1 rounded-md text-xs {
											isVald
												? 'bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs'
												: 'bg-slate-100 text-slate-900 border border-slate-300 shadow-2xs'
										}">
											#{table.numtab}
										</span>
									</td>

									<!-- Titre -->
									<td class="py-2.5 px-4">
										<div class="font-bold text-slate-950 text-sm group-hover:text-corporate-700 transition">
											{table.title}
										</div>
										{#if isVald}
											<span class="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Spécifique Valdepharm</span>
										{/if}
									</td>

									<!-- Domaine -->
									<td class="py-2.5 px-4">
										<span class="inline-block rounded-md border px-2.5 py-0.5 text-[11px] {getCategoryBadge(table.category)}">
											{table.category}
										</span>
									</td>

									<!-- Nombre d'entrées -->
									<td class="py-2.5 px-4 text-center font-mono">
										{#if count === 0}
											<span class="text-[11px] text-slate-400 font-semibold italic">Vide</span>
										{:else}
											<span class="inline-flex items-center justify-center font-extrabold text-xs rounded-full bg-slate-900 text-white px-2.5 py-0.5 shadow-2xs">
												{count}
											</span>
										{/if}
									</td>

									<!-- Aperçu codes -->
									<td class="py-2.5 px-4">
										{#if count === 0}
											<span class="text-[11px] text-slate-400 font-medium">Aucune donnée</span>
										{:else}
											<div class="flex flex-wrap gap-1.5 max-w-xl">
												{#each table.items.slice(0, 4) as item}
													<span
														class="rounded-md bg-white border border-slate-300 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-800 shadow-2xs"
														title={`${item.code} : ${item.label}`}
													>
														{item.code}
													</span>
												{/each}
												{#if count > 4}
													<span class="text-[11px] text-slate-500 font-bold self-center">
														+{count - 4}
													</span>
												{/if}
											</div>
										{/if}
									</td>

									<!-- Action -->
									<td class="py-2.5 px-4 text-right">
										<button
											type="button"
											class="inline-flex items-center gap-1.5 rounded-lg bg-corporate-700 hover:bg-corporate-800 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition"
											onclick={() => openTable(table)}
										>
											<TableIcon class="size-3.5 text-white" />
											<span>Consulter</span>
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{:else}
			<!-- VUE GRILLE (Cartes structurées) -->
			<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each paginatedTables as table}
					{@const count = table.items?.length || 0}
					{@const isVald = table.numtab >= 1000}
					<article class="rounded-2xl border border-slate-300 bg-white p-5 shadow-xs transition hover:border-corporate-600 hover:shadow-md flex flex-col justify-between">
						<div class="space-y-3">
							<div class="flex items-center justify-between gap-2">
								<span class="inline-flex items-center font-mono text-xs font-extrabold px-2.5 py-1 rounded-md border {
									isVald
										? 'bg-amber-100 text-amber-950 border-amber-300'
										: 'bg-corporate-50 text-corporate-900 border-corporate-200'
								}">
									Table #{table.numtab}
								</span>
								<div class="flex items-center gap-1.5">
									{#if isVald}
										<span class="rounded bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5">
											Valdepharm
										</span>
									{/if}
									<span class="rounded-md border px-2 py-0.5 text-[10px] {getCategoryBadge(table.category)}">
										{table.category}
									</span>
								</div>
							</div>

							<div>
								<h2 class="text-base font-bold text-slate-950 leading-snug">
									{table.title}
								</h2>
								<p class="text-xs text-slate-600 line-clamp-2 mt-1">
									{table.description || `Table diverse Sage X3 numéro ${table.numtab}.`}
								</p>
							</div>

							<div class="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs">
								<div class="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
									<span>{count} valeur(s)</span>
									<span class="text-[10px] uppercase font-bold text-slate-500">Paramétrage X3</span>
								</div>
								{#if count === 0}
									<p class="text-[11px] text-slate-400 italic">Table vide</p>
								{:else}
									<div class="flex flex-wrap gap-1.5">
										{#each table.items.slice(0, 5) as item}
											<span class="rounded-md bg-white border border-slate-300 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-800 shadow-2xs" title={item.label}>
												{item.code}
											</span>
										{/each}
										{#if count > 5}
											<span class="text-[10px] text-slate-500 font-bold self-center">
												+{count - 5}
											</span>
										{/if}
									</div>
								{/if}
							</div>
						</div>

						<div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
							<button
								type="button"
								class="inline-flex items-center gap-1.5 rounded-lg bg-corporate-700 hover:bg-corporate-800 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition"
								onclick={() => openTable(table)}
							>
								<TableIcon class="size-3.5 text-white" />
								<span>Consulter & Compléter</span>
							</button>
						</div>
					</article>
				{/each}
			</div>
		{/if}

		<!-- Pagination inférieure -->
		{#if filteredTables.length > pageSize}
			<div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-300 text-xs text-slate-700">
				<div class="font-medium">
					Affichage de <span class="font-bold text-slate-950">{(currentPage - 1) * pageSize + 1}</span> à <span class="font-bold text-slate-950">{Math.min(currentPage * pageSize, filteredTables.length)}</span> sur <span class="font-bold text-slate-950">{filteredTables.length}</span> tables
				</div>

				<div class="flex items-center gap-2">
					<button
						type="button"
						class="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 font-bold text-slate-800 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
						disabled={currentPage <= 1}
						onclick={() => (currentPage = Math.max(1, currentPage - 1))}
					>
						Précédent
					</button>

					<span class="px-2 font-mono font-bold text-slate-900">
						{currentPage} / {totalPages}
					</span>

					<button
						type="button"
						class="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 font-bold text-slate-800 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
						disabled={currentPage >= totalPages}
						onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
					>
						Suivant
					</button>
				</div>
			</div>
		{/if}

	</main>

	<!-- Modale de détail et d'ajout -->
	{#if activeTable}
		<MiscTableDetailModal
			table={activeTable}
			fallbackMailTo={fallbackMailbox}
			{isLive}
			onClose={closeTable}
		/>
	{/if}
</div>
