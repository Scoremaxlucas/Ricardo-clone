import { FeaturedProductsServer } from '@/components/home/FeaturedProductsServer'
                <HeroServer
          title="Finden Sie lokale Deals in der Schweiz"
          subtitle="Tausende Artikel von Verkäufern in Ihrer Nähe"
        >
          {/* Search - Client Component mit Skeleton Fallback */}
          <Suspense fallback={
            <div className="flex h-14 items-center rounded-full bg-white/90 px-6 shadow-lg">
              <div className="h-5 w-64 animate-pulse rounded bg-gray-200" />
            </div>
          }>
            <HeroSearch placeholder="Suchen Sie nach Produkten, Marken, Kategorien..." />
          </Suspense>
        </HeroServer>

        {/* Category Links - Nach First Paint */}
        <div className="border-t border-primary-700/20 bg-primary-800/50 backdrop-blur-sm">
          <Suspense fallback={<div className="h-20" />}>
            <CategoryQuickLinks />
          </Suspense>
        </div>

        {/* Quick Access Bar - Dynamisch geladen */}
        <QuickAccessBar />

        {/* Featured Products - Server-Side gerendert */}
        <FeaturedProductsServer initialProducts={featuredProducts} />

        {/* Below-the-fold - Lazy loaded mit null Fallback */}
        <Suspense fallback={null}>
          <HomeClient featuredProductIds={featuredProducts.map(p => p.id)} />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
