# Manual de Instalación y Despliegue · FacturaMétrica 📦🚀

Guía completa para la configuración del entorno de desarrollo, ejecución local y despliegue contenerizado.

---

## 1. Requisitos Previos del Sistema

* **Node.js:** Versión 18.x o 20.x LTS.
* **npm:** Versión 9.x o superior.
* **Python:** Versión 3.10 o superior (recomendado Python 3.11/3.13).
* **Docker & Docker Compose:** (Opcional para despliegue contenerizado).
* **Smartphone:** Dispositivo físico con la app **Expo Go** instalada (iOS / Android) para pruebas móviles.

---

## 2. Instalación y Puesta en Marcha del Frontend

1. Accede al directorio de la aplicación:
   ```bash
   cd factura-metrica
   ```

2. Instala las dependencias del proyecto:
   ```bash
   npm install
   ```

3. Ejecuta el servidor de desarrollo:
   ```bash
   npm start
   ```

4. **Opciones de visualización:**
   * Pulsa `w` en la terminal para abrir la versión Web en el navegador.
   * Pulsa `a` para emulador Android o `i` para simulador iOS.
   * Escanea el código QR desde la app móvil **Expo Go**.

5. **Ejecución de pruebas y verificación de código:**
   ```bash
   npm test          # Ejecuta los 69 tests unitarios en Jest
   npm run typecheck # Verificación estricta de TypeScript
   npm run lint      # Análisis estático de código con ESLint
   ```

---

## 3. Instalación y Puesta en Marcha del Backend (FastAPI)

1. Accede al directorio del backend:
   ```bash
   cd backend
   ```

2. Instala las dependencias de Python:
   ```bash
   pip install -r requirements.txt
   ```

3. (Opcional) Inicializa los datos de prueba oficiales en la base de datos:
   ```bash
   python -m app.db.seed
   ```

4. Inicia el servidor de API con recarga automática:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

5. **Acceso a la documentación interactiva:**
   * Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
   * ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

6. **Ejecución de pruebas automatizadas:**
   ```bash
   python -m pytest
   ```

---

## 4. Despliegue Automatizado con Docker Compose

Para desplegar simultáneamente el backend FastAPI y el motor PostgreSQL:

1. Desde la raíz del repositorio, ejecuta:
   ```bash
   docker-compose up -d --build
   ```

2. Servicios levantados:
   * **Backend FastAPI:** [http://localhost:8000](http://localhost:8000)
   * **Base de Datos PostgreSQL:** `localhost:5432` (usuario: `factura_user`, base de datos: `facturametrica`)

3. Para detener los servicios:
   ```bash
   docker-compose down
   ```

---

## 5. Conexión entre Frontend y Backend

Por defecto, la app funciona con el motor OCR simulado y persistencia en el dispositivo. Para conectar la app al backend real:

1. Crea el archivo `factura-metrica/.env.local`:
   ```ini
   EXPO_PUBLIC_API_URL=http://localhost:8000
   ```
   *(Si pruebas desde un móvil físico, sustituye `localhost` por la IP local de tu ordenador en la red Wi-Fi, ej. `http://192.168.1.50:8000`)*.
