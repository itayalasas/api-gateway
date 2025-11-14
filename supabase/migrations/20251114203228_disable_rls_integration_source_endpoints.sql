/*
  # Disable RLS for integration_source_endpoints table

  1. Changes
    - Disable Row Level Security on `integration_source_endpoints` table
    - Drop all existing policies for the table
    
  2. Reason
    - The application uses external authentication (not Supabase Auth)
    - RLS policies checking auth.uid() will always fail
    - Access control is handled at the application level through user_id columns
*/

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view own integration source endpoints" ON integration_source_endpoints;
DROP POLICY IF EXISTS "Users can insert own integration source endpoints" ON integration_source_endpoints;
DROP POLICY IF EXISTS "Users can delete own integration source endpoints" ON integration_source_endpoints;

-- Disable RLS on the table
ALTER TABLE integration_source_endpoints DISABLE ROW LEVEL SECURITY;

-- Add a comment explaining why RLS is disabled
COMMENT ON TABLE integration_source_endpoints IS 'RLS disabled - application uses external authentication. Access control handled through user_id columns in related integrations table.';
