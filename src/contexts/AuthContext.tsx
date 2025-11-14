import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface ExternalUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  externalUser: ExternalUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  exchangeAuthCode: (code: string) => Promise<void>;
  redirectToExternalAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [externalUser, setExternalUser] = useState<ExternalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext - Initializing...');
    const storedUser = localStorage.getItem('external_user');
    const storedToken = localStorage.getItem('external_access_token');

    console.log('AuthContext - storedUser:', storedUser);
    console.log('AuthContext - storedToken:', storedToken ? 'exists' : 'null');

    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      console.log('AuthContext - Setting externalUser:', parsedUser);
      setExternalUser(parsedUser);
      setLoading(false);
    } else {
      console.log('AuthContext - No external user, checking Supabase session');
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log('AuthContext - Supabase session:', session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        (async () => {
          console.log('AuthContext - Auth state changed:', event, session);
          setUser(session?.user ?? null);
        })();
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const redirectToExternalAuth = () => {
    const authUrl = import.meta.env.VITE_AUTH_URL;
    const appId = import.meta.env.VITE_AUTH_APP_ID;
    const apiKey = import.meta.env.VITE_AUTH_API_KEY;
    const callbackUrl = import.meta.env.VITE_AUTH_CALLBACK_URL;

    const loginUrl = `${authUrl}/login?app_id=${appId}&redirect_uri=${encodeURIComponent(callbackUrl)}&api_key=${apiKey}`;

    window.location.href = loginUrl;
  };

  const exchangeAuthCode = async (code: string) => {
    try {
      console.log('AuthContext - Exchanging code:', code);
      const exchangeUrl = import.meta.env.VITE_AUTH_EXCHANGE_URL;
      const appId = import.meta.env.VITE_AUTH_APP_ID;

      const response = await fetch(exchangeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          application_id: appId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange auth code');
      }

      const result = await response.json();
      console.log('AuthContext - Exchange result:', result);

      if (result.success && result.data) {
        console.log('AuthContext - Storing user data:', result.data.user);
        localStorage.setItem('external_access_token', result.data.access_token);
        localStorage.setItem('external_refresh_token', result.data.refresh_token);
        localStorage.setItem('external_user', JSON.stringify(result.data.user));

        setExternalUser(result.data.user);
        setUser(null);
      } else {
        throw new Error('Invalid response from auth exchange');
      }
    } catch (error) {
      console.error('Error exchanging auth code:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    localStorage.removeItem('external_access_token');
    localStorage.removeItem('external_refresh_token');
    localStorage.removeItem('external_user');
    setExternalUser(null);

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{
      user,
      externalUser,
      loading,
      signIn,
      signUp,
      signOut,
      exchangeAuthCode,
      redirectToExternalAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
