'use client';

import React, { useState, useEffect } from 'react';
import { dbPollos, type LotePollo, type VentaPollo, type RegistroAlimentoPollo, type GastoPollo, type AbonoCartera } from '../lib/db';
import { formatCOP, calcularFCR, calcularMortalidadPct } from '../lib/utils';
import { DollarSign, Wallet, ArrowUpRight, TrendingUp, Bird, HeartPulse, Scale, Sparkles, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function TableroTab() {
  const { isAdmin, user } = useAuth();
  const [lotes, setLotes] = useState<LotePollo[]>([]);
  const [selectedLoteId, setSelectedLoteId] = useState<string>('');
  const [ventas, setVentas] = useState<VentaPollo[]>([]);
  const [alimentos, setAlimentos] = useState<RegistroAlimentoPollo[]>([]);
  const [gastos, setGastos] = useState<GastoPollo[]>([]);
  const [abonos, setAbonos] = useState<AbonoCartera[]>([]);

  const cargarMetricas = async () => {
    const allLotes = await dbPollos.lotes.toArray();
    setLotes(allLotes);

    const activeLote = allLotes.find((l) => l.activo) || allLotes[0];
    const targetLoteId = selectedLoteId || activeLote?.id || '';
    if (!selectedLoteId && targetLoteId) {
      setSelectedLoteId(targetLoteId);
    }

    const allVentas = await dbPollos.ventas.toArray();
    const allAlimentos = await dbPollos.alimento.toArray();
    const allGastos = await dbPollos.gastos.toArray();
    const allAbonos = await dbPollos.abonos.toArray();

    setVentas(allVentas);
    setAlimentos(allAlimentos);
    setGastos(allGastos);
    setAbonos(allAbonos);
  };

  useEffect(() => {
    cargarMetricas();
    const listener = () => cargarMetricas();
    window.addEventListener('granja-pollos-db-updated', listener);
    return () => window.removeEventListener('granja-pollos-db-updated', listener);
  }, [selectedLoteId]);

  const loteSeleccionado = lotes.find((l) => l.id === selectedLoteId);

  // Filtrados por lote
  const ventasLote = ventas.filter((v) => !selectedLoteId || v.loteId === selectedLoteId);
  const alimentosLote = alimentos.filter((a) => !selectedLoteId || a.loteId === selectedLoteId);
  const gastosLote = gastos.filter((g) => !selectedLoteId || !g.loteId || g.loteId === selectedLoteId);

  // Totales
  const totalIngresosVentas = ventasLote.reduce((acc, v) => acc + v.totalCop, 0);
  const totalKgCarneVendida = ventasLote.reduce((acc, v) => acc + v.pesoTotalKg, 0);
  const totalAvesVendidas = ventasLote.reduce((acc, v) => acc + v.cantidadAves, 0);

  // Costo pollito
  const costoPollitosBB = (loteSeleccionado?.cantidadInicial || 0) * (loteSeleccionado?.costoPollitoUnitario || 0);
  const costoConcentrado = alimentosLote.reduce((acc, a) => acc + a.costoTotalCop, 0);
  const totalKgConcentrado = alimentosLote
    .filter((a) => a.tipoAlimento !== 'mosca_soldado_viva')
    .reduce((acc, a) => acc + a.cantidadKg, 0);
  const totalKgBsf = alimentosLote
    .filter((a) => a.tipoAlimento === 'mosca_soldado_viva')
    .reduce((acc, a) => acc + a.cantidadKg, 0);

  const totalOtrosGastos = gastosLote.reduce((acc, g) => acc + g.montoCop, 0);
  const costoTotalLote = costoPollitosBB + costoConcentrado + totalOtrosGastos;

  const utilidadNetaLote = totalIngresosVentas - costoTotalLote;
  const margenNetoPct = totalIngresosVentas > 0 ? ((utilidadNetaLote / totalIngresosVentas) * 100).toFixed(1) : '0';

  // FCR (Alimento / Carne producida)
  const biomasaTotalEstimadaKg =
    totalKgCarneVendida + ((loteSeleccionado?.cantidadActual || 0) * (loteSeleccionado?.pesoPromedioActualKg || 2.7));
  const fcr = calcularFCR(totalKgConcentrado, biomasaTotalEstimadaKg);

  // Mortalidad
  const bajasLote = (loteSeleccionado?.cantidadInicial || 0) - (loteSeleccionado?.cantidadActual || 0) - totalAvesVendidas;
  const mortalidadPct = calcularMortalidadPct(Math.max(0, bajasLote), loteSeleccionado?.cantidadInicial || 1);

  // Tesorería / Caja
  const ventasEfectivo = ventasLote.filter((v) => v.metodoPago === 'efectivo').reduce((acc, v) => acc + v.totalCop, 0);
  const abonosEfectivo = abonos.filter((a) => a.metodoPago === 'efectivo').reduce((acc, a) => acc + a.montoCop, 0);
  const gastosEfectivo = gastosLote.filter((g) => g.metodoPago === 'efectivo').reduce((acc, g) => acc + g.montoCop, 0);
  const cajaEfectivo = ventasEfectivo + abonosEfectivo - gastosEfectivo;

  const ventasTransf = ventasLote.filter((v) => v.metodoPago === 'transferencia').reduce((acc, v) => acc + v.totalCop, 0);
  const abonosTransf = abonos.filter((a) => a.metodoPago === 'transferencia').reduce((acc, a) => acc + a.montoCop, 0);
  const gastosTransf = gastosLote.filter((g) => g.metodoPago === 'transferencia').reduce((acc, g) => acc + g.montoCop, 0);
  const bancoTransf = ventasTransf + abonosTransf - gastosTransf;

  const carteraFiada = ventasLote.filter((v) => v.metodoPago === 'fiado').reduce((acc, v) => acc + v.totalCop, 0);

  // Ahorro estimado por larva BSF ($2.800 COP por kg de alimento sustituido)
  const ahorroBsfCop = Math.round(totalKgBsf * 2800);

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto">
      {/* Selector de Lote */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Finanzas & Desempeño</h2>
          <p className="text-xs text-slate-500">Métricas zootécnicas y flujo de caja</p>
        </div>
        <select
          value={selectedLoteId}
          onChange={(e) => setSelectedLoteId(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700"
        >
          {lotes.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* KPI Principal: Utilidad y Margen (Exclusivo Administrador) */}
      {isAdmin ? (
        <>
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-5 shadow-xl mb-4 relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Utilidad Neta del Lote
              </span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                utilidadNetaLote >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                Margen {margenNetoPct}%
              </span>
            </div>
            <div className="text-3xl font-black tracking-tight mb-4">
              {formatCOP(utilidadNetaLote)}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700/60 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Ingresos Totales</span>
                <span className="font-bold text-emerald-400 text-sm">{formatCOP(totalIngresosVentas)}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Costos Totales</span>
                <span className="font-bold text-rose-300 text-sm">{formatCOP(costoTotalLote)}</span>
              </div>
            </div>
          </div>

          {/* Caja y Tesorería */}
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm text-center">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Efectivo</span>
              <span className={`font-black text-sm block ${cajaEfectivo >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                {formatCOP(cajaEfectivo)}
              </span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm text-center">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Transferencias</span>
              <span className={`font-black text-sm block ${bancoTransf >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                {formatCOP(bancoTransf)}
              </span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm text-center">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Por Cobrar</span>
              <span className="font-black text-sm block text-amber-600">
                {formatCOP(carteraFiada)}
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-slate-100 border border-slate-200 rounded-3xl p-5 mb-4 text-center">
          <ShieldAlert className="w-8 h-8 text-amber-600 mx-auto mb-2" />
          <h4 className="font-bold text-sm text-slate-800 mb-1">Módulo Financiero Reservado</h4>
          <p className="text-xs text-slate-500">
            Las métricas de utilidad, costos de insumos y arqueo de caja son exclusivas para el <strong>Administrador / Dueño</strong> de la finca.
          </p>
        </div>
      )}

      {/* Tarjeta de Economía Circular BSF */}
      {totalKgBsf > 0 && (
        <div className="bg-indigo-50 border border-indigo-200/80 rounded-2xl p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-indigo-950 block">Ahorro con Mosca Soldada</span>
              <span className="text-[11px] text-indigo-700">
                {totalKgBsf} kg de larva suministrada a costo $0
              </span>
            </div>
          </div>
          <span className="font-black text-sm text-indigo-900">
            +{formatCOP(ahorroBsfCop)}
          </span>
        </div>
      )}

      {/* Indicadores Zootécnicos */}
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 px-1">
        Rendimiento del Lote (2.200 msnm)
      </h3>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Bird className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-semibold">Población</span>
          </div>
          <div className="text-lg font-black text-slate-800">
            {loteSeleccionado?.cantidadActual || 0} <span className="text-xs text-slate-400 font-normal">vivos</span>
          </div>
          <span className="text-[11px] text-slate-500">
            {totalAvesVendidas} cosechados / {loteSeleccionado?.cantidadInicial || 0} iniciales
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <HeartPulse className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-semibold">Mortalidad</span>
          </div>
          <div className="text-lg font-black text-slate-800">
            {mortalidadPct}%
          </div>
          <span className="text-[11px] text-slate-500">
            {Math.max(0, bajasLote)} bajas registradas
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Scale className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold">Conversión (FCR)</span>
          </div>
          <div className="text-lg font-black text-slate-800">
            {fcr > 0 ? fcr : 'Pendiente'}
          </div>
          <span className="text-[11px] text-slate-500">
            {totalKgConcentrado} kg comidos / {biomasaTotalEstimadaKg.toFixed(0)} kg carne
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-semibold">Costo / Ave</span>
          </div>
          <div className="text-lg font-black text-slate-800">
            {formatCOP(
              (loteSeleccionado?.cantidadInicial || 0) > 0
                ? Math.round(costoTotalLote / (loteSeleccionado?.cantidadInicial || 1))
                : 0
            )}
          </div>
          <span className="text-[11px] text-slate-500">Inversión promedio por pollo</span>
        </div>
      </div>
    </div>
  );
}
