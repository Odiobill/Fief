import { NextRequest } from 'next/server';
import { getSession, verifyAdminKey, verifyApiKey } from './auth';
import prisma from './db';
import { Tenant } from '@prisma/client';

export interface ApiAuthResult {
  isAdmin: boolean;
  tenant: Tenant | null;
}

export async function authorizeApi(request: NextRequest): Promise<ApiAuthResult | null> {
  // 1. Check Bearer token
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const key = authHeader.substring(7);
    
    if (await verifyAdminKey(key)) {
      return { isAdmin: true, tenant: null };
    }
    
    const tenant = await verifyApiKey(key);
    if (tenant) {
      return { isAdmin: false, tenant };
    }
  }

  // 2. Check Session (for UI)
  const session = await getSession();
  if (session.isAdmin) {
    return { isAdmin: true, tenant: null };
  }
  
  if (session.tenantId) {
    const tenant = await prisma.tenant.findUnique({ where: { id: session.tenantId } });
    if (tenant) {
      return { isAdmin: false, tenant };
    }
  }

  return null;
}
