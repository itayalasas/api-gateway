import React, { useState } from 'react';
import { Book, ChevronRight, ChevronDown, Code, Zap, Database, Webhook, Settings, Key, ArrowRight, Copy, CheckCheck } from 'lucide-react';

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'json' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-slate-950 rounded-lg overflow-hidden border border-slate-700">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700">
        <span className="text-xs text-slate-400 uppercase">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <CheckCheck className="w-3 h-3" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copiar
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm text-slate-300">{code}</code>
      </pre>
    </div>
  );
};

export default function Documentation() {
  const [expandedSection, setExpandedSection] = useState<string>('intro');

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? '' : sectionId);
  };

  const sections: Section[] = [
    {
      id: 'intro',
      title: 'Introducción a FlowBridge',
      icon: <Book className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">¿Qué es FlowBridge?</h3>
          <p className="text-slate-300 leading-relaxed">
            FlowBridge es una plataforma profesional de gestión de API Gateway e integraciones que te permite:
          </p>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <span>Conectar múltiples APIs sin escribir código complejo</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <span>Transformar datos entre diferentes sistemas de forma visual</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <span>Gestionar autenticación y seguridad centralizada</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <span>Monitorear el tráfico en tiempo real con logs detallados</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <span>Integrar bases de datos directamente con tus webhooks</span>
            </li>
          </ul>

          <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4 mt-6">
            <h4 className="text-blue-300 font-semibold mb-2">Casos de uso comunes:</h4>
            <ul className="space-y-1 text-blue-200 text-sm">
              <li>• Conectar tu app móvil con servicios de terceros (Firebase, Stripe, Twilio)</li>
              <li>• Recibir webhooks y enriquecer datos con información de tu base de datos</li>
              <li>• Transformar datos entre formatos incompatibles</li>
              <li>• Centralizar autenticación para múltiples microservicios</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'apis',
      title: 'Crear y Gestionar APIs',
      icon: <Settings className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-3">1. Crear una API</h3>
            <p className="text-slate-300 mb-4">
              Las APIs representan los servicios externos con los que quieres conectarte.
            </p>

            <div className="bg-slate-900 rounded-lg p-4 mb-4">
              <h4 className="text-white font-semibold mb-3">Pasos:</h4>
              <ol className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">1</span>
                  <span>Ve a la sección "APIs" en el menú lateral</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">2</span>
                  <span>Haz clic en "Add API" (botón azul en la esquina superior derecha)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">3</span>
                  <span>Completa los datos básicos (nombre, URL base, descripción)</span>
                </li>
              </ol>
            </div>

            <div className="space-y-4">
              <h4 className="text-white font-semibold">Ejemplo: Configurar Firebase Cloud Messaging</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-2">Nombre de la API</p>
                  <p className="text-white">Firebase Cloud Messaging</p>
                </div>
                <div className="bg-slate-900 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-2">URL Base</p>
                  <p className="text-white">https://fcm.googleapis.com</p>
                </div>
                <div className="bg-slate-900 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-2">Tipo</p>
                  <p className="text-white">external (API externa)</p>
                </div>
                <div className="bg-slate-900 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-2">Descripción</p>
                  <p className="text-white">Servicio de notificaciones push de Google</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-3">2. Agregar Endpoints</h3>
            <p className="text-slate-300 mb-4">
              Los endpoints son las rutas específicas de tu API que quieres usar. Después de crear la API,
              haz clic en "Edit" para agregar endpoints.
            </p>

            <div className="space-y-4">
              <h4 className="text-white font-semibold">Ejemplo: Endpoint de envío FCM</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-2">Nombre</p>
                  <p className="text-white">Send Message</p>
                </div>
                <div className="bg-slate-900 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-2">Método</p>
                  <p className="text-white">POST</p>
                </div>
                <div className="bg-slate-900 rounded-lg p-4 md:col-span-2">
                  <p className="text-slate-400 text-sm mb-2">Ruta</p>
                  <p className="text-white font-mono text-sm">/v1/projects/$&#123;projectId&#125;/messages:send</p>
                  <p className="text-slate-500 text-xs mt-1">Nota: Usa $&#123;&#125; para parámetros dinámicos</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-3">3. Configurar Seguridad</h3>
            <p className="text-slate-300 mb-4">
              Define cómo autenticarte con la API externa. Haz clic en "Configure Security" en la página de edición.
            </p>

            <div className="space-y-4">
              <div className="bg-slate-900 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3">Tipos de autenticación disponibles:</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="bg-green-600/20 p-2 rounded">
                      <Key className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Bearer Token</p>
                      <p className="text-slate-400 text-sm">Para APIs que usan tokens de acceso en el header Authorization</p>
                      <CodeBlock
                        language="http"
                        code="Authorization: Bearer ya29.c.c0ASRK0G..."
                      />
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-blue-600/20 p-2 rounded">
                      <Key className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">API Key</p>
                      <p className="text-slate-400 text-sm">Para APIs con claves en headers personalizados</p>
                      <CodeBlock
                        language="http"
                        code="X-API-Key: sk_live_12345abcde"
                      />
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-purple-600/20 p-2 rounded">
                      <Key className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Basic Auth</p>
                      <p className="text-slate-400 text-sm">Usuario y contraseña codificados en Base64</p>
                      <CodeBlock
                        language="http"
                        code="Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ="
                      />
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-orange-600/20 p-2 rounded">
                      <Key className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Custom Headers</p>
                      <p className="text-slate-400 text-sm">Headers personalizados múltiples</p>
                      <CodeBlock
                        language="json"
                        code={`{
  "X-Custom-Header": "valor1",
  "X-Another-Header": "valor2"
}`}
                      />
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'integrations',
      title: 'Crear Integraciones',
      icon: <Zap className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-3">¿Qué es una Integración?</h3>
            <p className="text-slate-300 mb-4">
              Una integración conecta dos puntos: una API origen (o webhook) con una API destino,
              permitiéndote transformar datos y aplicar lógica personalizada. La integración genera
              una URL única de gateway que puedes usar en tu aplicación.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-3">Tipos de Integraciones</h3>

            <div className="space-y-4">
              <div className="bg-slate-900 rounded-lg p-5 border-l-4 border-blue-500">
                <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-400" />
                  API a API
                </h4>
                <p className="text-slate-300 text-sm mb-3">
                  Conecta dos APIs. Cuando tu app llama al gateway, este transforma los datos y llama a la API destino.
                  Útil para proxy de APIs, transformación de datos y centralización de autenticación.
                </p>
                <div className="bg-slate-950 rounded p-3 text-xs text-slate-400">
                  <p>Tu App → Gateway FlowBridge → API Externa (Firebase, Stripe, etc.)</p>
                </div>
                <div className="mt-3 text-sm text-slate-400">
                  <strong className="text-white">Ejemplo de uso:</strong> Tu app móvil envía datos al gateway,
                  el gateway agrega autenticación OAuth2 y reenvía a la API de Firebase.
                </div>
              </div>

              <div className="bg-slate-900 rounded-lg p-5 border-l-4 border-green-500">
                <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <Webhook className="w-5 h-5 text-green-400" />
                  Webhook
                </h4>
                <p className="text-slate-300 text-sm mb-3">
                  Recibe webhooks de servicios externos y procesa los datos. Puede consultar tu base de datos
                  Supabase para enriquecer la información antes de enviarla a otra API.
                </p>
                <div className="bg-slate-950 rounded p-3 text-xs text-slate-400">
                  <p>Servicio Externo → Gateway FlowBridge (+ Base de Datos) → Otra API</p>
                </div>
                <div className="mt-3 text-sm text-slate-400">
                  <strong className="text-white">Ejemplo de uso:</strong> Stripe envía un webhook de pago exitoso,
                  el gateway busca el usuario en tu BD y envía una notificación push personalizada via Firebase.
                </div>
              </div>

              <div className="bg-slate-900 rounded-lg p-5 border-l-4 border-purple-500">
                <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-400" />
                  Consulta de Base de Datos
                </h4>
                <p className="text-slate-300 text-sm mb-3">
                  Solo consulta tu base de datos Supabase y retorna los resultados. No llama a ninguna API externa.
                  Perfecto para crear APIs REST simples sobre tu base de datos.
                </p>
                <div className="bg-slate-950 rounded p-3 text-xs text-slate-400">
                  <p>Cliente → Gateway FlowBridge → Base de Datos → Respuesta JSON</p>
                </div>
                <div className="mt-3 text-sm text-slate-400">
                  <strong className="text-white">Ejemplo de uso:</strong> Exponer un endpoint que retorna
                  productos filtrados por categoría desde tu base de datos.
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-3">Crear una Integración Paso a Paso</h3>

            <div className="bg-slate-900 rounded-lg p-4 mb-4">
              <h4 className="text-white font-semibold mb-3">Pasos básicos:</h4>
              <ol className="space-y-3 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">1</span>
                  <div>
                    <p className="font-medium text-white">Ve a "Integraciones"</p>
                    <p className="text-sm text-slate-400">En el menú lateral, selecciona Integraciones</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">2</span>
                  <div>
                    <p className="font-medium text-white">Haz clic en "New Integration"</p>
                    <p className="text-sm text-slate-400">Se abrirá el formulario de configuración</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">3</span>
                  <div>
                    <p className="font-medium text-white">Completa la información básica</p>
                    <p className="text-sm text-slate-400">Nombre, descripción y tipo de integración</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">4</span>
                  <div>
                    <p className="font-medium text-white">Selecciona las APIs</p>
                    <p className="text-sm text-slate-400">API origen (opcional) y API destino con su endpoint</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">5</span>
                  <div>
                    <p className="font-medium text-white">Configura opciones avanzadas</p>
                    <p className="text-sm text-slate-400">Headers, parámetros de ruta, acceso a BD, etc.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">6</span>
                  <div>
                    <p className="font-medium text-white">Guarda la integración</p>
                    <p className="text-sm text-slate-400">Se generará automáticamente una API Key y URL del gateway</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'headers',
      title: 'Configurar Headers',
      icon: <Code className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-3">Sección 3: Headers Personalizados</h3>
            <p className="text-slate-300 mb-4">
              Los headers personalizados te permiten agregar o transformar headers que se enviarán a la API destino.
              Soportan templates dinámicos para extraer valores de la petición entrante.
            </p>

            <div className="space-y-4">
              <div className="bg-slate-900 rounded-lg p-5">
                <h4 className="text-white font-semibold mb-3">Sintaxis de Templates</h4>

                <div className="space-y-4">
                  <div>
                    <p className="text-blue-300 font-medium mb-2">1. Extraer valores de headers entrantes</p>
                    <p className="text-slate-400 text-sm mb-2">Usa <code className="text-purple-400">$&#123;header.nombre&#125;</code></p>
                    <CodeBlock
                      language="config"
                      code={`Nombre del Header: Authorization
Valor: \${header.authorization}

Cuando recibes: authorization: Bearer ya29.xxx
Se envía: Authorization: Bearer ya29.xxx`}
                    />
                  </div>

                  <div>
                    <p className="text-blue-300 font-medium mb-2">2. Extraer valores del body</p>
                    <p className="text-slate-400 text-sm mb-2">Usa <code className="text-purple-400">$&#123;body.campo&#125;</code></p>
                    <CodeBlock
                      language="config"
                      code={`Nombre del Header: X-User-Token
Valor: Bearer \${body.token}

Body recibido: {"token": "abc123"}
Se envía: X-User-Token: Bearer abc123`}
                    />
                  </div>

                  <div>
                    <p className="text-blue-300 font-medium mb-2">3. Valores fijos</p>
                    <CodeBlock
                      language="config"
                      code={`Nombre del Header: X-API-Key
Valor: sk_live_12345

Se envía siempre: X-API-Key: sk_live_12345`}
                    />
                  </div>

                  <div>
                    <p className="text-blue-300 font-medium mb-2">4. Valores anidados del body</p>
                    <p className="text-slate-400 text-sm mb-2">Usa notación de punto para acceder a objetos anidados</p>
                    <CodeBlock
                      language="config"
                      code={`Nombre del Header: X-User-Id
Valor: \${body.user.id}

Body recibido: {"user": {"id": "123", "name": "Juan"}}
Se envía: X-User-Id: 123`}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-4">
                <h4 className="text-green-300 font-semibold mb-2">Ejemplo Práctico: Firebase FCM</h4>
                <p className="text-green-200 text-sm mb-3">
                  Firebase requiere un header Authorization con un token OAuth2. Tu app envía el token
                  en minúscula "authorization", pero Firebase espera "Authorization" con mayúscula inicial.
                </p>
                <div className="space-y-2">
                  <p className="text-white text-sm font-medium">Solución con Header Personalizado:</p>
                  <div className="bg-slate-950 rounded p-3">
                    <p className="text-xs text-slate-400 mb-2">Configuración:</p>
                    <p className="text-white text-sm font-mono">
                      Authorization → $&#123;header.authorization&#125;
                    </p>
                  </div>
                  <p className="text-slate-300 text-xs mt-2">
                    Esto toma el valor del header entrante "authorization" y lo reenvía como "Authorization"
                    con la capitalización correcta que Firebase espera.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-3">Sección 4: Headers a Reenviar</h3>
            <p className="text-slate-300 mb-4">
              Especifica qué headers de la petición origen deben reenviarse automáticamente a la API destino
              con sus valores originales (sin transformación).
            </p>

            <div className="bg-slate-900 rounded-lg p-5">
              <h4 className="text-white font-semibold mb-3">Headers comunes para reenviar:</h4>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-white">Content-Type</p>
                    <p className="text-sm text-slate-400">Mantiene el tipo de contenido original (application/json, etc.)</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-white">Accept</p>
                    <p className="text-sm text-slate-400">Especifica el formato de respuesta deseado</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-white">User-Agent</p>
                    <p className="text-sm text-slate-400">Identifica el cliente que hace la petición</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-white">Accept-Language</p>
                    <p className="text-sm text-slate-400">Idioma preferido del cliente</p>
                  </div>
                </li>
              </ul>

              <div className="bg-orange-600/10 border border-orange-600/30 rounded-lg p-3 mt-4">
                <p className="text-xs text-orange-300">
                  <strong>Nota de Seguridad:</strong> Los headers de autenticación del gateway
                  (authorization, x-integration-key) NO se reenvían automáticamente por seguridad.
                  Si necesitas reenviar un header de autenticación, usa Headers Personalizados con templates.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-3">Diferencia entre Headers Personalizados y a Reenviar</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 rounded-lg p-4 border-l-4 border-purple-500">
                <h4 className="text-white font-semibold mb-2">Headers Personalizados</h4>
                <ul className="space-y-1 text-slate-300 text-sm">
                  <li>• Soportan templates dinámicos</li>
                  <li>• Pueden transformar valores</li>
                  <li>• Permiten valores fijos</li>
                  <li>• Pueden cambiar nombres de headers</li>
                  <li>• Ejemplo: Tomar "authorization" y enviarlo como "Authorization"</li>
                </ul>
              </div>

              <div className="bg-slate-900 rounded-lg p-4 border-l-4 border-green-500">
                <h4 className="text-white font-semibold mb-2">Headers a Reenviar</h4>
                <ul className="space-y-1 text-slate-300 text-sm">
                  <li>• Reenvío directo sin cambios</li>
                  <li>• Mismo nombre y valor</li>
                  <li>• No soportan templates</li>
                  <li>• Más simple y rápido</li>
                  <li>• Ejemplo: Reenviar "Content-Type" tal cual</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'path-params',
      title: 'Parámetros de Ruta',
      icon: <Code className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-3">Sección 5: Parámetros de Ruta Dinámicos</h3>
            <p className="text-slate-300 mb-4">
              Los parámetros de ruta te permiten insertar valores dinámicos en la URL del endpoint destino.
              Puedes extraer estos valores del body, query string o headers de la petición entrante.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-3">Formatos Soportados</h3>

            <div className="space-y-4">
              <div className="bg-slate-900 rounded-lg p-5">
                <h4 className="text-white font-semibold mb-3">1. Formato con dos puntos (:param)</h4>
                <p className="text-slate-400 text-sm mb-3">
                  Común en REST APIs estilo Express.js. Se usa cuando el endpoint tiene parámetros con :
                </p>
                <CodeBlock
                  language="url"
                  code={`Endpoint configurado: /users/:userId/posts/:postId

Configuración de Parámetros:
- Nombre del parámetro: userId
  Origen: body
  Campo/Ruta: user.id
  Formato: :

- Nombre del parámetro: postId
  Origen: body
  Campo/Ruta: post.id
  Formato: :`}
                />
                <p className="text-slate-400 text-sm mt-3">
                  Body de ejemplo: <code className="text-blue-400">&#123;"user": &#123;"id": "123"&#125;, "post": &#123;"id": "456"&#125;&#125;</code>
                </p>
                <p className="text-green-400 text-sm">
                  URL resultante: <code>/users/123/posts/456</code>
                </p>
              </div>

              <div className="bg-slate-900 rounded-lg p-5">
                <h4 className="text-white font-semibold mb-3">2. Formato con llaves ($&#123;param&#125;)</h4>
                <p className="text-slate-400 text-sm mb-3">
                  Común en APIs como Firebase, Google Cloud. Se usa cuando el endpoint tiene parámetros con $&#123;&#125;
                </p>
                <CodeBlock
                  language="url"
                  code={`Endpoint configurado: /v1/projects/\${projectId}/messages:send

Configuración de Parámetros:
- Nombre del parámetro: projectId
  Origen: body
  Campo/Ruta: projectId
  Formato: \${}`}
                />
                <p className="text-slate-400 text-sm mt-3">
                  Body de ejemplo: <code className="text-blue-400">&#123;"projectId": "app-mascota-7db30", "message": &#123;...&#125;&#125;</code>
                </p>
                <p className="text-green-400 text-sm">
                  URL resultante: <code>/v1/projects/app-mascota-7db30/messages:send</code>
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-3">Orígenes de Datos Disponibles</h3>

            <div className="bg-slate-900 rounded-lg p-5">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-600/20 p-2 rounded">
                    <Code className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium mb-1">Body (Cuerpo de la petición)</p>
                    <p className="text-slate-400 text-sm mb-2">Extrae valores del JSON enviado en el body</p>
                    <CodeBlock
                      language="example"
                      code={`Configuración: user.id
Body: {"user": {"id": "123", "name": "Juan"}}
Valor extraído: "123"

Soporta rutas anidadas con punto (.)`}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-green-600/20 p-2 rounded">
                    <Code className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium mb-1">Query (Parámetros de URL)</p>
                    <p className="text-slate-400 text-sm mb-2">Extrae valores de los query params en la URL</p>
                    <CodeBlock
                      language="example"
                      code={`Configuración: userId
URL llamada: /endpoint?userId=123&status=active
Valor extraído: "123"

El nombre debe coincidir con el query param`}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-purple-600/20 p-2 rounded">
                    <Code className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium mb-1">Header (Cabeceras HTTP)</p>
                    <p className="text-slate-400 text-sm mb-2">Extrae valores de los headers de la petición</p>
                    <CodeBlock
                      language="example"
                      code={`Configuración: x-tenant-id
Headers recibidos: X-Tenant-Id: tenant-123
Valor extraído: "tenant-123"

No es case-sensitive`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-4">
            <h4 className="text-green-300 font-semibold mb-2">Ejemplo Completo: Firebase FCM</h4>
            <p className="text-green-200 text-sm mb-3">
              Firebase requiere el project ID en la URL. Así es como configurarlo:
            </p>
            <CodeBlock
              language="config"
              code={`1. En la API Firebase, endpoint destino:
   /v1/projects/\${projectId}/messages:send

2. En la Integración, Sección 5 - Parámetros de Ruta:
   - Nombre del parámetro: projectId
   - Origen: body
   - Campo/Ruta: projectId
   - Formato: \${}

3. Desde tu app, envía este body:
{
  "projectId": "app-mascota-7db30",
  "message": {
    "token": "device-token-123",
    "notification": {
      "title": "Hola",
      "body": "Mensaje de prueba"
    }
  }
}

4. El gateway construirá esta URL:
   https://fcm.googleapis.com/v1/projects/app-mascota-7db30/messages:send`}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'webhooks',
      title: 'Webhooks y Base de Datos',
      icon: <Database className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-3">¿Qué son los Webhooks con Base de Datos?</h3>
            <p className="text-slate-300 mb-4">
              Los webhooks te permiten recibir notificaciones de servicios externos (como Stripe, PayPal, etc.).
              FlowBridge puede enriquecer estos datos consultando tu base de datos Supabase antes de procesarlos
              o enviarlos a otra API.
            </p>

            <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
              <h4 className="text-blue-300 font-semibold mb-2">Casos de uso:</h4>
              <ul className="space-y-1 text-blue-200 text-sm">
                <li>• Recibir webhook de Stripe sobre pago exitoso, buscar usuario en BD, enviar notificación push</li>
                <li>• Webhook de GitHub sobre nuevo commit, consultar proyecto en BD, enviar a Slack</li>
                <li>• Webhook de formulario, validar datos contra BD, enviar email personalizado</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-3">Configurar un Webhook</h3>

            <div className="bg-slate-900 rounded-lg p-4 mb-4">
              <h4 className="text-white font-semibold mb-3">Pasos:</h4>
              <ol className="space-y-3 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">1</span>
                  <div>
                    <p className="font-medium text-white">Crea una nueva integración tipo "Webhook"</p>
                    <p className="text-sm text-slate-400">En Integraciones → New Integration → Tipo: Webhook</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">2</span>
                  <div>
                    <p className="font-medium text-white">No selecciones API origen</p>
                    <p className="text-sm text-slate-400">El webhook lo llama un servicio externo directamente</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">3</span>
                  <div>
                    <p className="font-medium text-white">Selecciona API destino (opcional)</p>
                    <p className="text-sm text-slate-400">Si quieres enviar datos a otra API después de procesarlos</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">4</span>
                  <div>
                    <p className="font-medium text-white">Activa "Permitir Acceso a Base de Datos"</p>
                    <p className="text-sm text-slate-400">Esto habilita la consulta a Supabase</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">5</span>
                  <div>
                    <p className="font-medium text-white">Configura la consulta de base de datos</p>
                    <p className="text-sm text-slate-400">Define qué tabla, filtros, ordenamiento, etc.</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-3">Configurar Consulta de Base de Datos</h3>

            <div className="space-y-4">
              <div className="bg-slate-900 rounded-lg p-5">
                <h4 className="text-white font-semibold mb-3">Campos de Configuración:</h4>

                <div className="space-y-4">
                  <div className="bg-slate-950 rounded p-4">
                    <p className="text-white font-medium mb-2">Tabla</p>
                    <p className="text-slate-400 text-sm mb-2">Nombre de la tabla en Supabase que quieres consultar</p>
                    <CodeBlock
                      language="text"
                      code="Ejemplos: users, orders, products, customers"
                    />
                  </div>

                  <div className="bg-slate-950 rounded p-4">
                    <p className="text-white font-medium mb-2">Columnas a Seleccionar (Select)</p>
                    <p className="text-slate-400 text-sm mb-2">Qué columnas quieres que retorne la consulta</p>
                    <CodeBlock
                      language="text"
                      code={`* → Todas las columnas
id, name, email → Solo estas columnas
id, name, profile:profiles(avatar, bio) → Con relaciones`}
                    />
                  </div>

                  <div className="bg-slate-950 rounded p-4">
                    <p className="text-white font-medium mb-2">Filtros (JSON)</p>
                    <p className="text-slate-400 text-sm mb-2">
                      Condiciones para filtrar registros. Usa <code className="text-purple-400">$&#123;incoming.campo&#125;</code> para
                      valores del webhook
                    </p>
                    <CodeBlock
                      language="json"
                      code={`{
  "stripe_customer_id": "\${incoming.data.customer}",
  "status": "active",
  "verified": true
}

El gateway reemplazará \${incoming.data.customer} con el valor
del webhook en la ruta data.customer`}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950 rounded p-4">
                      <p className="text-white font-medium mb-2">Ordenar Por</p>
                      <p className="text-slate-400 text-sm mb-2">Campo y dirección de ordenamiento</p>
                      <CodeBlock
                        language="text"
                        code={`created_at desc
price asc
name desc`}
                      />
                    </div>

                    <div className="bg-slate-950 rounded p-4">
                      <p className="text-white font-medium mb-2">Límite</p>
                      <p className="text-slate-400 text-sm mb-2">Máximo de registros a retornar</p>
                      <CodeBlock
                        language="text"
                        code={`1 → Un solo registro
10 → Hasta 10
100 → Hasta 100`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-3">Estrategias de Merge</h3>
            <p className="text-slate-300 mb-4">
              Define cómo combinar los datos del webhook con los resultados de la base de datos.
            </p>

            <div className="space-y-4">
              <div className="bg-slate-900 rounded-lg p-4 border-l-4 border-blue-500">
                <h4 className="text-white font-semibold mb-2">Combinar (Combine) - Por defecto</h4>
                <p className="text-slate-300 text-sm mb-3">
                  Mantiene todos los datos del webhook y agrega los resultados de BD en un campo "db_results"
                </p>
                <CodeBlock
                  language="json"
                  code={`Webhook de entrada:
{"userId": "123", "amount": 5000, "currency": "USD"}

Datos de BD:
[{"name": "Juan Pérez", "email": "juan@example.com", "fcm_token": "xxx"}]

Resultado final enviado a API destino:
{
  "userId": "123",
  "amount": 5000,
  "currency": "USD",
  "db_results": [
    {"name": "Juan Pérez", "email": "juan@example.com", "fcm_token": "xxx"}
  ]
}`}
                />
              </div>

              <div className="bg-slate-900 rounded-lg p-4 border-l-4 border-green-500">
                <h4 className="text-white font-semibold mb-2">Solo Base de Datos (DB Only)</h4>
                <p className="text-slate-300 text-sm mb-3">
                  Descarta los datos del webhook y solo envía los resultados de la base de datos
                </p>
                <CodeBlock
                  language="json"
                  code={`Webhook de entrada:
{"userId": "123", "amount": 5000}

Datos de BD:
[{"name": "Juan", "email": "juan@example.com"}]

Resultado final:
[
  {"name": "Juan", "email": "juan@example.com"}
]`}
                />
              </div>

              <div className="bg-slate-900 rounded-lg p-4 border-l-4 border-purple-500">
                <h4 className="text-white font-semibold mb-2">Reemplazar (Replace)</h4>
                <p className="text-slate-300 text-sm mb-3">
                  Mantiene solo los datos originales del webhook (útil con mapeo de datos manual)
                </p>
                <CodeBlock
                  language="json"
                  code={`Webhook de entrada:
{"userId": "123", "amount": 5000}

Resultado final:
{"userId": "123", "amount": 5000"}

Útil cuando usas el mapeo de datos para extraer campos específicos de la BD`}
                />
              </div>
            </div>
          </div>

          <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-4">
            <h4 className="text-green-300 font-semibold mb-2">Ejemplo Completo: Stripe + Firebase</h4>
            <CodeBlock
              language="scenario"
              code={`ESCENARIO:
Stripe envía webhook cuando un pago es exitoso.
Queremos buscar el usuario en nuestra BD y enviarle notificación push.

CONFIGURACIÓN:

1. Nueva Integración:
   - Tipo: Webhook
   - API Destino: Firebase Cloud Messaging

2. Base de Datos:
   - Permitir acceso: Sí
   - Tabla: users
   - Select: id, name, email, fcm_token
   - Filtros: {"stripe_customer_id": "\${incoming.data.customer}"}
   - Límite: 1
   - Estrategia: Combine

3. Headers Personalizados:
   - Authorization → \${header.authorization}

4. URL del Webhook generada:
   https://tu-proyecto.supabase.co/functions/v1/api-gateway/webhook-id

5. Configura esta URL en el dashboard de Stripe

FLUJO:
1. Cliente paga → Stripe envía webhook al gateway
2. Gateway busca usuario por stripe_customer_id en tabla users
3. Gateway combina datos: webhook + datos del usuario
4. Gateway envía a Firebase con token FCM del usuario
5. Usuario recibe notificación push personalizada`}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'usage',
      title: 'Usar el Gateway',
      icon: <Zap className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-3">URL del Gateway</h3>
            <p className="text-slate-300 mb-4">
              Cada integración genera una URL única del gateway. Esta URL la usas en tu aplicación
              en lugar de llamar directamente a la API externa.
            </p>

            <div className="bg-slate-900 rounded-lg p-5">
              <p className="text-slate-400 text-sm mb-2">Formato de la URL:</p>
              <CodeBlock
                language="url"
                code="https://[TU-PROYECTO].supabase.co/functions/v1/api-gateway/[INTEGRATION-ID]"
              />

              <div className="mt-4 bg-blue-600/10 border border-blue-600/30 rounded p-3">
                <p className="text-blue-300 text-sm">
                  <strong>Tip:</strong> Encuentra la URL completa en la página de "Details" de cada integración
                  (botón de ojo 👁️ en la lista de integraciones)
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-3">Autenticación</h3>
            <p className="text-slate-300 mb-4">
              Hay dos formas de autenticarte con el gateway:
            </p>

            <div className="space-y-4">
              <div className="bg-slate-900 rounded-lg p-5">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Key className="w-5 h-5 text-green-400" />
                  Opción 1: Integration API Key (Recomendado)
                </h4>
                <p className="text-slate-300 text-sm mb-3">
                  Cada integración genera automáticamente una API key única y segura. Esta es la forma
                  más simple y segura de autenticarte.
                </p>
                <CodeBlock
                  language="javascript"
                  code={`// Ejemplo en JavaScript/TypeScript
const gatewayUrl = 'https://tu-proyecto.supabase.co/functions/v1/api-gateway/abc-123';

const response = await fetch(gatewayUrl, {
  method: 'POST',
  headers: {
    'X-Integration-Key': 'int_b0009562b2f8091143508c3603abb199...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    // Tu data aquí
  })
});`}
                />
                <div className="mt-3 bg-green-600/10 border border-green-600/30 rounded p-3">
                  <p className="text-green-300 text-xs">
                    <strong>Ventaja:</strong> No necesitas gestionar tokens de Supabase. La API key es específica
                    de la integración y puede ser regenerada en cualquier momento.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 rounded-lg p-5">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-400" />
                  Opción 2: Supabase Anon Key
                </h4>
                <p className="text-slate-300 text-sm mb-3">
                  Si ya usas Supabase en tu aplicación y tienes el anon key, puedes usarlo para autenticarte:
                </p>
                <CodeBlock
                  language="javascript"
                  code={`// Ejemplo con Supabase Client
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tu-proyecto.supabase.co',
  'TU_ANON_KEY'
);

const gatewayUrl = 'https://tu-proyecto.supabase.co/functions/v1/api-gateway/abc-123';

const response = await fetch(gatewayUrl, {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${supabase.auth.getSession().access_token}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    // Tu data aquí
  })
});`}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-3">Ejemplo Completo de Uso</h3>

            <div className="bg-slate-900 rounded-lg p-5">
              <h4 className="text-white font-semibold mb-3">Enviar Notificación Push via Firebase FCM</h4>

              <CodeBlock
                language="javascript"
                code={`// 1. Configuración
const GATEWAY_URL = 'https://zksjuwmycbjcoqcgqhff.supabase.co/functions/v1/api-gateway/abc-123-def';
const INTEGRATION_KEY = 'int_b0009562b2f8091143508c3603abb199...';

// 2. Datos a enviar
const notificationData = {
  projectId: 'app-mascota-7db30',  // Para path params
  message: {
    token: 'device-fcm-token-from-user-device',
    notification: {
      title: '¡Nueva oferta disponible!',
      body: 'Tienes un descuento del 50% en tu próxima compra'
    },
    data: {
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
      screen: 'offers',
      offerId: '12345'
    },
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'high_importance_channel'
      }
    }
  }
};

// 3. Hacer la petición
async function sendPushNotification() {
  try {
    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'X-Integration-Key': INTEGRATION_KEY,
        'Content-Type': 'application/json',
        // Si tu integración usa headers dinámicos, agrégalos aquí
        'authorization': 'Bearer ya29.c.c0ASRK0G...'  // Token OAuth2 de Google
      },
      body: JSON.stringify(notificationData)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error del gateway:', error);
      throw new Error(error.error || 'Error desconocido');
    }

    const result = await response.json();
    console.log('Notificación enviada exitosamente:', result);

    // Resultado incluye headers del gateway:
    // - X-Request-Id: ID único de la petición
    // - X-Response-Time: Tiempo de respuesta en ms

    return result;

  } catch (error) {
    console.error('Error al enviar notificación:', error);
    throw error;
  }
}

// 4. Usar la función
sendPushNotification()
  .then(result => console.log('Success!', result))
  .catch(error => console.error('Failed!', error));`}
              />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-3">Monitorear Requests</h3>
            <p className="text-slate-300 mb-4">
              Todos los requests al gateway se registran automáticamente. Puedes verlos en tiempo real.
            </p>

            <div className="bg-slate-900 rounded-lg p-5">
              <h4 className="text-white font-semibold mb-3">Ver los Logs:</h4>
              <ol className="space-y-2 text-slate-300 text-sm mb-4">
                <li className="flex items-start gap-2">
                  <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span>
                  <span>Ve a la sección "Integraciones"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span>
                  <span>Haz clic en el botón "View Logs" (ícono de lista) de tu integración</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">3</span>
                  <span>Se actualizan en tiempo real cada 2 segundos</span>
                </li>
              </ol>

              <h4 className="text-white font-semibold mb-3">Información Capturada en los Logs:</h4>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Request ID:</strong> Identificador único de cada petición</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Timestamp:</strong> Fecha y hora exacta</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Método HTTP:</strong> GET, POST, PUT, DELETE, etc.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Status Code:</strong> 200 (éxito), 400 (error cliente), 500 (error servidor)</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Response Time:</strong> Tiempo de respuesta en milisegundos</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Headers:</strong> Headers de entrada enviados al gateway</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Request Body:</strong> Datos enviados en el body</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Response Body:</strong> Respuesta de la API destino</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Error Message:</strong> Mensaje de error si la petición falló</span>
                </li>
              </ul>

              <div className="mt-4 bg-blue-600/10 border border-blue-600/30 rounded p-3">
                <p className="text-blue-300 text-xs">
                  <strong>Tip:</strong> Usa los filtros para buscar por status code, fecha o texto en el body.
                  Puedes expandir cada log para ver todos los detalles.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-3">Debugging y Troubleshooting</h3>

            <div className="space-y-4">
              <div className="bg-slate-900 rounded-lg p-4 border-l-4 border-red-500">
                <h4 className="text-white font-semibold mb-2">Error 401 - Unauthorized</h4>
                <p className="text-slate-300 text-sm mb-2">
                  Tu autenticación no es válida. Verifica:
                </p>
                <ul className="space-y-1 text-slate-400 text-sm">
                  <li>• Estás usando el header correcto: X-Integration-Key o Authorization</li>
                  <li>• La API key es correcta (cópiala de nuevo del detalle de la integración)</li>
                  <li>• El header se está enviando en la petición</li>
                </ul>
              </div>

              <div className="bg-slate-900 rounded-lg p-4 border-l-4 border-orange-500">
                <h4 className="text-white font-semibold mb-2">Error 404 - Integration not found</h4>
                <p className="text-slate-300 text-sm mb-2">
                  La URL del gateway no es correcta. Verifica:
                </p>
                <ul className="space-y-1 text-slate-400 text-sm">
                  <li>• El ID de integración en la URL es correcto</li>
                  <li>• La integración existe y está activa</li>
                  <li>• No hay typos en la URL</li>
                </ul>
              </div>

              <div className="bg-slate-900 rounded-lg p-4 border-l-4 border-yellow-500">
                <h4 className="text-white font-semibold mb-2">Error 500 - Target API configuration not found</h4>
                <p className="text-slate-300 text-sm mb-2">
                  La configuración de la integración está incompleta. Verifica:
                </p>
                <ul className="space-y-1 text-slate-400 text-sm">
                  <li>• La API destino está configurada</li>
                  <li>• El endpoint destino está seleccionado</li>
                  <li>• La API destino tiene una URL base válida</li>
                </ul>
              </div>

              <div className="bg-slate-900 rounded-lg p-4 border-l-4 border-purple-500">
                <h4 className="text-white font-semibold mb-2">Error 502 - Failed to proxy request</h4>
                <p className="text-slate-300 text-sm mb-2">
                  El gateway no pudo conectarse a la API destino. Verifica:
                </p>
                <ul className="space-y-1 text-slate-400 text-sm">
                  <li>• La URL base de la API destino es correcta y accesible</li>
                  <li>• La autenticación de la API destino está bien configurada</li>
                  <li>• El formato del body es el esperado por la API destino</li>
                  <li>• Revisa el Response Body en los logs para más detalles</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-600 p-3 rounded-xl">
              <Book className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Documentación FlowBridge</h1>
              <p className="text-slate-400">Guía completa para usar la plataforma</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-750 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-blue-400">
                    {section.icon}
                  </div>
                  <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                </div>
                {expandedSection === section.id ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
              </button>

              {expandedSection === section.id && (
                <div className="px-6 py-6 border-t border-slate-700 bg-slate-850">
                  {section.content}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-600/30 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-3">¿Necesitas Ayuda?</h3>
          <p className="text-slate-300 mb-4">
            Si tienes preguntas o necesitas asistencia adicional, revisa los logs de tus integraciones
            para información detallada sobre cada petición.
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="bg-slate-900 rounded-lg px-4 py-2">
              <p className="text-slate-400 text-sm">Logs en Tiempo Real</p>
              <p className="text-white">Integraciones → View Logs</p>
            </div>
            <div className="bg-slate-900 rounded-lg px-4 py-2">
              <p className="text-slate-400 text-sm">Monitoreo</p>
              <p className="text-white">Monitoreo → Health Status</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
