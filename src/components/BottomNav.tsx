'use client';

import React from 'react';
import { Zap, LayoutDashboard, Bird, Users } from 'lucide-react';

export type TabType = 'botonera' | 'tablero' | 'lotes' | 'clientes';

interface BottomNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function BottomNav({ currentTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'botonera', label: 'Botonera', icon: Zap },
    { id: 'tablero', label: 'Finanzas', icon: LayoutDashboard },
    { id: 'lotes', label: 'Lotes', icon: Bird },
    { id: 'clientes', label: 'Clientes', icon: Users },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-2">
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as TabType)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                isActive
                  ? 'text-amber-600 bg-amber-50 font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-900 active:scale-95'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[11px] leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
