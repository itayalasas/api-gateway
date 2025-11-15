/*
  # Add Gateway Domain Configuration to Projects

  1. Changes
    - Add `gateway_domain` column to `projects` table
      - Optional text field for project-specific gateway domain
      - When NULL, uses system-wide gateway domain
      - When set, overrides system domain for that project's integrations

  2. Notes
    - Existing projects will use system gateway domain (NULL value)
    - New projects can optionally set their own gateway domain
    - This allows multi-domain setup for different projects/clients
*/

-- Add gateway_domain column to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'gateway_domain'
  ) THEN
    ALTER TABLE projects ADD COLUMN gateway_domain text;
  END IF;
END $$;

-- Add comment explaining the column
COMMENT ON COLUMN projects.gateway_domain IS 'Optional custom gateway domain for this project. If NULL, uses system-wide gateway domain from system_config.';
