import { DnsProvider } from './provider';
import { NameCheapProvider } from './namecheap';

export function getProvider(): DnsProvider {
  const providerType = process.env.DNS_PROVIDER;

  switch (providerType) {
    case 'namecheap':
      return new NameCheapProvider();
    default:
      throw new Error(`Unsupported or missing DNS_PROVIDER: ${providerType}`);
  }
}
