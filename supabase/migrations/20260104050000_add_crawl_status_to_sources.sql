-- Add crawl_status and error_message columns to crawl_sources for async crawl tracking
ALTER TABLE crawl_sources
ADD COLUMN IF NOT EXISTS crawl_status text NOT NULL DEFAULT 'idle'
CHECK (crawl_status IN ('idle', 'pending', 'crawling', 'completed', 'failed'));

ALTER TABLE crawl_sources
ADD COLUMN IF NOT EXISTS error_message text;
