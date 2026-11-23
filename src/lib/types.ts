export type FieldDefinition = {
	code: string;
	label: string;
	category: string;
	group: string;
	table: string;
	description: string;
	keywords: string[];
};

export type QueryDefinition = {
	id: string;
	title: string;
	domain: string;
	system: string;
	description: string;
	fields: string[];
	sql: string;
	owner: string;
	lastUpdated: string;
};

export type QueryMatch = QueryDefinition & {
	matchedCount: number;
	matchedFields: string[];
	missingFields: string[];
	extraFields: string[];
	matchRate: number;
	coverageRate: number;
	isExact: boolean;
};

export type MatchResults = {
	exact: QueryMatch[];
	partial: QueryMatch[];
	totalExact: number;
	totalPartial: number;
};

export type MiscTableItem = {
	code: string;
	shortLabel: string;
	label: string;
	param_a1?: string;
	param_n1?: string;
	isActive?: boolean;
	parameters?: Record<string, string | number>;
	notes?: string;
};

export type MiscTableDefinition = {
	numtab: number;
	name?: string;
	title: string;
	category: string;
	description?: string;
	itemCount?: number;
	usedInFields?: string[];
	usedInScreens?: string[];
	items: MiscTableItem[];
};

export type MiscTableRequest = {
	numtab: number;
	tableTitle: string;
	code: string;
	shortLabel: string;
	label: string;
	param_a1?: string;
	param_n1?: string;
	reason: string;
	requesterName: string;
	requesterEmail: string;
};
