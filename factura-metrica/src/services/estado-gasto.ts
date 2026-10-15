import { CATEGORIAS } from '@/constants/fiscal';
import type { EstadoGasto, Gasto, Semaforo } from '@/types/gasto';

/** Estado del comprobante en la máquina de estados de la memoria (DFE). */
export function estadoDe(gasto: Gasto): EstadoGasto {
  if (gasto.exportacionId) return 'exportado';
  if (gasto.revision?.decision === 'rechazado') return 'rechazado';
  if (gasto.revision?.decision === 'aprobado') return 'aprobado';
  if (gasto.semaforo === 'verde') return 'validado';
  if (gasto.semaforo === 'rojo') return 'no_deducible';
  return gasto.justificacion ? 'justificado' : 'pendiente';
}

export const ETIQUETA_ESTADO: Record<EstadoGasto, string> = {
  validado: 'Deducible',
  pendiente: 'Justificar',
  justificado: 'En revisión',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  no_deducible: 'No deducible',
  exportado: 'Contabilizado',
};

/** Color del semáforo con el que se muestra cada estado. */
export const COLOR_ESTADO: Record<EstadoGasto, Semaforo> = {
  validado: 'verde',
  aprobado: 'verde',
  exportado: 'verde',
  pendiente: 'amarillo',
  justificado: 'amarillo',
  rechazado: 'rojo',
  no_deducible: 'rojo',
};

/** Gastos que cuentan para la deducción. Los rechazados o pendientes no cuentan. */
export function esDeducible(gasto: Gasto) {
  return ['validado', 'justificado', 'aprobado', 'exportado'].includes(estadoDe(gasto));
}

/** Gastos que el gestor puede incluir en un lote de exportación al ERP (CU-08). */
export function esExportable(gasto: Gasto) {
  const estado = estadoDe(gasto);
  return estado === 'validado' || estado === 'aprobado';
}

/** IVA soportado deducible según el porcentaje de la categoría (p. ej. 50 % en combustible). */
export function ivaDeducible(gasto: Gasto) {
  return (gasto.cuotaIva * CATEGORIAS[gasto.categoria].deducibleIvaPct) / 100;
}

/** Parte de la base imponible deducible en el IRPF. */
export function baseDeducible(gasto: Gasto) {
  return (gasto.baseImponible * CATEGORIAS[gasto.categoria].deducibleIrpfPct) / 100;
}
