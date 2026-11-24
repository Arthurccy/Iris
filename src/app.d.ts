import type { LdapUser } from '$lib/server/ldap';
import type { UserPermissions } from '$lib/server/permissions';

declare global {
	namespace App {
		interface Locals {
			user: LdapUser | null;
			realUser?: LdapUser | null;
			simulatedRole?: string | null;
			permissions: UserPermissions;
		}
	}
}

export {};
