import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage-bucket-1fco9rqdbm.fly.storage.tigris.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage-bucket-1fco9rqdbm.t3.storageapi.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
