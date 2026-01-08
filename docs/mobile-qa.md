# Mobile QA Checklist

## Objetivos
Asegurar una experiencia fluida y consistente en dispositivos móviles, alineada con GeekHub V2.

## Dispositivos Objetivo (Viewports)
- **Small Mobile:** 360x800 px (Android base)
- **Standard Mobile:** 390x844 px (iPhone 12/13/14)
- **Large Mobile:** 412x915 px (Pixel / Max variants)

## Áreas de Revisión General
1.  **Horizontal Overflow:** El contenido nunca debe generar scroll horizontal en la página entera (`body`). Scroll horizontal es permitido solo en componentes específicos (carruseles, tablas, chips).
2.  **Touch Targets:** Elementos interactivos (botones, enlaces, inputs) deben tener un área mínima de 44x44px (o padding suficiente).
3.  **Sticky Elements:** Header y bottoms bars no deben tapar contenido importante ni romperse con el teclado virtual.
4.  **Text Readability:** Tamaño mínimo de fuente 14px (notas/small text 12px permitidos si hay buen contraste).
5.  **Safe Areas:** Respetar notches y barras de navegación del sistema (bottom safe area).

## Checklist por Pantalla

### 1. Dashboard (`/dashboard`)
- [ ] **Hero/Bienvenida:** Padding lateral correcto, no texto cortado.
- [ ] **Resumen/Stats:** Cards se apilan verticalmente o grilla 2 columnas.
- [ ] **Actividad Reciente:** Listado legible, avatars no colapsados.

### 2. Search (`/search`)
- [ ] **Input Búsqueda:** Accesible, focus ring visible, botón de borrar accesible.
- [ ] **Filtros:** Chips o dropdowns fáciles de tocar. Si hay scroll horizontal de chips, verificar padding final.
- [ ] **Resultados:** Grid Posters (2 o 3 columnas). ¿Se ven bien los títulos largos?
- [ ] **Skeleton Loading:** No causa saltos de layout (CLS).

### 3. Library & Lists (`/library`, `/lists`)
- [ ] **Grid vs List View:** Si existe toggle, verificar ambos estados.
- [ ] **Estado Vacío:** Centrado, mensaje claro, ilustración no desborda.
- [ ] **Paginación/Infinite Scroll:** Loading indicator visible al final.

### 4. Item Detail (`/item/[type]/[key]`)
- [ ] **Poster Headers:** Imagen de fondo/poster no tapa el texto.
- [ ] **Action Buttons:** (Fav, Rate, Lists) Accesibles y alineados.
- [ ] **Tablas/Metadata:** (Cast, Crew, Details) Si es tabla, ¿tiene scroll horizontal interno o se apila?

### 5. Activity (`/activity`)
- [ ] **Timeline:** Línea conectora alineada con avatars.
- [ ] **Event content:** Texto que envuelve correctamente (wrap), no overflow.

### 6. Auth Pages (`/login`, `/signup`)
- [ ] **Formularios:** Inputs de tamaño correcto (text-16px para evitar zoom en iOS).
- [ ] **Teclado:** Al abrir teclado, el botón "Submit" es visible o scrolleable.

### 7. Settings (`/settings/*`)
- [ ] **Profile Form:** Inputs y avatares editables.

## Phase M2: Grid Density & Stability (Specific)
- [ ] **Mobile Density:** `MediaGrid` muestra 2 columnas en móviles (360px+).
- [ ] **Compact Cards:** Padding interno reducido (`p-2`) en móvil para maximizar espacio de arte.
- [ ] **Typography:** Títulos de cards permiten 2 líneas, sin romper layout.
- [ ] **Skeletons:** `MediaGridSkeleton` coincide exactamente con el layout responsivo del Grid real (evita saltos al cargar).
- [ ] **Switchers/Toggles:** Fácil interacción táctil.
