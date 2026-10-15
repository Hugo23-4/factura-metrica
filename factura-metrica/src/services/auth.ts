import bcrypt from 'bcryptjs';
import * as Crypto from 'expo-crypto';

import type { DatosUsuario, Usuario } from '@/types/usuario';
import { esNifValido } from '@/utils/nif';

/**
 * Seguridad de credenciales (RNF-05): contraseñas con hash bcrypt.
 * En el dispositivo se usa la implementación JavaScript de bcrypt con el generador
 * aleatorio criptográfico de Expo.
 */

bcrypt.setRandomFallback((longitud) => Array.from(Crypto.getRandomBytes(longitud)));

/** Coste reducido respecto al servidor para que el alta no bloquee el móvil. */
const COSTE_BCRYPT = 8;

export const LONGITUD_MINIMA_CONTRASENA = 8;

export function cifrarContrasena(contrasena: string) {
  return bcrypt.hash(contrasena, COSTE_BCRYPT);
}

export function comprobarContrasena(contrasena: string, hash: string) {
  return bcrypt.compare(contrasena, hash);
}

export function normalizarEmail(email: string) {
  return email.trim().toLowerCase();
}

export type ErroresUsuario = Partial<Record<keyof DatosUsuario, string>>;

/** Validación común de los formularios de alta y edición de usuarios. */
export function validarDatosUsuario(
  datos: DatosUsuario,
  { contrasenaObligatoria, esCliente }: { contrasenaObligatoria: boolean; esCliente: boolean },
): ErroresUsuario {
  const errores: ErroresUsuario = {};
  if (datos.nombre.trim().length < 3) errores.nombre = 'Indica el nombre completo.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email.trim()))
    errores.email = 'Introduce un correo válido.';
  if (esCliente && !esNifValido(datos.nif)) errores.nif = 'Introduce un NIF o NIE válido.';
  if (esCliente && datos.actividad.trim().length < 3)
    errores.actividad = 'Indica la actividad económica.';

  const contrasena = datos.contrasena ?? '';
  if ((contrasenaObligatoria || contrasena) && contrasena.length < LONGITUD_MINIMA_CONTRASENA) {
    errores.contrasena = `La contraseña debe tener al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres.`;
  }
  return errores;
}

export function emailEnUso(usuarios: Usuario[], email: string, exceptoId?: string) {
  const normalizado = normalizarEmail(email);
  return usuarios.some((u) => u.email === normalizado && u.id !== exceptoId);
}
