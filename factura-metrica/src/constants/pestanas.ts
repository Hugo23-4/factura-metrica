import type { Href } from 'expo-router';
import type { AndroidSymbol } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';

/** Pestañas de la barra inferior de cada rol. */
export interface Pestana {
  /** Nombre de la ruta dentro del grupo de pestañas. */
  name: string;
  href: Href;
  etiqueta: string;
  ios: SFSymbol;
  md: AndroidSymbol;
}

export const PESTANAS_CLIENTE: Pestana[] = [
  { name: 'index', href: '/', etiqueta: 'Inicio', ios: 'house', md: 'home' },
  {
    name: 'gastos',
    href: '/gastos',
    etiqueta: 'Gastos',
    ios: 'list.bullet.rectangle',
    md: 'receipt_long',
  },
  { name: 'capturar', href: '/capturar', etiqueta: 'Capturar', ios: 'camera', md: 'photo_camera' },
  { name: 'informes', href: '/informes', etiqueta: 'Informes', ios: 'chart.bar', md: 'bar_chart' },
  {
    name: 'perfil',
    href: '/perfil',
    etiqueta: 'Perfil',
    ios: 'person.circle',
    md: 'account_circle',
  },
];

export const PESTANAS_ADMIN: Pestana[] = [
  { name: 'index', href: '/admin', etiqueta: 'Panel', ios: 'square.grid.2x2', md: 'dashboard' },
  { name: 'clientes', href: '/admin/clientes', etiqueta: 'Clientes', ios: 'person.2', md: 'group' },
  { name: 'bandeja', href: '/admin/bandeja', etiqueta: 'Bandeja', ios: 'tray.full', md: 'inbox' },
  {
    name: 'exportar',
    href: '/admin/exportar',
    etiqueta: 'Exportar',
    ios: 'square.and.arrow.up',
    md: 'ios_share',
  },
  {
    name: 'perfil',
    href: '/admin/perfil',
    etiqueta: 'Perfil',
    ios: 'person.circle',
    md: 'account_circle',
  },
];
