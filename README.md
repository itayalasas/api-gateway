# FlowBridge - API Gateway & Integration Platform

![FlowBridge](./public/flowbridge-logo.svg)

FlowBridge es una plataforma profesional de gestión de API Gateway e integraciones que permite conectar, transformar y monitorear APIs sin escribir código complejo.

## 🚀 Características Principales

### 1. Gestión de APIs
- Registra APIs internas y externas
- Configuración de autenticación (API Key, Bearer Token, Basic Auth)
- Gestión de endpoints y métodos HTTP
- Activar/desactivar APIs sin eliminarlas

### 2. Integraciones
- Conecta múltiples APIs sin código
- Transformación de datos visual
- Webhooks bidireccionales con acceso a base de datos
- Integraciones API-to-API directas
- Configuración de headers personalizados
- Forward de headers específicos
- Parámetros dinámicos en paths

### 3. APIs Públicas (NUEVO) 🌐
- Expón tus APIs internas para consumo de terceros
- Generación automática de URL pública y API Key
- Autenticación mediante `X-Integration-Key` header
- Proxy seguro a tus servicios internos
- Gestión completa (activar/desactivar/eliminar)
- Logging automático de todas las peticiones

### 4. Monitoreo en Tiempo Real
- Logs detallados de cada petición
- Request y Response body completos
- Tiempos de respuesta
- Estados HTTP
- Filtros avanzados de búsqueda
- Streaming de logs en tiempo real

### 5. Seguridad
- API Keys únicas por integración
- Row Level Security (RLS) en Supabase
- Autenticación externa (sin auth.users)
- Control de acceso a nivel de usuario

## 📦 Tecnologías

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Icons**: Lucide React
- **Database**: PostgreSQL con Supabase

## 🛠️ Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd flowbridge

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build
```

## 📝 Variables de Entorno Requeridas

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

## 🗄️ Estructura de Base de Datos

### Tablas Principales

- **apis** - Registro de APIs internas y externas
- **api_endpoints** - Endpoints específicos de cada API
- **api_security** - Configuración de autenticación
- **integrations** - Conexiones entre APIs
- **integration_source_endpoints** - Múltiples endpoints source para una integración
- **request_logs** - Logs de todas las peticiones
- **system_config** - Configuración del sistema (gateway URL)
- **health_checks** - Estado de salud de las APIs

## 🌐 APIs Públicas - Guía Rápida

### Crear una API Pública

1. Ve a **APIs Públicas** en el menú
2. Haz clic en **Nueva API Pública**
3. Selecciona tu API interna destino
4. Se genera automáticamente:
   - URL pública única
   - API Key con prefijo `pub_`

### Consumir una API Pública

```javascript
const response = await fetch(
  'https://[gateway].supabase.co/functions/v1/api-gateway/[id]',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Integration-Key': 'pub_abc123...'
    },
    body: JSON.stringify({ data: 'example' })
  }
);
```

**Documentación completa**: Ver [PUBLIC_APIS_GUIDE.md](./PUBLIC_APIS_GUIDE.md)

## 📖 Documentación Adicional

- [PUBLIC_APIS_GUIDE.md](./PUBLIC_APIS_GUIDE.md) - Guía completa de APIs Públicas
- [WEBHOOK_IMPLEMENTATION_GUIDE.md](./WEBHOOK_IMPLEMENTATION_GUIDE.md) - Webhooks con DB
- [IMPORT_GUIDE.md](./IMPORT_GUIDE.md) - Importar/Exportar configuración
- [REALTIME_OPTIMIZATION.md](./REALTIME_OPTIMIZATION.md) - Optimización de logs

## 🎯 Casos de Uso

### 1. Exponer Servicios a Clientes B2B
Crea una API pública que redirija a tu servicio interno de pagos, inventario, etc.

### 2. Webhooks Inteligentes
Recibe webhooks de terceros, consulta tu base de datos, enriquece los datos y envía a tu API destino.

### 3. Microservicios
Conecta múltiples microservicios con transformación de datos y autenticación centralizada.

### 4. Integración con Partners
Proporciona APIs públicas con API Keys únicas para cada partner comercial.

## 🔐 Seguridad

- ✅ API Keys únicas generadas criptográficamente
- ✅ Prefijo `pub_` para APIs públicas
- ✅ Headers de autenticación requeridos
- ✅ RLS deshabilitado para autenticación externa
- ✅ Validación de usuario en cada petición

## 📊 Monitoreo

Todas las integraciones y APIs públicas registran automáticamente:
- Request method y path
- Request body completo
- Response status y body
- Tiempo de respuesta
- Headers
- Errores

Accede a los logs desde:
- **Webhooks** → Selecciona integración → Ver logs
- Filtros por estado, método, fecha, búsqueda

## 🚦 Estado del Proyecto

✅ APIs - Gestión completa
✅ Integraciones - API-to-API y Webhooks
✅ APIs Públicas - Para terceros
✅ Monitoreo - Logs en tiempo real
✅ Webhooks con DB - Queries y transformaciones
✅ Documentación - Integrada en la app

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo licencia MIT.

## 🆘 Soporte

Para preguntas y soporte:
- Revisa la documentación integrada en la app
- Consulta los logs para información detallada
- Revisa las guías en la carpeta del proyecto

---

Desarrollado con ❤️ usando React, TypeScript y Supabase
