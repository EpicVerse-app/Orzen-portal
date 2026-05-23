import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Server Actions from local network devices (other laptops, phones on same Wi-Fi)
  // Next.js 15 blocks non-localhost origins by default — this opens it for dev
  allowedDevOrigins: [
    '172.16.0.196',   // current local IP — update if your network IP changes
    '192.168.*',      // common home/office Wi-Fi range
    '10.0.*',         // another common local range
  ],

  // Allow product images from any HTTPS source (Supabase storage, etc.)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },

  // Add service-worker headers so SW can control the full scope
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          { key: 'Content-Type', value: 'application/manifest+json' },
        ],
      },
    ]
  },
}

export default nextConfig
