export interface DnsRecord {
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT';
  host: string;   // relative to the tenant's subdomain path
  value: string;
  ttl?: number;
}

export interface DnsProvider {
  /** List all records currently under the given subdomain path */
  listRecords(subdomainPath: string): Promise<DnsRecord[]>;
  /** Set (upsert) a record */
  setRecord(subdomainPath: string, record: DnsRecord): Promise<void>;
  /** Delete a record by host + type */
  deleteRecord(subdomainPath: string, host: string, type: DnsRecord['type']): Promise<void>;
}
