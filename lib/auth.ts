import { Tenant } from '@prisma/client';

/**
 * Verifies a tenant API key.
 * Should hash the key and compare against keyHash in Postgres.
 * Returns the tenant if valid, null otherwise.
 */
export async function verifyApiKey(key: string): Promise<Tenant | null> {
  // TODO: implement with hash comparison
  return null;
}

/**
 * Verifies the admin API key against process.env.ADMIN_API_KEY.
 * MUST use a constant-time comparison to avoid timing attacks.
 */
export async function verifyAdminKey(key: string): Promise<boolean> {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey || !key) return false;
  
  // TODO: use timing-safe comparison
  return key === adminKey;
}

export interface SessionData {
  tenantId: string | null;
  isAdmin: boolean;
}

/**
 * Creates a signed HTTP-only session cookie.
 */
export async function createSession(data: SessionData): Promise<void> {
  // TODO: implement with iron-session
}

/**
 * Retrieves the session from cookies.
 */
export async function getSession(): Promise<SessionData | null> {
  // TODO: implement with iron-session
  return null;
}
