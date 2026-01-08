# Changelog Phase M7 - Mobile Polish Pass

## Objetivo

Refinamiento global de la experiencia móvil, enfocándose en consistencia visual, feedback táctil y estados vacíos.

## Cambios Realizados

### 1. UX Global (`global.css`)

- **Tap Highlight:** Se eliminó el recuadro gris nativo (`-webkit-tap-highlight-color: transparent`) en elementos interactivos para una sensación más "nativa" en iOS/Android.
- **Scroll:** Se aseguró `overflow-x-hidden` en el body para evitar desplazamientos horizontales accidentales.

### 2. Estados Vacíos (`EmptyState`)

- **Rediseño:** Se reemplazó el contenedor blanco genérico por un `GlassCard` transparente.
- **Estilo:** Ahora utiliza texto `muted-foreground` y fondo adecuado al tema oscuro, integrándose mejor en todas las páginas (listas vacías, búsquedas sin resultados).

### 3. Menús Desplegables (`DropdownMenu`)

- **Efecto Glass:** Se añadió `backdrop-blur-md` y opacidad ligera al fondo de los menús contextuales para mantener la consistencia con el diseño "Glassmorphism" del resto de la app.

### 4. Transiciones

- **PageTransition:** Se verificó la configuración de animaciones de entrada (opacity/fade-up) para asegurar que sean fluidas (duration 0.12s) y no bloqueantes en móviles.

## Archivos Modificados

- `src/app/globals.css`
- `src/components/shared/EmptyState.tsx`
- `src/components/ui/dropdown-menu.tsx`

## Pasos de Prueba Finales

1.  **Navegación Móvil:** Ir a una página vacía (ej. lista nueva) y verificar que el mensaje "Sin datos" no sea un cuadro blanco brillante.
2.  **Menús:** Abrir el menú de 3 puntos en un item de biblioteca. Verificar que el fondo del menú sea semitransparente (glass).
3.  **Toque:** Tocar botones rápidamente en el móvil. No debería aparecer un parpadeo gris de fondo (tap highlight).
