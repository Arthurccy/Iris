import type { FieldDefinition, MatchResults, QueryDefinition, QueryMatch } from '$lib/types';

export function normalizeText(value: string) {
	return value
		.trim()
		.toLowerCase()
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '');
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
		].join(' ');

		return normalizeText(haystack).includes(normalized);
	});
}

export function matchQueries(selectedCodes: string[], queries: QueryDefinition[]): MatchResults {
	if (selectedCodes.length === 0) {
		return {
			exact: [],
			partial: [],
			totalExact: 0,
			totalPartial: 0
		};
	}

	const requiredSet = new Set(selectedCodes);

	const allMatches: QueryMatch[] = queries
		.map((query) => {
			const matchedFields = query.fields.filter((field) => requiredSet.has(field));
			const missingFields = selectedCodes.filter((field) => !query.fields.includes(field));
			const extraFields = query.fields.filter((field) => !requiredSet.has(field));
			const isExact = missingFields.length === 0;

			return {
				...query,
				matchedCount: matchedFields.length,
				matchedFields,
				missingFields,
				extraFields,
				matchRate: query.fields.length > 0 ? matchedFields.length / query.fields.length : 0,
				coverageRate: selectedCodes.length > 0 ? matchedFields.length / selectedCodes.length : 0,
				isExact
			};
		})
		.filter((match) => match.matchedCount > 0);

	const exact = allMatches
		.filter((match) => match.isExact)
		.sort((left, right) => {
			if (left.extraFields.length !== right.extraFields.length) {
				return left.extraFields.length - right.extraFields.length;
			}
			return left.title.localeCompare(right.title, 'fr');
		});

	const partial = allMatches
		.filter((match) => !match.isExact)
		.sort((left, right) => {
			if (right.coverageRate !== left.coverageRate) {
				return right.coverageRate - left.coverageRate;
			}
			if (right.matchedCount !== left.matchedCount) {
				return right.matchedCount - left.matchedCount;
			}
			if (left.extraFields.length !== right.extraFields.length) {
				return left.extraFields.length - right.extraFields.length;
			}
			return left.title.localeCompare(right.title, 'fr');
		});

	return {
		exact,
		partial,
		totalExact: exact.length,
		totalPartial: partial.length
	};
}

export function buildFallbackMail(
	selectedFields: FieldDefinition[],
	mailTo = '3636.valdepharm@fareva.com'
) {
	const subject = `Demande d'extraction Sage X3 - ${selectedFields.length} champ(s)`;
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
		'Contexte : application IRIS (consultation interne Sage X3).',
		'Merci.'
	];

	return `mailto:${mailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
		bodyLines.join('\n')
	)}`;
}
