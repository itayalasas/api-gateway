/*
  # Add API Response Cache System

  1. New Tables
    - `api_response_cache`
      - `id` (uuid, primary key) - Unique identifier for cache entry
      - `integration_id` (uuid, foreign key) - Reference to integration
      - `cache_key` (text) - Unique key for this cached response (hash of request params)
      - `response_data` (jsonb) - Cached response data
      - `cached_at` (timestamptz) - When this was cached
      - `expires_at` (timestamptz) - When this cache entry expires
      - `hit_count` (integer) - Number of times this cache was used
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. New Columns in integrations
    - `cache_enabled` (boolean) - Whether caching is enabled for this integration
    - `cache_ttl_hours` (integer) - Cache time-to-live in hours

  3. Indexes
    - Index on (integration_id, cache_key) for fast lookups
    - Index on expires_at for cleanup queries

  4. Security
    - Disable RLS temporarily for external auth compatibility
    - Service role can manage all cache entries

  5. Functions
    - Automatic cleanup of expired cache entries
*/

-- Create cache table
CREATE TABLE IF NOT EXISTS api_response_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  cache_key text NOT NULL,
  response_data jsonb NOT NULL,
  cached_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz NOT NULL,
  hit_count integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(integration_id, cache_key)
);

-- Add cache configuration to integrations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'integrations' AND column_name = 'cache_enabled'
  ) THEN
    ALTER TABLE integrations ADD COLUMN cache_enabled boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'integrations' AND column_name = 'cache_ttl_hours'
  ) THEN
    ALTER TABLE integrations ADD COLUMN cache_ttl_hours integer DEFAULT 24;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cache_integration_key 
  ON api_response_cache(integration_id, cache_key);

CREATE INDEX IF NOT EXISTS idx_cache_expires_at 
  ON api_response_cache(expires_at);

-- Disable RLS for external auth compatibility
ALTER TABLE api_response_cache DISABLE ROW LEVEL SECURITY;

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM api_response_cache
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get cache statistics
CREATE OR REPLACE FUNCTION get_cache_stats(p_integration_id uuid)
RETURNS TABLE (
  total_entries bigint,
  total_hits bigint,
  avg_hits numeric,
  oldest_entry timestamptz,
  newest_entry timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total_entries,
    SUM(hit_count)::bigint as total_hits,
    AVG(hit_count)::numeric as avg_hits,
    MIN(cached_at) as oldest_entry,
    MAX(cached_at) as newest_entry
  FROM api_response_cache
  WHERE integration_id = p_integration_id
    AND expires_at > now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on functions
COMMENT ON FUNCTION cleanup_expired_cache() IS 
  'Deletes expired cache entries. Should be run periodically (e.g., daily) via cron or manually.';

COMMENT ON FUNCTION get_cache_stats(uuid) IS 
  'Returns cache statistics for a specific integration.';
