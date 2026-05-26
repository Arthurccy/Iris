import type { FieldDefinition, QueryDefinition, QueryMatch } from '$lib/types';

export function normalizeText(value: string) {
	return value.trim().toLowerCase();
}

export function filterFields(fields: FieldDefinition[], searchTerm: string) {
	const normalized = normalizeText(searchTerm);
	if (!normalized) {
		return fields;
	}

	return fields.filter((field) => {
		const haystack = [
			field.code,
			field.label,
			field.table,
			field.group,
			field.description,
			...(field.keywords ?? [])
		]
			.join(' ')
			.toLowerCase();

		return haystack.includes(normalized);
	});
}

export function matchQueries(selectedCodes: string[], queries: QueryDefinition[]): QueryMatch[] {
	if (selectedCodes.length === 0) {
		return [];
	}

	const requiredFields = new Set(selectedCodes);

	return queries
		.filter((query) => selectedCodes.every((code) => query.fields.includes(code)))
		.map((query) => {
			const extraFields = query.fields.filter((field) => !requiredFields.has(field));
			return {
				...query,
				matchedCount: selectedCodes.length,
				extraFields,
				matchRate: selectedCodes.length / query.fields.length
			};
		})
		.sort((left, right) => {
			if (left.extraFields.length !== right.extraFields.length) {
				return left.extraFields.length - right.extraFields.length;
			}

			return left.title.localeCompare(right.title, 'fr');
		});
}

export function buildFallbackMail(
	selectedFields: FieldDefinition[],
	mailTo = '3636.valdepharm@fareva.com'
) {
	const subject = `Demande de création de requête Sage X3 - ${selectedFields.length} champ(s)`;
	const bodyLines = [
		'Bonjour,',
		'',
		"Aucune requête existante ne couvre exactement mon besoin de consultation Sage X3.",
		'Merci de créer ou compléter une extraction read-only avec les champs suivants :',
		'',
		...selectedFields.map(
			(field) =>
				`- ${field.code} | ${field.label} | ${field.category} > ${field.group} | table ${field.table}`
		),
		'',
		'Contexte : application de consultation interne Sage X3.',
		'Merci.'
	];

	return `mailto:${mailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
		bodyLines.join('\n')
	)}`;
}
