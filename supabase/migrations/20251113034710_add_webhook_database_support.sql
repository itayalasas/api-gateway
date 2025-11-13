/*
  # Agregar Soporte para Webhooks con Consultas a Base de Datos

  ## Resumen
  Esta migración extiende el sistema de integraciones para soportar webhooks que pueden:
  - Consultar la base de datos directamente
  - Transformar y mapear datos
  - Funcionar como middleware entre sistemas externos y la base de datos

  ## 1. Nuevas Columnas en `integrations`
  
  ### `integration_type`
  Tipo de integración: 'api_to_api', 'webhook', 'database_query'

  ### `webhook_config`
  Configuración JSON para webhooks con soporte de queries a DB

  ### `allow_database_access`
  Flag de seguridad para permitir acceso a base de datos

  ## 2. Seguridad
  - Solo usuarios autenticados pueden habilitar acceso a DB
  - Se valida en RLS existente
  - El Edge Function valida permisos antes de ejecutar queries

  ## 3. Notas Importantes
  - Las queries se ejecutan con los permisos del usuario dueño de la integración
  - Se recomienda usar RLS en todas las tablas consultadas
  - Los filtros se construyen dinámicamente pero de forma segura
*/

-- Agregar columna integration_type a integrations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'integrations' AND column_name = 'integration_type'
  ) THEN
    ALTER TABLE integrations 
    ADD COLUMN integration_type text DEFAULT 'api_to_api'
    CHECK (integration_type IN ('api_to_api', 'webhook', 'database_query'));
  END IF;
END $$;

-- Agregar columna webhook_config a integrations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'integrations' AND column_name = 'webhook_config'
  ) THEN
    ALTER TABLE integrations 
    ADD COLUMN webhook_config jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Agregar columna allow_database_access a integrations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'integrations' AND column_name = 'allow_database_access'
  ) THEN
    ALTER TABLE integrations 
    ADD COLUMN allow_database_access boolean DEFAULT false;
  END IF;
END $$;

-- Crear índice para búsqueda por tipo de integración
CREATE INDEX IF NOT EXISTS idx_integrations_type 
  ON integrations(integration_type) 
  WHERE is_active = true;

-- Comentarios para documentación
COMMENT ON COLUMN integrations.integration_type IS 
  'Tipo de integración: api_to_api (default), webhook (con DB), database_query (solo DB)';

COMMENT ON COLUMN integrations.webhook_config IS 
  'Configuración JSON para webhooks incluyendo queries a DB y mapeos de datos';

COMMENT ON COLUMN integrations.allow_database_access IS 
  'Flag de seguridad: permite que esta integración consulte la base de datos';