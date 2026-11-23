<script lang="ts">
	import {
		AlertCircle,
		CheckCircle2,
		Database,
		FileText,
		Folder,
		Layers,
		Mail,
		Plus,
		Search,
		Server,
		ShieldCheck,
		SlidersHorizontal,
		Table,
		X
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import type { MiscTableDefinition } from '$lib/types';
	import MiscTableDetailModal from '$lib/components/MiscTableDetailModal.svelte';

	let { data }: { data: PageData } = $props();

	const tables = $derived(data.tables as MiscTableDefinition[]);
	const isLive = $derived(data.isLive ?? false);
	const fallbackMailbox = '3636.valdepharm@fareva.com';

	let searchTerm = $state('');
	let selectedCategory = $state<string | null>(null);
	let activeTable = $state<MiscTableDefinition | null>(null);

	const categories = [
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
		'Standard X3 - Général'
	];

	const filteredTables = $derived.by(() => {
		let list = tables;

		if (selectedCategory) {
			list = list.filter((t) => t.category === selectedCategory);
		}

		const term = searchTerm.trim().toLowerCase();
		if (!term) return list;

		return list.filter((t) => {
			const haystack = [
				`table ${t.numtab}`,
				`${t.numtab}`,
				t.title,
				t.description || '',
				t.category,
				...t.items.slice(0, 15).map((i) => `${i.code} ${i.label} ${i.shortLabel || ''}`)
			].join(' ').toLowerCase();

			return haystack.includes(term);
		});
	});

	const totalItemsCount = $derived(
		tables.reduce((sum, t) => sum + (t.items ? t.items.length : 0), 0)
	);

	function openTable(table: MiscTableDefinition) {
		activeTable = table;
	}

	function closeTable() {
		activeTable = null;
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
			"- Rôle et utilisation : (ex: liste déroulante pour...)",
			'- Écran ou champ X3 cible :',
			'- Exemples de codes et intitulés attendus :',
			'',
			'Merci de revenir vers nous pour cadrer la création dans la fonction GESTDU de Sage X3.',
			'Application IRIS — Portail métier Sage X3.'
		].join('\n');

		return `mailto:${fallbackMailbox}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
	});
</script>

<svelte:head>
	<title>IRIS — Tables Diverses Sage X3 Valdepharm</title>
	<meta
		name="description"
		content="Consultez et complétez en autonomie les tables diverses Sage X3 SANDBOX (FRVDRVMAS46)."
	/>
</svelte:head>

<div class="relative isolate overflow-hidden min-h-screen bg-slate-50/60 pb-16">
	<div class="absolute inset-0 -z-10 bg-grid bg-[size:24px_24px] opacity-30"></div>

	<main class="w-full px-4 py-6 sm:px-6 lg:px-8 2xl:px-10 max-w-[1920px] mx-auto space-y-6">
		<!-- En-tête de section -->
		<div class="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
			<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<div class="flex flex-wrap items-center gap-2">
						<span class="rounded bg-corporate-100 font-mono text-[11px] font-semibold text-corporate-800 px-2 py-0.5">
							Sage X3 — Fonction GESTDU / ATABDIV
						</span>
						<span class="rounded bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-0.5">
							{tables.length} tables recensées · {totalItemsCount} valeurs réelles
						</span>
						{#if isLive}
							<span class="inline-flex items-center gap-1 rounded bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-2 py-0.5">
								<span class="size-1.5 rounded-full bg-emerald-600"></span>
								Connexion directe LIVE SANDBOX (10.103.7.128)
							</span>
						{:else}
							<span class="inline-flex items-center gap-1 rounded bg-slate-100 text-slate-600 text-[11px] font-medium px-2 py-0.5">
								<Database class="size-3 text-slate-500" />
								Base SANDBOX FRVDRVMAS46 (x3v6 / VDRSANDB)
							</span>
						{/if}
					</div>
					<h1 class="mt-2 text-2xl font-semibold text-slate-950">
						Tables Diverses & Référentiels X3
					</h1>
					<p class="mt-1.5 max-w-3xl text-xs sm:text-sm leading-relaxed text-slate-600">
						Trouvez et complétez en toute autonomie les tables diverses de Sage X3 Valdepharm. Consultez les codes enregistrés, vérifiez l'unicité et générez instantanément les scripts d'insertion ou tickets de création.
					</p>
				</div>

				<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
					<a
						href={newTableMailHref}
						class="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-corporate-200 hover:bg-slate-50 shadow-xs"
					>
						<Mail class="size-3.5" />
						<span>Demander une nouvelle table</span>
					</a>
				</div>
			</div>

			<!-- Barre de recherche et filtres rapides -->
			<div class="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-3">
				<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
					<div class="relative flex-1">
						<Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
						<input
							class="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 py-2.5 text-xs sm:text-sm outline-none transition focus:border-corporate-500 focus:ring-2 focus:ring-corporate-100"
							type="search"
							placeholder="Rechercher par numéro (ex: 1007, 1011, 20), intitulé (avenant, balance), code de valeur..."
							bind:value={searchTerm}
						/>
						{#if searchTerm.trim()}
							<button
								type="button"
								class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
								onclick={() => (searchTerm = '')}
								title="Effacer la recherche"
							>
								<X class="size-3.5" />
							</button>
						{/if}
					</div>
				</div>

				<!-- Filtres de domaine -->
				<div class="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
					<button
						type="button"
						class="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition {
							selectedCategory === null
								? 'bg-corporate-600 text-white shadow-xs'
								: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
						}"
						onclick={() => (selectedCategory = null)}
					>
						<span>Toutes ({tables.length})</span>
					</button>

					{#each categories as category}
						{@const count = tables.filter((t) => t.category === category).length}
						{#if count > 0}
							<button
								type="button"
								class="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition {
									selectedCategory === category
										? 'bg-corporate-600 text-white shadow-xs'
										: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
								}"
								onclick={() => (selectedCategory = selectedCategory === category ? null : category)}
							>
								<span>{category}</span>
								<span class="rounded-full px-1.5 py-0.2 text-[10px] {
									selectedCategory === category ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
								}">
									{count}
								</span>
							</button>
						{/if}
					{/each}
				</div>
			</div>
		</div>

		<!-- Grille des tables diverses -->
		{#if filteredTables.length === 0}
			<div class="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
				<p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Aucune table trouvée</p>
				<p class="mt-2 text-sm text-slate-700">
					Aucune table diverse ne correspond à votre recherche "{searchTerm}".
				</p>
				<p class="mt-1 text-xs text-slate-500">
					Vérifiez le numéro de table ou essayez un mot-clé plus général.
				</p>
			</div>
		{:else}
			<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each filteredTables as table}
					{@const itemsCount = table.items ? table.items.length : 0}
					<article class="group rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-corporate-300 hover:shadow-sm flex flex-col justify-between">
						<div class="space-y-3">
							<!-- En-tête de carte -->
							<div class="flex items-center justify-between gap-2">
								<span class="rounded bg-corporate-50 font-mono text-xs font-bold text-corporate-800 px-2.5 py-1 border border-corporate-200">
									Table #{table.numtab}
								</span>
								<div class="flex items-center gap-1">
									{#if table.numtab >= 1000}
										<span class="rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold px-2 py-0.5">
											Valdepharm
										</span>
									{/if}
									<span class="rounded bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5">
										{table.category}
									</span>
								</div>
							</div>

							<!-- Titre -->
							<div>
								<h2 class="text-base font-semibold text-slate-950 group-hover:text-corporate-900 transition">
									{table.title}
								</h2>
								<p class="mt-1 text-xs leading-relaxed text-slate-500 line-clamp-2">
									{table.description || `Table diverse Sage X3 numéro ${table.numtab}.`}
								</p>
							</div>

							<!-- Aperçu des valeurs -->
							<div class="rounded-lg bg-slate-50 p-2.5 text-xs">
								<div class="flex items-center justify-between mb-1.5">
									<span class="font-semibold text-slate-800 text-[11px]">
										Valeurs enregistrées ({itemsCount})
									</span>
									<span class="text-[10px] text-slate-500 font-mono">CODE_0</span>
								</div>
								{#if itemsCount === 0}
									<p class="text-[11px] text-slate-400 italic">Table vide (aucune entrée pour le moment).</p>
								{:else}
									<div class="flex flex-wrap gap-1">
										{#each table.items.slice(0, 5) as item}
											<span class="rounded bg-white border border-slate-200 px-1.5 py-0.5 font-mono text-[10px] text-slate-700" title={item.label}>
												{item.code}
											</span>
										{/each}
										{#if table.items.length > 5}
											<span class="text-[10px] text-slate-500 self-center">
												+{table.items.length - 5} autre(s)
											</span>
										{/if}
									</div>
								{/if}
							</div>
						</div>

						<!-- Pied de carte avec bouton d'action -->
						<div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
							<span class="text-[11px] text-slate-500 font-mono">
								ATABDIV #{table.numtab}
							</span>

							<button
								type="button"
								class="inline-flex items-center gap-1.5 rounded-lg bg-corporate-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-corporate-700"
								onclick={() => openTable(table)}
							>
								<Table class="size-3.5" />
								<span>Consulter & Compléter</span>
							</button>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</main>

	<!-- Modale détaillée -->
	{#if activeTable}
		<MiscTableDetailModal
			table={activeTable}
			fallbackMailTo={fallbackMailbox}
			{isLive}
			onClose={closeTable}
		/>
	{/if}
</div>
