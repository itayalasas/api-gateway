/*
  # Update User References for External Authentication

  1. Changes
    - Remove foreign key constraint from apis table to auth.users
    - Remove foreign key constraint from integrations table to auth.users
    - Update all existing user_id references to new external user ID
  
  2. Reason
    - Application now uses external authentication system
    - User IDs come from external auth provider, not Supabase auth.users
    - Need to maintain referential integrity without foreign key constraints
*/

-- Remove foreign key constraints
ALTER TABLE IF EXISTS apis DROP CONSTRAINT IF EXISTS apis_user_id_fkey;
ALTER TABLE IF EXISTS integrations DROP CONSTRAINT IF EXISTS integrations_user_id_fkey;

-- Update all existing records to new external user ID
UPDATE apis 
SET user_id = '41994624-0d1a-41fc-b9b6-f14cc0ca8579'
WHERE user_id = '00432651-d7ed-4353-a86a-7e790456ab4c';

UPDATE integrations 
SET user_id = '41994624-0d1a-41fc-b9b6-f14cc0ca8579'
WHERE user_id = '00432651-d7ed-4353-a86a-7e790456ab4c';
