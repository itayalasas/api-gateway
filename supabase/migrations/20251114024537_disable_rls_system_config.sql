/*
  # Disable RLS on system_config table

  1. Changes
    - Drop existing RLS policies on system_config
    - Disable RLS on system_config table
  
  2. Reason
    - External authentication doesn't create authenticated Supabase sessions
    - RLS policies blocking legitimate config updates
    - System config is application-wide, not user-specific
*/

-- Drop all existing RLS policies on system_config table
DROP POLICY IF EXISTS "Authenticated users can read config" ON system_config;
DROP POLICY IF EXISTS "Authenticated users can insert config" ON system_config;
DROP POLICY IF EXISTS "Authenticated users can update config" ON system_config;

-- Disable RLS on system_config
ALTER TABLE system_config DISABLE ROW LEVEL SECURITY;
