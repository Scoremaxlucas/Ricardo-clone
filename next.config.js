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
    // Hilfsfunktion: Prüft ob ein Wert ein plain object ist (nicht null, nicht Array, nicht function, etc.)
    const isPlainObject = (value) => {
      return value !== null && 
             typeof value === 'object' && 
             !Array.isArray(value) && 
             Object.prototype.toString.call(value) === '[object Object]'
    }
    
    // Fix for next-auth client-side imports
    if (!isServer) {
      config.resolve = config.resolve || {}
      const existingFallback = config.resolve.fallback
      config.resolve.fallback = {
        ...(isPlainObject(existingFallback) ? existingFallback : {}),
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    // Optimize bundle splitting - TensorFlow.js will be in a separate chunk
    if (!isServer) {
      config.optimization = config.optimization || {}
      
      // Stelle sicher, dass splitChunks existiert (Next.js setzt es standardmäßig)
      // Wenn es nicht existiert, lass Next.js die Defaults verwenden und füge nur unsere Cache-Gruppe hinzu
      if (!config.optimization.splitChunks) {
        config.optimization.splitChunks = {}
      }
      
      const existingSplitChunks = config.optimization.splitChunks
      
      // Stelle sicher, dass cacheGroups existiert
      if (!existingSplitChunks.cacheGroups) {
        existingSplitChunks.cacheGroups = {}
      }
      
      // Füge TensorFlow Cache-Gruppe zu den bestehenden Cache-Gruppen hinzu
      // Dies überschreibt keine Next.js Defaults, sondern erweitert sie nur
      existingSplitChunks.cacheGroups.tensorflow = {
        test: /[\\/]node_modules[\\/]@tensorflow[\\/]/,
        name: 'tensorflow',
        chunks: 'async',
        priority: 10,
      }
    }
    
    return config
  },
}

module.exports = nextConfig
