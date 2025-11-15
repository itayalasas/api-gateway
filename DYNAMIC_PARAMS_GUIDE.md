# Guía de Parámetros Dinámicos y Proxy Avanzado

## 🎯 Descripción General

FlowBridge ahora soporta configuración avanzada de parámetros dinámicos y modos de proxy para casos de uso complejos:

- **Query Parameters Dinámicos**: Extrae valores de la petición entrante y agrégalos como query params a la URL destino
- **Proxy Mode**: Define cómo procesar las respuestas (directo o post-procesamiento)
- **Post-Process APIs**: Encadena múltiples APIs para workflows complejos

---

## 📋 Casos de Uso

### Caso 1: API Pública que consume API Externa (MercadoPago)

**Escenario**: Quieres exponer una API pública que permita a terceros consultar transacciones de MercadoPago.

```
Cliente Externo → Gateway (API Pública) → MercadoPago API → Cliente Externo
```

**Configuración**:

1. **Crear API Externa (MercadoPago)**:
   - Nombre: `MercadoPago API`
   - Base URL: `https://api.mercadopago.com`
   - Tipo: `external`
   - Endpoint: `/v1/payments/:id` (GET)
   - Seguridad: Bearer Token con tu access token de MercadoPago

2. **Crear API Pública**:
   - Nombre: `Public Payment Query`
   - Target API: `MercadoPago API`
   - Se genera automáticamente:
     - URL pública
     - API Key con prefijo `pub_`

3. **Configurar Query Parameters**:
   - **Parameter Name**: `id`
   - **Source**: URL Query Param
   - **Path**: `transaction_id`
   - **Required**: ✓ Sí

   Ahora el cliente puede llamar:
   ```bash
   GET https://gateway.supabase.co/functions/v1/api-gateway/{id}?transaction_id=12345
   Headers:
     X-Integration-Key: pub_abc123...
   ```

   Y el gateway automáticamente llamará:
   ```bash
   GET https://api.mercadopago.com/v1/payments/12345
   Headers:
     Authorization: Bearer YOUR_MP_TOKEN
   ```

4. **Proxy Mode**: `Direct` (la respuesta de MercadoPago se devuelve directamente al cliente)

---

### Caso 2: Webhook con Enriquecimiento de Datos

**Escenario**: Recibes un webhook de pago, consultas tu DB para obtener datos del cliente, y envías todo a tu sistema interno.

```
Webhook → Gateway → Consulta DB → API Interna → Gateway → Response
```

**Configuración**:

1. **Crear Integración Webhook**:
   - Tipo: `webhook`
   - Allow Database Access: ✓ Sí

2. **Query Database Config**:
   ```json
   {
     "table": "customers",
     "select": "id, name, email, plan",
     "filters": {
       "payment_id": "${incoming.payment.id}"
     }
   }
   ```

3. **Proxy Mode**: `Post-Process`
   - **Post-Process API**: Tu API interna de notificaciones

4. **El gateway enviará al post-process API**:
   ```json
   {
     "original_request": {
       "payment": {
         "id": "12345",
         "amount": 100
       }
     },
     "target_response": {
       "status": "approved",
       "transaction_id": "xyz"
     }
   }
   ```

---

### Caso 3: Proxy con Headers Dinámicos

**Escenario**: Necesitas pasar headers del cliente a la API destino, más headers personalizados.

**Configuración**:

1. **Custom Headers**:
   ```
   X-Api-Key: tu-api-key-secreta
   X-User-Id: ${header.X-Client-Id}
   X-Transaction: ${body.payment.transaction_id}
   ```

2. **Forward Headers**:
   - `User-Agent`
   - `X-Request-ID`
   - `X-Correlation-ID`

3. **Query Parameters**:
   - **Name**: `merchant_id`
   - **Source**: Header
   - **Path**: `X-Merchant-ID`
   - **Required**: Sí

El gateway extraerá `X-Merchant-ID` del header entrante y lo agregará como `?merchant_id=valor` a la URL destino.

---

## 🔧 Configuración Detallada

### Query Parameters

#### Estructura:
```typescript
{
  name: string;           // Nombre del query param en la URL destino
  source: 'url_query' | 'body' | 'header';  // De dónde extraer el valor
  path: string;           // Ruta al valor (JSON path para body, nombre para otros)
  required?: boolean;     // Si es requerido, devuelve 400 si falta
  default?: any;          // Valor por defecto si no se encuentra
}
```

#### Ejemplos:

**1. Extraer de Query Param Entrante**:
```json
{
  "name": "transaction_id",
  "source": "url_query",
  "path": "id",
  "required": true
}
```
Request: `GET /endpoint?id=12345`
→ Target: `GET /api/endpoint?transaction_id=12345`

**2. Extraer del Body**:
```json
{
  "name": "user_id",
  "source": "body",
  "path": "data.user.id"
}
```
Request Body:
```json
{
  "data": {
    "user": {
      "id": "usr_123"
    }
  }
}
```
→ Target: `GET /api/endpoint?user_id=usr_123`

**3. Extraer de Header**:
```json
{
  "name": "api_version",
  "source": "header",
  "path": "X-API-Version",
  "default": "v1"
}
```
Request Header: `X-API-Version: v2`
→ Target: `GET /api/endpoint?api_version=v2`

---

### Proxy Mode

#### Direct Mode (Simple)
```
Cliente → Gateway → Target API → Cliente
```

- Uso: Proxy simple, webhooks, APIs públicas básicas
- La respuesta del Target API se devuelve directamente al cliente
- Más rápido y simple

#### Post-Process Mode (Avanzado)
```
Cliente → Gateway → Target API → Post-Process API → Cliente
```

- Uso: Enriquecimiento de datos, validaciones, workflows multi-paso
- El gateway llama al Target API, luego envía la respuesta a otro API para procesamiento
- El Post-Process API recibe:
  ```json
  {
    "original_request": { ... },  // Request original del cliente
    "target_response": { ... }    // Respuesta del Target API
  }
  ```
- La respuesta del Post-Process API es la que recibe el cliente final

---

## 🌐 Ejemplo Completo: MercadoPago Payments API

### Arquitectura:
```
Cliente → Public API (Gateway) → MercadoPago → Gateway → Cliente
                                      ↓
                              Internal Webhook API (opcional)
```

### Paso 1: Registrar MercadoPago API

```json
{
  "name": "MercadoPago Payments",
  "base_url": "https://api.mercadopago.com",
  "type": "external",
  "endpoints": [
    {
      "path": "/v1/payments/:id",
      "method": "GET"
    }
  ],
  "security": {
    "type": "bearer_token",
    "token": "YOUR_MP_ACCESS_TOKEN"
  }
}
```

### Paso 2: Crear Integración (o API Pública)

```json
{
  "name": "Payment Query Service",
  "integration_type": "public_proxy",
  "target_api_id": "mercadopago-api-id",
  "transform_config": {
    "query_params": [
      {
        "name": "id",
        "source": "url_query",
        "path": "payment_id",
        "required": true
      }
    ]
  },
  "proxy_mode": "direct"
}
```

### Paso 3: Consumir desde Cliente

```bash
curl -X GET \
  'https://your-gateway.supabase.co/functions/v1/api-gateway/integration-id?payment_id=123456789' \
  -H 'X-Integration-Key: pub_your_api_key'
```

**Flujo Interno**:
1. Gateway recibe `?payment_id=123456789`
2. Extrae `payment_id` y lo mapea a `:id` en el path
3. Llama a `https://api.mercadopago.com/v1/payments/123456789`
4. Agrega header `Authorization: Bearer YOUR_MP_ACCESS_TOKEN`
5. Devuelve la respuesta de MercadoPago al cliente

---

## ⚙️ Path Params vs Query Params

### Path Params
- Se reemplazan en el path de la URL
- Configuración en `path_params`
- Ejemplo: `/api/users/:id` → `/api/users/123`

### Query Params (NUEVO)
- Se agregan al final de la URL como query string
- Configuración en `transform_config.query_params`
- Ejemplo: `/api/users` → `/api/users?id=123&status=active`

**Puedes combinar ambos**:
```
Path: /api/users/:userId/orders
Query Params: ?status=paid&limit=10

Resultado: /api/users/123/orders?status=paid&limit=10
```

---

## 🔐 Seguridad

### APIs Públicas
- API Key obligatoria con prefijo `pub_`
- Header requerido: `X-Integration-Key`
- Todos los requests son logueados

### Headers Sensibles
Los siguientes headers NO se forwardean automáticamente:
- `authorization`
- `x-integration-key`
- `x-integration-id`
- `host`
- `connection`

Para pasar autenticación al Target API, usa:
- Custom Headers con valores estáticos
- Target API Security config (recomendado)

---

## 📊 Monitoring

Todos los requests a través del gateway son logueados con:
- Request completo (method, path, headers, body)
- Query params aplicados
- Response status y body
- Tiempo de respuesta
- Proxy mode usado
- Errores (si ocurrieron)

Ver logs en: **Webhooks** → Seleccionar integración → Ver logs

---

## 🚀 Mejores Prácticas

### 1. Query Params Requeridos
Marca como `required: true` los parámetros críticos para evitar llamadas inválidas.

### 2. Valores por Defecto
Usa `default` para parámetros opcionales con valores sensatos.

### 3. Path vs Query
- **Path params**: Para recursos específicos (IDs, slugs)
- **Query params**: Para filtros, paginación, opciones

### 4. Proxy Mode
- **Direct**: Para la mayoría de casos (más rápido)
- **Post-Process**: Solo cuando necesitas transformación o lógica adicional

### 5. Validación
- El gateway valida required params
- Usa Post-Process APIs para validaciones complejas

### 6. Testing
- Prueba con diferentes combinaciones de parámetros
- Verifica logs para debugging
- Usa valores por defecto para graceful degradation

---

## 🐛 Troubleshooting

### Error: "Required query parameter 'X' is missing"
**Causa**: Parámetro marcado como required no se encontró en la fuente especificada.
**Solución**:
- Verifica que el cliente envía el parámetro
- Verifica la fuente (url_query, body, header)
- Verifica el path/nombre del campo

### La URL destino no tiene los query params
**Causa**: Los query params no están configurados correctamente.
**Solución**:
- Verifica `transform_config.query_params` en la integración
- Asegúrate de que `name` y `path` están correctos
- Revisa los logs para ver qué se está enviando

### Post-Process API no recibe datos
**Causa**: `proxy_mode` no está en `post_process` o `post_process_api_id` no está configurado.
**Solución**:
- Verifica la configuración de Proxy Mode
- Asegúrate de seleccionar un Post-Process API
- El Post-Process API debe estar activo

---

## 📝 Resumen de Campos Nuevos en DB

### Tabla `integrations`:

```sql
-- Query params dinámicos
transform_config JSONB {
  query_params: [
    {
      name: string,
      source: 'url_query' | 'body' | 'header',
      path: string,
      required: boolean,
      default: any
    }
  ]
}

-- Modo de proxy
proxy_mode TEXT DEFAULT 'direct' CHECK (proxy_mode IN ('direct', 'post_process'))

-- API para post-procesamiento
post_process_api_id UUID REFERENCES apis(id)

-- Source API ahora es opcional (para public_proxy que consume APIs externas)
source_api_id UUID NULL
```

---

## 🎓 Ejercicios Prácticos

### Ejercicio 1: API de Consulta de Pagos
Crea una API pública que permita consultar el estado de pagos desde una API externa (Stripe/MercadoPago).

### Ejercicio 2: Webhook con Enriquecimiento
Configura un webhook que reciba datos, consulte tu DB, y envíe todo a Slack.

### Ejercicio 3: Proxy Multi-Header
Crea una integración que extraiga información de headers, body y query params simultáneamente.

---

Para más información, consulta:
- [PUBLIC_APIS_GUIDE.md](./PUBLIC_APIS_GUIDE.md)
- [WEBHOOK_IMPLEMENTATION_GUIDE.md](./WEBHOOK_IMPLEMENTATION_GUIDE.md)
- Documentación integrada en la aplicación
