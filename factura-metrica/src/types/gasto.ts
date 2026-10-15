/**
 * Modelo de dominio de un gasto del autónomo.
 * Refleja las tablas `Gastos` y `JustificacionesFiscales` del modelo de datos de la memoria.
 */

/** Clasificación semafórica de riesgo fiscal (RF-07). */
export type Semaforo = 'verde' | 'amarillo' | 'rojo';

export type Categoria =
  | 'restauracion'
  | 'combustible'
  | 'alojamiento'
  | 'transporte'
  | 'material_oficina'
  | 'suministros'
  | 'servicios_profesionales'
  | 'publicidad'
  | 'otros'
  | 'multas'
  | 'consumo_personal';

/** Ticket fotografiado o documento importado (RF-02 / RF-03). */
export type TipoDocumento = 'ticket' | 'factura_pdf' | 'factura_imagen';

/** Datos que devuelve el motor OCR al analizar un comprobante (RF-04). */
export interface DatosExtraidos {
  /** Fecha y hora de emisión en ISO 8601. */
  fechaEmision: string;
  nifEmisor: string | null;
  razonSocialEmisor: string;
  /** NIF del receptor; si falta, el comprobante es una factura simplificada (ticket). */
  nifReceptor: string | null;
  baseImponible: number;
  tipoIva: number;
  cuotaIva: number;
  total: number;
  categoria: Categoria;
  tipoDocumento: TipoDocumento;
}

/** Respuesta del autónomo al Asesor Fiscal Virtual (RF-06). */
export interface Justificacion {
  motivoProfesional: string;
  clienteNombre?: string;
  clienteNif?: string;
  fecha: string;
}

/** Decisión del gestor sobre un gasto justificado (RF-09). */
export interface Revision {
  decision: 'aprobado' | 'rechazado';
  comentario?: string;
  gestorId: string;
  fecha: string;
}

export interface Gasto extends DatosExtraidos {
  id: string;
  clienteId: string;
  asesoriaId: string;
  semaforo: Semaforo;
  /** Explicación del riesgo detectado por el motor de reglas. */
  motivoRiesgo?: string;
  /** Pregunta que el Asesor Fiscal Virtual plantea al autónomo. */
  preguntaAsesor?: string;
  /** Subcuenta del Plan General Contable (RF-10 / CU-07). */
  cuentaPgc: string;
  justificacion?: Justificacion;
  revision?: Revision;
  /** Nota libre del autónomo para su gestor. */
  nota?: string;
  imagenUri?: string;
  /** Nombre del archivo cuando el comprobante es un documento importado. */
  nombreArchivo?: string;
  /** Huella SHA-256 del documento original para la custodia (RF-12). */
  hashDocumento?: string;
  creadoEn: string;
  /** Cierre trimestral enviado por el autónomo. */
  enviadoEn?: string;
  /** Incluido en un lote exportado al ERP (estado EXPORTADO_CONTABILIZADO). */
  exportacionId?: string;
}

/**
 * Máquina de estados del comprobante (DFE de la memoria) tras la bifurcación semafórica.
 */
export type EstadoGasto =
  | 'validado' // VERDE_DEDUCIBLE
  | 'pendiente' // AMARILLO_PENDIENTE_JUSTIFICACION
  | 'justificado' // AMARILLO_JUSTIFICADO
  | 'no_deducible' // ROJO_NO_DEDUCIBLE
  | 'aprobado' // APROBADO_GESTOR
  | 'rechazado' // rechazado por el gestor (RF-09)
  | 'exportado'; // EXPORTADO_CONTABILIZADO

/** Tabla `ExportacionesContables`. */
export interface Exportacion {
  id: string;
  asesoriaId: string;
  gestorId: string;
  trimestre: number;
  anio: number;
  formato: 'csv' | 'json';
  numAsientos: number;
  totalImporte: number;
  fecha: string;
}
