import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import "../globals.css";
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

import Image from 'next/image';
import { Link } from '@/i18n/routing';
import LanguageSwitcher from '@/components/LanguageSwitcher';

import { getSession } from '@/lib/auth';
import { logout } from '@/app/actions/auth';
import { getTranslations } from 'next-intl/server';

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  const isLoggedIn = !!(session.tenantId || session.isAdmin);

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: 'Common' });

  return (
    <html lang={locale} className="h-full antialiased dark">
      <body className={`${inter.className} min-h-full flex flex-col bg-[#0b0f1a] text-slate-200 selection:bg-blue-500/30`}>
        <NextIntlClientProvider messages={messages}>
          <header className="sticky top-0 z-50 w-full border-b border-slate-800/60 bg-[#0b0f1a]/80 backdrop-blur-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="relative w-9 h-9 transition-transform group-hover:scale-105">
                  <Image
                    src="/logo.png"
                    alt="Fief Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  Fief
                </span>
              </Link>
              
              <div className="flex items-center space-x-6">
                <nav className="hidden md:flex items-center space-x-6">
                  {isLoggedIn && (
                    <Link 
                      href={session.isAdmin ? "/admin" : "/dashboard"} 
                      className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                      {session.isAdmin ? t('admin') : t('dashboard')}
                    </Link>
                  )}
                  <Link 
                    href="/api-docs" 
                    className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                  >
                    {t('docs')}
                  </Link>
                </nav>

                <div className="flex items-center space-x-4">
                  <LanguageSwitcher />
                  
                  {isLoggedIn && (
                    <form action={logout}>
                      <button 
                        type="submit"
                        className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                      >
                        {t('logout')}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </header>
          
          <main className="flex-grow flex flex-col">
            {children}
          </main>
          
          <footer className="border-t border-slate-800/60 bg-[#0b0f1a] py-8 mt-auto">
            <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-2 text-slate-500 text-sm">
                <span>© {new Date().getFullYear()} Fief.</span>
                <span className="hidden md:inline">•</span>
                <span>DNS Delegation Manager</span>
              </div>
              <div className="flex items-center space-x-6">
                <Link href="/api-docs" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                  API Documentation
                </Link>
                <a 
                  href="https://github.com/Odiobill/Fief" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                >
                  GitHub
                </a>
              </div>
            </div>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
