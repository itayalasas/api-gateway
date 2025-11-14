import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, CheckCircle, ArrowRight, Zap, Lock as LockIcon, Layers } from 'lucide-react';

export function LoginForm() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { redirectToExternalAuth } = useAuth();

  const handleExternalLogin = () => {
    setLoading(true);
    redirectToExternalAuth();
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-16 flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-300 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <img src="/flowbridge-logo.svg" alt="FlowBridge" className="h-10 mb-16" />

          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Bienvenido de vuelta
          </h1>
          <p className="text-xl text-emerald-50 leading-relaxed max-w-lg">
            Accede a tu cuenta y gestiona tus APIs, integraciones y operaciones de forma segura y eficiente.
          </p>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/30">
              <LockIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-xl mb-2">Seguridad Avanzada</h3>
              <p className="text-emerald-50 text-base leading-relaxed">
                Autenticación empresarial con los más altos estándares de seguridad
              </p>
            </div>
          </div>

          <div className="flex items-start gap-5">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/30">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-xl mb-2">Acceso Rápido</h3>
              <p className="text-emerald-50 text-base leading-relaxed">
                Inicia sesión en segundos con tu cuenta empresarial
              </p>
            </div>
          </div>

          <div className="flex items-start gap-5">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/30">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-xl mb-2">Gestión Unificada</h3>
              <p className="text-emerald-50 text-base leading-relaxed">
                Administra APIs, integraciones y webhooks desde un solo lugar
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-emerald-100">
          © 2024 FlowBridge. Todos los derechos reservados.
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <img src="/flowbridge-logo.svg" alt="FlowBridge" className="h-10 mx-auto" />
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 lg:p-10">
            <div className="flex justify-center mb-8">
              <img src="/flowbridge-icon.svg" alt="FlowBridge" className="w-20 h-20" />
            </div>

            <h2 className="text-3xl font-bold text-slate-900 text-center mb-3">
              Iniciar Sesión
            </h2>
            <p className="text-slate-600 text-center mb-8">
              Usa tu sistema de autenticación empresarial para acceder de forma segura
            </p>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <button
              onClick={handleExternalLogin}
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-400 disabled:to-slate-400 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:cursor-not-allowed group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LockIcon className="w-5 h-5" />
                  <span>Iniciar Sesión con AuthSystem</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="mt-8 pt-8 border-t-2 border-slate-100">
              <p className="text-center text-sm text-slate-600">
                Al iniciar sesión serás redirigido al sistema de autenticación empresarial
              </p>
            </div>

            <div className="mt-8">
              <p className="text-xs text-slate-500 font-semibold mb-4 uppercase tracking-wide">
                ¿Por qué usar autenticación empresarial?
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-600 leading-relaxed">Máxima seguridad con encriptación avanzada</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-600 leading-relaxed">Acceso unificado a todos tus servicios</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-600 leading-relaxed">Gestión centralizada de permisos y roles</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-600 leading-relaxed">Soporte técnico especializado 24/7</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
