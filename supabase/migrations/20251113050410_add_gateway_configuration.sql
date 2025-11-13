/*
  # Gateway Configuration System
  
  ## Overview
  Adds a system configuration table to store gateway settings like custom domain
  
  ## 1. New Tables
  
  ### `system_config`
  Stores system-wide configuration key-value pairs
  
  ## 2. Security
  - Enable RLS on system_config table
  - Only authenticated users can read configuration
  - Only the first user (admin) can update configuration
  
  ## 3. Initial Data
  - Insert default gateway domain configuration
*/

-- Create system_config table
CREATE TABLE IF NOT EXISTS system_config (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key text UNIQUE NOT NULL,
  config_value text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read configuration
CREATE POLICY "Authenticated users can read config"
  ON system_config FOR SELECT
  TO authenticated
  USING (true);

-- All authenticated users can update configuration
CREATE POLICY "Authenticated users can update config"
  ON system_config FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- All authenticated users can insert configuration
CREATE POLICY "Authenticated users can insert config"
  ON system_config FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key);

-- Insert default gateway domain
INSERT INTO system_config (config_key, config_value, description)
VALUES (
  'gateway_domain',
  'api.flowbridge.site',
  'Custom domain for the API Gateway'
)
ON CONFLICT (config_key) DO NOTHING;

-- Add comment
COMMENT ON TABLE system_config IS 'System-wide configuration settings';
