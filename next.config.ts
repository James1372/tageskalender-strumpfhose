import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  basePath: '/daily',
  env: {
    NEXT_PUBLIC_BASE_PATH: '/daily',
  },
}

export default nextConfig
