# Guía de Modos de Proxy en FlowBridge

FlowBridge API Gateway soporta 3 modos de proxy diferentes. Elige el modo correcto según tu caso de uso.

---

## 🎯 Modo 1: **Direct** (Por defecto)

### Cuándo usarlo
- Recibes datos de un cliente/webhook y los envías a otra API
- Necesitas hacer proxy simple sin transformaciones complejas
- Quieres exponer una API interna de forma segura

### Flujo
```
Cliente/Webhook → [Gateway] → API Destino → Cliente
                  (body entrante) → (se envía tal cual)
```

### Ejemplos de uso
- Recibir webhook de Stripe y enviarlo a tu sistema de contabilidad
- Exponer tu API interna con autenticación centralizada
- Hacer proxy de peticiones entre microservicios

### Configuración
```typescript
proxy_mode: 'direct'
// No requiere configuración adicional
```

---

## 🎯 Modo 2: **Post-Process**

### Cuándo usarlo
- Necesitas procesar/transformar la respuesta del API destino antes de retornarla
- Quieres enriquecer datos con información de otra fuente
- Necesitas validar o transformar respuestas

### Flujo
```
Cliente → [Gateway] → API Destino → [Gateway obtiene respuesta]
                                   ↓
                      API Post-Process ← [envía para procesar]
                                   ↓
                              Cliente ← [retorna resultado final]
```

### Ejemplos de uso
- Llamar API de clima → Traducir texto a español → Retornar al cliente
- Obtener datos de usuario → Enriquecer con permisos de BD → Retornar
- Llamar API externa → Validar formato → Guardar en cache → Retornar

### Configuración
```typescript
proxy_mode: 'post_process'
post_process_api_id: 'uuid-de-api-procesadora'

// La API procesadora recibirá:
{
  "original_request": { /* body original del cliente */ },
  "target_response": { /* respuesta del API destino */ }
}
```

---

## 🎯 Modo 3: **Fetch and Forward** ⭐ NUEVO

### Cuándo usarlo
- NO recibes datos del cliente (o los ignoras)
- Necesitas obtener datos de una API origen (GET)
- Y enviar esos datos a otra API destino (POST/PUT/PATCH)
- Perfecto para sincronizaciones automáticas con cron

### Flujo
```
Cliente/Cron → [Gateway] → API Origen (GET) → obtiene JSON
                              ↓
                      API Destino (POST) ← [envía los datos obtenidos]
                              ↓
                          Cliente ← [retorna respuesta]
```

### Ejemplos de uso
- **Sincronización de usuarios**: GET usuarios de Sistema A → POST a Sistema B
- **Migración de datos**: GET registros antiguos → POST a nuevo sistema
- **Polling automático**: GET estado de API → POST a sistema de monitoreo
- **Replicación de datos**: GET datos actualizados → POST a respaldo

### Configuración

#### 1. En la base de datos (manual)
```sql
UPDATE integrations
SET proxy_mode = 'fetch_and_forward'
WHERE id = 'tu-integration-id';
```

#### 2. En la interfaz (próximamente)
Al crear/editar una integración:
1. Configura **API Origen** con endpoint GET
2. Configura **API Destino** con endpoint POST/PUT/PATCH
3. Selecciona modo: **"Fetch and Forward (Sync Mode)"**
4. Guarda la integración

#### 3. Llamar desde cron o manualmente
```bash
# Llamada manual
curl -X POST \
  https://tu-gateway.supabase.co/functions/v1/api-gateway/integration-id \
  -H "X-Integration-Key: tu-api-key"

# Programar con pg_cron (Supabase)
SELECT cron.schedule(
  'sync-users-every-hour',
  '0 * * * *', -- Cada hora
  $$
  SELECT extensions.http_post(
    'https://tu-gateway.supabase.co/functions/v1/api-gateway/integration-id',
    jsonb_build_object(
      'X-Integration-Key', 'tu-api-key'
    ),
    '{}'::jsonb
  )
  $$
);
```

### Comportamiento
1. Gateway ignora el body que recibes del cliente
2. Llama a la API Origen con GET (con autenticación configurada)
3. Obtiene la respuesta JSON
4. Usa esa respuesta como body para llamar a la API Destino con POST
5. Retorna la respuesta de la API Destino

---

## 📊 Comparación Rápida

| Característica | Direct | Post-Process | Fetch and Forward |
|---------------|--------|--------------|-------------------|
| **Usa body entrante** | ✅ Sí | ✅ Sí | ❌ No (lo ignora) |
| **Llama a origen** | ❌ No | ❌ No | ✅ Sí (GET) |
| **Procesa respuesta** | ❌ No | ✅ Sí | ❌ No |
| **APIs involucradas** | 1 (destino) | 2 (destino + procesadora) | 2 (origen + destino) |
| **Ideal para** | Webhooks, proxy simple | Transformaciones | Sincronizaciones, cron |

---

## 🔧 Cómo Implementar en el Futuro

### Para crear una integración con Fetch and Forward:

#### Opción A: Desde la interfaz web

1. Ve a **Integraciones** → **Nueva Integración**
2. Configura **API Origen** (la que tiene los datos):
   - Selecciona tu API con endpoint GET
   - Ejemplo: `GET /api/users`
3. Configura **API Destino** (donde se enviarán):
   - Selecciona tu API con endpoint POST/PUT/PATCH
   - Ejemplo: `POST /api/sync-users`
4. En **Modo de Proxy**, selecciona: **"Fetch and Forward (Sync Mode)"**
5. Guarda y prueba

#### Opción B: Desde SQL (avanzado)

```sql
-- 1. Crear la integración
INSERT INTO integrations (
  name,
  user_id,
  source_api_id,
  target_api_id,
  source_endpoint_id,
  target_endpoint_id,
  proxy_mode,
  is_active
) VALUES (
  'Sync Users Every Hour',
  'tu-user-id',
  'api-origen-id',
  'api-destino-id',
  'endpoint-origen-id',
  'endpoint-destino-id',
  'fetch_and_forward',
  true
)
RETURNING id;

-- 2. Obtener el ID de la integración
-- 3. Llamarla desde cron o manualmente
```

---

## ⚠️ Consideraciones Importantes

### Fetch and Forward
- La API Origen **debe** retornar JSON válido
- El body del cliente se **ignora** completamente
- La autenticación de ambas APIs se maneja automáticamente
- Los logs registran ambas llamadas (origen y destino)

### Post-Process
- La API procesadora **debe** estar disponible
- Si falla el post-process, se retorna error 500
- El body procesado reemplaza la respuesta original

### Direct
- Es el modo más rápido y simple
- No hay procesamiento adicional
- Ideal para la mayoría de casos

---

## 🚀 Casos de Uso Reales

### 1. Sincronización de Usuarios (Fetch and Forward)
```
Problema: Necesito sincronizar usuarios entre ContaEmpresa y mi sistema cada hora

Solución:
- API Origen: GET /api/users (ContaEmpresa)
- API Destino: POST /api/sync-users (Mi sistema)
- Modo: fetch_and_forward
- Cron: Cada hora con pg_cron
```

### 2. Webhook con Enriquecimiento (Post-Process)
```
Problema: Recibo webhook de pagos pero necesito agregar datos del cliente

Solución:
- API Destino: POST /api/payments (Sistema de pagos)
- API Post-Process: POST /api/enrich-payment (Mi sistema - agrega datos)
- Modo: post_process
```

### 3. Proxy Simple de API (Direct)
```
Problema: Exponer mi API interna con rate limiting y logs

Solución:
- API Destino: POST /api/customers (Mi API interna)
- Modo: direct
- Gateway maneja: Auth, logs, rate limiting
```

---

## 📝 Notas Finales

- **Todos los modos registran logs completos** en `request_logs`
- **La autenticación es automática** según la configuración de cada API
- **Los headers personalizados** funcionan en todos los modos
- **Query params y path params** se procesan antes de cualquier llamada
- **El cache** funciona en todos los modos si está habilitado

¿Tienes dudas? Revisa los logs en la sección de **Webhooks** para ver exactamente qué está pasando en cada paso.
