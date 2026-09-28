'use client';

import React, { useState, useEffect } from 'react';
import { dbPollos, type LotePollo, type VentaPollo, type RegistroAlimentoPollo, type GastoPollo, type AbonoCartera } from '../lib/db';
import { formatCOP, calcularFCR, calcularMortalidadPct } from '../lib/utils';
import {
  DollarSign,
  Wallet,
  ArrowUpRight,
  TrendingUp,
  Bird,
  HeartPulse,
  Scale,
  Sparkles,
  ShieldAlert,
  Calculator,
  Tag,
  ChevronDown,
  ChevronUp,
  Info,
  Percent,
} from 'lucide-react';
import {
  calcularPreciosSugeridosPollos,
  OPCIONES_MARGEN_POLLOS,
  type ModoCosteoPollos,
  type ModalidadPollo,
} from '../lib/preciosSugeridosPollos';
import { useAuth } from '../contexts/AuthContext';

export function TableroTab() {
  const { isAdmin, user } = useAuth();
  const [lotes, setLotes] = useState<LotePollo[]>([]);
  const [selectedLoteId, setSelectedLoteId] = useState<string>('');
  const [ventas, setVentas] = useState<VentaPollo[]>([]);
  const [alimentos, setAlimentos] = useState<RegistroAlimentoPollo[]>([]);
  const [gastos, setGastos] = useState<GastoPollo[]>([]);
  const [abonos, setAbonos] = useState<AbonoCartera[]>([]);

  // Estados de precios y márgenes sugeridos
  const [modoCosteoPrecios, setModoCosteoPrecios] = useState<ModoCosteoPollos>(() => {
    try {
      const g = localStorage.getItem('pollos_modo_costeo');
      if (g === 'pl_real' || g === 'facturas_recientes' || g === 'teorico_completo') return g;
    } catch {}
    return 'pl_real';
  });
  const [margenObjetivoPct, setMargenObjetivoPct] = useState<number>(25);
  const [modalidadVista, setModalidadVista] = useState<ModalidadPollo>('en_canal');
  const [mostrarDesgloseCostos, setMostrarDesgloseCostos] = useState<boolean>(false);

  const cargarMetricas = async () => {
    const allLotes = await dbPollos.lotes.toArray();
    setLotes(allLotes);

    const activeLote = allLotes.find((l) => l.activo) || allLotes[0];
    if (allLotes.length > 0) {
      if (!selectedLoteId || !allLotes.some((l) => l.id === selectedLoteId)) {
        setSelectedLoteId(activeLote ? activeLote.id : allLotes[0].id);
      }
    } else {
      setSelectedLoteId('');
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

  // Precios promedio reales cobrados en el lote
  const ventasCanalLote = ventasLote.filter((v) => v.modalidad === 'en_canal');
  const kgCanalVendidos = ventasCanalLote.reduce((acc, v) => acc + v.pesoTotalKg, 0);
  const totalCopCanalVendidos = ventasCanalLote.reduce((acc, v) => acc + v.totalCop, 0);
  const precioVentaActualKgCanal = kgCanalVendidos > 0 ? Math.round(totalCopCanalVendidos / kgCanalVendidos) : 13500;

  const ventasPieLote = ventasLote.filter((v) => v.modalidad === 'en_pie');
  const kgPieVendidos = ventasPieLote.reduce((acc, v) => acc + v.pesoTotalKg, 0);
  const totalCopPieVendidos = ventasPieLote.reduce((acc, v) => acc + v.totalCop, 0);
  const precioVentaActualKgPie = kgPieVendidos > 0 ? Math.round(totalCopPieVendidos / kgPieVendidos) : 9500;

  const analisisPrecios = calcularPreciosSugeridosPollos({
    lote: loteSeleccionado,
    ventasLote,
    alimentosLote,
    gastosLote,
    margenObjetivoPct,
    modoCosteo: modoCosteoPrecios,
    precioVentaActualKgCanal,
    precioVentaActualKgPie,
  });

  const preciosModalidadActiva = modalidadVista === 'en_canal' ? analisisPrecios.canal : analisisPrecios.enPie;

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
          {lotes.length === 0 ? (
            <option value="">Sin lotes creados</option>
          ) : (
            lotes.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre}
              </option>
            ))
          )}
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
          <div className="grid grid-cols-3 gap-2.5 mb-5">
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

          {/* ========================================================================= */}
          {/* MÓDULO INTELIGENCIA DE PRECIOS & MÁRGENES SUGERIDOS */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mb-5">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                  <Calculator className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 tracking-tight">Precios & Márgenes Sugeridos</h3>
                  <p className="text-[11px] text-slate-500">Costeo según egresos reales y mercado</p>
                </div>
              </div>

              {/* Selector Canal vs En Pie */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setModalidadVista('en_canal')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    modalidadVista === 'en_canal'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  En Canal
                </button>
                <button
                  type="button"
                  onClick={() => setModalidadVista('en_pie')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    modalidadVista === 'en_pie'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  En Pie
                </button>
              </div>
            </div>

            {/* 3 MODOS DE COSTEO INTERACTIVOS */}
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Modo de Costeo Activo
            </label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setModoCosteoPrecios('pl_real');
                  try { localStorage.setItem('pollos_modo_costeo', 'pl_real'); } catch {}
                }}
                className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  modoCosteoPrecios === 'pl_real'
                    ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/30 text-slate-900 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[10px] font-bold text-amber-700 flex items-center gap-1">
                    📊 Real P&L
                  </span>
                  {modoCosteoPrecios === 'pl_real' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  )}
                </div>
                <span className="text-xs font-black text-slate-800">
                  {formatCOP(modalidadVista === 'en_canal' ? analisisPrecios.comparativo.plReal.costoKgCanal : analisisPrecios.comparativo.plReal.costoKgPie)}/kg
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Devengado</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setModoCosteoPrecios('facturas_recientes');
                  try { localStorage.setItem('pollos_modo_costeo', 'facturas_recientes'); } catch {}
                }}
                className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  modoCosteoPrecios === 'facturas_recientes'
                    ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-400/30 text-slate-900 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                    🧾 Facturas
                  </span>
                  {modoCosteoPrecios === 'facturas_recientes' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </div>
                <span className="text-xs font-black text-slate-800">
                  {formatCOP(modalidadVista === 'en_canal' ? analisisPrecios.comparativo.facturasRecientes.costoKgCanal : analisisPrecios.comparativo.facturasRecientes.costoKgPie)}/kg
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Sin fantasma</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setModoCosteoPrecios('teorico_completo');
                  try { localStorage.setItem('pollos_modo_costeo', 'teorico_completo'); } catch {}
                }}
                className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  modoCosteoPrecios === 'teorico_completo'
                    ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-400/30 text-slate-900 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[10px] font-bold text-blue-700 flex items-center gap-1">
                    📐 Teórico
                  </span>
                  {modoCosteoPrecios === 'teorico_completo' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  )}
                </div>
                <span className="text-xs font-black text-slate-800">
                  {formatCOP(modalidadVista === 'en_canal' ? analisisPrecios.comparativo.teoricoCompleto.costoKgCanal : analisisPrecios.comparativo.teoricoCompleto.costoKgPie)}/kg
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Benchmark</span>
              </button>
            </div>

            {/* SELECTOR DE MARGEN OBJETIVO */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Margen Comercial Deseado
                </label>
                <span className="text-xs font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                  {margenObjetivoPct}% Margen
                </span>
              </div>

              {/* Botones rápidos de margen */}
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {OPCIONES_MARGEN_POLLOS.map((opc) => (
                  <button
                    key={opc.margenPct}
                    type="button"
                    onClick={() => setMargenObjetivoPct(opc.margenPct)}
                    className={`py-1.5 rounded-xl text-center text-xs font-black transition-all ${
                      margenObjetivoPct === opc.margenPct
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {opc.margenPct}%
                  </button>
                ))}
              </div>

              {/* Slider de precisión */}
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={margenObjetivoPct}
                onChange={(e) => setMargenObjetivoPct(Number(e.target.value))}
                className="w-full accent-orange-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>5% (Mínimo)</span>
                <span className="font-semibold text-slate-600">
                  {OPCIONES_MARGEN_POLLOS.find((o) => o.margenPct === margenObjetivoPct)?.nombre || 'Personalizado'}
                </span>
                <span>50% (Gourmet)</span>
              </div>
            </div>

            {/* TARJETA RESULTADO: PRECIO SUGERIDO DESTACADO */}
            <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-amber-500/5 rounded-2xl p-4 border border-amber-300/80 mb-4">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                  Precio Sugerido ({modalidadVista === 'en_canal' ? 'En Canal' : 'En Pie'})
                </span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  +{formatCOP(preciosModalidadActiva.gananciaPorKg)}/kg ganancia
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {formatCOP(preciosModalidadActiva.precioSugeridoKg)}
                </span>
                <span className="text-xs font-bold text-slate-500">/ Kilo (COP)</span>
              </div>

              {/* Sub-tarjetas de equivalencias: Libra y Ave Entera */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-amber-200/60 text-xs">
                <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                    Por Libra (500g)
                  </span>
                  <span className="font-black text-slate-800 text-sm">
                    {formatCOP(preciosModalidadActiva.precioSugeridoLibra)} / lb
                  </span>
                  <span className="text-[9px] text-slate-500 block">Venta tradicional</span>
                </div>

                <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                    Pollo Completo
                  </span>
                  <span className="font-black text-slate-800 text-sm">
                    {formatCOP(preciosModalidadActiva.precioSugeridoAve)} / ave
                  </span>
                  <span className="text-[9px] text-slate-500 block">
                    ~{modalidadVista === 'en_canal' ? '2.1' : '2.7'} kg promedio
                  </span>
                </div>
              </div>

              {/* Costo Base de Producción */}
              <div className="flex justify-between items-center text-xs mt-3 pt-2 border-t border-amber-200/60 text-slate-600">
                <span>Costo base de producción:</span>
                <span className="font-bold text-slate-800">
                  {formatCOP(preciosModalidadActiva.costoUnitarioKg)} COP/kg ({formatCOP(preciosModalidadActiva.costoUnitarioLibra)} COP/lb)
                </span>
              </div>
            </div>

            {/* DIAGNÓSTICO COMERCIAL */}
            <div
              className={`p-3 rounded-2xl border text-xs mb-3 flex items-start gap-2.5 ${
                analisisPrecios.diagnostico.estado === 'optimo'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : analisisPrecios.diagnostico.estado === 'bajo_margen'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="mt-0.5">
                {analisisPrecios.diagnostico.estado === 'optimo' && '✅'}
                {analisisPrecios.diagnostico.estado === 'bajo_margen' && '⚠️'}
                {analisisPrecios.diagnostico.estado === 'alerta_perdida' && '🚨'}
              </div>
              <div className="leading-snug">
                <span className="font-bold block mb-0.5">{analisisPrecios.diagnostico.titulo}</span>
                <span>{analisisPrecios.diagnostico.mensaje}</span>
              </div>
            </div>

            {/* BOTÓN TOGGLE DESGLOSE DETALLADO */}
            <button
              type="button"
              onClick={() => setMostrarDesgloseCostos(!mostrarDesgloseCostos)}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-between transition-all"
            >
              <span>{mostrarDesgloseCostos ? 'Ocultar Desglose de Costos' : 'Ver Desglose de Costos por Ave'}</span>
              {mostrarDesgloseCostos ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* TABLA EXPANDIBLE DESGLOSE */}
            {mostrarDesgloseCostos && (
              <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex justify-between">
                  <span>Rubros de Inversión por Ave</span>
                  <span className="lowercase">Modo: {analisisPrecios.desglose.modoActivo}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white p-2 rounded-xl border border-slate-100 flex justify-between items-center">
                    <span className="text-slate-600">🐣 Pollito BB</span>
                    <strong className="text-slate-900">{formatCOP(analisisPrecios.desglose.pollitoBB)}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100 flex justify-between items-center">
                    <span className="text-slate-600">🌾 Concentrado</span>
                    <strong className="text-slate-900">{formatCOP(analisisPrecios.desglose.alimentoConcentrado)}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100 flex justify-between items-center">
                    <span className="text-slate-600">🔥 Gas criadoras</span>
                    <strong className={analisisPrecios.desglose.gasCalefaccion === 0 ? 'text-emerald-600' : 'text-slate-900'}>
                      {analisisPrecios.desglose.gasCalefaccion === 0 ? '$0' : formatCOP(analisisPrecios.desglose.gasCalefaccion)}
                    </strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100 flex justify-between items-center">
                    <span className="text-slate-600">🪵 Viruta cama</span>
                    <strong className={analisisPrecios.desglose.virutaCama === 0 ? 'text-emerald-600' : 'text-slate-900'}>
                      {analisisPrecios.desglose.virutaCama === 0 ? '$0' : formatCOP(analisisPrecios.desglose.virutaCama)}
                    </strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100 flex justify-between items-center">
                    <span className="text-slate-600">💊 Sanidad / Vacunas</span>
                    <strong className={analisisPrecios.desglose.medicamentosSanidad === 0 ? 'text-emerald-600' : 'text-slate-900'}>
                      {analisisPrecios.desglose.medicamentosSanidad === 0 ? '$0' : formatCOP(analisisPrecios.desglose.medicamentosSanidad)}
                    </strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100 flex justify-between items-center">
                    <span className="text-slate-600">🔪 Faenado / Canal</span>
                    <strong className="text-slate-900">{formatCOP(analisisPrecios.desglose.manoObraBeneficio)}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100 flex justify-between items-center">
                    <span className="text-slate-600">🚚 Fletes / Logística</span>
                    <strong className={analisisPrecios.desglose.fletesTransporte === 0 ? 'text-emerald-600' : 'text-slate-900'}>
                      {analisisPrecios.desglose.fletesTransporte === 0 ? '$0' : formatCOP(analisisPrecios.desglose.fletesTransporte)}
                    </strong>
                  </div>
                  {analisisPrecios.desglose.ahorroBsf > 0 && (
                    <div className="bg-indigo-50 p-2 rounded-xl border border-indigo-100 flex justify-between items-center">
                      <span className="text-indigo-700">🪰 Ahorro Mosca BSF</span>
                      <strong className="text-indigo-900">-{formatCOP(analisisPrecios.desglose.ahorroBsf)}</strong>
                    </div>
                  )}
                </div>

                {/* Notas explicativas del modo */}
                <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 space-y-1">
                  {analisisPrecios.desglose.notasExplicativas.map((nota, i) => (
                    <p key={i}>• {nota}</p>
                  ))}
                </div>
              </div>
            )}
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
