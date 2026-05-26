<script lang="ts">
	import { Check, Clipboard, FileCode2, Mail, ShieldCheck } from 'lucide-svelte';
	import type { FieldDefinition, QueryMatch } from '$lib/types';

	type Props = {
		selectedFields: FieldDefinition[];
		matches: QueryMatch[];
		fallbackMailTo: string;
		fallbackHref: string;
	};

	let { selectedFields, matches, fallbackMailTo, fallbackHref }: Props = $props();
	let copiedQueryId = $state<string | null>(null);

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
</script>

<section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
	<div class="border-b border-slate-200 p-5">
		<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.18em] text-corporate-600">Résultats</p>
				<h2 class="mt-1 text-xl font-semibold text-slate-950">Requêtes disponibles</h2>
				<p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
					Les meilleurs résultats sont ceux qui couvrent votre sélection avec le moins de champs en plus.
				</p>
			</div>

			<div class="rounded-md border border-corporate-200 bg-corporate-50 px-4 py-3 text-sm text-corporate-950">
				<div class="flex items-center gap-2 font-semibold">
					<ShieldCheck class="size-4" />
					Consultation read-only
				</div>
				<p class="mt-1 text-corporate-800">Aucune donnée n’est modifiée dans Sage X3.</p>
			</div>
		</div>
	</div>

	<div class="p-5">
		<div class="mb-5">
			<p class="mb-2 text-sm font-semibold text-slate-900">Besoin exprimé</p>
			<div class="flex flex-wrap gap-2">
				{#if selectedFields.length === 0}
					<span class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-500">
						Aucun champ sélectionné
					</span>
				{:else}
					{#each selectedFields as field}
						<span class="rounded-full border border-corporate-200 bg-corporate-50 px-3 py-1.5 text-sm text-corporate-800">
							{field.label}
							<span class="ml-1 text-corporate-500">({field.code})</span>
						</span>
					{/each}
				{/if}
			</div>
		</div>

		{#if selectedFields.length === 0}
			<div class="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
				<p class="text-lg font-semibold text-slate-900">Sélectionnez des champs pour lancer le matching</p>
				<p class="mt-2 text-sm leading-6 text-slate-600">
					IRIS traduira les codes techniques en labels métier puis comparera votre besoin avec le catalogue
					de requêtes SQL disponibles.
				</p>
			</div>
		{:else if matches.length > 0}
			<div class="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
				<span class="font-semibold">{matches.length} requête(s) trouvée(s).</span>
				La première carte est généralement la plus proche de votre demande.
			</div>

			<div class="grid gap-4">
				{#each matches as query, index}
					<article class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
						<div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
							<div class="space-y-3">
								<div class="flex flex-wrap items-center gap-2">
									<span class="rounded-full bg-corporate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-corporate-700">
										#{index + 1} · {query.domain}
									</span>
									<span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
										{query.owner}
									</span>
									<span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
										{query.fields.length} champs au total
									</span>
								</div>

								<div>
									<h3 class="text-xl font-semibold text-slate-950">{query.title}</h3>
									<p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{query.description}</p>
								</div>
							</div>

							<div class="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-left xl:text-right">
								<p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Couverture</p>
								<p class="text-lg font-semibold text-slate-950">
									{selectedFields.length}/{selectedFields.length} demandé(s)
								</p>
								<p class="text-sm text-slate-500">{query.extraFields.length} champ(s) additionnel(s)</p>
							</div>
						</div>

						<div class="mt-5 grid gap-4 xl:grid-cols-[1fr,1.15fr]">
							<div class="rounded-md bg-slate-50 p-4">
								<p class="mb-3 text-sm font-semibold text-slate-900">Champs inclus</p>
								<div class="flex flex-wrap gap-2">
									{#each query.fields as fieldCode}
										<span
											class={`rounded-full px-3 py-1 text-xs font-medium ${
												selectedFields.some((field) => field.code === fieldCode)
													? 'bg-corporate-600 text-white'
													: 'bg-white text-slate-600 ring-1 ring-slate-200'
											}`}
										>
											{fieldCode}
										</span>
									{/each}
								</div>
							</div>

							<div class="overflow-hidden rounded-md border border-slate-800 bg-slate-950 text-white">
								<div class="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
									<div class="flex items-center gap-2 text-sm font-semibold text-slate-100">
										<FileCode2 class="size-4" />
										SQL disponible
									</div>
									<button
										class="inline-flex items-center gap-2 rounded-md border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-white/10"
										type="button"
										onclick={() => copySql(query)}
									>
										{#if copiedQueryId === query.id}
											<Check class="size-3.5" />
											Copié
										{:else}
											<Clipboard class="size-3.5" />
											Copier
										{/if}
									</button>
								</div>
								<pre class="max-h-80 overflow-auto whitespace-pre-wrap break-words p-4 text-xs leading-6 text-slate-100">{query.sql}</pre>
							</div>
						</div>

						<div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm text-slate-500">
							<span>Dernière mise à jour : {query.lastUpdated}</span>
							<span class="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
								{query.system}
							</span>
						</div>
					</article>
				{/each}
			</div>
		{:else}
			<div class="rounded-lg border border-dashed border-corporate-200 bg-corporate-50 p-6">
				<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div class="max-w-2xl space-y-2">
						<p class="text-sm font-semibold uppercase tracking-[0.18em] text-corporate-700">Bouton 3636</p>
						<h3 class="text-xl font-semibold text-slate-950">Aucune requête existante ne couvre ce besoin</h3>
						<p class="text-sm leading-6 text-slate-700">
							IRIS prépare un e-mail vers {fallbackMailTo} avec la liste exacte des champs demandés
							pour accélérer la création d’une nouvelle extraction.
						</p>
					</div>

					<a
						class="inline-flex items-center justify-center gap-2 rounded-md bg-corporate-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-corporate-700"
						href={fallbackHref}
					>
						<Mail class="size-4" />
						Demander la création
					</a>
				</div>
			</div>
		{/if}
	</div>
</section>
