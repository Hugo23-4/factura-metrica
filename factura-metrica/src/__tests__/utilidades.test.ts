import { domingoDePascua, esFestivoNacional } from '@/utils/festivos';
import { esNifValido } from '@/utils/nif';
import { proximoPlazo, trimestreDe, ultimosTrimestres } from '@/utils/trimestre';

describe('Validación de NIF', () => {
  it.each([
    '12345678Z',
    '87654321X',
    '12345678z',
    '12345678-Z',
    'X1234567L',
    'B06123456',
    'P0608300J',
  ])('acepta %s', (nif) => expect(esNifValido(nif)).toBe(true));

  it.each(['12345678A', '1234', 'X1234567A', 'I06123456', '', 'ABCDEFGHI'])('rechaza %s', (nif) =>
    expect(esNifValido(nif)).toBe(false),
  );
});

describe('Festivos nacionales', () => {
  it.each([
    [2025, 3, 20],
    [2026, 3, 5],
    [2027, 2, 28],
  ])('calcula el Domingo de Pascua de %i', (anio, mes, dia) => {
    expect(domingoDePascua(anio)).toEqual(new Date(anio, mes, dia));
  });

  it.each([
    new Date(2026, 0, 1),
    new Date(2026, 3, 3), // Viernes Santo
    new Date(2026, 9, 12),
    new Date(2026, 11, 25),
  ])('reconoce %s como festivo', (fecha) => expect(esFestivoNacional(fecha)).toBe(true));

  it('no marca como festivo un día laborable', () => {
    expect(esFestivoNacional(new Date(2026, 9, 13))).toBe(false);
  });
});

describe('Calendario fiscal trimestral', () => {
  it.each([
    [new Date(2026, 0, 15), 1],
    [new Date(2026, 5, 30), 2],
    [new Date(2026, 6, 1), 3],
    [new Date(2026, 11, 31), 4],
  ])('sitúa %s en el %iT', (fecha, numero) => expect(trimestreDe(fecha).numero).toBe(numero));

  it('calcula los días hasta el plazo del 3T (20 de octubre)', () => {
    const plazo = proximoPlazo(new Date(2026, 9, 15));
    expect(plazo.trimestre).toEqual({ numero: 3, anio: 2026 });
    expect(plazo.dias).toBe(5);
  });

  it('el día del plazo todavía cuenta como dentro de plazo', () => {
    expect(proximoPlazo(new Date(2026, 9, 20)).dias).toBe(0);
  });

  it('en enero el plazo es el del 4T del año anterior', () => {
    expect(proximoPlazo(new Date(2027, 0, 10)).trimestre).toEqual({ numero: 4, anio: 2026 });
  });

  it('enumera los trimestres anteriores cruzando el cambio de año', () => {
    expect(ultimosTrimestres(new Date(2026, 1, 1), 3)).toEqual([
      { numero: 1, anio: 2026 },
      { numero: 4, anio: 2025 },
      { numero: 3, anio: 2025 },
    ]);
  });
});
