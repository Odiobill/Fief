import { Tenant } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import prisma from './db';

export interface SessionData {
  tenantId: string | null;
  isAdmin: boolean;
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'fief_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

/**
 * Verifies a tenant API key.
 * Hashes the key and compares against keyHash in Postgres.
 * Returns the tenant if valid, null otherwise.
 */
export async function verifyApiKey(key: string): Promise<Tenant | null> {
  if (!key) return null;

  // For a self-hosted service with few tenants, iterating and bcrypt.compare
  // is acceptable if we don't have a key prefix for direct lookup.
  const tenants = await prisma.tenant.findMany();
  for (const tenant of tenants) {
    if (await bcrypt.compare(key, tenant.keyHash)) {
      return tenant;
    }
  }

  return null;
}

/**
 * Verifies the admin API key against process.env.ADMIN_API_KEY.
 * MUST use a constant-time comparison to avoid timing attacks.
 */
export async function verifyAdminKey(key: string): Promise<boolean> {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey || !key) return false;
  
  if (key.length !== adminKey.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(Buffer.from(key), Buffer.from(adminKey));
}

/**
 * Retrieves the session from cookies.
 */
export async function getSession(): Promise<IronSession<SessionData>> {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  return session;
}
