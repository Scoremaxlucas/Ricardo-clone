import Link from 'next/link'
import { 
  Watch,
  Crown,
  Zap,
  Shield,
  Star,
  Gem,
  Clock,
  Award,
  Sparkles,
  Heart
} from 'lucide-react'

const categories = [
  { 
    name: 'Rolex', 
    icon: Crown, 
    href: '/categories/rolex', 
    color: 'bg-green-600',
    logo: 'https://logos-world.net/wp-content/uploads/2020/09/Rolex-Logo.png',
    image: 'https://media.rolex.com/image/upload/q_auto/f_auto/c_limit,w_3840/v1753431990/rolexcom/collection/family-pages/professional-watches/cosmograph-daytona/landing/2025/professional-watches-cosmograph-daytona-cover-m126508-0008_2505stj_0001'
  },
  { 
    name: 'Patek Philippe', 
    icon: Star, 
    href: '/categories/patek-philippe', 
    color: 'bg-blue-600',
    logo: 'https://logos-world.net/wp-content/uploads/2020/09/Patek-Philippe-Logo.png',
    image: 'https://patek-res.cloudinary.com/dfsmedia/0906caea301d42b3b8bd23bd656d1711/202201-51890'
  },
  { 
    name: 'Omega', 
    icon: Zap, 
    href: '/categories/omega', 
    color: 'bg-red-600',
    logo: 'https://logos-world.net/wp-content/uploads/2020/09/Omega-Logo.png',
    image: 'https://www.omegawatches.com/media/catalog/product/o/m/omega-speedmaster-moonwatch-professional-co-axial-master-chronometer-chronograph-42-mm-31030425001002-198df2.png?w=230'
  },
  { 
    name: 'Audemars Piguet', 
    icon: Gem, 
    href: '/categories/audemars-piguet', 
    color: 'bg-purple-600',
    logo: 'https://logos-world.net/wp-content/uploads/2020/09/Audemars-Piguet-Logo.png',
    image: 'https://dynamicmedia.audemarspiguet.com/is/image/audemarspiguet/car_produit_RO_26674ST-OO-1320ST-01?size=568,0&fmt=avif-alpha&dpr=off'
  },
  { 
    name: 'Vintage Uhren', 
    icon: Clock, 
    href: '/categories/vintage', 
    color: 'bg-yellow-600',
    logo: null,
    image: 'https://cdn.shopify.com/s/files/1/0526/8658/6018/files/Vintage_Watch_Longines_1024x1024.jpg?v=1741170820'
  },
  { 
    name: 'Smartwatches', 
    icon: Zap, 
    href: '/categories/smartwatches', 
    color: 'bg-indigo-600',
    logo: 'https://logos-world.net/wp-content/uploads/2020/09/Apple-Logo.png',
    image: 'https://www.apple.com/v/watch/bs/images/overview/select/product_s11__c23ym6fc09me_large.png'
  },
  { 
    name: 'Sportuhren', 
    icon: Shield, 
    href: '/categories/sport', 
    color: 'bg-orange-600',
    logo: null,
    image: 'https://res.garmin.com/en/products/010-02905-10/v/cf-lg.jpg'
  },
  { 
    name: 'Exklusive Luxusuhren', 
    icon: Award, 
    href: '/categories/luxury', 
    color: 'bg-pink-600',
    logo: null,
    image: 'https://media.richardmille.com/wp-content/uploads/2021/04/23134358/40-01card.png?dpr=3&width=187.5'
  },
  { 
    name: 'Seltene Uhren', 
    icon: Sparkles, 
    href: '/categories/rare', 
    color: 'bg-teal-600',
    logo: null,
    image: 'https://backend.esquire.de/sites/esquire.de/files/images/2021-11/rolex-cosmograph-daytona-ref-6263-albino.jpg'
  },
  { 
    name: 'Favoriten', 
    icon: Heart, 
    href: '/categories/favorites', 
    color: 'bg-red-500',
    logo: null,
    image: 'https://img.freepik.com/vektoren-kostenlos/herz-symbol-isoliert_24911-115700.jpg?semt=ais_hybrid&w=740&q=80'
  },
]

export function Categories() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Beliebte Uhrenmarken
          </h2>
          <p className="text-lg text-gray-600">
            Entdecken Sie Uhren von den weltweit führenden Marken
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {categories.map((category) => {
            const IconComponent = category.icon
            return (
              <Link
                key={category.name}
                href={category.href}
                className="group flex flex-col items-center p-6 rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all duration-200"
              >
                <div className="relative mb-4">
                  {/* Hintergrundbild */}
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
                <span className="text-sm font-medium text-gray-900 group-hover:text-primary-600 text-center">
                  {category.name}
                </span>
              </Link>
            )
          })}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/brands"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
          >
            Alle Marken anzeigen
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
