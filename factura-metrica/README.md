# FacturaMétrica · App móvil

Aplicación multiplataforma (React Native + Expo, iOS, Android y web) del proyecto FacturaMétrica: el filtro fiscal preventivo que conecta al autónomo con su asesoría. Implementa los requisitos, casos de uso y diagramas de la memoria del proyecto (`TAREAS/Plantila para proyectos EIS Albarregas.docx`).

## Roles

| Rol | Qué puede hacer |
| --- | --- |
| **Sin registrar** | Portada, simulador del semáforo fiscal (no guarda nada), guía de gastos deducibles, registro e inicio de sesión. |
| **Cliente (autónomo)** | CRUD de sus gastos: capturar (cámara, galería, PDF/PNG/JPG), revisar los datos del OCR, editar, justificar ante el Asesor Fiscal Virtual, eliminar. Informes, cierre trimestral, recordatorios y edición o baja de su cuenta. |
| **Admin (gestor de la asesoría)** | CRUD de la cartera de clientes (alta, edición, pausa, baja y asignación de gestor), bandeja unificada, aprobación o rechazo de justificaciones, rectificación de la cuenta PGC, exportación CSV/JSON e historial de lotes. |

Cada operación comprueba el rol y la asesoría de quien la ejecuta: un gestor solo ve los clientes y gastos de su despacho (aislamiento multi-tenant, RNF-06).

## Entorno de pruebas para el tribunal

En la pantalla de inicio de sesión hay dos botones de **acceso de prueba**. Los datos precargados incluyen dos asesorías, tres gestores y seis autónomos con más de 40 comprobantes en verde, amarillo y rojo:

| Perfil | Correo | Contraseña |
| --- | --- | --- |
| Gestora (Asesoría Albarregas) | `laura.gestora@facturametrica.test` | `Gestor2026!` |
| Gestor (Asesoría Albarregas) | `javier.gestor@facturametrica.test` | `Gestor2026!` |
| Gestora (Gestoría Emérita) | `marta.gestora@facturametrica.test` | `Gestor2026!` |
| Autónomo | `carlos@facturametrica.test` (y `ana@`, `pedro@`, `lucia@`, `rosa@`) | `Cliente2026!` |

`miguel@facturametrica.test` está pausado para mostrar el bloqueo de acceso. Los códigos de invitación para registrarse son `ALB2026` y `EMERITA`. Desde el perfil del gestor se pueden **restablecer los datos de prueba**.

## Requisitos de la memoria

| Requisito | Implementación |
| --- | --- |
| RF-01 Autenticación y RBAC | `context/sesion-context.tsx`, `services/auth.ts` (bcrypt) |
| RF-02 Captura con recorte | `app/(cliente)/capturar.tsx` |
| RF-03 Facturas PDF, PNG y JPG | `app/(cliente)/capturar.tsx` |
| RF-04 Extracción OCR (simulada hasta tener backend) | `services/ocr.ts` |
| RF-05 Motor de reglas (algoritmo del DCF, con festivos) | `services/reglas-fiscales.ts`, `utils/festivos.ts` |
| RF-06 Asesor Fiscal Virtual | `app/justificar/[id].tsx` |
| RF-07 Semáforo y máquina de estados (DFE) | `services/estado-gasto.ts` |
| RF-08 Bandeja multi-cliente con filtro 1T-4T | `app/admin/(tabs)/bandeja.tsx` |
| RF-09 Aprobar, rectificar o rechazar en un clic | `app/admin/gasto/[id].tsx` |
| RF-10 Cuentas del PGC | `constants/fiscal.ts` |
| RF-11 Exportación CSV/JSON | `services/exportacion.ts`, `app/admin/(tabs)/exportar.tsx` |
| RF-12 Custodia con huella SHA-256 | `services/documentos.ts` |
| RF-13 Recordatorios de cierre y pendientes | `services/notificaciones.ts` |
| RF-14 Cartera de clientes y gestores | `app/admin/(tabs)/clientes.tsx`, `app/admin/cliente/` |
| RNF-03 Uso offline | Persistencia local en `context/` |
| RNF-05 Contraseñas con bcrypt | `services/auth.ts` |
| RNF-06 Aislamiento multi-tenant | `context/` (filtros por asesoría) |

### Algoritmo del semáforo (DCF)

1. Sin NIF válido o sin importe → amarillo (error de lectura, revisión manual).
2. Multas, sanciones o consumo personal → rojo.
3. Sábado, domingo o festivo nacional → amarillo (justificación obligatoria).
4. Restauración por encima de 26,67 €/día → amarillo (exceso de manutención).
5. Ticket de más de 400 € sin NIF del receptor → amarillo (pedir factura completa).
6. Sin alertas → verde, con la subcuenta del PGC por defecto.

## Puesta en marcha

```bash
npm install
npm start
```

Escanea el QR con **Expo Go** o pulsa `w` para abrirla en el navegador.

Mientras no exista el backend FastAPI, el OCR devuelve comprobantes de ejemplo. Para usar el backend real, crea `.env.local` con `EXPO_PUBLIC_API_URL=http://<ip>:8000`; la app enviará el archivo a `POST /api/v1/comprobantes/ocr`.

## Pruebas

```bash
npm test            # Jest: pruebas unitarias, parametrizadas y con mocks
npm run typecheck   # comprobación de tipos
npm run lint        # linter
```

Las pruebas (`src/__tests__/`) cubren el motor de reglas, la máquina de estados, la exportación CSV, la validación de NIF, el calendario fiscal y festivos, y el cifrado y la validación de usuarios con un mock del módulo nativo de Expo.

## Estructura

```
src/
├── app/
│   ├── bienvenida, login, registro, simulador, guia   # Visitante
│   ├── (cliente)/                                     # Pestañas del autónomo
│   ├── revisar, gasto/, editar/, justificar/, enviar  # Flujo del gasto
│   ├── admin/                                         # Panel del gestor
│   └── cuenta.tsx                                     # Mi cuenta (ambos roles)
├── components/      # Componentes reutilizables
├── constants/       # Tema, catálogos fiscales y pestañas
├── context/         # Sesión y gastos (estado global, permisos y persistencia)
├── services/        # Reglas, OCR, auth, exportación, documentos, datos de prueba
├── types/           # Modelo de datos (tablas de la memoria)
└── utils/           # Formato, NIF, calendario fiscal, festivos
```
