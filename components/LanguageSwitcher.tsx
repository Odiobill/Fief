'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { useParams } from 'next/navigation';

export default function LanguageSwitcher() {
  const t = useTranslations('Common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const handleLocaleChange = (newLocale: string) => {
    // @ts-ignore - params might have locale but router.replace handles it
    router.replace({ pathname, params }, { locale: newLocale });
  };

  return (
    <div className="flex items-center space-x-2 bg-slate-800/50 p-1 rounded-lg border border-slate-700/50 backdrop-blur-sm">
      <button
        onClick={() => handleLocaleChange('en')}
        className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
          locale === 'en'
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
        }`}
      >
        {t('english')}
      </button>
      <button
        onClick={() => handleLocaleChange('it')}
        className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
          locale === 'it'
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
        }`}
      >
        {t('italian')}
      </button>
    </div>
  );
}
