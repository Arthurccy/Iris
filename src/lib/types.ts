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
	extraFields: string[];
	matchRate: number;
};
