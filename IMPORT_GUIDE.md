# 📥 Guía de Importación de Base de Datos

Esta guía explica cómo importar datos a una nueva base de datos Supabase usando los archivos de exportación generados.

## 🎯 Requisitos Previos

1. **Archivo de exportación JSON** generado con `export-database.ts`
2. **Credenciales de la base de datos destino:**
   - URL de Supabase
   - Anon Key de Supabase

## 🚀 Cómo Usar el Script de Importación

### Sintaxis Básica

```bash
npx tsx import-database.ts <SUPABASE_URL> <SUPABASE_ANON_KEY> <RUTA_ARCHIVO_EXPORT>
```

### Ejemplo Real

```bash
npx tsx import-database.ts \
  "https://nueva-base-datos.supabase.co" \
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  "./exports/database-export-2025-11-13T03-54-33.json"
```

## 📋 Proceso de Importación

El script importa los datos en el siguiente orden para respetar las dependencias de claves foráneas:

1. **APIs** (sin dependencias)
2. **API Security** (depende de APIs)
3. **API Endpoints** (depende de APIs)
4. **Integrations** (depende de APIs y Endpoints)
5. **Request Logs** (depende de Integrations)
6. **Health Checks** (depende de APIs)

## ⚙️ Características del Script

### ✅ Validaciones

- Verifica que el archivo de exportación exista
- Valida el formato JSON del archivo
- Respeta el orden de dependencias entre tablas
- Maneja errores de forma individual por registro

### 📊 Reportes

El script muestra:
- Progreso en tiempo real
- Cantidad de registros importados exitosamente
- Cantidad de registros fallidos
- Detalles de errores encontrados
- Resumen final completo

### 🔄 Importación por Lotes

Para optimizar el rendimiento:
- **Request Logs**: Se importan en lotes de 100 registros
- **Health Checks**: Se importan en lotes de 50 registros
- Otros datos se importan de forma individual

## 📝 Ejemplo de Salida

```
🚀 Starting database import...

1️⃣  Reading export file...
   ✅ Loaded export from: 2025-11-13T03:54:31.771Z
   📦 Total records to import: 15

2️⃣  Importing Tables Data...

   Importing 3 APIs...
      ✅ GitHub API
      ✅ Stripe API
      ✅ SendGrid API

   Importing 3 Security configs...
      ✅ Imported 3 security configs

   Importing 5 Endpoints...
      ✅ Imported 5 endpoints

   Importing 4 Integrations...
      ✅ Webhook Handler
      ✅ Payment Processor
      ✅ Email Sender
      ✅ Data Sync

============================================================
📊 IMPORT SUMMARY
============================================================
📅 Original Export Date: 2025-11-13T03:54:31.771Z
📦 Source Database:      FlowBridge API Gateway

✅ Successfully Imported:
   - APIs:              3
   - Security configs:  3
   - Endpoints:         5
   - Integrations:      4
   - Request logs:      0
   - Health checks:     0

🎉 Total Imported:       15 records

✨ Import completed successfully with no errors!
============================================================
```

## ⚠️ Consideraciones Importantes

### 1. Base de Datos Destino

**IMPORTANTE**: La base de datos destino debe tener el mismo esquema que la base de datos de origen. Esto incluye:

- ✅ Todas las tablas creadas
- ✅ RLS (Row Level Security) habilitado
- ✅ Políticas de seguridad configuradas
- ✅ Triggers y funciones creadas
- ✅ Índices establecidos

**Recomendación**: Ejecuta todas las migraciones SQL en la nueva base de datos antes de importar datos.

### 2. Usuarios de Auth

El script actual **NO importa usuarios de `auth.users`** porque requiere la Service Role Key (no recomendado compartir por seguridad).

Para migrar usuarios:
1. Usa el panel de administración de Supabase
2. O contacta al soporte de Supabase para migraciones de usuarios con contraseñas

### 3. IDs y Relaciones

- El script preserva todos los IDs UUID originales
- Las relaciones de claves foráneas se mantienen intactas
- Si hay conflictos de IDs existentes, la importación fallará para esos registros

### 4. Manejo de Errores

Si un registro individual falla:
- ✅ El script continúa con los siguientes registros
- ✅ Se registra el error específico
- ✅ Al final se muestra un resumen de todos los errores
- ✅ Los registros exitosos se mantienen en la base de datos

## 🔧 Casos de Uso

### Migrar entre Proyectos Supabase

```bash
# 1. Exportar de la base de datos antigua
npx tsx export-database.ts

# 2. Importar a la nueva base de datos
npx tsx import-database.ts \
  "https://nueva-base.supabase.co" \
  "nueva-anon-key" \
  "./exports/database-export-2025-11-13T03-54-33.json"
```

### Restaurar un Backup

```bash
# Usar un archivo de exportación anterior como backup
npx tsx import-database.ts \
  "https://gdissdewzygwtetmqrjz.supabase.co" \
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  "./exports/database-export-2025-11-10T10-00-00.json"
```

### Ambiente de Testing

```bash
# Copiar datos de producción a testing
npx tsx import-database.ts \
  "https://testing-env.supabase.co" \
  "testing-anon-key" \
  "./exports/production-backup.json"
```

## 🛡️ Seguridad

### ✅ Buenas Prácticas

1. **Nunca compartas** las claves en repositorios públicos
2. **Usa variables de entorno** para las credenciales
3. **Verifica los permisos** de la anon key antes de importar
4. **Revisa el archivo de exportación** antes de importar

### 🔐 Usando Variables de Entorno

Crea un script auxiliar:

```bash
#!/bin/bash
# import.sh

source .env.new-database

npx tsx import-database.ts \
  "$NEW_SUPABASE_URL" \
  "$NEW_SUPABASE_ANON_KEY" \
  "$1"
```

Uso:
```bash
chmod +x import.sh
./import.sh "./exports/database-export-2025-11-13T03-54-33.json"
```

## 🆘 Solución de Problemas

### Error: "Export file not found"

**Causa**: La ruta al archivo de exportación es incorrecta.

**Solución**: Verifica que la ruta sea correcta y que el archivo exista.

```bash
ls -la ./exports/
```

### Error: "Foreign key constraint violation"

**Causa**: La base de datos destino no tiene todas las tablas o el orden de importación tiene problemas.

**Solución**:
1. Verifica que todas las migraciones estén aplicadas
2. Asegúrate de que las tablas existan
3. El script ya maneja el orden correcto, pero verifica que no haya modificaciones manuales

### Error: "Row Level Security policy violation"

**Causa**: Las políticas RLS están bloqueando la inserción.

**Solución**:
1. Verifica que estés autenticado con un usuario que tenga permisos
2. Temporalmente podrías desactivar RLS durante la importación (NO recomendado en producción)
3. Usa la Service Role Key si es necesario (con precaución)

### Importación Parcial

Si solo algunos registros fallaron:
- ✅ Los registros exitosos ya están en la base de datos
- ✅ Puedes intentar re-importar solo los fallidos
- ✅ Revisa los mensajes de error para identificar el problema

## 📚 Scripts Relacionados

- **`export-database.ts`**: Exporta todos los datos de una base de datos
- **`import-database.ts`**: Importa datos a una base de datos nueva (este script)
- **`migrate-data.ts`**: (Removido) Era para migración directa entre dos instancias

## 💡 Tips

1. **Haz un export antes de importar** para tener un backup de la base de datos destino
2. **Prueba primero en un ambiente de desarrollo** antes de producción
3. **Revisa los logs completos** para asegurarte de que todo se importó correctamente
4. **Mantén múltiples backups** con timestamps diferentes
