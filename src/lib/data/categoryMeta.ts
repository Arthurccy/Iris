import { Factory, FlaskConical, Package, Settings, ShoppingCart, Store, Workflow } from 'lucide-svelte';

export const categoryMeta = {
	Production: {
		title: 'Production',
		description: 'OF, quantités, articles et cadence atelier.',
		icon: Factory,
		accent: 'from-corporate-600/15 via-corporate-100/40 to-white'
	},
	Qualité: {
		title: 'Qualité',
		description: 'Lots, statuts, inspections et audit qualité.',
		icon: FlaskConical,
		accent: 'from-corporate-500/14 via-corporate-50/90 to-white'
	},
	Stocks: {
		title: 'Stocks',
		description: 'Disponibilité, emplacement, site et traçabilité.',
		icon: Package,
		accent: 'from-corporate-700/12 via-corporate-100/35 to-white'
	},
	Achats: {
		title: 'Achats',
		description: 'Fournisseurs, commandes, réceptions et factures.',
		icon: ShoppingCart,
		accent: 'from-corporate-700/12 via-corporate-100/35 to-white'
	},
	Ventes: {
		title: 'Ventes',
		description: 'Clients, commandes, portefeuille et blocages.',
		icon: Store,
		accent: 'from-corporate-700/12 via-corporate-100/35 to-white'
	},
	Administration: {
		title: 'Administration',
		description: 'Profils, habilitations, accès et paramètres Sage X3.',
		icon: Settings,
		accent: 'from-corporate-700/12 via-corporate-100/35 to-white'
	},
	Transverse: {
		title: 'Transverse',
		description: 'Requêtes générales ou multi-domaines.',
		icon: Workflow,
		accent: 'from-corporate-700/12 via-corporate-100/35 to-white'
	}
} as const;

export type CategoryName = keyof typeof categoryMeta;
