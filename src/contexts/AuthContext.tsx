'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AppRole = 'administrador' | 'operador_galpon' | 'repartidor';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  roles: AppRole[];
  fincaNombre?: string;
}

import { getSupabaseClient } from '../lib/supabase';

export const AUTHORIZED_EMAILS = [
  'juanca.arcilav@gmail.com',
  'alex@alexzapata.com',
  'admin@granja.com',
  'admin@finca.com',
];

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  isAdmin: boolean;
  isOperador: boolean;
  isRepartidor: boolean;
  loginRapido: (rol: AppRole) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isLoggingOutRef = React.useRef<boolean>(false);

  const loginRapido = (rol: AppRole) => {
    setError(null);
    const rolesMap: Record<AppRole, { name: string; email: string }> = {
      administrador: { name: 'Juan Carlos (Dueño)', email: 'admin@granja.com' },
      operador_galpon: { name: 'Operador de Galpón', email: 'galponero@granja.com' },
      repartidor: { name: 'Repartidor de Pueblo', email: 'entregas@granja.com' },
    };

    const newUser: AuthUser = {
      id: 'usr-' + rol,
      email: rolesMap[rol].email,
      name: rolesMap[rol].name,
      roles: [rol],
      fincaNombre: 'Granja 2.200 msnm',
    };

    setUser(newUser);
    localStorage.setItem('pollos_auth_user', JSON.stringify(newUser));
  };

  useEffect(() => {
    let isMounted = true;

    // 1. Cargar sesión previa desde localStorage (acceso offline instantáneo)
    try {
      const savedUser = localStorage.getItem('pollos_auth_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.email) {
          setUser(parsed);
          setIsLoading(false);
        } else {
          localStorage.removeItem('pollos_auth_user');
        }
      }
    } catch (e) {
      console.error('Error parseando usuario guardado', e);
    }

    // 2. Si estamos sin conexión, finalizar carga inmediatamente
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // 3. Verificar sesión remota de Supabase con timeout de seguridad
    const checkSession = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error('Auth getSession timeout')), 3500)
        );

        const result: any = await Promise.race([sessionPromise, timeoutPromise]);
        const session = result?.data?.session;

        if (session?.user && isMounted) {
          const email = (session.user.email || '').toLowerCase().trim();
          const name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario';
          const isOwner = AUTHORIZED_EMAILS.includes(email) || email.includes('juanca') || email.includes('alex');
          const newUser: AuthUser = {
            id: session.user.id,
            email,
            name,
            roles: isOwner ? ['administrador'] : ['operador_galpon'],
            fincaNombre: 'Finca 2.200 msnm',
          };
          setUser(newUser);
          localStorage.setItem('pollos_auth_user', JSON.stringify(newUser));
        }
      } catch (err) {
        console.warn('Verificación remota de sesión omitida o demorada:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkSession();

    // 4. Suscripción a eventos de Supabase Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session?.user) {
        const email = (session.user.email || '').toLowerCase().trim();
        const name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario';
        const isOwner = AUTHORIZED_EMAILS.includes(email) || email.includes('juanca') || email.includes('alex');
        const newUser: AuthUser = {
          id: session.user.id,
          email,
          name,
          roles: isOwner ? ['administrador'] : ['operador_galpon'],
          fincaNombre: 'Finca 2.200 msnm',
        };
        setUser(newUser);
        localStorage.setItem('pollos_auth_user', JSON.stringify(newUser));
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        // Solo cerrar sesión si el usuario oprimió deliberadamente el botón de Cerrar sesión
        if (isLoggingOutRef.current) {
          setUser(null);
          localStorage.removeItem('pollos_auth_user');
        } else {
          console.warn('[Auth Pollos] Evento SIGNED_OUT ignorado para proteger sesión local.');
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    setError(null);
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('Cliente de base de datos no configurado.');
      return;
    }

    try {
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });
      if (authError) throw authError;
    } catch (err: any) {
      console.error('Error al iniciar sesión con Google:', err);
      setError(err?.message || 'Error al conectar con Google OAuth');
    }
  };

  const logout = async () => {
    isLoggingOutRef.current = true;
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Error cerrando sesión en Supabase:', err);
      }
    }
    setUser(null);
    localStorage.removeItem('pollos_auth_user');
    setTimeout(() => {
      isLoggingOutRef.current = false;
    }, 1500);
  };

  const isAdmin = !!user?.roles.includes('administrador');
  const isOperador = !!user?.roles.includes('operador_galpon');
  const isRepartidor = !!user?.roles.includes('repartidor');

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        isAdmin,
        isOperador,
        isRepartidor,
        loginRapido,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
