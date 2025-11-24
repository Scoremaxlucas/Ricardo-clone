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
  webpack: (config, { isServer }) => {
    // Fix for next-auth client-side imports
    if (!isServer) {
      config.resolve = config.resolve || {}
      const existingFallback = config.resolve.fallback
      config.resolve.fallback = {
        ...(existingFallback !== null && typeof existingFallback === 'object' ? existingFallback : {}),
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    // Optimize bundle splitting - TensorFlow.js will be in a separate chunk
    if (!isServer) {
      config.optimization = config.optimization || {}
      const existingSplitChunks = config.optimization.splitChunks
      const existingCacheGroups = existingSplitChunks?.cacheGroups
      
      config.optimization.splitChunks = {
        ...(existingSplitChunks !== null && typeof existingSplitChunks === 'object' ? existingSplitChunks : {}),
        cacheGroups: {
          ...(existingCacheGroups !== null && typeof existingCacheGroups === 'object' ? existingCacheGroups : {}),
          tensorflow: {
            test: /[\\/]node_modules[\\/]@tensorflow[\\/]/,
            name: 'tensorflow',
            chunks: 'async', // Only load when needed
            priority: 10,
          },
        },
      }
    }
    
    return config
  },
}

module.exports = nextConfig
