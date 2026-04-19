import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { getProvider } from '@/lib/dns';
import { RecordList } from './RecordList';
import { logout } from '@/app/actions/auth';
import { Button } from '@/components/ui/Button';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Dashboard' });
  return { title: t('title') };
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getSession();
  
  if (!session.tenantId) {
    redirect('/login');
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId }
  });

  if (!tenant) {
    session.destroy();
    redirect('/login');
    return null;
  }

  const t = await getTranslations({ locale, namespace: 'Dashboard' });
  
  const provider = getProvider();
  let records: any[] = [];
  try {
    records = await provider.listRecords(tenant.subdomainPath);
  } catch (error) {
    console.error('Failed to fetch records:', error);
  }

  return (
    <div className="flex-grow">
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white tracking-tight">{t('title')}</h2>
          <p className="text-slate-400 mt-2 text-lg">
            {t('description', { path: tenant.subdomainPath })}
          </p>
        </div>

        <RecordList 
          initialRecords={records}
          subdomainPath={tenant.subdomainPath}
          translations={{
            addRecord: t('addRecord'),
            type: t('type'),
            host: t('host'),
            value: t('value'),
            ttl: t('ttl'),
            actions: t('actions'),
            delete: t('delete'),
            save: t('save'),
            cancel: t('cancel'),
            empty: t('empty')
          }}
        />
      </main>
    </div>
  );
}
