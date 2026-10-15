import { redondear } from '@/services/ocr';
import { evaluarGasto } from '@/services/reglas-fiscales';
import type { Categoria, Exportacion, Gasto } from '@/types/gasto';
import type { Usuario } from '@/types/usuario';
import { esFestivoNacional, esFinDeSemana } from '@/utils/festivos';
import { perteneceATrimestre, trimestreDe, ultimosTrimestres } from '@/utils/trimestre';

/**
 * Entorno de pruebas para el tribunal (Fase de Implantación de la memoria):
 * dos asesorías, tres gestores y seis autónomos con más de 30 comprobantes
 * repartidos en verde, amarillo y rojo.
 *
 * Contraseñas de prueba: los gestores usan «Gestor2026!» y los autónomos «Cliente2026!».
 */

const HASH_GESTOR = '$2b$10$zu42O4wWHjzYvT7g.f6d.uX3UMJIiCsb9mJ7FJc6qWSC6uY8lbtxW';
const HASH_CLIENTE = '$2b$10$n3TmYvYu6ldcxx7uun6gne7JhhWn2FjJZIqZGAOiB6ZLIcE5/xFKO';

export const EMAIL_GESTOR_DEMO = 'laura.gestora@facturametrica.test';
export const EMAIL_CLIENTE_DEMO = 'carlos@facturametrica.test';
export const CONTRASENA_GESTOR_DEMO = 'Gestor2026!';
export const CONTRASENA_CLIENTE_DEMO = 'Cliente2026!';

const ALTA = '2026-01-15T09:00:00.000Z';

function gestor(id: string, asesoriaId: string, nombre: string, email: string): Usuario {
  return {
    id,
    rol: 'admin',
    asesoriaId,
    nombre,
    email,
    passwordHash: HASH_GESTOR,
    activo: true,
    creadoEn: ALTA,
    nif: '',
    actividad: 'Gestor contable',
    recordatorios: false,
  };
}

function cliente(
  id: string,
  asesoriaId: string,
  gestorId: string,
  nombre: string,
  email: string,
  nif: string,
  actividad: string,
  activo = true,
): Usuario {
  return {
    id,
    rol: 'cliente',
    asesoriaId,
    gestorId,
    nombre,
    email,
    passwordHash: HASH_CLIENTE,
    activo,
    creadoEn: ALTA,
    nif,
    actividad,
    telefono: '600 000 000',
    domicilioFiscal: 'Mérida (Badajoz)',
    recordatorios: false,
  };
}

export function crearUsuariosDemo(): Usuario[] {
  return [
    gestor('u-laura', 'as-albarregas', 'Laura Gómez Rivas', EMAIL_GESTOR_DEMO),
    gestor('u-javier', 'as-albarregas', 'Javier Moreno Díaz', 'javier.gestor@facturametrica.test'),
    gestor('u-marta', 'as-emerita', 'Marta Sánchez Gil', 'marta.gestora@facturametrica.test'),
    cliente(
      'u-carlos',
      'as-albarregas',
      'u-laura',
      'Carlos Martín Sánchez',
      EMAIL_CLIENTE_DEMO,
      '12345678Z',
      'Reformas y fontanería (IAE 504.2)',
    ),
    cliente(
      'u-ana',
      'as-albarregas',
      'u-laura',
      'Ana Ruiz Pérez',
      'ana@facturametrica.test',
      '87654321X',
      'Diseño gráfico (IAE 844)',
    ),
    cliente(
      'u-pedro',
      'as-albarregas',
      'u-javier',
      'Pedro Gallardo Núñez',
      'pedro@facturametrica.test',
      '45678912S',
      'Transporte de mercancías (IAE 722)',
    ),
    cliente(
      'u-lucia',
      'as-albarregas',
      'u-javier',
      'Lucía Romero Vega',
      'lucia@facturametrica.test',
      '23456789D',
      'Fisioterapia (IAE 839)',
    ),
    cliente(
      'u-miguel',
      'as-albarregas',
      'u-laura',
      'Miguel Ángel Cortés',
      'miguel@facturametrica.test',
      '11223344B',
      'Consultoría informática (IAE 763)',
      false,
    ),
    cliente(
      'u-rosa',
      'as-emerita',
      'u-marta',
      'Rosa Delgado Pino',
      'rosa@facturametrica.test',
      '34567890V',
      'Fotografía (IAE 864)',
    ),
  ];
}

interface Plantilla {
  diasAtras: number;
  hora: number;
  /** El ticket se emitió en sábado (gasto de riesgo) o en día laborable. */
  finde?: boolean;
  razonSocial: string;
  nif: string | null;
  conReceptor: boolean;
  base: number;
  iva: number;
  categoria: Categoria;
  justificacion?: { motivo: string; cliente?: string; nif?: string };
}

const PLANTILLAS: Plantilla[] = [
  {
    diasAtras: 1,
    hora: 10,
    razonSocial: 'Papelería Albarregas S.L.',
    nif: 'B06123456',
    conReceptor: true,
    base: 24.3,
    iva: 21,
    categoria: 'material_oficina',
  },
  {
    diasAtras: 3,
    hora: 22,
    finde: true,
    razonSocial: 'Restaurante El Puente Romano',
    nif: 'B06654321',
    conReceptor: false,
    base: 58.18,
    iva: 10,
    categoria: 'restauracion',
  },
  {
    diasAtras: 4,
    hora: 8,
    razonSocial: 'Estación de Servicio Vía de la Plata',
    nif: 'A06987654',
    conReceptor: true,
    base: 57.85,
    iva: 21,
    categoria: 'combustible',
  },
  {
    diasAtras: 6,
    hora: 9,
    razonSocial: 'Eléctrica Extremeña S.A.',
    nif: 'A06111222',
    conReceptor: true,
    base: 68.6,
    iva: 21,
    categoria: 'suministros',
  },
  {
    diasAtras: 8,
    hora: 13,
    razonSocial: 'Mesón La Alcazaba',
    nif: 'B06555666',
    conReceptor: false,
    base: 40.91,
    iva: 10,
    categoria: 'restauracion',
    justificacion: {
      motivo:
        'Comida con cliente para presentar el presupuesto de la obra de la calle Santa Eulalia',
      cliente: 'Construcciones Guadiana S.L.',
      nif: 'B06777777',
    },
  },
  {
    diasAtras: 10,
    hora: 11,
    razonSocial: 'Ayuntamiento de Mérida – Policía Local',
    nif: 'P0608300J',
    conReceptor: true,
    base: 90,
    iva: 0,
    categoria: 'multas',
  },
  {
    diasAtras: 12,
    hora: 7,
    razonSocial: 'Autocares Vía de la Plata S.A.',
    nif: 'A06222333',
    conReceptor: true,
    base: 31.82,
    iva: 10,
    categoria: 'transporte',
  },
  {
    diasAtras: 15,
    hora: 20,
    razonSocial: 'Hotel Ciudad de Cáceres',
    nif: 'B10222333',
    conReceptor: true,
    base: 72.73,
    iva: 10,
    categoria: 'alojamiento',
  },
  {
    diasAtras: 18,
    hora: 12,
    razonSocial: 'Imprenta Romana S.L.',
    nif: 'B06999000',
    conReceptor: true,
    base: 120,
    iva: 21,
    categoria: 'publicidad',
  },
  {
    diasAtras: 40,
    hora: 10,
    razonSocial: 'Informática Lusitania S.L.',
    nif: 'B06333444',
    conReceptor: true,
    base: 412.4,
    iva: 21,
    categoria: 'material_oficina',
  },
  {
    diasAtras: 45,
    hora: 9,
    razonSocial: 'Telefonía Vettonia S.L.',
    nif: 'B06444555',
    conReceptor: true,
    base: 33.06,
    iva: 21,
    categoria: 'suministros',
  },
  {
    diasAtras: 52,
    hora: 14,
    finde: true,
    razonSocial: 'Bar Cafetería Plaza',
    nif: 'B06121212',
    conReceptor: false,
    base: 9.09,
    iva: 10,
    categoria: 'restauracion',
    justificacion: { motivo: 'Café con proveedor de azulejos para negociar condiciones de pago' },
  },
  {
    diasAtras: 60,
    hora: 8,
    razonSocial: 'Estación de Servicio Vía de la Plata',
    nif: 'A06987654',
    conReceptor: true,
    base: 61.98,
    iva: 21,
    categoria: 'combustible',
  },
  {
    diasAtras: 70,
    hora: 17,
    razonSocial: 'Asesores Jurídicos Emeritenses',
    nif: 'B06343434',
    conReceptor: true,
    base: 150,
    iva: 21,
    categoria: 'servicios_profesionales',
  },
  {
    diasAtras: 75,
    hora: 12,
    razonSocial: 'Ferretería Romana S.L.',
    nif: 'B06888999',
    conReceptor: true,
    base: 87.6,
    iva: 21,
    categoria: 'otros',
  },
  {
    diasAtras: 80,
    hora: 19,
    finde: true,
    razonSocial: 'Hipermercado Guadiana',
    nif: 'A06565656',
    conReceptor: false,
    base: 54.2,
    iva: 10,
    categoria: 'consumo_personal',
  },
];

/** Qué plantillas recibe cada autónomo y cuántos días se desplazan sus fechas. */
const REPARTO: Record<string, { indices: number[]; desfase: number }> = {
  'u-carlos': { indices: PLANTILLAS.map((_, i) => i), desfase: 0 },
  'u-ana': { indices: [0, 3, 4, 8, 9, 10, 11, 13], desfase: 2 },
  'u-pedro': { indices: [1, 2, 4, 6, 7, 12, 15], desfase: 1 },
  'u-lucia': { indices: [0, 3, 5, 9, 11, 14], desfase: 3 },
  'u-miguel': { indices: [2, 10, 13], desfase: 5 },
  'u-rosa': { indices: [0, 1, 7, 9], desfase: 4 },
};

/** Lleva la fecha al sábado anterior o al laborable anterior según lo que pida la plantilla. */
function ajustarDia(fecha: Date, finde: boolean) {
  const resultado = new Date(fecha);
  const esValido = (f: Date) =>
    finde ? f.getDay() === 6 : !esFinDeSemana(f) && !esFestivoNacional(f);
  while (!esValido(resultado)) resultado.setDate(resultado.getDate() - 1);
  return resultado;
}

export function crearGastosDemo(usuarios: Usuario[], ahora = new Date()) {
  const trimestreActual = trimestreDe(ahora);
  const [, trimestreAnterior] = ultimosTrimestres(ahora, 2);
  const haceDias = (dias: number) => new Date(ahora.getTime() - dias * 86_400_000).toISOString();
  const gastos: Gasto[] = [];

  for (const usuario of usuarios.filter((u) => u.rol === 'cliente')) {
    const reparto = REPARTO[usuario.id];
    if (!reparto) continue;

    for (const indice of reparto.indices) {
      const p = PLANTILLAS[indice];
      const base = new Date(ahora);
      base.setDate(base.getDate() - p.diasAtras - reparto.desfase);
      const fecha = ajustarDia(base, Boolean(p.finde));
      fecha.setHours(p.hora, (indice * 7) % 60, 0, 0);

      const cuotaIva = redondear((p.base * p.iva) / 100);
      const datos = {
        fechaEmision: fecha.toISOString(),
        nifEmisor: p.nif,
        razonSocialEmisor: p.razonSocial,
        nifReceptor: p.conReceptor ? usuario.nif : null,
        baseImponible: p.base,
        tipoIva: p.iva,
        cuotaIva,
        total: redondear(p.base + cuotaIva),
        categoria: p.categoria,
        tipoDocumento: p.conReceptor ? ('factura_pdf' as const) : ('ticket' as const),
      };
      const evaluacion = evaluarGasto(datos);
      const anterior = !perteneceATrimestre(datos.fechaEmision, trimestreActual);
      const pendiente = evaluacion.semaforo === 'amarillo' && !p.justificacion;

      gastos.push({
        ...datos,
        ...evaluacion,
        id: `${usuario.id}-g${indice}`,
        clienteId: usuario.id,
        asesoriaId: usuario.asesoriaId,
        creadoEn: fecha.toISOString(),
        // Los gastos revisados de trimestres anteriores ya se enviaron a la gestoría.
        enviadoEn: anterior && !pendiente ? haceDias(6) : undefined,
        justificacion: p.justificacion && {
          motivoProfesional: p.justificacion.motivo,
          clienteNombre: p.justificacion.cliente,
          clienteNif: p.justificacion.nif,
          fecha: fecha.toISOString(),
        },
      });
    }
  }

  // Justificaciones del trimestre anterior ya aprobadas por el gestor.
  for (const gasto of gastos) {
    const delAnterior = perteneceATrimestre(gasto.fechaEmision, trimestreAnterior);
    if (delAnterior && gasto.justificacion && gasto.asesoriaId === 'as-albarregas') {
      const gestorId = usuarios.find((u) => u.id === gasto.clienteId)?.gestorId ?? 'u-laura';
      gasto.revision = { decision: 'aprobado', gestorId, fecha: haceDias(4) };
    }
  }

  // Una justificación rechazada para mostrar la rectificación por parte del autónomo.
  const rechazable = gastos.find(
    (g) => g.clienteId === 'u-pedro' && g.justificacion && !g.revision,
  );
  if (rechazable) {
    rechazable.revision = {
      decision: 'rechazado',
      comentario: 'Falta el NIF del cliente con el que te reuniste. Añádelo y vuelve a enviarla.',
      gestorId: 'u-javier',
      fecha: haceDias(1),
    };
  }

  // Un lote del trimestre anterior ya exportado al ERP (estado EXPORTADO_CONTABILIZADO).
  const exportacion: Exportacion = {
    id: 'exp-demo-1',
    asesoriaId: 'as-albarregas',
    gestorId: 'u-laura',
    trimestre: trimestreAnterior.numero,
    anio: trimestreAnterior.anio,
    formato: 'csv',
    numAsientos: 0,
    totalImporte: 0,
    fecha: haceDias(3),
  };
  for (const gasto of gastos) {
    const exportable =
      gasto.clienteId === 'u-ana' &&
      perteneceATrimestre(gasto.fechaEmision, trimestreAnterior) &&
      (gasto.semaforo === 'verde' || gasto.revision?.decision === 'aprobado');
    if (exportable) {
      gasto.exportacionId = exportacion.id;
      exportacion.numAsientos++;
      exportacion.totalImporte = redondear(exportacion.totalImporte + gasto.total);
    }
  }

  return { gastos, exportaciones: exportacion.numAsientos > 0 ? [exportacion] : [] };
}
