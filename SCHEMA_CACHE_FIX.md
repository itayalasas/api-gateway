# Solución de Problemas de Cache de Esquema

## Problema
Cuando se agregan nuevas columnas a las tablas de Supabase, PostgREST puede mantener un cache desactualizado del esquema, causando errores como:

```
PGRST204: Could not find the 'column_name' column of 'table_name' in the schema cache
```

## Solución Inmediata

Si encuentras este error, ejecuta el siguiente comando SQL en Supabase:

```sql
NOTIFY pgrst, 'reload schema';
```

Esto forzará a PostgREST a recargar el cache del esquema inmediatamente.

## Prevención

### Al Aplicar Migraciones Manualmente

Siempre que apliques una migración que agregue, modifique o elimine columnas:

1. Aplica la migración SQL
2. Ejecuta: `NOTIFY pgrst, 'reload schema';`
3. Espera 1-2 segundos para que el cache se actualice

### Al Agregar Nuevas Columnas

Cuando agregues nuevas columnas en el código:

1. **Primero** aplica la migración en la base de datos
2. **Luego** recarga el esquema con NOTIFY
3. **Finalmente** actualiza el código de la aplicación

## Validación de Errores en el Código

El código ya incluye validaciones para errores de esquema. Si encuentras un error `PGRST204`:

1. Verifica que la migración se haya aplicado:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'tu_tabla';
   ```

2. Si la columna existe pero el error persiste, recarga el esquema:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

3. Si el problema continúa, puede ser necesario reiniciar el proyecto de Supabase (último recurso)

## Migraciones Recientes Aplicadas

- ✅ `add_gateway_domain_to_projects` - Agrega columna `gateway_domain` a `projects`
  - Fecha: 2025-11-15
  - Estado: Migración aplicada y esquema recargado
  - Comando ejecutado: `NOTIFY pgrst, 'reload schema';`

## Herramientas de Diagnóstico

### Verificar Cache de PostgREST
No hay una forma directa de ver el cache, pero puedes:

1. Intentar hacer un SELECT a la nueva columna vía API REST
2. Si falla con PGRST204, el cache está desactualizado
3. Si funciona, el cache está actualizado

### Verificar Columnas Existentes
```sql
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'projects'
ORDER BY ordinal_position;
```

## Notas Importantes

- **Supabase Cloud**: El cache se actualiza automáticamente cada pocos minutos
- **Desarrollo Local**: Puedes necesitar reiniciar el contenedor de PostgREST
- **Producción**: Usa `NOTIFY pgrst, 'reload schema';` para actualizaciones inmediatas sin downtime
