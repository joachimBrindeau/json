import type { NextConfig } from 'next';
import path from 'path';

// Disable certain experiments for Playwright runs to avoid dev vendor-chunk issues
const isPlaywright = !!process.env.PLAYWRIGHT;

const nextConfig: NextConfig = {
  // Optimize for production
  compress: true,
  poweredByHeader: false,

  // Ensure Docker-friendly output with standalone server
  output: 'standalone',

  // Explicitly set the workspace root to this repo to avoid Next.js picking the user's home dir
  // when multiple lockfiles exist on the machine (prevents .next path confusion in dev/tests)
  outputFileTracingRoot: path.resolve(__dirname),

  // Generate build ID based on timestamp for cache busting
  generateBuildId: async () => {
    // This ensures each build has a unique ID
    return Date.now().toString();
  },

  // Environment variables accessible in the browser
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.BUILD_ID || Date.now().toString(),
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },

  // Security and performance headers
  async headers() {
    return [
      {
        // Force no-cache for HTML pages to ensure users get the latest version
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        // Apply the same to all pages
        source: '/:path((?!api|_next).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        // No cache for API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
      {
        // Allow embedding for embed routes
        source: '/embed/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
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
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Security headers safe for embedded contexts
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          // Note: skip Cross-Origin-Resource-Policy here to avoid blocking cross-origin embedding
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none',
          },
          {
            key: 'Origin-Agent-Cluster',
            value: '?1',
          },
          {
            key: 'Content-Security-Policy-Report-Only',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https: wss:; worker-src 'self' blob:; frame-src 'self' https:; frame-ancestors *; base-uri 'self'; form-action 'self'",
          },
        ],
      },
      {
        // Apply security headers to all other routes EXCEPT Next.js static assets and embed routes
        source: '/((?!_next/static|favicon.ico|embed).*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Content-Language',
            value: 'en-US',
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
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none',
          },
          {
            key: 'Origin-Agent-Cluster',
            value: '?1',
          },
          {
            key: 'Content-Security-Policy-Report-Only',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https: wss:; worker-src 'self' blob:; frame-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
          },
        ],
      },
      {
        // Specific headers for Next.js static JavaScript files
        source: '/_next/static/chunks/:path*.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Specific headers for Next.js static CSS files
        source: '/_next/static/css/:path*.css',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Headers for font files
        source: '/_next/static/media/:path*.(woff|woff2|eot|ttf|otf)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.css',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.svg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Redirects for SEO
  async redirects() {
    return [
      {
        source: '/share/:id',
        destination: '/library/:id',
        permanent: true,
      },
      {
        source: '/viewer/:id',
        destination: '/library/:id',
        permanent: true,
      },
      {
        source: '/saved',
        destination: '/save',
        permanent: true,
      },
    ];
  },

  // Experimental features disabled for stability in tests/dev
  experimental: {
    // Disable vendor-chunking that can reference non-existent dev files in some setups
    optimizePackageImports: [],
  },

  // Performance optimizations
  compiler: {
    // Remove console.logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Optimize bundling
  webpack: (config, { dev, isServer }) => {
    // Exclude server-only modules from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        dns: false,
      };
    }

    // Exclude n8n-addons-extension and extensions directory from compilation
    config.module.rules.push({
      test: /(app\/n8n-addons-extension|extensions\/)/,
      use: 'ignore-loader',
    });

    // Fix TipTap package resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@tiptap/extensions': require.resolve('@tiptap/extensions'),
    };

    // Use Next.js defaults for splitChunks to avoid asset misclassification issues
    // (We intentionally disable our custom splitChunks to prevent CSS being emitted as <script> tags.)

    return config;
  },

  // Enable type checking and linting in builds for production safety
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
