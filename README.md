# FacturaMétrica 📊🧾

Solución B2B2C integral diseñada para asesorías, despachos contables y trabajadores autónomos. Actúa como un filtro fiscal preventivo inteligente para evitar que gastos deducibles mal justificados o no deducibles lleguen al sistema contable del despacho.

---

## 🚀 Propuesta de Valor y Visión

FacturaMétrica conecta de forma transparente y ágil al autónomo con su asesoría contable:
- **App Móvil / PWA ultraligera** para el autónomo: digitalización, OCR inmediato y validación fiscal asistida.
- **Panel Web B2B avanzado** para la gestoría: bandeja de entrada unificada de clientes con gastos clasificados por semáforo de riesgo e integración contable directa.

---

## 🔄 Flujo de Trabajo (User Journey)

### 📱 1. Lado del Autónomo (App Móvil / PWA)
1. **Captura Rápida:** Fotografía de ticket físico (comida, combustible, hotel, material) o subida directa de factura en PDF.
2. **Análisis Instantáneo (OCR / IA):** Extracción automatizada en segundos de NIF emisor, base imponible, desglose de IVA, fecha/hora y categoría contable propuesta.
3. **Asesor Fiscal Virtual (Validación Contextual):**
   - 🟢 **Gasto Normal:** Factura en horario comercial habitual con datos correctos → Validado como deducible automáticamente.
   - 🟡 / 🔴 **Gasto de Riesgo / Alerta AEAT:** Ticket de cena en fin de semana, factura sin NIF receptor, etc. La app solicita contexto inmediato (*"¿Con qué cliente o motivo profesional se realizó?"*).
4. **Cierre de Ciclo:** Gasto validado y listo para el cierre trimestral.

### 💻 2. Lado del Asesor / Contable (Panel Web)
- **Bandeja Unificada por Clientes:** Visualización limpia y organizada por estados de riesgo:
  - 🟢 **Verde:** Listo para exportación directa con cuenta del PGC asignada.
  - 🟡 **Amarillo / Observaciones:** Gasto con justificación añadida por el autónomo, pendiente de validación en 1 clic.
  - 🔴 **Rojo:** Gastos no deducibles por ley ya advertidos al usuario.
- **Exportación Contable:** Compatibilidad y volcado hacia los principales ERPs y softwares contables (A3 Conecta, Wolters Kluwer, Sage, etc.).

---

## 🛠️ Stack Tecnológico Recomendado

- **Frontend Móvil (Autónomo):** React / PWA con TypeScript y Tailwind CSS (soporte offline temporal y máxima ligereza).
- **Frontend Asesoría (Web Desktop):** React / Next.js con tablas de datos avanzadas, filtros analíticos y métricas.
- **Backend & API:** Python con FastAPI (alto rendimiento y soporte nativo para modelos de procesamiento y machine learning).
- **Motor OCR & Reglas de Negocio:** Modelos de visión por computador y extracción NER optimizados para documentos fiscales españoles (tickets térmicos, Facturae, facturas simplificadas) adaptados a la LIRPF y criterios AEAT.
- **Base de Datos:** PostgreSQL con soporte multi-tenant por asesoría y cifrado de datos fiscales.

---

## 📋 Documentación Incluida

- [`Planestudio.txt`](./Planestudio.txt): Plan de producto, arquitectura detallada y estrategia Go-to-Market inicial.
