/** Utilidades del calendario fiscal trimestral (modelos 303 y 130). */

export interface Trimestre {
  numero: 1 | 2 | 3 | 4;
  anio: number;
}

export function trimestreDe(fecha: Date): Trimestre {
  return {
    numero: (Math.floor(fecha.getMonth() / 3) + 1) as Trimestre['numero'],
    anio: fecha.getFullYear(),
  };
}

export function etiquetaTrimestre({ numero, anio }: Trimestre) {
  return `${numero}T ${anio}`;
}

export function perteneceATrimestre(iso: string, trimestre: Trimestre) {
  const t = trimestreDe(new Date(iso));
  return t.numero === trimestre.numero && t.anio === trimestre.anio;
}

/**
 * Próximo plazo de presentación de los modelos 303/130:
 * 1T → 20 de abril, 2T → 20 de julio, 3T → 20 de octubre, 4T → 30 de enero.
 */
export function proximoPlazo(hoy: Date) {
  const anio = hoy.getFullYear();
  const plazos = [
    { trimestre: { numero: 4, anio: anio - 1 }, limite: new Date(anio, 0, 30) },
    { trimestre: { numero: 1, anio }, limite: new Date(anio, 3, 20) },
    { trimestre: { numero: 2, anio }, limite: new Date(anio, 6, 20) },
    { trimestre: { numero: 3, anio }, limite: new Date(anio, 9, 20) },
    { trimestre: { numero: 4, anio }, limite: new Date(anio + 1, 0, 30) },
  ] as const;

  const inicioHoy = new Date(anio, hoy.getMonth(), hoy.getDate());
  const plazo = plazos.find((p) => p.limite >= inicioHoy) ?? plazos[plazos.length - 1];
  const dias = Math.round((plazo.limite.getTime() - inicioHoy.getTime()) / 86_400_000);

  return { trimestre: plazo.trimestre as Trimestre, limite: plazo.limite, dias };
}

export function mismoTrimestre(a: Trimestre, b: Trimestre) {
  return a.numero === b.numero && a.anio === b.anio;
}

/** El trimestre actual y los `cantidad - 1` anteriores, del más reciente al más antiguo. */
export function ultimosTrimestres(hoy: Date, cantidad: number): Trimestre[] {
  const actual = trimestreDe(hoy);
  return Array.from({ length: cantidad }, (_, i) => {
    const indice = actual.anio * 4 + (actual.numero - 1) - i;
    return {
      numero: ((indice % 4) + 1) as Trimestre['numero'],
      anio: Math.floor(indice / 4),
    };
  });
}
