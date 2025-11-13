/*
  # Add Automatic API Key Generation for Integrations

  1. Changes
    - Add trigger to automatically generate API keys when creating new integrations
    - Add trigger function to handle the API key generation
    - Update existing integrations without API keys

  2. Security
    - API keys are generated securely using gen_random_bytes
    - Each API key is unique (enforced by UNIQUE constraint)
    - Keys are prefixed with 'int_' for easy identification
*/

-- Ensure the generate_api_key function exists
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS text AS $$
BEGIN
  RETURN 'int_' || encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to auto-generate API key on insert
CREATE OR REPLACE FUNCTION set_integration_api_key()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.api_key IS NULL THEN
    NEW.api_key := generate_api_key();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_set_integration_api_key ON integrations;

-- Create trigger to auto-generate API key before insert
CREATE TRIGGER trigger_set_integration_api_key
  BEFORE INSERT ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION set_integration_api_key();

-- Update existing integrations that don't have API keys
UPDATE integrations
SET api_key = generate_api_key()
WHERE api_key IS NULL;
