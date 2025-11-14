/*
  # Add public_proxy to integration_type check constraint

  1. Changes
    - Drop the existing check constraint on integration_type
    - Add new check constraint that includes 'public_proxy' as valid type
    
  2. Valid types after migration:
    - api_to_api (direct API connections)
    - webhook (bidirectional webhooks with DB access)
    - database_query (database queries)
    - public_proxy (NEW: public APIs for third-party consumption)
*/

-- Drop existing check constraint
ALTER TABLE integrations 
DROP CONSTRAINT IF EXISTS integrations_integration_type_check;

-- Add new check constraint including public_proxy
ALTER TABLE integrations 
ADD CONSTRAINT integrations_integration_type_check 
CHECK (integration_type = ANY (ARRAY['api_to_api'::text, 'webhook'::text, 'database_query'::text, 'public_proxy'::text]));

-- Update column comment
COMMENT ON COLUMN integrations.integration_type IS 'Type of integration: api_to_api (direct), webhook (bidirectional), database_query (DB queries), or public_proxy (public API for third parties)';
