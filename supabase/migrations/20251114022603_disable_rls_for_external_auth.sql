/*
  # Disable RLS for External Authentication

  1. Changes
    - Drop existing RLS policies that use auth.uid()
    - Disable RLS on apis and integrations tables
    - Access control is now handled by external authentication system
  
  2. Reason
    - Application uses external authentication, not Supabase auth
    - auth.uid() returns NULL for external users
    - External auth system handles authorization
    - Frontend filters by user_id from external auth token
*/

-- Drop all existing RLS policies on apis table
DROP POLICY IF EXISTS "Users can view own apis" ON apis;
DROP POLICY IF EXISTS "Users can insert own apis" ON apis;
DROP POLICY IF EXISTS "Users can update own apis" ON apis;
DROP POLICY IF EXISTS "Users can delete own apis" ON apis;

-- Drop all existing RLS policies on integrations table
DROP POLICY IF EXISTS "Users can view own integrations" ON integrations;
DROP POLICY IF EXISTS "Users can insert own integrations" ON integrations;
DROP POLICY IF EXISTS "Users can update own integrations" ON integrations;
DROP POLICY IF EXISTS "Users can delete own integrations" ON integrations;

-- Disable RLS on tables (access control via external auth)
ALTER TABLE apis DISABLE ROW LEVEL SECURITY;
ALTER TABLE integrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE api_endpoints DISABLE ROW LEVEL SECURITY;
ALTER TABLE api_security DISABLE ROW LEVEL SECURITY;
ALTER TABLE request_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE health_checks DISABLE ROW LEVEL SECURITY;
