# Changelog Phase M5 - Mobile Library & Lists UX

## Objetivo

Optimizar la experiencia de usuario en las secciones de Biblioteca y Listas para dispositivos móviles, asegurando que todas las acciones sean accesibles mediante interfaces táctiles sin depender de interacciones "hover" (ratón).

## Cambios Realizados

### 1. UX de Biblioteca (`/library`)

- **LibraryCard:** Se implementó un menú contextual (icono de 3 puntos) visible solo en móvil.
  - Permite acceder a acciones: Favorito, Editar, Eliminar.
  - En escritorio, se mantienen los botones flotantes al pasar el cursor (hover).

### 2. Listas (`/lists`)

- **ListCard:** Se añadió un menú desplegable para acciones de lista en móvil.
  - Permite eliminar listas directamente desde la vista índice.
- **Lista Detalle (`/lists/[id]`):**
  - **Header:** Rediseño responsivo. En móvil, el título y descripción se ajustan mejor, y las acciones (Editar/Eliminar lista) se agrupan en un botón de "Ajustes".
  - **Items de Lista:** Ahora incluyen un menú desplegable en móvil para:
    - Reordenar (Subir/Bajar).
    - Ver detalles (ir a `/item/...`).
    - Quitar de la lista.

## Archivos Modificados

- `src/features/library/components/LibraryCard.tsx`
- `src/app/(app)/lists/page.tsx`
- `src/app/(app)/lists/[id]/page.tsx`

## Validación

- Verificar que en móvil aparezcan los menús de 3 puntos en las tarjetas de biblioteca y listas.
- Verificar que las acciones dentro de los menús funcionen igual que en escritorio.
- Verificar que en escritorio el comportamiento original (hover) se mantenga.
