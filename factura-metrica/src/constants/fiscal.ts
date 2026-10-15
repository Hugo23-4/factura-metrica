import type { Categoria } from '@/types/gasto';

/**
 * Catálogos fiscales: tablas `CategoriasGasto` y `CuentasPGC` del modelo de datos.
 */

/** Cuentas del grupo 6 del Plan General de Contabilidad (RD 1514/2007) usadas por la app. */
export const CUENTAS_PGC = {
  '602': 'Compras de otros aprovisionamientos',
  '621': 'Arrendamientos y cánones',
  '622': 'Reparaciones y conservación',
  '623': 'Servicios de profesionales independientes',
  '624': 'Transportes',
  '625': 'Primas de seguros',
  '627': 'Publicidad, propaganda y relaciones públicas',
  '628': 'Suministros',
  '629': 'Otros servicios',
  '678': 'Gastos excepcionales',
} as const;

export type CuentaPgc = keyof typeof CUENTAS_PGC;

/** Gastos que no se contabilizan como gasto de la actividad. */
export const SIN_CUENTA = '—';

export interface DefinicionCategoria {
  nombre: string;
  cuentaPgc: CuentaPgc | typeof SIN_CUENTA;
  /** Porcentaje deducible en el IRPF y en el IVA. */
  deducibleIrpfPct: number;
  deducibleIvaPct: number;
  /** Nunca deducible (multas, consumo personal): el motor lo marca en rojo. */
  noAfecto?: boolean;
  /** Gasto de manutención sujeto al límite diario de la LIRPF. */
  manutencion?: boolean;
}

export const CATEGORIAS: Record<Categoria, DefinicionCategoria> = {
  restauracion: {
    nombre: 'Restauración',
    cuentaPgc: '629',
    deducibleIrpfPct: 100,
    deducibleIvaPct: 100,
    manutencion: true,
  },
  combustible: {
    nombre: 'Combustible',
    cuentaPgc: '628',
    deducibleIrpfPct: 100,
    deducibleIvaPct: 50,
  },
  alojamiento: {
    nombre: 'Alojamiento',
    cuentaPgc: '629',
    deducibleIrpfPct: 100,
    deducibleIvaPct: 100,
  },
  transporte: {
    nombre: 'Transporte',
    cuentaPgc: '624',
    deducibleIrpfPct: 100,
    deducibleIvaPct: 100,
  },
  material_oficina: {
    nombre: 'Material de oficina',
    cuentaPgc: '602',
    deducibleIrpfPct: 100,
    deducibleIvaPct: 100,
  },
  suministros: {
    nombre: 'Suministros',
    cuentaPgc: '628',
    deducibleIrpfPct: 100,
    deducibleIvaPct: 100,
  },
  servicios_profesionales: {
    nombre: 'Servicios profesionales',
    cuentaPgc: '623',
    deducibleIrpfPct: 100,
    deducibleIvaPct: 100,
  },
  publicidad: {
    nombre: 'Publicidad',
    cuentaPgc: '627',
    deducibleIrpfPct: 100,
    deducibleIvaPct: 100,
  },
  otros: { nombre: 'Otros gastos', cuentaPgc: '629', deducibleIrpfPct: 100, deducibleIvaPct: 100 },
  multas: {
    nombre: 'Multas y sanciones',
    cuentaPgc: '678',
    deducibleIrpfPct: 0,
    deducibleIvaPct: 0,
    noAfecto: true,
  },
  consumo_personal: {
    nombre: 'Consumo personal',
    cuentaPgc: SIN_CUENTA,
    deducibleIrpfPct: 0,
    deducibleIvaPct: 0,
    noAfecto: true,
  },
};

export const LISTA_CATEGORIAS = Object.keys(CATEGORIAS) as Categoria[];

/** Límite para emitir factura simplificada (RD 1619/2012, art. 4). */
export const LIMITE_FACTURA_SIMPLIFICADA = 400;

/** Límite diario de manutención en España sin pernocta (art. 9 RIRPF). */
export const LIMITE_MANUTENCION_DIA = 26.67;

export const TIPOS_IVA = [0, 4, 10, 21] as const;
