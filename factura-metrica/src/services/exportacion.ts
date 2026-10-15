import { CATEGORIAS, CUENTAS_PGC, type CuentaPgc } from '@/constants/fiscal';
import { baseDeducible, ivaDeducible } from '@/services/estado-gasto';
import type { Gasto } from '@/types/gasto';
import type { Usuario } from '@/types/usuario';

/**
 * Exportación contable (RF-11 / CU-08): genera el lote trimestral en CSV (abre en Excel y se
 * importa en A3 o Sage) o en JSON para integraciones por API.
 */

export interface AsientoExportado {
  fecha: string;
  nifCliente: string;
  cliente: string;
  nifEmisor: string;
  emisor: string;
  cuentaPgc: string;
  descripcionCuenta: string;
  categoria: string;
  baseImponible: number;
  tipoIva: number;
  cuotaIva: number;
  ivaDeducible: number;
  baseDeducibleIrpf: number;
  total: number;
  justificacion: string;
}

export function crearAsientos(gastos: Gasto[], clientes: Usuario[]): AsientoExportado[] {
  return gastos.map((gasto) => {
    const cliente = clientes.find((c) => c.id === gasto.clienteId);
    return {
      fecha: gasto.fechaEmision.slice(0, 10),
      nifCliente: cliente?.nif ?? '',
      cliente: cliente?.nombre ?? '',
      nifEmisor: gasto.nifEmisor ?? '',
      emisor: gasto.razonSocialEmisor,
      cuentaPgc: gasto.cuentaPgc,
      descripcionCuenta: CUENTAS_PGC[gasto.cuentaPgc as CuentaPgc] ?? '',
      categoria: CATEGORIAS[gasto.categoria].nombre,
      baseImponible: gasto.baseImponible,
      tipoIva: gasto.tipoIva,
      cuotaIva: gasto.cuotaIva,
      ivaDeducible: Math.round(ivaDeducible(gasto) * 100) / 100,
      baseDeducibleIrpf: Math.round(baseDeducible(gasto) * 100) / 100,
      total: gasto.total,
      justificacion: gasto.justificacion?.motivoProfesional ?? '',
    };
  });
}

const COLUMNAS: [keyof AsientoExportado, string][] = [
  ['fecha', 'Fecha'],
  ['nifCliente', 'NIF cliente'],
  ['cliente', 'Cliente'],
  ['nifEmisor', 'NIF emisor'],
  ['emisor', 'Emisor'],
  ['cuentaPgc', 'Cuenta PGC'],
  ['descripcionCuenta', 'Descripción cuenta'],
  ['categoria', 'Categoría'],
  ['baseImponible', 'Base imponible'],
  ['tipoIva', 'Tipo IVA'],
  ['cuotaIva', 'Cuota IVA'],
  ['ivaDeducible', 'IVA deducible'],
  ['baseDeducibleIrpf', 'Base deducible IRPF'],
  ['total', 'Total'],
  ['justificacion', 'Justificación'],
];

/** CSV con separador «;» y coma decimal, el formato que espera Excel en español. */
export function generarCsv(asientos: AsientoExportado[]) {
  const celda = (valor: string | number) => {
    const texto = typeof valor === 'number' ? valor.toFixed(2).replace('.', ',') : valor;
    return /[;"\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  };
  const cabecera = COLUMNAS.map(([, titulo]) => titulo).join(';');
  const filas = asientos.map((asiento) =>
    COLUMNAS.map(([clave]) =>
      clave === 'tipoIva' ? String(asiento.tipoIva) : celda(asiento[clave]),
    ).join(';'),
  );
  // BOM para que Excel detecte UTF-8 y muestre bien las tildes.
  return `﻿${[cabecera, ...filas].join('\r\n')}`;
}

export function generarJson(asientos: AsientoExportado[], metadatos: Record<string, unknown>) {
  return JSON.stringify({ ...metadatos, asientos }, null, 2);
}
