/*
  # Add description column to integrations table

  1. Changes
    - Add `description` column to `integrations` table
    - Column is optional (nullable) with default empty string
    - Allows storing additional context about integrations
    
  2. Notes
    - Used for Public APIs to provide detailed descriptions
    - Also useful for documenting regular integrations
    - Backward compatible - existing records will have empty description
*/

-- Add description column
ALTER TABLE integrations 
ADD COLUMN IF NOT EXISTS description text DEFAULT '' NULL;

-- Add comment
COMMENT ON COLUMN integrations.description IS 'Optional description of the integration purpose and functionality';
