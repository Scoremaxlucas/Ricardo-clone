/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'logos-world.net',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
      {
        protocol: 'https',
        hostname: 'media.rolex.com',
      },
      {
        protocol: 'https',
        hostname: 'patek-res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'www.omegawatches.com',
      },
      {
        protocol: 'https',
        hostname: 'dynamicmedia.audemarspiguet.com',
      },
      {
        protocol: 'https',
        hostname: 'res.garmin.com',
      },
      {
        protocol: 'https',
        hostname: 'backend.esquire.de',
      },
      {
        protocol: 'https',
        hostname: 'www.apple.com',
      },
      {
        protocol: 'https',
        hostname: 'img.freepik.com',
      },
    ],
  },
}

module.exports = nextConfig
