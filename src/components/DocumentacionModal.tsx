'use client';

import React, { useState } from 'react';
import { BookOpen, ShieldCheck, Scale, Wheat, Flame, X, ChevronRight, HelpCircle } from 'lucide-react';

interface DocumentacionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentacionModal({ isOpen, onClose }: DocumentacionModalProps) {
  const [seccion, setSeccion] = useState<'operacion' | 'zootecnia' | 'rbac'>('operacion');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-white w-full max-w-lg rounded-3xl p-5 shadow-2xl max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 text-orange-700 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 leading-tight">Documentación & Manual</h3>
              <p className="text-[11px] text-slate-500">Pollos de Engorde • Clima Frío (2.200 msnm)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Pestañas de sección */}
        <div className="grid grid-cols-3 gap-1.5 my-3 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setSeccion('operacion')}
            className={`py-1.5 text-xs font-bold rounded-xl transition-all ${
              seccion === 'operacion' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600'
            }`}
          >
            Operación Diaria
          </button>
          <button
            onClick={() => setSeccion('zootecnia')}
            className={`py-1.5 text-xs font-bold rounded-xl transition-all ${
              seccion === 'zootecnia' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600'
            }`}
          >
            Zootecnia Frío
          </button>
          <button
            onClick={() => setSeccion('rbac')}
            className={`py-1.5 text-xs font-bold rounded-xl transition-all ${
              seccion === 'rbac' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600'
            }`}
          >
            Roles & Seguridad
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 text-xs text-slate-700">
          {seccion === 'operacion' && (
            <>
              <div className="bg-orange-50/70 p-3.5 rounded-2xl border border-orange-200/60">
                <h4 className="font-bold text-orange-950 mb-1 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-orange-600" /> 1. Venta en Canal vs en Pie
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  • <strong>En canal:</strong> Pollo beneficiado, pelado y arreglado. Su precio en pueblo oscila entre \$13.000 y \$14.500 COP/kg. El rendimiento en canal es aprox. del 72% al 75% del peso vivo.<br />
                  • <strong>En pie:</strong> Pollo pesado vivo en báscula. Precio típico: \$9.000 a \$10.500 COP/kg. Ahorra mano de obra y agua de pelado.
                </p>
              </div>

              <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/60">
                <h4 className="font-bold text-emerald-950 mb-1 flex items-center gap-1.5">
                  <Wheat className="w-4 h-4 text-emerald-600" /> 2. Ahorro con Mosca Soldada (BSF)
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  Las larvas vivas de mosca soldado aportan un 40% de proteína cruda y grasas de alta digestibilidad. Cada kilo de larva viva sustituye hasta 400g de concentrado de engorde, ingresando con <strong>costo \$0</strong> por ser producido en la misma finca.
                </p>
              </div>
            </>
          )}

          {seccion === 'zootecnia' && (
            <>
              <div className="bg-rose-50/70 p-3.5 rounded-2xl border border-rose-200/60">
                <h4 className="font-bold text-rose-950 mb-1 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-rose-600" /> Prevención del Síndrome Ascítico (Infarto por Frío)
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  A <strong>2.200 msnm</strong> la presión parcial de oxígeno es menor. Un pollo de rápido crecimiento (Ross 308) que come rápido en noche fría exige demasiado a su corazón y acumula líquido abdominal (ascitis):<br />
                  • Retirar el comedero durante la noche fría en semanas avanzadas.<br />
                  • Cuidar el abrigo de cortinas sin perder ventilación alta.<br />
                  • Cosechar puntualmente a las 8-9 semanas (60 días).
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-1">Fórmula de Conversión Alimenticia (FCR)</h4>
                <p className="text-slate-600 leading-relaxed">
                  <strong>FCR = Kilos de alimento consumidos / Kilos de pollo producidos.</strong><br />
                  Una meta óptima en clima frío es mantenerse entre 1.8 y 2.1.
                </p>
              </div>
            </>
          )}

          {seccion === 'rbac' && (
            <div className="space-y-2.5">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">👑 Administrador (Dueño)</span>
                <p className="text-slate-600 text-[11px]">
                  Acceso exclusivo a utilidades netas, márgenes %, costos de purina y arqueo de caja (efectivo vs bancos).
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">👷 Operador de Galpón</span>
                <p className="text-slate-600 text-[11px]">
                  Acceso a la Botonera para registrar comida, bajas y ventas. <strong>Las métricas de rentabilidad y dinero permanecen ocultas</strong> por confidencialidad.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">🚚 Repartidor</span>
                <p className="text-slate-600 text-[11px]">
                  Acceso a la libreta de clientes, entregas y cobro de abonos en el pueblo.
                </p>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-2xl text-xs"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
