# Guía de APIs Públicas

## ¿Qué son las APIs Públicas?

Las APIs Públicas son endpoints que expones para que **terceros externos** puedan consumir tus servicios internos de forma segura y controlada. Funcionan como un **proxy público** que redirige las peticiones a tus APIs internas.

## Casos de Uso

### 1. Exponer servicios a clientes externos
Permite que tus clientes consuman tus APIs sin acceso directo a tus sistemas internos.

### 2. Integración con partners
Facilita integraciones B2B proporcionando una API pública con autenticación mediante API Key.

### 3. APIs para aplicaciones móviles/web de terceros
Permite que aplicaciones externas consuman tus servicios de forma controlada.

### 4. Webhooks inversos
Expón endpoints públicos que terceros pueden llamar para enviar datos a tus sistemas.

---

## Arquitectura

```
[Cliente Externo]
    ↓
[API Pública] (Gateway FlowBridge)
    ↓ (Valida API Key)
    ↓ (Proxy/Forward)
    ↓
[API Interna] (Tu servicio real)
```

### Ventajas:

✅ **Seguridad**: API Key requerida para autenticación
✅ **Logging**: Todas las peticiones se registran automáticamente
✅ **Control**: Activa/desactiva APIs sin cambiar código
✅ **Monitoreo**: Visualiza peticiones en tiempo real
✅ **Aislamiento**: Tu API interna no se expone directamente

---

## Cómo Crear una API Pública

### Paso 1: Preparar tu API Interna

Antes de crear una API pública, necesitas tener al menos una **API interna registrada** en FlowBridge:

1. Ve a la sección **"APIs"**
2. Crea o asegúrate de tener una API de tipo **"Published"**
3. Verifica que esté **activa**

Ejemplo de API interna:
- **Nombre**: Internal Payment Service
- **Tipo**: Published
- **Base URL**: `https://api.tuempresa.com/payments`

### Paso 2: Crear la API Pública

1. Ve a la sección **"APIs Públicas"** en el menú lateral
2. Haz clic en **"Nueva API Pública"**
3. Completa el formulario:
   - **Nombre**: Nombre descriptivo (ej. "Public Payment API")
   - **Descripción**: Propósito de esta API (ej. "API pública para procesar pagos")
   - **API Interna (Destino)**: Selecciona tu API interna

4. Haz clic en **"Crear API Pública"**

### Paso 3: Obtener Credenciales

Una vez creada, se generarán automáticamente:

#### URL Pública
```
https://[tu-gateway].supabase.co/functions/v1/api-gateway/[integration-id]
```

#### API Key
```
pub_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6...
```

Copia ambos valores y compártelos con el cliente externo que consumirá tu API.

---

## Cómo Consumir la API Pública

### Autenticación Requerida

Todas las peticiones DEBEN incluir el header de autenticación:

```http
X-Integration-Key: pub_[tu-api-key]
```

### Ejemplo de Petición (cURL)

```bash
curl -X POST https://[tu-gateway].supabase.co/functions/v1/api-gateway/[integration-id] \
  -H "Content-Type: application/json" \
  -H "X-Integration-Key: pub_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6..." \
  -d '{
    "amount": 100.00,
    "currency": "USD",
    "customer_id": "cust_12345"
  }'
```

### Ejemplo de Petición (JavaScript/Fetch)

```javascript
const response = await fetch(
  'https://[tu-gateway].supabase.co/functions/v1/api-gateway/[integration-id]',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Integration-Key': 'pub_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...'
    },
    body: JSON.stringify({
      amount: 100.00,
      currency: 'USD',
      customer_id: 'cust_12345'
    })
  }
);

const data = await response.json();
console.log(data);
```

### Ejemplo de Petición (Python)

```python
import requests

url = 'https://[tu-gateway].supabase.co/functions/v1/api-gateway/[integration-id]'
headers = {
    'Content-Type': 'application/json',
    'X-Integration-Key': 'pub_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...'
}
payload = {
    'amount': 100.00,
    'currency': 'USD',
    'customer_id': 'cust_12345'
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

---

## Respuestas Esperadas

### Éxito (200)

```json
{
  "success": true,
  "data": {
    "payment_id": "pay_xyz789",
    "status": "completed"
  }
}
```

### Error de Autenticación (401)

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid or missing API key"
}
```

### Error de la API Interna (500)

```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "Error al procesar la petición en el servicio interno"
}
```

---

## Gestión de APIs Públicas

### Activar/Desactivar

Puedes activar o desactivar una API pública sin eliminarla:

1. Ve a **"APIs Públicas"**
2. Encuentra tu API
3. Haz clic en el botón de **encendido/apagado**

Cuando está **inactiva**, todas las peticiones serán rechazadas con un error 403.

### Eliminar

Para eliminar permanentemente una API pública:

1. Ve a **"APIs Públicas"**
2. Encuentra tu API
3. Haz clic en el botón de **basura** (🗑️)
4. Confirma la eliminación

⚠️ **Advertencia**: Esta acción no se puede deshacer. Asegúrate de que ningún cliente externo está usando esta API antes de eliminarla.

---

## Monitoreo y Logs

### Ver Logs en Tiempo Real

Todas las peticiones a tus APIs públicas se registran automáticamente. Para verlos:

1. Ve a la sección **"Webhooks"**
2. Selecciona tu integración tipo "public_proxy"
3. Observa los logs en tiempo real:
   - Método HTTP
   - Path
   - Request body
   - Response body
   - Tiempo de respuesta
   - Estado HTTP

### Filtrar Logs

Puedes filtrar logs por:
- **Búsqueda**: Buscar en path, request o response
- **Estado HTTP**: 2xx, 4xx, 5xx
- **Método**: GET, POST, PUT, DELETE
- **Fecha**: Rango de fechas

---

## Seguridad

### API Keys

Las API Keys generadas tienen el prefijo `pub_` seguido de 64 caracteres hexadecimales aleatorios:

```
pub_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6g7h8
```

### Regenerar API Key

Si una API Key ha sido comprometida:

1. Ve a **"APIs Públicas"**
2. Encuentra tu API
3. Copia la nueva API Key
4. Notifica a todos los clientes para que actualicen sus credenciales

⚠️ **Importante**: La API Key anterior dejará de funcionar inmediatamente.

### Mejores Prácticas

1. ✅ **Nunca compartas API Keys públicamente** (repositorios, Slack, etc.)
2. ✅ **Usa variables de entorno** para almacenar API Keys en tus aplicaciones
3. ✅ **Rota las API Keys periódicamente** (cada 90 días recomendado)
4. ✅ **Monitorea logs sospechosos** (demasiadas peticiones fallidas)
5. ✅ **Desactiva APIs no utilizadas**

---

## Rate Limiting

Por ahora, FlowBridge **no implementa rate limiting** automático. Si necesitas limitar peticiones:

1. Implementa rate limiting en tu **API interna**
2. Monitorea logs y bloquea IPs manualmente si detectas abuso
3. Considera usar un servicio de API Gateway externo si necesitas rate limiting avanzado

---

## Troubleshooting

### Error: "Invalid or missing API key"

**Causa**: El header `X-Integration-Key` no está presente o es incorrecto.

**Solución**:
- Verifica que estás incluyendo el header correcto
- Copia la API Key exactamente como aparece (sin espacios extras)
- Asegúrate de que la API pública esté **activa**

### Error: "API not found"

**Causa**: El ID de integración en la URL es incorrecto o la API fue eliminada.

**Solución**:
- Verifica que la URL esté correcta
- Verifica que la API pública aún existe en FlowBridge

### Error: "Target API is not active"

**Causa**: La API interna (destino) está inactiva.

**Solución**:
- Ve a la sección **"APIs"**
- Encuentra la API interna
- Actívala

### Peticiones muy lentas

**Causa**: La API interna tarda mucho en responder.

**Solución**:
- Optimiza tu API interna
- Verifica los logs para ver el tiempo de respuesta
- Considera implementar caché en tu API interna

---

## Diferencia entre APIs Públicas e Integraciones

| Característica | API Pública | Integración |
|----------------|-------------|-------------|
| **Propósito** | Exponer servicios a terceros | Conectar dos sistemas internos |
| **Dirección** | Uni-direccional (entrada) | Bi-direccional |
| **Autenticación** | API Key pública | Puede tener múltiples métodos |
| **Consumidor** | Clientes externos | Servicios internos |
| **Configuración** | Simple (solo destino) | Compleja (source + target + transformaciones) |

---

## Limitaciones Actuales

1. ❌ **No hay rate limiting** automático
2. ❌ **No hay transformación de datos** (lo que entra, sale igual al destino)
3. ❌ **No hay versionado de APIs**
4. ❌ **No hay documentación auto-generada** (Swagger/OpenAPI)

Estas features pueden agregarse en futuras versiones.

---

## Ejemplos de Uso Real

### Caso 1: API de Pagos para E-commerce

**Escenario**: Tienes una tienda online y quieres permitir que aplicaciones de terceros procesen pagos.

**Implementación**:
1. API Interna: `https://internal.tutienda.com/payments`
2. API Pública: Genera en FlowBridge
3. Los terceros usan la URL pública con su API Key única
4. Monitoreas todas las transacciones en FlowBridge

### Caso 2: Webhook Inverso para Notificaciones

**Escenario**: Quieres que tus partners te envíen notificaciones cuando ocurra algo en su sistema.

**Implementación**:
1. API Interna: `https://internal.tusistema.com/notifications`
2. API Pública: Genera en FlowBridge
3. Compartes la URL pública con cada partner con su API Key única
4. Recibes y procesas notificaciones en tu sistema interno

### Caso 3: API para Aplicaciones Móviles

**Escenario**: Desarrollas apps móviles que necesitan consumir tus servicios.

**Implementación**:
1. API Interna: `https://api.tuapp.com/v1/users`
2. API Pública: Genera en FlowBridge
3. Tu app móvil usa la URL pública
4. Puedes desactivar la API si detectas una versión vieja de la app

---

## Conclusión

Las APIs Públicas en FlowBridge te permiten exponer tus servicios internos de forma segura y controlada, con logging automático y gestión centralizada de API Keys.

Para cualquier duda o problema, revisa la documentación principal o contacta al equipo de soporte.
