<script lang="ts">
	import { Search, CheckCircle2 } from 'lucide-svelte';
	import { categoryMeta, type CategoryName } from '$lib/data/categoryMeta';
	import type { FieldDefinition } from '$lib/types';

	type Props = {
		categories: CategoryName[];
		fieldsByCategory: Record<string, FieldDefinition[]>;
		selectedCodes: string[];
		searchTerm: string;
		onToggleField: (code: string) => void;
		onClearSelection: () => void;
		onSearchChange: (value: string) => void;
	};

	let {
		categories,
		fieldsByCategory,
		selectedCodes,
		searchTerm,
		onToggleField,
		onClearSelection,
		onSearchChange
	}: Props = $props();

	let openCategory = $state<CategoryName | null>(null);

	$effect(() => {
		if (!openCategory && categories.length > 0) {
			openCategory = categories[0];
		}
	});

	const isSelected = (code: string) => selectedCodes.includes(code);
</script>

<section class="glass-card overflow-hidden">
	<div class="section-divider flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between">
		<div class="space-y-2">
			<p class="text-sm font-semibold uppercase tracking-[0.24em] text-corporate-600">Catalogue métier</p>
			<h2 class="text-2xl font-semibold text-slate-900">Sélection des champs Sage X3</h2>
			<p class="max-w-2xl text-sm leading-6 text-slate-600">
				Cliquez sur une famille, cochez les champs utiles, puis laissez le moteur retrouver les requêtes
				existantes qui couvrent au minimum votre besoin.
			</p>
		</div>

		<div class="flex flex-col gap-3 sm:flex-row">
			<label class="relative block min-w-[18rem]">
				<Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
				<input
					class="w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm outline-none transition focus:border-corporate-300 focus:ring-4 focus:ring-corporate-100"
					type="search"
					placeholder="Rechercher un code, un label, une table..."
					value={searchTerm}
					oninput={(event) => onSearchChange((event.currentTarget as HTMLInputElement).value)}
				/>
			</label>

			<button
				class="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-corporate-200 hover:text-corporate-700"
				type="button"
				onclick={onClearSelection}
			>
				Vider la sélection
			</button>
		</div>
	</div>

	<div class="grid gap-4 p-6 xl:grid-cols-[1.05fr,1.55fr]">
		<div class="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
			{#each categories as category}
				{@const meta = categoryMeta[category]}
				<button
					type="button"
					class={`rounded-3xl border p-5 text-left transition ${
						openCategory === category
							? 'border-corporate-300 bg-gradient-to-br shadow-sm'
							: 'border-slate-200 bg-white hover:border-slate-300'
					} ${meta.accent}`}
					onclick={() => (openCategory = openCategory === category ? null : category)}
				>
					<meta.icon class="mb-4 size-5 text-corporate-700" />
					<div class="flex items-start justify-between gap-3">
						<div>
							<h3 class="text-lg font-semibold text-slate-900">{meta.title}</h3>
							<p class="mt-2 text-sm leading-6 text-slate-600">{meta.description}</p>
						</div>
						<span class="rounded-full border border-white/80 bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-600">
							{fieldsByCategory[category]?.length ?? 0}
						</span>
					</div>
				</button>
			{/each}
		</div>

		<div class="rounded-3xl border border-slate-200 bg-white/70 p-4">
			{#if openCategory}
				<div class="mb-4 flex items-center justify-between gap-4 rounded-2xl bg-pearl px-4 py-3">
					<div>
						<p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Champs visibles</p>
						<h3 class="text-lg font-semibold text-slate-900">{openCategory}</h3>
					</div>
					<span class="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
						{fieldsByCategory[openCategory]?.length ?? 0} champ(s)
					</span>
				</div>

				<div class="grid max-h-[34rem] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
					{#each fieldsByCategory[openCategory] ?? [] as field}
						<label
							class={`group flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${
								isSelected(field.code)
									? 'border-corporate-300 bg-corporate-50'
									: 'border-slate-200 bg-white hover:border-corporate-200 hover:bg-slate-50'
							}`}
						>
							<input
								class="mt-1 size-4 rounded border-slate-300 text-corporate-600 focus:ring-corporate-300"
								type="checkbox"
								checked={isSelected(field.code)}
								onchange={() => onToggleField(field.code)}
							/>
							<div class="min-w-0 flex-1">
								<div class="flex items-center justify-between gap-3">
									<div>
										<p class="text-sm font-semibold text-slate-900">{field.label}</p>
										<p class="text-xs uppercase tracking-[0.2em] text-slate-500">{field.code}</p>
									</div>
									{#if isSelected(field.code)}
										<CheckCircle2 class="size-4 shrink-0 text-corporate-600" />
									{/if}
								</div>
								<p class="mt-2 text-sm leading-6 text-slate-600">{field.description}</p>
								<div class="mt-3 flex items-center gap-2 text-xs text-slate-500">
									<span class="rounded-full bg-slate-100 px-2.5 py-1">{field.table}</span>
									{#each field.keywords.slice(0, 2) as keyword}
										<span class="rounded-full bg-slate-100 px-2.5 py-1">{keyword}</span>
									{/each}
								</div>
							</div>
						</label>
					{/each}
				</div>
			{:else}
				<div class="flex h-full min-h-64 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
					<div class="space-y-2">
						<p class="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Navigation</p>
						<p class="text-lg font-semibold text-slate-900">Choisissez une famille à explorer</p>
						<p class="max-w-md text-sm leading-6 text-slate-600">
							Les champs sont regroupés par usage métier pour accélérer la consultation en atelier, qualité
							ou logistique.
						</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
</section>
