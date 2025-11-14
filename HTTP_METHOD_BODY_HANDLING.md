# Manejo Correcto de Body según Método HTTP

## Problema Identificado

El error **"Request with GET/HEAD method cannot have body"** ocurre cuando se intenta enviar un body (cuerpo de petición) en métodos HTTP que no lo permiten según el estándar HTTP.

## Métodos HTTP y Body

### ❌ **Métodos SIN Body** (No permiten cuerpo de petición)
- **GET**: Obtener datos
- **HEAD**: Obtener headers sin body
- **DELETE**: Eliminar recursos

### ✅ **Métodos CON Body** (Permiten cuerpo de petición)
- **POST**: Crear recursos
- **PUT**: Actualizar/reemplazar recursos completos
- **PATCH**: Actualizar parcialmente recursos
- **OPTIONS**: Consultar opciones (opcional)

## Solución Implementada

### 1. **Edge Function (api-gateway)**

Ubicación: `/supabase/functions/api-gateway/index.ts`

```typescript
// GET, HEAD, and DELETE methods should not have a request body
const methodsWithoutBody = ['GET', 'HEAD', 'DELETE'];
const shouldIncludeBody = !methodsWithoutBody.includes(targetEndpoint.method.toUpperCase());

const fetchOptions: RequestInit = {
  method: targetEndpoint.method,
  headers: targetHeaders,
};

// Only include body for POST, PUT, PATCH, etc.
if (shouldIncludeBody && dataToSend && Object.keys(dataToSend).length > 0) {
  fetchOptions.body = JSON.stringify(dataToSend);
}

const targetResponse = await fetch(targetUrl, fetchOptions);
```

**Lógica implementada:**
1. Detecta el método HTTP del endpoint de destino
2. Si es GET, HEAD o DELETE → NO envía body
3. Si es POST, PUT, PATCH u otro → SÍ envía body
4. Protege contra enviar bodies vacíos

### 2. **Interfaz de Usuario (IntegrationForm)**

Ubicación: `/src/components/Integrations/IntegrationForm.tsx`

#### Indicador Visual en Endpoints

Cada endpoint de destino muestra una etiqueta "Sin body" para métodos GET/HEAD/DELETE:

```tsx
{!hasBody && (
  <span className="px-2 py-0.5 bg-amber-600/20 border border-amber-600/40 text-amber-300 rounded text-xs">
    Sin body
  </span>
)}
```

#### Alerta Informativa

Cuando se selecciona un endpoint sin body, aparece un aviso explicativo:

```tsx
⚠️ Método GET no soporta body

Los métodos GET, HEAD y DELETE no pueden incluir un body en la petición según el estándar HTTP.
Solo se enviarán los headers, query parameters y path parameters configurados.
```

## Casos de Uso

### ✅ Caso Correcto: GET a Mercado Pago

```
Endpoint: GET /v1/payments/${paymentId}
```

**Qué se envía:**
- ✅ Headers (Authorization, Content-Type)
- ✅ Path parameters (paymentId)
- ✅ Query parameters (si los hay)
- ❌ Body (automáticamente omitido)

### ✅ Caso Correcto: POST a Mercado Pago

```
Endpoint: POST /v1/payments
```

**Qué se envía:**
- ✅ Headers (Authorization, Content-Type)
- ✅ Body con datos del pago (JSON)

## Beneficios

1. **Cumplimiento con estándares HTTP**: Evita errores de protocolo
2. **Compatibilidad con APIs externas**: Funciona correctamente con Mercado Pago y otras APIs
3. **Validación automática**: El sistema previene errores sin intervención manual
4. **Transparencia**: El usuario ve claramente qué métodos permiten body
5. **Mensajes claros**: Avisos informativos ayudan a entender el comportamiento

## Pruebas Recomendadas

### Test 1: GET sin body
```bash
# Tu API Publicada (GET)
→ Mercado Pago GET /v1/payments/123
Resultado esperado: ✅ Solo headers, sin body, respuesta 200
```

### Test 2: POST con body
```bash
# Tu API Publicada (POST)
→ Mercado Pago POST /v1/payments
Body: { amount: 100, ... }
Resultado esperado: ✅ Headers + body, respuesta 201
```

### Test 3: DELETE sin body
```bash
# Tu API Publicada (DELETE)
→ API Externa DELETE /v1/resource/123
Resultado esperado: ✅ Solo headers, sin body, respuesta 204
```

## Preguntas Frecuentes

### ¿Por qué GET no puede tener body?

El estándar HTTP (RFC 7231) indica que GET es un método "seguro" para recuperar información. El body podría ser ignorado por proxies, caches y servidores intermedios, causando comportamiento inconsistente.

### ¿Qué pasa si mi API de origen envía body en GET?

El Gateway inteligentemente **omitirá el body** al reenviar la petición, enviando solo headers, query params y path params. La petición llegará correctamente a la API de destino.

### ¿Necesito configurar algo manualmente?

No. El sistema detecta automáticamente el método HTTP y maneja el body correctamente. Solo necesitas:
1. Configurar los headers necesarios
2. Configurar los path parameters si los hay
3. El resto es automático

## Notas Técnicas

- La validación ocurre en el Edge Function antes de hacer la petición
- No afecta los logs (se registran todos los datos recibidos)
- Compatible con todas las integraciones existentes
- No requiere migraciones de base de datos
