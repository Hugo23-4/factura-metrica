/**
 * Roles de la aplicación (RF-01, RBAC):
 * - `admin`: gestor de la asesoría. Gestiona su cartera de clientes y revisa sus gastos.
 * - `cliente`: autónomo. Registra y justifica sus propios gastos.
 * El tercer perfil, el visitante sin registrar, es simplemente la ausencia de sesión.
 */
export type Rol = 'admin' | 'cliente';

/** Tabla `Asesorias` del modelo de datos: cada asesoría es un inquilino aislado (RNF-06). */
export interface Asesoria {
  id: string;
  codigoInvitacion: string;
  cif: string;
  razonSocial: string;
  emailContacto: string;
  telefono: string;
  plan: 'basico' | 'profesional';
}

/** Tablas `Usuarios` y `ClientesAutonomos` unificadas. */
export interface Usuario {
  id: string;
  rol: Rol;
  asesoriaId: string;
  nombre: string;
  email: string;
  /** Hash bcrypt de la contraseña (RNF-05). Nunca se guarda la contraseña en claro. */
  passwordHash: string;
  activo: boolean;
  creadoEn: string;
  /** Datos fiscales del autónomo (solo clientes). */
  nif: string;
  actividad: string;
  telefono?: string;
  domicilioFiscal?: string;
  /** Gestor de la asesoría que lleva a este cliente (RF-14). */
  gestorId?: string;
  recordatorios: boolean;
}

/** Datos que se piden en los formularios de alta y edición. */
export interface DatosUsuario {
  nombre: string;
  email: string;
  nif: string;
  actividad: string;
  telefono?: string;
  domicilioFiscal?: string;
  gestorId?: string;
  /** Solo al crear o al cambiar la contraseña. */
  contrasena?: string;
}
