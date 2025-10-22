//@ts-check

const { composePlugins, withNx } = require('@nx/next');
const enablePwa = process.env.NEXT_PUBLIC_ENABLE_PWA === 'true';

const withPWA = require('next-pwa')({
  dest: 'public',
  register: enablePwa,
  skipWaiting: enablePwa,
  disable: !enablePwa,
});

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), fullscreen=(self), geolocation=(), microphone=()',
  },
];

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['@tanstack/react-query', 'lucide-react'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: securityHeaders,
    },
  ],
  nx: {
    svgr: true,
  },
};

const plugins = [withNx, withPWA];

module.exports = composePlugins(...plugins)(nextConfig);
