import { NextRequest, NextResponse } from 'next/server';
import { authorizeApi } from '@/lib/api-auth';
import prisma from '@/lib/db';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

export async function GET(request: NextRequest) {
  const auth = await authorizeApi(request);
  if (!auth?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      subdomainPath: true,
      label: true,
      createdAt: true,
      updatedAt: true,
    }
  });

  return NextResponse.json(tenants);
}

export async function POST(request: NextRequest) {
  const auth = await authorizeApi(request);
  if (!auth?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const { label, subdomainPath } = await request.json();
    
    if (!label || !subdomainPath) {
      return NextResponse.json({ error: 'Missing required fields', code: 'BAD_REQUEST' }, { status: 400 });
    }

    // Generate random 32-byte hex key
    const rawKey = crypto.randomBytes(32).toString('hex');
    const keyHash = await bcrypt.hash(rawKey, 10);

    const tenant = await prisma.tenant.create({
      data: {
        label,
        subdomainPath,
        keyHash,
      }
    });

    return NextResponse.json({
      id: tenant.id,
      label: tenant.label,
      subdomainPath: tenant.subdomainPath,
      apiKey: rawKey, // Show only once
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Subdomain path already exists', code: 'CONFLICT' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
