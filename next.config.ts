import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Flickr
      { protocol: 'https', hostname: '*.staticflickr.com' },
      // GitHub avatars
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      // Google videos (dummy video thumb)
      { protocol: 'https', hostname: 'commondatastorage.googleapis.com' },
      { protocol: 'https', hostname: 'images.ayrshare.com'},
      {
        protocol: 'https',
        hostname: '**.fbcdn.net',
      },
      {
        protocol: 'https',
        hostname: 'pub-**.dev'
      },
      {
        protocol: 'https',
        hostname: 'scontent.xx.fbcdn.net',
      },
      {
        protocol: 'https',
        hostname: 'scontent-sof1-2.cdninstagram.com'
      },
      {
        protocol: 'https',
        hostname: 'www.youtube.com'
      },
      {
        protocol: 'https',
        hostname: 'i.pinimg.com'
      },
      {
        protocol: 'https',
        hostname: 'scontent-vie1-1.cdninstagram.com'
      },
      // Cloudflare R2 storage
      {
        protocol: 'https',
        hostname: 'upload.feedbird.com'
      },
      // TikTok
      {
        protocol: 'https',
        hostname: 'www.tiktok.com'
      },
      {
        protocol: 'https',
        hostname: '*.tiktokcdn.com'
      },
      // Country flags
      {
        protocol: 'https',
        hostname: 'flagcdn.com'
      },
    ],
  },
  async rewrites() {
    const r2Public = process.env.R2_PUBLIC_URL;
    if (!r2Public) return [];
    return [
      {
        source: '/r2/:path*',
        destination: `${r2Public}/:path*`,
      },
    ];
  },
  async headers() {
    return [

      // don’t enable COOP: same-origin + COEP: require-corp globally. We can’t have a COEP-isolated app and a working OAuth popup that relies on window.opener.
      // {
      //   source: '/((?!api/oauth/).*)',
      //   headers: [
      //     { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      //     { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
      //   ],
      // },
      {
        source: '/ffmpeg/(.*)',
        headers: [
          // Allow the worker/wasm/js to be loaded with COEP
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
