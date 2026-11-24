import permissionsConfig from './permissions.json';
import type { LdapUser } from './ldap';

export interface UserPermissions {
	canEdit: boolean;
	allowedTables: number[];
	allTablesAllowed: boolean;
	roleLabel: string;
}

/**
 * Calcule les permissions d'un utilisateur sur les tables diverses X3.
 */
export function getPermissionsForUser(user: LdapUser | null | undefined): UserPermissions {
	if (!user) {
		return {
			canEdit: false,
			allowedTables: [],
			allTablesAllowed: false,
			roleLabel: 'Non connecté'
		};
	}

	// 1. Administrateur IRIS / SAGE : accès total en écriture et lecture
	if (user.isAdmin) {
		return {
			canEdit: true,
			allowedTables: [],
			allTablesAllowed: true,
			roleLabel: 'Administrateur (Accès total)'
		};
	}

	// Vérification si un des groupes de l'utilisateur correspond aux adminGroups déclarés
	const userGroupsLower = (user.groups || []).map((g) => g.toLowerCase());
	const isAdminByGroup = permissionsConfig.adminGroups.some((ag) =>
		userGroupsLower.includes(ag.toLowerCase())
	);

	if (isAdminByGroup) {
		return {
			canEdit: true,
			allowedTables: [],
			allTablesAllowed: true,
			roleLabel: 'Administrateur (Groupe AD)'
		};
	}

	// 2. Recherche des tables autorisées selon les groupes AD et le département
	const allowedTablesSet = new Set<number>();
	const matchedLabels: string[] = [];
	const userDeptUpper = (user.department || '').toUpperCase();

	for (const rule of permissionsConfig.groupRules) {
		const ruleGroupNames = [rule.groupName, ...((rule as any).aliases || [])].map((g: string) =>
			g.toLowerCase()
		);
		const groupMatches = userGroupsLower.some((ug) => ruleGroupNames.includes(ug));
		const deptMatches = rule.department && userDeptUpper.includes(rule.department.toUpperCase());

		if (groupMatches || deptMatches) {
			rule.allowedTables.forEach((num) => allowedTablesSet.add(num));
			matchedLabels.push(rule.label);
		}
	}

	const allowedTables = Array.from(allowedTablesSet);
	const canEdit = allowedTables.length > 0;

	return {
		canEdit,
		allowedTables,
		allTablesAllowed: false,
		roleLabel: matchedLabels.length > 0 ? matchedLabels.join(' / ') : 'Visiteur sans droit'
	};
}

/**
 * Vérifie si l'utilisateur a le droit de modifier une table spécifique.
 */
export function canUserEditTable(user: LdapUser | null | undefined, numtab: number): boolean {
	const perms = getPermissionsForUser(user);
	if (perms.allTablesAllowed) return true;
	return perms.allowedTables.includes(numtab);
}
