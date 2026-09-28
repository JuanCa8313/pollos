'use client';

import React, { useState, useEffect } from 'react';
import { dbPollos, emitPollosUpdated, type LotePollo } from '../lib/db';
import { Bird, Plus, AlertTriangle, Calendar, X, Pencil, Trash2 } from 'lucide-react';
import { formatCOP } from '../lib/utils';

export function LotesTab() {
  const [lotes, setLotes] = useState<LotePollo[]>([]);
  const [showNuevoModal, setShowNuevoModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);
  const [editingLote, setEditingLote] = useState<LotePollo | null>(null);
  const [deletingLote, setDeletingLote] = useState<LotePollo | null>(null);
  const [borrarRegistrosAsociados, setBorrarRegistrosAsociados] = useState<boolean>(true);

  // Formulario nuevo lote
  const [nombre, setNombre] = useState<string>('');
  const [cantidadInicial, setCantidadInicial] = useState<number>(50);
  const [costoPollitoUnitario, setCostoPollitoUnitario] = useState<number>(3500);
  const [pesoPromedioInicialKg, setPesoPromedioInicialKg] = useState<number>(0.05);
  const [raza, setRaza] = useState<string>('Ross 308 (Blanco pesado)');
  const [fechaInicio, setFechaInicio] = useState<string>(new Date().toISOString().split('T')[0]);

  // Formulario edición lote
  const [editNombre, setEditNombre] = useState<string>('');
  const [editCantidadInicial, setEditCantidadInicial] = useState<number>(50);
  const [editCantidadActual, setEditCantidadActual] = useState<number>(50);
  const [editCostoPollitoUnitario, setEditCostoPollitoUnitario] = useState<number>(3500);
  const [editPesoPromedioActualKg, setEditPesoPromedioActualKg] = useState<number>(2.7);
  const [editRaza, setEditRaza] = useState<string>('Ross 308 (Blanco pesado)');
  const [editFechaInicio, setEditFechaInicio] = useState<string>('');
  const [editActivo, setEditActivo] = useState<boolean>(true);
  const [editNotas, setEditNotas] = useState<string>('');

  const cargarLotes = async () => {
    const list = await dbPollos.lotes.toArray();
    setLotes(list);
  };

  useEffect(() => {
    cargarLotes();
    const listener = () => cargarLotes();
    window.addEventListener('granja-pollos-db-updated', listener);
    return () => window.removeEventListener('granja-pollos-db-updated', listener);
  }, []);

  const handleCrearLote = async () => {
    if (!nombre.trim()) return;

    if (typeof window !== 'undefined') {
      localStorage.setItem('pollos_seed_done', 'true');
    }

    await dbPollos.lotes.add({
      id: 'lote-' + Date.now(),
      nombre: nombre.trim(),
      fechaInicio: fechaInicio,
      cantidadInicial: Number(cantidadInicial),
      cantidadActual: Number(cantidadInicial),
      raza: raza,
      costoPollitoUnitario: Number(costoPollitoUnitario),
      pesoPromedioActualKg: Number(pesoPromedioInicialKg) || 0.05,
      activo: true,
      createdAt: new Date().toISOString(),
    });

    setShowNuevoModal(false);
    setNombre('');
    setCantidadInicial(50);
    setCostoPollitoUnitario(3500);
    setPesoPromedioInicialKg(0.05);
    emitPollosUpdated();
    await cargarLotes();
  };

  const handleOpenEdit = (lote: LotePollo) => {
    setEditingLote(lote);
    setEditNombre(lote.nombre);
    setEditCantidadInicial(lote.cantidadInicial);
    setEditCantidadActual(lote.cantidadActual);
    setEditCostoPollitoUnitario(lote.costoPollitoUnitario);
    setEditPesoPromedioActualKg(lote.pesoPromedioActualKg || 2.7);
    setEditRaza(lote.raza);
    setEditFechaInicio(lote.fechaInicio);
    setEditActivo(Boolean(lote.activo));
    setEditNotas(lote.notas || '');
    setShowEditModal(true);
  };

  const handleGuardarEdicion = async () => {
    if (!editingLote || !editNombre.trim()) return;

    await dbPollos.lotes.update(editingLote.id, {
      nombre: editNombre.trim(),
      fechaInicio: editFechaInicio,
      cantidadInicial: Number(editCantidadInicial),
      cantidadActual: Number(editCantidadActual),
      costoPollitoUnitario: Number(editCostoPollitoUnitario),
      pesoPromedioActualKg: Number(editPesoPromedioActualKg),
      raza: editRaza,
      activo: editActivo,
      notas: editNotas.trim(),
    });

    setShowEditModal(false);
    setEditingLote(null);
    emitPollosUpdated();
    await cargarLotes();
  };

  const handleOpenDelete = (lote: LotePollo) => {
    setDeletingLote(lote);
    setBorrarRegistrosAsociados(true);
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingLote) return;

    if (typeof window !== 'undefined') {
      localStorage.setItem('pollos_seed_done', 'true');
    }

    if (borrarRegistrosAsociados) {
      await dbPollos.alimento.where('loteId').equals(deletingLote.id).delete();
      await dbPollos.mortalidad.where('loteId').equals(deletingLote.id).delete();
      await dbPollos.ventas.where('loteId').equals(deletingLote.id).delete();
      await dbPollos.gastos.where('loteId').equals(deletingLote.id).delete();
    }

    await dbPollos.lotes.delete(deletingLote.id);
    setShowDeleteConfirmModal(false);
    setDeletingLote(null);
    emitPollosUpdated();
    await cargarLotes();
  };

  const calcularDiasSemanas = (fechaInicioStr: string) => {
    const inicio = new Date(fechaInicioStr).getTime();
    const hoy = new Date().getTime();
    const diffDias = Math.max(0, Math.floor((hoy - inicio) / (1000 * 60 * 60 * 24)));
    const semanas = Math.floor(diffDias / 7);
    const diasRestantes = diffDias % 7;
    return { diffDias, semanas, diasRestantes };
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Lotes de Engorde</h2>
          <p className="text-xs text-slate-500">Control de edad y ciclos biológicos</p>
        </div>
        <button
          onClick={() => setShowNuevoModal(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Nuevo Lote
        </button>
      </div>

      {/* Lista de Lotes */}
      <div className="space-y-4">
        {lotes.length === 0 && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-sm">
            <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Bird className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h3 className="font-black text-lg text-slate-900 mb-1">Sin Lotes Registrados</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mb-5 leading-relaxed">
              No tienes ningún lote registrado actualmente. Pulsa el botón para ingresar los números y datos reales de tu galpón.
            </p>
            <button
              onClick={() => setShowNuevoModal(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white font-black px-5 py-3 rounded-2xl text-xs shadow-md active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Crear Lote Real
            </button>
          </div>
        )}

        {lotes.map((lote) => {
          const { diffDias, semanas, diasRestantes } = calcularDiasSemanas(lote.fechaInicio);
          const esListoParaCosecha = diffDias >= 56; // 8 semanas o más

          return (
            <div
              key={lote.id}
              className={`bg-white rounded-2xl p-4 border shadow-sm transition-all ${
                esListoParaCosecha ? 'border-amber-300 ring-2 ring-amber-400/20' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-base text-slate-900">{lote.nombre}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {diffDias} días ({semanas} sem {diasRestantes} d)
                    </span>
                    <span>•</span>
                    <span>{lote.raza}</span>
                  </div>
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    lote.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {lote.activo ? 'Activo' : 'Cerrado'}
                </span>
              </div>

              {/* Alerta de Cosecha Urgente */}
              {esListoParaCosecha && (
                <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 my-3 flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 leading-snug">
                    <strong>¡Lote en Punto Óptimo de Venta!</strong> A 2.200 msnm con más de 8 semanas, la ganancia de peso se estanca y el pollo consume alimento costoso. Conviene vender en pie o sacrificado esta semana.
                  </div>
                </div>
              )}

              {/* Barra de progreso de engorde (meta 8-9 semanas = 60 días) */}
              <div className="my-3">
                <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                  <span>Progreso de Engorde</span>
                  <span>{Math.min(100, Math.round((diffDias / 60) * 100))}% (Día {diffDias}/60)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      esListoParaCosecha ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (diffDias / 60) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Métricas del lote */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Vivas</span>
                  <span className="font-black text-sm text-slate-800">{lote.cantidadActual}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Iniciales</span>
                  <span className="font-semibold text-sm text-slate-600">{lote.cantidadInicial}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Costo BB</span>
                  <span className="font-semibold text-sm text-slate-600">{formatCOP(lote.costoPollitoUnitario)}</span>
                </div>
              </div>

              {/* Botones de acción del lote */}
              <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(lote)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-500" />
                  Ajustar / Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenDelete(lote)}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL NUEVO LOTE */}
      {showNuevoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          onClick={() => setShowNuevoModal(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl max-h-[88dvh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 flex-shrink-0">
              <h3 className="font-black text-lg text-slate-900">Ingresar Nuevo Lote de Pollitos</h3>
              <button
                onClick={() => setShowNuevoModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Nombre del Lote</label>
                <input
                  type="text"
                  placeholder="Ej: Lote 1 - Ross 308"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Nº Pollitos BB</label>
                  <input
                    type="number"
                    min="1"
                    value={cantidadInicial}
                    onChange={(e) => setCantidadInicial(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Costo Unitario BB</label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={costoPollitoUnitario}
                    onChange={(e) => setCostoPollitoUnitario(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Peso Promedio Inicial (kg)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.01"
                    value={pesoPromedioInicialKg}
                    onChange={(e) => setPesoPromedioInicialKg(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 text-xs"
                  />
                  <span className="text-[10px] text-slate-400">~0.05 kg pollito BB recién llegado</span>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Fecha de Ingreso</label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Línea / Raza</label>
                <select
                  value={raza}
                  onChange={(e) => setRaza(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  <option value="Ross 308 (Blanco pesado)">Ross 308 (Blanco pesado)</option>
                  <option value="Cobb 500 (Rápido crecimiento)">Cobb 500 (Rápido crecimiento)</option>
                  <option value="Campesino / Criollo">Campesino / Criollo</option>
                  <option value="Sasso / Cuello Desnudo">Sasso / Cuello Desnudo</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-3 mt-2 border-t border-slate-100 flex-shrink-0">
              <button
                onClick={() => setShowNuevoModal(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearLote}
                className="w-1/2 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs shadow-md cursor-pointer"
              >
                Guardar Lote Real
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR / AJUSTAR LOTE */}
      {showEditModal && editingLote && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl max-h-[88dvh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 flex-shrink-0">
              <div>
                <h3 className="font-black text-lg text-slate-900 leading-tight">Ajustar / Editar Lote</h3>
                <p className="text-[11px] text-slate-500">Modifica los números y estado del lote</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Nombre del Lote</label>
                <input
                  type="text"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Nº Aves Iniciales</label>
                  <input
                    type="number"
                    min="1"
                    value={editCantidadInicial}
                    onChange={(e) => setEditCantidadInicial(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Nº Aves Vivas Hoy</label>
                  <input
                    type="number"
                    min="0"
                    value={editCantidadActual}
                    onChange={(e) => setEditCantidadActual(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Costo Unitario BB (COP)</label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={editCostoPollitoUnitario}
                    onChange={(e) => setEditCostoPollitoUnitario(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Peso Promedio Actual (kg)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.01"
                    value={editPesoPromedioActualKg}
                    onChange={(e) => setEditPesoPromedioActualKg(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Fecha de Ingreso</label>
                <input
                  type="date"
                  value={editFechaInicio}
                  onChange={(e) => setEditFechaInicio(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Línea / Raza</label>
                <select
                  value={editRaza}
                  onChange={(e) => setEditRaza(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  <option value="Ross 308 (Blanco pesado)">Ross 308 (Blanco pesado)</option>
                  <option value="Cobb 500 (Rápido crecimiento)">Cobb 500 (Rápido crecimiento)</option>
                  <option value="Campesino / Criollo">Campesino / Criollo</option>
                  <option value="Sasso / Cuello Desnudo">Sasso / Cuello Desnudo</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Estado del Lote</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditActivo(true)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      editActivo
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Activo (En engorde)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditActivo(false)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      !editActivo
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Cerrado / Liquidado
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Notas u Observaciones</label>
                <input
                  type="text"
                  placeholder="Detalles sobre galpón, condiciones, etc."
                  value={editNotas}
                  onChange={(e) => setEditNotas(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3 mt-2 border-t border-slate-100 flex-shrink-0">
              <button
                onClick={() => setShowEditModal(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarEdicion}
                className="w-1/2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-md cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      {showDeleteConfirmModal && deletingLote && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          onClick={() => setShowDeleteConfirmModal(false)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6 stroke-[2.5]" />
            </div>

            <h3 className="font-black text-lg text-slate-900 text-center mb-1">¿Eliminar Lote?</h3>
            <p className="text-xs text-slate-500 text-center mb-4 leading-relaxed">
              Estás a punto de eliminar <strong className="text-slate-800">{deletingLote.nombre}</strong>.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-4">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={borrarRegistrosAsociados}
                  onChange={(e) => setBorrarRegistrosAsociados(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <span className="text-[11px] text-slate-600 leading-snug">
                  Borrar también los registros de prueba (alimento, ventas y mortalidad) asociados a este lote.
                </span>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
