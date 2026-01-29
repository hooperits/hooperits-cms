/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@hooperits/cms'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },
};

module.exports = nextConfig;
