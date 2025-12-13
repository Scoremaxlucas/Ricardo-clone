/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable compression
  compress: true,
  // Optimize output
  swcMinify: true,
  // Enable React strict mode for better performance
  reactStrictMode: true,
  // Optimize production builds
  productionBrowserSourceMaps: false,
  // Power optimization
  poweredByHeader: false,
  // ESLint: Ignore during builds (warnings should not fail deployment)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // TypeScript: Ignore during builds (warnings should not fail deployment)
  typescript: {
    ignoreBuildErrors: false,
  },
  // WICHTIG: Erhöhe Body-Size-Limit für große Bild-Uploads (Standard: 1MB)
  // Vercel hat ein Limit von 4.5MB für Serverless Functions
  // Wir erhöhen es auf das Maximum, aber die Bilder sollten bereits komprimiert sein
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Erhöht von Standard 1MB
    },
  },
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year cache
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // OPTIMIERT: Enable image optimization for better performance
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '*.blob.vercel-storage.com',
      },
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
    const isPlainObject = value => {
      return (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        Object.prototype.toString.call(value) === '[object Object]'
      )
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

    // Leaflet is browser-only - exclude from server-side bundle
    if (isServer) {
      const originalExternals = config.externals
      config.externals = [
        ...(Array.isArray(originalExternals) ? originalExternals : [originalExternals]),
        ({ request }, callback) => {
          if (request === 'leaflet' || request === 'react-leaflet') {
            return callback(null, `commonjs ${request}`)
          }
          callback()
        },
      ]
    }

    // OPTIMIERT: Bundle Size Optimization
    if (!isServer) {
      config.optimization = config.optimization || {}

      // Stelle sicher, dass splitChunks existiert (Next.js setzt es standardmäßig)
      if (!config.optimization.splitChunks) {
        config.optimization.splitChunks = {}
      }

      const existingSplitChunks = config.optimization.splitChunks

      // Stelle sicher, dass cacheGroups existiert
      if (!existingSplitChunks.cacheGroups) {
        existingSplitChunks.cacheGroups = {}
      }

      // OPTIMIERT: Separate chunks für bessere Code-Splitting
      // TensorFlow.js in separatem Chunk (große Bibliothek)
      existingSplitChunks.cacheGroups.tensorflow = {
        test: /[\\/]node_modules[\\/]@tensorflow[\\/]/,
        name: 'tensorflow',
        chunks: 'async',
        priority: 10,
      }

      // Lucide Icons in separatem Chunk (nur bei Bedarf laden)
      existingSplitChunks.cacheGroups.lucide = {
        test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
        name: 'lucide-icons',
        chunks: 'async',
        priority: 9,
      }

      // React/Next.js Vendor Chunk
      existingSplitChunks.cacheGroups.vendor = {
        test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
        name: 'vendor',
        chunks: 'all',
        priority: 8,
      }
    }

    return config
  },
}

module.exports = nextConfig
