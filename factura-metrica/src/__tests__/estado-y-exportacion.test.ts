import { esDeducible, esExportable, estadoDe, ivaDeducible } from '@/services/estado-gasto';
import { crearAsientos, generarCsv } from '@/services/exportacion';
import type { Gasto } from '@/types/gasto';
import type { Usuario } from '@/types/usuario';

function gasto(cambios: Partial<Gasto> = {}): Gasto {
  return {
    id: 'g1',
    clienteId: 'u-1',
    asesoriaId: 'as-1',
    fechaEmision: new Date(2026, 9, 13, 10).toISOString(),
    nifEmisor: 'B06123456',
    razonSocialEmisor: 'Papelería; "La Plaza"',
    nifReceptor: '12345678Z',
    baseImponible: 100,
    tipoIva: 21,
    cuotaIva: 21,
    total: 121,
    categoria: 'material_oficina',
    tipoDocumento: 'ticket',
    semaforo: 'verde',
    cuentaPgc: '602',
    creadoEn: new Date(2026, 9, 13).toISOString(),
    ...cambios,
  };
}

const justificacion = { motivoProfesional: 'Comida con cliente', fecha: '2026-10-13' };
const revision = (decision: 'aprobado' | 'rechazado') => ({
  decision,
  gestorId: 'u-g',
  fecha: '2026-10-14',
});

describe('Máquina de estados del comprobante (DFE)', () => {
  it.each([
    ['VERDE_DEDUCIBLE', gasto(), 'validado'],
    ['AMARILLO_PENDIENTE_JUSTIFICACION', gasto({ semaforo: 'amarillo' }), 'pendiente'],
    ['AMARILLO_JUSTIFICADO', gasto({ semaforo: 'amarillo', justificacion }), 'justificado'],
    ['ROJO_NO_DEDUCIBLE', gasto({ semaforo: 'rojo' }), 'no_deducible'],
    [
      'APROBADO_GESTOR',
      gasto({ semaforo: 'amarillo', justificacion, revision: revision('aprobado') }),
      'aprobado',
    ],
    [
      'rechazado por el gestor',
      gasto({ semaforo: 'amarillo', justificacion, revision: revision('rechazado') }),
      'rechazado',
    ],
    ['EXPORTADO_CONTABILIZADO', gasto({ exportacionId: 'exp-1' }), 'exportado'],
  ])('%s', (_, datos, estado) => expect(estadoDe(datos)).toBe(estado));

  it('solo se exportan gastos verdes o aprobados por el gestor', () => {
    expect(esExportable(gasto())).toBe(true);
    expect(esExportable(gasto({ semaforo: 'amarillo', justificacion }))).toBe(false);
    expect(
      esExportable(gasto({ semaforo: 'amarillo', justificacion, revision: revision('aprobado') })),
    ).toBe(true);
    expect(esExportable(gasto({ exportacionId: 'exp-1' }))).toBe(false);
  });

  it('un gasto rechazado deja de contar como deducible', () => {
    expect(
      esDeducible(gasto({ semaforo: 'amarillo', justificacion, revision: revision('rechazado') })),
    ).toBe(false);
  });

  it('aplica el 50 % de deducción del IVA al combustible', () => {
    expect(ivaDeducible(gasto({ categoria: 'combustible' }))).toBe(10.5);
    expect(ivaDeducible(gasto())).toBe(21);
  });
});

describe('Exportación contable', () => {
  const clientes = [{ id: 'u-1', nombre: 'Carlos Martín', nif: '12345678Z' } as Usuario];

  it('genera un CSV para Excel con BOM, separador «;» y coma decimal', () => {
    const csv = generarCsv(crearAsientos([gasto()], clientes));
    const [cabecera, fila] = csv.replace('﻿', '').split('\r\n');

    expect(csv.startsWith('﻿')).toBe(true);
    expect(cabecera.split(';')).toContain('Cuenta PGC');
    expect(fila).toContain('12345678Z;Carlos Martín;B06123456');
    expect(fila).toContain(';100,00;21;21,00;21,00;100,00;121,00;');
  });

  it('escapa los textos con punto y coma o comillas', () => {
    const csv = generarCsv(crearAsientos([gasto()], clientes));
    expect(csv).toContain('"Papelería; ""La Plaza"""');
  });
});
