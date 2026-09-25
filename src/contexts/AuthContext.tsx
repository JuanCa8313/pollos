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

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  isOperador: boolean;
  isRepartidor: boolean;
  loginRapido: (rol: AppRole) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Cargar sesión guardada en localStorage
    const savedUser = localStorage.getItem('pollos_auth_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error parseando usuario guardado', e);
      }
    } else {
      // Usuario predeterminado Administrador para acceso inicial
      const defaultAdmin: AuthUser = {
        id: 'usr-admin',
        email: 'admin@granja.com',
        name: 'Administrador Finca',
        roles: ['administrador'],
        fincaNombre: 'Finca 2.200 msnm',
      };
      setUser(defaultAdmin);
      localStorage.setItem('pollos_auth_user', JSON.stringify(defaultAdmin));
    }
    setIsLoading(false);
  }, []);

  const loginRapido = (rol: AppRole) => {
    const rolesMap: Record<AppRole, { name: string; email: string }> = {
      administrador: { name: 'Juan Carlos (Dueño)', email: 'admin@finca.com' },
      operador_galpon: { name: 'Operador de Galpón', email: 'galponero@finca.com' },
      repartidor: { name: 'Repartidor de Pueblo', email: 'entregas@finca.com' },
    };

    const newUser: AuthUser = {
      id: 'usr-' + rol,
      email: rolesMap[rol].email,
      name: rolesMap[rol].name,
      roles: [rol],
      fincaNombre: 'Finca 2.200 msnm',
    };

    setUser(newUser);
    localStorage.setItem('pollos_auth_user', JSON.stringify(newUser));
  };

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const email = (session.user.email || '').toLowerCase().trim();
          const name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario';
          const isOwner = email.includes('juanca') || email.includes('alex') || email === 'admin@granja.com';
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
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const email = (session.user.email || '').toLowerCase().trim();
          const name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario';
          const isOwner = email.includes('juanca') || email.includes('alex') || email === 'admin@granja.com';
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
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const loginWithGoogle = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
  };

  const logout = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('pollos_auth_user');
  };

  const isAdmin = !!user?.roles.includes('administrador');
  const isOperador = !!user?.roles.includes('operador_galpon');
  const isRepartidor = !!user?.roles.includes('repartidor');

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
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
