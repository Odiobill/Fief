'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { DnsRecord } from '@/lib/dns/provider';

interface RecordListProps {
  initialRecords: DnsRecord[];
  subdomainPath: string;
  translations: any;
}

export function RecordList({ initialRecords, subdomainPath, translations: t }: RecordListProps) {
  const [records, setRecords] = useState<DnsRecord[]>(initialRecords);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [newRecord, setNewRecord] = useState<DnsRecord>({
    type: 'A',
    host: '',
    value: '',
    ttl: 3600
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/v1/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord)
      });
      
      if (res.ok) {
        setRecords([...records, newRecord]);
        setIsAdding(false);
        setNewRecord({ type: 'A', host: '', value: '', ttl: 3600 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (host: string, type: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
      const res = await fetch(`/api/v1/records/${host}/${type}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        setRecords(records.filter(r => !(r.host === host && r.type === type)));
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
            {t.addRecord}
          </Button>
        )}
      </div>

      {isAdding && (
        <Card title={t.addRecord} className="animate-in fade-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-400 ml-1">{t.type}</label>
              <select 
                className="px-4 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
                value={newRecord.type}
                onChange={e => setNewRecord({...newRecord, type: e.target.value as any})}
              >
                <option value="A" className="text-slate-900">A</option>
                <option value="AAAA" className="text-slate-900">AAAA</option>
                <option value="CNAME" className="text-slate-900">CNAME</option>
                <option value="TXT" className="text-slate-900">TXT</option>
              </select>
            </div>
            <Input 
              label={t.host}
              placeholder="e.g. www or @"
              value={newRecord.host}
              onChange={e => setNewRecord({...newRecord, host: e.target.value})}
              required
            />
            <Input 
              label={t.value}
              placeholder="e.g. 1.2.3.4"
              value={newRecord.value}
              onChange={e => setNewRecord({...newRecord, value: e.target.value})}
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
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">{t.type}</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">{t.host}</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">{t.value}</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">{t.ttl}</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {records.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-slate-500 italic">
                  {t.empty}
                </td>
              </tr>
            ) : (
              records.map((record, i) => (
                <tr key={`${record.host}-${record.type}-${i}`} className="hover:bg-slate-800/20 transition-colors group">
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                      {record.type}
                    </span>
                  </td>
                  <td className="px-6 py-5 font-bold text-slate-200">
                    {record.host}.{subdomainPath}
                  </td>
                  <td className="px-6 py-5 text-slate-400 font-mono text-sm break-all">
                    {record.value}
                  </td>
                  <td className="px-6 py-5 text-slate-500 text-sm">
                    {record.ttl}
                  </td>
                  <td className="px-6 py-5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="danger" 
                      className="px-4 py-1.5 text-[11px]"
                      onClick={() => handleDelete(record.host, record.type)}
                    >
                      {t.delete}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
