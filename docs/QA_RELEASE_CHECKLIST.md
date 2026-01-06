# QA & Release Checklist — GeekHub

Este documento describe los pasos de verificación manual (smoke tests) y la checklist final antes de hacer merge o release.

---

## 📋 Preconditions

### Environment Variables

Asegúrate de tener configurado `.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=<tu_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu_anon_key>

# APIs externas
TMDB_API_KEY=<tu_api_key>
RAWG_API_KEY=<tu_api_key>
```

### Supabase

1. **Migrations aplicadas**: `supabase db push` o `supabase migration up`
2. **RLS habilitado** en todas las tablas
3. **Auth configurado**: email/password habilitado, redirect URLs configurados

### Seed (opcional)

Para testing con datos:

```bash
# Si tienes un seed script
pnpm db:seed
```

---

## 🔐 Auth

| Paso | Acción                            | Expected Result                                 |
| ---- | --------------------------------- | ----------------------------------------------- |
| 1    | Ir a `/signup`                    | Formulario visible                              |
| 2    | Crear cuenta con email válido     | Redirect a `/dashboard` o email de confirmación |
| 3    | Logout (desde menú usuario)       | Redirect a `/login`                             |
| 4    | Login con credenciales            | Redirect a `/dashboard`                         |
| 5    | Ir a `/login` estando autenticado | Redirect automático a `/dashboard`              |
| 6    | Reset password (si implementado)  | Email enviado con link de reset                 |

---

## 🏠 Dashboard

| Paso | Acción             | Expected Result                                 |
| ---- | ------------------ | ----------------------------------------------- |
| 1    | Ir a `/dashboard`  | Page carga sin errores                          |
| 2    | Stats Summary Card | Muestra tabs "Míos" / "Grupo" con números       |
| 3    | Top Rated Card     | Lista de items (o "Sin items valorados")        |
| 4    | Recent Activity    | Muestra eventos o "Sin actividad reciente"      |
| 5    | Quick Actions      | Links a Search, Lists, Group settings funcionan |

---

## ✅ Onboarding Checklist

| Paso | Acción                     | Expected Result                                |
| ---- | -------------------------- | ---------------------------------------------- |
| 1    | Usuario nuevo ve checklist | 4 pasos visibles con progreso                  |
| 2    | Completar perfil           | Paso se marca como completado                  |
| 3    | Añadir 3 items a library   | Paso se actualiza automáticamente              |
| 4    | Crear una lista            | Paso se completa                               |
| 5    | Click en "X" para dismiss  | Checklist desaparece, persiste en localStorage |
| 6    | Completar todos los pasos  | Checklist desaparece automáticamente           |

---

## 👥 Groups

### Switch Group

| Paso | Acción                          | Expected Result                   |
| ---- | ------------------------------- | --------------------------------- |
| 1    | Click en GroupSwitcher (navbar) | Dropdown con grupos disponibles   |
| 2    | Seleccionar otro grupo          | Context cambia, datos se recargan |

### Invites

| Paso | Acción                          | Expected Result                       |
| ---- | ------------------------------- | ------------------------------------- |
| 1    | Ir a `/settings/group`          | Página de settings del grupo          |
| 2    | Click "Crear invitación"        | Modal con opciones (expiración, usos) |
| 3    | Copiar link de invitación       | Link copiado al clipboard             |
| 4    | Abrir link en incógnito         | Página de redeem invite               |
| 5    | Redeem con usuario diferente    | Usuario se une al grupo               |
| 6    | Revocar invitación (como admin) | Invitación ya no funciona             |

### Roles & Members

| Paso | Acción                         | Expected Result                      |
| ---- | ------------------------------ | ------------------------------------ |
| 1    | Ver lista de miembros          | Muestra todos los miembros con roles |
| 2    | Cambiar rol de miembro (admin) | Rol actualizado                      |
| 3    | Remover miembro (admin)        | Miembro eliminado del grupo          |
| 4    | Leave group (no admin)         | Usuario sale del grupo               |

---

## 📚 Library

### CRUD Básico

| Paso | Acción                                | Expected Result                     |
| ---- | ------------------------------------- | ----------------------------------- |
| 1    | Ir a `/search`, buscar item           | Resultados aparecen                 |
| 2    | Click en item → "Añadir a biblioteca" | Entry creada, toast de confirmación |
| 3    | Ir a `/library`                       | Entry visible en la lista           |
| 4    | Cambiar status de entry               | Status actualizado                  |
| 5    | Toggle favorito                       | Corazón se llena/vacía              |
| 6    | Eliminar entry                        | Entry desaparece de la lista        |

### Filtros Avanzados

| Paso | Acción                                 | Expected Result                           |
| ---- | -------------------------------------- | ----------------------------------------- |
| 1    | Filtrar por tipo (game/movie/tv/anime) | Solo ese tipo visible                     |
| 2    | Multi-status (planned + completed)     | Ambos estados visibles                    |
| 3    | Solo favoritos                         | Solo entries con ❤️                       |
| 4    | Sin rating                             | Solo entries sin puntuación               |
| 5    | Buscar por título (`q=...`)            | Filtrado por título                       |
| 6    | URL refleja filtros                    | `?status=planned,completed&favorite=true` |
| 7    | Back/Forward del browser               | Filtros se restauran                      |

### Sort

| Paso | Acción           | Expected Result                      |
| ---- | ---------------- | ------------------------------------ |
| 1    | Sort "Recientes" | Ordenado por updated_at desc         |
| 2    | Sort "Rating"    | Ordenado por rating desc, nulls last |

### Bulk Actions

| Paso | Acción                         | Expected Result                   |
| ---- | ------------------------------ | --------------------------------- |
| 1    | Click checkbox en entry        | Entry seleccionada, barra aparece |
| 2    | "Seleccionar todo"             | Todas las entries seleccionadas   |
| 3    | Bulk set_status                | Todas cambian de estado           |
| 4    | Bulk set_favorite (true/false) | Todas se marcan/desmarcan         |
| 5    | Bulk delete (con confirm)      | Entries eliminadas                |
| 6    | Máximo 100 entries             | Error si se excede (API)          |

### Notes Modal

| Paso | Acción                            | Expected Result                  |
| ---- | --------------------------------- | -------------------------------- |
| 1    | Click menú "..." → "Editar notas" | Modal abre con notas actuales    |
| 2    | Editar texto                      | Contador de caracteres actualiza |
| 3    | Click "Guardar"                   | Notas guardadas, modal cierra    |
| 4    | Click "Cancelar"                  | Modal cierra sin guardar         |
| 5    | Indicador de notas en card        | Ícono visible si hay notas       |

---

## 📝 Lists

| Paso | Acción                      | Expected Result                  |
| ---- | --------------------------- | -------------------------------- |
| 1    | Ir a `/lists`               | Lista de listas (o empty state)  |
| 2    | Crear nueva lista           | Modal con nombre/descripción     |
| 3    | Lista creada                | Aparece en la lista              |
| 4    | Editar nombre/descripción   | Cambios guardados                |
| 5    | Agregar item a lista        | Item aparece en la lista         |
| 6    | Quitar item de lista        | Item desaparece                  |
| 7    | Reorder items (drag & drop) | Nuevo orden persiste             |
| 8    | Eliminar lista              | Lista eliminada con confirmación |

---

## 👤 Profile

| Paso | Acción                   | Expected Result               |
| ---- | ------------------------ | ----------------------------- |
| 1    | Ir a `/settings/profile` | Formulario con datos actuales |
| 2    | Cambiar display_name     | Nombre actualizado            |
| 3    | Upload avatar            | Imagen sube y se muestra      |
| 4    | Delete avatar            | Avatar vuelve a default       |

---

## 🧪 Matriz Feature → Endpoint → UI

| Feature       | API Endpoint                           | UI Component                 | Checks                |
| ------------- | -------------------------------------- | ---------------------------- | --------------------- |
| Auth          | `/auth/*`, `/api/auth/*`               | LoginForm, SignupForm        | Session, redirect     |
| Dashboard     | `/api/stats/summary`                   | DashboardPage                | Stats load, tabs work |
| Onboarding    | N/A (client state)                     | OnboardingChecklist          | Progress, dismiss     |
| Groups        | `/api/groups/*`                        | GroupSwitcher, GroupSettings | CRUD, invites         |
| Library List  | `GET /api/library/list`                | LibraryPage                  | Filters, URL sync     |
| Library Entry | `POST/PATCH/DELETE /api/library/entry` | LibraryCard                  | CRUD                  |
| Library Bulk  | `PATCH /api/library/entry/bulk`        | BulkActionBar                | Batch ops             |
| Notes         | `PATCH /api/library/entry`             | NotesModal                   | Edit, save            |
| Lists         | `/api/lists/*`                         | ListsPage, ListDetail        | CRUD items            |
| Profile       | `PATCH /api/profile`                   | ProfileSettings              | Update, avatar        |
| Catalog       | `/api/catalog/*`                       | SearchPage, ItemDetail       | Search, fetch         |
| Activity      | `/api/activity/*`                      | ActivityFeed                 | Events, realtime      |

---

## ✅ Checklist Final Pre-Release

### Code Quality

- [ ] `pnpm lint` pasa sin errores
- [ ] `pnpm test` pasa (todos los tests)
- [ ] `pnpm build` compila sin errores

### Shortcut

```bash
pnpm verify   # Ejecuta lint + test + build
```

### Manual Smoke

- [ ] Auth flow completo (signup → login → logout)
- [ ] Dashboard carga correctamente
- [ ] Library: crear, filtrar, bulk actions funcionan
- [ ] Lists: CRUD completo
- [ ] Groups: invites y roles funcionan
- [ ] Profile: update funciona

### Database

- [ ] Migrations aplicadas en staging/prod
- [ ] RLS policies correctas
- [ ] No hay datos de prueba en prod

### Environment

- [ ] Variables de entorno configuradas en Vercel/hosting
- [ ] API keys de TMDB y RAWG activas
- [ ] Supabase project configurado

### Git

- [ ] Branch actualizado con main/develop
- [ ] No hay conflictos de merge
- [ ] Commits siguen convención (`feat:`, `fix:`, `chore:`)
- [ ] PR description clara

### Optional

- [ ] E2E tests pasan (si implementados)
- [ ] Performance check (Lighthouse > 80)
- [ ] Accesibilidad básica verificada

---

## 🚀 Deploy

1. Merge PR a `main`
2. Vercel auto-deploy (o manual)
3. Verificar smoke tests en producción
4. Monitorear errores (Sentry/logs)

---

## 📞 Rollback

Si algo falla en producción:

1. Revert commit en GitHub
2. Vercel auto-redeploy al commit anterior
3. Si hay migration problemática:
   ```bash
   supabase db reset  # Solo en desarrollo
   ```
4. Documentar incidente

---

_Última actualización: Enero 2026_
