import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { useSesion, useUsuario } from '@/context/sesion-context';
import { crearGastosDemo, crearUsuariosDemo } from '@/services/demo';
import { esExportable } from '@/services/estado-gasto';
import { redondear } from '@/services/ocr';
import { evaluarGasto } from '@/services/reglas-fiscales';
import type {
  Categoria,
  DatosExtraidos,
  Exportacion,
  Gasto,
  Justificacion,
  Revision,
} from '@/types/gasto';

/**
 * Gastos y exportaciones contables (CRUD de gastos, RF-07 a RF-12).
 * Se persisten en el dispositivo para el uso offline temporal (RNF-03) hasta que exista la
 * sincronización con el backend. Cada operación comprueba el rol de quien la ejecuta.
 */

const CLAVE_GASTOS = '@facturametrica/v2/gastos';
const CLAVE_EXPORTACIONES = '@facturametrica/v2/exportaciones';

/** Comprobante recién analizado por el OCR, pendiente de que el usuario revise los datos. */
export interface Borrador {
  datos: DatosExtraidos;
  imagenUri?: string;
  nombreArchivo?: string;
  hashDocumento?: string;
}

interface GastosContextValue {
  gastos: Gasto[];
  exportaciones: Exportacion[];
  cargando: boolean;
  borrador: Borrador | null;
  setBorrador: (borrador: Borrador | null) => void;
  registrarGasto: (borrador: Borrador, nota?: string) => Gasto | null;
  actualizarGasto: (id: string, datos: DatosExtraidos, nota?: string) => Gasto | undefined;
  justificarGasto: (id: string, justificacion: Omit<Justificacion, 'fecha'>) => void;
  enviarAGestoria: (ids: string[]) => void;
  revisarGasto: (id: string, decision: Revision['decision'], comentario?: string) => void;
  rectificarGasto: (id: string, cambios: { categoria: Categoria; cuentaPgc: string }) => void;
  exportarGastos: (
    ids: string[],
    trimestre: number,
    anio: number,
    formato: Exportacion['formato'],
  ) => Exportacion | null;
  eliminarGasto: (id: string) => void;
  eliminarGastosDeCliente: (clienteId: string) => void;
  restablecerGastos: () => void;
}

const GastosContext = createContext<GastosContextValue | null>(null);

export function GastosProvider({ children }: { children: ReactNode }) {
  const { usuario } = useSesion();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [exportaciones, setExportaciones] = useState<Exportacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [borrador, setBorrador] = useState<Borrador | null>(null);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(CLAVE_GASTOS), AsyncStorage.getItem(CLAVE_EXPORTACIONES)])
      .then(([guardados, exportados]) => {
        if (guardados) {
          setGastos(JSON.parse(guardados));
          setExportaciones(exportados ? JSON.parse(exportados) : []);
        } else {
          restablecerGastos();
        }
      })
      .catch(() => restablecerGastos())
      .finally(() => setCargando(false));
    // Solo se cargan los datos al montar el proveedor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function actualizar(siguiente: (actuales: Gasto[]) => Gasto[]) {
    setGastos((actuales) => {
      const nuevos = siguiente(actuales);
      AsyncStorage.setItem(CLAVE_GASTOS, JSON.stringify(nuevos)).catch(() => {});
      return nuevos;
    });
  }

  function guardarExportaciones(nuevas: Exportacion[]) {
    setExportaciones(nuevas);
    AsyncStorage.setItem(CLAVE_EXPORTACIONES, JSON.stringify(nuevas)).catch(() => {});
  }

  function restablecerGastos() {
    const demo = crearGastosDemo(crearUsuariosDemo());
    actualizar(() => demo.gastos);
    guardarExportaciones(demo.exportaciones);
  }

  /** El autónomo solo toca sus gastos; el gestor, los de su asesoría (RNF-06). */
  function puedeAcceder(gasto: Gasto) {
    if (!usuario) return false;
    return usuario.rol === 'admin'
      ? gasto.asesoriaId === usuario.asesoriaId
      : gasto.clienteId === usuario.id;
  }

  function modificar(id: string, cambio: (gasto: Gasto) => Gasto) {
    actualizar((actuales) =>
      actuales.map((gasto) => (gasto.id === id && puedeAcceder(gasto) ? cambio(gasto) : gasto)),
    );
  }

  function registrarGasto(
    { datos, imagenUri, nombreArchivo, hashDocumento }: Borrador,
    nota?: string,
  ) {
    if (usuario?.rol !== 'cliente') return null;
    const gasto: Gasto = {
      ...datos,
      ...evaluarGasto(datos),
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      clienteId: usuario.id,
      asesoriaId: usuario.asesoriaId,
      imagenUri,
      nombreArchivo,
      hashDocumento,
      nota,
      creadoEn: new Date().toISOString(),
    };
    actualizar((actuales) => [gasto, ...actuales]);
    return gasto;
  }

  /** Corrige los datos del comprobante y vuelve a pasar el motor de reglas. */
  function actualizarGasto(id: string, datos: DatosExtraidos, nota?: string) {
    const original = gastos.find((gasto) => gasto.id === id);
    if (!original || !puedeAcceder(original) || original.exportacionId) return undefined;

    const evaluacion = evaluarGasto(datos);
    const actualizado: Gasto = {
      ...original,
      ...datos,
      motivoRiesgo: undefined,
      preguntaAsesor: undefined,
      ...evaluacion,
      nota,
      // La justificación solo tiene sentido si el gasto sigue siendo dudoso.
      justificacion: evaluacion.semaforo === 'amarillo' ? original.justificacion : undefined,
      revision: undefined,
    };
    actualizar((actuales) => actuales.map((gasto) => (gasto.id === id ? actualizado : gasto)));
    return actualizado;
  }

  function justificarGasto(id: string, justificacion: Omit<Justificacion, 'fecha'>) {
    modificar(id, (gasto) => ({
      ...gasto,
      justificacion: { ...justificacion, fecha: new Date().toISOString() },
      // Una justificación nueva vuelve a la bandeja del gestor.
      revision: undefined,
    }));
  }

  function enviarAGestoria(ids: string[]) {
    const enviadoEn = new Date().toISOString();
    actualizar((actuales) =>
      actuales.map((gasto) =>
        ids.includes(gasto.id) && puedeAcceder(gasto) ? { ...gasto, enviadoEn } : gasto,
      ),
    );
  }

  function revisarGasto(id: string, decision: Revision['decision'], comentario?: string) {
    if (usuario?.rol !== 'admin') return;
    const revision: Revision = {
      decision,
      comentario,
      gestorId: usuario.id,
      fecha: new Date().toISOString(),
    };
    modificar(id, (gasto) => ({ ...gasto, revision }));
  }

  /** CU-07: el gestor acepta o cambia la categoría y la subcuenta propuestas. */
  function rectificarGasto(
    id: string,
    { categoria, cuentaPgc }: { categoria: Categoria; cuentaPgc: string },
  ) {
    if (usuario?.rol !== 'admin') return;
    modificar(id, (gasto) => ({ ...gasto, categoria, cuentaPgc }));
  }

  function exportarGastos(
    ids: string[],
    trimestre: number,
    anio: number,
    formato: Exportacion['formato'],
  ) {
    if (usuario?.rol !== 'admin') return null;
    const lote = gastos.filter((g) => ids.includes(g.id) && puedeAcceder(g) && esExportable(g));
    if (lote.length === 0) return null;

    const exportacion: Exportacion = {
      id: `exp-${Date.now()}`,
      asesoriaId: usuario.asesoriaId,
      gestorId: usuario.id,
      trimestre,
      anio,
      formato,
      numAsientos: lote.length,
      totalImporte: redondear(lote.reduce((suma, g) => suma + g.total, 0)),
      fecha: new Date().toISOString(),
    };
    const loteIds = lote.map((g) => g.id);
    actualizar((actuales) =>
      actuales.map((g) => (loteIds.includes(g.id) ? { ...g, exportacionId: exportacion.id } : g)),
    );
    guardarExportaciones([exportacion, ...exportaciones]);
    return exportacion;
  }

  function eliminarGasto(id: string) {
    actualizar((actuales) => actuales.filter((gasto) => gasto.id !== id || !puedeAcceder(gasto)));
  }

  function eliminarGastosDeCliente(clienteId: string) {
    actualizar((actuales) =>
      actuales.filter((gasto) => gasto.clienteId !== clienteId || !puedeAcceder(gasto)),
    );
  }

  return (
    <GastosContext.Provider
      value={{
        gastos,
        exportaciones,
        cargando,
        borrador,
        setBorrador,
        registrarGasto,
        actualizarGasto,
        justificarGasto,
        enviarAGestoria,
        revisarGasto,
        rectificarGasto,
        exportarGastos,
        eliminarGasto,
        eliminarGastosDeCliente,
        restablecerGastos,
      }}>
      {children}
    </GastosContext.Provider>
  );
}

export function useGastos() {
  const contexto = useContext(GastosContext);
  if (!contexto) {
    throw new Error('useGastos debe usarse dentro de <GastosProvider>');
  }
  return contexto;
}

/** Gastos visibles para el usuario en sesión según su rol. */
export function useGastosVisibles() {
  const { gastos } = useGastos();
  const usuario = useUsuario();
  return usuario.rol === 'admin'
    ? gastos.filter((g) => g.asesoriaId === usuario.asesoriaId)
    : gastos.filter((g) => g.clienteId === usuario.id);
}

export function useGasto(id: string | undefined) {
  return useGastosVisibles().find((gasto) => gasto.id === id);
}

export function useExportacionesAsesoria() {
  const { exportaciones } = useGastos();
  const usuario = useUsuario();
  return exportaciones.filter((e) => e.asesoriaId === usuario.asesoriaId);
}
