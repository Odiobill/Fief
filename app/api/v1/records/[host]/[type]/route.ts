import { NextRequest, NextResponse } from 'next/server';
import { authorizeApi } from '@/lib/api-auth';
import { getProvider } from '@/lib/dns';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ host: string; type: string }> }
) {
  const auth = await authorizeApi(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { host, type } = await params;
  
  let subdomainPath = auth.tenant?.subdomainPath;
  if (auth.isAdmin) {
    subdomainPath = request.nextUrl.searchParams.get('path') || undefined;
  }

  if (!subdomainPath) {
    return NextResponse.json({ error: 'Missing subdomain path context', code: 'BAD_REQUEST' }, { status: 400 });
  }

  try {
    const provider = getProvider();
    await provider.deleteRecord(subdomainPath, host, type as any);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, code: 'PROVIDER_ERROR' }, { status: 500 });
  }
}
