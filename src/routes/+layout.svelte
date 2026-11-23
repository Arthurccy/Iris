<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { Database, FileCode2, Mail, Search, ShieldCheck } from 'lucide-svelte';

	let { children } = $props();

	const isQueriesActive = $derived($page.url.pathname === '/');
	const isTablesActive = $derived($page.url.pathname.startsWith('/tables-diverses'));
</script>

<div class="min-h-screen flex flex-col bg-white">
	<!-- Barre de navigation supérieure institutionnelle -->
	<header class="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
		<div class="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10 flex h-14 items-center justify-between gap-4">
			<!-- Logo / Titre -->
			<div class="flex items-center gap-6">
				<a href="/" class="flex items-center gap-2.5 group">
					<div class="size-7 rounded-lg bg-corporate-600 flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-xs">
						I
					</div>
					<div class="leading-none">
						<span class="text-sm font-bold tracking-tight text-slate-950 group-hover:text-corporate-700 transition">
							IRIS
						</span>
						<span class="block text-[10px] text-slate-500 font-medium">
							Sage X3 Valdepharm
						</span>
					</div>
				</a>

				<!-- Onglets de navigation -->
				<nav class="flex items-center gap-1 border-l border-slate-200 pl-4 sm:pl-6" aria-label="Navigation principale">
					<a
						href="/"
						class="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition {
							isQueriesActive
								? 'bg-corporate-50 text-corporate-800 border border-corporate-200'
								: 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
						}"
					>
						<Search class="size-3.5" />
						<span>Requêtes & Champs SQL</span>
					</a>

					<a
						href="/tables-diverses"
						class="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition {
							isTablesActive
								? 'bg-corporate-50 text-corporate-800 border border-corporate-200'
								: 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
						}"
					>
						<Database class="size-3.5" />
						<span>Tables Diverses X3</span>
					</a>
				</nav>
			</div>

			<!-- Informations & Support 3636 -->
			<div class="flex items-center gap-3">
				<div class="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
					<ShieldCheck class="size-3.5 text-corporate-700" />
					<span>Environnement Production</span>
				</div>

				<a
					href="mailto:3636.valdepharm@fareva.com?subject=[IRIS]%20Demande%20d'assistance%20Sage%20X3"
					class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-corporate-200 hover:text-corporate-700 transition"
					title="Contacter le support 3636"
				>
					<Mail class="size-3.5" />
					<span class="hidden sm:inline">Support 3636</span>
				</a>
			</div>
		</div>
	</header>

	<!-- Contenu de la page -->
	<div class="flex-1">
		{@render children()}
	</div>
</div>
