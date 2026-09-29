/**
 * Formatea un valor numérico a moneda colombiana (COP) sin decimales.
 */
export function formatCOP(val: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

/**
 * Calcula el Índice de Conversión Alimenticia (FCR - Feed Conversion Ratio).
 * FCR = Total Alimento Consumido (kg) / Ganancia de Peso o Biomasa Total (kg)
 */
export function calcularFCR(alimentoConsumidoKg: number, biomasaProducidaKg: number): number {
  if (!biomasaProducidaKg || biomasaProducidaKg <= 0) return 0;
  return Number((alimentoConsumidoKg / biomasaProducidaKg).toFixed(2));
}

/**
 * Calcula el porcentaje de mortalidad acumulada.
 */
export function calcularMortalidadPct(bajasTotales: number, cantidadInicial: number): number {
  if (!cantidadInicial || cantidadInicial <= 0) return 0;
  return Number(((bajasTotales / cantidadInicial) * 100).toFixed(1));
}

/**
 * Calcula el costo unitario de producción por kg.
 */
export function calcularCostoPorKg(costoTotalCop: number, kgTotales: number): number {
  if (!kgTotales || kgTotales <= 0) return 0;
  return Math.round(costoTotalCop / kgTotales);
}

/**
 * Limpia entradas numéricas en formularios para evitar ceros a la izquierda molestos
 * (ej. "05" -> "5", "00" -> "0", "013500" -> "13500"), pero preservando decimales válidos como "0.5" o "0.05".
 */
export function cleanNumberInput(val: string): string {
  if (!val) return '';
  return val.replace(/^(-?)0+(?=\d)/, '$1');
}

