'use client';

import React, { useState, useEffect } from 'react';
import { dbPollos, emitPollosUpdated, type ClienteLocal } from '../lib/db';
import { Users, UserPlus, Phone, MapPin, HandCoins, AlertCircle, X } from 'lucide-react';
import { formatCOP, cleanNumberInput } from '../lib/utils';

export function ClientesTab() {
  const [clientes, setClientes] = useState<ClienteLocal[]>([]);
  const [showNuevoClienteModal, setShowNuevoClienteModal] = useState<boolean>(false);
  const [showAbonoModal, setShowAbonoModal] = useState<boolean>(false);
  const [selectedCliente, setSelectedCliente] = useState<ClienteLocal | null>(null);

  // Formulario nuevo cliente
  const [nombre, setNombre] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');
  const [direccion, setDireccion] = useState<string>('');

  // Formulario abono
  const [montoAbono, setMontoAbono] = useState<string>('20000');
  const [metodoAbono, setMetodoAbono] = useState<'efectivo' | 'transferencia'>('efectivo');

  const cargarClientes = async () => {
    const list = await dbPollos.clientes.toArray();
    setClientes(list);
  };

  useEffect(() => {
    cargarClientes();
    const listener = () => cargarClientes();
    window.addEventListener('granja-pollos-db-updated', listener);
    return () => window.removeEventListener('granja-pollos-db-updated', listener);
  }, []);

  const handleCrearCliente = async () => {
    if (!nombre.trim()) return;
    await dbPollos.clientes.add({
      id: 'cli-' + Date.now(),
      nombre: nombre.trim(),
      telefono: telefono.trim() || undefined,
      direccion: direccion.trim() || undefined,
      saldoPendiente: 0,
      activo: true,
      createdAt: new Date().toISOString(),
    });

    setShowNuevoClienteModal(false);
    setNombre('');
    setTelefono('');
    setDireccion('');
    emitPollosUpdated();
    await cargarClientes();
  };

  const handleRegistrarAbono = async () => {
    const montoNum = Number(montoAbono) || 0;
    if (!selectedCliente || montoNum <= 0) return;

    await dbPollos.abonos.add({
      id: 'abo-' + Date.now(),
      clienteId: selectedCliente.id,
      fecha: new Date().toISOString().split('T')[0],
      montoCop: montoNum,
      metodoPago: metodoAbono,
      createdAt: new Date().toISOString(),
    });

    const nuevoSaldo = Math.max(0, (selectedCliente.saldoPendiente || 0) - montoNum);
    await dbPollos.clientes.update(selectedCliente.id, { saldoPendiente: nuevoSaldo });

    setShowAbonoModal(false);
    setSelectedCliente(null);
    emitPollosUpdated();
    await cargarClientes();
  };

  const totalCarteraPendiente = clientes.reduce((acc, c) => acc + (c.saldoPendiente || 0), 0);

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Clientes del Pueblo</h2>
          <p className="text-xs text-slate-500">Libreta de fiados y cartera local</p>
        </div>
        <button
          onClick={() => setShowNuevoClienteModal(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </div>

      {/* Resumen de Cartera Fiada */}
      <div className="bg-amber-500 text-white rounded-2xl p-4 shadow-sm mb-4 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-100 block">
            Cartera Total Pendiente por Cobrar
          </span>
          <span className="text-2xl font-black">{formatCOP(totalCarteraPendiente)}</span>
        </div>
        <HandCoins className="w-8 h-8 text-amber-200" />
      </div>

      {/* Lista de Clientes */}
      <div className="space-y-3">
        {clientes.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between"
          >
            <div>
              <h3 className="font-bold text-sm text-slate-900">{c.nombre}</h3>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                {c.telefono && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {c.telefono}
                  </span>
                )}
                {c.direccion && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {c.direccion}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Saldo</span>
              <span
                className={`font-black text-sm block ${
                  c.saldoPendiente > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {c.saldoPendiente > 0 ? formatCOP(c.saldoPendiente) : 'Al día'}
              </span>

              {c.saldoPendiente > 0 && (
                <button
                  onClick={() => {
                    setSelectedCliente(c);
                    setMontoAbono(String(c.saldoPendiente || ''));
                    setShowAbonoModal(true);
                  }}
                  className="mt-1 text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200 hover:bg-orange-100 active:scale-95 transition-all"
                >
                  Cobrar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL NUEVO CLIENTE */}
      {showNuevoClienteModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          onClick={() => setShowNuevoClienteModal(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl max-h-[88dvh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 flex-shrink-0">
              <h3 className="font-black text-lg text-slate-900">Agregar Cliente</h3>
              <button
                onClick={() => setShowNuevoClienteModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  placeholder="Ej: Doña Carmen / Asadero Central"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  placeholder="300 000 0000"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Dirección / Vereda / Barrio</label>
                <input
                  type="text"
                  placeholder="Ej: Frente al parque / Vereda El Roble"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3 mt-2 border-t border-slate-100 flex-shrink-0">
              <button
                onClick={() => setShowNuevoClienteModal(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearCliente}
                className="w-1/2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-md cursor-pointer"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL COBRAR ABONO */}
      {showAbonoModal && selectedCliente && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          onClick={() => setShowAbonoModal(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl max-h-[88dvh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 flex-shrink-0">
              <div>
                <h3 className="font-black text-lg text-slate-900 leading-tight">Registrar Abono</h3>
                <p className="text-xs text-slate-500">
                  Cliente: <strong>{selectedCliente.nombre}</strong> (Deuda:{' '}
                  <strong className="text-rose-600">{formatCOP(selectedCliente.saldoPendiente)}</strong>)
                </p>
              </div>
              <button
                onClick={() => setShowAbonoModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Monto a Recibir (COP)</label>
                <input
                  type="number"
                  step="5000"
                  max={selectedCliente.saldoPendiente}
                  value={montoAbono}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setMontoAbono(cleanNumberInput(e.target.value))}
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Método de Cobro</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMetodoAbono('efectivo')}
                    className={`py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                      metodoAbono === 'efectivo'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Efectivo en Mano
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodoAbono('transferencia')}
                    className={`py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                      metodoAbono === 'transferencia'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Nequi / Bancolombia
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-3 mt-2 border-t border-slate-100 flex-shrink-0">
              <button
                onClick={() => setShowAbonoModal(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegistrarAbono}
                className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md cursor-pointer"
              >
                Confirmar Cobro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
