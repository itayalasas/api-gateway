# 📘 Cómo Usar Webhooks - Guía Simple

## ⚠️ LIMITACIÓN IMPORTANTE

### ❌ Lo que NO puedes hacer:
- **NO puedes** conectarte directamente a bases de datos externas (MySQL, PostgreSQL externo, SQL Server, etc.)
- **NO puedes** ejecutar queries en bases de datos fuera de Supabase
- **NO puedes** conectarte a otra red/servidor de base de datos

### ✅ Lo que SÍ puedes hacer:
- Consultar **tu propia base de datos de Supabase** (la que viene con este proyecto)
- Recibir webhooks de sistemas externos (Stripe, Shopify, etc.)
- Reenviar datos a APIs externas
- Transformar y mapear datos entre sistemas

---

## 🎯 Casos de Uso Reales

### Caso 1: Webhook Simple (SIN Base de Datos)
**Escenario**: Stripe te envía un pago → Lo reenvías a tu sistema interno

```
Stripe (pago) → API Gateway → Tu API Interna
```

**NO necesitas BD**, solo reenviar datos.

### Caso 2: Webhook con BD de Supabase
**Escenario**: Stripe envía pago → Consultas tu BD de Supabase → Envías todo junto

```
Stripe (pago) → API Gateway → Consulta Supabase → Tu API Interna
                              (datos del usuario)
```

**Tabla en Supabase**: `users`, `subscriptions`, etc.

### Caso 3: Base de Datos Externa
**Escenario**: Tienes una BD en otro servidor (MySQL, PostgreSQL externo)

❌ **NO FUNCIONA** directamente con este sistema.

✅ **SOLUCIÓN**: Crea un API en ese servidor que exponga los datos:

```
Webhook → API Gateway → Tu API (consulta BD externa) → Respuesta
```

---

## 📝 Paso a Paso: Configurar un Webhook

### Paso 1: Crea las APIs

1. Ve a la sección **"APIs"**
2. Crea dos APIs:

**API Origen** (quien envía el webhook):
- Nombre: `Stripe`
- Tipo: `external`
- Base URL: `https://stripe.com` (no importa mucho)
- Application Owner: `Stripe`

**API Destino** (a dónde envías):
- Nombre: `Mi Sistema Interno`
- Tipo: `external`
- Base URL: `https://mi-api.com`
- Application Owner: `Mi Empresa`

3. Para cada API, crea un **Endpoint**:
   - Path: `/webhooks/payment` (para Stripe)
   - Method: `POST`
   - Path: `/api/process-payment` (para tu sistema)
   - Method: `POST`

4. Configura la **Seguridad** del API destino si es necesario

### Paso 2: Crea la Integración

1. Ve a **"Integraciones"**
2. Click en **"Nueva Integración"**
3. Completa:
   - Nombre: `Procesador de Pagos Stripe`
   - API Origen: `Stripe`
   - Endpoint Origen: `/webhooks/payment`
   - API Destino: `Mi Sistema Interno`
   - Endpoint Destino: `/api/process-payment`

4. El sistema genera automáticamente un **API Key** único

### Paso 3: Obtén la URL del Webhook

1. Ve a la sección **"Webhooks"** (nuevo menú)
2. Selecciona tu integración
3. Copia la URL que se muestra:
   ```
   https://tu-proyecto.supabase.co/functions/v1/api-gateway/abc123...
   ```
4. Copia también el **API Key**

### Paso 4: Configurar en Stripe (o sistema externo)

#### En Stripe:
1. Ve a: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Pega la URL del webhook
4. En "Webhook version", selecciona la última
5. Click "Add endpoint"
6. En la página del webhook, ve a "Signing secret"
7. Agrega un header personalizado:
   - Name: `X-Integration-Key`
   - Value: `[tu-api-key-copiado]`

#### Prueba Manual con cURL:
```bash
curl -X POST \
  'https://tu-proyecto.supabase.co/functions/v1/api-gateway/abc123...' \
  -H 'X-Integration-Key: int_xxx...' \
  -H 'Content-Type: application/json' \
  -d '{
    "event": "payment.success",
    "amount": 1000,
    "customer_id": "cus_123"
  }'
```

---

## 🗄️ Usando la Base de Datos de Supabase

### ¿Cuándo Usar?

Solo si **almacenas datos en tu propia BD de Supabase**.

**Ejemplo**: Tienes una tabla `subscriptions` en Supabase con info de usuarios.

### Cómo Configurar

Actualmente se hace vía SQL:

```sql
UPDATE integrations
SET
  integration_type = 'webhook',
  allow_database_access = true,
  webhook_config = '{
    "database_query": {
      "enabled": true,
      "table": "subscriptions",
      "select": "*",
      "filters": {
        "stripe_customer_id": "${incoming.customer}"
      }
    },
    "data_mapping": {
      "enabled": true,
      "mappings": [
        {
          "source": "incoming.amount",
          "target": "amount"
        },
        {
          "source": "db[0].plan_name",
          "target": "plan"
        }
      ]
    },
    "merge_strategy": "combine"
  }'::jsonb
WHERE id = 'tu-integration-id';
```

### Qué Hace Esto

1. Cuando llega el webhook de Stripe con `{ customer: "cus_123", amount: 1000 }`
2. El gateway consulta tu tabla `subscriptions` donde `stripe_customer_id = "cus_123"`
3. Combina ambos datos
4. Envía a tu API destino:
   ```json
   {
     "amount": 1000,
     "plan": "Pro Plan",
     "db_results": [{
       "id": "sub_1",
       "plan_name": "Pro Plan",
       "stripe_customer_id": "cus_123"
     }]
   }
   ```

---

## 🚫 Errores Comunes

### Error: "Database query failed"

**Causa**: Intentas consultar una tabla que no existe en Supabase o no tienes permisos.

**Solución**:
1. Verifica que la tabla existe en tu BD de Supabase
2. Revisa que el RLS permita el acceso
3. Confirma que `allow_database_access = true`

### Error: "Integration not found"

**Causa**: El ID de integración en la URL es incorrecto.

**Solución**:
1. Ve a la sección "Webhooks"
2. Copia nuevamente la URL completa
3. Asegúrate de usar esa URL exacta

### Error: "Unauthorized"

**Causa**: Falta el API Key o es incorrecto.

**Solución**:
1. Ve a "Webhooks", copia el API Key
2. Asegúrate de incluir el header: `X-Integration-Key: int_xxx...`
3. Verifica que no haya espacios extras

### Error: "Target API configuration not found"

**Causa**: No configuraste correctamente el API destino o el endpoint.

**Solución**:
1. Ve a "APIs" y verifica que el API destino existe
2. Verifica que el endpoint esté creado
3. Re-edita la integración y selecciona bien el endpoint

---

## 💡 Tips y Mejores Prácticas

### 1. Prueba Primero con cURL
Antes de configurar en Stripe/otro sistema, prueba con cURL para verificar que todo funciona.

### 2. Revisa los Logs
Ve a la sección "Registros" (cuando esté disponible) para ver qué está pasando.

O consulta directamente:
```sql
SELECT * FROM request_logs
WHERE integration_id = 'tu-integration-id'
ORDER BY created_at DESC
LIMIT 10;
```

### 3. Empieza Simple
No uses consultas a BD al principio. Solo prueba el flujo básico:
```
Sistema Externo → Webhook → Tu API
```

Después agrega la BD si es necesario.

### 4. Seguridad del API Destino
Si tu API destino requiere autenticación, configúrala en la sección "APIs":
- Ve al API destino
- Click en "Editar"
- Configura seguridad (API Key, Bearer Token, etc.)

---

## 🎓 Ejemplo Completo Paso a Paso

### Escenario
Quieres recibir webhooks de Stripe cuando hay un pago exitoso y enviarlos a tu sistema.

### Paso 1: Datos Iniciales
```
Tu proyecto Supabase: https://abcd1234.supabase.co
Tu API interna: https://mi-sistema.com/api/payments
```

### Paso 2: En la UI del Gateway

1. **Crear API Origen**:
   - Nombre: `Stripe`
   - Base URL: `https://stripe.com`
   - Crear endpoint: `/webhooks/payment`, `POST`

2. **Crear API Destino**:
   - Nombre: `Mi Sistema`
   - Base URL: `https://mi-sistema.com`
   - Crear endpoint: `/api/payments`, `POST`
   - Configurar seguridad si es necesario

3. **Crear Integración**:
   - Nombre: `Stripe → Mi Sistema`
   - Origen: `Stripe` / `/webhooks/payment`
   - Destino: `Mi Sistema` / `/api/payments`

4. **Copiar Datos**:
   - URL: `https://abcd1234.supabase.co/functions/v1/api-gateway/xyz789...`
   - API Key: `int_abc123def456...`

### Paso 3: En Stripe

1. Dashboard → Webhooks → Add endpoint
2. URL: `https://abcd1234.supabase.co/functions/v1/api-gateway/xyz789...`
3. Events: `payment_intent.succeeded`
4. Guardar

### Paso 4: Probar

Hacer un pago de prueba en Stripe. Deberías ver:
1. Webhook llega al gateway
2. Gateway lo reenvía a `https://mi-sistema.com/api/payments`
3. Log aparece en `request_logs`

---

## ❓ Preguntas Frecuentes

### "¿Puedo usar mi base de datos MySQL?"
No directamente. Crea un API que exponga los datos de MySQL y llama a ese API desde tu integración.

### "¿Cómo agrego filtros dinámicos a las queries?"
Usa la sintaxis `${incoming.campo}` en los filtros. Ejemplo:
```json
{
  "filters": {
    "customer_id": "${incoming.customer_id}"
  }
}
```

### "¿Puedo recibir múltiples webhooks en la misma integración?"
Sí, pero es mejor crear una integración por evento para tener mejor control y logs separados.

### "¿Dónde veo los errores?"
En la tabla `request_logs`. O crea una vista de "Logs" en tu UI.

---

## 🎉 Resumen

1. ✅ **Crea APIs** (origen y destino)
2. ✅ **Crea Integración**
3. ✅ **Copia URL y API Key**
4. ✅ **Configura en sistema externo**
5. ✅ **Prueba**
6. ✅ **Monitorea logs**

**Recuerda**: Solo puedes consultar tu BD de Supabase, no BDs externas.

Para BDs externas → Crea un API que las exponga primero.
