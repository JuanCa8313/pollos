import {
  dbPollos,
  LotePollo,
  RegistroMortalidadPollo,
  RegistroAlimentoPollo,
  VentaPollo,
  GastoPollo,
  ClienteLocal,
  AbonoCartera,
  emitPollosUpdated,
} from './db';
import { getSupabaseClient } from './supabase';

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  error: string | null;
}

let syncStatus: SyncStatus = {
  isSyncing: false,
  lastSyncedAt: null,
  error: null,
};

export function getPollosSyncStatus(): SyncStatus {
  return { ...syncStatus };
}

function notifySyncState() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('granja-pollos-sync-status', {
        detail: { ...syncStatus },
      })
    );
  }
}

/**
 * PUSH: Envía todos los registros locales de Dexie hacia las tablas remotas de Supabase
 */
export async function sincronizarPollosPush(): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase no está configurado' };
  }

  try {
    // 1. Lotes
    const lotes = await dbPollos.lotes.toArray();
    if (lotes.length > 0) {
      const payloadLotes = lotes.map((l: LotePollo) => ({
        id: l.id,
        nombre: l.nombre,
        fecha_inicio: l.fechaInicio,
        cantidad_inicial: Number(l.cantidadInicial) || 0,
        cantidad_actual: Number(l.cantidadActual) || 0,
        raza: l.raza || 'Ross 308',
        costo_pollito_unitario: Number(l.costoPollitoUnitario) || 0,
        peso_promedio_actual_kg: l.pesoPromedioActualKg ? Number(l.pesoPromedioActualKg) : null,
        activo: Boolean(l.activo),
        notas: l.notas || null,
        created_at: l.createdAt || new Date().toISOString(),
      }));
      const { error: errLotes } = await supabase.from('pollos_lotes').upsert(payloadLotes, { onConflict: 'id' });
      if (errLotes) throw new Error(`Error en pollos_lotes: ${errLotes.message}`);
    }

    // 2. Mortalidad
    const mortalidad = await dbPollos.mortalidad.toArray();
    if (mortalidad.length > 0) {
      const payloadMortalidad = mortalidad.map((m: RegistroMortalidadPollo) => ({
        id: m.id,
        lote_id: m.loteId,
        fecha: m.fecha,
        cantidad: Number(m.cantidad) || 0,
        causa: m.causa || null,
        notas: m.notas || null,
        created_at: m.createdAt || new Date().toISOString(),
      }));
      const { error: errMort } = await supabase.from('pollos_mortalidad').upsert(payloadMortalidad, { onConflict: 'id' });
      if (errMort) throw new Error(`Error en pollos_mortalidad: ${errMort.message}`);
    }

    // 3. Alimento
    const alimento = await dbPollos.alimento.toArray();
    if (alimento.length > 0) {
      const payloadAlimento = alimento.map((a: RegistroAlimentoPollo) => ({
        id: a.id,
        lote_id: a.loteId,
        fecha: a.fecha,
        tipo_alimento: a.tipoAlimento,
        cantidad_kg: Number(a.cantidadKg) || 0,
        costo_total_cop: Number(a.costoTotalCop) || 0,
        notas: a.notas || null,
        created_at: a.createdAt || new Date().toISOString(),
      }));
      const { error: errAlim } = await supabase.from('pollos_alimento').upsert(payloadAlimento, { onConflict: 'id' });
      if (errAlim) throw new Error(`Error en pollos_alimento: ${errAlim.message}`);
    }

    // 4. Clientes
    const clientes = await dbPollos.clientes.toArray();
    if (clientes.length > 0) {
      const payloadClientes = clientes.map((c: ClienteLocal) => ({
        id: c.id,
        nombre: c.nombre,
        telefono: c.telefono || null,
        direccion: c.direccion || null,
        saldo_pendiente: Number(c.saldoPendiente) || 0,
        activo: Boolean(c.activo),
        created_at: c.createdAt || new Date().toISOString(),
      }));
      const { error: errCli } = await supabase.from('pollos_clientes').upsert(payloadClientes, { onConflict: 'id' });
      if (errCli) throw new Error(`Error en pollos_clientes: ${errCli.message}`);
    }

    // 5. Ventas
    const ventas = await dbPollos.ventas.toArray();
    if (ventas.length > 0) {
      const payloadVentas = ventas.map((v: VentaPollo) => ({
        id: v.id,
        lote_id: v.loteId,
        fecha: v.fecha,
        modalidad: v.modalidad || 'en_pie',
        cantidad_aves: Number(v.cantidadAves) || 0,
        peso_total_kg: Number(v.pesoTotalKg) || 0,
        precio_unitario: Number(v.precioUnitario) || 0,
        total_cop: Number(v.totalCop) || 0,
        metodo_pago: v.metodoPago || 'efectivo',
        cliente_id: v.clienteId || null,
        nombre_cliente: v.nombreCliente || null,
        notas: v.notas || null,
        created_at: v.createdAt || new Date().toISOString(),
      }));
      const { error: errVentas } = await supabase.from('pollos_ventas').upsert(payloadVentas, { onConflict: 'id' });
      if (errVentas) throw new Error(`Error en pollos_ventas: ${errVentas.message}`);
    }

    // 6. Gastos
    const gastos = await dbPollos.gastos.toArray();
    if (gastos.length > 0) {
      const payloadGastos = gastos.map((g: GastoPollo) => ({
        id: g.id,
        lote_id: g.loteId || null,
        fecha: g.fecha,
        categoria: g.categoria,
        descripcion: g.descripcion,
        monto_cop: Number(g.montoCop) || 0,
        metodo_pago: g.metodoPago || 'efectivo',
        created_at: g.createdAt || new Date().toISOString(),
      }));
      const { error: errGastos } = await supabase.from('pollos_gastos').upsert(payloadGastos, { onConflict: 'id' });
      if (errGastos) throw new Error(`Error en pollos_gastos: ${errGastos.message}`);
    }

    // 7. Abonos
    const abonos = await dbPollos.abonos.toArray();
    if (abonos.length > 0) {
      const payloadAbonos = abonos.map((ab: AbonoCartera) => ({
        id: ab.id,
        cliente_id: ab.clienteId,
        fecha: ab.fecha,
        monto_cop: Number(ab.montoCop) || 0,
        metodo_pago: ab.metodoPago || 'efectivo',
        notas: ab.notas || null,
        created_at: ab.createdAt || new Date().toISOString(),
      }));
      const { error: errAbonos } = await supabase.from('pollos_abonos').upsert(payloadAbonos, { onConflict: 'id' });
      if (errAbonos) throw new Error(`Error en pollos_abonos: ${errAbonos.message}`);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error en sincronizarPollosPush:', err);
    return { success: false, error: err.message || 'Error desconocido' };
  }
}

/**
 * PULL: Trae los registros remotos de Supabase y los sincroniza en la base local Dexie
 */
export async function sincronizarPollosPull(): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase no está configurado' };
  }

  try {
    // 1. Lotes
    const { data: remoteLotes, error: errLotes } = await supabase.from('pollos_lotes').select('*');
    if (errLotes) throw errLotes;
    if (remoteLotes && remoteLotes.length > 0) {
      const mappedLotes: LotePollo[] = remoteLotes.map((row: any) => ({
        id: row.id,
        nombre: row.nombre,
        fechaInicio: row.fecha_inicio,
        cantidadInicial: Number(row.cantidad_inicial),
        cantidadActual: Number(row.cantidad_actual),
        raza: row.raza,
        costoPollitoUnitario: Number(row.costo_pollito_unitario),
        pesoPromedioActualKg: row.peso_promedio_actual_kg ? Number(row.peso_promedio_actual_kg) : undefined,
        activo: Boolean(row.activo),
        notas: row.notas || undefined,
        createdAt: row.created_at,
      }));
      await dbPollos.lotes.bulkPut(mappedLotes);
    }

    // 2. Mortalidad
    const { data: remoteMort, error: errMort } = await supabase.from('pollos_mortalidad').select('*');
    if (errMort) throw errMort;
    if (remoteMort && remoteMort.length > 0) {
      const mappedMort: RegistroMortalidadPollo[] = remoteMort.map((row: any) => ({
        id: row.id,
        loteId: row.lote_id,
        fecha: row.fecha,
        cantidad: Number(row.cantidad),
        causa: row.causa,
        notas: row.notas || undefined,
        createdAt: row.created_at,
      }));
      await dbPollos.mortalidad.bulkPut(mappedMort);
    }

    // 3. Alimento
    const { data: remoteAlim, error: errAlim } = await supabase.from('pollos_alimento').select('*');
    if (errAlim) throw errAlim;
    if (remoteAlim && remoteAlim.length > 0) {
      const mappedAlim: RegistroAlimentoPollo[] = remoteAlim.map((row: any) => ({
        id: row.id,
        loteId: row.lote_id,
        fecha: row.fecha,
        tipoAlimento: row.tipo_alimento,
        cantidadKg: Number(row.cantidad_kg),
        costoTotalCop: Number(row.costo_total_cop),
        notas: row.notas || undefined,
        createdAt: row.created_at,
      }));
      await dbPollos.alimento.bulkPut(mappedAlim);
    }

    // 4. Clientes
    const { data: remoteCli, error: errCli } = await supabase.from('pollos_clientes').select('*');
    if (errCli) throw errCli;
    if (remoteCli && remoteCli.length > 0) {
      const mappedCli: ClienteLocal[] = remoteCli.map((row: any) => ({
        id: row.id,
        nombre: row.nombre,
        telefono: row.telefono || undefined,
        direccion: row.direccion || undefined,
        saldoPendiente: Number(row.saldo_pendiente),
        activo: Boolean(row.activo),
        createdAt: row.created_at,
      }));
      await dbPollos.clientes.bulkPut(mappedCli);
    }

    // 5. Ventas
    const { data: remoteVentas, error: errVentas } = await supabase.from('pollos_ventas').select('*');
    if (errVentas) throw errVentas;
    if (remoteVentas && remoteVentas.length > 0) {
      const mappedVentas: VentaPollo[] = remoteVentas.map((row: any) => ({
        id: row.id,
        loteId: row.lote_id,
        fecha: row.fecha,
        modalidad: row.modalidad,
        cantidadAves: Number(row.cantidad_aves),
        pesoTotalKg: Number(row.peso_total_kg),
        precioUnitario: Number(row.precio_unitario),
        totalCop: Number(row.total_cop),
        metodoPago: row.metodo_pago,
        clienteId: row.cliente_id || undefined,
        nombreCliente: row.nombre_cliente || undefined,
        notas: row.notas || undefined,
        createdAt: row.created_at,
      }));
      await dbPollos.ventas.bulkPut(mappedVentas);
    }

    // 6. Gastos
    const { data: remoteGastos, error: errGastos } = await supabase.from('pollos_gastos').select('*');
    if (errGastos) throw errGastos;
    if (remoteGastos && remoteGastos.length > 0) {
      const mappedGastos: GastoPollo[] = remoteGastos.map((row: any) => ({
        id: row.id,
        loteId: row.lote_id || undefined,
        fecha: row.fecha,
        categoria: row.categoria,
        descripcion: row.descripcion,
        montoCop: Number(row.monto_cop),
        metodoPago: row.metodo_pago,
        createdAt: row.created_at,
      }));
      await dbPollos.gastos.bulkPut(mappedGastos);
    }

    // 7. Abonos
    const { data: remoteAbonos, error: errAbonos } = await supabase.from('pollos_abonos').select('*');
    if (errAbonos) throw errAbonos;
    if (remoteAbonos && remoteAbonos.length > 0) {
      const mappedAbonos: AbonoCartera[] = remoteAbonos.map((row: any) => ({
        id: row.id,
        clienteId: row.cliente_id,
        fecha: row.fecha,
        montoCop: Number(row.monto_cop),
        metodoPago: row.metodo_pago,
        notas: row.notas || undefined,
        createdAt: row.created_at,
      }));
      await dbPollos.abonos.bulkPut(mappedAbonos);
    }

    emitPollosUpdated();
    return { success: true };
  } catch (err: any) {
    console.error('Error en sincronizarPollosPull:', err);
    return { success: false, error: err.message || 'Error desconocido' };
  }
}

/**
 * SINCRONIZACIÓN HÍBRIDA BIDIRECCIONAL:
 * 1. Primero hace Push de los datos locales a Supabase.
 * 2. Luego hace Pull de Supabase a la base local para reconciliar otros dispositivos.
 */
export async function sincronizarPollos(): Promise<SyncStatus> {
  if (syncStatus.isSyncing) return syncStatus;

  syncStatus.isSyncing = true;
  syncStatus.error = null;
  notifySyncState();

  try {
    const pushRes = await sincronizarPollosPush();
    if (!pushRes.success) {
      throw new Error(pushRes.error || 'Error al enviar a Supabase');
    }

    const pullRes = await sincronizarPollosPull();
    if (!pullRes.success) {
      throw new Error(pullRes.error || 'Error al descargar de Supabase');
    }

    syncStatus.lastSyncedAt = new Date();
    syncStatus.error = null;
  } catch (err: any) {
    syncStatus.error = err.message || 'Error en sincronización';
  } finally {
    syncStatus.isSyncing = false;
    notifySyncState();
  }

  return syncStatus;
}
