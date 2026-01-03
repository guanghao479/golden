-- Drop the crawl_jobs table (no longer needed with synchronous crawl)
DROP TABLE IF EXISTS crawl_jobs;

-- Add last_crawled_at column to crawl_sources
ALTER TABLE crawl_sources
ADD COLUMN IF NOT EXISTS last_crawled_at timestamptz;

-- Add unique constraint on source_url + source_type for upsert
ALTER TABLE crawl_sources
DROP CONSTRAINT IF EXISTS crawl_sources_source_url_source_type_key;

ALTER TABLE crawl_sources
ADD CONSTRAINT crawl_sources_source_url_source_type_key UNIQUE (source_url, source_type);
