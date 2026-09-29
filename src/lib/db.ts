import Dexie, { type Table } from 'dexie';

export interface LotePollo {
  id: string;
  nombre: string;
  fechaInicio: string;
  cantidadInicial: number;
  cantidadActual: number;
  raza: string;
  costoPollitoUnitario: number;
  pesoPromedioActualKg?: number;
  activo: boolean;
  notas?: string;
  createdAt: string;
}

export interface RegistroMortalidadPollo {
  id: string;
  loteId: string;
  fecha: string;
  cantidad: number;
  causa?: 'frio' | 'ascitis_infarto' | 'accidente' | 'enfermedad' | 'otra';
  notas?: string;
  createdAt: string;
}

export interface RegistroAlimentoPollo {
  id: string;
  loteId: string;
  fecha: string;
  tipoAlimento: 'iniciacion' | 'engorde' | 'finalizador' | 'mosca_soldado_viva' | 'otro';
  cantidadKg: number;
  costoTotalCop: number; // 0 si es mosca soldado / residuo interno
  notas?: string;
  createdAt: string;
}

export interface VentaPollo {
  id: string;
  loteId: string;
  fecha: string;
  modalidad: 'en_pie' | 'en_canal';
  cantidadAves: number;
  pesoTotalKg: number;
  precioUnitario: number; // Precio por kg o por ave
  totalCop: number;
  metodoPago: 'efectivo' | 'transferencia' | 'fiado';
  clienteId?: string;
  nombreCliente?: string;
  notas?: string;
  createdAt: string;
}

export interface GastoPollo {
  id: string;
  loteId?: string;
  fecha: string;
  categoria:
    | 'concentrado'
    | 'alimento_concentrado'
    | 'gas_calefaccion'
    | 'viruta_cama'
    | 'medicamentos_vitaminas'
    | 'pollitos_bb'
    | 'fletes'
    | 'mano_obra'
    | 'otro';
  descripcion: string;
  montoCop: number;
  metodoPago: 'efectivo' | 'transferencia';
  createdAt: string;
}

export interface ClienteLocal {
  id: string;
  nombre: string;
  telefono?: string;
  direccion?: string;
  saldoPendiente: number;
  activo: boolean;
  createdAt: string;
}

export interface AbonoCartera {
  id: string;
  clienteId: string;
  fecha: string;
  montoCop: number;
  metodoPago: 'efectivo' | 'transferencia';
  notas?: string;
  createdAt: string;
}

export class PollosDatabase extends Dexie {
  lotes!: Table<LotePollo, string>;
  mortalidad!: Table<RegistroMortalidadPollo, string>;
  alimento!: Table<RegistroAlimentoPollo, string>;
  ventas!: Table<VentaPollo, string>;
  gastos!: Table<GastoPollo, string>;
  clientes!: Table<ClienteLocal, string>;
  abonos!: Table<AbonoCartera, string>;

  constructor() {
    super('PollosGranjaDB');
    this.version(1).stores({
      lotes: 'id, nombre, fechaInicio, activo',
      mortalidad: 'id, loteId, fecha',
      alimento: 'id, loteId, fecha, tipoAlimento',
      ventas: 'id, loteId, fecha, clienteId, metodoPago',
      gastos: 'id, loteId, fecha, categoria, metodoPago',
      clientes: 'id, nombre, activo',
      abonos: 'id, clienteId, fecha, metodoPago',
    });
  }
}

export const dbPollos = new PollosDatabase();

// Notificador reactivo local
export function emitPollosUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('granja-pollos-db-updated'));
  }
}

// Inicializador de datos predeterminados (incluye el lote actual de 2 meses)
export async function seedInitialPollosData() {
  if (typeof window !== 'undefined') {
    const seeded = localStorage.getItem('pollos_seed_done');
    if (seeded) return;
  }

  const lotesCount = await dbPollos.lotes.count();
  if (lotesCount === 0) {
    const hoy = new Date();
    // 2 meses atrás (aprox 60 días)
    const fechaLoteActual = new Date(hoy.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const loteActivo: LotePollo = {
      id: 'lote-engorde-actual',
      nombre: 'Lote 1 - Engorde Actual (2 meses)',
      fechaInicio: fechaLoteActual,
      cantidadInicial: 50,
      cantidadActual: 50,
      raza: 'Ross 308 (Blanco pesado)',
      costoPollitoUnitario: 3500,
      pesoPromedioActualKg: 2.7,
      activo: true,
      notas: 'Lote listo para sacrificio y venta en pueblo. Peso comercial estimado 2.7 kg promedio.',
      createdAt: new Date().toISOString(),
    };

    await dbPollos.lotes.add(loteActivo);

    // Cliente inicial del pueblo
    await dbPollos.clientes.add({
      id: 'cliente-pueblo-1',
      nombre: 'Cliente Pueblo / Asadero Local',
      telefono: '3000000000',
      direccion: 'Parque Principal',
      saldoPendiente: 0,
      activo: true,
      createdAt: new Date().toISOString(),
    });
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem('pollos_seed_done', 'true');
  }
}
