import { Factory, FlaskConical, Package } from 'lucide-svelte';

export const categoryMeta = {
	Production: {
		title: 'Production',
		description: "OF, quantités, articles et cadence atelier.",
		icon: Factory,
		accent: 'from-corporate-600/15 via-corporate-100/40 to-white'
	},
	Qualité: {
		title: 'Qualité',
		description: 'Lots, statuts, inspections et audit qualité.',
		icon: FlaskConical,
		accent: 'from-emerald-500/15 via-emerald-100/40 to-white'
	},
	Stocks: {
		title: 'Stocks',
		description: 'Disponibilité, emplacement, site et traçabilité.',
		icon: Package,
		accent: 'from-amber-500/15 via-amber-100/40 to-white'
	}
} as const;

export type CategoryName = keyof typeof categoryMeta;
