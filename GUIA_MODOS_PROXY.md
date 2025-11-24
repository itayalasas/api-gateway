# 🚀 Guía Simple: Modos de Operación en FlowBridge

FlowBridge tiene **3 formas diferentes** de trabajar. Aquí te explico cuál usar según lo que necesites.

---

## 🎯 Modo 1: **Directo** (El más común)

### ¿Cuándo lo uso?
Cuando **recibes datos** de alguien (un cliente, un webhook, etc.) y necesitas **enviarlos a tu API**.

### ¿Cómo funciona?
```
Tu Cliente/Webhook → [FlowBridge] → Tu API → Respuesta al Cliente
                     (recibe datos)   (envía datos)
```

### Ejemplos de la vida real:
- ✅ Recibes un pago de Stripe y lo envías a tu sistema de facturación
- ✅ Alguien llena un formulario y los datos van a tu base de datos
- ✅ Recibes un webhook de WhatsApp y lo guardas en tu sistema

### ¿Qué hace FlowBridge por ti?
- Maneja la autenticación
- Registra todo en los logs
- Convierte los datos si es necesario

---

## 🎯 Modo 2: **Con Procesamiento** (Para casos especiales)

### ¿Cuándo lo uso?
Cuando necesitas **transformar o enriquecer** la respuesta de una API antes de devolverla.

### ¿Cómo funciona?
```
Cliente → [FlowBridge] → API 1 → [FlowBridge recibe respuesta]
                                        ↓
                        API 2 (procesa) ← [envía para procesar]
                                        ↓
                           Cliente ← [respuesta final procesada]
```

### Ejemplos de la vida real:
- ✅ Consultas el clima en inglés → Lo traduces a español → Lo devuelves traducido
- ✅ Obtienes datos de un usuario → Le agregas sus permisos desde tu BD → Devuelves todo junto
- ✅ Llamas una API → Validas que los datos sean correctos → Los guardas en cache

---

## 🎯 Modo 3: **Obtener y Enviar** (Para sincronizaciones automáticas) ⭐

### ¿Cuándo lo uso?
Cuando **NO tienes datos para enviar**, pero necesitas:
1. **Obtener** datos de una API (Sistema A)
2. **Enviar** esos datos a otra API (Sistema B)
3. Hacerlo **automáticamente** con un cron o manualmente

### ¿Cómo funciona?
```
Tú o un Cron → [FlowBridge] → Sistema A (GET) → obtiene usuarios
                                     ↓
                          Sistema B (POST) ← [envía los usuarios]
                                     ↓
                        Respuesta ← [te dice si funcionó]
```

### Ejemplos de la vida real:
- ✅ **Tu caso**: Cada hora, traer usuarios de ContaEmpresa → Sincronizarlos en tu sistema
- ✅ Cada día, obtener ventas del día → Enviarlas al sistema de contabilidad
- ✅ Cada 5 minutos, verificar estado de pedidos → Actualizar tu base de datos

### ¿Qué hace FlowBridge por ti?
1. Va al Sistema A y obtiene los datos (maneja la autenticación automáticamente)
2. Toma esos datos y los envía al Sistema B (también maneja su autenticación)
3. Te devuelve la respuesta final
4. Registra TODO en los logs para que veas qué pasó

---

## 📊 Tabla Comparativa Simple

| | Directo | Con Procesamiento | Obtener y Enviar |
|---|---------|-------------------|------------------|
| **¿Necesitas enviar datos?** | ✅ Sí | ✅ Sí | ❌ No |
| **¿Transforma respuestas?** | ❌ No | ✅ Sí | ❌ No |
| **¿Obtiene datos de otra API primero?** | ❌ No | ❌ No | ✅ Sí |
| **¿Sirve para cron/automatizar?** | ⚠️ Regular | ⚠️ Regular | ✅ Perfecto |
| **APIs involucradas** | 1 | 2 | 2 |

---

## 🔧 Cómo Configurarlo

### En la Interfaz Web (Recomendado)

1. Ve a **"Integraciones"** en el menú
2. Crea o edita una integración
3. Verás una sección llamada **"Modo de Operación"** con 3 opciones:

```
○ Directo (Simple)
  Para recibir datos y enviarlos a tu API

○ Con Procesamiento (Avanzado)
  Para transformar respuestas antes de devolverlas

○ Obtener y Enviar (Modo Sincronización)
  Para sincronizaciones automáticas entre sistemas
```

4. Selecciona el que necesites según tu caso
5. Guarda la integración

---

## 💡 Guía de Decisión Rápida

**Pregúntate esto:**

### 1️⃣ ¿Alguien te envía datos?
- **SÍ** → Usa **"Directo"** o **"Con Procesamiento"**
- **NO** → Usa **"Obtener y Enviar"**

### 2️⃣ ¿Necesitas transformar la respuesta?
- **SÍ** → Usa **"Con Procesamiento"**
- **NO** → Usa **"Directo"**

### 3️⃣ ¿Necesitas sincronizar datos automáticamente?
- **SÍ** → Usa **"Obtener y Enviar"**
- **NO** → Usa **"Directo"**

---

## 🎓 Casos de Uso Reales Explicados

### Caso 1: Webhook de Pagos (Directo)
```
Stripe me envía un pago
   ↓
FlowBridge lo recibe
   ↓
Lo envía a mi sistema de facturación
   ↓
Responde "OK" a Stripe
```
**Modo:** Directo

---

### Caso 2: Consultar Clima Traducido (Con Procesamiento)
```
Cliente pide clima de Madrid
   ↓
FlowBridge llama a API de clima (en inglés)
   ↓
FlowBridge envía respuesta a API de traducción
   ↓
Devuelve clima traducido al español
```
**Modo:** Con Procesamiento

---

### Caso 3: Sincronizar Usuarios Automáticamente (Obtener y Enviar)
```
Cron se ejecuta cada hora
   ↓
FlowBridge va a ContaEmpresa y obtiene usuarios (GET)
   ↓
FlowBridge envía esos usuarios a mi sistema (POST)
   ↓
Mi sistema recibe y guarda los usuarios
```
**Modo:** Obtener y Enviar

---

## ⚙️ Para Usuarios Avanzados

### Cambiar el modo manualmente en SQL:

```sql
-- Ver el modo actual
SELECT name, proxy_mode
FROM integrations
WHERE name = 'Nombre de tu integración';

-- Cambiar a "Directo"
UPDATE integrations
SET proxy_mode = 'direct'
WHERE id = 'id-de-tu-integracion';

-- Cambiar a "Con Procesamiento"
UPDATE integrations
SET proxy_mode = 'post_process',
    post_process_api_id = 'id-de-api-procesadora'
WHERE id = 'id-de-tu-integracion';

-- Cambiar a "Obtener y Enviar"
UPDATE integrations
SET proxy_mode = 'fetch_and_forward'
WHERE id = 'id-de-tu-integracion';
```

---

## ❓ Preguntas Frecuentes

### P: ¿Puedo cambiar el modo después de crear la integración?
**R:** Sí, puedes cambiar el modo cuando quieras. Las integraciones son flexibles.

### P: ¿Todas mis integraciones usan el mismo modo?
**R:** No, cada integración puede tener su propio modo. Son independientes.

### P: ¿El modo "Obtener y Enviar" funciona sin que yo envíe datos?
**R:** Exacto. Solo llamas al Gateway y él hace todo: obtiene de un lado y envía al otro.

### P: ¿Qué pasa si no selecciono un modo?
**R:** Por defecto se usa "Directo", que es el más común.

### P: ¿Puedo ver qué está pasando en cada paso?
**R:** Sí, todos los modos registran logs completos. Ve a la sección "Webhooks" para verlos.

---

## 🎯 Resumen en 3 Líneas

1. **Directo** = Recibes datos → Los envías → Listo (90% de los casos)
2. **Con Procesamiento** = Llamas API → Procesas respuesta → Devuelves resultado (casos especiales)
3. **Obtener y Enviar** = Traes de un lado → Envías al otro → Automático (sincronizaciones)

---

## 📞 ¿Necesitas Ayuda?

Si aún tienes dudas:
1. Mira los logs en la sección "Webhooks"
2. Revisa los ejemplos de arriba
3. Empieza con modo "Directo" que es el más simple

¡Éxito con tus integraciones! 🚀
