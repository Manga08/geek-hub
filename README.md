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

## Auth (Supabase SSR)

- Rutas: /login, /signup, /auth/callback, /auth/auth-code-error
- Variables de entorno: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (o NEXT_PUBLIC_SUPABASE_ANON_KEY), SUPABASE_SERVICE_ROLE_KEY
- Pruebas manuales:
	- Crear .env.local con las claves de Supabase.
	- `pnpm dev` y visitar /signup para crear cuenta; confirmar correo si aplica.
	- Ingresar en /login y acceder a `/` (redirige a login si no hay sesión).
	- Usar botón Logout en `/` para cerrar sesión y volver a /login.
