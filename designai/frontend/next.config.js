/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['via.placeholder.com'],
    remotePatterns: [{ protocol: 'https', hostname: '*.cloudfront.net' }],
  },
  // Proxy /api/* to the local FastAPI backend so the app works through a single
  // public origin (ngrok). Browser calls same-origin /api -> Next server -> :8000.
  async rewrites() {
    return [{ source: '/api/:path*', destination: 'http://localhost:8000/:path*' }];
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
};

module.exports = nextConfig;
