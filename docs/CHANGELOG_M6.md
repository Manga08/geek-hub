# Changelog Phase M6 - Mobile Stats & Activity Readability

## Objetivo
Mejorar la legibilidad y la experiencia táctil en las pantallas de "Actividad" y "Estadísticas" para usuarios móviles.

## Cambios Realizados

### 1. Actividad (`/activity`)
- **Actionable Cards:** Ahora cada evento en el feed de actividad es un área táctil completa.
  - Al tocar la tarjeta de un evento de biblioteca (ej. "Usuario añadió Matrix"), navega directamente al detalle del ítem.
  - Al tocar un evento de lista, navega al detalle de la lista.
- **Micro-interacciones:** Se añadió un estado de "active:scale" para dar feedback táctil al pulsar.
- **Link Helper:** Implementada función `getEventTarget` que analiza los metadatos del evento para generar URLs de destino inteligentes.

### 2. Estadísticas (`/stats`)
- **Stacked Cards (Leaderboard & Top Rated):** Se transformaron las listas planas en "tarjetas apiladas" (stacked cards).
  - Cada fila ahora tiene fondo, padding y bordes definidos (`bg-white/5`, `rounded-lg`).
  - Mejora la separación visual y el área de toque en pantallas pequeñas.
- **Top Rated Visuals:** Se mejoró el estilo de las filas de "Mejor puntuados" para que el ranking y la puntuación destaquen más.
- **Responsive Layout:** Se mantuvieron los grids de tarjetas de resumen (`grid-cols-2`), asegurando que se vean bien en vertical.

## Archivos Modificados
- `src/app/(app)/activity/page.tsx`
- `src/app/(app)/stats/page.tsx`

## Validación
- **Móvil (Actividad):** Tocar una notificación de "añadió juego X". Debe llevar a `/item/game/X`.
- **Móvil (Leaderboard):** Verificar que los miembros del grupo se vean en filas separadas con estilo de tarjeta, no texto plano apiñado.
- **Desktop:** Verificar que los enlaces funcionen igual y que el diseño no se haya roto (debería verse más limpio).
