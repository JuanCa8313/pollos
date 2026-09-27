import type { LotePollo, VentaPollo, RegistroAlimentoPollo, GastoPollo } from './db';

export type ModoCosteoPollos = 'pl_real' | 'facturas_recientes' | 'teorico_completo';
export type ModalidadPollo = 'en_canal' | 'en_pie';

export interface OpcionMargenPollo {
  margenPct: number;
  nombre: string;
  descripcion: string;
  badge: string;
}

export const OPCIONES_MARGEN_POLLOS: OpcionMargenPollo[] = [
  {
    margenPct: 15,
    nombre: 'Mayorista / Asaderos',
    descripcion: 'Para asaderos, restaurantes o venta de más de 10 pollos.',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  },
  {
    margenPct: 20,
    nombre: 'Equilibrado / Tiendas',
    descripcion: 'Punto estándar para minimercados, famas y tiendas del pueblo.',
    badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
  },
  {
    margenPct: 25,
    nombre: 'Recomendado Granja',
    descripcion: 'Margen saludable y competitivo para venta directa a familias y vecinos.',
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  },
  {
    margenPct: 30,
    nombre: 'Consumidor Final (Detalle)',
    descripcion: 'Venta individual puerta a puerta, empacado y porcionado.',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
  {
    margenPct: 35,
    nombre: 'Campesino / Domicilio',
    descripcion: 'Pollo premium con dieta natural (BSF) y entrega a domicilio.',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
];

export interface DesgloseCostosPollo {
  modoActivo: ModoCosteoPollos;
  costoTotalPorAve: number;
  costoPorKgPie: number;
  costoPorKgCanal: number;
  costoPorLibraCanal: number;
  // Desglose por ave
  pollitoBB: number;
  alimentoConcentrado: number;
  gasCalefaccion: number;
  virutaCama: number;
  medicamentosSanidad: number;
  fletesTransporte: number;
  manoObraBeneficio: number;
  otrosOperativos: number;
  ahorroBsf: number;
  notasExplicativas: string[];
}

export interface PreciosSugeridosPorModalidad {
  modalidad: ModalidadPollo;
  costoUnitarioKg: number;
  costoUnitarioLibra: number;
  costoUnitarioAve: number;
  precioSugeridoKg: number;
  precioSugeridoLibra: number;
  precioSugeridoAve: number;
  gananciaPorKg: number;
  gananciaPorAve: number;
  margenRealPct: number;
}

export interface ComparativoModosCosteoPollos {
  plReal: {
    costoKgCanal: number;
    costoKgPie: number;
    costoAve: number;
  };
  facturasRecientes: {
    costoKgCanal: number;
    costoKgPie: number;
    costoAve: number;
  };
  teoricoCompleto: {
    costoKgCanal: number;
    costoKgPie: number;
    costoAve: number;
  };
}

export interface DiagnosticoComercialPollo {
  estado: 'optimo' | 'bajo_margen' | 'alerta_perdida';
  titulo: string;
  mensaje: string;
  margenActualPct: number;
  diferenciaPrecioVsSugerido: number;
}

export interface ResultadoPreciosSugeridosPollos {
  margenObjetivoPct: number;
  modoCosteo: ModoCosteoPollos;
  desglose: DesgloseCostosPollo;
  canal: PreciosSugeridosPorModalidad;
  enPie: PreciosSugeridosPorModalidad;
  comparativo: ComparativoModosCosteoPollos;
  diagnostico: DiagnosticoComercialPollo;
}

export interface ParametrosPrecioSugeridoPollosInput {
  lote?: LotePollo;
  ventasLote?: VentaPollo[];
  alimentosLote?: RegistroAlimentoPollo[];
  gastosLote?: GastoPollo[];
  margenObjetivoPct?: number; // e.g. 25 (%)
  modoCosteo?: ModoCosteoPollos;
  rendimientoCanalPct?: number; // Rendimiento típico 77% (0.77)
  pesoPromedioPieKg?: number; // Peso vivo 2.7 kg
  precioVentaActualKgCanal?: number; // Precio real cobrado actualmente
  precioVentaActualKgPie?: number;
}

/**
 * Redondea un valor al múltiplo de 50 COP más cercano para precios comerciales limpios
 */
export function redondearPrecioComercial(valor: number): number {
  return Math.round(valor / 50) * 50;
}

/**
 * Benchmark teórico de engorde de pollos pesados (Ross 308 / Cobb 500)
 * adaptado a altitud de 2.200 msnm (clima templado/frío de ladera andina).
 */
export const BENCHMARK_TEORICO_POLLO = {
  pesoFinalVivoKg: 2.7,
  rendimientoCanalFactor: 0.77, // 2.7 kg vivo -> ~2.08 kg canal eviscerado
  costoPollitoBB: 3500,
  fcrTeorico: 1.83, // kg alimento / kg ave viva a 2.200 msnm
  kgAlimentoPorAve: 4.95, // 2.7 kg * 1.83
  precioKiloAlimento: 2950, // Costo promedio kilo de concentrado engorde
  gasCalefaccionPorAve: 1200, // Criadoras de gas primeros 21 días
  camaVirutaPorAve: 500, // Desinfección y viruta
  sanidadMedicamentosPorAve: 450, // Vacunas gumboro/newcastle y vitaminas
  fleteTransportePorAve: 400, // Flete concentrado y distribución
  faenadoYEmpaqueCanalPorAve: 1200, // Sacrificio, agua, bolsa termoencogible
  dilucionMortalidadPct: 6, // 6% mortalidad biológica esperada
};

/**
 * Calcula precios y márgenes sugeridos para pollos de engorde bajo los tres modos:
 * 1. Real P&L (Gastos y ventas devengadas en el sistema)
 * 2. Facturas y Compras Recientes (Prorrateo de comprobantes de insumos)
 * 3. Teórico Completo (Benchmark zootécnico estándar)
 */
export function calcularPreciosSugeridosPollos({
  lote,
  ventasLote = [],
  alimentosLote = [],
  gastosLote = [],
  margenObjetivoPct = 25,
  modoCosteo = 'pl_real',
  rendimientoCanalPct = 77,
  pesoPromedioPieKg,
  precioVentaActualKgCanal = 13500,
  precioVentaActualKgPie = 9500,
}: ParametrosPrecioSugeridoPollosInput): ResultadoPreciosSugeridosPollos {
  const margen = Math.min(60, Math.max(5, margenObjetivoPct));
  const rendimientoFactor = Math.max(0.65, Math.min(0.85, rendimientoCanalPct / 100));

  const pesoPie = pesoPromedioPieKg || lote?.pesoPromedioActualKg || 2.7;
  const pesoCanal = Number((pesoPie * rendimientoFactor).toFixed(2));

  const totalAvesIniciales = lote?.cantidadInicial && lote.cantidadInicial > 0 ? lote.cantidadInicial : 50;
  const avesVivasActuales = lote?.cantidadActual ?? totalAvesIniciales;
  const totalAvesVendidas = ventasLote.reduce((acc, v) => acc + v.cantidadAves, 0);
  const totalKgVendidos = ventasLote.reduce((acc, v) => acc + v.pesoTotalKg, 0);

  // Biomasa total generada por el lote (vendida + en galpón)
  const biomasaVivaTotal = Math.max(
    1,
    totalKgVendidos + (avesVivasActuales * pesoPie)
  );

  // -------------------------------------------------------------
  // 1. COSTOS REALES REGISTRADOS (P&L Y FACTURAS)
  // -------------------------------------------------------------
  const costoTotalPollitoBB = totalAvesIniciales * (lote?.costoPollitoUnitario || BENCHMARK_TEORICO_POLLO.costoPollitoBB);
  const costoPollitoUnitario = lote?.costoPollitoUnitario || BENCHMARK_TEORICO_POLLO.costoPollitoBB;

  // Alimentos
  const comprasConcentrado = alimentosLote.filter((a) => a.tipoAlimento !== 'mosca_soldado_viva');
  const totalCostoConcentrado = comprasConcentrado.reduce((acc, a) => acc + a.costoTotalCop, 0);
  const totalKgConcentrado = comprasConcentrado.reduce((acc, a) => acc + a.cantidadKg, 0);
  const precioKgConcentradoReal = totalKgConcentrado > 0
    ? Math.round(totalCostoConcentrado / totalKgConcentrado)
    : BENCHMARK_TEORICO_POLLO.precioKiloAlimento;

  // Mosca soldado
  const totalKgBsf = alimentosLote
    .filter((a) => a.tipoAlimento === 'mosca_soldado_viva')
    .reduce((acc, a) => acc + a.cantidadKg, 0);
  const ahorroBsfCop = Math.round(totalKgBsf * precioKgConcentradoReal);

  // Gastos desagregados
  const gastosGas = gastosLote.filter((g) => g.categoria === 'gas_calefaccion').reduce((acc, g) => acc + g.montoCop, 0);
  const gastosViruta = gastosLote.filter((g) => g.categoria === 'viruta_cama').reduce((acc, g) => acc + g.montoCop, 0);
  const gastosMedicina = gastosLote.filter((g) => g.categoria === 'medicamentos_vitaminas').reduce((acc, g) => acc + g.montoCop, 0);
  const gastosFletes = gastosLote.filter((g) => g.categoria === 'fletes').reduce((acc, g) => acc + g.montoCop, 0);
  const gastosManoObra = gastosLote.filter((g) => g.categoria === 'mano_obra').reduce((acc, g) => acc + g.montoCop, 0);
  const gastosOtros = gastosLote.filter((g) => g.categoria === 'otro').reduce((acc, g) => acc + g.montoCop, 0);
  const totalGastosOperativos = gastosGas + gastosViruta + gastosMedicina + gastosFletes + gastosManoObra + gastosOtros;

  // -------------------------------------------------------------
  // 2. MODO 1: P&L REAL (Devengado contable de todo lo gastado en el lote)
  // -------------------------------------------------------------
  const totalEgresosLotePL = costoTotalPollitoBB + totalCostoConcentrado + totalGastosOperativos;
  const avesEfectivasLote = Math.max(1, totalAvesVendidas + avesVivasActuales);
  
  // Costo por ave y por kg en P&L Real
  const costoAvePL = Math.round(totalEgresosLotePL / avesEfectivasLote);
  const costoKgPiePL = Math.round(totalEgresosLotePL / biomasaVivaTotal);
  // En canal, el rendimiento reduce el peso aprovechable y suma costo de beneficio
  const costoFaenadoPL = gastosManoObra > 0 ? Math.round(gastosManoObra / avesEfectivasLote) : 1000;
  const costoKgCanalPL = Math.round((costoKgPiePL / rendimientoFactor) + (costoFaenadoPL / pesoCanal));

  // -------------------------------------------------------------
  // 3. MODO 2: FACTURAS RECIENTES (Sin costos fantasma)
  // -------------------------------------------------------------
  // Consumo de concentrado por ave según facturas
  const kgAlimentoPorAveReal = totalAvesIniciales > 0 && totalKgConcentrado > 0
    ? totalKgConcentrado / totalAvesIniciales
    : BENCHMARK_TEORICO_POLLO.kgAlimentoPorAve;
  const costoAlimentoPorAveReal = Math.round(kgAlimentoPorAveReal * precioKgConcentradoReal);

  const costoGasPorAveReal = gastosGas > 0 ? Math.round(gastosGas / totalAvesIniciales) : 0;
  const costoVirutaPorAveReal = gastosViruta > 0 ? Math.round(gastosViruta / totalAvesIniciales) : 0;
  const costoMedicinaPorAveReal = gastosMedicina > 0 ? Math.round(gastosMedicina / totalAvesIniciales) : 0;
  const costoFletePorAveReal = gastosFletes > 0 ? Math.round(gastosFletes / totalAvesIniciales) : 0;
  const costoManoObraPorAveReal = gastosManoObra > 0 ? Math.round(gastosManoObra / totalAvesIniciales) : 0;
  const costoOtrosPorAveReal = gastosOtros > 0 ? Math.round(gastosOtros / totalAvesIniciales) : 0;

  const costoAveFacturas = Math.round(
    costoPollitoUnitario +
    costoAlimentoPorAveReal +
    costoGasPorAveReal +
    costoVirutaPorAveReal +
    costoMedicinaPorAveReal +
    costoFletePorAveReal +
    costoManoObraPorAveReal +
    costoOtrosPorAveReal
  );
  const costoKgPieFacturas = Math.round(costoAveFacturas / pesoPie);
  const costoKgCanalFacturas = Math.round(
    (costoKgPieFacturas / rendimientoFactor) + (costoManoObraPorAveReal > 0 ? costoManoObraPorAveReal / pesoCanal : 0)
  );

  // -------------------------------------------------------------
  // 4. MODO 3: TEÓRICO COMPLETO (Benchmark Zootécnico Ross/Cobb a 2.200 msnm)
  // -------------------------------------------------------------
  const factorDilucionMortalidad = 1 / (1 - (BENCHMARK_TEORICO_POLLO.dilucionMortalidadPct / 100));
  const costoDirectoTeoricoAve =
    BENCHMARK_TEORICO_POLLO.costoPollitoBB +
    Math.round(BENCHMARK_TEORICO_POLLO.kgAlimentoPorAve * BENCHMARK_TEORICO_POLLO.precioKiloAlimento) +
    BENCHMARK_TEORICO_POLLO.gasCalefaccionPorAve +
    BENCHMARK_TEORICO_POLLO.camaVirutaPorAve +
    BENCHMARK_TEORICO_POLLO.sanidadMedicamentosPorAve +
    BENCHMARK_TEORICO_POLLO.fleteTransportePorAve;

  const costoAveTeorico = Math.round(costoDirectoTeoricoAve * factorDilucionMortalidad);
  const costoKgPieTeorico = Math.round(costoAveTeorico / BENCHMARK_TEORICO_POLLO.pesoFinalVivoKg);
  const costoKgCanalTeorico = Math.round(
    (costoKgPieTeorico / BENCHMARK_TEORICO_POLLO.rendimientoCanalFactor) +
    (BENCHMARK_TEORICO_POLLO.faenadoYEmpaqueCanalPorAve / (BENCHMARK_TEORICO_POLLO.pesoFinalVivoKg * BENCHMARK_TEORICO_POLLO.rendimientoCanalFactor))
  );

  // -------------------------------------------------------------
  // 5. COMPARATIVO DE LOS 3 MODOS
  // -------------------------------------------------------------
  const comparativo: ComparativoModosCosteoPollos = {
    plReal: {
      costoKgCanal: costoKgCanalPL,
      costoKgPie: costoKgPiePL,
      costoAve: costoAvePL,
    },
    facturasRecientes: {
      costoKgCanal: costoKgCanalFacturas,
      costoKgPie: costoKgPieFacturas,
      costoAve: costoAveFacturas,
    },
    teoricoCompleto: {
      costoKgCanal: costoKgCanalTeorico,
      costoKgPie: costoKgPieTeorico,
      costoAve: costoAveTeorico,
    },
  };

  // -------------------------------------------------------------
  // 6. SELECCIÓN DEL MODO ACTIVO Y DESGLOSE
  // -------------------------------------------------------------
  let costoActivoAve = 0;
  let costoActivoKgPie = 0;
  let costoActivoKgCanal = 0;
  const notas: string[] = [];

  let desgloseRubros = {
    pollitoBB: costoPollitoUnitario,
    alimentoConcentrado: costoAlimentoPorAveReal,
    gasCalefaccion: costoGasPorAveReal,
    virutaCama: costoVirutaPorAveReal,
    medicamentosSanidad: costoMedicinaPorAveReal,
    fletesTransporte: costoFletePorAveReal,
    manoObraBeneficio: costoManoObraPorAveReal,
    otrosOperativos: costoOtrosPorAveReal,
    ahorroBsf: totalAvesIniciales > 0 ? Math.round(ahorroBsfCop / totalAvesIniciales) : 0,
  };

  if (modoCosteo === 'pl_real') {
    costoActivoAve = costoAvePL;
    costoActivoKgPie = costoKgPiePL;
    costoActivoKgCanal = costoKgCanalPL;
    notas.push(
      `Costo devengado del P&L ($${costoActivoKgCanal.toLocaleString()} COP/kg en canal) sobre ${totalEgresosLotePL > 0 ? `$${totalEgresosLotePL.toLocaleString()} COP de egresos totales` : 'registros contables'}.`
    );
    if (gastosGas === 0) notas.push('Gas/calefacción en $0: sin gastos de criadoras en el lote.');
    if (gastosViruta === 0) notas.push('Cama galpón en $0: viruta no comprada o reutilizada.');
    if (gastosManoObra === 0) notas.push('Faenado/Mano de obra en $0: trabajo propio sin pagar jornales externos.');
  } else if (modoCosteo === 'facturas_recientes') {
    costoActivoAve = costoAveFacturas;
    costoActivoKgPie = costoKgPieFacturas;
    costoActivoKgCanal = costoKgCanalFacturas;
    notas.push(
      `Costo calculado únicamente a partir de facturas y precios unitarios reales pagados ($${costoActivoKgCanal.toLocaleString()} COP/kg en canal).`
    );
    notas.push(`Concentrado prorrateado a $${precioKgConcentradoReal.toLocaleString()} COP/kg.`);
    if (totalKgBsf > 0) {
      notas.push(`Ahorro de $${ahorroBsfCop.toLocaleString()} COP generado por suministro de Mosca Soldada Negra.`);
    }
  } else {
    // Teórico completo
    costoActivoAve = costoAveTeorico;
    costoActivoKgPie = costoKgPieTeorico;
    costoActivoKgCanal = costoKgCanalTeorico;
    desgloseRubros = {
      pollitoBB: BENCHMARK_TEORICO_POLLO.costoPollitoBB,
      alimentoConcentrado: Math.round(BENCHMARK_TEORICO_POLLO.kgAlimentoPorAve * BENCHMARK_TEORICO_POLLO.precioKiloAlimento),
      gasCalefaccion: BENCHMARK_TEORICO_POLLO.gasCalefaccionPorAve,
      virutaCama: BENCHMARK_TEORICO_POLLO.camaVirutaPorAve,
      medicamentosSanidad: BENCHMARK_TEORICO_POLLO.sanidadMedicamentosPorAve,
      fletesTransporte: BENCHMARK_TEORICO_POLLO.fleteTransportePorAve,
      manoObraBeneficio: BENCHMARK_TEORICO_POLLO.faenadoYEmpaqueCanalPorAve,
      otrosOperativos: 0,
      ahorroBsf: 0,
    };
    notas.push(
      'Estándar zootécnico teórico completo (Ross 308 / Cobb 500 a 2.200 msnm con 6% de mortalidad técnica).'
    );
    notas.push(
      `Incluye $${BENCHMARK_TEORICO_POLLO.gasCalefaccionPorAve.toLocaleString()} de gas criadora y $${BENCHMARK_TEORICO_POLLO.faenadoYEmpaqueCanalPorAve.toLocaleString()} de faenado/empaque canal.`
    );
  }

  const desglose: DesgloseCostosPollo = {
    modoActivo: modoCosteo,
    costoTotalPorAve: costoActivoAve,
    costoPorKgPie: costoActivoKgPie,
    costoPorKgCanal: costoActivoKgCanal,
    costoPorLibraCanal: Math.round(costoActivoKgCanal * 0.5),
    ...desgloseRubros,
    notasExplicativas: notas,
  };

  // -------------------------------------------------------------
  // 7. PRECIO SUGERIDO SEGÚN MARGEN OBJETIVO SOBRE VENTA:
  //    Precio = Costo / (1 - Margen%)
  // -------------------------------------------------------------
  const divisorMargen = Math.max(0.1, 1 - margen / 100);

  // Canal
  const precioSugeridoKgCanal = redondearPrecioComercial(costoActivoKgCanal / divisorMargen);
  const precioSugeridoLibraCanal = redondearPrecioComercial(precioSugeridoKgCanal * 0.5);
  const precioSugeridoAveCanal = redondearPrecioComercial(precioSugeridoKgCanal * pesoCanal);
  const gananciaKgCanal = precioSugeridoKgCanal - costoActivoKgCanal;
  const gananciaAveCanal = precioSugeridoAveCanal - costoActivoAve;
  const margenRealCanalPct = precioSugeridoKgCanal > 0
    ? Math.round((gananciaKgCanal / precioSugeridoKgCanal) * 100)
    : 0;

  const canal: PreciosSugeridosPorModalidad = {
    modalidad: 'en_canal',
    costoUnitarioKg: costoActivoKgCanal,
    costoUnitarioLibra: Math.round(costoActivoKgCanal * 0.5),
    costoUnitarioAve: Math.round(costoActivoKgCanal * pesoCanal),
    precioSugeridoKg: precioSugeridoKgCanal,
    precioSugeridoLibra: precioSugeridoLibraCanal,
    precioSugeridoAve: precioSugeridoAveCanal,
    gananciaPorKg: gananciaKgCanal,
    gananciaPorAve: gananciaAveCanal,
    margenRealPct: margenRealCanalPct,
  };

  // En Pie
  const precioSugeridoKgPie = redondearPrecioComercial(costoActivoKgPie / divisorMargen);
  const precioSugeridoLibraPie = redondearPrecioComercial(precioSugeridoKgPie * 0.5);
  const precioSugeridoAvePie = redondearPrecioComercial(precioSugeridoKgPie * pesoPie);
  const gananciaKgPie = precioSugeridoKgPie - costoActivoKgPie;
  const gananciaAvePie = precioSugeridoAvePie - costoActivoAve;
  const margenRealPiePct = precioSugeridoKgPie > 0
    ? Math.round((gananciaKgPie / precioSugeridoKgPie) * 100)
    : 0;

  const enPie: PreciosSugeridosPorModalidad = {
    modalidad: 'en_pie',
    costoUnitarioKg: costoActivoKgPie,
    costoUnitarioLibra: Math.round(costoActivoKgPie * 0.5),
    costoUnitarioAve: costoActivoAve,
    precioSugeridoKg: precioSugeridoKgPie,
    precioSugeridoLibra: precioSugeridoLibraPie,
    precioSugeridoAve: precioSugeridoAvePie,
    gananciaPorKg: gananciaKgPie,
    gananciaPorAve: gananciaAvePie,
    margenRealPct: margenRealPiePct,
  };

  // -------------------------------------------------------------
  // 8. DIAGNÓSTICO COMERCIAL
  // -------------------------------------------------------------
  const margenActualCanal = precioVentaActualKgCanal > 0
    ? Number((((precioVentaActualKgCanal - costoActivoKgCanal) / precioVentaActualKgCanal) * 100).toFixed(1))
    : 0;
  const diferenciaPrecio = precioVentaActualKgCanal - precioSugeridoKgCanal;

  let diagnostico: DiagnosticoComercialPollo;
  if (precioVentaActualKgCanal < costoActivoKgCanal) {
    diagnostico = {
      estado: 'alerta_perdida',
      titulo: '⚠️ Alerta: Venta por Debajo de Costo',
      mensaje: `Estás cobrando $${precioVentaActualKgCanal.toLocaleString()} COP/kg y tu costo es de $${costoActivoKgCanal.toLocaleString()} COP/kg. Estás perdiendo $${Math.abs(precioVentaActualKgCanal - costoActivoKgCanal).toLocaleString()} COP por kilo vendido.`,
      margenActualPct: margenActualCanal,
      diferenciaPrecioVsSugerido: diferenciaPrecio,
    };
  } else if (margenActualCanal < 15) {
    diagnostico = {
      estado: 'bajo_margen',
      titulo: 'Margen Ajustado (<15%)',
      mensaje: `Tu margen actual es de solo ${margenActualCanal}%. El precio sugerido para operar sosteniblemente es de $${precioSugeridoKgCanal.toLocaleString()} COP/kg (subir +$${Math.abs(diferenciaPrecio).toLocaleString()} COP/kg).`,
      margenActualPct: margenActualCanal,
      diferenciaPrecioVsSugerido: diferenciaPrecio,
    };
  } else {
    diagnostico = {
      estado: 'optimo',
      titulo: 'Rentabilidad Saludable',
      mensaje: `Tu precio actual ($${precioVentaActualKgCanal.toLocaleString()} COP/kg) deja un margen del ${margenActualCanal}%, alineado con un retorno comercial positivo.`,
      margenActualPct: margenActualCanal,
      diferenciaPrecioVsSugerido: diferenciaPrecio,
    };
  }

  return {
    margenObjetivoPct: margen,
    modoCosteo,
    desglose,
    canal,
    enPie,
    comparativo,
    diagnostico,
  };
}
