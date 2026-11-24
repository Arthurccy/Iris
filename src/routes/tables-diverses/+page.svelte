<script lang="ts">
	import {
		AlertCircle,
		ArrowUpDown,
		Check,
		CheckCircle2,
		ChevronLeft,
		ChevronRight,
		Clock,
		Database,
		ExternalLink,
		Eye,
		EyeOff,
		FileCode,
		FileSpreadsheet,
		FileText,
		Filter,
		Folder,
		Grid,
		History,
		Layers,
		List,
		Loader2,
		Lock,
		LogIn,
		LogOut,
		Mail,
		Pencil,
		Plus,
		Search,
		Server,
		ShieldAlert,
		ShieldCheck,
		SlidersHorizontal,
		Table as TableIcon,
		User,
		UserCheck,
		X
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import type { MiscTableDefinition } from '$lib/types';
	import type { AuditLogEntry } from '$lib/server/audit';
	import MiscTableDetailModal from '$lib/components/MiscTableDetailModal.svelte';
	import { invalidateAll } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	const tables = $derived(data.tables as MiscTableDefinition[]);
	const isLive = $derived(data.isLive ?? false);
	const fallbackMailbox = '3636.valdepharm@fareva.com';

	// Vue principale : Référentiel vs Traçabilité & Audit
	let mainView = $state<'catalog' | 'audit'>('catalog');
	const auditLogs = $derived((data.auditLogs || []) as AuditLogEntry[]);

	// Filtres de l'Audit Trail
	let auditSearchTerm = $state('');
	let auditActionFilter = $state<'all' | 'ADD' | 'UPDATE'>('all');
	let auditUserFilter = $state<string>('all');

	const filteredAuditLogs = $derived.by(() => {
		let list = auditLogs;

		// 1. Filtre par type d'action
		if (auditActionFilter !== 'all') {
			list = list.filter((l) => l.action === auditActionFilter);
		}

		// 2. Filtre par utilisateur (vue IT)
		if (auditUserFilter !== 'all') {
			list = list.filter(
				(l) => (l.user?.username || '').toLowerCase() === auditUserFilter.toLowerCase()
			);
		}

		// 3. Recherche textuelle
		const term = auditSearchTerm.trim().toLowerCase();
		if (term) {
			list = list.filter((l) => {
				const matchCode = (l.code || '').toLowerCase().includes(term);
				const matchLabel = (l.label || '').toLowerCase().includes(term);
				const matchTable =
					String(l.numtab).includes(term) || (l.tableName || '').toLowerCase().includes(term);
				const matchUser =
					(l.user?.displayName || '').toLowerCase().includes(term) ||
					(l.user?.username || '').toLowerCase().includes(term) ||
					(l.user?.department || '').toLowerCase().includes(term);
				const matchReason = (l.reason || '').toLowerCase().includes(term);
				return matchCode || matchLabel || matchTable || matchUser || matchReason;
			});
		}

		return list;
	});

	// Liste distincte des utilisateurs pour le filtre IT
	const auditDistinctUsers = $derived.by(() => {
		const map = new Map<string, string>();
		for (const log of auditLogs) {
			if (log.user?.username && !map.has(log.user.username)) {
				map.set(log.user.username, log.user.displayName || log.user.username);
			}
		}
		return Array.from(map.entries()).map(([username, displayName]) => ({
			username,
			displayName
		}));
	});

	function formatAuditDate(isoStr: string) {
		try {
			const d = new Date(isoStr);
			return d.toLocaleString('fr-FR', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return isoStr;
		}
	}

	function openTableByNumtab(numtab: number) {
		const found = tables.find((t) => t.numtab === numtab);
		if (found) {
			activeTable = found;
		}
	}

	// Authentification Active Directory
	let isLoginModalOpen = $state(false);
	let loginUsername = $state('');
	let loginPassword = $state('');
	let loginError = $state<string | null>(null);
	let isLoggingIn = $state(false);

	async function handleLoginSubmit(e: SubmitEvent) {
		e.preventDefault();
		loginError = null;
		isLoggingIn = true;

		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					username: loginUsername.trim(),
					password: loginPassword
				})
			});
			const result = await res.json();
			if (!res.ok || !result.success) {
				loginError = result.error || 'Identifiant Windows ou mot de passe incorrect.';
				return;
			}
			isLoginModalOpen = false;
			loginPassword = '';
			await invalidateAll();
		} catch (err: any) {
			loginError = err.message || 'Erreur réseau lors de la communication Active Directory.';
		} finally {
			isLoggingIn = false;
		}
	}

	async function handleLogout() {
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
			await invalidateAll();
		} catch (e) {
			console.error(e);
		}
	}

	// Filtres et affichage
	let searchTerm = $state('');
	let selectedScope = $state<'all' | 'mine' | 'valdepharm' | 'standard'>('all');
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
		if (selectedScope === 'mine') {
			list = list.filter((t) => data.permissions?.allTablesAllowed || (data.permissions?.allowedTables || []).includes(t.numtab));
		} else if (selectedScope === 'valdepharm') {
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

			<!-- Barre d'authentification Windows / Active Directory (Fareva) -->
			<div class="mt-4 pt-4 border-t border-slate-200">
				{#if data.user}
					<div class="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-corporate-50/80 border border-corporate-200 px-4 py-2.5">
						<div class="flex items-center gap-3">
							<div class="size-8 rounded-full bg-corporate-700 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
								{data.user.displayName ? data.user.displayName.charAt(0).toUpperCase() : 'U'}
							</div>
							<div>
								<div class="flex items-center gap-2">
									<span class="text-xs font-bold text-slate-950">{data.user.displayName}</span>
									{#if data.user.department}
										<span class="text-[11px] text-slate-500 font-semibold">({data.user.department})</span>
									{/if}
									<span class="rounded bg-corporate-200 text-corporate-950 px-2 py-0.5 text-[10px] font-extrabold tracking-wide">
										{data.permissions.roleLabel}
									</span>
								</div>
								<div class="text-[11px] text-slate-600 font-medium">
									{#if data.permissions.allTablesAllowed}
										Habilitation totale : modification autorisée sur l'ensemble des {totalTablesCount} tables diverses.
									{:else if (data.permissions.allowedTables || []).length > 0}
										Habilitation métier active : modification autorisée sur {(data.permissions.allowedTables || []).length} tables spécifiques.
									{:else}
										Session active en consultation seule (droits de modification non configurés pour ce profil).
									{/if}
								</div>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<button
								type="button"
								onclick={handleLogout}
								class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-rose-700 bg-white border border-slate-300 hover:border-rose-300 px-3 py-1.5 rounded-lg shadow-2xs transition"
							>
								<LogOut class="size-3.5" />
								<span>Déconnexion</span>
							</button>
						</div>
					</div>
				{:else}
					<div class="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-300 px-4 py-2.5">
						<div class="flex items-center gap-2.5">
							<ShieldAlert class="size-5 text-amber-600 shrink-0" />
							<div>
								<div class="text-xs font-bold text-slate-900">Session non authentifiée (Mode consultation seule)</div>
								<div class="text-[11px] text-slate-600">Connectez-vous avec votre compte Windows (Active Directory Fareva) pour déverrouiller l'ajout et la modification de vos tables.</div>
							</div>
						</div>
						<button
							type="button"
							onclick={() => (isLoginModalOpen = true)}
							class="inline-flex items-center gap-1.5 rounded-lg bg-corporate-700 hover:bg-corporate-800 text-white font-bold text-xs px-3.5 py-2 shadow-2xs transition shrink-0"
						>
							<LogIn class="size-3.5" />
							<span>Connexion Windows</span>
						</button>
					</div>
				{/if}
			</div>

			<!-- Navigation principale : Référentiel vs Traçabilité & Audit -->
			<div class="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
				<div class="flex items-center gap-2">
					<button
						type="button"
						class="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition {
							mainView === 'catalog'
								? 'bg-corporate-700 text-white shadow-xs'
								: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
						}"
						onclick={() => (mainView = 'catalog')}
					>
						<TableIcon class="size-4" />
						<span>Référentiel des tables ({totalTablesCount})</span>
					</button>

					<button
						type="button"
						class="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition {
							mainView === 'audit'
								? 'bg-corporate-700 text-white shadow-xs'
								: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
						}"
						onclick={() => (mainView = 'audit')}
					>
						<History class="size-4" />
						{#if data.permissions?.allTablesAllowed}
							<span>Journal d'Audit IT (Global)</span>
							<span class="rounded bg-amber-400 text-slate-950 px-2 py-0.5 text-[10px] font-extrabold shadow-2xs">
								{auditLogs.length} action(s)
							</span>
						{:else}
							<span>Mes modifications</span>
							{#if data.user}
								<span class="rounded bg-corporate-100 text-corporate-900 px-2 py-0.5 text-[10px] font-bold">
									{auditLogs.length}
								</span>
							{/if}
						{/if}
					</button>
				</div>

				{#if mainView === 'audit'}
					<div class="flex items-center gap-2 text-xs font-medium">
						{#if data.permissions?.allTablesAllowed}
							<span class="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-3 py-1 font-bold text-amber-950 text-[11px]">
								<ShieldCheck class="size-3.5 text-amber-800" />
								Supervision IT : Visibilité intégrale sur tous les utilisateurs
							</span>
						{:else}
							<span class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-300 px-3 py-1 font-bold text-slate-800 text-[11px]">
								<UserCheck class="size-3.5 text-slate-600" />
								Visibilité restreinte : vos modifications personnelles uniquement
							</span>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<!-- VUE 1 : CATALOGUE DES TABLES DIVERSES -->
		{#if mainView === 'catalog'}
			<div class="space-y-4">
				<!-- Barre d'outils, Recherche et Filtres -->
				<div class="rounded-2xl border border-slate-300/80 bg-white p-4 shadow-sm flex flex-col gap-3.5">
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
						<!-- Segmented control de périmètre : Pas de doublon "Mes tables (332)" pour l'admin -->
						<div class="flex items-center gap-1 rounded-xl border border-slate-300 bg-slate-200/70 p-1">
							{#if data.user && !data.permissions?.allTablesAllowed && (data.permissions?.allowedTables || []).length > 0}
								<button
									type="button"
									class="rounded-lg px-3.5 py-1.5 font-bold transition {
										selectedScope === 'mine'
											? 'bg-corporate-700 text-white shadow-xs'
											: 'text-corporate-900 hover:bg-corporate-100'
									}"
									onclick={() => (selectedScope = 'mine')}
								>
									Mes tables autorisées ({(data.permissions?.allowedTables || []).length})
								</button>
							{/if}
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
										{#if data.permissions?.allTablesAllowed || (data.permissions?.allowedTables || []).includes(table.numtab)}
											<button
												type="button"
												class="inline-flex items-center gap-1.5 rounded-lg bg-corporate-700 hover:bg-corporate-800 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition"
												onclick={() => openTable(table)}
											>
												<Pencil class="size-3 text-white" />
												<span>Consulter & Modifier</span>
											</button>
										{:else}
											<button
												type="button"
												class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs transition"
												onclick={() => openTable(table)}
											>
												<TableIcon class="size-3.5 text-slate-600" />
												<span>Consulter</span>
											</button>
										{/if}
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
							{#if data.permissions?.allTablesAllowed || (data.permissions?.allowedTables || []).includes(table.numtab)}
								<button
									type="button"
									class="inline-flex items-center gap-1.5 rounded-lg bg-corporate-700 hover:bg-corporate-800 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition"
									onclick={() => openTable(table)}
								>
									<Pencil class="size-3 text-white" />
									<span>Consulter & Modifier</span>
								</button>
							{:else}
								<button
									type="button"
									class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs transition"
									onclick={() => openTable(table)}
								>
									<TableIcon class="size-3.5 text-slate-600" />
									<span>Consulter</span>
								</button>
							{/if}
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
	</div>

	<!-- VUE 2 : TRAÇABILITÉ & JOURNAL D'AUDIT GXP -->
	{:else if mainView === 'audit'}
		<div class="space-y-4">
			<!-- Bandeau de filtrage et supervision de l'audit -->
			<div class="rounded-2xl border border-slate-300/80 bg-white p-5 shadow-sm space-y-4">
				<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div>
						<h2 class="text-lg font-extrabold text-slate-950 flex items-center gap-2">
							<History class="size-5 text-corporate-700" />
							{#if data.permissions?.allTablesAllowed}
								<span>Journal d'Audit Global (Supervision IT)</span>
							{:else}
								<span>Historique de mes modifications & ajouts</span>
							{/if}
						</h2>
						<p class="text-xs text-slate-600 mt-0.5">
							{#if data.permissions?.allTablesAllowed}
								Traçabilité intégrale de l'ensemble des créations et mises à jour exécutées par tous les utilisateurs dans Sage X3 via IRIS.
							{:else}
								Historique de toutes les valeurs et libellés que vous avez créés ou modifiés avec votre compte Windows.
							{/if}
						</p>
					</div>

					<!-- Compteurs d'audit -->
					<div class="flex flex-wrap items-center gap-2.5">
						<div class="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 shadow-2xs">
							<div class="text-[10px] uppercase font-bold text-slate-500">Total traçabilité</div>
							<div class="text-sm font-extrabold text-slate-950">{auditLogs.length} action(s)</div>
						</div>
						<div class="rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 shadow-2xs">
							<div class="text-[10px] uppercase font-bold text-emerald-800">Créations (ADD)</div>
							<div class="text-sm font-extrabold text-emerald-950">
								{auditLogs.filter((l) => l.action === 'ADD').length}
							</div>
						</div>
						<div class="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 shadow-2xs">
							<div class="text-[10px] uppercase font-bold text-amber-800">Modifications (UPDATE)</div>
							<div class="text-sm font-extrabold text-amber-950">
								{auditLogs.filter((l) => l.action === 'UPDATE').length}
							</div>
						</div>
					</div>
				</div>

				<!-- Barre de recherche et filtres de l'audit -->
				<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-3 border-t border-slate-200">
					<!-- Recherche textuelle -->
					<div class="sm:col-span-2 relative">
						<Search class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
						<input
							type="search"
							placeholder="Rechercher par code (ex: TST), libellé, n° table (#1), demandeur ou motif..."
							class="w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-3 py-2 text-xs font-semibold text-slate-950 outline-none focus:border-corporate-600 focus:bg-white"
							bind:value={auditSearchTerm}
						/>
					</div>

					<!-- Filtre Action -->
					<div>
						<select
							class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-corporate-600"
							bind:value={auditActionFilter}
						>
							<option value="all">Toutes les actions (Ajout & Modif)</option>
							<option value="ADD">Créations uniquement (ADD)</option>
							<option value="UPDATE">Modifications uniquement (UPDATE)</option>
						</select>
					</div>

					<!-- Filtre Utilisateur (IT uniquement) -->
					<div>
						{#if data.permissions?.allTablesAllowed}
							<select
								class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-corporate-600"
								bind:value={auditUserFilter}
							>
								<option value="all">Tous les utilisateurs</option>
								{#each auditDistinctUsers as u}
									<option value={u.username}>{u.displayName} ({u.username})</option>
								{/each}
							</select>
						{:else}
							<div class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
								<UserCheck class="size-3.5 text-corporate-700" />
								<span>Auteur : {data.user?.displayName || 'Moi-même'}</span>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Tableau du Journal d'Audit -->
			{#if filteredAuditLogs.length === 0}
				<div class="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center">
					<History class="size-10 text-slate-400 mx-auto mb-2" />
					<p class="text-xs font-bold uppercase tracking-wider text-slate-500">Aucune action trouvée</p>
					<p class="mt-2 text-sm font-semibold text-slate-800">
						Aucun enregistrement d'audit ne correspond à vos filtres actuels.
					</p>
					<p class="mt-1 text-xs text-slate-500">
						Toute création ou modification de valeur effectuée dans IRIS sera consignée ici en temps réel.
					</p>
				</div>
			{:else}
				<div class="rounded-2xl border border-slate-300 bg-white shadow-xs overflow-hidden">
					<div class="overflow-x-auto">
						<table class="w-full text-left text-xs border-collapse">
							<thead>
								<tr class="border-b-2 border-slate-200 bg-slate-100/90 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
									<th class="py-3 px-4 w-40">Date & Heure</th>
									<th class="py-3 px-4 w-48">Table diverse</th>
									<th class="py-3 px-3 w-28 text-center">Type</th>
									<th class="py-3 px-3 w-28 font-mono">Code X3</th>
									<th class="py-3 px-4">Désignation</th>
									<th class="py-3 px-4">Demandeur certifié</th>
									<th class="py-3 px-4">Motif / Justification</th>
									<th class="py-3 px-3 w-28 text-center">Statut</th>
									<th class="py-3 px-4 text-right w-24">Action</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-slate-200">
								{#each filteredAuditLogs as log}
									<tr class="hover:bg-slate-50 transition">
										<!-- Date & Heure -->
										<td class="py-3 px-4 font-mono text-[11px] text-slate-700 whitespace-nowrap">
											<div class="flex items-center gap-1.5 font-bold text-slate-900">
												<Clock class="size-3.5 text-slate-500" />
												<span>{formatAuditDate(log.timestamp)}</span>
											</div>
										</td>

										<!-- Table -->
										<td class="py-3 px-4">
											<div class="font-bold text-slate-900">
												<span class="rounded bg-corporate-100 font-mono text-corporate-900 px-1.5 py-0.5 text-[10px] font-extrabold mr-1 shadow-2xs">
													#{log.numtab}
												</span>
												{log.tableName}
											</div>
										</td>

										<!-- Action -->
										<td class="py-3 px-3 text-center">
											{#if log.action === 'ADD'}
												<span class="inline-flex items-center gap-1 rounded bg-emerald-100 text-emerald-950 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold shadow-2xs">
													<Plus class="size-3 text-emerald-700" />
													<span>Création</span>
												</span>
											{:else}
												<span class="inline-flex items-center gap-1 rounded bg-amber-100 text-amber-950 border border-amber-300 px-2 py-0.5 text-[10px] font-bold shadow-2xs">
													<Pencil class="size-3 text-amber-700" />
													<span>Modification</span>
												</span>
											{/if}
										</td>

										<!-- Code -->
										<td class="py-3 px-3 font-mono font-bold text-slate-950">
											<span class="rounded bg-slate-100 border border-slate-300 px-2 py-0.5 shadow-2xs">
												{log.code}
											</span>
										</td>

										<!-- Désignation -->
										<td class="py-3 px-4">
											<div class="font-bold text-slate-950">{log.label}</div>
											{#if log.shortLabel}
												<div class="text-[11px] text-slate-500 font-medium">Court : {log.shortLabel}</div>
											{/if}
										</td>

										<!-- Demandeur certifié -->
										<td class="py-3 px-4">
											<div class="flex items-center gap-1 font-bold text-slate-950">
												<ShieldCheck class="size-3.5 text-emerald-600 shrink-0" />
												<span>{log.user.displayName}</span>
											</div>
											<div class="text-[11px] text-slate-500 font-medium">
												{log.user.department || log.user.mail || log.user.username}
											</div>
										</td>

										<!-- Motif -->
										<td class="py-3 px-4 text-slate-800 text-xs">
											<div class="line-clamp-2 italic" title={log.reason}>
												"{log.reason}"
											</div>
										</td>

										<!-- Statut -->
										<td class="py-3 px-3 text-center">
											{#if log.status === 'SUCCESS'}
												<span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
													<Check class="size-3 text-emerald-600" />
													<span>Sage X3</span>
												</span>
											{:else}
												<span class="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-800">
													<AlertCircle class="size-3 text-rose-600" />
													<span>Échec</span>
												</span>
											{/if}
										</td>

										<!-- Ouvrir la table -->
										<td class="py-3 px-4 text-right">
											<button
												type="button"
												class="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-800 shadow-2xs transition"
												onclick={() => openTableByNumtab(log.numtab)}
												title="Consulter cette table"
											>
												<ExternalLink class="size-3 text-slate-500" />
												<span>Ouvrir</span>
											</button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	</main>

	<!-- Modale de détail et d'ajout -->
	{#if activeTable}
		<MiscTableDetailModal
			table={activeTable}
			fallbackMailTo={fallbackMailbox}
			{isLive}
			user={data.user}
			permissions={data.permissions}
			tableAuditLogs={auditLogs.filter((l) => l.numtab === activeTable.numtab)}
			onClose={closeTable}
		/>
	{/if}

	<!-- Modal de Connexion Windows (Active Directory Fareva) -->
	{#if isLoginModalOpen}
		<div class="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs p-4 flex items-center justify-center">
			<div class="relative w-full max-w-md rounded-2xl border-2 border-slate-300 bg-white p-6 shadow-2xl space-y-4">
				<div class="flex items-center justify-between border-b border-slate-200 pb-3">
					<div class="flex items-center gap-2.5">
						<div class="size-8 rounded-lg bg-corporate-700 text-white flex items-center justify-center font-bold">
							<Lock class="size-4" />
						</div>
						<div>
							<h3 class="text-sm font-bold text-slate-950">Connexion Windows</h3>
							<p class="text-[11px] text-slate-500 font-medium">Active Directory Fareva</p>
						</div>
					</div>
					<button
						type="button"
						class="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
						onclick={() => (isLoginModalOpen = false)}
					>
						<X class="size-5" />
					</button>
				</div>

				<p class="text-xs text-slate-600 leading-relaxed">
					Saisissez vos identifiants de session Windows Fareva habituels (ex: <code>acourcha</code>) pour vous authentifier et déverrouiller vos habilitations sur les tables diverses.
				</p>

				{#if loginError}
					<div class="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2">
						<AlertCircle class="size-4 text-rose-600 shrink-0 mt-0.5" />
						<span>{loginError}</span>
					</div>
				{/if}

				<form onsubmit={handleLoginSubmit} class="space-y-3.5">
					<div>
						<label for="loginUser" class="block text-xs font-bold text-slate-900 mb-1">
							Identifiant Windows <span class="text-rose-600">*</span>
						</label>
						<input
							id="loginUser"
							type="text"
							class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-950 outline-none focus:border-corporate-600 focus:ring-2 focus:ring-corporate-100"
							placeholder="Ex : acourcha ou arthur.courchay@fareva.com"
							bind:value={loginUsername}
							autocomplete="username"
							required
						/>
					</div>

					<div>
						<label for="loginPass" class="block text-xs font-bold text-slate-900 mb-1">
							Mot de passe de session <span class="text-rose-600">*</span>
						</label>
						<input
							id="loginPass"
							type="password"
							class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-950 outline-none focus:border-corporate-600 focus:ring-2 focus:ring-corporate-100"
							placeholder="••••••••••••"
							bind:value={loginPassword}
							autocomplete="current-password"
							required
						/>
					</div>

					<div class="pt-2 flex items-center justify-end gap-2.5">
						<button
							type="button"
							class="rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
							onclick={() => (isLoginModalOpen = false)}
						>
							Annuler
						</button>
						<button
							type="submit"
							class="inline-flex items-center gap-1.5 rounded-xl bg-corporate-700 hover:bg-corporate-800 px-4 py-2 text-xs font-bold text-white shadow-xs transition disabled:opacity-50"
							disabled={isLoggingIn}
						>
							{#if isLoggingIn}
								<Loader2 class="size-3.5 animate-spin" />
								<span>Vérification...</span>
							{:else}
								<LogIn class="size-3.5" />
								<span>Se connecter</span>
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>
