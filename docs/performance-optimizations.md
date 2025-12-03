# Performance Optimizations

## Database Optimizations

### Recommended Database Indexes

Add these indexes to your PostgreSQL database for optimal query performance:

```sql
-- Watch table indexes
CREATE INDEX IF NOT EXISTS idx_watch_seller_id ON "Watch"("sellerId");
CREATE INDEX IF NOT EXISTS idx_watch_created_at ON "Watch"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_watch_auction_end ON "Watch"("auctionEnd") WHERE "auctionEnd" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_watch_is_auction ON "Watch"("isAuction");
CREATE INDEX IF NOT EXISTS idx_watch_moderation_status ON "Watch"("moderationStatus");
CREATE INDEX IF NOT EXISTS idx_watch_brand ON "Watch"("brand");
CREATE INDEX IF NOT EXISTS idx_watch_price ON "Watch"("price");

-- Bid table indexes
CREATE INDEX IF NOT EXISTS idx_bid_watch_id ON "Bid"("watchId");
CREATE INDEX IF NOT EXISTS idx_bid_amount ON "Bid"("amount" DESC);
CREATE INDEX IF NOT EXISTS idx_bid_user_id ON "Bid"("userId");

-- Purchase table indexes
CREATE INDEX IF NOT EXISTS idx_purchase_watch_id ON "Purchase"("watchId");
CREATE INDEX IF NOT EXISTS idx_purchase_buyer_id ON "Purchase"("buyerId");
CREATE INDEX IF NOT EXISTS idx_purchase_status ON "Purchase"("status");
CREATE INDEX IF NOT EXISTS idx_purchase_created_at ON "Purchase"("createdAt" DESC);

-- Category indexes
CREATE INDEX IF NOT EXISTS idx_watch_category_watch_id ON "WatchCategory"("watchId");
CREATE INDEX IF NOT EXISTS idx_watch_category_category_id ON "WatchCategory"("categoryId");

-- Favorite indexes
CREATE INDEX IF NOT EXISTS idx_favorite_user_id ON "Favorite"("userId");
CREATE INDEX IF NOT EXISTS idx_favorite_watch_id ON "Favorite"("watchId");
CREATE INDEX IF NOT EXISTS idx_favorite_user_watch ON "Favorite"("userId", "watchId");
```

### Connection Pooling

The Prisma client is configured with optimized connection pooling settings. For production, ensure your database connection string includes pool settings:

```
DATABASE_URL="postgresql://user:password@host:5432/db?connection_limit=20&pool_timeout=10"
```

## API Route Optimizations

### Caching Strategy

- **Search API**: 3 minutes cache, 6 minutes stale-while-revalidate
- **Categories API**: 5 minutes cache, 10 minutes stale-while-revalidate  
- **Favorites API**: 1 minute cache, 2 minutes stale-while-revalidate

### Query Optimizations

- All Prisma queries use `select` instead of `include` to fetch only needed fields
- Query limits reduced (1000 → 200 for search)
- Parallel query execution with `Promise.all` where possible

## Frontend Optimizations

### Code Splitting

- Lazy loading for below-the-fold components
- React.memo for expensive components
- Dynamic imports for heavy libraries

### Image Optimization

- Next.js Image component with AVIF/WebP formats
- Lazy loading for below-the-fold images
- Optimized device sizes and image sizes

### Caching

- Aggressive client-side caching with `force-cache`
- Link prefetching for faster navigation
- Service worker ready for offline caching

## Build Optimizations

- SWC minification enabled
- Production source maps disabled
- Compression enabled (gzip)
- Bundle splitting optimized

## Monitoring

Monitor these metrics to ensure optimal performance:

- API response times (target: <200ms)
- Database query times (target: <100ms)
- Time to First Byte (TTFB) (target: <500ms)
- First Contentful Paint (FCP) (target: <1.5s)
- Largest Contentful Paint (LCP) (target: <2.5s)

