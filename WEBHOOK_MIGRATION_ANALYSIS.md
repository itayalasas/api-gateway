# Análisis: Migración de Webhooks a Sistema de Integraciones

## 🎯 Objetivo
Migrar el webhook `notify-order-webhook` a nuestro sistema centralizado de integraciones para gestionar todas las notificaciones y conexiones desde un único panel.

---

## 📊 Situación Actual

### Webhook Existente: notify-order-webhook
- **Propósito**: Envía notificaciones de órdenes del sistema DogCatify a CRM externos
- **Trigger**: Database triggers en la tabla `orders`
- **Características**:
  - Secret Key: `Kzdr7C4eF9IS4EIgmH8LARdwWrvH4jCBMDOTM1SHofZNdDUHpiFEYH3WhRWx`
  - Headers personalizados: `X-DogCatiFy-Signature`, `X-DogCatiFy-Event`
  - 4 eventos: `order.created`, `order.updated`, `order.cancelled`, `order.completed`
  - Reintentos: 3 intentos con backoff exponencial
  - Filtros: Excluye órdenes gratuitas (payment_method='free' o total_amount=0)

### Limitaciones del Enfoque Actual
1. ❌ **Gestión dispersa**: Cada webhook es una edge function independiente
2. ❌ **Sin UI**: No hay interfaz para configurar/modificar webhooks
3. ❌ **Sin visibilidad**: Logs limitados, difícil debugging
4. ❌ **No escalable**: Agregar webhooks requiere escribir código
5. ❌ **Mantenimiento complejo**: Cambios requieren deployments
6. ❌ **Sin filtros dinámicos**: Lógica de exclusión hardcodeada

---

## ✅ Solución: Sistema de Integraciones

### Arquitectura Propuesta

```
┌─────────────────┐
│  DogCatify DB   │
│   (orders)      │
└────────┬────────┘
         │ trigger
         ▼
┌─────────────────┐
│  Edge Function  │  ← Nuevo: webhook-processor
│  (Procesador)   │     - Lee de DB
└────────┬────────┘     - Aplica filtros
         │              - Envia a gateway
         ▼
┌─────────────────┐
│  API Gateway    │  ← Existente
│  (Integración)  │     - Routing
└────────┬────────┘     - Auth
         │              - Logging
         ▼              - Reintentos
┌─────────────────┐
│   CRM Externo   │
│   (Webhook)     │
└─────────────────┘
```

### Componentes Necesarios

#### 1. **Nueva Tabla: webhook_triggers**
```sql
CREATE TABLE webhook_triggers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id uuid REFERENCES integrations(id) ON DELETE CASCADE,
  source_table text NOT NULL,           -- ej: 'orders'
  event_type text NOT NULL,             -- ej: 'INSERT', 'UPDATE', 'DELETE'
  filter_config jsonb,                  -- Filtros personalizados
  transform_config jsonb,               -- Transformación de datos
  retry_config jsonb,                   -- Configuración de reintentos
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

**Ejemplo de filter_config:**
```json
{
  "exclude": {
    "payment_method": ["free"],
    "total_amount": 0
  }
}
```

**Ejemplo de retry_config:**
```json
{
  "max_attempts": 3,
  "backoff_type": "exponential",
  "initial_delay_ms": 1000
}
```

#### 2. **Nueva Edge Function: webhook-processor**
- Reemplaza `notify-order-webhook`
- Genérica: Funciona para cualquier tabla/evento
- Lee configuración de `webhook_triggers`
- Aplica filtros dinámicos
- Envía a través del API Gateway existente

#### 3. **Extensión del API Gateway**
Agregar soporte para:
- Headers personalizados por integración
- Firma HMAC configurable
- Eventos tipados (X-Event-Type header)

#### 4. **Nueva Tabla: integration_headers**
```sql
CREATE TABLE integration_headers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id uuid REFERENCES integrations(id) ON DELETE CASCADE,
  header_name text NOT NULL,
  header_value text NOT NULL,
  is_secret boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

---

## 🔄 Plan de Migración

### Fase 1: Preparación de Infraestructura (2-3 horas)
1. ✅ Crear tabla `webhook_triggers`
2. ✅ Crear tabla `integration_headers`
3. ✅ Actualizar tipos en database.types.ts
4. ✅ Crear UI para configurar webhook triggers

### Fase 2: Desarrollo del Procesador (3-4 horas)
1. ✅ Crear edge function `webhook-processor`
   - Genérico para cualquier tabla
   - Lee configuración de BD
   - Aplica filtros dinámicos
   - Maneja reintentos
2. ✅ Extender API Gateway para headers personalizados
3. ✅ Agregar soporte para firmas HMAC

### Fase 3: Configuración en UI (2-3 horas)
1. ✅ Panel para crear "Webhook Triggers"
2. ✅ Configurar filtros visuales (sin código)
3. ✅ Configurar headers personalizados
4. ✅ Test de integración desde UI

### Fase 4: Migración del Webhook Actual (1-2 horas)
1. ✅ Crear integración en UI para CRM
2. ✅ Configurar endpoint del CRM
3. ✅ Agregar headers: X-DogCatiFy-Signature, X-DogCatiFy-Event
4. ✅ Configurar filtros de órdenes gratuitas
5. ✅ Configurar reintentos (3 attempts, exponential)
6. ✅ Testing paralelo (ambos sistemas)
7. ✅ Desactivar webhook antiguo
8. ✅ Eliminar edge function antigua

### Fase 5: Testing & Monitoreo (1 hora)
1. ✅ Pruebas end-to-end
2. ✅ Verificar logs en tiempo real
3. ✅ Validar firmas HMAC
4. ✅ Probar reintentos

---

## 💡 Ventajas del Nuevo Sistema

### Para Usuarios
✅ **Sin código**: Todo configurable desde UI
✅ **Visibilidad total**: Logs en tiempo real de cada webhook
✅ **Debugging fácil**: Ver requests/responses completos
✅ **Filtros dinámicos**: Cambiar condiciones sin redeploy
✅ **Gestión centralizada**: Todos los webhooks en un lugar
✅ **Pruebas rápidas**: Test desde UI antes de activar

### Para Desarrolladores
✅ **Código genérico**: Un procesador para todos los webhooks
✅ **Menos mantenimiento**: Configuración en BD, no código
✅ **Escalable**: Agregar webhooks sin escribir funciones
✅ **Versionado**: Cambios trackeados en BD
✅ **Rollback fácil**: Desactivar/activar desde UI

---

## 🎨 Experiencia de Usuario

### Crear Webhook desde UI:

**Paso 1: Crear API del CRM**
- Nombre: "CRM Webhooks"
- Base URL: "https://crm.cliente.com"
- Auth: API Key / Bearer Token

**Paso 2: Crear Endpoint**
- Path: "/webhooks/orders"
- Método: POST
- Headers personalizados:
  - X-DogCatiFy-Signature: [auto-generado con HMAC]
  - X-DogCatiFy-Event: order.{event_type}

**Paso 3: Crear Integración**
- Origen: DogCatify Orders (interno)
- Destino: CRM Webhooks
- Endpoint: /webhooks/orders

**Paso 4: Configurar Trigger**
- Tabla: orders
- Eventos: INSERT, UPDATE
- Filtros:
  - ❌ payment_method != 'free'
  - ❌ total_amount > 0
- Reintentos: 3 attempts, exponential backoff

**Paso 5: Activar y Monitorear**
- Ver logs en tiempo real
- Gráficas de éxito/fallo
- Alertas de errores

---

## 🔐 Seguridad

### Actual (Webhook Individual)
- Secret key hardcodeada en código
- Difícil rotar keys
- Sin auditoría de cambios

### Nueva (Sistema Integrado)
- ✅ Keys en base de datos encriptada
- ✅ Rotación de keys desde UI
- ✅ Auditoría completa (quién, cuándo, qué cambió)
- ✅ RLS: Solo owner ve sus webhooks
- ✅ API keys por integración
- ✅ HMAC signatures configurables

---

## 📈 Métricas y Monitoreo

### Dashboard de Webhooks
- Total de webhooks activos
- Tasa de éxito/fallo por webhook
- Tiempo promedio de respuesta
- Volumen de eventos por hora/día
- Top 5 errores más comunes

### Alertas
- Email/Slack cuando webhook falla 5 veces seguidas
- Notificación cuando endpoint destino está down
- Alerta de latencia alta (>2 segundos)

---

## 🚀 Próximos Pasos Recomendados

### Inmediato (Esta Semana)
1. ✅ Crear tablas de BD (webhook_triggers, integration_headers)
2. ✅ UI básica para configurar triggers
3. ✅ Edge function webhook-processor genérico

### Corto Plazo (2 Semanas)
1. ✅ Migrar notify-order-webhook al nuevo sistema
2. ✅ Agregar 2-3 webhooks más del sistema
3. ✅ Dashboard de métricas

### Mediano Plazo (1 Mes)
1. ✅ Sistema de alertas
2. ✅ Bulk operations (pausar/reanudar múltiples webhooks)
3. ✅ Template de webhooks comunes (Stripe, Slack, etc)

---

## ❓ Preguntas Clave

### 1. ¿Cómo se triggerea el webhook-processor?
**Respuesta**: Database trigger en la tabla origen (orders) que inserta en una cola, luego el procesador lee de la cola.

### 2. ¿Se pueden tener múltiples CRMs escuchando la misma tabla?
**Respuesta**: ¡Sí! Cada CRM es una integración independiente con su propio trigger.

### 3. ¿Qué pasa si el CRM está down?
**Respuesta**: El sistema reintenta según configuración (ej: 3 veces con backoff). Los logs muestran todos los intentos.

### 4. ¿Se puede agregar lógica de transformación de datos?
**Respuesta**: Sí, el campo `transform_config` permite mapear campos origen→destino y aplicar transformaciones básicas.

### 5. ¿Cómo se garantiza el orden de los eventos?
**Respuesta**: Cada evento tiene timestamp. Se pueden configurar como "ordered" para procesar secuencialmente.

---

## 📝 Conclusión

La migración del webhook a nuestro sistema de integraciones es **totalmente viable** y ofrece **beneficios significativos**:

✅ **Gestión centralizada** de todos los webhooks
✅ **Sin código** para agregar/modificar webhooks
✅ **Visibilidad completa** con logs en tiempo real
✅ **Escalabilidad** ilimitada
✅ **Mantenimiento reducido** drásticamente

**Recomendación**: Proceder con la migración siguiendo el plan de 5 fases (estimado 10-15 horas total).

**ROI Esperado**:
- Ahorro de 80% del tiempo en agregar nuevos webhooks
- Reducción de 90% en tiempo de debugging
- 100% de visibilidad vs 20% actual
