# Manual de Programador · FacturaMétrica 🛠️💻

Documentación técnica de la arquitectura, patrones de diseño y estructura del código fuente.

---

## 1. Arquitectura General del Sistema

FacturaMétrica está construida bajo una **Arquitectura en Capas Desacopladas (Clean Architecture)** orientada a servicios:

```
┌────────────────────────────────────────────────────────┐
│               Frontend (React Native / Expo)           │
│  - Expo Router (Rutas por rol: visitante, cliente, admin)
│  - Context API (Sesión multi-tenant, Gestión de Gastos)│
│  - UI Components (Diseño en escala de grises + Semáforo)
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / JSON (FormData OCR)
┌───────────────────────────▼────────────────────────────┐
│                    Backend (FastAPI)                   │
│  - Router v1: OCR, Gastos, Evaluación Fiscal           │
│  - Motor Fiscal: Reglas LIRPF / AEAT (algoritmo DCF)   │
│  - Motor OCR: Extracción NER, Tesseract y fallback     │
└───────────────────────────┬────────────────────────────┘
                            │ SQLAlchemy 2.0 ORM
┌───────────────────────────▼────────────────────────────┐
│             Base de Datos (PostgreSQL / SQLite)        │
│  - Asesorias, Usuarios, ClientesAutonomos, Gastos      │
│  - JustificacionesFiscales, ExportacionesContables     │
└────────────────────────────────────────────────────────┘
```

---

## 2. Estructura del Frontend (`factura-metrica/`)

* `src/app/`: Enrutamiento basado en archivos con Expo Router.
  * `bienvenida.tsx`, `login.tsx`, `registro.tsx`, `simulador.tsx`, `guia.tsx`: Vistas públicas.
  * `(cliente)/`: Pestañas del autónomo (`index`, `capturar`, `gastos`, `informes`, `perfil`).
  * `revisar.tsx`, `justificar/[id].tsx`, `gasto/[id].tsx`, `enviar.tsx`: Flujo de comprobantes.
  * `admin/(tabs)/`: Panel web del gestor (`bandeja`, `clientes`, `exportar`, `perfil`).
* `src/components/`: Componentes atómicos reutilizables (`Boton`, `Tarjeta`, `Chips`, `SemaforoBadge`, `FormularioGasto`, `DetalleGasto`).
* `src/constants/`:
  * `fiscal.ts`: Cuentas del PGC (grupo 6), categorías y límites legales (26,67 €/día, 400 €).
  * `theme.ts`: Tokens visuales en escala de grises y tipografía Google Sans.
* `src/context/`:
  * `sesion-context.tsx`: Control de acceso basado en roles (RBAC) y aislamiento multi-tenant.
  * `gastos-context.tsx`: Estado global reactivo con persistencia local (`AsyncStorage`).
* `src/services/`:
  * `reglas-fiscales.ts`: Implementación cliente del árbol de decisión fiscal.
  * `estado-gasto.ts`: Máquina de estados finita del comprobante (DFE).
  * `exportacion.ts`: Generación de lotes contables en CSV normalizado con BOM UTF-8 y JSON.
  * `auth.ts`: Hashing y verificación de contraseñas mediante `bcryptjs`.
  * `documentos.ts`: Custodia probatoria con cálculo de huella criptográfica SHA-256.

---

## 3. Estructura del Backend (`backend/`)

* `app/core/config.py`: Parámetros de entorno gestionados mediante `pydantic-settings`.
* `app/db/`:
  * `base.py`: Clase base declarativa de SQLAlchemy.
  * `session.py`: Fábrica de conexiones y generador de sesiones (`get_db`).
* `app/models/entities.py`: Modelos ORM correspondientes a la Tabla 10 de la memoria:
  * `Asesoria`, `Usuario`, `ClienteAutonomo`, `Gasto`, `JustificacionFiscal`, `ExportacionContable`.
* `app/schemas/comprobante.py`: Esquemas de validación de datos con Pydantic (`DatosExtraidosResponse`, `EvaluacionFiscalResponse`).
* `app/services/`:
  * `fiscal.py`: Algoritmo de comprobación de festivos (cálculo de Pascua/Meeus), fin de semana y límites fiscales.
  * `ocr_engine.py`: Extracción automatizada de campos clave mediante expresiones regulares optimizadas para documentos españoles.
* `app/api/v1/endpoints/`:
  * `ocr.py`: `POST /api/v1/comprobantes/ocr` para recepción multipart de imágenes y PDFs.
  * `gastos.py`: `POST /api/v1/gastos/evaluar` para clasificación en tiempo real.

---

## 4. Batería de Pruebas y Control de Calidad

* **Frontend (`npm test`):**
  * `reglas-fiscales.test.ts`: Pruebas parametrizadas de límites de manutención, IVA y festivos.
  * `estado-y-exportacion.test.ts`: Trazabilidad de estados y formato de exportación CSV.
  * `utilidades.test.ts`: Validación algorítmica de NIF/CIF/NIE y calendario de trimestres.
  * `auth.test.ts`: Hashing bcrypt con mocks nativos de `expo-crypto`.
* **Backend (`python -m pytest`):**
  * `test_api.py`: Integración de endpoints FastAPI con `TestClient`.
  * `test_models.py`: Integridad referencial y cascada de borrado en SQLite en memoria.
