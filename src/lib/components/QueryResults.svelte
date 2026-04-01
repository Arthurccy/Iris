<script lang="ts">
	import { FileCode2, Mail, ShieldCheck } from 'lucide-svelte';
	import type { FieldDefinition, QueryMatch } from '$lib/types';

	type Props = {
		selectedFields: FieldDefinition[];
		matches: QueryMatch[];
		fallbackMailTo: string;
		fallbackHref: string;
	};

	let { selectedFields, matches, fallbackMailTo, fallbackHref }: Props = $props();
</script>

<section class="glass-card overflow-hidden">
	<div class="section-divider flex flex-col gap-3 p-6 lg:flex-row lg:items-center lg:justify-between">
		<div class="space-y-2">
			<p class="text-sm font-semibold uppercase tracking-[0.24em] text-corporate-600">Résultats</p>
			<h2 class="text-2xl font-semibold text-slate-900">Matching de requêtes existantes</h2>
			<p class="max-w-2xl text-sm leading-6 text-slate-600">
				L’algorithme remonte les requêtes dont la couverture contient au moins tous les champs cochés. Une
				requête plus riche reste donc éligible.
			</p>
		</div>

		<div class="rounded-2xl border border-corporate-200 bg-corporate-50 px-4 py-3 text-sm text-corporate-900">
			<div class="flex items-center gap-2 font-medium">
				<ShieldCheck class="size-4" />
				Consultation read-only
			</div>
			<p class="mt-1 text-emerald-800/80">Aucune édition de données. Accès rapide à la doc et au SQL.</p>
		</div>
	</div>

	<div class="p-6">
		<div class="mb-6 flex flex-wrap gap-2">
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

		{#if selectedFields.length === 0}
			<div class="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center">
				<p class="text-lg font-semibold text-slate-900">Sélectionnez des champs pour lancer le matching</p>
				<p class="mt-2 text-sm leading-6 text-slate-600">
					L’app traduira les codes techniques en labels métiers puis comparera votre besoin avec le catalogue
					de requêtes SQL disponibles.
				</p>
			</div>
		{:else if matches.length > 0}
			<div class="grid gap-4">
				{#each matches as query}
					<article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
						<div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
							<div class="space-y-3">
								<div class="flex flex-wrap items-center gap-2">
									<span class="rounded-full bg-corporate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-corporate-700">
										{query.domain}
									</span>
									<span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
										{query.owner}
									</span>
									<span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
										{query.fields.length} champs
									</span>
								</div>

								<div>
									<h3 class="text-xl font-semibold text-slate-900">{query.title}</h3>
									<p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{query.description}</p>
								</div>
							</div>

							<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
								<p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Couverture</p>
								<p class="text-lg font-semibold text-slate-900">
									{selectedFields.length}/{selectedFields.length} demandés
								</p>
								<p class="text-sm text-slate-500">{query.extraFields.length} champ(s) additionnel(s)</p>
							</div>
						</div>

						<div class="mt-5 grid gap-4 xl:grid-cols-[1.1fr,1.2fr]">
							<div class="rounded-2xl bg-pearl p-4">
								<p class="mb-3 text-sm font-semibold text-slate-900">Champs inclus</p>
								<div class="flex flex-wrap gap-2">
									{#each query.fields as fieldCode}
										<span
											class={`rounded-full px-3 py-1 text-xs font-medium ${
												selectedFields.some((field) => field.code === fieldCode)
													? 'bg-corporate-600 text-white'
													: 'bg-white text-slate-600'
											}`}
										>
											{fieldCode}
										</span>
									{/each}
								</div>
							</div>

							<div class="rounded-2xl border border-corporate-800 bg-corporate-900 p-4 text-white">
								<div class="mb-3 flex items-center gap-2 text-sm font-semibold text-corporate-100">
									<FileCode2 class="size-4" />
									SQL disponible
								</div>
								<pre class="overflow-x-auto whitespace-pre-wrap break-words text-xs leading-6 text-corporate-100/90">{query.sql}</pre>
							</div>
						</div>

						<div class="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm text-slate-500">
							<span>Dernière mise à jour : {query.lastUpdated}</span>
							<span class="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
								{query.system}
							</span>
						</div>
					</article>
				{/each}
			</div>
		{:else}
			<div class="rounded-3xl border border-dashed border-corporate-200 bg-corporate-50 p-8">
				<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div class="max-w-2xl space-y-2">
						<p class="text-sm font-semibold uppercase tracking-[0.22em] text-corporate-700">Bouton 3636</p>
						<h3 class="text-xl font-semibold text-slate-900">Aucune requête existante ne couvre ce besoin</h3>
						<p class="text-sm leading-6 text-slate-700">
							Le fallback prépare un e-mail vers {fallbackMailTo} avec la liste exacte des champs demandés
							pour accélérer la création d’une nouvelle extraction.
						</p>
					</div>

					<a
						class="inline-flex items-center justify-center gap-2 rounded-2xl bg-corporate-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-corporate-700"
						href={fallbackHref}
					>
						<Mail class="size-4" />
						Demander la création de la requête
					</a>
				</div>
			</div>
		{/if}
	</div>
</section>
