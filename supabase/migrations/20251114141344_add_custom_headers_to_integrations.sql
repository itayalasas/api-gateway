/*
  # Add custom headers support to integrations

  1. Changes
    - Add custom_headers column to integrations table (JSONB type)
    - This will store an object with header key-value pairs
  
  2. Structure
    - custom_headers will be stored as: { "Header-Name": "Header-Value", ... }
    - Example: { "Accept": "application/json", "User-Agent": "MyApp/1.0", "X-Custom-Header": "value" }
  
  3. Notes
    - Existing integrations will have NULL custom_headers (no breaking changes)
    - The api_key field will continue to work for backward compatibility
*/

-- Add custom_headers column to integrations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'integrations' AND column_name = 'custom_headers'
  ) THEN
    ALTER TABLE integrations ADD COLUMN custom_headers jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;
