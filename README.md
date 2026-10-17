# FacturaMétrica 📊🧾

**Sistema B2B2C de Digitalización, Extracción OCR y Filtro Fiscal Preventivo de Gastos para Asesorías y Autónomos.**

Proyecto de Fin de Ciclo (C.F.G.S. Desarrollo de Aplicaciones Multiplataforma - DAM) en el **I.E.S. Albarregas (Mérida, Badajoz)**.  
**Autores:** Lucía Garrido Chocarro y Hugo Pérez Muñoz.

---

## 📌 Metodología de Ramas Git (Para el equipo)

Para organizar el desarrollo de forma profesional y segura:

* 🚀 **`main` (Producción / Tribunal):** Rama estable y protegida. Solo contiene código compilado, probado y listo para evaluación.
* 🛠️ **`develop` (Desarrollo Central):** Rama de integración continua. Todos los desarrollos diarios se fusionan aquí mediante ramas `feature/<nombre>`.
* 🌿 **`feature/<funcionalidad>`:** Ramas temporales de trabajo creadas a partir de `develop`.

> Consulta la [Guía de Contribución](CONTRIBUTING.md) para el detalle de comandos y convenciones.

---

## 📂 Estructura del Repositorio

* **[`factura-metrica/`](./factura-metrica):** Aplicación multiplataforma en **React Native + Expo SDK 57 + TypeScript + Expo Router** (iOS, Android y Web).
* **[`backend/`](./backend):** API REST en **FastAPI (Python)** con motor de extracción OCR, reglas fiscales LIRPF y modelos relacionales en **SQLAlchemy**.
* **[`TAREAS/`](./TAREAS):** Documentación oficial del proyecto:
  * Memoria técnica: `Plantila para proyectos EIS Albarregas.docx`.
  * [Manual de Usuario](./TAREAS/MANUAL_USUARIO.md).
  * [Manual del Programador](./TAREAS/MANUAL_PROGRAMADOR.md).
  * [Manual de Instalación](./TAREAS/MANUAL_INSTALACION.md).
  * Mapas de empatía (*Design Thinking*).
* **[`Post redes/`](./Post%20redes):** Material de marketing y difusión (10 creatividades gráficas y plantilla web responsive).
* **[`docker-compose.yml`](./docker-compose.yml):** Despliegue contenerizado del backend FastAPI y base de datos PostgreSQL 15.

---

## 🚀 Puesta en Marcha Rápida

### 1. App Móvil / Web (Frontend)
```bash
cd factura-metrica
npm install
npm start
```
* Pulsa `w` para abrir en el navegador.
* Escanea el QR con **Expo Go** para abrir en tu smartphone.
* Tests: `npm test` (69 pruebas Jest).

### 2. API Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
* Documentación Swagger: [http://localhost:8000/docs](http://localhost:8000/docs)
* Tests: `python -m pytest`

### 3. Despliegue con Docker
```bash
docker-compose up -d --build
```
