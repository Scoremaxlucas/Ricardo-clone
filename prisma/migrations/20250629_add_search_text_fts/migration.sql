-- Enable PostgreSQL Extensions for Full-Text Search and Fuzzy Matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Add searchText column to watches table
ALTER TABLE "watches" ADD COLUMN IF NOT EXISTS "searchText" TEXT NOT NULL DEFAULT '';

-- Create Full-Text Search GIN Index (German language)
CREATE INDEX IF NOT EXISTS "watches_search_fts_idx" 
ON "watches" USING GIN (to_tsvector('german', unaccent("searchText")));

-- Create Trigram Index for fuzzy matching
CREATE INDEX IF NOT EXISTS "watches_search_trgm_idx" 
ON "watches" USING GIN (unaccent(lower("searchText")) gin_trgm_ops);

-- Set the default trigram similarity threshold
-- This can be adjusted per query but setting a sensible default
SELECT set_limit(0.2);

-- Create a helper function for normalized search text
CREATE OR REPLACE FUNCTION normalize_search_text(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      unaccent(
        regexp_replace(input_text, 'ß', 'ss', 'g')
      ),
      '\s+', ' ', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create index on title for exact matching (if not exists)
CREATE INDEX IF NOT EXISTS "watches_title_lower_idx" ON "watches" (lower(title));

-- Create index on brand for exact matching (if not exists)  
CREATE INDEX IF NOT EXISTS "watches_brand_lower_idx" ON "watches" (lower(brand));

-- Create composite index for common filter combinations
CREATE INDEX IF NOT EXISTS "watches_search_filters_idx" ON "watches" (
  "moderationStatus",
  "isAuction",
  "condition",
  "price"
);
