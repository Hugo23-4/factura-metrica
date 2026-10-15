const LETRAS_DNI = 'TRWAGMYFPDXBNJZSQVHLCKE';

/**
 * Valida un identificador fiscal español: DNI, NIE (dígito de control) o CIF (solo formato).
 */
export function esNifValido(valor: string) {
  const nif = valor.toUpperCase().replace(/[\s-]/g, '');

  if (/^\d{8}[A-Z]$/.test(nif)) {
    return LETRAS_DNI[Number(nif.slice(0, 8)) % 23] === nif[8];
  }

  if (/^[XYZ]\d{7}[A-Z]$/.test(nif)) {
    const numero = 'XYZ'.indexOf(nif[0]) + nif.slice(1, 8);
    return LETRAS_DNI[Number(numero) % 23] === nif[8];
  }

  return /^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/.test(nif);
}
