'use client'

import Link from 'next/link'

interface Collection {
  id: string
  title: string
  image: string
  href: string
}

const collections: Collection[] = [
  {
    id: '1',
    title: 'Designer Mode',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=250&fit=crop',
    href: '/search?category=kleidung-accessoires&q=designer',
  },
  {
    id: '2',
    title: 'Elektronik Deals',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=250&fit=crop',
    href: '/search?category=computer-netzwerk',
  },
  {
    id: '3',
    title: 'Möbel & Wohnen',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=250&fit=crop',
    href: '/search?category=haushalt-wohnen',
  },
  {
    id: '4',
    title: 'Sport & Fitness',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop',
    href: '/search?category=sport',
  },
]

export function Collections() {
  return (
    <section className="py-12 bg-[#F4F4F4]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-[#3A3A3A] mb-6">Entdecke Collections</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={collection.href}
              className="group relative w-full h-[250px] rounded-[16px] overflow-hidden"
            >
              <img
                src={collection.image}
                alt={collection.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/40"></div>
              {/* Text */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-2xl font-semibold text-white">
                  {collection.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}




