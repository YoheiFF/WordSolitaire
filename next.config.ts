import type { NextConfig } from 'next'

const isMobileBuild = process.env.BUILD_TARGET === 'mobile'

const nextConfig: NextConfig = {
  output: isMobileBuild ? 'export' : undefined,
  images: {
    unoptimized: isMobileBuild,
  },
  env: {
    NEXT_PUBLIC_BUILD_TARGET: process.env.BUILD_TARGET ?? 'web',
    NEXT_PUBLIC_API_BASE_URL: isMobileBuild
      ? process.env.MOBILE_API_BASE_URL ?? 'https://your-vercel-app.vercel.app'
      : '',
  },
}

export default nextConfig
