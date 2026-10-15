/**
 * Festivos nacionales comunes a todo el territorio (calendario laboral del BOE):
 * fijos más el Viernes Santo, que depende de la Pascua.
 */

const FIJOS = [
  [0, 1], // Año Nuevo
  [0, 6], // Epifanía del Señor
  [4, 1], // Fiesta del Trabajo
  [7, 15], // Asunción de la Virgen
  [9, 12], // Fiesta Nacional de España
  [10, 1], // Todos los Santos
  [11, 6], // Día de la Constitución
  [11, 8], // Inmaculada Concepción
  [11, 25], // Navidad
] as const;

/** Domingo de Pascua (algoritmo de Meeus/Jones/Butcher para el calendario gregoriano). */
export function domingoDePascua(anio: number) {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(anio, mes - 1, dia);
}

export function esFestivoNacional(fecha: Date) {
  const mes = fecha.getMonth();
  const dia = fecha.getDate();
  if (FIJOS.some(([m, d]) => m === mes && d === dia)) return true;

  const viernesSanto = domingoDePascua(fecha.getFullYear());
  viernesSanto.setDate(viernesSanto.getDate() - 2);
  return viernesSanto.getMonth() === mes && viernesSanto.getDate() === dia;
}

export function esFinDeSemana(fecha: Date) {
  return fecha.getDay() === 0 || fecha.getDay() === 6;
}
