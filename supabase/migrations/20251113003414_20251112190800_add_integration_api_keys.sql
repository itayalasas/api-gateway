/*
  # Add Integration API Keys

  1. Changes
    - Add `api_key` column to `integrations` table to store unique API keys per integration
    - Add function to generate secure API keys
    - Generate API keys for existing integrations
  
  2. Security
    - API keys are unique per integration
    - Allows secure access to gateway endpoints without exposing Supabase anon key
*/

-- Add api_key column to integrations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'integrations' AND column_name = 'api_key'
  ) THEN
    ALTER TABLE integrations ADD COLUMN api_key text UNIQUE;
  END IF;
END $$;

-- Create function to generate random API keys
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS text AS $$
BEGIN
  RETURN 'int_' || encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Generate API keys for existing integrations that don't have one
UPDATE integrations
SET api_key = generate_api_key()
WHERE api_key IS NULL;

-- Add comment
COMMENT ON COLUMN integrations.api_key IS 'Unique API key for accessing this integration via the gateway';
