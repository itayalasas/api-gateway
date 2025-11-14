import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function AuthCallback() {
  const { exchangeAuthCode } = useAuth();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');

      if (!code) {
        setError('No se recibió el código de autenticación');
        return;
      }

      if (state !== 'authenticated') {
        setError('Estado de autenticación inválido');
        return;
      }

      try {
        await exchangeAuthCode(code);
        window.location.href = '/';
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al autenticar');
      }
    };

    handleCallback();
  }, [exchangeAuthCode]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-12 max-w-md w-full text-center">
        {error ? (
          <div>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Error de Autenticación</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-xl transition-all"
            >
              Volver al inicio
            </button>
          </div>
        ) : (
          <div>
            <Loader2 className="w-16 h-16 text-emerald-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Autenticando...</h2>
            <p className="text-slate-600">Por favor espera mientras procesamos tu inicio de sesión</p>
          </div>
        )}
      </div>
    </div>
  );
}
