import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import withRspack from 'next-rspack';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  output: 'standalone',
};

export default withRspack(withNextIntl(nextConfig));
