import crypto from 'node:crypto';
import type { LdapUser } from './ldap';

const SESSION_COOKIE_NAME = 'iris_auth';
const SESSION_SECRET = process.env.SESSION_SECRET || 'IRIS_VALDEPHARM_FAREVA_SECURE_KEY_2026';
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 heures

export interface SessionData {
	user: LdapUser;
	issuedAt: number;
	expiresAt: number;
}

export function createSessionToken(user: LdapUser): string {
	const issuedAt = Date.now();
	const expiresAt = issuedAt + MAX_AGE_SECONDS * 1000;
	const payload: SessionData = { user, issuedAt, expiresAt };

	const serialized = Buffer.from(JSON.stringify(payload)).toString('base64url');
	const signature = crypto.createHmac('sha256', SESSION_SECRET).update(serialized).digest('base64url');

	return `${serialized}.${signature}`;
}

export function verifySessionToken(token: string | undefined): LdapUser | null {
	if (!token || !token.includes('.')) return null;

	const [serialized, signature] = token.split('.');
	if (!serialized || !signature) return null;

	const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(serialized).digest('base64url');

	// Comparaison en temps constant pour éviter les attaques temporelles
	if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
		return null;
	}

	try {
		const payload: SessionData = JSON.parse(Buffer.from(serialized, 'base64url').toString('utf8'));
		if (Date.now() > payload.expiresAt) {
			return null;
		}
		return payload.user;
	} catch {
		return null;
	}
}

export { SESSION_COOKIE_NAME, MAX_AGE_SECONDS };
