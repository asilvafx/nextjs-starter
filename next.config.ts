import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import initializeBundleAnalyzer from '@next/bundle-analyzer';

// Analyzer
const withBundleAnalyzer = initializeBundleAnalyzer({
    enabled: process.env.BUNDLE_ANALYZER_ENABLED === 'true',
});

// Intl
const withNextIntl = createNextIntlPlugin(
    './src/locale/requests.js'
);

// Base config
const nextConfig: NextConfig = {
    output: 'standalone',
    eslint: {
        // Disable ESLint during builds since we're using Biome
        ignoreDuringBuilds: true,
    },
    images: {
        remotePatterns: [
            new URL('https://**.blob.vercel-storage.com/**'),
            new URL('https://placehold.co/**')
        ],
    },
    experimental: {
        useCache: true,
    },
};

// Compose plugins (order matters: rightmost runs first)
export default withBundleAnalyzer(
    withNextIntl(nextConfig)
);
