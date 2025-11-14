/*
  # Add Multiple Source Endpoints Support for Integrations

  1. Changes
    - Create `integration_source_endpoints` junction table to support multiple source endpoints per integration
    - Allows one integration to listen to multiple source endpoints from the same API
    - Each source endpoint can trigger the same target endpoint

  2. New Tables
    - `integration_source_endpoints`
      - `id` (uuid, primary key)
      - `integration_id` (uuid, references integrations)
      - `source_endpoint_id` (uuid, references api_endpoints)
      - `created_at` (timestamp)
      - Unique constraint on (integration_id, source_endpoint_id)

  3. Security
    - Enable RLS on `integration_source_endpoints` table
    - Add policies for authenticated users to manage their integration endpoints

  4. Notes
    - The `source_endpoint_id` column in `integrations` table remains for backward compatibility
    - New integrations should use the junction table for multiple endpoints
    - Single endpoint integrations can still use the direct column
*/

-- Create the junction table for multiple source endpoints
CREATE TABLE IF NOT EXISTS integration_source_endpoints (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id uuid REFERENCES integrations(id) ON DELETE CASCADE NOT NULL,
  source_endpoint_id uuid REFERENCES api_endpoints(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(integration_id, source_endpoint_id)
);

-- Enable RLS
ALTER TABLE integration_source_endpoints ENABLE ROW LEVEL SECURITY;

-- RLS Policies for integration_source_endpoints
CREATE POLICY "Users can view own integration source endpoints"
  ON integration_source_endpoints FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM integrations
      WHERE integrations.id = integration_source_endpoints.integration_id
      AND integrations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own integration source endpoints"
  ON integration_source_endpoints FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM integrations
      WHERE integrations.id = integration_source_endpoints.integration_id
      AND integrations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own integration source endpoints"
  ON integration_source_endpoints FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM integrations
      WHERE integrations.id = integration_source_endpoints.integration_id
      AND integrations.user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_integration_source_endpoints_integration_id 
  ON integration_source_endpoints(integration_id);

CREATE INDEX IF NOT EXISTS idx_integration_source_endpoints_endpoint_id 
  ON integration_source_endpoints(source_endpoint_id);

-- Add helpful comment
COMMENT ON TABLE integration_source_endpoints IS 'Junction table allowing integrations to have multiple source endpoints that trigger the same target endpoint';
