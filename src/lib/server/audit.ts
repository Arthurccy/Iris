import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export interface AuditLogEntry {
	id: string;
	timestamp: string;
	action: 'ADD' | 'UPDATE';
	numtab: number;
	tableName: string;
	code: string;
	label: string;
	shortLabel: string;
	param_a1?: string;
	param_n1?: number;
	user: {
		username: string;
		displayName: string;
		mail: string;
		department: string;
	};
	reason: string;
	status: 'SUCCESS' | 'ERROR';
	details?: string;
}

const AUDIT_FILE_PATH = path.resolve(process.cwd(), 'data', 'audit_log.json');

/**
 * Lit l'historique complet des actions d'audit depuis le fichier persistant.
 */
async function readAuditFile(): Promise<AuditLogEntry[]> {
	try {
		const raw = await fs.readFile(AUDIT_FILE_PATH, 'utf8');
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch (err: any) {
		if (err.code === 'ENOENT') {
			// Création d'un fichier avec l'historique initial si non existant
			const initialEntries: AuditLogEntry[] = [
				{
					id: 'init-tst-001',
					timestamp: new Date().toISOString(),
					action: 'ADD',
					numtab: 1,
					tableName: 'Régimes de taxes tiers',
					code: 'TST',
					label: 'Voici un test de création du 2',
					shortLabel: 'Test de créa',
					param_a1: '',
					param_n1: 0,
					user: {
						username: 'ACOURCHA',
						displayName: 'Courchay, Arthur',
						mail: 'ACOURCHAY.valdepharm@fareva.com',
						department: 'Informatique'
					},
					reason: 'Test initial de création directe en base Sage X3 VDRSANDB',
					status: 'SUCCESS'
				}
			];
			await writeAuditFile(initialEntries);
			return initialEntries;
		}
		console.error('[AUDIT READ ERROR]', err);
		return [];
	}
}

/**
 * Écrit de manière sécurisée la liste d'audit.
 */
async function writeAuditFile(entries: AuditLogEntry[]): Promise<void> {
	try {
		await fs.mkdir(path.dirname(AUDIT_FILE_PATH), { recursive: true });
		await fs.writeFile(AUDIT_FILE_PATH, JSON.stringify(entries, null, 2), 'utf8');
	} catch (err) {
		console.error('[AUDIT WRITE ERROR]', err);
	}
}

/**
 * Enregistre un nouvel événement d'audit.
 */
export async function logAuditEvent(
	entry: Omit<AuditLogEntry, 'id' | 'timestamp'>
): Promise<AuditLogEntry> {
	const newEntry: AuditLogEntry = {
		...entry,
		id: crypto.randomUUID(),
		timestamp: new Date().toISOString()
	};

	try {
		const logs = await readAuditFile();
		logs.unshift(newEntry); // Ajout en début de liste (plus récent en premier)
		await writeAuditFile(logs);
		console.log(
			`[AUDIT LOGGED] ${newEntry.action} #${newEntry.numtab} [${newEntry.code}] par ${newEntry.user.displayName} - Statut: ${newEntry.status}`
		);
	} catch (err) {
		console.error('[AUDIT LOGGING FAILED]', err);
	}

	return newEntry;
}

export interface AuditQueryOptions {
	username?: string;
	isAdmin?: boolean;
	numtab?: number;
}

/**
 * Récupère les entrées d'audit selon les permissions de l'utilisateur :
 * - Les administrateurs (IT) voient TOUTES les modifications.
 * - Les utilisateurs métiers voient UNIQUEMENT leurs propres modifications.
 */
export async function getAuditLogs(options: AuditQueryOptions = {}): Promise<AuditLogEntry[]> {
	const allLogs = await readAuditFile();

	let filtered = allLogs;

	// Si l'utilisateur n'est pas admin, il ne voit que ses propres modifications
	if (!options.isAdmin) {
		if (!options.username) {
			return [];
		}
		const userLower = options.username.trim().toLowerCase();
		filtered = filtered.filter(
			(entry) => (entry.user.username || '').trim().toLowerCase() === userLower
		);
	}

	// Filtre optionnel par table
	if (options.numtab) {
		filtered = filtered.filter((entry) => entry.numtab === options.numtab);
	}

	return filtered;
}
