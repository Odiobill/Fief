'use server';

import { getSession, verifyAdminKey, verifyApiKey } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function login(apiKey: string) {
  if (!apiKey) return { error: 'API key is required' };

  // Check admin key first
  const isAdmin = await verifyAdminKey(apiKey);
  if (isAdmin) {
    const session = await getSession();
    session.isAdmin = true;
    session.tenantId = null;
    await session.save();
    return { success: true, redirect: '/admin' };
  }

  // Check tenant key
  const tenant = await verifyApiKey(apiKey);
  if (tenant) {
    const session = await getSession();
    session.isAdmin = false;
    session.tenantId = tenant.id;
    await session.save();
    return { success: true, redirect: '/dashboard' };
  }

  return { error: 'Invalid API key' };
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect('/login');
}
