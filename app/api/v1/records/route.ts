import { NextRequest, NextResponse } from 'next/server';
import { authorizeApi } from '@/lib/api-auth';
import { getProvider } from '@/lib/dns';

export async function GET(request: NextRequest) {
  const auth = await authorizeApi(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  // Admin can view all records for all tenants? 
  // No, records are always scoped to the tenant path.
  // If admin is calling this, they must provide a tenant context?
  // Let's assume for /api/v1/records, if it's a tenant key, it uses their path.
  // If it's an admin key, we might need a `path` query param.
  
  let subdomainPath = auth.tenant?.subdomainPath;
  
  if (auth.isAdmin) {
    subdomainPath = request.nextUrl.searchParams.get('path') || undefined;
  }

  if (!subdomainPath) {
    return NextResponse.json({ error: 'Missing subdomain path context', code: 'BAD_REQUEST' }, { status: 400 });
  }

  try {
    const provider = getProvider();
    const records = await provider.listRecords(subdomainPath);
    return NextResponse.json(records);
  } catch (error: any) {
    return NextResponse.json({ error: error.message, code: 'PROVIDER_ERROR' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await authorizeApi(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const { type, host, value, ttl, path: adminPath } = await request.json();
    
    let subdomainPath = auth.tenant?.subdomainPath;
    if (auth.isAdmin && adminPath) {
      subdomainPath = adminPath;
    }

    if (!subdomainPath) {
      return NextResponse.json({ error: 'Missing subdomain path context', code: 'BAD_REQUEST' }, { status: 400 });
    }

    if (!type || !host || !value) {
      return NextResponse.json({ error: 'Missing required fields', code: 'BAD_REQUEST' }, { status: 400 });
    }

    const provider = getProvider();
    await provider.setRecord(subdomainPath, { type, host, value, ttl });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, code: 'PROVIDER_ERROR' }, { status: 500 });
  }
}
