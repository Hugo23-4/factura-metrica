import type { Asesoria } from '@/types/usuario';

/**
 * Asesorías dadas de alta en la plataforma (inquilinos del modelo multi-tenant).
 * En producción viven en la tabla `Asesorias`; el autónomo se une a la suya con el código de
 * invitación que le facilita su gestor.
 */
export const ASESORIAS: Asesoria[] = [
  {
    id: 'as-albarregas',
    codigoInvitacion: 'ALB2026',
    cif: 'B06100200',
    razonSocial: 'Asesoría Fiscal Albarregas S.L.',
    emailContacto: 'contacto@albarregas.test',
    telefono: '924 000 111',
    plan: 'profesional',
  },
  {
    id: 'as-emerita',
    codigoInvitacion: 'EMERITA',
    cif: 'B06300400',
    razonSocial: 'Gestoría Emérita Augusta S.L.',
    emailContacto: 'hola@emerita.test',
    telefono: '924 000 222',
    plan: 'basico',
  },
];

export function buscarAsesoriaPorCodigo(codigo: string) {
  const normalizado = codigo.trim().toUpperCase();
  return ASESORIAS.find((a) => a.codigoInvitacion === normalizado) ?? null;
}

export function obtenerAsesoria(id: string) {
  return ASESORIAS.find((a) => a.id === id);
}
