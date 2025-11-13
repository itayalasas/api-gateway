/*
  # API Gateway System Schema

  ## Overview
  Complete schema for API Gateway system with integration management, security configuration, 
  logging, and health monitoring.

  ## 1. New Tables
  
  ### `apis`
  Stores API configurations (both published and integrated external APIs)
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `name` (text) - API name
  - `description` (text) - API description
  - `type` (text) - 'published' or 'external'
  - `base_url` (text) - Base URL for the API
  - `is_active` (boolean) - Whether API is active
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `api_security`
  Security configurations for APIs
  - `id` (uuid, primary key)
  - `api_id` (uuid, foreign key to apis)
  - `auth_type` (text) - 'none', 'api_key', 'bearer_token', 'basic_auth', 'custom'
  - `auth_config` (jsonb) - Encrypted security configuration
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `integrations`
  Defines connections between APIs (source -> target)
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `name` (text) - Integration name
  - `source_api_id` (uuid, foreign key to apis)
  - `target_api_id` (uuid, foreign key to apis)
  - `endpoint_path` (text) - Endpoint path
  - `method` (text) - HTTP method
  - `is_active` (boolean)
  - `transform_config` (jsonb) - Request/response transformation rules
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `request_logs`
  Logs all requests passing through the gateway
  - `id` (uuid, primary key)
  - `integration_id` (uuid, foreign key to integrations)
  - `request_id` (text) - Unique request identifier
  - `method` (text) - HTTP method
  - `path` (text) - Request path
  - `headers` (jsonb) - Request headers (sanitized)
  - `body` (jsonb) - Request body
  - `response_status` (integer) - HTTP response status
  - `response_body` (jsonb) - Response body
  - `response_time_ms` (integer) - Response time in milliseconds
  - `error_message` (text) - Error message if failed
  - `created_at` (timestamptz)

  ### `health_checks`
  Stores health check results for APIs
  - `id` (uuid, primary key)
  - `api_id` (uuid, foreign key to apis)
  - `status` (text) - 'healthy', 'unhealthy', 'checking'
  - `response_time_ms` (integer)
  - `status_code` (integer)
  - `error_message` (text)
  - `checked_at` (timestamptz)

  ## 2. Security
  - Enable RLS on all tables
  - Users can only access their own APIs and integrations
  - Request logs are accessible only to the owner of the integration
  - Health checks are accessible only to the API owner

  ## 3. Indexes
  - Index on user_id for fast filtering
  - Index on integration_id for log queries
  - Index on created_at for time-based queries
  - Index on api_id for health check queries

  ## 4. Functions
  - Automatic updated_at timestamp trigger
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- APIs table
CREATE TABLE IF NOT EXISTS apis (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  type text NOT NULL CHECK (type IN ('published', 'external')),
  base_url text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE apis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own apis"
  ON apis FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own apis"
  ON apis FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own apis"
  ON apis FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own apis"
  ON apis FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_apis_updated_at BEFORE UPDATE ON apis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_apis_user_id ON apis(user_id);
CREATE INDEX IF NOT EXISTS idx_apis_type ON apis(type);

-- API Security table
CREATE TABLE IF NOT EXISTS api_security (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_id uuid REFERENCES apis(id) ON DELETE CASCADE NOT NULL,
  auth_type text NOT NULL DEFAULT 'none' CHECK (auth_type IN ('none', 'api_key', 'bearer_token', 'basic_auth', 'custom')),
  auth_config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE api_security ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view security for own apis"
  ON api_security FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM apis
      WHERE apis.id = api_security.api_id
      AND apis.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert security for own apis"
  ON api_security FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM apis
      WHERE apis.id = api_security.api_id
      AND apis.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update security for own apis"
  ON api_security FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM apis
      WHERE apis.id = api_security.api_id
      AND apis.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM apis
      WHERE apis.id = api_security.api_id
      AND apis.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete security for own apis"
  ON api_security FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM apis
      WHERE apis.id = api_security.api_id
      AND apis.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_api_security_updated_at BEFORE UPDATE ON api_security
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_api_security_api_id ON api_security(api_id);

-- Integrations table
CREATE TABLE IF NOT EXISTS integrations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  source_api_id uuid REFERENCES apis(id) ON DELETE CASCADE NOT NULL,
  target_api_id uuid REFERENCES apis(id) ON DELETE CASCADE NOT NULL,
  endpoint_path text NOT NULL,
  method text NOT NULL DEFAULT 'GET' CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  is_active boolean DEFAULT true,
  transform_config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own integrations"
  ON integrations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrations"
  ON integrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations"
  ON integrations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations"
  ON integrations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_source_api ON integrations(source_api_id);
CREATE INDEX IF NOT EXISTS idx_integrations_target_api ON integrations(target_api_id);

-- Request Logs table
CREATE TABLE IF NOT EXISTS request_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id uuid REFERENCES integrations(id) ON DELETE CASCADE NOT NULL,
  request_id text NOT NULL,
  method text NOT NULL,
  path text NOT NULL,
  headers jsonb DEFAULT '{}'::jsonb,
  body jsonb DEFAULT '{}'::jsonb,
  response_status integer,
  response_body jsonb DEFAULT '{}'::jsonb,
  response_time_ms integer,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs for own integrations"
  ON request_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM integrations
      WHERE integrations.id = request_logs.integration_id
      AND integrations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert logs for own integrations"
  ON request_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM integrations
      WHERE integrations.id = request_logs.integration_id
      AND integrations.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_request_logs_integration_id ON request_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_request_logs_created_at ON request_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_logs_request_id ON request_logs(request_id);

-- Health Checks table
CREATE TABLE IF NOT EXISTS health_checks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_id uuid REFERENCES apis(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'checking' CHECK (status IN ('healthy', 'unhealthy', 'checking')),
  response_time_ms integer,
  status_code integer,
  error_message text,
  checked_at timestamptz DEFAULT now()
);

ALTER TABLE health_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view health checks for own apis"
  ON health_checks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM apis
      WHERE apis.id = health_checks.api_id
      AND apis.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert health checks for own apis"
  ON health_checks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM apis
      WHERE apis.id = health_checks.api_id
      AND apis.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_health_checks_api_id ON health_checks(api_id);
CREATE INDEX IF NOT EXISTS idx_health_checks_checked_at ON health_checks(checked_at DESC);