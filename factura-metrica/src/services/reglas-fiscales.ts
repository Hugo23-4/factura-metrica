import {
  CATEGORIAS,
  LIMITE_FACTURA_SIMPLIFICADA,
  LIMITE_MANUTENCION_DIA,
} from '@/constants/fiscal';
import type { DatosExtraidos, Semaforo } from '@/types/gasto';
import { esFestivoNacional, esFinDeSemana } from '@/utils/festivos';
import { esNifValido } from '@/utils/nif';

/**
 * Motor de reglas fiscales preventivas (RF-05).
 *
 * Implementa el algoritmo de evaluación del Diagrama de Flujo de Control de la memoria.
 * Es la versión local de las reglas que en producción ejecutará el backend FastAPI.
 */

export interface ResultadoEvaluacion {
  semaforo: Semaforo;
  motivoRiesgo?: string;
  preguntaAsesor?: string;
  cuentaPgc: string;
}

export function evaluarGasto(datos: DatosExtraidos): ResultadoEvaluacion {
  const categoria = CATEGORIAS[datos.categoria];
  const cuentaPgc = categoria.cuentaPgc;
  const fecha = new Date(datos.fechaEmision);

  // Paso 1: lectura incompleta → revisión manual del comprobante.
  if (!datos.nifEmisor || !esNifValido(datos.nifEmisor) || !(datos.total > 0)) {
    return {
      semaforo: 'amarillo',
      cuentaPgc,
      motivoRiesgo:
        'Error de lectura: no se ha podido leer un NIF válido del emisor o el importe del comprobante.',
      preguntaAsesor:
        'No encuentro el NIF del establecimiento. Corrige los datos si puedes y cuéntanos para qué actividad profesional fue este gasto.',
    };
  }

  // Paso 5 (se evalúa antes porque es concluyente): gasto manifiestamente no afecto.
  if (categoria.noAfecto) {
    return {
      semaforo: 'rojo',
      cuentaPgc,
      motivoRiesgo:
        datos.categoria === 'multas'
          ? 'Las multas y sanciones no son gasto deducible (art. 15 LIS, aplicable por el art. 28 LIRPF).'
          : 'Los gastos de consumo personal no están afectos a la actividad y no son deducibles.',
    };
  }

  // Paso 2: sábado, domingo o festivo nacional.
  if (esFinDeSemana(fecha) || esFestivoNacional(fecha)) {
    const cuando = esFinDeSemana(fecha) ? 'en fin de semana' : 'en un día festivo';
    return {
      semaforo: 'amarillo',
      cuentaPgc,
      motivoRiesgo: `Riesgo de fin de semana: gasto realizado ${cuando}. La AEAT suele cuestionarlo si no se acredita la relación con la actividad.`,
      preguntaAsesor: `Hola, detectamos este gasto ${cuando}. Para que Hacienda te lo acepte, ¿con qué cliente fue? Introduce su nombre/NIF o descríbenos brevemente el motivo profesional.`,
    };
  }

  // Paso 3: manutención por encima del límite diario.
  if (categoria.manutencion && datos.total > LIMITE_MANUTENCION_DIA) {
    return {
      semaforo: 'amarillo',
      cuentaPgc,
      motivoRiesgo: `Exceso de manutención: supera el límite de ${LIMITE_MANUTENCION_DIA} €/día sin pernocta.`,
      preguntaAsesor:
        'Esta comida supera el límite diario de manutención. ¿Fue una reunión con un cliente o proveedor? Indícanos con quién y el motivo.',
    };
  }

  // Paso 4: factura simplificada de más de 400 € sin datos del receptor.
  if (!datos.nifReceptor && datos.total > LIMITE_FACTURA_SIMPLIFICADA) {
    return {
      semaforo: 'amarillo',
      cuentaPgc,
      motivoRiesgo: `Falta NIF del receptor: un ticket de más de ${LIMITE_FACTURA_SIMPLIFICADA} € necesita factura completa con tus datos.`,
      preguntaAsesor:
        'Este importe necesita una factura completa con tu NIF. Pídela al proveedor y, mientras tanto, cuéntanos el motivo profesional de la compra.',
    };
  }

  // Paso 6: sin alertas → deducible pleno.
  return { semaforo: 'verde', cuentaPgc };
}
