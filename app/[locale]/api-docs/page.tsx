import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Docs' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function DocsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Docs' });

  const endpoints = [
    {
      id: 'list-records',
      title: t('listRecords'),
      description: t('listRecordsDesc'),
      method: 'GET',
      path: '/api/v1/records',
      curl: `curl -X GET "\${NEXT_PUBLIC_APP_URL}/api/v1/records" \\
  -H "Authorization: Bearer <YOUR_API_KEY>"`,
      response: `[
  {
    "type": "A",
    "host": "www",
    "value": "1.2.3.4",
    "ttl": 3600
  }
]`
    },
    {
      id: 'set-record',
      title: t('setRecord'),
      description: t('setRecordDesc'),
      method: 'POST',
      path: '/api/v1/records',
      curl: `curl -X POST "\${NEXT_PUBLIC_APP_URL}/api/v1/records" \\
  -H "Authorization: Bearer <YOUR_API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "A",
    "host": "www",
    "value": "1.2.3.4",
    "ttl": 3600
  }'`,
      response: `{ "success": true }`
    },
    {
      id: 'delete-record',
      title: t('deleteRecord'),
      description: t('deleteRecordDesc'),
      method: 'DELETE',
      path: '/api/v1/records/:host/:type',
      curl: `curl -X DELETE "\${NEXT_PUBLIC_APP_URL}/api/v1/records/www/A" \\
  -H "Authorization: Bearer <YOUR_API_KEY>"`,
      response: `{ "success": true }`
    }
  ];

  return (
    <div className="flex-grow flex flex-col">
      <div className="bg-slate-900/40 border-b border-slate-800/60 py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-4">
            {t('title')}
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl leading-relaxed">
            {t('description')}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Side Nav */}
          <aside className="lg:col-span-3">
            <nav className="sticky top-24 space-y-8">
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  Overview
                </h3>
                <ul className="space-y-3">
                  <li>
                    <a href="#authentication" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
                      {t('authTitle')}
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  {t('endpointsTitle')}
                </h3>
                <ul className="space-y-3">
                  {endpoints.map(endpoint => (
                    <li key={endpoint.id}>
                      <a href={`#${endpoint.id}`} className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
                        {endpoint.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-9 space-y-20">
            {/* Authentication */}
            <section id="authentication" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-800 pb-4">
                {t('authTitle')}
              </h2>
              <div className="prose prose-invert max-w-none text-slate-400">
                <p>{t('authDescription')}</p>
                <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800/60 font-mono text-sm text-blue-400 overflow-x-auto mt-4">
                  Authorization: Bearer &lt;YOUR_API_KEY&gt;
                </div>
              </div>
            </section>

            {/* Endpoints */}
            <section className="space-y-16">
              {endpoints.map(endpoint => (
                <div key={endpoint.id} id={endpoint.id} className="scroll-mt-24">
                  <div className="flex items-center space-x-3 mb-6">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                      endpoint.method === 'GET' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      endpoint.method === 'POST' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {endpoint.method}
                    </span>
                    <h2 className="text-2xl font-bold text-white">{endpoint.title}</h2>
                  </div>
                  
                  <p className="text-slate-400 mb-8 leading-relaxed">
                    {endpoint.description}
                  </p>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Endpoint
                      </h4>
                      <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800/60 font-mono text-sm text-slate-300">
                        {endpoint.path}
                      </div>
                      
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-6">
                        Example Request
                      </h4>
                      <div className="relative group">
                        <pre className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-sm overflow-x-auto font-mono text-slate-300 leading-relaxed">
                          {endpoint.curl}
                        </pre>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Success Response
                      </h4>
                      <pre className="bg-[#0f172a] rounded-xl p-5 border border-slate-800 text-sm overflow-x-auto font-mono text-slate-400 leading-relaxed">
                        {endpoint.response}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
