// [CYCL:01109070-ff41-42dd-a9e5-1b8e62970023] Next.js config with next-pwa service worker and offline fallback
import type { NextConfig } from 'next'
import withPWAInit from '@ducanh2912/next-pwa'

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  fallbacks: {
    document: '/offline.html',
  },
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
})

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jnqgodxepxddoebadlmc.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default withPWA(nextConfig)
