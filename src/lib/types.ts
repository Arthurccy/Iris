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
