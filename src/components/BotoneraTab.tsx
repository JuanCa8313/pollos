'use client';

import React, { useState, useEffect } from 'react';
import { dbPollos, emitPollosUpdated, type LotePollo, type ClienteLocal } from '../lib/db';
import { ShoppingBag, Wheat, Bug, Skull, Receipt, HandCoins, Check, X, MessageCircle, Trash2 } from 'lucide-react';
import { formatCOP } from '../lib/utils';
import type { VentaPollo } from '../lib/db';

export function BotoneraTab() {
  const [lotes, setLotes] = useState<LotePollo[]>([]);
  const [clientes, setClientes] = useState<ClienteLocal[]>([]);
  const [selectedLoteId, setSelectedLoteId] = useState<string>('');
  const [ventasRecientes, setVentasRecientes] = useState<VentaPollo[]>([]);
  const [ultimaVenta, setUltimaVenta] = useState<VentaPollo | null>(null);
  
  // Modales
  const [modalType, setModalType] = useState<
    'venta' | 'alimento' | 'bsf' | 'mortalidad' | 'gasto' | 'abono' | null
  >(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Estados de formularios
  // Venta
  const [modalidadVenta, setModalidadVenta] = useState<'en_pie' | 'en_canal'>('en_canal');
  const [unidadPeso, setUnidadPeso] = useState<'kg' | 'lb'>('kg');
  const [cantidadAvesVenta, setCantidadAvesVenta] = useState<number>(1);
  const [pesoEntrada, setPesoEntrada] = useState<number>(2.7);
  const [precioPorKg, setPrecioPorKg] = useState<number>(13500); // Promedio pueblo canal COP/kg
  const [metodoPagoVenta, setMetodoPagoVenta] = useState<'efectivo' | 'transferencia' | 'fiado'>('efectivo');
  const [clienteIdVenta, setClienteIdVenta] = useState<string>('');
  const [nuevoClienteNombre, setNuevoClienteNombre] = useState<string>('');

  // Alimento
  const [tipoAlimento, setTipoAlimento] = useState<'iniciacion' | 'engorde' | 'finalizador'>('engorde');
  const [cantidadAlimentoKg, setCantidadAlimentoKg] = useState<number>(40);
  const [costoAlimentoCop, setCostoAlimentoCop] = useState<number>(115000); // Bulto aprox 40kg

  // BSF
  const [cantidadBsfKg, setCantidadBsfKg] = useState<number>(2);

  // Mortalidad
  const [cantidadMortalidad, setCantidadMortalidad] = useState<number>(1);
  const [causaMortalidad, setCausaMortalidad] = useState<'frio' | 'ascitis_infarto' | 'accidente' | 'enfermedad' | 'otra'>('ascitis_infarto');

  // Gasto
  const [categoriaGasto, setCategoriaGasto] = useState<'gas_calefaccion' | 'viruta_cama' | 'medicamentos_vitaminas' | 'fletes' | 'mano_obra' | 'otro'>('viruta_cama');
  const [descripcionGasto, setDescripcionGasto] = useState<string>('');
  const [montoGastoCop, setMontoGastoCop] = useState<number>(25000);
  const [metodoPagoGasto, setMetodoPagoGasto] = useState<'efectivo' | 'transferencia'>('efectivo');

  // Abono
  const [clienteIdAbono, setClienteIdAbono] = useState<string>('');
  const [montoAbonoCop, setMontoAbonoCop] = useState<number>(50000);
  const [metodoPagoAbono, setMetodoPagoAbono] = useState<'efectivo' | 'transferencia'>('efectivo');

  const cargarDatos = async () => {
    const listLotes = await dbPollos.lotes.where('activo').equals(1).toArray();
    setLotes(listLotes);
    if (listLotes.length > 0 && !selectedLoteId) {
      setSelectedLoteId(listLotes[0].id);
    }
    const listClientes = await dbPollos.clientes.where('activo').equals(1).toArray();
    setClientes(listClientes);
    if (listClientes.length > 0 && !clienteIdVenta) {
      setClienteIdVenta(listClientes[0].id);
      setClienteIdAbono(listClientes[0].id);
    }
    const listVentas = await dbPollos.ventas.reverse().limit(5).toArray();
    setVentasRecientes(listVentas);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const notificar = (msg: string) => {
    setMensajeExito(msg);
    emitPollosUpdated();
    setTimeout(() => setMensajeExito(null), 3000);
  };

  // Convertir a Kilos reales para base de datos y zootecnia
  // Si unidad es 'lb', 1 lb tradicional = 0.5 kg
  const pesoKgCalculado = unidadPeso === 'lb' ? Number((pesoEntrada * 0.5).toFixed(2)) : Number(pesoEntrada);
  const totalCalculadoVenta = Math.round(pesoKgCalculado * precioPorKg);

  // 1. Guardar Venta
  const handleGuardarVenta = async () => {
    if (!selectedLoteId) return;
    const lote = lotes.find((l) => l.id === selectedLoteId);
    if (!lote) return;

    let targetClienteId = clienteIdVenta;
    let targetClienteNombre = clientes.find((c) => c.id === clienteIdVenta)?.nombre || 'Cliente Ocasional';

    if (nuevoClienteNombre.trim()) {
      const nuevoId = 'cli-' + Date.now();
      await dbPollos.clientes.add({
        id: nuevoId,
        nombre: nuevoClienteNombre.trim(),
        saldoPendiente: 0,
        activo: true,
        createdAt: new Date().toISOString(),
      });
      targetClienteId = nuevoId;
      targetClienteNombre = nuevoClienteNombre.trim();
    }

    const nuevaVenta: VentaPollo = {
      id: 'ven-' + Date.now(),
      loteId: selectedLoteId,
      fecha: new Date().toISOString().split('T')[0],
      modalidad: modalidadVenta,
      cantidadAves: Number(cantidadAvesVenta),
      pesoTotalKg: pesoKgCalculado,
      precioUnitario: Number(precioPorKg),
      totalCop: totalCalculadoVenta,
      metodoPago: metodoPagoVenta,
      clienteId: targetClienteId,
      nombreCliente: targetClienteNombre,
      createdAt: new Date().toISOString(),
    };

    await dbPollos.ventas.add(nuevaVenta);
    setUltimaVenta(nuevaVenta);

    // Actualizar cantidad actual de aves del lote
    const nuevasAves = Math.max(0, lote.cantidadActual - Number(cantidadAvesVenta));
    await dbPollos.lotes.update(lote.id, { cantidadActual: nuevasAves });

    // Si fue fiado, actualizar saldo del cliente
    if (metodoPagoVenta === 'fiado' && targetClienteId) {
      const cliente = await dbPollos.clientes.get(targetClienteId);
      if (cliente) {
        await dbPollos.clientes.update(targetClienteId, {
          saldoPendiente: (cliente.saldoPendiente || 0) + totalCalculadoVenta,
        });
      }
    }

    await cargarDatos();
    setModalType(null);
    notificar(`¡Venta registrada! ${cantidadAvesVenta} pollos (${pesoKgCalculado} kg) por ${formatCOP(totalCalculadoVenta)}`);
  };

  const handleEliminarVenta = async (venta: VentaPollo) => {
    if (!confirm(`¿Deseas anular la venta de ${venta.cantidadAves} pollos a ${venta.nombreCliente}? Se devolverán las aves al lote.`)) return;

    await dbPollos.ventas.delete(venta.id);

    // Devolver aves al lote
    const lote = await dbPollos.lotes.get(venta.loteId);
    if (lote) {
      await dbPollos.lotes.update(lote.id, {
        cantidadActual: lote.cantidadActual + venta.cantidadAves,
      });
    }

    // Si fue fiado, restar de saldo
    if (venta.metodoPago === 'fiado' && venta.clienteId) {
      const cliente = await dbPollos.clientes.get(venta.clienteId);
      if (cliente) {
        await dbPollos.clientes.update(venta.clienteId, {
          saldoPendiente: Math.max(0, (cliente.saldoPendiente || 0) - venta.totalCop),
        });
      }
    }

    if (ultimaVenta?.id === venta.id) {
      setUltimaVenta(null);
    }

    await cargarDatos();
    notificar('Venta anulada y aves reintegradas al lote.');
  };

  const compartirReciboWhatsApp = (venta: VentaPollo) => {
    const texto = `🍗 *Comprobante de Entrega - Granja SomosGranja*\n\n` +
      `👤 Cliente: *${venta.nombreCliente || 'Cliente'}*\n` +
      `📅 Fecha: ${venta.fecha}\n` +
      `🐔 Cantidad: ${venta.cantidadAves} pollo(s) (${venta.modalidad === 'en_canal' ? 'En Canal' : 'En Pie'})\n` +
      `⚖️ Peso Total: ${venta.pesoTotalKg} kg (${(venta.pesoTotalKg * 2).toFixed(1)} lbs)\n` +
      `💰 Total: *${formatCOP(venta.totalCop)}*\n` +
      `💳 Pago: *${venta.metodoPago.toUpperCase()}*\n\n` +
      `¡Muchas gracias por apoyar nuestra producción local campesina a 2.200 msnm! 🌱`;

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  // 2. Guardar Alimento Purina
  const handleGuardarAlimento = async () => {
    if (!selectedLoteId) return;
    await dbPollos.alimento.add({
      id: 'ali-' + Date.now(),
      loteId: selectedLoteId,
      fecha: new Date().toISOString().split('T')[0],
      tipoAlimento: tipoAlimento,
      cantidadKg: Number(cantidadAlimentoKg),
      costoTotalCop: Number(costoAlimentoCop),
      createdAt: new Date().toISOString(),
    });
    setModalType(null);
    notificar(`Alimento registrado: ${cantidadAlimentoKg} kg (${formatCOP(costoAlimentoCop)})`);
  };

  // 3. Guardar Larva BSF (Costo $0)
  const handleGuardarBSF = async () => {
    if (!selectedLoteId) return;
    await dbPollos.alimento.add({
      id: 'bsf-' + Date.now(),
      loteId: selectedLoteId,
      fecha: new Date().toISOString().split('T')[0],
      tipoAlimento: 'mosca_soldado_viva',
      cantidadKg: Number(cantidadBsfKg),
      costoTotalCop: 0,
      notas: 'Larva viva BSF cosechada en finca (Costo $0)',
      createdAt: new Date().toISOString(),
    });
    setModalType(null);
    notificar(`¡Proteína Viva BSF! Suministrados ${cantidadBsfKg} kg de larva a costo $0`);
  };

  // 4. Guardar Mortalidad
  const handleGuardarMortalidad = async () => {
    if (!selectedLoteId) return;
    const lote = lotes.find((l) => l.id === selectedLoteId);
    if (!lote) return;

    await dbPollos.mortalidad.add({
      id: 'mor-' + Date.now(),
      loteId: selectedLoteId,
      fecha: new Date().toISOString().split('T')[0],
      cantidad: Number(cantidadMortalidad),
      causa: causaMortalidad,
      createdAt: new Date().toISOString(),
    });

    const nuevasAves = Math.max(0, lote.cantidadActual - Number(cantidadMortalidad));
    await dbPollos.lotes.update(lote.id, { cantidadActual: nuevasAves });

    await cargarDatos();
    setModalType(null);
    notificar(`Baja registrada: ${cantidadMortalidad} ave(s)`);
  };

  // 5. Guardar Gasto
  const handleGuardarGasto = async () => {
    await dbPollos.gastos.add({
      id: 'gas-' + Date.now(),
      loteId: selectedLoteId || undefined,
      fecha: new Date().toISOString().split('T')[0],
      categoria: categoriaGasto,
      descripcion: descripcionGasto || categoriaGasto.replace('_', ' '),
      montoCop: Number(montoGastoCop),
      metodoPago: metodoPagoGasto,
      createdAt: new Date().toISOString(),
    });
    setModalType(null);
    notificar(`Gasto registrado: ${formatCOP(montoGastoCop)}`);
  };

  // 6. Guardar Abono
  const handleGuardarAbono = async () => {
    if (!clienteIdAbono) return;
    const cliente = await dbPollos.clientes.get(clienteIdAbono);
    if (!cliente) return;

    await dbPollos.abonos.add({
      id: 'abo-' + Date.now(),
      clienteId: clienteIdAbono,
      fecha: new Date().toISOString().split('T')[0],
      montoCop: Number(montoAbonoCop),
      metodoPago: metodoPagoAbono,
      createdAt: new Date().toISOString(),
    });

    const nuevoSaldo = Math.max(0, (cliente.saldoPendiente || 0) - Number(montoAbonoCop));
    await dbPollos.clientes.update(clienteIdAbono, { saldoPendiente: nuevoSaldo });

    await cargarDatos();
    setModalType(null);
    notificar(`Abono registrado: ${formatCOP(montoAbonoCop)} de ${cliente.nombre}`);
  };

  const loteActivo = lotes.find((l) => l.id === selectedLoteId);

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto">
      {/* Alerta flotante */}
      {mensajeExito && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-emerald-600 text-white font-medium py-3 px-4 rounded-xl shadow-lg flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span>{mensajeExito}</span>
          </div>
        </div>
      )}

      {/* Selector de Lote Activo */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-5">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
          Lote de Engorde Activo
        </label>
        <select
          value={selectedLoteId}
          onChange={(e) => setSelectedLoteId(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {lotes.map((lote) => (
            <option key={lote.id} value={lote.id}>
              {lote.nombre} ({lote.cantidadActual} aves vivas)
            </option>
          ))}
        </select>
        {loteActivo && (
          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600 bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/60">
            <span>Raza: <strong>{loteActivo.raza}</strong></span>
            <span>Vivas: <strong className="text-amber-700">{loteActivo.cantidadActual}</strong> / {loteActivo.cantidadInicial}</span>
          </div>
        )}
      </div>

      {/* Cuadrícula de Botonera de 1 Toque */}
      <div className="grid grid-cols-2 gap-3.5 mb-6">
        {/* Botón 1: Venta de Pollos */}
        <button
          onClick={() => setModalType('venta')}
          className="bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white p-4 rounded-2xl shadow-md active:scale-95 transition-all flex flex-col items-center justify-center text-center gap-2 min-h-[125px]"
        >
          <div className="p-2.5 bg-white/20 rounded-xl">
            <ShoppingBag className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="font-bold text-base leading-tight">Vender Pollos</span>
          <span className="text-[11px] text-amber-100">En pie o en canal</span>
        </button>

        {/* Botón 2: Alimento Concentrado */}
        <button
          onClick={() => setModalType('alimento')}
          className="bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white p-4 rounded-2xl shadow-md active:scale-95 transition-all flex flex-col items-center justify-center text-center gap-2 min-h-[125px]"
        >
          <div className="p-2.5 bg-white/20 rounded-xl">
            <Wheat className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="font-bold text-base leading-tight">Concentrado</span>
          <span className="text-[11px] text-emerald-100">Engorde / Iniciación</span>
        </button>

        {/* Botón 3: Larva BSF (Proteína a Costo $0) */}
        <button
          onClick={() => setModalType('bsf')}
          className="bg-gradient-to-br from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white p-4 rounded-2xl shadow-md active:scale-95 transition-all flex flex-col items-center justify-center text-center gap-2 min-h-[125px]"
        >
          <div className="p-2.5 bg-white/20 rounded-xl">
            <Bug className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="font-bold text-base leading-tight">Proteína BSF</span>
          <span className="text-[11px] text-indigo-100">Larvas vivas (Costo $0)</span>
        </button>

        {/* Botón 4: Mortalidad / Bajas */}
        <button
          onClick={() => setModalType('mortalidad')}
          className="bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white p-4 rounded-2xl shadow-md active:scale-95 transition-all flex flex-col items-center justify-center text-center gap-2 min-h-[125px]"
        >
          <div className="p-2.5 bg-white/20 rounded-xl">
            <Skull className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="font-bold text-base leading-tight">Bajas / Muerte</span>
          <span className="text-[11px] text-rose-100">Frío o infarto</span>
        </button>

        {/* Botón 5: Gastos Galpón */}
        <button
          onClick={() => setModalType('gasto')}
          className="bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 p-4 rounded-2xl shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center text-center gap-2 min-h-[110px]"
        >
          <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
            <Receipt className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="font-bold text-sm leading-tight">Gasto Galpón</span>
          <span className="text-[10px] text-slate-500">Gas, viruta, fletes</span>
        </button>

        {/* Botón 6: Cobro Fiados / Abono */}
        <button
          onClick={() => setModalType('abono')}
          className="bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 p-4 rounded-2xl shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center text-center gap-2 min-h-[110px]"
        >
          <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700">
            <HandCoins className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="font-bold text-sm leading-tight">Cobrar Fiado</span>
          <span className="text-[10px] text-emerald-600">Abono de cliente</span>
        </button>
      </div>

      {/* Recibo Rápido de Última Venta por WhatsApp */}
      {ultimaVenta && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 mb-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
              ✅ Venta Registrada a {ultimaVenta.nombreCliente}
            </span>
            <span className="text-sm font-black text-slate-800 block">
              {ultimaVenta.cantidadAves} pollos ({ultimaVenta.pesoTotalKg} kg) • {formatCOP(ultimaVenta.totalCop)}
            </span>
            <span className="text-[10px] text-slate-500 capitalize">Pago: {ultimaVenta.metodoPago}</span>
          </div>

          <button
            onClick={() => compartirReciboWhatsApp(ultimaVenta)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl shadow-md text-xs flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Recibo WA</span>
          </button>
        </div>
      )}

      {/* Historial de Ventas Recientes */}
      {ventasRecientes.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-6">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ventas Recientes
            </span>
            <span className="text-[10px] text-slate-400">Últimos movimientos</span>
          </div>

          <div className="space-y-2">
            {ventasRecientes.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800 block">{v.nombreCliente}</span>
                  <span className="text-[11px] text-slate-500">
                    {v.cantidadAves} ave(s) • {v.pesoTotalKg} kg • <strong className="text-slate-700">{formatCOP(v.totalCop)}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => compartirReciboWhatsApp(v)}
                    className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all"
                    title="Enviar recibo por WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleEliminarVenta(v)}
                    className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-all"
                    title="Anular venta y devolver aves"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: VENTA DE POLLOS */}
      {modalType === 'venta' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-600" />
                Registrar Venta de Pollos
              </h3>
              <button onClick={() => setModalType(null)} className="p-1 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Modalidad */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Modalidad de Venta</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModalidadVenta('en_canal');
                      setPrecioPorKg(13500);
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all ${
                      modalidadVenta === 'en_canal'
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    En Canal (Beneficiado)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalidadVenta('en_pie');
                      setPrecioPorKg(9500);
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all ${
                      modalidadVenta === 'en_pie'
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    En Pie (Vivo en báscula)
                  </button>
                </div>
              </div>

              {/* Cantidad de Aves y Unidad de Peso */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Nº Pollos</label>
                  <input
                    type="number"
                    min="1"
                    value={cantidadAvesVenta}
                    onChange={(e) => {
                      const cant = Number(e.target.value);
                      setCantidadAvesVenta(cant);
                      const baseKg = Number((cant * 2.7).toFixed(1));
                      setPesoEntrada(unidadPeso === 'lb' ? Number((baseKg * 2).toFixed(1)) : baseKg);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Unidad Báscula</label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        if (unidadPeso === 'lb') {
                          setPesoEntrada(Number((pesoEntrada * 0.5).toFixed(1)));
                        }
                        setUnidadPeso('kg');
                      }}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        unidadPeso === 'kg' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      Kilos (kg)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (unidadPeso === 'kg') {
                          setPesoEntrada(Number((pesoEntrada * 2).toFixed(1)));
                        }
                        setUnidadPeso('lb');
                      }}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        unidadPeso === 'lb' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      Libras (lb)
                    </button>
                  </div>
                </div>
              </div>

              {/* Peso ingresado */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Peso Total Marcado en Báscula ({unidadPeso.toUpperCase()})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    value={pesoEntrada}
                    onChange={(e) => setPesoEntrada(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                  />
                  {unidadPeso === 'lb' && (
                    <span className="absolute right-3 top-2 text-xs font-semibold text-slate-400">
                      = {(pesoEntrada * 0.5).toFixed(2)} kg
                    </span>
                  )}
                </div>
              </div>

              {/* Precio por Kilo */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Precio por Kilo (COP) {unidadPeso === 'lb' ? `(Aprox ${formatCOP(Math.round(precioPorKg * 0.5))}/lb)` : ''}
                </label>
                <input
                  type="number"
                  step="500"
                  value={precioPorKg}
                  onChange={(e) => setPrecioPorKg(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                />
              </div>

              {/* Total Calculado */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex justify-between items-center">
                <span className="text-xs font-semibold text-amber-900">Total a Cobrar:</span>
                <span className="font-black text-lg text-amber-700">
                  {formatCOP(totalCalculadoVenta)}
                </span>
              </div>

              {/* Método de Pago */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Método de Pago</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['efectivo', 'transferencia', 'fiado'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMetodoPagoVenta(m)}
                      className={`py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                        metodoPagoVenta === m
                          ? 'bg-slate-900 text-white shadow'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cliente */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Cliente</label>
                <select
                  value={clienteIdVenta}
                  onChange={(e) => setClienteIdVenta(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 mb-2"
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.saldoPendiente > 0 ? `(Debe ${formatCOP(c.saldoPendiente)})` : ''}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="O escribe nombre de nuevo cliente..."
                  value={nuevoClienteNombre}
                  onChange={(e) => setNuevoClienteNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400"
                />
              </div>

              <button
                onClick={handleGuardarVenta}
                className="w-full mt-2 bg-orange-600 hover:bg-orange-700 text-white font-black py-3 rounded-2xl shadow-lg active:scale-95 transition-all text-sm"
              >
                Confirmar y Registrar Venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUMINISTRO ALIMENTO CONCENTRADO */}
      {modalType === 'alimento' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <Wheat className="w-5 h-5 text-emerald-600" />
                Registrar Concentrado
              </h3>
              <button onClick={() => setModalType(null)} className="p-1 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Etapa de Alimentación</label>
                <select
                  value={tipoAlimento}
                  onChange={(e) => setTipoAlimento(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  <option value="engorde">Engorde (Día 22 al sacrificio)</option>
                  <option value="iniciacion">Iniciación (Día 1 al 21)</option>
                  <option value="finalizador">Finalizador / Retiro</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Kilos Suministrados</label>
                  <input
                    type="number"
                    min="1"
                    value={cantidadAlimentoKg}
                    onChange={(e) => setCantidadAlimentoKg(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Costo Total (COP)</label>
                  <input
                    type="number"
                    step="5000"
                    value={costoAlimentoCop}
                    onChange={(e) => setCostoAlimentoCop(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                  />
                </div>
              </div>

              <button
                onClick={handleGuardarAlimento}
                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-2xl shadow-lg active:scale-95 transition-all text-sm"
              >
                Guardar Consumo de Purina
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LARVAS BSF */}
      {modalType === 'bsf' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <Bug className="w-5 h-5 text-indigo-600" />
                Proteína Viva BSF (Costo $0)
              </h3>
              <button onClick={() => setModalType(null)} className="p-1 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl mb-3 text-xs text-indigo-900">
              💡 <strong>Economía Circular:</strong> Cada kilo de larva viva sustituye hasta 400g de concentrado comercial aportando 40% de proteína y grasa natural.
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Kilos de Larva Cosechada</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  value={cantidadBsfKg}
                  onChange={(e) => setCantidadBsfKg(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                />
              </div>

              <button
                onClick={handleGuardarBSF}
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-2xl shadow-lg active:scale-95 transition-all text-sm"
              >
                Registrar Suministro BSF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MORTALIDAD */}
      {modalType === 'mortalidad' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <Skull className="w-5 h-5 text-rose-600" />
                Registrar Bajas (Mortalidad)
              </h3>
              <button onClick={() => setModalType(null)} className="p-1 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Cantidad de Aves Muertas</label>
                <input
                  type="number"
                  min="1"
                  value={cantidadMortalidad}
                  onChange={(e) => setCantidadMortalidad(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Causa Probable (2.200 msnm)</label>
                <select
                  value={causaMortalidad}
                  onChange={(e) => setCausaMortalidad(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  <option value="ascitis_infarto">Infarto / Ascitis (Líquido por frío/altura)</option>
                  <option value="frio">Hipotermia / Frío nocturno</option>
                  <option value="accidente">Aplastamiento / Accidente</option>
                  <option value="enfermedad">Enfermedad respiratoria</option>
                  <option value="otra">Otra causa</option>
                </select>
              </div>

              <button
                onClick={handleGuardarMortalidad}
                className="w-full mt-2 bg-rose-600 hover:bg-rose-700 text-white font-black py-3 rounded-2xl shadow-lg active:scale-95 transition-all text-sm"
              >
                Confirmar Baja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GASTO */}
      {modalType === 'gasto' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-slate-700" />
                Registrar Gasto de Galpón
              </h3>
              <button onClick={() => setModalType(null)} className="p-1 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Categoría</label>
                <select
                  value={categoriaGasto}
                  onChange={(e) => setCategoriaGasto(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  <option value="viruta_cama">Viruta / Cascarilla de arroz</option>
                  <option value="gas_calefaccion">Gas propano / Calefacción</option>
                  <option value="medicamentos_vitaminas">Medicamentos / Vitaminas</option>
                  <option value="fletes">Flete / Transporte</option>
                  <option value="mano_obra">Jornal / Mano de obra</option>
                  <option value="otro">Otro insumo</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Monto (COP)</label>
                <input
                  type="number"
                  step="5000"
                  value={montoGastoCop}
                  onChange={(e) => setMontoGastoCop(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Método de Pago</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMetodoPagoGasto('efectivo')}
                    className={`py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                      metodoPagoGasto === 'efectivo'
                        ? 'bg-slate-900 text-white shadow'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Efectivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodoPagoGasto('transferencia')}
                    className={`py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                      metodoPagoGasto === 'transferencia'
                        ? 'bg-slate-900 text-white shadow'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Transferencia
                  </button>
                </div>
              </div>

              <button
                onClick={handleGuardarGasto}
                className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white font-black py-3 rounded-2xl shadow-lg active:scale-95 transition-all text-sm"
              >
                Guardar Gasto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COBRAR FIADO (ABONO) */}
      {modalType === 'abono' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <HandCoins className="w-5 h-5 text-emerald-600" />
                Cobrar Fiado / Abono de Cartera
              </h3>
              <button onClick={() => setModalType(null)} className="p-1 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Cliente</label>
                <select
                  value={clienteIdAbono}
                  onChange={(e) => setClienteIdAbono(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  {clientes
                    .filter((c) => c.saldoPendiente > 0)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} (Debe {formatCOP(c.saldoPendiente)})
                      </option>
                    ))}
                  {clientes.filter((c) => c.saldoPendiente > 0).length === 0 && (
                    <option value="">No hay clientes con saldo pendiente</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Monto a Abonar (COP)</label>
                <input
                  type="number"
                  step="5000"
                  value={montoAbonoCop}
                  onChange={(e) => setMontoAbonoCop(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                />
              </div>

              <button
                onClick={handleGuardarAbono}
                disabled={!clienteIdAbono}
                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-3 rounded-2xl shadow-lg active:scale-95 transition-all text-sm"
              >
                Registrar Cobro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
