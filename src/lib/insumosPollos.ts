/**
 * Gestión de Insumos y Precios de Referencia Guardados para Pollos de Engorde
 * Permite recordar y sincronizar precios de concentrado, gas, viruta, sanidad, etc.
 */

export type CategoriaInsumoPollo =
  | 'concentrado'
  | 'gas_calefaccion'
  | 'viruta_cama'
  | 'medicamentos_vitaminas'
  | 'pollitos_bb'
  | 'fletes'
  | 'mano_obra'
  | 'otro';

export type SubtipoConcentradoPollo = 'iniciacion' | 'engorde' | 'finalizador';

export interface InsumoReferenciaPollo {
  id: string;
  categoria: CategoriaInsumoPollo;
  nombre: string;
  unidad: string;
  precioReferencia: number;
  subtipoConcentrado?: SubtipoConcentradoPollo;
  kilosPorUnidad?: number;
  icono?: string;
}

export const INSUMOS_DEFAULT_POLLOS: InsumoReferenciaPollo[] = [
  {
    id: 'concentrado_finalizador',
    categoria: 'concentrado',
    nombre: 'Concentrado Finalizador (Retiro)',
    unidad: 'bulto (40 kg)',
    precioReferencia: 92000,
    subtipoConcentrado: 'finalizador',
    kilosPorUnidad: 40,
    icono: '🌾',
  },
  {
    id: 'concentrado_engorde',
    categoria: 'concentrado',
    nombre: 'Concentrado Engorde',
    unidad: 'bulto (40 kg)',
    precioReferencia: 95000,
    subtipoConcentrado: 'engorde',
    kilosPorUnidad: 40,
    icono: '🌾',
  },
  {
    id: 'concentrado_iniciacion',
    categoria: 'concentrado',
    nombre: 'Concentrado Iniciación (Pollito)',
    unidad: 'bulto (40 kg)',
    precioReferencia: 98000,
    subtipoConcentrado: 'iniciacion',
    kilosPorUnidad: 40,
    icono: '🌾',
  },
  {
    id: 'viruta_cama',
    categoria: 'viruta_cama',
    nombre: 'Viruta / Cascarilla de arroz',
    unidad: 'viaje / bulto',
    precioReferencia: 25000,
    icono: '🪵',
  },
  {
    id: 'gas_calefaccion',
    categoria: 'gas_calefaccion',
    nombre: 'Gas propano / Calefacción',
    unidad: 'cilindro 40 lb',
    precioReferencia: 90000,
    icono: '🔥',
  },
  {
    id: 'medicamentos_vitaminas',
    categoria: 'medicamentos_vitaminas',
    nombre: 'Medicamentos / Vitaminas / Vacunas',
    unidad: 'frasco / tratamiento',
    precioReferencia: 35000,
    icono: '💊',
  },
  {
    id: 'pollitos_bb',
    categoria: 'pollitos_bb',
    nombre: 'Pollitos BB (Ross 308 - 1 día)',
    unidad: 'ave',
    precioReferencia: 3500,
    icono: '🐥',
  },
  {
    id: 'fletes',
    categoria: 'fletes',
    nombre: 'Flete / Transporte de insumos',
    unidad: 'viaje',
    precioReferencia: 30000,
    icono: '🚚',
  },
  {
    id: 'mano_obra',
    categoria: 'mano_obra',
    nombre: 'Jornal / Mano de obra galpón',
    unidad: 'día / jornal',
    precioReferencia: 50000,
    icono: '👷',
  },
  {
    id: 'otro',
    categoria: 'otro',
    nombre: 'Otro insumo / Gasto operativo',
    unidad: 'unidad',
    precioReferencia: 20000,
    icono: '📦',
  },
];

const STORAGE_KEY = 'pollos_insumos_precios_v1';

/**
 * Obtiene el mapa de precios guardados en localStorage fusionados con los valores por defecto
 */
export function getPreciosInsumosGuardados(): Record<string, number> {
  const preciosMap: Record<string, number> = {};
  INSUMOS_DEFAULT_POLLOS.forEach((ins) => {
    preciosMap[ins.id] = ins.precioReferencia;
  });

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null) {
          Object.assign(preciosMap, parsed);
        }
      }
    } catch (e) {
      console.warn('Error leyendo precios guardados de insumos:', e);
    }
  }

  return preciosMap;
}

/**
 * Guarda o actualiza el precio de referencia para un insumo específico
 */
export function guardarPrecioInsumo(insumoId: string, nuevoPrecio: number): void {
  if (typeof window === 'undefined' || nuevoPrecio <= 0) return;
  try {
    const actuales = getPreciosInsumosGuardados();
    actuales[insumoId] = nuevoPrecio;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actuales));
    window.dispatchEvent(new CustomEvent('granja-pollos-insumos-updated', { detail: actuales }));
  } catch (e) {
    console.warn('Error guardando precio de insumo:', e);
  }
}

/**
 * Devuelve el insumo según categoría y subtipo
 */
export function obtenerInsumoPorCategoria(
  categoria: CategoriaInsumoPollo,
  subtipo?: SubtipoConcentradoPollo
): InsumoReferenciaPollo {
  if (categoria === 'concentrado') {
    const targetSubtipo = subtipo || 'finalizador';
    return (
      INSUMOS_DEFAULT_POLLOS.find(
        (i) => i.categoria === 'concentrado' && i.subtipoConcentrado === targetSubtipo
      ) || INSUMOS_DEFAULT_POLLOS[0]
    );
  }
  return (
    INSUMOS_DEFAULT_POLLOS.find((i) => i.categoria === categoria) ||
    INSUMOS_DEFAULT_POLLOS[INSUMOS_DEFAULT_POLLOS.length - 1]
  );
}
