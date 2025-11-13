/*
  # Agregar aplicación dueña y gestión de endpoints

  ## Cambios
  
  1. Agregar campo `application_owner` a la tabla `apis`
     - Nombre de la aplicación dueña de la API
  
  2. Crear tabla `api_endpoints`
     - Múltiples endpoints por API
  
  3. Modificar tabla `integrations`
     - Cambiar `endpoint_path` y `method` por `source_endpoint_id` y `target_endpoint_id`
     - Referenciar endpoints específicos en lugar de paths
  
  4. Seguridad
     - RLS en tabla `api_endpoints`
     - Usuarios solo pueden acceder a endpoints de sus propias APIs
*/

-- Agregar campo application_owner a apis
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'apis' AND column_name = 'application_owner'
  ) THEN
    ALTER TABLE apis ADD COLUMN application_owner text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Crear tabla api_endpoints
CREATE TABLE IF NOT EXISTS api_endpoints (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_id uuid REFERENCES apis(id) ON DELETE CASCADE NOT NULL,
  path text NOT NULL,
  method text NOT NULL DEFAULT 'GET' CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE api_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view endpoints for own apis"
  ON api_endpoints FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM apis
      WHERE apis.id = api_endpoints.api_id
      AND apis.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert endpoints for own apis"
  ON api_endpoints FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM apis
      WHERE apis.id = api_endpoints.api_id
      AND apis.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update endpoints for own apis"
  ON api_endpoints FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM apis
      WHERE apis.id = api_endpoints.api_id
      AND apis.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM apis
      WHERE apis.id = api_endpoints.api_id
      AND apis.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete endpoints for own apis"
  ON api_endpoints FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM apis
      WHERE apis.id = api_endpoints.api_id
      AND apis.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_api_endpoints_updated_at BEFORE UPDATE ON api_endpoints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_api_endpoints_api_id ON api_endpoints(api_id);

-- Agregar nuevas columnas a integrations para referenciar endpoints específicos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'integrations' AND column_name = 'source_endpoint_id'
  ) THEN
    ALTER TABLE integrations ADD COLUMN source_endpoint_id uuid REFERENCES api_endpoints(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'integrations' AND column_name = 'target_endpoint_id'
  ) THEN
    ALTER TABLE integrations ADD COLUMN target_endpoint_id uuid REFERENCES api_endpoints(id) ON DELETE SET NULL;
  END IF;
END $$;
