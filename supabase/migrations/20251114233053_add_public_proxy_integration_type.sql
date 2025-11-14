/*
  # Add Public Proxy Integration Type

  1. Changes
    - Add 'public_proxy' as a valid integration type
    - This type represents public APIs that act as proxies to internal APIs
    - Public proxies are consumed by external third parties
    - They require API key authentication
    - They forward requests directly to internal APIs

  2. Notes
    - Existing integrations are not affected
    - No data migration needed
    - Only adds a new valid enum value
*/

-- Add comment to integrations table explaining the new type
COMMENT ON COLUMN integrations.integration_type IS 'Type of integration: webhook (bidirectional), api_to_api (direct), or public_proxy (public API consumed by third parties)';
