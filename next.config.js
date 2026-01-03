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

  // ESLint: Ignore during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  // TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },

  // Server Actions body size
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // OPTIMIERT: Optimistic Client Cache für schnellere Navigation
    optimisticClientCache: true,
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
    unoptimized: false,
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: '*.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'logos-world.net' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: 'media.rolex.com' },
      { protocol: 'https', hostname: 'patek-res.cloudinary.com' },
      { protocol: 'https', hostname: 'www.omegawatches.com' },
      { protocol: 'https', hostname: 'dynamicmedia.audemarspiguet.com' },
      { protocol: 'https', hostname: 'res.garmin.com' },
      { protocol: 'https', hostname: 'backend.esquire.de' },
      { protocol: 'https', hostname: 'www.apple.com' },
      { protocol: 'https', hostname: 'img.freepik.com' },
    ],
  },

  // OPTIMIERT: HTTP Headers für schnellere Navigation und Sicherheit
  async headers() {
    return [
      {
        // Static assets - sehr langer Cache
        source: '/:path*.(js|css|woff|woff2|ttf|eot)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Security headers for all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.openai.com https://api.stripe.com https://*.stripe.com https://vercel.live",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              'upgrade-insecure-requests',
            ].join('; '),
          },
        ],
      },
    ]
  },

  webpack: (config, { isServer }) => {
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

    // Leaflet is browser-only
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

      if (!config.optimization.splitChunks) {
        config.optimization.splitChunks = {}
      }

      const existingSplitChunks = config.optimization.splitChunks

      if (!existingSplitChunks.cacheGroups) {
        existingSplitChunks.cacheGroups = {}
      }

      // TensorFlow.js in separatem Chunk
      existingSplitChunks.cacheGroups.tensorflow = {
        test: /[\\/]node_modules[\\/]@tensorflow[\\/]/,
        name: 'tensorflow',
        chunks: 'async',
        priority: 10,
      }

      // Lucide Icons in separatem Chunk
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
