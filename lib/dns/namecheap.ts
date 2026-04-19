import { DnsProvider, DnsRecord } from './provider';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

export class NameCheapProvider implements DnsProvider {
  private apiUser = process.env.NAMECHEAP_API_USER!;
  private apiKey = process.env.NAMECHEAP_API_KEY!;
  private userName = process.env.NAMECHEAP_USERNAME!;
  private clientIp = process.env.NAMECHEAP_CLIENT_IP!;
  private sandbox = process.env.NAMECHEAP_SANDBOX === 'true';

  private get baseUrl() {
    return this.sandbox
      ? 'https://api.sandbox.namecheap.com/xml.response'
      : 'https://api.namecheap.com/xml.response';
  }

  private splitPath(subdomainPath: string) {
    const parts = subdomainPath.split('.');
    if (parts.length < 2) throw new Error('Invalid subdomain path');
    
    const tld = parts.pop()!;
    const sld = parts.pop()!;
    const tenantSub = parts.join('.'); // e.g. "filippo" if path was "filippo.lucchesi.io"
    
    return { sld, tld, tenantSub };
  }

  private async callApi(command: string, params: Record<string, string> = {}) {
    const query = new URLSearchParams({
      ApiUser: this.apiUser,
      ApiKey: this.apiKey,
      UserName: this.userName,
      ClientIp: this.clientIp,
      Command: command,
      ...params,
    });

    const response = await fetch(`${this.baseUrl}?${query.toString()}`);
    const xml = await response.text();
    
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const result = parser.parse(xml);

    if (result.ApiResponse?.['@_Status'] === 'ERROR') {
      const error = result.ApiResponse.Errors?.Error;
      throw new Error(Array.isArray(error) ? error[0]['#text'] : error?.['#text'] || 'NameCheap API Error');
    }

    return result.ApiResponse;
  }

  async listRecords(subdomainPath: string): Promise<DnsRecord[]> {
    const { sld, tld, tenantSub } = this.splitPath(subdomainPath);
    const data = await this.callApi('namecheap.domains.dns.getHosts', { SLD: sld, TLD: tld });
    
    const hosts = data.CommandResponse.DomainDNSGetHostsResult.host;
    const hostList = Array.isArray(hosts) ? hosts : hosts ? [hosts] : [];

    return hostList
      .filter((h: any) => {
        const hostname = h['@_Name'];
        // Match records relative to tenantSub
        // If tenantSub is "filippo", we want "filippo" (@) or "*.filippo"
        return hostname === tenantSub || hostname.endsWith(`.${tenantSub}`);
      })
      .map((h: any) => {
        const hostname = h['@_Name'];
        // Strip tenantSub to get relative host
        let relativeHost = hostname === tenantSub ? '@' : hostname.slice(0, -(tenantSub.length + 1));
        
        return {
          type: h['@_Type'],
          host: relativeHost,
          value: h['@_Address'],
          ttl: parseInt(h['@_TTL'], 10),
        };
      });
  }

  async setRecord(subdomainPath: string, record: DnsRecord): Promise<void> {
    const { sld, tld, tenantSub } = this.splitPath(subdomainPath);
    
    // 1. Fetch ALL records
    const data = await this.callApi('namecheap.domains.dns.getHosts', { SLD: sld, TLD: tld });
    const hosts = data.CommandResponse.DomainDNSGetHostsResult.host;
    let hostList = Array.isArray(hosts) ? hosts : hosts ? [hosts] : [];

    // Map to NameCheap format
    const namecheapHost = record.host === '@' ? tenantSub : `${record.host}.${tenantSub}`;
    
    // 2. Patch in memory
    let found = false;
    const updatedHosts = hostList.map((h: any) => {
      if (h['@_Name'] === namecheapHost && h['@_Type'] === record.type) {
        found = true;
        return {
          ...h,
          '@_Address': record.value,
          '@_TTL': (record.ttl || 300).toString(),
        };
      }
      return h;
    });

    if (!found) {
      updatedHosts.push({
        '@_Name': namecheapHost,
        '@_Type': record.type,
        '@_Address': record.value,
        '@_TTL': (record.ttl || 300).toString(),
      });
    }

    // 3. Push back
    await this.pushHosts(sld, tld, updatedHosts);
  }

  async deleteRecord(subdomainPath: string, host: string, type: DnsRecord['type']): Promise<void> {
    const { sld, tld, tenantSub } = this.splitPath(subdomainPath);
    const data = await this.callApi('namecheap.domains.dns.getHosts', { SLD: sld, TLD: tld });
    const hosts = data.CommandResponse.DomainDNSGetHostsResult.host;
    let hostList = Array.isArray(hosts) ? hosts : hosts ? [hosts] : [];

    const namecheapHost = host === '@' ? tenantSub : `${host}.${tenantSub}`;
    const updatedHosts = hostList.filter((h: any) => !(h['@_Name'] === namecheapHost && h['@_Type'] === type));

    await this.pushHosts(sld, tld, updatedHosts);
  }

  private async pushHosts(sld: string, tld: string, hosts: any[]) {
    const params: Record<string, string> = {
      SLD: sld,
      TLD: tld,
    };

    hosts.forEach((h, i) => {
      const idx = i + 1;
      params[`HostName${idx}`] = h['@_Name'];
      params[`RecordType${idx}`] = h['@_Type'];
      params[`Address${idx}`] = h['@_Address'];
      params[`TTL${idx}`] = h['@_TTL'];
      if (h['@_MXPref']) params[`MXPref${idx}`] = h['@_MXPref'];
    });

    await this.callApi('namecheap.domains.dns.setHosts', params);
  }
}
