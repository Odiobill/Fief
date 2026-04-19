import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { TenantList } from './TenantList';
import { logout } from '@/app/actions/auth';
import { Button } from '@/components/ui/Button';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Admin' });
  return { title: t('title') };
}

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getSession();
  
  if (!session.isAdmin) {
    redirect('/login');
  }

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      subdomainPath: true,
      label: true,
      createdAt: true,
    }
  });

  const t = await getTranslations({ locale, namespace: 'Admin' });

  return (
    <div className="flex-grow">
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white tracking-tight">{t('title')}</h2>
          <p className="text-slate-400 mt-2 text-lg">{t('description')}</p>
        </div>

        <TenantList 
          initialTenants={JSON.parse(JSON.stringify(tenants))}
          translations={{
            tenants: t('tenants'),
            addTenant: t('addTenant'),
            label: t('label'),
            subdomainPath: t('subdomainPath'),
            createdAt: t('createdAt'),
            rotateKey: t('rotateKey'),
            deleteTenant: t('deleteTenant'),
            newKeyTitle: t('newKeyTitle'),
            newKeyDescription: t('newKeyDescription'),
            close: t('close'),
            save: 'Save',
            cancel: 'Cancel'
          }}
        />
      </main>
    </div>
  );
}
