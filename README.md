# 🎮 GeekHub

> **Tu biblioteca multimedia colaborativa** — Organiza y comparte tus juegos, películas, series y anime con tu grupo.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ECF8E?logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4.x-06B6D4?logo=tailwindcss)

---

## 📱 Mobile Support

- **Mobile First Design:** Interfaz optimizada para dispositivos táctiles.
- **QA Checklist:** [Ver guía de auditoría móvil](docs/mobile-qa.md).

## 📜 Changelog (Recent Phases)

- **Phase M0:** Mobile Audit & Baseline Fixes
  - Auditoría global y fixes de overflow.
  - GroupSwitcher accesible en móvil.
  - QA Checklist creado.

- **Phase M2:** Mobile Grid & Cards Density
  - Layout Grid optimizado: 2 columnas en móvil / 6 en monitores XL.
  - Densidad mejorada: reducción de padding en `MediaCard` para móviles (`p-2`).
  - Skeletons sincronizados: `MediaGridSkeleton` ahora replica exactamente los breakpoints del grid real para evitar CLS.

- **Phase M1:** Mobile Navigation Premium (2025-01-07)
  - `ScrollableTabs`: Nuevo componente para navegación horizontal en filtros (Library, Stats) con degradados sutiles.
  - Touch Targets: Botones de navegación y menú expandidos a min 44px (usando pseudo-elementos para mantener estética).
  - Consistencia Visual: Ajustes de tipografía responsiva en headers (Activity).

## ✨ Características Principales

### 📚 Catálogo Unificado

- Busca **juegos** (RAWG), **películas**, **series** y **anime** (TMDb) desde una sola interfaz
- Detalles completos: posters HD, sinopsis, géneros, ratings
- Imágenes optimizadas con Next/Image y cache inteligente

### 🗃️ Biblioteca Personal

- Añade items a tu biblioteca con estados: _Planeado_, _En progreso_, _Completado_, _Abandonado_
- Rating de 1-10 y notas personales
- Marca favoritos con un clic
- Filtros avanzados por tipo, estado y ordenamiento

### 👥 Grupos Colaborativos

- Crea grupos para compartir tu biblioteca con amigos/familia
- Roles: **Admin** (gestión completa), **Member** (colaboración estándar)
- Sistema de invitaciones por token único
- Cambia entre grupos con el switcher en navbar

### 📋 Listas Personalizadas

- Crea listas temáticas (ej: "Películas para ver en navidad", "Backlog 2026")
- Hasta 100 items por lista
- Reordena con drag & drop
- Tipos: game, movie, tv, anime o mixed

### 📊 Estadísticas del Grupo

- Dashboard con métricas: totales, distribución por tipo/estado
- Gráfico de actividad mensual
- Top rated del grupo y leaderboard de miembros
- Filtros por año y scope (mío vs grupo)

### 🔔 Actividad en Tiempo Real

- Feed de actividad del grupo (quién añadió qué, cambios de estado, etc.)
- Notificaciones en tiempo real via Supabase Realtime
- Badge de unreads en navbar
- Panel dropdown con últimos eventos

### 👤 Perfil de Usuario

- Display name editable
- Avatar personalizado (upload a Supabase Storage)
- Panel "Nuestra Puntuación" muestra ratings de todos los miembros

### 🔐 Seguridad

- Auth con Supabase (email/password, PKCE)
- Row Level Security (RLS) en todas las tablas
- Tokens sanitizados en Debug Panel (nunca se exportan secretos)
- Recuperación de contraseña con flujo seguro

---

## 🏗️ Arquitectura

```
src/
├── app/                    # Next.js App Router
│   ├── (app)/              # Rutas protegidas (requieren auth)
│   │   ├── search/         # Búsqueda de catálogo
│   │   ├── item/           # Detalle de item
│   │   ├── library/        # Biblioteca personal
│   │   ├── lists/          # Listas personalizadas
│   │   ├── groups/         # Gestión de grupos
│   │   ├── stats/          # Dashboard de estadísticas
│   │   ├── activity/       # Feed de actividad
│   │   └── settings/       # Configuración de perfil
│   ├── (auth)/             # Rutas públicas (login, signup, etc.)
│   └── api/                # API Routes internas
├── components/
│   ├── shared/             # Componentes reutilizables (MediaCard, etc.)
│   └── ui/                 # Componentes shadcn/ui
├── features/               # Feature folders (DDD-lite)
│   ├── library/            # Lógica de biblioteca
│   ├── lists/              # Lógica de listas
│   ├── groups/             # Lógica de grupos
│   ├── catalog/            # Búsqueda y normalización
│   ├── activity/           # Feed y notificaciones
│   └── debug-recorder/     # Panel de debug (dev only)
└── lib/                    # Utilidades compartidas
    ├── supabase/           # Cliente Supabase (server/client)
    └── utils.ts            # Helpers generales
```

### Stack Tecnológico

| Capa          | Tecnología                  |
| ------------- | --------------------------- |
| Framework     | Next.js 16 (App Router)     |
| Base de datos | Supabase (PostgreSQL + RLS) |
| Auth          | Supabase Auth (PKCE)        |
| Realtime      | Supabase Realtime           |
| Storage       | Supabase Storage (avatars)  |
| State         | TanStack Query v5           |
| Styling       | Tailwind CSS 4 + shadcn/ui  |
| Animaciones   | Framer Motion               |
| Testing       | Vitest                      |
| Catálogo      | RAWG API + TMDb API         |

---

## 📖 Cómo Funciona

### Flujo de Usuario

1. **Registro/Login** → Se crea profile + grupo por defecto "Mi grupo"
2. **Búsqueda** → `/search` permite buscar en RAWG/TMDb por tipo
3. **Añadir a biblioteca** → Click en `+` o desde detalle del item
4. **Gestionar** → `/library` para filtrar, editar estados, ratings
5. **Colaborar** → Invitar amigos al grupo, ver actividad compartida
6. **Estadísticas** → `/stats` para ver métricas del grupo

### Multi-tenancy

- Cada `library_entry` pertenece a un `user_id` + `group_id`
- Un usuario puede tener diferentes entradas del mismo item en diferentes grupos
- Las listas son por grupo (todos los miembros ven las mismas listas)
- La actividad es por grupo (solo ves eventos de tu grupo activo)

### Catálogo Unificado

```
Usuario busca "zelda"
        ↓
API /api/catalog/search?q=zelda&type=game
        ↓
catalog/service.ts → RAWG API
        ↓
normalizeRawg() → UnifiedCatalogItem
        ↓
Frontend muestra resultados normalizados
```

---

## 📜 Reglas del Proyecto

### Antes de Commit

```bash
pnpm verify   # Ejecuta: lint + test + build
```

O individualmente:

```bash
pnpm lint      # Sin errores de ESLint
pnpm test      # Todos los tests pasan
pnpm build     # Build de producción exitoso
```

### Guidelines de Desarrollo

| Regla                 | Descripción                                      |
| --------------------- | ------------------------------------------------ |
| 🚫 No deps nuevas     | Sin dependencias nuevas sin aprobación explícita |
| 📦 Cambios pequeños   | Un feature/fix por PR                            |
| 📝 Commits semánticos | `feat(area):`, `fix(area):`, `chore(area):`      |
| 🎨 Tema dark premium  | No cambios drásticos de diseño                   |
| 🔒 Sin secretos       | Nunca hardcodear tokens/keys                     |
| ✅ Tests              | Funcionalidad crítica debe tener tests           |

Ver [docs/AGENT_RULES.md](docs/AGENT_RULES.md) para reglas completas.

### Line Endings (CRLF → LF)

```bash
git add --renormalize .
git commit -m "chore: normalize line endings"
```

---

## 🚀 Getting Started

### 1. Clonar e Instalar

```bash
git clone <repo-url>
cd geek-hub
pnpm install
```

### 2. Variables de Entorno

Crear `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Catálogo APIs
RAWG_API_KEY=your_rawg_key
TMDB_ACCESS_TOKEN=your_tmdb_token
```

### 3. Ejecutar Migraciones

En **Supabase Dashboard → SQL Editor**, ejecutar en orden los archivos de `supabase/migrations/`.

### 4. Iniciar Dev Server

```bash
pnpm dev        # Webpack (estable)
pnpm dev:turbo  # Turbopack (experimental, más rápido)
```

Abrir [http://localhost:3000](http://localhost:3000)

### 5. Debug Panel

Añadir `?debug=1` a cualquier URL para activar el panel de debug:

- **Events**: Timeline de eventos capturados
- **Render**: Métricas de performance y CLS
- **Console**: Logs capturados
- **Inspect**: Storage, Auth y React Query state

---

## 🗄️ Migraciones de Base de Datos

Ejecutar en orden desde **Supabase Dashboard → SQL Editor**:

| #   | Archivo                                | Tablas                                | Propósito                                                                    |
| --- | -------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------- |
| 001 | `001_library_entries.sql`              | `library_entries`                     | Tabla de biblioteca personal con status, rating, favoritos. RLS por usuario. |
| 002 | `002_profiles_groups.sql`              | `profiles`, `groups`, `group_members` | Sistema multi-tenant. Perfiles, grupos y membresías con roles.               |
| 003 | `003_groups_rls_helpers.sql`           | —                                     | Funciones helper `is_group_member()`, `is_group_admin()` para RLS.           |
| 004 | `004_group_invites.sql`                | `group_invites`                       | Sistema de invitaciones por token con límite de usos y expiración.           |
| 005 | `005_groups_membership_rules.sql`      | `group_invites`, `group_members`      | Constraints de hardening y funciones de gestión de membresías.               |
| 006 | `006_profiles_schema_fix.sql`          | `profiles`                            | Hotfix para columnas `avatar_url` y `display_name`.                          |
| 007 | `007_library_multitenant.sql`          | `library_entries`                     | Añade `group_id` para multi-tenancy. Backfill y nuevas políticas RLS.        |
| 008 | `008_lists_multitenant.sql`            | `lists`, `list_items`                 | Sistema de listas compartidas por grupo con ordenamiento.                    |
| 009 | `009_activity_log.sql`                 | `activity_events`                     | Feed de actividad inmutable con eventos JSON.                                |
| 010 | `010_activity_fk_profiles.sql`         | `activity_events`, storage            | FK a profiles para joins. Crea bucket `avatars`.                             |
| 011 | `011_hardening_activity_avatars.sql`   | `profiles`, `activity_events`         | Backfill de profiles para actors existentes.                                 |
| 012 | `012_activity_reads.sql`               | `activity_reads`                      | Tracking de última lectura por usuario/grupo para notificaciones.            |
| 013 | `013_storage_avatars_policies.sql`     | `storage.objects`                     | Políticas de storage para avatars (requiere rol postgres).                   |
| 014 | `014_profiles_relationships.sql`       | `group_members`, `library_entries`    | FKs a `profiles.id` para joins automáticos en PostgREST.                     |
| 015 | `015_cleanup_duplicate_fks.sql`        | `group_members`, `library_entries`    | Limpieza de FKs duplicadas a `auth.users`.                                   |
| 016 | `016_fix_group_members_profile_fk.sql` | `group_members`                       | Consolida FKs duplicadas, deja solo la FK a profiles.                        |
| 017 | `017_db_integrity_performance.sql`     | Índices                               | Performance para feed de grupo, items completados, paginación.               |
| 018 | `20250103_performance_indices.sql`     | Índices múltiples                     | Optimización masiva: lookups, feeds, unreads, membresías, listas.            |

> **Nota:** La migración 013 requiere privilegios de owner. Ejecutar desde SQL Editor con rol `postgres`.

---

## 💻 Entorno de Desarrollo

### Scripts Disponibles

| Comando              | Descripción                                 |
| -------------------- | ------------------------------------------- |
| `pnpm dev`           | Dev server con Webpack (estable en Windows) |
| `pnpm dev:turbo`     | Dev server con Turbopack (experimental)     |
| `pnpm build`         | Build producción                            |
| `pnpm build:webpack` | Build forzando Webpack                      |
| `pnpm lint`          | ESLint                                      |
| `pnpm test`          | Vitest (unit tests)                         |
| `pnpm verify`        | lint + test + build                         |

### Windows vs WSL

⚠️ **No mezclar entornos**: Si instalas en WSL, corre en WSL. Si instalas en CMD, corre en CMD.

**Reinstalación limpia (Windows):**

```powershell
rmdir /s /q node_modules
rmdir /s /q .next
pnpm store prune
pnpm install --force
```

**Reinstalación limpia (WSL/Linux/macOS):**

```bash
rm -rf node_modules .next
pnpm store prune
pnpm install --force
```

---

## 📋 Changelog

### Phase M0: Mobile Audit & Baseline (Current)

- **Documentación:** Creado `docs/mobile-qa.md` con checklist de auditoría.
- **Ajustes globales:** Verificación de overflows y tamaños táctiles.

### Phase 6D — Perf/UI: Stable skeletons + reduced CLS

- Implementación de `MediaCardSkeleton` con métricas exactas (aspectframe 2/3 + footer).
- Integración de skeletons en `Search` y `Library` para carga progresiva sin saltos.
- Unificación: Eliminado skeleton local duplicado en LibraryPage en favor del componente compartido.
- Ajuste de espaciado en grids para asegurar consistencia visual entre estados de carga y contenido.

### Phase 6C — UI: Unified media cards

- Estandarización de `MediaPosterFrame` (aspect 2/3) para todos los tipos de media (incluso Juegos).
- Fallback visual consistente con iconografía por tipo (Gamepad, Film, Tv, MonitorPlay).
- Unificación de estilo entre `MediaCard` (Search) y `LibraryCard` (Library).
- Eliminación de saltos de layout (CLS) mediante contenedores con aspect-ratio fijo.

### Phase 6B — UI: Navbar premium redesign

- Rediseño completo con estructura layout de 3 columnas (Brand - Links - Actions).
- State activo premium en links de escritorio usando `framer-motion` (pill background transition).
- Navegación móvil movida a `Sheet` lateral para limpieza visual.
- Altura fija (`h-16`) y efectos glass optimizados.

### Phase 6A — UI: Brand logo + wordmark

- Nuevo componente `BrandMark` (SVG inline) estilo tech/premium.
- Componente `Brand` con variantes full/icon y efectos glass/glow.
- Integración en navbar (reemplazo de placeholder anterior).

### Patch — Fix: Activity realtime & Security

- Activity realtime hook signature + removed unsafe HTML rendering

### Phase 5D — UX: Settings index page

- Nueva página índice `/settings` con acceso rápido a Perfil y Grupo.
- Diseño premium con `GlassCard` interactiva (hover effects, blur).
- Navegación visual clara con iconos y descripciones de sección.

### Phase 5C — UI: Activity premium consistency

- Refactor completo de `/activity` para alinearse al Spec V2.0 (Glass + Dark).
- Implementación de `GlassCard` como contenedor principal del feed.
- Motion suave con Framer Motion (stagger + layout animations).
- Mejoras de accesibilidad y "Empty State" con CTA clara.
- Skeletons de carga nativos en lugar de spinners genéricos.

### Phase 5B — Catalog: Anime filtering

- Implementación de heurística "Anime Real" en endpoint de búsqueda unificada.
- Filtrado STRICT: Prioriza animación japonesa (`genre:16` + `lang:ja`/`country:JP`).
- Mecanismo FALLBACK: Retorna animación general si hay pocos resultados (<5) estrictos.
- Sin costo adicional de performance (0 requests extra, todo in-memory).

### Phase 5A — Docs: Roles reales (admin/member)

- Actualización de documentación para reflejar roles reales (admin vs member).
- Eliminación de referencias obsoletas a roles planificados "editor/viewer".
- Verificación de código tras barrido de grep (sin lógica obsoleta encontrada).

### Phase 4B — Debug & Performance Hardening (Enero 2026)

- **Batch Lookup API**: Nuevo endpoint `POST /api/library/entry/lookup` para eliminar N+1 queries en Search.
- **Debug Recorder**: Panel completo con Events, Render, Console y Inspect tabs.
- **Storage Inspector**: Sanitización de tokens/secretos (nunca se exportan en JSON).
- **CLS Fixes**: Botón debug con tamaño fijo, skeletons con min-height.
- **Lists Lookup Fix**: Filtro por `type` en addListItem para evitar colisiones de external_id.
- **Performance Indices**: Migración 018 con índices optimizados para queries frecuentes.

### Phase 4A — Password Recovery

- Flujo completo de recuperación con Supabase Auth (PKCE)
- Páginas `/forgot-password` y `/reset-password` con UI premium
- Link en login y mensaje de éxito post-reset

### Phase 3Y-3Z — Stats & DB Hardening

- Dashboard `/stats` con filtros scope/year/type
- Agregaciones puras con tests
- Gráfico mensual, top rated, leaderboard
- Limpieza de FKs duplicadas a auth.users

### Phase 3W-3X — Realtime & Multi-tenant Fixes

- Suscripción Supabase Realtime (sin polling)
- Panel dropdown de notificaciones en Navbar
- Library entries user-scoped (cada miembro puede tener su entrada)
- Panel "Nuestra Puntuación" en detalle de item

### Phase 3T-3V — Activity & Profile

- Feed de actividad con eventos inmutables
- Badge de notificaciones y tracking de lecturas
- Página `/settings/profile` con avatar upload

### Phase 3P-3S — Lists & Stats

- Listas personalizadas con drag-reorder
- Dashboard de estadísticas del grupo
- Filtros avanzados y visualización de datos

### Phase 3N-3O — Groups Multi-tenant

- Sistema de grupos con roles (admin/member)
- Invitaciones por token único
- Switcher de grupos en navbar

### Phase 3L-3M — Library MVP

- Tabla `library_entries` con RLS
- CRUD completo vía API routes
- Página `/library` con filtros premium
- Quick actions en MediaCard

### Phase 3A-3K — Catálogo Unificado

- Búsqueda unificada RAWG + TMDb
- Normalización de items a formato común
- UI premium con glass cards y animaciones
- Cache inteligente y prefetch en hover

### Phase 1-2 — Auth & Profiles

- Supabase SSR Auth (login/signup/callback)
- Middleware de sesión
- Auto-creación de profile y grupo por defecto
- Sanitización de redirects

---

## 📄 Licencia

Proyecto privado. Todos los derechos reservados.

---

<p align="center">
  <strong>GeekHub</strong> — Hecho con ❤️ para geeks
</p>
