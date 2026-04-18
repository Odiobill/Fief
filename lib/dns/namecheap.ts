import { DnsProvider, DnsRecord } from './provider';

export class NameCheapProvider implements DnsProvider {
  /**
   * List all records currently under the given subdomain path.
   * NameCheap API operates at the SLD+TLD level, so we must correctly
   * split the subdomainPath and filter for relevant host entries.
   */
  async listRecords(subdomainPath: string): Promise<DnsRecord[]> {
    throw new Error('Not implemented');
  }

  /**
   * Set (upsert) a record.
   * IMPORTANT: NameCheap's setHosts command replaces ALL records for a domain at once.
   * It is NOT additive. We MUST:
   * 1. Fetch all existing records for the domain (not just the tenant's subpath).
   * 2. Apply the change in memory (upsert the specific record).
   * 3. Push the full set back to the API.
   * Never call setHosts with a partial list or you will delete records.
   */
  async setRecord(subdomainPath: string, record: DnsRecord): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * Delete a record by host + type.
   * Similar to setRecord, this requires a fetch-patch-push flow:
   * 1. Fetch all records.
   * 2. Remove the matching record from the memory set.
   * 3. Push the full set back.
   */
  async deleteRecord(subdomainPath: string, host: string, type: DnsRecord['type']): Promise<void> {
    throw new Error('Not implemented');
  }
}
