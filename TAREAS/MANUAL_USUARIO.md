# Manual de Usuario · FacturaMétrica 📊🧾

Guía de referencia y uso para los perfiles de **Trabajador Autónomo** y **Gestor Contable**.

---

## 1. Introducción y Acceso

FacturaMétrica está diseñada como una aplicación multiplataforma accesible desde navegadores web (escritorio) y dispositivos móviles (iOS y Android mediante Expo Go / PWA).

### Modos de Acceso
* **Visitante:** Acceso libre a la pantalla de bienvenida, guía fiscal interactiva y simulador de semáforo (sin persistencia de datos).
* **Autónomo (Cliente):** Gestión integral de tickets, facturas y justificaciones fiscales.
* **Gestor (Asesoría):** Supervisión de la cartera de autónomos, validación de justificaciones y exportación a programas contables (A3, Sage, Contasol).

### Códigos de Invitación de Asesorías
Para registrarse como autónomo es necesario introducir el código proporcionado por el despacho contable:
* Asesoría Albarregas: `ALB2026`
* Gestoría Emérita: `EMERITA`

---

## 2. Guía para el Autónomo (Rol Cliente)

### 2.1. Captura de Comprobantes
1. Accede a la pestaña central **Capturar**.
2. Selecciona el origen del comprobante:
   * **Cámara:** Permite tomar la fotografía y encuadrar/recortar el comprobante térmico.
   * **Galería:** Selecciona una fotografía existente.
   * **Archivo PDF:** Sube facturas completas en formato PDF recibidas por correo electrónico.
3. El sistema procesa el documento en pocos segundos mediante el motor OCR.

### 2.2. Revisión de Datos del OCR
Una vez leído el documento, se presenta la pantalla de **Revisión**:
* Comprueba emisor, NIF, fecha, base imponible, tipo de IVA y total.
* Corrige manualmente cualquier dígito si el ticket físico estaba arrugado o desgastado.
* Pulsa **Guardar y Clasificar**.

### 2.3. El Asesor Fiscal Virtual (Semáforo de Riesgo)
El sistema evalúa automáticamente el comprobante según los criterios de la Agencia Tributaria:
* 🟢 **Verde (Deducible):** Gastos de lunes a viernes en horario habitual con datos fiscales completos. Pasan directamente a la lista listos para el cierre.
* 🟡 **Amarillo (Requiere Justificación):**
  * Gastos en fines de semana o festivos nacionales.
  * Comidas de manutención superiores a 26,67 €/día.
  * Facturas simplificadas de más de 400 € sin NIF del receptor.
  * **Acción:** Pulsa sobre el comprobante y responde a la pregunta contextual (ej. *"Comida con cliente X para firma de contrato"*). Una vez justificado, pasa a estado *En revisión* para el gestor.
* 🔴 **Rojo (No Deducible):** Multas, sanciones de tráfico o consumos personales manifiestos. La app te informa del motivo legal para evitar requerimientos de Hacienda.

### 2.4. Informes y Cierre Trimestral
* En la pestaña **Informes** puedes consultar el total deducible, el IVA soportado acumulado y el número de comprobantes listos por trimestre (1T a 4T).
* La pantalla te muestra la cuenta atrás hasta el próximo plazo oficial de liquidación (modelos 303 y 130).

---

## 3. Guía para el Gestor Contable (Rol Asesoría)

### 3.1. Panel de Control y Cartera de Clientes
* Visualiza la lista completa de autónomos asignados al despacho con indicadores de gastos pendientes.
* Añade nuevos autónomos, edita su actividad o pausa su cuenta temporalmente.

### 3.2. Bandeja de Entrada Unificada
* Filtra gastos por estado semafórico (🟢 Listos, 🟡 Con justificación para revisar, 🔴 Rechazados) y por trimestre fiscal.
* Al pulsar sobre un gasto amarillo, lee la justificación aportada por el autónomo y selecciona:
  * **Aprobar:** Ratifica el gasto para deducción fiscal.
  * **Rectificar PGC:** Modifica la cuenta asignada del Plan General Contable (ej. cambiar de 629 a 623).
  * **Rechazar:** Marca el gasto como no deducible si la justificación no resulta suficiente ante una inspección.

### 3.3. Exportación al Software Contable
1. Accede a la pestaña **Exportar**.
2. Selecciona el trimestre y el formato deseado:
   * **CSV (Excel):** Formateado con delimitador `;` y coma decimal en UTF-8 con BOM.
   * **JSON:** Para integración directa mediante API REST con ERPs del despacho.
3. El archivo generado incluye NIF del cliente, NIF del emisor, cuenta del PGC, bases, cuotas e importe total, listo para volcar los asientos contables en un clic.
