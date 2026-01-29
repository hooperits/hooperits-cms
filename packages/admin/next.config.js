/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@hooperits/cms'],
  images: {
    remotePatterns: process.env.ALLOWED_IMAGE_DOMAINS
      ? process.env.ALLOWED_IMAGE_DOMAINS.split(',').map((domain) => ({
          protocol: 'https',
          hostname: domain.trim(),
        }))
      : [],
    unoptimized: process.env.NODE_ENV === 'development',
  },
};

module.exports = nextConfig;
