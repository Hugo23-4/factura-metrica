import {
  cifrarContrasena,
  comprobarContrasena,
  emailEnUso,
  validarDatosUsuario,
} from '@/services/auth';
import type { DatosUsuario, Usuario } from '@/types/usuario';

/**
 * Pruebas de acceso de usuario. El módulo nativo `expo-crypto` se sustituye por un mock
 * (equivalente a Mockito en Java) para ejecutar las pruebas fuera del dispositivo.
 */
jest.mock('expo-crypto', () => ({
  getRandomBytes: jest.fn((longitud: number) => new Uint8Array(longitud).fill(7)),
}));

const datosValidos: DatosUsuario = {
  nombre: 'Ana Ruiz Pérez',
  email: 'ana@facturametrica.test',
  nif: '87654321X',
  actividad: 'Diseño gráfico',
  contrasena: 'Segura2026',
};

describe('Cifrado de contraseñas con bcrypt', () => {
  it('no guarda la contraseña en claro y valida la correcta', async () => {
    const hash = await cifrarContrasena('Segura2026');

    expect(hash).not.toContain('Segura2026');
    expect(hash).toMatch(/^\$2[aby]\$08\$/);
    await expect(comprobarContrasena('Segura2026', hash)).resolves.toBe(true);
    await expect(comprobarContrasena('segura2026', hash)).resolves.toBe(false);
  });

  it('genera una sal distinta en cada cifrado', async () => {
    const [primero, segundo] = await Promise.all([
      cifrarContrasena('OtraClave1'),
      cifrarContrasena('OtraClave1'),
    ]);
    expect(primero).not.toBe(segundo);
  });
});

describe('Validación de los datos de usuario', () => {
  it('acepta un alta de autónomo correcta', () => {
    expect(
      validarDatosUsuario(datosValidos, { contrasenaObligatoria: true, esCliente: true }),
    ).toEqual({});
  });

  it.each([
    ['nombre', { nombre: 'A' }],
    ['email', { email: 'ana@' }],
    ['nif', { nif: '12345678A' }],
    ['contrasena', { contrasena: 'corta' }],
  ] as const)('detecta un %s incorrecto', (campo, cambio) => {
    const errores = validarDatosUsuario(
      { ...datosValidos, ...cambio },
      { contrasenaObligatoria: true, esCliente: true },
    );
    expect(errores[campo]).toBeDefined();
  });

  it('en la edición la contraseña vacía no es obligatoria', () => {
    const errores = validarDatosUsuario(
      { ...datosValidos, contrasena: '' },
      { contrasenaObligatoria: false, esCliente: true },
    );
    expect(errores.contrasena).toBeUndefined();
  });

  it('impide registrar dos cuentas con el mismo correo, sin distinguir mayúsculas', () => {
    const usuarios = [{ id: 'u-1', email: 'ana@facturametrica.test' } as Usuario];
    expect(emailEnUso(usuarios, ' ANA@facturametrica.test ')).toBe(true);
    expect(emailEnUso(usuarios, 'ana@facturametrica.test', 'u-1')).toBe(false);
  });
});
