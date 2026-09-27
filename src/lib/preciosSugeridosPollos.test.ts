import assert from 'node:assert';
import {
  calcularPreciosSugeridosPollos,
  redondearPrecioComercial,
  OPCIONES_MARGEN_POLLOS,
  BENCHMARK_TEORICO_POLLO,
} from './preciosSugeridosPollos.ts';
import type { LotePollo, VentaPollo, RegistroAlimentoPollo, GastoPollo } from './db';

console.log('🧪 Iniciando pruebas de preciosSugeridosPollos...');

// 1. Redondeo comercial
assert.strictEqual(redondearPrecioComercial(13420), 13400);
assert.strictEqual(redondearPrecioComercial(13435), 13450);
assert.strictEqual(redondearPrecioComercial(13480), 13500);

// Mock data
const mockLote: LotePollo = {
  id: 'lote-1',
  nombre: 'Lote 1 Engorde',
  fechaInicio: '2026-08-01',
  cantidadInicial: 50,
  cantidadActual: 45,
  raza: 'Ross 308',
  costoPollitoUnitario: 3500,
  pesoPromedioActualKg: 2.7,
  activo: true,
  createdAt: '2026-08-01T00:00:00Z',
};

const mockAlimentos: RegistroAlimentoPollo[] = [
  {
    id: 'ali-1',
    loteId: 'lote-1',
    fecha: '2026-08-10',
    tipoAlimento: 'iniciacion',
    cantidadKg: 40,
    costoTotalCop: 120000,
    createdAt: '2026-08-10T00:00:00Z',
  },
  {
    id: 'ali-2',
    loteId: 'lote-1',
    fecha: '2026-08-25',
    tipoAlimento: 'engorde',
    cantidadKg: 120,
    costoTotalCop: 345000,
    createdAt: '2026-08-25T00:00:00Z',
  },
  {
    id: 'ali-3',
    loteId: 'lote-1',
    fecha: '2026-09-05',
    tipoAlimento: 'mosca_soldado_viva',
    cantidadKg: 10,
    costoTotalCop: 0,
    createdAt: '2026-09-05T00:00:00Z',
  },
];

const mockGastos: GastoPollo[] = [
  {
    id: 'gas-1',
    loteId: 'lote-1',
    fecha: '2026-08-02',
    categoria: 'gas_calefaccion',
    descripcion: 'Pipeta de gas para criadora',
    montoCop: 65000,
    metodoPago: 'efectivo',
    createdAt: '2026-08-02T00:00:00Z',
  },
  {
    id: 'gas-2',
    loteId: 'lote-1',
    fecha: '2026-08-03',
    categoria: 'viruta_cama',
    descripcion: '2 costales de viruta',
    montoCop: 20000,
    metodoPago: 'efectivo',
    createdAt: '2026-08-03T00:00:00Z',
  },
  {
    id: 'gas-3',
    loteId: 'lote-1',
    fecha: '2026-08-15',
    categoria: 'medicamentos_vitaminas',
    descripcion: 'Electrolitos y vitaminas antiestrés',
    montoCop: 22000,
    metodoPago: 'efectivo',
    createdAt: '2026-08-15T00:00:00Z',
  },
];

const mockVentas: VentaPollo[] = [
  {
    id: 'ven-1',
    loteId: 'lote-1',
    fecha: '2026-09-20',
    modalidad: 'en_canal',
    cantidadAves: 5,
    pesoTotalKg: 10.4,
    precioUnitario: 14000,
    totalCop: 145600,
    metodoPago: 'efectivo',
    createdAt: '2026-09-20T00:00:00Z',
  },
];

// Test 1: Modo Teórico Completo
console.log('Testing Modo Teórico...');
const resTeorico = calcularPreciosSugeridosPollos({
  lote: mockLote,
  modoCosteo: 'teorico_completo',
  margenObjetivoPct: 25,
});

assert(resTeorico.desglose.costoTotalPorAve > 18000, 'Costo teórico por ave debe ser razonable (>18000 COP)');
assert(resTeorico.canal.precioSugeridoKg > resTeorico.canal.costoUnitarioKg, 'Precio sugerido canal debe ser mayor a costo');
assert(resTeorico.enPie.precioSugeridoKg > resTeorico.enPie.costoUnitarioKg, 'Precio sugerido en pie debe ser mayor a costo');
assert(resTeorico.canal.precioSugeridoKg > resTeorico.enPie.precioSugeridoKg, 'Precio canal por kg debe ser mayor que precio en pie por kg');
assert.strictEqual(resTeorico.desglose.modoActivo, 'teorico_completo');

// Test 2: Modo P&L Real
console.log('Testing Modo P&L Real...');
const resPL = calcularPreciosSugeridosPollos({
  lote: mockLote,
  alimentosLote: mockAlimentos,
  gastosLote: mockGastos,
  ventasLote: mockVentas,
  modoCosteo: 'pl_real',
  margenObjetivoPct: 20,
  precioVentaActualKgCanal: 14000,
});

assert(resPL.desglose.costoPorKgCanal > 0, 'Costo por kg canal en PL debe ser > 0');
assert.strictEqual(resPL.desglose.modoActivo, 'pl_real');
assert(resPL.diagnostico.titulo.length > 0, 'Debe incluir diagnóstico');
assert(resPL.comparativo.plReal.costoKgCanal > 0, 'Comparativo debe incluir plReal');
assert(resPL.comparativo.facturasRecientes.costoKgCanal > 0, 'Comparativo debe incluir facturasRecientes');
assert(resPL.comparativo.teoricoCompleto.costoKgCanal > 0, 'Comparativo debe incluir teoricoCompleto');

// Test 3: Modo Facturas Recientes (Sin costos fantasma)
console.log('Testing Modo Facturas Recientes...');
const resFacturas = calcularPreciosSugeridosPollos({
  lote: mockLote,
  alimentosLote: mockAlimentos,
  gastosLote: mockGastos,
  modoCosteo: 'facturas_recientes',
  margenObjetivoPct: 30,
});

assert.strictEqual(resFacturas.desglose.modoActivo, 'facturas_recientes');
assert(resFacturas.desglose.ahorroBsf > 0, 'Debe reconocer ahorro por BSF si hay registros');
assert.strictEqual(resFacturas.margenObjetivoPct, 30);

// Test 4: Opciones de margen
assert.strictEqual(OPCIONES_MARGEN_POLLOS.length, 5, 'Deben existir 5 opciones predefinidas de margen');

console.log('✅ Todas las pruebas de preciosSugeridosPollos pasaron exitosamente!');
