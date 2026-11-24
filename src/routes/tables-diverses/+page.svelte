<script lang="ts">
	import {
		AlertCircle,
		ArrowDown,
		ArrowUp,
		ArrowUpDown,
		Check,
		ChevronLeft,
		ChevronRight,
		Clock,
		Database,
		ExternalLink,
		Eye,
		EyeOff,
		Grid,
		History,
		Loader2,
		Lock,
		LogIn,
		LogOut,
		Mail,
		Pencil,
		Plus,
		RotateCcw,
		Search,
		ShieldAlert,
		ShieldCheck,
		Table as TableIcon,
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

		if (auditActionFilter !== 'all') {
			list = list.filter((l) => l.action === auditActionFilter);
		}

		if (auditUserFilter !== 'all') {
			list = list.filter(
				(l) => (l.user?.username || '').toLowerCase() === auditUserFilter.toLowerCase()
			);
		}

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

	// Table active gérée par numéro afin que invalidateAll() rafraîchisse automatiquement la modale
	let activeTableNumtab = $state<number | null>(null);
	const activeTable = $derived(
		activeTableNumtab !== null ? tables.find((t) => t.numtab === activeTableNumtab) || null : null
	);

	function openTable(table: MiscTableDefinition) {
		activeTableNumtab = table.numtab;
	}

	function openTableByNumtab(numtab: number) {
		const found = tables.find((t) => t.numtab === numtab);
		if (found) {
			activeTableNumtab = found.numtab;
		}
	}

	function closeTable() {
		activeTableNumtab = null;
	}

	// Authentification Active Directory
	let isLoginModalOpen = $state(false);
	let loginUsername = $state('');
	let loginPassword = $state('');
	let showLoginPassword = $state(false);
	let loginError = $state<string | null>(null);
	let isLoggingIn = $state(false);
	let isSimulating = $state(false);

	function focusOnMount(node: HTMLElement) {
		requestAnimationFrame(() => node.focus());
	}

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
			showLoginPassword = false;
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

	async function handleSimulateRole(role: string) {
		if (isSimulating) return;
		isSimulating = true;
		try {
			const res = await fetch('/api/auth/simulate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ role })
			});
			if (res.ok) {
				window.location.href = '/tables-diverses';
				return;
			}
		} catch (err) {
			console.error('Erreur changement profil:', err);
		}
		window.location.href = `/api/auth/simulate?role=${encodeURIComponent(role)}`;
	}

	let prevSimulatedRole: string | null = null;
	$effect(() => {
		const currentRole = data.simulatedRole;
		if (currentRole !== prevSimulatedRole) {
			prevSimulatedRole = currentRole;
			if (currentRole && !data.permissions?.allTablesAllowed) {
				selectedScope = 'mine';
			} else {
				selectedScope = 'all';
			}
		}
	});

	// Filtres et affichage
	let searchInputRef = $state<HTMLInputElement | null>(null);
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

	// Métriques adaptées au profil connecté
	const myAllowedTablesList = $derived(
		tables.filter((t) => (data.permissions?.allowedTables || []).includes(t.numtab))
	);
	const myNonEmptyTablesCount = $derived(
		myAllowedTablesList.filter((t) => (t.items?.length || 0) > 0).length
	);
	const myEmptyTablesCount = $derived(myAllowedTablesList.length - myNonEmptyTablesCount);

	const hasActiveCatalogFilters = $derived(
		searchTerm.trim().length > 0 || selectedCategory !== 'all'
	);

	function resetCatalogFilters() {
		searchTerm = '';
		selectedCategory = 'all';
		hideEmptyTables = false;
	}

	function getCategoryBadge(category: string) {
		switch (category) {
			case 'Valdepharm - Spécifique Site':
			case 'Valdepharm - Production & Tolling':
				return 'bg-amber-50 text-amber-900 border-amber-300 font-semibold';
			case 'Fiscalité & Taxes':
				return 'bg-purple-50 text-purple-900 border-purple-200 font-semibold';
			case 'Finances & Règlements':
			case 'Comptabilité & Banque':
				return 'bg-emerald-50 text-emerald-900 border-emerald-200 font-semibold';
			case 'Stocks & Flux':
				return 'bg-blue-50 text-blue-900 border-blue-200 font-semibold';
			case 'Tiers & Ventes':
			case 'CRM & Services':
				return 'bg-indigo-50 text-indigo-900 border-indigo-200 font-semibold';
			case 'Qualité & Contrôle':
				return 'bg-cyan-50 text-cyan-900 border-cyan-200 font-semibold';
			case 'Administration & Workflow':
				return 'bg-rose-50 text-rose-900 border-rose-200 font-semibold';
			default:
				return 'bg-slate-100 text-slate-700 border-slate-200 font-medium';
		}
	}

	// Filtrage
	const filteredTables = $derived.by(() => {
		let list = tables;

		if (selectedScope === 'mine') {
			list = list.filter(
				(t) =>
					data.permissions?.allTablesAllowed ||
					(data.permissions?.allowedTables || []).includes(t.numtab)
			);
		} else if (selectedScope === 'valdepharm') {
			list = list.filter((t) => t.numtab >= 1000);
		} else if (selectedScope === 'standard') {
			list = list.filter((t) => t.numtab < 1000);
		}

		if (hideEmptyTables && selectedScope !== 'mine') {
			list = list.filter((t) => (t.items?.length || 0) > 0);
		}

		if (selectedCategory !== 'all' && selectedCategory !== 'Toutes les catégories') {
			list = list.filter((t) => t.category === selectedCategory);
		}

		const term = searchTerm.trim().toLowerCase();
		if (term) {
			list = list.filter((t) => {
				const numMatch =
					String(t.numtab) === term ||
					`table ${t.numtab}`.includes(term) ||
					`#${t.numtab}`.includes(term) ||
					String(t.numtab).includes(term);
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

		return [...list].sort((a, b) => {
			if (sortBy === 'numtab') {
				return sortAsc ? a.numtab - b.numtab : b.numtab - a.numtab;
			}
			if (sortBy === 'itemsCount') {
				const countA = a.items?.length || 0;
				const countB = b.items?.length || 0;
				return sortAsc ? countA - countB : countB - countA;
			}
			if (sortBy === 'title') {
				return sortAsc ? a.title.localeCompare(b.title, 'fr') : b.title.localeCompare(a.title, 'fr');
			}
			return 0;
		});
	});

	// Pagination
	const totalPages = $derived(Math.max(1, Math.ceil(filteredTables.length / pageSize)));
	const paginatedTables = $derived.by(() => {
		const start = (currentPage - 1) * pageSize;
		return filteredTables.slice(start, start + pageSize);
	});

	const visiblePageNumbers = $derived.by(() => {
		const pages: (number | 'ellipsis')[] = [];
		if (totalPages <= 7) {
			for (let i = 1; i <= totalPages; i++) pages.push(i);
			return pages;
		}
		pages.push(1);
		if (currentPage > 3) pages.push('ellipsis');
		const start = Math.max(2, currentPage - 1);
		const end = Math.min(totalPages - 1, currentPage + 1);
		for (let i = start; i <= end; i++) pages.push(i);
		if (currentPage < totalPages - 2) pages.push('ellipsis');
		pages.push(totalPages);
		return pages;
	});

	$effect(() => {
		const _ = `${searchTerm}_${selectedScope}_${selectedCategory}_${hideEmptyTables}_${pageSize}`;
		currentPage = 1;
	});

	function toggleSort(field: 'numtab' | 'itemsCount' | 'title') {
		if (sortBy === field) {
			sortAsc = !sortAsc;
		} else {
			sortBy = field;
			sortAsc = field === 'title' || field === 'numtab';
		}
	}

	function handleGlobalKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isLoginModalOpen && !isLoggingIn) {
			isLoginModalOpen = false;
			return;
		}
		if (activeTable || isLoginModalOpen) return;

		const target = e.target as HTMLElement | null;
		const isInput =
			target &&
			(target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');

		if (e.key === '/' && !isInput && mainView === 'catalog') {
			e.preventDefault();
			searchInputRef?.focus();
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
			'- Rôle et utilisation : (ex: nouvelle liste déroulante pour...)',
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

<svelte:window onkeydown={handleGlobalKeydown} />

<div class="relative min-h-screen bg-slate-100/70 pb-12">
	<div class="pointer-events-none fixed inset-0 -z-10 bg-grid bg-[size:24px_24px] opacity-25"></div>

	<main class="w-full px-4 py-4 sm:px-6 lg:px-8 2xl:px-10 max-w-[1920px] mx-auto space-y-3.5">
		<!-- EN-TÊTE COMPACT & UNIFIÉ -->
		<section class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
			<div class="px-5 pt-4 pb-3 space-y-3">
				<!-- Ligne 1 : Titre + Indicateurs synthétiques -->
				<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
					<div class="space-y-1">
						<div class="flex flex-wrap items-center gap-2">
							<h1 class="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950">
								Tables Diverses & Référentiels
							</h1>
							{#if isLive}
								<span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
									<span class="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
									LIVE SANDBOX
								</span>
							{:else}
								<span class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
									Cache hors ligne
								</span>
							{/if}
						</div>
						<p class="text-xs text-slate-500">
							Référentiels Sage X3 (fonction GESTDU) — consultez, recherchez et enrichissez vos listes de valeurs.
						</p>
					</div>

					<!-- KPI compacts en ligne + Demander une table -->
					<div class="flex flex-wrap items-center gap-2 shrink-0">
						{#if data.user && !data.permissions?.allTablesAllowed && (data.permissions?.allowedTables || []).length > 0}
							<div class="flex items-center gap-3 rounded-xl border border-corporate-200 bg-corporate-50 px-3 py-1.5">
								<span class="text-[11px] font-semibold text-corporate-800">Autorisées</span>
								<span class="text-sm font-extrabold text-corporate-900">
									{(data.permissions.allowedTables || []).length}
								</span>
							</div>
							<div class="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-1.5">
								<span class="text-[11px] font-semibold text-emerald-800">Renseignées</span>
								<span class="text-sm font-extrabold text-emerald-950">
									{myNonEmptyTablesCount} / {(data.permissions.allowedTables || []).length}
								</span>
							</div>
						{:else}
							<div class="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
								<span class="text-slate-500 font-medium">Tables</span>
								<span class="font-extrabold text-slate-900">{totalTablesCount}</span>
							</div>
							<div class="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-1.5 text-xs">
								<span class="text-emerald-800 font-medium">Actives</span>
								<span class="font-extrabold text-emerald-950">{nonEmptyTablesCount}</span>
								<span class="text-[11px] text-emerald-700 font-medium">({totalItemsCount} val.)</span>
							</div>
							<div class="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-1.5 text-xs">
								<span class="text-amber-800 font-medium">Valdepharm</span>
								<span class="font-extrabold text-amber-950">{valdepharmCount}</span>
							</div>
						{/if}

						<a
							href={newTableMailHref}
							class="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-corporate-400 hover:text-corporate-700 transition shadow-sm"
						>
							<Mail class="size-3.5 text-corporate-600" />
							<span>Demander une table</span>
						</a>
					</div>
				</div>

				<!-- Ligne 2 : Identité Windows & Simulateur RBAC (1 ligne dense) -->
				{#if data.user}
					<div class="flex flex-wrap items-center justify-between gap-2.5 rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2">
						<div class="flex items-center gap-2.5 min-w-0">
							<div class="size-7 rounded-full bg-corporate-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
								{data.user.displayName ? data.user.displayName.charAt(0).toUpperCase() : 'U'}
							</div>
							<div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs min-w-0">
								<span class="font-bold text-slate-950 truncate">{data.user.displayName}</span>
								{#if data.user.department}
									<span class="text-[11px] text-slate-500">({data.user.department})</span>
								{/if}
								<span class="rounded bg-corporate-100 text-corporate-900 px-2 py-0.5 text-[10px] font-bold">
									{data.permissions.roleLabel}
								</span>
								<span class="hidden md:inline text-[11px] text-slate-500">
									•
									{#if data.permissions.allTablesAllowed}
										Accès complet ({totalTablesCount} tables)
									{:else if (data.permissions.allowedTables || []).length > 0}
										{(data.permissions.allowedTables || []).length} tables modifiables
									{:else}
										Consultation seule
									{/if}
								</span>
							</div>
						</div>

						<div class="flex flex-wrap items-center gap-2">
							{#if data.isRealAdmin}
								<div class="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs shadow-sm">
									{#if isSimulating}
										<Loader2 class="size-3.5 text-corporate-700 animate-spin" />
									{:else}
										<ShieldCheck class="size-3.5 text-corporate-700" />
									{/if}
									<label for="simulate-select" class="font-semibold text-slate-600 text-[11px] hidden sm:inline">
										Profil :
									</label>
									<select
										id="simulate-select"
										class="bg-transparent font-bold text-corporate-900 border-none outline-none text-xs cursor-pointer py-0 focus:ring-0"
										value={data.simulatedRole || 'RESET'}
										disabled={isSimulating}
										onchange={(e) => handleSimulateRole((e.target as HTMLSelectElement).value)}
									>
										<option value="RESET">Mon compte IT réel (Accès total)</option>
										<option value="AQ">Assurance Qualité - AQ (13 tables)</option>
										<option value="PESEE">Atelier Pesée & Fabrication (4 tables)</option>
										<option value="MAGASIN">Magasin & Stocks (3 tables)</option>
										<option value="ACHATS">Achats & Approvisionnements (2 tables)</option>
										<option value="FINANCE">Comptabilité & Finance (3 tables)</option>
										<option value="READONLY">Visiteur sans droit (Consultation seule)</option>
									</select>
								</div>
							{/if}

							<button
								type="button"
								onclick={handleLogout}
								class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-rose-700 bg-white border border-slate-300 hover:border-rose-300 px-2.5 py-1 rounded-lg transition shadow-sm"
								title="Se déconnecter"
							>
								<LogOut class="size-3.5" />
								<span class="hidden sm:inline">Déconnexion</span>
							</button>
						</div>
					</div>

					{#if data.simulatedRole}
						<div class="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50 border border-amber-300 px-3.5 py-2 text-xs text-amber-950">
							<div class="flex items-center gap-2">
								<ShieldAlert class="size-4 text-amber-700 shrink-0" />
								<span>
									<strong>Simulation active ({data.permissions.roleLabel})</strong> — Seules
									{#if (data.permissions.allowedTables || []).length > 0}
										les <strong>{(data.permissions.allowedTables || []).length} tables métier</strong> assignées sont modifiables.
									{:else}
										aucune table n'est modifiable (lecture seule).
									{/if}
								</span>
							</div>
							<button
								type="button"
								onclick={() => handleSimulateRole('RESET')}
								disabled={isSimulating}
								class="inline-flex items-center gap-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs px-3 py-1 transition shrink-0 disabled:opacity-50"
							>
								{#if isSimulating}
									<Loader2 class="size-3.5 animate-spin" />
								{:else}
									<X class="size-3.5" />
								{/if}
								<span>Rétablir mon profil IT réel</span>
							</button>
						</div>
					{/if}
				{:else}
					<div class="flex flex-wrap items-center justify-between gap-2.5 rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2">
						<div class="flex items-center gap-2 text-xs">
							<Lock class="size-4 text-amber-600 shrink-0" />
							<span class="text-slate-700">
								<strong class="text-slate-900">Mode consultation seule</strong> — Connectez-vous avec votre compte Windows Fareva pour modifier vos tables.
							</span>
						</div>
						<button
							type="button"
							onclick={() => (isLoginModalOpen = true)}
							class="inline-flex items-center gap-1.5 rounded-lg bg-corporate-700 hover:bg-corporate-800 text-white font-bold text-xs px-3 py-1.5 transition shadow-sm"
						>
							<LogIn class="size-3.5" />
							<span>Connexion Windows</span>
						</button>
					</div>
				{/if}
			</div>

			<!-- Ligne 3 : Onglets intégrés en bordure basse -->
			<div class="px-5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4">
				<nav class="flex items-center gap-6 -mb-px" aria-label="Sous-navigation">
					<button
						type="button"
						class="inline-flex items-center gap-2 py-2.5 border-b-2 text-xs font-bold transition {mainView ===
						'catalog'
							? 'border-corporate-700 text-corporate-800'
							: 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'}"
						onclick={() => (mainView = 'catalog')}
					>
						<TableIcon class="size-3.5" />
						<span>Référentiel des tables</span>
						<span class="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-700">
							{totalTablesCount}
						</span>
					</button>

					<button
						type="button"
						class="inline-flex items-center gap-2 py-2.5 border-b-2 text-xs font-bold transition {mainView ===
						'audit'
							? 'border-corporate-700 text-corporate-800'
							: 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'}"
						onclick={() => (mainView = 'audit')}
					>
						<History class="size-3.5" />
						<span>
							{data.permissions?.allTablesAllowed ? "Journal d'Audit IT (Global)" : 'Mes modifications'}
						</span>
						{#if data.permissions?.allTablesAllowed}
							<span class="rounded-full bg-amber-100 border border-amber-300 text-amber-900 px-2 py-0.5 text-[10px] font-bold">
								{auditLogs.length}
							</span>
						{:else if data.user}
							<span class="rounded-full bg-corporate-100 text-corporate-800 px-2 py-0.5 text-[10px] font-bold">
								{auditLogs.length}
							</span>
						{/if}
					</button>
				</nav>

				{#if mainView === 'audit'}
					<div class="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold">
						{#if data.permissions?.allTablesAllowed}
							<ShieldCheck class="size-3.5 text-amber-700" />
							<span class="text-amber-900">Supervision IT globale</span>
						{:else}
							<UserCheck class="size-3.5 text-slate-500" />
							<span class="text-slate-600">Vos actions personnelles uniquement</span>
						{/if}
					</div>
				{/if}
			</div>
		</section>

		<!-- VUE 1 : CATALOGUE DES TABLES DIVERSES -->
		{#if mainView === 'catalog'}
			<div class="space-y-3">
				<!-- Barre de recherche & Filtres -->
				<div class="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm space-y-3">
					<div class="relative w-full">
						<Search class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
						<input
							bind:this={searchInputRef}
							class="w-full rounded-xl border border-slate-300 bg-slate-50/70 pl-10 pr-16 py-2 text-xs sm:text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-corporate-600 focus:bg-white focus:ring-4 focus:ring-corporate-500/10"
							type="search"
							placeholder="Rechercher par numéro (ex: 1007, 20), intitulé (ex: balance, taxe) ou code (ex: BAL01, AIT)..."
							bind:value={searchTerm}
						/>
						{#if searchTerm.trim()}
							<button
								type="button"
								class="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition"
								onclick={() => (searchTerm = '')}
								title="Effacer la recherche"
							>
								<X class="size-4" />
							</button>
						{:else}
							<kbd class="hidden sm:inline-block pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-400">
								/
							</kbd>
						{/if}
					</div>

					<div class="flex flex-wrap items-center justify-between gap-2.5 text-xs">
						<!-- Périmètre -->
						<div class="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-0.5">
							{#if data.user && !data.permissions?.allTablesAllowed && (data.permissions?.allowedTables || []).length > 0}
								<button
									type="button"
									class="rounded-lg px-3 py-1 font-bold transition {selectedScope === 'mine'
										? 'bg-corporate-700 text-white shadow-sm'
										: 'text-corporate-800 hover:bg-corporate-100/70'}"
									onclick={() => (selectedScope = 'mine')}
								>
									Mes tables ({(data.permissions?.allowedTables || []).length})
								</button>
							{/if}
							<button
								type="button"
								class="rounded-lg px-3 py-1 font-bold transition {selectedScope === 'all'
									? 'bg-slate-900 text-white shadow-sm'
									: 'text-slate-700 hover:bg-slate-200/70'}"
								onclick={() => (selectedScope = 'all')}
							>
								Toutes ({totalTablesCount})
							</button>
							<button
								type="button"
								class="rounded-lg px-3 py-1 font-bold transition {selectedScope === 'valdepharm'
									? 'bg-amber-600 text-white shadow-sm'
									: 'text-amber-900 hover:bg-amber-100'}"
								onclick={() => (selectedScope = 'valdepharm')}
							>
								Valdepharm ({valdepharmCount})
							</button>
							<button
								type="button"
								class="rounded-lg px-3 py-1 font-bold transition {selectedScope === 'standard'
									? 'bg-blue-600 text-white shadow-sm'
									: 'text-blue-900 hover:bg-blue-100'}"
								onclick={() => (selectedScope = 'standard')}
							>
								Standard X3 ({standardCount})
							</button>
						</div>

						<!-- Domaine + Masquer vides + Réinitialiser + Vue -->
						<div class="flex flex-wrap items-center gap-2 ml-auto">
							<select
								id="catSelect"
								aria-label="Filtrer par domaine"
								class="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-corporate-600"
								bind:value={selectedCategory}
							>
								{#each allCategories as cat}
									<option value={cat === 'Toutes les catégories' ? 'all' : cat}>
										{cat}
									</option>
								{/each}
							</select>

							{#if selectedScope === 'mine'}
								<span class="inline-flex items-center gap-1 rounded-lg border border-corporate-200 bg-corporate-50 px-2.5 py-1.5 text-corporate-800 font-semibold text-[11px]">
									<ShieldCheck class="size-3.5 text-corporate-700 shrink-0" />
									<span>Périmètre complet ({myAllowedTablesList.length})</span>
								</span>
							{:else}
								<label class="inline-flex items-center gap-1.5 cursor-pointer select-none rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 font-semibold hover:bg-slate-50 transition">
									<input
										type="checkbox"
										class="size-3.5 rounded border-slate-400 text-corporate-700 focus:ring-corporate-500"
										bind:checked={hideEmptyTables}
									/>
									<span>Masquer vides ({totalTablesCount - nonEmptyTablesCount})</span>
								</label>
							{/if}

							{#if hasActiveCatalogFilters}
								<button
									type="button"
									onclick={resetCatalogFilters}
									class="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
									title="Réinitialiser recherche et filtres"
								>
									<RotateCcw class="size-3.5" />
									<span class="hidden sm:inline">Réinitialiser</span>
								</button>
							{/if}

							<div class="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5">
								<button
									type="button"
									class="inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-bold transition {viewMode ===
									'table'
										? 'bg-white text-corporate-800 shadow-sm'
										: 'text-slate-600 hover:text-slate-900'}"
									onclick={() => (viewMode = 'table')}
									title="Affichage tableau"
								>
									<TableIcon class="size-3.5" />
									<span class="hidden sm:inline">Tableau</span>
								</button>
								<button
									type="button"
									class="inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-bold transition {viewMode ===
									'grid'
										? 'bg-white text-corporate-800 shadow-sm'
										: 'text-slate-600 hover:text-slate-900'}"
									onclick={() => (viewMode = 'grid')}
									title="Affichage grille"
								>
									<Grid class="size-3.5" />
									<span class="hidden sm:inline">Grille</span>
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- Résumé résultats & pagination compacte -->
				<div class="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-600">
					<div>
						{#if selectedScope === 'mine'}
							<span class="font-bold text-slate-900">{filteredTables.length} table(s) autorisée(s)</span>
							<span class="text-slate-500">
								({myNonEmptyTablesCount} avec valeurs, {myEmptyTablesCount} vide à renseigner)
							</span>
						{:else}
							<span class="font-bold text-slate-900">{filteredTables.length} table(s)</span>
							{#if searchTerm.trim()}
								<span>pour « <strong class="text-corporate-700">{searchTerm.trim()}</strong> »</span>
							{:else if hideEmptyTables}
								<span class="text-slate-500">(tables renseignées uniquement)</span>
							{/if}
						{/if}
					</div>

					<div class="flex items-center gap-2">
						{#if filteredTables.length > pageSize}
							<span class="font-medium text-slate-600">
								Page <strong class="text-slate-900">{currentPage}</strong> / {totalPages}
							</span>
							<div class="flex items-center gap-1">
								<button
									type="button"
									class="rounded-lg border border-slate-300 bg-white p-1 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
									disabled={currentPage <= 1}
									onclick={() => (currentPage = Math.max(1, currentPage - 1))}
									title="Page précédente"
								>
									<ChevronLeft class="size-3.5" />
								</button>
								<button
									type="button"
									class="rounded-lg border border-slate-300 bg-white p-1 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
									disabled={currentPage >= totalPages}
									onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
									title="Page suivante"
								>
									<ChevronRight class="size-3.5" />
								</button>
							</div>
						{/if}

						<select
							aria-label="Lignes par page"
							class="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none"
							bind:value={pageSize}
						>
							<option value={15}>15 / page</option>
							<option value={25}>25 / page</option>
							<option value={50}>50 / page</option>
							<option value={100}>100 / page</option>
						</select>
					</div>
				</div>

				<!-- Liste principale -->
				{#if filteredTables.length === 0}
					<div class="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-center space-y-3">
						<p class="text-sm font-bold text-slate-800">
							Aucune table ne correspond à vos critères actuels.
						</p>
						<p class="text-xs text-slate-500">
							Essayez d'élargir votre mot-clé ou d'afficher les tables vides.
						</p>
						<div>
							<button
								type="button"
								onclick={resetCatalogFilters}
								class="inline-flex items-center gap-1.5 rounded-xl bg-corporate-700 hover:bg-corporate-800 px-4 py-2 text-xs font-bold text-white shadow-sm transition"
							>
								<RotateCcw class="size-3.5" />
								<span>Réinitialiser les filtres</span>
							</button>
						</div>
					</div>
				{:else if viewMode === 'table'}
					<div class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
						<div class="overflow-x-auto">
							<table class="w-full text-left text-xs border-collapse">
								<thead>
									<tr class="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
										<th class="py-2.5 px-4 w-28">
											<button
												type="button"
												class="inline-flex items-center gap-1 hover:text-corporate-700 transition {sortBy ===
												'numtab'
													? 'text-corporate-700'
													: ''}"
												onclick={() => toggleSort('numtab')}
											>
												<span>N° Table</span>
												{#if sortBy === 'numtab'}
													{#if sortAsc}
														<ArrowUp class="size-3.5" />
													{:else}
														<ArrowDown class="size-3.5" />
													{/if}
												{:else}
													<ArrowUpDown class="size-3 text-slate-400" />
												{/if}
											</button>
										</th>
										<th class="py-2.5 px-4">
											<button
												type="button"
												class="inline-flex items-center gap-1 hover:text-corporate-700 transition {sortBy ===
												'title'
													? 'text-corporate-700'
													: ''}"
												onclick={() => toggleSort('title')}
											>
												<span>Intitulé officiel X3</span>
												{#if sortBy === 'title'}
													{#if sortAsc}
														<ArrowUp class="size-3.5" />
													{:else}
														<ArrowDown class="size-3.5" />
													{/if}
												{:else}
													<ArrowUpDown class="size-3 text-slate-400" />
												{/if}
											</button>
										</th>
										<th class="py-2.5 px-4 w-52">Domaine</th>
										<th class="py-2.5 px-4 w-28 text-center">
											<button
												type="button"
												class="inline-flex items-center gap-1 hover:text-corporate-700 transition {sortBy ===
												'itemsCount'
													? 'text-corporate-700'
													: ''}"
												onclick={() => toggleSort('itemsCount')}
											>
												<span>Valeurs</span>
												{#if sortBy === 'itemsCount'}
													{#if sortAsc}
														<ArrowUp class="size-3.5" />
													{:else}
														<ArrowDown class="size-3.5" />
													{/if}
												{:else}
													<ArrowUpDown class="size-3 text-slate-400" />
												{/if}
											</button>
										</th>
										<th class="py-2.5 px-4">Exemples de codes</th>
										<th class="py-2.5 px-4 text-right w-44">Action</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-slate-200/80">
									{#each paginatedTables as table}
										{@const count = table.items?.length || 0}
										{@const isVald = table.numtab >= 1000}
										{@const canEditThis =
											data.permissions?.allTablesAllowed ||
											(data.permissions?.allowedTables || []).includes(table.numtab)}
										<tr
											class="hover:bg-corporate-50/40 transition cursor-pointer group"
											onclick={() => openTable(table)}
										>
											<td class="py-2.5 px-4 font-mono">
												<span
													class="inline-flex items-center font-extrabold px-2 py-0.5 rounded-md text-xs border {isVald
														? 'bg-amber-50 text-amber-950 border-amber-300'
														: 'bg-slate-100 text-slate-800 border-slate-200'}"
												>
													#{table.numtab}
												</span>
											</td>

											<td class="py-2.5 px-4">
												<div class="font-bold text-slate-900 text-sm group-hover:text-corporate-700 transition">
													{table.title}
												</div>
												{#if isVald}
													<span class="text-[10px] text-amber-700 font-bold uppercase tracking-wider">
														Spécifique Valdepharm
													</span>
												{/if}
											</td>

											<td class="py-2.5 px-4">
												<span class="inline-block rounded-md border px-2 py-0.5 text-[11px] {getCategoryBadge(table.category)}">
													{table.category}
												</span>
											</td>

											<td class="py-2.5 px-4 text-center font-mono">
												{#if count === 0}
													<span class="inline-flex items-center text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
														0 (Vide)
													</span>
												{:else}
													<span class="inline-flex items-center justify-center font-bold text-xs rounded-full bg-slate-800 text-white px-2.5 py-0.5">
														{count}
													</span>
												{/if}
											</td>

											<td class="py-2.5 px-4">
												{#if count === 0}
													<span class="text-[11px] text-slate-400 italic">Aucune donnée</span>
												{:else}
													<div class="flex flex-wrap gap-1 max-w-md">
														{#each table.items.slice(0, 4) as item}
															<span
																class="rounded bg-slate-50 border border-slate-200 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-700"
																title={`${item.code} : ${item.label}`}
															>
																{item.code}
															</span>
														{/each}
														{#if count > 4}
															<span class="text-[11px] text-slate-400 font-bold self-center">
																+{count - 4}
															</span>
														{/if}
													</div>
												{/if}
											</td>

											<td class="py-2.5 px-4 text-right">
												{#if canEditThis}
													<button
														type="button"
														class="inline-flex items-center gap-1.5 rounded-lg bg-corporate-700 hover:bg-corporate-800 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition"
														onclick={(e) => {
															e.stopPropagation();
															openTable(table);
														}}
													>
														<Pencil class="size-3" />
														<span>Consulter & Modifier</span>
													</button>
												{:else}
													<button
														type="button"
														class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition"
														onclick={(e) => {
															e.stopPropagation();
															openTable(table);
														}}
													>
														<Eye class="size-3.5 text-slate-500" />
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
					<!-- VUE GRILLE -->
					<div class="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
						{#each paginatedTables as table}
							{@const count = table.items?.length || 0}
							{@const isVald = table.numtab >= 1000}
							{@const canEditThis =
								data.permissions?.allTablesAllowed ||
								(data.permissions?.allowedTables || []).includes(table.numtab)}
							<button
								type="button"
								class="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-corporate-500 hover:shadow-md flex flex-col justify-between cursor-pointer group"
								onclick={() => openTable(table)}
							>
								<div class="space-y-2.5 w-full">
									<div class="flex items-center justify-between gap-2">
										<span
											class="inline-flex items-center font-mono text-xs font-extrabold px-2 py-0.5 rounded-md border {isVald
												? 'bg-amber-50 text-amber-900 border-amber-300'
												: 'bg-corporate-50 text-corporate-900 border-corporate-200'}"
										>
											Table #{table.numtab}
										</span>
										<span class="rounded-md border px-2 py-0.5 text-[10px] {getCategoryBadge(table.category)}">
											{table.category}
										</span>
									</div>

									<div>
										<h2 class="text-sm font-bold text-slate-950 group-hover:text-corporate-700 transition leading-snug">
											{table.title}
										</h2>
										<p class="text-xs text-slate-500 line-clamp-2 mt-1">
											{table.description || `Table diverse Sage X3 numéro ${table.numtab}.`}
										</p>
									</div>

									<div class="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 text-xs">
										<div class="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1.5">
											<span>{count} valeur(s)</span>
											{#if isVald}
												<span class="text-amber-700">Spécifique Valdepharm</span>
											{/if}
										</div>
										{#if count === 0}
											<p class="text-[11px] text-slate-400 italic">Table vide</p>
										{:else}
											<div class="flex flex-wrap gap-1">
												{#each table.items.slice(0, 5) as item}
													<span
														class="rounded bg-white border border-slate-200 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-700"
														title={item.label}
													>
														{item.code}
													</span>
												{/each}
												{#if count > 5}
													<span class="text-[10px] text-slate-400 font-bold self-center">
														+{count - 5}
													</span>
												{/if}
											</div>
										{/if}
									</div>
								</div>

								<div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end w-full">
									{#if canEditThis}
										<span class="inline-flex items-center gap-1.5 rounded-lg bg-corporate-700 group-hover:bg-corporate-800 px-3 py-1.5 text-xs font-bold text-white transition">
											<Pencil class="size-3" />
											<span>Consulter & Modifier</span>
										</span>
									{:else}
										<span class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
											<Eye class="size-3.5 text-slate-500" />
											<span>Consulter</span>
										</span>
									{/if}
								</div>
							</button>
						{/each}
					</div>
				{/if}

				<!-- Pagination inférieure numérotée -->
				{#if filteredTables.length > pageSize}
					<div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-600">
						<div>
							Affichage de <strong class="text-slate-900">{(currentPage - 1) * pageSize + 1}</strong> à
							<strong class="text-slate-900">{Math.min(currentPage * pageSize, filteredTables.length)}</strong>
							sur <strong class="text-slate-900">{filteredTables.length}</strong> tables
						</div>

						<div class="flex items-center gap-1">
							<button
								type="button"
								class="rounded-lg border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
								disabled={currentPage <= 1}
								onclick={() => (currentPage = Math.max(1, currentPage - 1))}
							>
								Précédent
							</button>

							{#each visiblePageNumbers as p}
								{#if p === 'ellipsis'}
									<span class="px-1.5 text-slate-400">...</span>
								{:else}
									<button
										type="button"
										class="min-w-8 rounded-lg border px-2.5 py-1 font-bold transition {currentPage ===
										p
											? 'border-corporate-700 bg-corporate-700 text-white'
											: 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}"
										onclick={() => (currentPage = p)}
									>
										{p}
									</button>
								{/if}
							{/each}

							<button
								type="button"
								class="rounded-lg border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
								disabled={currentPage >= totalPages}
								onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
							>
								Suivant
							</button>
						</div>
					</div>
				{/if}
			</div>

		<!-- VUE 2 : JOURNAL D'AUDIT GXP -->
		{:else if mainView === 'audit'}
			<div class="space-y-3.5">
				<div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3.5">
					<div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
						<div>
							<h2 class="text-base font-extrabold text-slate-950 flex items-center gap-2">
								<History class="size-4 text-corporate-700" />
								<span>
									{data.permissions?.allTablesAllowed
										? "Journal d'Audit Global (Supervision IT)"
										: 'Historique de mes modifications & ajouts'}
								</span>
							</h2>
							<p class="text-xs text-slate-500 mt-0.5">
								{data.permissions?.allTablesAllowed
									? "Traçabilité intégrale des créations et mises à jour exécutées dans Sage X3 via IRIS."
									: 'Historique de toutes les valeurs créées ou modifiées avec votre compte Windows.'}
							</p>
						</div>

						<div class="flex flex-wrap items-center gap-2 text-xs">
							<div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
								<span class="text-slate-500">Total :</span>
								<strong class="text-slate-950 ml-1">{auditLogs.length}</strong>
							</div>
							<div class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5">
								<span class="text-emerald-800">Créations :</span>
								<strong class="text-emerald-950 ml-1">
									{auditLogs.filter((l) => l.action === 'ADD').length}
								</strong>
							</div>
							<div class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5">
								<span class="text-amber-800">Modifications :</span>
								<strong class="text-amber-950 ml-1">
									{auditLogs.filter((l) => l.action === 'UPDATE').length}
								</strong>
							</div>
						</div>
					</div>

					<div class="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4 pt-3 border-t border-slate-200">
						<div class="sm:col-span-2 relative">
							<Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
							<input
								type="search"
								placeholder="Rechercher par code, libellé, n° table, demandeur ou motif..."
								class="w-full rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-3 py-1.5 text-xs font-medium text-slate-950 outline-none focus:border-corporate-600 focus:bg-white"
								bind:value={auditSearchTerm}
							/>
						</div>

						<select
							class="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-corporate-600"
							bind:value={auditActionFilter}
						>
							<option value="all">Toutes les actions</option>
							<option value="ADD">Créations uniquement (ADD)</option>
							<option value="UPDATE">Modifications uniquement (UPDATE)</option>
						</select>

						{#if data.permissions?.allTablesAllowed}
							<select
								class="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-corporate-600"
								bind:value={auditUserFilter}
							>
								<option value="all">Tous les utilisateurs</option>
								{#each auditDistinctUsers as u}
									<option value={u.username}>{u.displayName} ({u.username})</option>
								{/each}
							</select>
						{:else}
							<div class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
								<UserCheck class="size-3.5 text-corporate-700" />
								<span class="truncate">Auteur : {data.user?.displayName || 'Moi-même'}</span>
							</div>
						{/if}
					</div>
				</div>

				{#if filteredAuditLogs.length === 0}
					<div class="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-center space-y-2">
						<History class="size-8 text-slate-300 mx-auto" />
						<p class="text-sm font-bold text-slate-800">Aucune action trouvée</p>
						<p class="text-xs text-slate-500">
							Aucun enregistrement d'audit ne correspond à vos filtres actuels.
						</p>
						{#if auditSearchTerm || auditActionFilter !== 'all' || auditUserFilter !== 'all'}
							<button
								type="button"
								onclick={() => {
									auditSearchTerm = '';
									auditActionFilter = 'all';
									auditUserFilter = 'all';
								}}
								class="text-xs font-bold text-corporate-700 hover:underline"
							>
								Réinitialiser les filtres
							</button>
						{/if}
					</div>
				{:else}
					<div class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
						<div class="overflow-x-auto">
							<table class="w-full text-left text-xs border-collapse">
								<thead>
									<tr class="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
										<th class="py-2.5 px-4 w-36">Date & Heure</th>
										<th class="py-2.5 px-4 w-48">Table diverse</th>
										<th class="py-2.5 px-3 w-28 text-center">Type</th>
										<th class="py-2.5 px-3 w-28 font-mono">Code X3</th>
										<th class="py-2.5 px-4">Désignation</th>
										<th class="py-2.5 px-4">Demandeur certifié</th>
										<th class="py-2.5 px-4">Motif</th>
										<th class="py-2.5 px-3 w-24 text-center">Statut</th>
										<th class="py-2.5 px-4 text-right w-24">Table</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-slate-200/80">
									{#each filteredAuditLogs as log}
										<tr
											class="hover:bg-slate-50 transition cursor-pointer"
											onclick={() => openTableByNumtab(log.numtab)}
										>
											<td class="py-2.5 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
												<div class="flex items-center gap-1.5 font-semibold text-slate-800">
													<Clock class="size-3.5 text-slate-400" />
													<span>{formatAuditDate(log.timestamp)}</span>
												</div>
											</td>

											<td class="py-2.5 px-4">
												<div class="font-semibold text-slate-900">
													<span class="rounded bg-corporate-50 font-mono text-corporate-800 border border-corporate-200 px-1.5 py-0.5 text-[10px] font-bold mr-1">
														#{log.numtab}
													</span>
													{log.tableName}
												</div>
											</td>

											<td class="py-2.5 px-3 text-center">
												{#if log.action === 'ADD'}
													<span class="inline-flex items-center gap-1 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
														<Plus class="size-3 text-emerald-600" />
														<span>Création</span>
													</span>
												{:else}
													<span class="inline-flex items-center gap-1 rounded bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 text-[10px] font-bold">
														<Pencil class="size-3 text-amber-600" />
														<span>Modif</span>
													</span>
												{/if}
											</td>

											<td class="py-2.5 px-3 font-mono font-bold text-slate-900">
												<span class="rounded bg-slate-100 border border-slate-200 px-2 py-0.5">
													{log.code}
												</span>
											</td>

											<td class="py-2.5 px-4">
												<div class="font-bold text-slate-900">{log.label}</div>
												{#if log.shortLabel}
													<div class="text-[11px] text-slate-500">Court : {log.shortLabel}</div>
												{/if}
											</td>

											<td class="py-2.5 px-4">
												<div class="flex items-center gap-1 font-semibold text-slate-900">
													<ShieldCheck class="size-3.5 text-emerald-600 shrink-0" />
													<span>{log.user.displayName}</span>
												</div>
												<div class="text-[11px] text-slate-500">
													{log.user.department || log.user.mail || log.user.username}
												</div>
											</td>

											<td class="py-2.5 px-4 text-slate-700 text-xs">
												<div class="line-clamp-2 italic" title={log.reason}>
													« {log.reason} »
												</div>
											</td>

											<td class="py-2.5 px-3 text-center">
												{#if log.status === 'SUCCESS'}
													<span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
														<Check class="size-3 text-emerald-600" />
														<span>X3</span>
													</span>
												{:else}
													<span class="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-800">
														<AlertCircle class="size-3 text-rose-600" />
														<span>Échec</span>
													</span>
												{/if}
											</td>

											<td class="py-2.5 px-4 text-right">
												<button
													type="button"
													class="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition"
													onclick={(e) => {
														e.stopPropagation();
														openTableByNumtab(log.numtab);
													}}
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
</div>

<!-- MODALES EN DEHORS DU CONTENEUR PRINCIPAL (Aucun risque de clipping ou stacking context) -->
{#if activeTable}
	<MiscTableDetailModal
		table={activeTable}
		fallbackMailTo={fallbackMailbox}
		{isLive}
		user={data.user}
		permissions={data.permissions}
		tableAuditLogs={auditLogs.filter((l) => l.numtab === activeTable.numtab)}
		onClose={closeTable}
		onSuccess={async () => {
			await invalidateAll();
		}}
	/>
{/if}

{#if isLoginModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
		<button
			type="button"
			class="fixed inset-0 w-full h-full cursor-default -z-10"
			aria-label="Fermer la fenêtre de connexion"
			onclick={() => !isLoggingIn && (isLoginModalOpen = false)}
		></button>

		<div class="relative z-10 w-full max-w-md max-h-[88dvh] overflow-y-auto rounded-2xl border border-slate-300 bg-white p-6 shadow-2xl space-y-4">
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
					class="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition"
					onclick={() => (isLoginModalOpen = false)}
				>
					<X class="size-5" />
				</button>
			</div>

			<p class="text-xs text-slate-600 leading-relaxed">
				Saisissez vos identifiants de session Windows Fareva (ex : <code>acourcha</code>) pour déverrouiller vos droits sur les tables diverses.
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
						use:focusOnMount
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
					<div class="relative">
						<input
							id="loginPass"
							type={showLoginPassword ? 'text' : 'password'}
							class="w-full rounded-xl border border-slate-300 bg-white pl-3 pr-9 py-2 text-xs font-semibold text-slate-950 outline-none focus:border-corporate-600 focus:ring-2 focus:ring-corporate-100"
							placeholder="••••••••••••"
							bind:value={loginPassword}
							autocomplete="current-password"
							required
						/>
						<button
							type="button"
							onclick={() => (showLoginPassword = !showLoginPassword)}
							class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5"
							title={showLoginPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
						>
							{#if showLoginPassword}
								<EyeOff class="size-4" />
							{:else}
								<Eye class="size-4" />
							{/if}
						</button>
					</div>
				</div>

				<div class="pt-2 flex items-center justify-end gap-2">
					<button
						type="button"
						class="rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
						onclick={() => (isLoginModalOpen = false)}
						disabled={isLoggingIn}
					>
						Annuler
					</button>
					<button
						type="submit"
						class="inline-flex items-center gap-1.5 rounded-xl bg-corporate-700 hover:bg-corporate-800 px-4 py-2 text-xs font-bold text-white shadow-sm transition disabled:opacity-50"
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
