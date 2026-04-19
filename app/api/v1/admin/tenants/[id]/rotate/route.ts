import { NextRequest, NextResponse } from 'next/server';
import { authorizeApi } from '@/lib/api-auth';
import prisma from '@/lib/db';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeApi(request);
  if (!auth?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const rawKey = crypto.randomBytes(32).toString('hex');
    const keyHash = await bcrypt.hash(rawKey, 10);

    await prisma.tenant.update({
      where: { id },
      data: { keyHash }
    });

    return NextResponse.json({ apiKey: rawKey });
  } catch (error) {
    return NextResponse.json({ error: 'Tenant not found', code: 'NOT_FOUND' }, { status: 404 });
  }
}
