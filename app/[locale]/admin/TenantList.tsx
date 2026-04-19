'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface Tenant {
  id: string;
  subdomainPath: string;
  label: string;
  createdAt: string;
}

interface TenantListProps {
  initialTenants: Tenant[];
  translations: any;
}

export function TenantList({ initialTenants, translations: t }: TenantListProps) {
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  
  const [newTenant, setNewTenant] = useState({
    label: '',
    subdomainPath: ''
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/v1/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTenant)
      });
      
      if (res.ok) {
        const data = await res.json();
        setTenants([{
          id: data.id,
          label: data.label,
          subdomainPath: data.subdomainPath,
          createdAt: new Date().toISOString()
        }, ...tenants]);
        setNewKey(data.apiKey);
        setIsAdding(false);
        setNewTenant({ label: '', subdomainPath: '' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will delete the tenant and all their record associations.')) return;
    
    try {
      const res = await fetch(`/api/v1/admin/tenants/${id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        setTenants(tenants.filter(tenant => tenant.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRotateKey = async (id: string) => {
    if (!confirm('Are you sure you want to rotate the API key? The old key will stop working immediately.')) return;
    
    try {
      const res = await fetch(`/api/v1/admin/tenants/${id}/rotate`, {
        method: 'POST'
      });
      
      if (res.ok) {
        const data = await res.json();
        setNewKey(data.apiKey);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)}>
            {t.addTenant}
          </Button>
        )}
      </div>

      {newKey && (
        <Card title={t.newKeyTitle} className="bg-blue-600/10 border-blue-500/20">
          <p className="text-blue-400 text-sm mb-4 font-medium">{t.newKeyDescription}</p>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-white break-all select-all shadow-inner">
            {newKey}
          </div>
          <Button variant="secondary" className="mt-6" onClick={() => setNewKey(null)}>
            {t.close}
          </Button>
        </Card>
      )}

      {isAdding && (
        <Card title={t.addTenant} className="animate-in fade-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <Input 
              label={t.label}
              placeholder="e.g. Filippo"
              value={newTenant.label}
              onChange={e => setNewTenant({...newTenant, label: e.target.value})}
              required
            />
            <Input 
              label={t.subdomainPath}
              placeholder="e.g. filippo.lucchesi.io"
              value={newTenant.subdomainPath}
              onChange={e => setNewTenant({...newTenant, subdomainPath: e.target.value})}
              required
            />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" isLoading={isLoading}>
                {t.save}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setIsAdding(false)}>
                {t.cancel}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/50 border-b border-slate-800/60">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">{t.label}</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">{t.subdomainPath}</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">{t.createdAt}</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {tenants.map(tenant => (
              <tr key={tenant.id} className="hover:bg-slate-800/20 transition-colors group">
                <td className="px-6 py-5 font-bold text-slate-200">{tenant.label}</td>
                <td className="px-6 py-5 text-slate-400 font-mono text-sm">{tenant.subdomainPath}</td>
                <td className="px-6 py-5 text-slate-500 text-sm">
                  {new Date(tenant.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-5 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="secondary" 
                    className="px-4 py-1.5 text-[11px] inline-flex"
                    onClick={() => handleRotateKey(tenant.id)}
                  >
                    {t.rotateKey}
                  </Button>
                  <Button 
                    variant="danger" 
                    className="px-4 py-1.5 text-[11px] inline-flex"
                    onClick={() => handleDelete(tenant.id)}
                  >
                    {t.deleteTenant}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
