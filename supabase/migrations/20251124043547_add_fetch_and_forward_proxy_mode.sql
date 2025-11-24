/*
  # Add fetch_and_forward Proxy Mode

  1. Changes
    - Update proxy_mode constraint to include 'fetch_and_forward' mode
    - This mode allows fetching data from source API and forwarding to target API
    
  2. Details
    - fetch_and_forward: First calls source API (GET), then forwards response to target API (POST)
    - Useful for scheduled integrations that need to sync data between APIs
*/

-- Drop existing constraint
ALTER TABLE integrations 
DROP CONSTRAINT IF EXISTS integrations_proxy_mode_check;

-- Add updated constraint with new mode
ALTER TABLE integrations 
ADD CONSTRAINT integrations_proxy_mode_check 
CHECK (proxy_mode IN ('direct', 'post_process', 'fetch_and_forward'));
