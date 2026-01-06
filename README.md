# geek-hub

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/(app)/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Contributing

### Before committing

Run the verification script to ensure all checks pass:

```bash
pnpm verify   # Runs: lint + test + build
```

Or run individually:

```bash
pnpm lint      # No lint errors
pnpm test      # All tests pass
pnpm build     # Production build succeeds
```

### Line Endings (CRLF → LF)

This project uses LF line endings. If you see CRLF warnings from Git, run:

```bash
git add --renormalize .
git commit -m "chore: normalize line endings"
```

### Guidelines

- **No new dependencies** without explicit approval.
- **Small, incremental changes** — one feature/fix per PR.
- **Follow commit convention:** `feat(area): ...`, `fix(area): ...`, `chore(area): ...`
- **Keep the dark premium style** — no design overhauls.

See [docs/AGENT_RULES.md](docs/AGENT_RULES.md) for full rules.

### QA & Release

Before merging to main or releasing, follow the full checklist:

📋 **[docs/QA_RELEASE_CHECKLIST.md](docs/QA_RELEASE_CHECKLIST.md)**

## Progress / Changelog

- Migrated project structure to `/src` (app, components, lib) and updated configs/aliases accordingly.
- Fase 0C — Sanity post-migración a `/src`: se verificó estructura, aliases, Tailwind/shadcn, vitest config y se documentaron reglas del agente.
- Fase 0D — Fix Vitest v4 config (build fix): se eliminó `test.deps.inline` inválido, se mantuvo alias `@ -> src`, `exclude e2e/**`, `passWithNoTests`, y se aseguró compatibilidad con Vitest v4/TypeScript para que `pnpm build` no falle.
- Fase 1A — Supabase SSR + Auth (login/signup/callback): se agregó scaffolding de auth SSR (Supabase), rutas /login, /signup, /auth/callback, middleware de sesión y home protegido.
- Fase 1B — Fix build auth forms (client components): se movieron los formularios de login/signup a Client Components (useFormState/useFormStatus), manteniendo server actions y dejando las pages como Server Components para que el build no falle.
- Fase 1C — Fix build (headers async en server actions): se ajustó headers() a await en getOrigin() y sus llamadas para cumplir con el tipado async de Next 16.
- Fase 1D — Fix build (cookies async en Supabase SSR): se hizo async createSupabaseServerClient() esperando cookies(), y se actualizaron llamadas para evitar el error de tipado en Next 16.
- Fase 1E — Fix build (await client en signInAction): se agregó await al cliente Supabase en signInAction para resolver el tipado de Next/TypeScript.
- Fase 1F — Hardening auth (sanitize redirects + layouts + primer test): se agregó sanitizeNextPath para evitar open redirects, layouts que protegen (app) y redirigen desde (auth) si hay sesión, y primer test de redirect.
- Fase 2A — Perfil + grupo por defecto:
  - En login (/auth/callback o signInAction) se asegura profile en profiles (id = auth.uid) si falta, usando email antes de "@" como display_name o "Usuario".
  - Se busca el primer group_members del usuario; si existe se reutiliza ese group_id.
  - Si no tiene grupo se crea uno por defecto con name "Mi grupo" y created_by = auth.uid.
  - Se inserta membership en group_members con role "admin" para el usuario que inició sesión.
  - Se mantiene sanitizeNextPath y el flujo de redirect; solo se agrega la garantía de datos multi-tenant.
- Fase 3A — Catálogo unificado (backend):
  - Se definió UnifiedCatalogItem (game, movie, tv, anime) y provider rawg/tmdb.
  - Se agregaron normalizadores RAWG y TMDb con URLs de imágenes y metadatos básicos.
  - Se implementó servicio de búsqueda/detalle unificado con hasMore según proveedor.
  - Endpoints internos GET /api/catalog/search e GET /api/catalog/item para consumir desde el frontend.
  - Claves RAWG/TMDb solo se usan server-side (no exponer en cliente).
- Fase 3B — Fix lint (tipado catálogo, sin any):
  - Se tiparon RAWG/TMDb DTO mínimos en providers/types para evitar any.
  - Normalizadores usan tipos concretos y meta con Record<string, unknown>.
  - Clientes RAWG/TMDb y servicio/catalog routes evitan catch any y serializan mensajes seguros.
  - Sin cambios de lógica ni dependencias nuevas; objetivo solo pasar lint no-explicit-any.
- Hotfix — Fix build TMDb + callback sin 500:
  - normalizeTmdb ahora tiene overloads separados para movie vs tv/anime y deja de romper el build por tipos.
  - /auth/callback captura errores de ensureProfileAndDefaultGroup y redirige a /auth/auth-code-error en lugar de responder 500.
- Hotfix 2 — Fix build TMDb (tipos popularity/vote\_\*):
  - Se añadieron popularity, vote_average y vote_count a los tipos base de TMDb.
  - normalizeTmdb usa esos campos en meta junto con runtime o number_of_seasons/episode_run_time según el tipo.
  - Sin cambios de lógica ni dependencias; objetivo desbloquear el build.
- Fase 3C — UI Search + Detail (Catálogo):
  - Página /search con búsqueda por tipo (game, movie, tv, anime), estados loading/empty/error y grid de resultados.
  - Cards con poster, título, año y badge de tipo; clic navega a /item/[type]/[key].
  - Detalle /item/... muestra hero/poster, géneros, resumen y botón placeholder "Agregar a biblioteca".
  - Footer de atribución RAWG/TMDb en vistas de catálogo y página /credits dedicada.
  - Consultas via TanStack Query a los endpoints internos /api/catalog/search e /api/catalog/item.
- Fase 3D — Hotfix UI catálogo (shadcn faltantes) + lint + dark default + redirect /search:
  - Se agregaron componentes ui badge/input/select de shadcn para resolver imports faltantes.
  - SearchClient usa useInfiniteQuery (TanStack) sin useEffect+setState y pagina via hasMore.
  - Se removió el try/catch con JSX en /item/... y la validación ocurre antes del render.
  - Modo oscuro por defecto desde el layout root y auth con fondo oscuro + cards estilizadas.
  - Post-login redirige a /search (callbacks, sign-in) y home (/ ) ahora redirige a /search.
- Fase 3E — Fix Select (Radix) + Supabase SSR cookies:
  - Se añadió @radix-ui/react-select.
  - Select usa iconos de lucide-react (sin @radix-ui/react-icons).
  - Supabase server client protege set de cookies con try/catch para evitar crash en Server Components.
  - Nota: tras actualizar deps, ejecutar pnpm install.
- Fase 3F — UI System GeekHub Dark Premium + Fix Search (images/infiniteQuery):
  - next/image ahora permite hosts RAWG y TMDb en remotePatterns.
  - SearchClient usa useInfiniteQuery con initialPageParam tipado para paginación segura.
  - Tokens GeekHub Dark y fondo radial + stripe aplicados como base del tema.
  - Nuevos AppShell/Navbar/GlassCard y skin aplicado a Auth, Search, Item y Credits.
- Fase 3G — Cards premium + RAWG HD + Next 16 fixes:
  - MediaCard con GlassCard premium, brillo en hover, quick actions, imágenes HQ y animación fade-up.
  - RAWG normalizer prioriza background_image_additional/short_screenshots y sube thumbnails 288→640.
  - Item page espera params async (Next 16) y useInfiniteQuery tipa InfiniteData para pages.
  - Tests nuevos cubren preferencia de fondo RAWG y upgrade de screenshots.
- Fase 3H — Fix RAWG types/tests + TMDb cache + loading item page:
  - RAWG DTO ahora incluye short_screenshots opcional; tests sin any usando RawgGameLike.
  - TMDb search/detail cachean con revalidate (10 min / 1 día) para abrir detalle más rápido.
  - loading.tsx para /item y /search con skeleton premium y glass acorde al tema.
- Fase 3I — Stabilize Dev Env (Windows/Webpack) + lint fixes:
  - MediaGrid.tsx usa `Variants` tipados y `React.isValidElement` para evitar any.
  - Scripts: `dev` usa `--webpack`; agregados `dev:turbo` y `build:webpack` opcionales.
  - Documentación de troubleshooting cross-env (Windows/WSL) en README.
- Fase 3K — Premium Media Cards v2 + RAWG HQ resize + prefetch + page transitions:
  - MediaCard rediseñada: glass premium, shine animado, quick actions (heart/plus/link), blur placeholder.
  - RAWG images usan `resize/1280/-/` para HQ; tests actualizados.
  - Prefetch en hover/focus/pointerDown para navegación "instant" a item.
  - ItemPageClient con AnimatePresence para transición skeleton→content.
  - PageTransition wrapper en AppShell para fade suave entre páginas.
  - Respeta prefers-reduced-motion en todas las animaciones.
- Fase 3L — MVP Library (Favorites + CRUD + Supabase RLS):
  - Nueva tabla `library_entries` con RLS en Supabase (migración en `supabase/migrations/001_library_entries.sql`).
  - Feature folder `src/features/library/` con types, queries, repo y hooks.
  - API routes `/api/library/entry` (GET/POST/PATCH/DELETE) y `/api/library/entry/favorite` (toggle).
  - EntryDialog (glass premium) para agregar/editar entradas con status, rating, notas y favorito.
  - EntryQuickActions integrado en MediaCard: botones heart (favorito) y plus (agregar/ver).
  - ItemDetail muestra estado actual de la entrada con badge de status, estrellas y botón editar.
  - useLibraryEntry hook con optimistic updates y React Query invalidation.
  - Estados: planned, in_progress, completed, dropped. Rating 1-10.
- Fase 3M — Library page + filters + premium UX:
  - Nueva página `/library` con grid de entradas y filtros premium.
  - API route GET `/api/library/list` con filtros type/status/favorite/sort.
  - Filtros: tipo (game/movie/tv/anime), estado, favoritos, orden (recientes/rating).
  - LibraryCard con acciones rápidas: favorito, editar, eliminar (con confirmación).
  - Empty states premium: biblioteca vacía y sin resultados con filtros.
  - Loading skeleton acorde al tema glass.
  - Link en Navbar a /library.

## Catálogo (UI)

- /search: Buscar catálogo unificado (game/movie/tv/anime), ver cards y estados de carga.
- /item/[type]/[key]: Detalle con backdrop/poster, géneros, resumen y badge de proveedor.
- /credits: Atribución TMDb y RAWG; enlaces obligatorios.
- Cómo probar: definir RAWG_API_KEY y TMDB_ACCESS_TOKEN (o TMDB_API_KEY) en .env.local; `pnpm dev`, navegar a /search, realizar búsquedas y abrir un ítem.

## Library (Biblioteca personal)

- **/library**: Página principal con grid de entradas y filtros premium (tipo, estado, favoritos, orden).
- Cada usuario puede agregar ítems del catálogo a su biblioteca personal.
- Estados disponibles: Planeado, En progreso, Completado, Abandonado.
- Rating de 1-10 puntos y campo de notas libre.
- Marcar como favorito desde cards o detalle.
- Acciones rápidas en hover de MediaCard: corazón (favorito) y plus (agregar/editar).
- LibraryCard con botones: favorito, editar, eliminar (con confirmación).
- Dialog premium (glass) para crear/editar entradas con todos los campos.
- Supabase RLS asegura que cada usuario solo ve/edita sus propias entradas.
- **Setup DB:** ejecutar migraciones en `supabase/migrations/` en tu proyecto Supabase (Dashboard → SQL Editor).
- **Variables de entorno requeridas:** las mismas de Auth (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).
- **Cómo probar:**
  1. Ejecutar las migraciones SQL en Supabase (ver sección Supabase Migrations)
  2. Iniciar sesión en la app
  3. Ir a /search, agregar items a biblioteca
  4. Ir a /library para ver, filtrar y gestionar tus entradas

## Changelog (Phases 3N–4A)

- **Phase 3N–3O — Groups Multi-tenant + Invites:** Sistema de grupos con roles (admin/editor/viewer), switcher, gestión de miembros e invitaciones con tokens únicos. Páginas /groups, /groups/members, /invite/[token].
- **Phase 3P–3Q — Lists Feature:** Listas personalizadas (game, movie, tv, anime, mixed) con hasta 100 ítems por lista. CRUD completo, drag-reorder y página de detalle.
- **Phase 3R–3S — Stats Dashboard:** Página /stats con estadísticas del grupo: totales, distribución por tipo/estado, favoritos, ratings y actividad reciente.
- **Phase 3T — Activity Log:** Feed de actividad del grupo con eventos de library, lists y membership. Timeline en /activity con avatares y timestamps.
- **Phase 3U — Profile Settings + Avatar Upload:** Página /settings/profile para editar display_name y subir avatar. Storage bucket 'avatars' en Supabase.
- **Phase 3V — Activity Unread Notifications:** Badge de notificaciones en Navbar, tracking de lecturas por usuario/grupo, auto-mark read al visitar /activity.
- **Phase 3W — Realtime Notifications + Panel:** Suscripción Supabase Realtime (sin polling), panel dropdown en Navbar con últimos eventos, políticas de storage idempotentes.
- **Phase 3X — Our Ratings Panel + Library User-Scoped + Supabase Image Host:**
  - Fix multi-tenant: library entries ahora son user-scoped (cada miembro puede tener su propia entrada del mismo item).
  - Panel "Nuestra puntuación" en detalle de item: muestra ratings/status de todos los miembros del grupo con promedio.
  - next.config.ts permite imágenes de Supabase Storage para avatares.
  - Migration 014: FKs a profiles para joins confiables en PostgREST.
- **Phase 3Y — Stats/Insights (Mine vs Group):**
  - Página /stats con filtros scope (mine/group), year, type.
  - Agregaciones puras en aggregate.ts con tests.
  - Gráfico mensual, top rated, leaderboard grupal.
- **Phase 3Z — DB Hardening:**
  - Migration 015: Limpieza de FKs duplicadas a auth.users.
  - Fix v2: Detección correcta usando referential_constraints + key_column_usage.
- **Phase 4A — Password Recovery:**
  - Flujo completo de recuperación de contraseña con Supabase Auth (PKCE).
  - Páginas /forgot-password y /reset-password con UI premium.
  - Server actions: requestPasswordResetAction, updatePasswordAction.
  - Link "¿Olvidaste tu contraseña?" en login.
  - Mensaje de éxito post-reset en login.

## Supabase Migrations

Ejecutar en orden desde **Supabase Dashboard → SQL Editor**:

| Archivo                              | Descripción                                       |
| ------------------------------------ | ------------------------------------------------- |
| `001_library_entries.sql`            | Tabla library_entries con RLS                     |
| `002_groups_schema.sql`              | Grupos, miembros e invitaciones                   |
| `003_groups_rls_policies.sql`        | Políticas RLS para grupos                         |
| `004_lists_schema.sql`               | Listas y list_items                               |
| `005_library_group_id.sql`           | Añade group_id a library_entries                  |
| `006_lists_group_id.sql`             | Añade group_id a lists                            |
| `007_library_list_unique.sql`        | Constraint único en library_entries               |
| `008_stats_helpers.sql`              | Helper RPC para estadísticas                      |
| `009_activity_log.sql`               | Tabla activity_events con RLS                     |
| `010_activity_fk_profiles.sql`       | FK a profiles + bucket avatars                    |
| `011_hardening_activity_avatars.sql` | Backfill profiles + hardening                     |
| `012_activity_reads.sql`             | Tracking de lecturas de actividad                 |
| `013_storage_avatars_policies.sql`   | Políticas storage (requiere owner/postgres)       |
| `014_profiles_relationships.sql`     | FKs para joins en group_members y library_entries |
| `015_cleanup_duplicate_fks.sql`      | Limpieza de FKs duplicadas a auth.users (v2)      |

**Nota:** La migración 013 requiere privilegios de owner. Si falla con "must be owner of relation objects", ejecutarla desde el SQL Editor con el rol postgres.

**Nota:** La migración 015 (v2) usa referential_constraints + key_column_usage para detectar correctamente FKs por columna local y tabla referenciada. Es idempotente.

- Hotfix — group_members member_role + TMDb dispatch overload + getUser():
  - addMember inserta en group_members usando la columna member_role.
  - Se agregó normalizeTmdbDispatch para resolver overloads en el servicio de catálogo.
  - El servicio usa el dispatcher y mantiene tipado sin any.
  - En layout/page se usa supabase.auth.getUser() para validar sesión antes de renderizar.

## Auth (Supabase SSR)

- Rutas: /login, /signup, /auth/callback, /auth/auth-code-error
- Variables de entorno: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (o NEXT_PUBLIC_SUPABASE_ANON_KEY), SUPABASE_SERVICE_ROLE_KEY
- Pruebas manuales:
  - Crear .env.local con las claves de Supabase.
  - `pnpm dev` y visitar /signup para crear cuenta; confirmar correo si aplica.
  - Ingresar en /login y acceder a `/` (redirige a login si no hay sesión).
  - Usar botón Logout en `/` para cerrar sesión y volver a /login.

## Entorno de Desarrollo (Windows/WSL)

### Reglas generales

- **No mezclar entornos:** si instalas con `pnpm install` en WSL, corre el proyecto en WSL. Si instalas en CMD/PowerShell, corre desde ahí.
- Si aparecen errores tipo:
  - `Cannot find module '@rollup/rollup-*-gnu'`
  - `Cannot find module '../lightningcss.*.node'`
    es porque node_modules contiene binarios compilados para un SO/ABI distinto.

### Reinstalación limpia (Windows CMD/PowerShell)

```powershell
rmdir /s /q node_modules
rmdir /s /q .next
pnpm store prune
pnpm install --force
pnpm lint
pnpm test
pnpm dev
```

### Reinstalación limpia (WSL / Linux / macOS)

```bash
rm -rf node_modules .next
pnpm store prune
pnpm install --force
pnpm lint
pnpm test
pnpm dev
```

### Scripts disponibles

| Comando              | Descripción                                         |
| -------------------- | --------------------------------------------------- |
| `pnpm dev`           | Dev server con Webpack (estable en Windows)         |
| `pnpm dev:turbo`     | Dev server con Turbopack (más rápido, experimental) |
| `pnpm build`         | Build producción (Turbopack por defecto en Next 16) |
| `pnpm build:webpack` | Build producción forzando Webpack                   |
| `pnpm lint`          | ESLint                                              |
| `pnpm test`          | Vitest (unit tests)                                 |

### Recomendación para WSL

- Preferir tener el repo **dentro del filesystem de WSL** (`~/proyectos/geek-hub`) en lugar de `/mnt/c/...` para mejor performance de I/O.
- Instalar y correr todo desde la misma terminal WSL.
