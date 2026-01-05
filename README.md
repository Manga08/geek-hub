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

## Auth (Supabase SSR)

- Rutas: /login, /signup, /auth/callback, /auth/auth-code-error
- Variables de entorno: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (o NEXT_PUBLIC_SUPABASE_ANON_KEY), SUPABASE_SERVICE_ROLE_KEY
- Pruebas manuales:
	- Crear .env.local con las claves de Supabase.
	- `pnpm dev` y visitar /signup para crear cuenta; confirmar correo si aplica.
	- Ingresar en /login y acceder a `/` (redirige a login si no hay sesión).
	- Usar botón Logout en `/` para cerrar sesión y volver a /login.
