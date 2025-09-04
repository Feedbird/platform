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
        hostname: 'pub-7c697410bf9d4c77a76ef1d13d21f6b5.r2.dev'
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
};

export default nextConfig;
