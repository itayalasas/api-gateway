/*
  # Add Forward Headers Support to Integrations

  ## Changes
  1. Add `forward_headers` column to integrations table
     - Stores array of header names that should be forwarded from incoming request to target API
     - Allows dynamic header passthrough from API 1 to API 2

  ## Example Use Case
  - API 1 sends: `X-Custom-ID: 12345`, `X-User-Token: abc123`
  - Integration configured to forward: `["X-Custom-ID", "X-User-Token"]`
  - Gateway forwards these headers to API 2 automatically

  ## Notes
  - Headers are case-insensitive
  - Security-related headers (Authorization, X-Integration-Key) are never forwarded
  - Custom headers (static values) take precedence over forwarded headers
*/

-- Add forward_headers column to integrations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'integrations' AND column_name = 'forward_headers'
  ) THEN
    ALTER TABLE integrations ADD COLUMN forward_headers text[] DEFAULT '{}';
  END IF;
END $$;

-- Add comment to describe the column
COMMENT ON COLUMN integrations.forward_headers IS 'List of header names to forward from incoming request to target API';