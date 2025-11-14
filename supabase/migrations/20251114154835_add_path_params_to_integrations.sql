/*
  # Add Path Parameters Support to Integrations

  ## Changes
  1. Add `path_params` column to integrations table
     - Stores mapping configuration for dynamic path parameters
     - Format: [{ param: "projectId", source: "body", path: "data.projectId" }]

  ## Example Use Cases
  - API 2 URL: `/v1/projects/:projectId/messages:send`
  - API 1 sends: `{ "data": { "projectId": "my-project-123" } }`
  - Gateway replaces `:projectId` with `my-project-123` automatically

  ## Parameter Sources
  - `body`: Extract from request body JSON (supports nested paths like `data.projectId`)
  - `query`: Extract from query parameters
  - `header`: Extract from request headers

  ## Notes
  - Path parameters are detected automatically using `:paramName` syntax
  - Values are extracted dynamically from incoming request
  - Supports complex nested JSON paths using dot notation
*/

-- Add path_params column to integrations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'integrations' AND column_name = 'path_params'
  ) THEN
    ALTER TABLE integrations ADD COLUMN path_params jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add comment to describe the column
COMMENT ON COLUMN integrations.path_params IS 'Configuration for dynamic path parameter replacement';