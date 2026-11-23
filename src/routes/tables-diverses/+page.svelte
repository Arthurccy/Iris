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
		// Accéder aux filtres pour déclencher l'effet
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

<div class="relative isolate overflow-hidden min-h-screen bg-slate-50/70 pb-16">
	<div class="absolute inset-0 -z-10 bg-grid bg-[size:24px_24px] opacity-25"></div>

	<main class="w-full px-4 py-5 sm:px-6 lg:px-8 2xl:px-10 max-w-[1920px] mx-auto space-y-4">
		
		<!-- Bandeau d'en-tête & Indicateurs clés -->
		<div class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
			<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
				<div class="space-y-1">
					<div class="flex flex-wrap items-center gap-2">
						<span class="rounded bg-corporate-100 font-mono text-[11px] font-semibold text-corporate-800 px-2 py-0.5">
							Sage X3 v6 — GESTDU / ATABDIV
						</span>
						{#if isLive}
							<span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
								<span class="size-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
								Connexion directe LIVE SANDBOX (10.103.7.128)
							</span>
						{:else}
							<span class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
								<Database class="size-3 text-slate-500" />
								Base SANDBOX FRVDRVMAS46 (x3v6 / VDRSANDB)
							</span>
						{/if}
					</div>
					<h1 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
						Référentiel des Tables Diverses Sage X3
					</h1>
					<p class="text-xs text-slate-600 max-w-4xl">
						Consultez, recherchez et enrichissez en autonomie les listes de valeurs paramétrées dans Sage X3. Vérifiez les doublons et générez les ordres d'insertion normalisés.
					</p>
				</div>

				<!-- Compteurs clés en pilules sobres -->
				<div class="flex flex-wrap items-center gap-2 lg:gap-3 shrink-0">
					<div class="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs">
						<div>
							<div class="text-[10px] uppercase font-semibold text-slate-500">Total Référentiel</div>
							<div class="text-sm font-bold text-slate-900">{totalTablesCount} tables</div>
						</div>
						<div class="h-6 w-px bg-slate-200"></div>
						<div>
							<div class="text-[10px] uppercase font-semibold text-slate-500">Avec Données</div>
							<div class="text-sm font-bold text-corporate-700">{nonEmptyTablesCount} tables ({totalItemsCount} val.)</div>
						</div>
						<div class="h-6 w-px bg-slate-200"></div>
						<div>
							<div class="text-[10px] uppercase font-semibold text-slate-500">Spécifique Valdepharm</div>
							<div class="text-sm font-bold text-amber-700">{valdepharmCount} tables</div>
						</div>
					</div>

					<a
						href={newTableMailHref}
						class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-corporate-300 transition"
					>
						<Mail class="size-3.5 text-slate-500" />
						<span>Demander une table</span>
					</a>
				</div>
			</div>

			<!-- Barre d'outils, Recherche et Filtres -->
			<div class="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-3">
				<!-- Ligne 1 : Champ de recherche plein écran -->
				<div class="relative w-full">
					<Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
					<input
						class="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-9 py-2 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-corporate-500 focus:bg-white focus:ring-2 focus:ring-corporate-100"
						type="search"
						placeholder="Rechercher par numéro (ex: 1007, 1011, 20), intitulé (ex: balance, avenant, taxe), ou code technique (ex: BAL01, AIT)..."
						bind:value={searchTerm}
					/>
					{#if searchTerm.trim()}
						<button
							type="button"
							class="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
							onclick={() => (searchTerm = '')}
							title="Effacer la recherche"
						>
							<X class="size-3.5" />
						</button>
					{/if}
				</div>

				<!-- Ligne 2 : Contrôles de filtrage, bascule de vue et options -->
				<div class="flex flex-wrap items-center justify-between gap-3 text-xs">
					<!-- Segmented control de périmètre -->
					<div class="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100/80 p-0.5">
						<button
							type="button"
							class="rounded-md px-3 py-1 font-medium transition {
								selectedScope === 'all'
									? 'bg-white text-slate-900 shadow-2xs'
									: 'text-slate-600 hover:text-slate-900'
							}"
							onclick={() => (selectedScope = 'all')}
						>
							Toutes ({totalTablesCount})
						</button>
						<button
							type="button"
							class="rounded-md px-3 py-1 font-medium transition {
								selectedScope === 'valdepharm'
									? 'bg-white text-amber-900 font-semibold shadow-2xs'
									: 'text-slate-600 hover:text-slate-900'
							}"
							onclick={() => (selectedScope = 'valdepharm')}
						>
							Valdepharm (84)
						</button>
						<button
							type="button"
							class="rounded-md px-3 py-1 font-medium transition {
								selectedScope === 'standard'
									? 'bg-white text-blue-900 font-semibold shadow-2xs'
									: 'text-slate-600 hover:text-slate-900'
							}"
							onclick={() => (selectedScope = 'standard')}
						>
							Standard X3 (248)
						</button>
					</div>

					<!-- Filtre par catégorie (Select sobre) -->
					<div class="flex items-center gap-2">
						<label for="catSelect" class="text-slate-500 font-medium">Catégorie :</label>
						<select
							id="catSelect"
							class="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 outline-none focus:border-corporate-500"
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
					<label class="inline-flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium">
						<input
							type="checkbox"
							class="rounded border-slate-300 text-corporate-600 focus:ring-corporate-400"
							bind:checked={hideEmptyTables}
						/>
						<span>Masquer les tables vides ({totalTablesCount - nonEmptyTablesCount})</span>
					</label>

					<!-- Bascule Vue Tableau vs Vue Cartes & Tri -->
					<div class="flex items-center gap-1.5 ml-auto">
						<div class="flex items-center rounded-lg border border-slate-200 bg-slate-100/70 p-0.5">
							<button
								type="button"
								class="inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition {
									viewMode === 'table'
										? 'bg-white text-corporate-900 shadow-2xs'
										: 'text-slate-600 hover:text-slate-900'
								}"
								onclick={() => (viewMode = 'table')}
								title="Affichage tableau synthétique"
							>
								<TableIcon class="size-3.5" />
								<span class="hidden sm:inline">Tableau</span>
							</button>
							<button
								type="button"
								class="inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition {
									viewMode === 'grid'
										? 'bg-white text-corporate-900 shadow-2xs'
										: 'text-slate-600 hover:text-slate-900'
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
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1 text-xs text-slate-600">
			<div>
				<span class="font-semibold text-slate-900">{filteredTables.length} table(s)</span>
				{#if searchTerm}
					<span>correspondant à "{searchTerm}"</span>
				{/if}
				{#if hideEmptyTables && !searchTerm}
					<span class="text-slate-500">(tables renseignées uniquement)</span>
				{/if}
			</div>

			<!-- Pagination rapide -->
			{#if filteredTables.length > pageSize}
				<div class="flex items-center gap-2">
					<span class="text-slate-500">
						Page {currentPage} sur {totalPages}
					</span>
					<div class="flex items-center gap-1">
						<button
							type="button"
							class="rounded border border-slate-200 bg-white p-1 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
							disabled={currentPage <= 1}
							onclick={() => (currentPage = Math.max(1, currentPage - 1))}
							title="Page précédente"
						>
							<ChevronLeft class="size-3.5" />
						</button>
						<button
							type="button"
							class="rounded border border-slate-200 bg-white p-1 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
							disabled={currentPage >= totalPages}
							onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
							title="Page suivante"
						>
							<ChevronRight class="size-3.5" />
						</button>
					</div>

					<select
						class="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700 outline-none"
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
			<div class="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
				<p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Aucune table trouvée</p>
				<p class="mt-2 text-sm text-slate-700">
					Aucun élément ne correspond à votre filtre "{searchTerm}".
				</p>
				<p class="mt-1 text-xs text-slate-500">
					Essayez de désactiver "Masquer les tables vides" ou d'élargir votre mot-clé.
				</p>
			</div>
		{:else if viewMode === 'table'}
			<div class="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
				<div class="overflow-x-auto">
					<table class="w-full text-left text-xs border-collapse">
						<thead>
							<tr class="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
								<th class="py-2.5 px-3.5 w-24">
									<button
										type="button"
										class="inline-flex items-center gap-1 hover:text-slate-900 transition"
										onclick={() => toggleSort('numtab')}
									>
										<span>N° Table</span>
										<ArrowUpDown class="size-3 text-slate-400" />
									</button>
								</th>
								<th class="py-2.5 px-3.5">
									<button
										type="button"
										class="inline-flex items-center gap-1 hover:text-slate-900 transition"
										onclick={() => toggleSort('title')}
									>
										<span>Intitulé officiel X3</span>
										<ArrowUpDown class="size-3 text-slate-400" />
									</button>
								</th>
								<th class="py-2.5 px-3.5 w-44">Domaine</th>
								<th class="py-2.5 px-3.5 w-28 text-center">
									<button
										type="button"
										class="inline-flex items-center gap-1 hover:text-slate-900 transition"
										onclick={() => toggleSort('itemsCount')}
									>
										<span>Valeurs</span>
										<ArrowUpDown class="size-3 text-slate-400" />
									</button>
								</th>
								<th class="py-2.5 px-3.5">Exemples de codes enregistrés</th>
								<th class="py-2.5 px-3.5 text-right w-36">Action</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-100">
							{#each paginatedTables as table}
								{@const count = table.items?.length || 0}
								{@const isVald = table.numtab >= 1000}
								<tr class="hover:bg-slate-50/80 transition group">
									<!-- Numéro -->
									<td class="py-2 px-3.5 font-mono">
										<span class="inline-flex items-center font-bold px-2 py-0.5 rounded text-[11px] {
											isVald
												? 'bg-amber-50 text-amber-900 border border-amber-200'
												: 'bg-slate-100 text-slate-800 border border-slate-200'
										}">
											#{table.numtab}
										</span>
									</td>

									<!-- Titre -->
									<td class="py-2 px-3.5">
										<div class="font-semibold text-slate-950 group-hover:text-corporate-700 transition">
											{table.title}
										</div>
										{#if isVald}
											<span class="text-[10px] text-amber-700 font-medium">Paramétrage spécifique Valdepharm</span>
										{/if}
									</td>

									<!-- Domaine -->
									<td class="py-2 px-3.5">
										<span class="inline-block rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700 font-medium">
											{table.category}
										</span>
									</td>

									<!-- Nombre d'entrées -->
									<td class="py-2 px-3.5 text-center font-mono">
										{#if count === 0}
											<span class="text-[10px] text-slate-400 italic">0 (vide)</span>
										{:else}
											<span class="inline-flex items-center justify-center font-semibold text-[11px] rounded-full bg-corporate-50 border border-corporate-200 text-corporate-800 px-2 py-0.5">
												{count}
											</span>
										{/if}
									</td>

									<!-- Aperçu codes -->
									<td class="py-2 px-3.5">
										{#if count === 0}
											<span class="text-[10px] text-slate-400">Aucune donnée</span>
										{:else}
											<div class="flex flex-wrap gap-1 max-w-xl">
												{#each table.items.slice(0, 4) as item}
													<span
														class="rounded bg-slate-50 border border-slate-200 px-1.5 py-0.2 font-mono text-[10px] text-slate-700"
														title={`${item.code} : ${item.label}`}
													>
														{item.code}
													</span>
												{/each}
												{#if count > 4}
													<span class="text-[10px] text-slate-400 self-center">
														+{count - 4}
													</span>
												{/if}
											</div>
										{/if}
									</td>

									<!-- Action -->
									<td class="py-2 px-3.5 text-right">
										<button
											type="button"
											class="inline-flex items-center gap-1 rounded border border-corporate-200 bg-white px-2.5 py-1 text-xs font-semibold text-corporate-800 hover:bg-corporate-50 shadow-2xs transition"
											onclick={() => openTable(table)}
										>
											<TableIcon class="size-3 text-corporate-600" />
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
			<!-- VUE GRILLE (Cartes élégantes et structurées) -->
			<div class="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
				{#each paginatedTables as table}
					{@const count = table.items?.length || 0}
					{@const isVald = table.numtab >= 1000}
					<article class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-corporate-300 hover:shadow-sm flex flex-col justify-between">
						<div class="space-y-2.5">
							<div class="flex items-center justify-between gap-2">
								<span class="inline-flex items-center font-mono text-xs font-bold px-2 py-0.5 rounded border {
									isVald
										? 'bg-amber-50 text-amber-900 border-amber-200'
										: 'bg-corporate-50 text-corporate-800 border-corporate-200'
								}">
									Table #{table.numtab}
								</span>
								<div class="flex items-center gap-1.5">
									{#if isVald}
										<span class="rounded bg-amber-100 text-amber-900 text-[10px] font-semibold px-1.5 py-0.2">
											Valdepharm
										</span>
									{/if}
									<span class="rounded bg-slate-100 text-slate-700 text-[10px] font-medium px-1.5 py-0.2">
										{table.category}
									</span>
								</div>
							</div>

							<div>
								<h2 class="text-sm font-bold text-slate-950">
									{table.title}
								</h2>
								<p class="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
									{table.description || `Table diverse Sage X3 numéro ${table.numtab}.`}
								</p>
							</div>

							<div class="rounded-lg bg-slate-50 p-2 text-xs">
								<div class="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1">
									<span>{count} valeur(s)</span>
									<span class="text-[10px] font-normal text-slate-400">ATABDIV</span>
								</div>
								{#if count === 0}
									<p class="text-[10px] text-slate-400 italic">Table vide</p>
								{:else}
									<div class="flex flex-wrap gap-1">
										{#each table.items.slice(0, 5) as item}
											<span class="rounded bg-white border border-slate-200 px-1 py-0.2 font-mono text-[10px] text-slate-700" title={item.label}>
												{item.code}
											</span>
										{/each}
										{#if count > 5}
											<span class="text-[10px] text-slate-400 self-center">
												+{count - 5}
											</span>
										{/if}
									</div>
								{/if}
							</div>
						</div>

						<div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end">
							<button
								type="button"
								class="inline-flex items-center gap-1 rounded border border-corporate-200 bg-white px-2.5 py-1 text-xs font-semibold text-corporate-800 hover:bg-corporate-50 shadow-2xs transition"
								onclick={() => openTable(table)}
							>
								<TableIcon class="size-3 text-corporate-600" />
								<span>Consulter & Compléter</span>
							</button>
						</div>
					</article>
				{/each}
			</div>
		{/if}

		<!-- Pagination inférieure -->
		{#if filteredTables.length > pageSize}
			<div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 text-xs text-slate-600">
				<div>
					Affichage de <span class="font-semibold text-slate-900">{(currentPage - 1) * pageSize + 1}</span> à <span class="font-semibold text-slate-900">{Math.min(currentPage * pageSize, filteredTables.length)}</span> sur <span class="font-semibold text-slate-900">{filteredTables.length}</span> tables
				</div>

				<div class="flex items-center gap-1.5">
					<button
						type="button"
						class="rounded border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
						disabled={currentPage <= 1}
						onclick={() => (currentPage = Math.max(1, currentPage - 1))}
					>
						Précédent
					</button>

					<span class="px-2 font-mono text-slate-700">
						{currentPage} / {totalPages}
					</span>

					<button
						type="button"
						class="rounded border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
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
