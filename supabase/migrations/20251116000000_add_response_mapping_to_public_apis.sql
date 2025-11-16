/*
  # Add Response Mapping to Public APIs

  1. Changes
    - Add `response_mapping` JSONB column to integrations table
    - This allows optional transformation of API responses
    - Supports field filtering, concatenation, and custom transformations

  2. Response Mapping Structure
    ```json
    {
      "enabled": true,
      "template": {
        "flags": {
          "png": "${response.flags.png}",
          "svg": "${response.flags.svg}"
        },
        "idd": "${response.idd}"
      },
      "transformations": [
        {
          "field": "full_phone",
          "expression": "${response.idd.root}${response.idd.suffixes[0]}"
        }
      ]
    }
    ```

  3. Features
    - Optional: If not configured, returns original response
    - Template-based: Define the output structure
    - Dynamic values: Use ${response.path.to.field} syntax
    - Transformations: Concatenate and transform fields
    - Array support: Access array elements with [index]

  4. Notes
    - Only applies to public_proxy integrations
    - Processed after receiving response from target API
    - Errors in mapping return original response with warning
*/

-- Add response_mapping column to integrations table
ALTER TABLE integrations
ADD COLUMN IF NOT EXISTS response_mapping JSONB DEFAULT NULL;

-- Add comment explaining the feature
COMMENT ON COLUMN integrations.response_mapping IS 'Optional response transformation config for public APIs. Allows filtering fields, concatenating values, and custom transformations using template syntax.';

-- Create an index for faster queries on integrations with response mapping
CREATE INDEX IF NOT EXISTS idx_integrations_response_mapping
ON integrations ((response_mapping IS NOT NULL))
WHERE integration_type = 'public_proxy';
