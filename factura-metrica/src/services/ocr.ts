import type { DatosExtraidos, TipoDocumento } from '@/types/gasto';

/**
 * Cliente del servicio OCR (RF-04).
 *
 * Si `EXPO_PUBLIC_API_URL` está definida, envía el comprobante al backend FastAPI.
 * Mientras el backend no exista, simula la extracción con comprobantes de ejemplo
 * que recorren los distintos casos del semáforo fiscal.
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function analizarComprobante(
  uri: string,
  tipoDocumento: TipoDocumento,
): Promise<DatosExtraidos> {
  if (API_URL) {
    return analizarEnServidor(uri, tipoDocumento);
  }
  return analizarSimulado(tipoDocumento);
}

async function analizarEnServidor(
  uri: string,
  tipoDocumento: TipoDocumento,
): Promise<DatosExtraidos> {
  const esPdf = tipoDocumento === 'factura_pdf';
  const formulario = new FormData();
  formulario.append('archivo', {
    uri,
    name: esPdf ? 'factura.pdf' : 'ticket.jpg',
    type: esPdf ? 'application/pdf' : 'image/jpeg',
  } as unknown as Blob);
  formulario.append('tipo_documento', tipoDocumento);

  const respuesta = await fetch(`${API_URL}/api/v1/comprobantes/ocr`, {
    method: 'POST',
    body: formulario,
  });
  if (!respuesta.ok) {
    throw new Error(`El servidor OCR respondió con estado ${respuesta.status}`);
  }
  return respuesta.json();
}

type Ejemplo = Omit<DatosExtraidos, 'fechaEmision' | 'cuotaIva' | 'total' | 'tipoDocumento'> & {
  /** Día de la semana (0 = domingo) y hora en la que se emitió el comprobante. */
  dia: number;
  hora: number;
};

const NIF_AUTONOMO_DEMO = '12345678Z';

const EJEMPLOS_TICKET: Ejemplo[] = [
  {
    razonSocialEmisor: 'Papelería Albarregas S.L.',
    nifEmisor: 'B06123456',
    nifReceptor: NIF_AUTONOMO_DEMO,
    baseImponible: 38.4,
    tipoIva: 21,
    categoria: 'material_oficina',
    dia: 2,
    hora: 10,
  },
  {
    razonSocialEmisor: 'Restaurante El Puente Romano',
    nifEmisor: 'B06654321',
    nifReceptor: null,
    baseImponible: 62.73,
    tipoIva: 10,
    categoria: 'restauracion',
    dia: 6,
    hora: 23,
  },
  {
    razonSocialEmisor: 'Estación de Servicio Vía de la Plata',
    nifEmisor: 'A06987654',
    nifReceptor: NIF_AUTONOMO_DEMO,
    baseImponible: 49.59,
    tipoIva: 21,
    categoria: 'combustible',
    dia: 3,
    hora: 8,
  },
  {
    razonSocialEmisor: 'Ayuntamiento de Mérida – Policía Local',
    nifEmisor: 'P0608300J',
    nifReceptor: NIF_AUTONOMO_DEMO,
    baseImponible: 90,
    tipoIva: 0,
    categoria: 'multas',
    dia: 4,
    hora: 12,
  },
  {
    razonSocialEmisor: 'Bar Cafetería Plaza',
    nifEmisor: null,
    nifReceptor: null,
    baseImponible: 11.82,
    tipoIva: 10,
    categoria: 'restauracion',
    dia: 1,
    hora: 14,
  },
];

const EJEMPLOS_FACTURA: Ejemplo[] = [
  {
    razonSocialEmisor: 'Eléctrica Extremeña S.A.',
    nifEmisor: 'A06111222',
    nifReceptor: NIF_AUTONOMO_DEMO,
    baseImponible: 74.38,
    tipoIva: 21,
    categoria: 'suministros',
    dia: 1,
    hora: 9,
  },
  {
    razonSocialEmisor: 'Informática Lusitania S.L.',
    nifEmisor: 'B06333444',
    nifReceptor: null,
    baseImponible: 520.66,
    tipoIva: 21,
    categoria: 'material_oficina',
    dia: 5,
    hora: 18,
  },
];

const siguiente: Record<TipoDocumento, number> = { ticket: 0, factura_pdf: 0, factura_imagen: 0 };

async function analizarSimulado(tipoDocumento: TipoDocumento): Promise<DatosExtraidos> {
  await new Promise((resolver) => setTimeout(resolver, 1500));

  const ejemplos = tipoDocumento === 'ticket' ? EJEMPLOS_TICKET : EJEMPLOS_FACTURA;
  const { dia, hora, ...ejemplo } = ejemplos[siguiente[tipoDocumento] % ejemplos.length];
  siguiente[tipoDocumento]++;

  const fecha = new Date();
  fecha.setDate(fecha.getDate() - ((fecha.getDay() - dia + 7) % 7));
  fecha.setHours(hora, Math.floor(Math.random() * 60), 0, 0);

  const cuotaIva = redondear((ejemplo.baseImponible * ejemplo.tipoIva) / 100);
  return {
    ...ejemplo,
    tipoDocumento,
    fechaEmision: fecha.toISOString(),
    cuotaIva,
    total: redondear(ejemplo.baseImponible + cuotaIva),
  };
}

export function redondear(valor: number) {
  return Math.round(valor * 100) / 100;
}
