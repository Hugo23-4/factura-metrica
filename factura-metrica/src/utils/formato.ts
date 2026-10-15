import { CATEGORIAS } from '@/constants/fiscal';
import type { Categoria } from '@/types/gasto';

const moneda = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

export function formatearImporte(valor: number) {
  return moneda.format(valor);
}

export function formatearFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatearFechaHora(iso: string) {
  const fecha = new Date(iso);
  const hora = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  return `${formatearFecha(iso)} · ${hora}`;
}

export const NOMBRE_CATEGORIA = Object.fromEntries(
  Object.entries(CATEGORIAS).map(([clave, definicion]) => [clave, definicion.nombre]),
) as Record<Categoria, string>;
