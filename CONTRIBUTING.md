# Guía de Contribución y Flujo de Trabajo Git 🌿

> **Aviso Importante para el Equipo de Desarrollo (Lucía y Hugo):**
> A partir de ahora organizamos el repositorio siguiendo una metodología estricta de ramas para garantizar la estabilidad del proyecto de cara al tribunal y facilitar el trabajo colaborativo.

---

## 📌 Estructura de Ramas Principales

```
main (PRODUCCIÓN / ESTABLE)
 ▲
 │  (Solo fusiones probadas de versiones entregables)
develop (DESARROLLO ACTIVO)
 ▲
 │  (Fusión mediante pull requests o merge --no-ff)
feature/<funcionalidad> (RAMAS TEMPORALES DE TRABAJO)
```

1. **`main` (Producción / Tribunal):**
   * Contiene únicamente código estable, compilado y verificado.
   * Nunca se hace commit directo sobre `main`.
   * Es la rama que se evaluará oficialmente.

2. **`develop` (Desarrollo Central):**
   * Es la rama de trabajo continuo donde confluyen todas las funcionalidades.
   * **Siempre que iniciemos una nueva tarea, sacamos la rama desde `develop`:**
     ```bash
     git checkout develop
     git pull origin develop
     git checkout -b feature/nombre-de-la-funcionalidad
     ```

---

## 🌿 Flujo de Trabajo para Nuevas Funcionalidades

1. **Crear rama de funcionalidad:**
   ```bash
   git checkout -b feature/<modulo-o-mejora>
   ```
   *Ejemplos:* `feature/motor-fiscal`, `feature/panel-gestor`, `feature/documentacion-manuales`.

2. **Hacer commits claros y en español:**
   * Describir brevemente en presente qué se ha añadido o corregido.
   * *Ejemplo:* `git commit -m "Añadir validación de festivos en el motor fiscal"`

3. **Verificar antes de fusionar:**
   * En frontend: `npm test && npm run typecheck && npm run lint`
   * En backend: `python -m pytest`

4. **Integrar en `develop`:**
   * Usar siempre `--no-ff` para preservar el histórico visual de ramas:
     ```bash
     git checkout develop
     git merge --no-ff feature/<modulo-o-mejora> -m "Fusionar la rama feature/<modulo-o-mejora>: <descripción>"
     git push origin develop
     ```

5. **Paso a `main`:**
   * Cuando se cierra un sprint o hito de la memoria:
     ```bash
     git checkout main
     git merge --no-ff develop -m "Release vX.X.X: <resumen del hito>"
     git push origin main
     ```
