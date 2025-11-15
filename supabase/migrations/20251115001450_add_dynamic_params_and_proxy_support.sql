/*
  # Add dynamic parameters and universal proxy support

  1. Changes
    - Make `source_api_id` nullable for public_proxy integrations (allows external APIs)
    - Add `query_params` configuration for dynamic URL query parameters
    - Add `proxy_mode` to define operation mode (direct, post_process)
    - Update integration_type constraint to ensure consistency
    
  2. New Features
    - **Query Params**: Extract from request URL or body and forward to target API
    - **Proxy Mode**: 
      - `direct`: Gateway → Target API → Response (simple proxy)
      - `post_process`: Gateway → Target API → Internal API → Response (enrichment)
    - **Universal Proxy**: Public APIs can now consume ANY external API (MercadoPago, etc.)
    
  3. Configuration Structure
    ```json
    {
      "query_params": [
        {
          "name": "transaction_id",
          "source": "url_query|body|header",
          "path": "id",
          "required": true,
          "default": null
        }
      ],
      "proxy_mode": "direct|post_process",
      "post_process_api_id": "uuid (optional)"
    }
    ```
    
  4. Example Use Cases
    - MercadoPago: GET /payments/:id → Forward to internal system
    - Public webhook receiver → Query DB → Forward to multiple APIs
    - External API aggregator → Call multiple services → Combine results
    
  5. Security Notes
    - Source API is now optional for public_proxy type
    - Target API can be external or internal
    - API keys still required for authentication
    - All requests logged for monitoring
*/

-- Make source_api_id nullable for public_proxy integrations
ALTER TABLE integrations 
ALTER COLUMN source_api_id DROP NOT NULL;

-- Add comment explaining when source_api_id can be null
COMMENT ON COLUMN integrations.source_api_id IS 'Source API ID - nullable for public_proxy integrations that receive external requests';

-- Add query_params configuration to transform_config
COMMENT ON COLUMN integrations.transform_config IS 'JSON configuration for data transformation, query params, and proxy mode';

-- Add proxy_mode column to define operation mode
ALTER TABLE integrations 
ADD COLUMN IF NOT EXISTS proxy_mode text DEFAULT 'direct' CHECK (proxy_mode IN ('direct', 'post_process'));

COMMENT ON COLUMN integrations.proxy_mode IS 'Proxy operation mode: direct (simple proxy), post_process (call target then forward to another API)';

-- Add post_process_api_id for chaining API calls
ALTER TABLE integrations 
ADD COLUMN IF NOT EXISTS post_process_api_id uuid REFERENCES apis(id) ON DELETE SET NULL;

COMMENT ON COLUMN integrations.post_process_api_id IS 'Optional API to call after target API responds (for proxy_mode = post_process)';

-- Update integration type to include all current types
ALTER TABLE integrations 
DROP CONSTRAINT IF EXISTS integrations_integration_type_check;

ALTER TABLE integrations 
ADD CONSTRAINT integrations_integration_type_check 
CHECK (integration_type IN ('api_to_api', 'webhook', 'database_query', 'public_proxy'));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_integrations_proxy_mode ON integrations(proxy_mode) WHERE proxy_mode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_integrations_post_process_api ON integrations(post_process_api_id) WHERE post_process_api_id IS NOT NULL;
