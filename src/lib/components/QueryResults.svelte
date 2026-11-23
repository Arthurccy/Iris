<script lang="ts">
	import {
		AlertCircle,
		Check,
		CheckCircle2,
		ChevronDown,
		ChevronUp,
		Clipboard,
		FileCode2,
		Layers,
		Mail,
		ShieldCheck
	} from 'lucide-svelte';
	import type { FieldDefinition, MatchResults, QueryMatch } from '$lib/types';

	type Props = {
		selectedFields: FieldDefinition[];
		matchResults: MatchResults;
		fallbackMailTo: string;
		fallbackHref: string;
	};

	let { selectedFields, matchResults, fallbackMailTo, fallbackHref }: Props = $props();

	let copiedQueryId = $state<string | null>(null);
	let expandedSqlIds = $state<string[]>([]);
	let activeTab = $state<'exact' | 'partial'>('exact');

	// Initialiser l'onglet par défaut selon les résultats disponibles
	$effect(() => {
		if (matchResults.totalExact === 0 && matchResults.totalPartial > 0) {
			activeTab = 'partial';
		} else {
			activeTab = 'exact';
		}
	});

	async function copySql(query: QueryMatch) {
		if (!navigator.clipboard) {
			return;
		}

		await navigator.clipboard.writeText(query.sql);
		copiedQueryId = query.id;
		window.setTimeout(() => {
			if (copiedQueryId === query.id) {
				copiedQueryId = null;
			}
		}, 1800);
	}

	function toggleSqlExpanded(queryId: string) {
		if (expandedSqlIds.includes(queryId)) {
			expandedSqlIds = expandedSqlIds.filter((id) => id !== queryId);
		} else {
			expandedSqlIds = [...expandedSqlIds, queryId];
		}
	}

	const isSqlExpanded = (queryId: string) => expandedSqlIds.includes(queryId);
	const countSqlLines = (sql: string) => sql.split('\n').length;
</script>

<section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
	<!-- En-tête des résultats -->
	<div class="border-b border-slate-200 p-5 bg-slate-50/50">
		<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.18em] text-corporate-600">Résultats du matching</p>
				<h2 class="mt-1 text-xl font-semibold text-slate-950">Requêtes SQL Sage X3 identifiées</h2>
				<p class="mt-1.5 max-w-2xl text-xs leading-5 text-slate-600">
					Les résultats sont classés par taux de couverture de vos critères métier et nombre de champs additionnels.
				</p>
			</div>

			<div class="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-700 shadow-xs">
				<div class="flex items-center gap-1.5 font-semibold text-corporate-800">
					<ShieldCheck class="size-4" />
					Mode consultation read-only
				</div>
				<p class="mt-0.5 text-[11px] text-slate-500">Aucune modification n'est apportée dans Sage X3.</p>
			</div>
		</div>

		<!-- Récapitulatif des champs sélectionnés -->
		<div class="mt-4 pt-3 border-t border-slate-200">
			<p class="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Critères demandés ({selectedFields.length})</p>
			<div class="flex flex-wrap gap-1.5">
				{#if selectedFields.length === 0}
					<span class="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-500">
						Aucun champ sélectionné
					</span>
				{:else}
					{#each selectedFields as field}
						<span class="inline-flex items-center gap-1.5 rounded-lg border border-corporate-200 bg-corporate-50/80 px-2.5 py-1 text-xs text-corporate-900">
							<span class="font-semibold">{field.label}</span>
							<span class="font-mono text-[10px] text-corporate-700">({field.code})</span>
						</span>
					{/each}
				{/if}
			</div>
		</div>

		<!-- Onglets de navigation entre Correspondances Exactes et Approchantes -->
		{#if selectedFields.length > 0}
			<div class="mt-4 flex items-center gap-2 border-t border-slate-200 pt-3">
				<button
					type="button"
					class="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition {
						activeTab === 'exact'
							? 'bg-corporate-600 text-white shadow-xs'
							: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
					}"
					onclick={() => (activeTab = 'exact')}
				>
					<CheckCircle2 class="size-3.5" />
					<span>Correspondances exactes</span>
					<span class="rounded-full px-1.5 py-0.2 text-[10px] {
						activeTab === 'exact' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
					}">
						{matchResults.totalExact}
					</span>
				</button>

				<button
					type="button"
					class="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition {
						activeTab === 'partial'
							? 'bg-corporate-600 text-white shadow-xs'
							: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
					}"
					onclick={() => (activeTab = 'partial')}
				>
					<Layers class="size-3.5" />
					<span>Requêtes approchantes</span>
					<span class="rounded-full px-1.5 py-0.2 text-[10px] {
						activeTab === 'partial' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
					}">
						{matchResults.totalPartial}
					</span>
				</button>
			</div>
		{/if}
	</div>

	<!-- Corps des résultats -->
	<div class="p-5">
		{#if selectedFields.length === 0}
			<div class="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
				<p class="text-sm font-semibold text-slate-900">Sélectionnez des champs pour analyser le catalogue</p>
				<p class="mt-1.5 text-xs text-slate-600">
					Cochez vos critères dans le catalogue à gauche. IRIS comparera instantanément votre besoin avec les 183 requêtes SQL enregistrées.
				</p>
			</div>

		<!-- ONGLET 1 : CORRESPONDANCES EXACTES -->
		{:else if activeTab === 'exact'}
			{#if matchResults.exact.length > 0}
				<div class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-950 flex items-center justify-between gap-3">
					<div class="flex items-center gap-2 font-medium">
						<CheckCircle2 class="size-4 shrink-0 text-emerald-600" />
						<span>{matchResults.totalExact} requête(s) contiennent 100% des champs demandés.</span>
					</div>
					<span class="text-[11px] text-emerald-800">Classées par pertinence</span>
				</div>

				<div class="grid gap-4">
					{#each matchResults.exact as query, index}
						{@const lineCount = countSqlLines(query.sql)}
						{@const isExpanded = isSqlExpanded(query.id)}
						<article class="group rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-corporate-200 hover:shadow-sm">
							<div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
								<div class="space-y-2">
									<div class="flex flex-wrap items-center gap-2">
										<span class="rounded-full bg-corporate-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-corporate-700">
											#{index + 1} · {query.domain}
										</span>
										<span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
											{query.owner}
										</span>
										<span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
											{query.fields.length} champ(s) au total
										</span>
									</div>

									<div>
										<h3 class="text-base font-semibold text-slate-950">{query.title}</h3>
										<p class="mt-1 text-xs leading-5 text-slate-600 max-w-3xl">{query.description}</p>
									</div>
								</div>

								<div class="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-left lg:text-right shrink-0">
									<p class="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Couverture</p>
									<p class="text-sm font-semibold text-emerald-700">
										{selectedFields.length}/{selectedFields.length} demandés (100%)
									</p>
									<p class="text-[11px] text-slate-500">+{query.extraFields.length} champ(s) additionnel(s)</p>
								</div>
							</div>

							<!-- Champs inclus & Bloc SQL -->
							<div class="mt-4 grid gap-4 lg:grid-cols-[1fr,1.3fr]">
								<div class="rounded-lg bg-slate-50 p-3">
									<p class="mb-2 text-xs font-semibold text-slate-900">Champs inclus dans cette requête</p>
									<div class="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
										{#each query.fields as fieldCode}
											{@const isRequested = selectedFields.some((f) => f.code === fieldCode)}
											<span
												class="rounded-md px-2 py-0.5 text-[11px] font-mono {
													isRequested
														? 'bg-corporate-600 text-white font-semibold'
														: 'bg-white text-slate-600 border border-slate-200'
												}"
												title={isRequested ? 'Champ de votre sélection' : 'Champ additionnel'}
											>
												{fieldCode}
											</span>
										{/each}
									</div>
								</div>

								<div class="overflow-hidden rounded-lg border border-slate-800 bg-slate-900 text-slate-200 shadow-inner">
									<div class="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2 bg-slate-950/40">
										<div class="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
											<FileCode2 class="size-3.5" />
											<span>Requête SQL ({lineCount} lignes)</span>
										</div>
										<button
											class="inline-flex items-center gap-1.5 rounded border border-white/20 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:bg-white/10"
											type="button"
											onclick={() => copySql(query)}
										>
											{#if copiedQueryId === query.id}
												<Check class="size-3 text-emerald-400" />
												<span class="text-emerald-400">Copié</span>
											{:else}
												<Clipboard class="size-3" />
												<span>Copier SQL</span>
											{/if}
										</button>
									</div>

									<pre class="p-3 font-mono text-xs leading-relaxed text-slate-200 overflow-x-auto {
										isExpanded ? 'max-h-[36rem]' : 'max-h-36 overflow-y-hidden'
									}">{query.sql}</pre>

									{#if lineCount > 6}
										<div class="border-t border-white/10 bg-slate-950/60 px-3 py-1.5 text-center">
											<button
												type="button"
												class="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 hover:text-white transition"
												onclick={() => toggleSqlExpanded(query.id)}
											>
												{#if isExpanded}
													<ChevronUp class="size-3" />
													<span>Réduire l'affichage SQL</span>
												{:else}
													<ChevronDown class="size-3" />
													<span>Afficher tout le code SQL ({lineCount} lignes)</span>
												{/if}
											</button>
										</div>
									{/if}
								</div>
							</div>

							<div class="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
								<span>Dernière mise à jour : {query.lastUpdated}</span>
								<span class="rounded bg-slate-100 px-2 py-0.5 text-slate-600 font-mono">
									{query.system}
								</span>
							</div>
						</article>
					{/each}
				</div>

			<!-- Si aucune correspondance exacte -->
			{:else}
				<div class="space-y-4">
					<div class="rounded-xl border border-corporate-200 bg-corporate-50/60 p-5">
						<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
							<div class="space-y-1.5">
								<div class="flex items-center gap-2">
									<AlertCircle class="size-4 text-corporate-700" />
									<p class="text-xs font-semibold uppercase tracking-wider text-corporate-700">Aucune correspondance exacte (100%)</p>
								</div>
								<h3 class="text-lg font-semibold text-slate-950">Aucune requête du catalogue ne réunit l'ensemble de vos critères</h3>
								<p class="text-xs leading-5 text-slate-700 max-w-2xl">
									Aucune extraction Sage X3 existante ne contient simultanément l'ensemble des {selectedFields.length} champs cochés.
									Vous pouvez déclencher une demande de création au support 3636 ou consulter les requêtes approchantes ci-dessous.
								</p>
							</div>

							<a
								class="inline-flex items-center justify-center gap-2 rounded-lg bg-corporate-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-corporate-700 shadow-sm shrink-0"
								href={fallbackHref}
							>
								<Mail class="size-4" />
								<span>Préparer ticket 3636</span>
							</a>
						</div>
					</div>

					<!-- S'il y a des requêtes approchantes, suggérer de les voir -->
					{#if matchResults.totalPartial > 0}
						<div class="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
							<div class="flex items-center justify-between pb-3 border-b border-slate-100">
								<div>
									<h4 class="text-sm font-semibold text-slate-900">
										{matchResults.totalPartial} requête(s) approchante(s) identifiée(s)
									</h4>
									<p class="text-xs text-slate-600">
										Ces requêtes couvrent une partie importante de vos critères et pourraient répondre à votre besoin.
									</p>
								</div>
								<button
									type="button"
									class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
									onclick={() => (activeTab = 'partial')}
								>
									<span>Basculer vers les requêtes approchantes</span>
									<ChevronDown class="size-3.5 -rotate-90" />
								</button>
							</div>
						</div>
					{/if}
				</div>
			{/if}

		<!-- ONGLET 2 : REQUÊTES APPROCHANTES -->
		{:else if activeTab === 'partial'}
			{#if matchResults.partial.length > 0}
				<div class="mb-4 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-950 flex items-center justify-between gap-3">
					<div class="flex items-center gap-2 font-medium">
						<Layers class="size-4 shrink-0 text-amber-600" />
						<span>{matchResults.totalPartial} requête(s) couvrent au moins une partie de vos critères.</span>
					</div>
					<span class="text-[11px] text-amber-800">Classées par taux de couverture</span>
				</div>

				<div class="grid gap-4">
					{#each matchResults.partial as query, index}
						{@const lineCount = countSqlLines(query.sql)}
						{@const isExpanded = isSqlExpanded(query.id)}
						{@const coveragePercent = Math.round(query.coverageRate * 100)}
						<article class="group rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300 hover:shadow-sm">
							<div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
								<div class="space-y-2">
									<div class="flex flex-wrap items-center gap-2">
										<span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-700">
											#{index + 1} · {query.domain}
										</span>
										<span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
											{query.owner}
										</span>
										<span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
											{query.fields.length} champ(s) au total
										</span>
									</div>

									<div>
										<h3 class="text-base font-semibold text-slate-950">{query.title}</h3>
										<p class="mt-1 text-xs leading-5 text-slate-600 max-w-3xl">{query.description}</p>
									</div>
								</div>

								<div class="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-left lg:text-right shrink-0">
									<p class="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Couverture partielle</p>
									<p class="text-sm font-semibold text-amber-700">
										{query.matchedCount}/{selectedFields.length} demandés ({coveragePercent}%)
									</p>
									<p class="text-[11px] text-slate-500">{query.missingFields.length} champ(s) manquant(s)</p>
								</div>
							</div>

							<!-- Bilan des champs : Inclus vs Manquants -->
							<div class="mt-3 grid gap-2 sm:grid-cols-2 rounded-lg bg-slate-50 p-3 text-xs">
								<div>
									<p class="font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
										<CheckCircle2 class="size-3.5 text-emerald-600" />
										Champs présents ({query.matchedFields.length})
									</p>
									<div class="flex flex-wrap gap-1">
										{#each query.matchedFields as fieldCode}
											<span class="rounded bg-emerald-100 text-emerald-900 px-2 py-0.5 font-mono text-[11px]">
												{fieldCode}
											</span>
										{/each}
									</div>
								</div>

								<div>
									<p class="font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
										<AlertCircle class="size-3.5 text-rose-500" />
										Champs absents de cette requête ({query.missingFields.length})
									</p>
									<div class="flex flex-wrap gap-1">
										{#each query.missingFields as fieldCode}
											<span class="rounded bg-rose-50 border border-rose-200 text-rose-800 px-2 py-0.5 font-mono text-[11px]">
												{fieldCode}
											</span>
										{/each}
									</div>
								</div>
							</div>

							<!-- Bloc SQL -->
							<div class="mt-3 overflow-hidden rounded-lg border border-slate-800 bg-slate-900 text-slate-200 shadow-inner">
								<div class="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2 bg-slate-950/40">
									<div class="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
										<FileCode2 class="size-3.5" />
										<span>Requête SQL ({lineCount} lignes)</span>
									</div>
									<button
										class="inline-flex items-center gap-1.5 rounded border border-white/20 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:bg-white/10"
										type="button"
										onclick={() => copySql(query)}
									>
										{#if copiedQueryId === query.id}
											<Check class="size-3 text-emerald-400" />
											<span class="text-emerald-400">Copié</span>
										{:else}
											<Clipboard class="size-3" />
											<span>Copier SQL</span>
										{/if}
									</button>
								</div>

								<pre class="p-3 font-mono text-xs leading-relaxed text-slate-200 overflow-x-auto {
									isExpanded ? 'max-h-[36rem]' : 'max-h-36 overflow-y-hidden'
								}">{query.sql}</pre>

								{#if lineCount > 6}
									<div class="border-t border-white/10 bg-slate-950/60 px-3 py-1.5 text-center">
										<button
											type="button"
											class="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 hover:text-white transition"
											onclick={() => toggleSqlExpanded(query.id)}
										>
											{#if isExpanded}
												<ChevronUp class="size-3" />
												<span>Réduire l'affichage SQL</span>
											{:else}
												<ChevronDown class="size-3" />
												<span>Afficher tout le code SQL ({lineCount} lignes)</span>
											{/if}
										</button>
									</div>
								{/if}
							</div>

							<div class="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
								<span>Dernière mise à jour : {query.lastUpdated}</span>
								<span class="rounded bg-slate-100 px-2 py-0.5 text-slate-600 font-mono">
									{query.system}
								</span>
							</div>
						</article>
					{/each}
				</div>
			{:else}
				<div class="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
					<p class="text-sm font-semibold text-slate-900">Aucune requête approchante trouvée</p>
					<p class="mt-1.5 text-xs text-slate-600">
						Aucune requête SQL du catalogue ne partage de champ avec votre sélection actuelle.
					</p>
				</div>
			{/if}
		{/if}
	</div>
</section>
