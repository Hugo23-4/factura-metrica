import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { buscarAsesoriaPorCodigo } from '@/services/asesorias';
import {
  cifrarContrasena,
  comprobarContrasena,
  emailEnUso,
  normalizarEmail,
} from '@/services/auth';
import { crearUsuariosDemo } from '@/services/demo';
import { cancelarRecordatorios } from '@/services/notificaciones';
import type { DatosUsuario, Usuario } from '@/types/usuario';

/**
 * Autenticación y control de acceso por roles (RF-01) y CRUD de usuarios (RF-14).
 * Sin backend todavía: los usuarios se guardan en el dispositivo con la contraseña cifrada
 * con bcrypt, y cada operación comprueba los permisos del rol que la ejecuta.
 */

const CLAVE_USUARIOS = '@facturametrica/v2/usuarios';
const CLAVE_SESION = '@facturametrica/v2/sesion';

/** Las operaciones devuelven `null` si van bien o un mensaje de error para mostrar. */
type Resultado = Promise<string | null>;

interface SesionContextValue {
  usuarios: Usuario[];
  usuario: Usuario | null;
  cargando: boolean;
  iniciarSesion: (email: string, contrasena: string) => Resultado;
  registrarse: (datos: DatosUsuario, codigoAsesoria: string) => Resultado;
  cerrarSesion: () => void;
  crearCliente: (datos: DatosUsuario) => Resultado;
  actualizarUsuario: (id: string, datos: DatosUsuario) => Resultado;
  cambiarActivo: (id: string, activo: boolean) => void;
  cambiarRecordatorios: (activar: boolean) => void;
  eliminarUsuario: (id: string) => boolean;
  restablecerUsuarios: () => void;
}

const SesionContext = createContext<SesionContextValue | null>(null);

export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [sesionId, setSesionId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(CLAVE_USUARIOS), AsyncStorage.getItem(CLAVE_SESION)])
      .then(([guardados, sesion]) => {
        if (guardados) {
          setUsuarios(JSON.parse(guardados));
          setSesionId(sesion);
        } else {
          guardarUsuarios(crearUsuariosDemo());
        }
      })
      .catch(() => setUsuarios(crearUsuariosDemo()))
      .finally(() => setCargando(false));
  }, []);

  const usuario = usuarios.find((u) => u.id === sesionId && u.activo) ?? null;

  function guardarUsuarios(nuevos: Usuario[]) {
    setUsuarios(nuevos);
    AsyncStorage.setItem(CLAVE_USUARIOS, JSON.stringify(nuevos)).catch(() => {});
  }

  function guardarSesion(id: string | null) {
    setSesionId(id);
    const operacion = id
      ? AsyncStorage.setItem(CLAVE_SESION, id)
      : AsyncStorage.removeItem(CLAVE_SESION);
    operacion.catch(() => {});
  }

  /** Un gestor solo puede gestionar clientes de su propia asesoría (RNF-06). */
  function puedeGestionar(objetivo: Usuario) {
    if (!usuario) return false;
    if (usuario.id === objetivo.id) return true;
    return (
      usuario.rol === 'admin' &&
      objetivo.rol === 'cliente' &&
      objetivo.asesoriaId === usuario.asesoriaId
    );
  }

  function aplicarDatos(base: Usuario, datos: DatosUsuario): Usuario {
    return {
      ...base,
      nombre: datos.nombre.trim(),
      email: normalizarEmail(datos.email),
      nif: datos.nif.trim().toUpperCase(),
      actividad: datos.actividad.trim(),
      telefono: datos.telefono?.trim() || undefined,
      domicilioFiscal: datos.domicilioFiscal?.trim() || undefined,
      gestorId: base.rol === 'cliente' ? datos.gestorId || base.gestorId : undefined,
    };
  }

  async function nuevoCliente(datos: DatosUsuario, asesoriaId: string, gestorId?: string) {
    const id = `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const base: Usuario = {
      id,
      rol: 'cliente',
      asesoriaId,
      gestorId,
      nombre: '',
      email: '',
      passwordHash: await cifrarContrasena(datos.contrasena ?? ''),
      activo: true,
      creadoEn: new Date().toISOString(),
      nif: '',
      actividad: '',
      recordatorios: false,
    };
    return aplicarDatos(base, datos);
  }

  async function iniciarSesion(email: string, contrasena: string) {
    const encontrado = usuarios.find((u) => u.email === normalizarEmail(email));
    if (!encontrado || !(await comprobarContrasena(contrasena, encontrado.passwordHash))) {
      return 'El correo o la contraseña no son correctos.';
    }
    if (!encontrado.activo) {
      return 'Tu cuenta está pausada. Contacta con tu asesoría para reactivarla.';
    }
    guardarSesion(encontrado.id);
    return null;
  }

  async function registrarse(datos: DatosUsuario, codigoAsesoria: string) {
    const asesoria = buscarAsesoriaPorCodigo(codigoAsesoria);
    if (!asesoria) return 'El código de asesoría no existe. Pídeselo a tu gestor.';
    if (emailEnUso(usuarios, datos.email)) return 'Ya existe una cuenta con ese correo.';

    const gestor = usuarios.find((u) => u.rol === 'admin' && u.asesoriaId === asesoria.id);
    const nuevo = await nuevoCliente(datos, asesoria.id, gestor?.id);
    guardarUsuarios([...usuarios, nuevo]);
    guardarSesion(nuevo.id);
    return null;
  }

  async function crearCliente(datos: DatosUsuario) {
    if (usuario?.rol !== 'admin') return 'Solo un gestor puede dar de alta clientes.';
    if (emailEnUso(usuarios, datos.email)) return 'Ya existe una cuenta con ese correo.';

    const nuevo = await nuevoCliente(datos, usuario.asesoriaId, datos.gestorId || usuario.id);
    guardarUsuarios([...usuarios, nuevo]);
    return null;
  }

  async function actualizarUsuario(id: string, datos: DatosUsuario) {
    const objetivo = usuarios.find((u) => u.id === id);
    if (!objetivo || !puedeGestionar(objetivo))
      return 'No tienes permiso para editar este usuario.';
    if (emailEnUso(usuarios, datos.email, id)) return 'Ya existe una cuenta con ese correo.';

    const actualizado = aplicarDatos(objetivo, datos);
    if (datos.contrasena) actualizado.passwordHash = await cifrarContrasena(datos.contrasena);
    guardarUsuarios(usuarios.map((u) => (u.id === id ? actualizado : u)));
    return null;
  }

  function cambiarActivo(id: string, activo: boolean) {
    const objetivo = usuarios.find((u) => u.id === id);
    if (!objetivo || !puedeGestionar(objetivo) || objetivo.id === usuario?.id) return;
    guardarUsuarios(usuarios.map((u) => (u.id === id ? { ...u, activo } : u)));
  }

  function cambiarRecordatorios(activar: boolean) {
    if (!usuario) return;
    guardarUsuarios(
      usuarios.map((u) => (u.id === usuario.id ? { ...u, recordatorios: activar } : u)),
    );
  }

  function eliminarUsuario(id: string) {
    const objetivo = usuarios.find((u) => u.id === id);
    if (!objetivo || !puedeGestionar(objetivo)) return false;
    guardarUsuarios(usuarios.filter((u) => u.id !== id));
    if (id === usuario?.id) cerrarSesion();
    return true;
  }

  function cerrarSesion() {
    cancelarRecordatorios();
    guardarSesion(null);
  }

  return (
    <SesionContext.Provider
      value={{
        usuarios,
        usuario,
        cargando,
        iniciarSesion,
        registrarse,
        cerrarSesion,
        crearCliente,
        actualizarUsuario,
        cambiarActivo,
        cambiarRecordatorios,
        eliminarUsuario,
        restablecerUsuarios: () => {
          const demo = crearUsuariosDemo();
          guardarUsuarios(demo);
          if (!demo.some((u) => u.id === sesionId)) guardarSesion(null);
        },
      }}>
      {children}
    </SesionContext.Provider>
  );
}

export function useSesion() {
  const contexto = useContext(SesionContext);
  if (!contexto) {
    throw new Error('useSesion debe usarse dentro de <SesionProvider>');
  }
  return contexto;
}

/** Para pantallas protegidas, donde la sesión siempre existe. */
export function useUsuario() {
  const { usuario } = useSesion();
  if (!usuario) {
    throw new Error('useUsuario requiere una sesión iniciada');
  }
  return usuario;
}

/** Clientes de la asesoría del gestor en sesión (aislamiento multi-tenant). */
export function useClientesAsesoria() {
  const { usuarios } = useSesion();
  const usuario = useUsuario();
  return usuarios.filter((u) => u.rol === 'cliente' && u.asesoriaId === usuario.asesoriaId);
}

export function useGestoresAsesoria() {
  const { usuarios } = useSesion();
  const usuario = useUsuario();
  return usuarios.filter((u) => u.rol === 'admin' && u.asesoriaId === usuario.asesoriaId);
}
