'use client';

import React, { useState, useEffect } from 'react';
import { BotoneraTab } from '../components/BotoneraTab';
import { TableroTab } from '../components/TableroTab';
import { LotesTab } from '../components/LotesTab';
import { ClientesTab } from '../components/ClientesTab';
import { BottomNav, type TabType } from '../components/BottomNav';
import { DocumentacionModal } from '../components/DocumentacionModal';
import LoginScreen from '../components/LoginScreen';
import InstallPwaBanner from '../components/InstallPwaBanner';
import { AuthProvider, useAuth, type AppRole } from '../contexts/AuthContext';
import { seedInitialPollosData } from '../lib/db';
import { Bird, Wifi, WifiOff, BookOpen, Shield, ChevronDown, LogOut } from 'lucide-react';

function PollosAppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('botonera');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [showDocModal, setShowDocModal] = useState<boolean>(false);
  const [showRoleSelector, setShowRoleSelector] = useState<boolean>(false);

  const { user, isAdmin, isOperador, isRepartidor, loginRapido, logout, isLoading } = useAuth();

  useEffect(() => {
    // Limpieza de hash OAuth en URL (solo cuando el usuario ya ha sido autenticado por Supabase)
    if (user && typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, [user]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    seedInitialPollosData().then(() => {
      setIsReady(true);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isLoading || !isReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-700">Cargando Galpón de Pollos...</p>
        <span className="text-xs text-slate-400">Modo Local-First activo</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        <InstallPwaBanner />
        <LoginScreen isOnline={isOnline} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <InstallPwaBanner />
      {/* Barra Superior / Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-xl text-white shadow-sm">
              <Bird className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-black text-sm tracking-tight text-slate-900 leading-none">
                Pollos de Engorde
              </h1>
              <span className="text-[10px] font-semibold text-slate-500 tracking-wide">
                2.200 msnm • Granja OS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón de Documentación */}
            <button
              onClick={() => setShowDocModal(true)}
              className="p-1.5 rounded-xl bg-orange-50 text-orange-700 border border-orange-200/80 hover:bg-orange-100 transition-all flex items-center gap-1 text-[11px] font-bold"
              title="Manual y Documentación"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Guía</span>
            </button>

            {/* Selector de Rol / Perfil */}
            <div className="relative">
              <button
                onClick={() => setShowRoleSelector(!showRoleSelector)}
                className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 py-1 px-2 rounded-xl text-[11px] font-bold text-slate-700 transition-all"
              >
                <Shield className="w-3 h-3 text-orange-600" />
                <span className="capitalize">{user?.roles[0].replace('_', ' ')}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showRoleSelector && (
                <div className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-50 animate-fade-in text-xs">
                  <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
                    <p className="font-bold text-slate-800 text-xs truncate">{user?.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400">
                    Cambiar Perfil (RBAC)
                  </div>
                  {(['administrador', 'operador_galpon', 'repartidor'] as AppRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        loginRapido(r);
                        setShowRoleSelector(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl font-semibold capitalize flex items-center justify-between ${
                        user?.roles.includes(r)
                          ? 'bg-orange-50 text-orange-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {r.replace('_', ' ')}
                      {user?.roles.includes(r) && <span className="text-[10px]">✓</span>}
                    </button>
                  ))}

                  <div className="pt-1.5 mt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setShowRoleSelector(false);
                        logout();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 text-xs transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Estado Conexión */}
            <div className="flex items-center gap-1 bg-slate-100 py-1 px-2 rounded-full text-[10px] font-bold">
              {isOnline ? (
                <Wifi className="w-3 h-3 text-emerald-600" />
              ) : (
                <WifiOff className="w-3 h-3 text-amber-600" />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal según pestaña */}
      <main className="flex-1">
        {activeTab === 'botonera' && <BotoneraTab />}
        {activeTab === 'tablero' && <TableroTab />}
        {activeTab === 'lotes' && <LotesTab />}
        {activeTab === 'clientes' && <ClientesTab />}
      </main>

      {/* Modal de Documentación */}
      <DocumentacionModal isOpen={showDocModal} onClose={() => setShowDocModal(false)} />

      {/* Navegación Inferior */}
      <BottomNav currentTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default function PollosHomePage() {
  return (
    <AuthProvider>
      <PollosAppContent />
    </AuthProvider>
  );
}
