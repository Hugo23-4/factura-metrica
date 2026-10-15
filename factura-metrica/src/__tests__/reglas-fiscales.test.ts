import { evaluarGasto } from '@/services/reglas-fiscales';
import type { DatosExtraidos } from '@/types/gasto';

/** Martes 13 de octubre de 2026, día laborable. */
const LABORABLE = new Date(2026, 9, 13, 10, 0);
/** Sábado 10 de octubre de 2026. */
const SABADO = new Date(2026, 9, 10, 22, 30);
/** Lunes 12 de octubre de 2026, Fiesta Nacional de España. */
const FESTIVO = new Date(2026, 9, 12, 13, 0);

function gasto(cambios: Partial<DatosExtraidos> & { fecha?: Date } = {}): DatosExtraidos {
  const { fecha = LABORABLE, ...resto } = cambios;
  return {
    fechaEmision: fecha.toISOString(),
    nifEmisor: 'B06123456',
    razonSocialEmisor: 'Papelería Albarregas S.L.',
    nifReceptor: '12345678Z',
    baseImponible: 20,
    tipoIva: 21,
    cuotaIva: 4.2,
    total: 24.2,
    categoria: 'material_oficina',
    tipoDocumento: 'ticket',
    ...resto,
  };
}

describe('Motor de reglas fiscales (DCF de la memoria)', () => {
  it('marca en verde un gasto ordinario en día laborable con todos sus datos', () => {
    expect(evaluarGasto(gasto())).toEqual({ semaforo: 'verde', cuentaPgc: '602' });
  });

  it.each([
    ['sin NIF del emisor (error de lectura)', gasto({ nifEmisor: null }), 'Error de lectura'],
    ['con un NIF del emisor inválido', gasto({ nifEmisor: '1234' }), 'Error de lectura'],
    ['en sábado', gasto({ fecha: SABADO }), 'fin de semana'],
    ['en festivo nacional', gasto({ fecha: FESTIVO }), 'festivo'],
    [
      'de restauración por encima del límite de manutención',
      gasto({ categoria: 'restauracion', baseImponible: 30, cuotaIva: 3, total: 33 }),
      'Exceso de manutención',
    ],
    [
      'con ticket de más de 400 € sin NIF del receptor',
      gasto({ nifReceptor: null, baseImponible: 400, cuotaIva: 84, total: 484 }),
      'Falta NIF del receptor',
    ],
  ])('marca en amarillo un gasto %s', (_, datos, motivo) => {
    const resultado = evaluarGasto(datos);
    expect(resultado.semaforo).toBe('amarillo');
    expect(resultado.motivoRiesgo).toContain(motivo);
    expect(resultado.preguntaAsesor).toBeTruthy();
  });

  it.each([
    ['multas', '678'],
    ['consumo_personal', '—'],
  ] as const)('marca en rojo la categoría %s aunque sea fin de semana', (categoria, cuenta) => {
    const resultado = evaluarGasto(gasto({ categoria, fecha: SABADO }));
    expect(resultado.semaforo).toBe('rojo');
    expect(resultado.cuentaPgc).toBe(cuenta);
    expect(resultado.preguntaAsesor).toBeUndefined();
  });

  it.each([
    ['combustible', '628'],
    ['suministros', '628'],
    ['transporte', '624'],
    ['publicidad', '627'],
    ['servicios_profesionales', '623'],
    ['alojamiento', '629'],
  ] as const)('propone la subcuenta del PGC de %s', (categoria, cuenta) => {
    expect(evaluarGasto(gasto({ categoria })).cuentaPgc).toBe(cuenta);
  });

  it.each([4, 10, 21])('no depende del tipo de IVA (%i %%) para un gasto correcto', (tipoIva) => {
    const cuotaIva = (20 * tipoIva) / 100;
    expect(evaluarGasto(gasto({ tipoIva, cuotaIva, total: 20 + cuotaIva })).semaforo).toBe('verde');
  });

  it('acepta una comida justo en el límite de manutención', () => {
    const datos = gasto({
      categoria: 'restauracion',
      baseImponible: 24.25,
      cuotaIva: 2.42,
      total: 26.67,
    });
    expect(evaluarGasto(datos).semaforo).toBe('verde');
  });
});
