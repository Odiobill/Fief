import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { LoginForm } from './LoginForm';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Login' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

import Image from 'next/image';

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Login' });

  return (
    <div className="flex-grow flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -z-10" />
      
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="relative w-20 h-20 mx-auto mb-6 transition-transform hover:scale-105 duration-500">
            <Image
              src="/logo.png"
              alt="Fief Logo"
              fill
              className="object-contain drop-shadow-[0_0_15px_rgba(37,99,235,0.3)]"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent mb-3">
            Fief
          </h1>
          <p className="text-slate-400 text-lg">{t('description')}</p>
        </div>
        
        <div className="bg-slate-900/40 border border-slate-800/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl shadow-black/20">
          <LoginForm 
            translations={{
              apiKey: t('apiKey'),
              submit: t('submit'),
              error: t('error')
            }}
          />
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            Need help? Check out the <a href={`/${locale}/docs`} className="text-blue-500 hover:text-blue-400 font-medium transition-colors">API Documentation</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
