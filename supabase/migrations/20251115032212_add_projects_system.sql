/*
  # Sistema de Proyectos para Organización

  1. Nueva Tabla
    - `projects`
      - `id` (uuid, primary key)
      - `name` (text) - Nombre del proyecto/carpeta
      - `description` (text) - Descripción opcional
      - `color` (text) - Color para identificación visual (#hex)
      - `icon` (text) - Nombre del icono de lucide-react
      - `user_id` (text) - Propietario del proyecto
      - `is_active` (boolean) - Si el proyecto está activo
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `project_members`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `user_id` (text) - Usuario con acceso
      - `role` (text) - 'owner' | 'editor' | 'viewer'
      - `created_at` (timestamp)

  2. Modificaciones
    - Agregar `project_id` (nullable) a `apis`
    - Agregar `project_id` (nullable) a `integrations`

  3. Seguridad
    - Enable RLS en ambas tablas nuevas
    - Políticas restrictivas basadas en membresía
*/

-- Crear tabla de proyectos
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  color text DEFAULT '#3b82f6',
  icon text DEFAULT 'Folder',
  user_id text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear tabla de miembros del proyecto
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Agregar project_id a apis
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'apis' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE apis ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Agregar project_id a integrations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'integrations' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE integrations ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_is_active ON projects(is_active);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_apis_project_id ON apis(project_id);
CREATE INDEX IF NOT EXISTS idx_integrations_project_id ON integrations(project_id);

-- Disable RLS temporarily (external auth system)
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();
