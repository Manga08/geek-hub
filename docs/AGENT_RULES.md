# Agent Rules — GeekHub

Reglas obligatorias para cualquier agente/contributor que modifique el repositorio.

---

## 1. Scope Lock

- **Ejecuta solo lo solicitado:** No agregues ni quites alcance sin aprobación explícita.
- **NO refactors grandes:** Cambios deben ser incrementales y seguros.
- **NO nuevas dependencias:** No agregar librerías/packages sin autorización.
- **NO mover carpetas:** La estructura `/src` ya está definida.
- **NO cambiar arquitectura:** No introducir patrones nuevos (state managers, ORMs, etc.) sin orden.

---

## 2. Reporte Obligatorio

Al finalizar cada tarea/fase, entregar:

1. **Tabla de archivos tocados** con motivo breve.
2. **Comandos ejecutados:** `pnpm lint`, `pnpm test`, `pnpm build` con resultado.
3. **Notas de validación manual** (2-3 bullets de qué se verificó).

Ejemplo:
```
| Archivo | Motivo |
|---------|--------|
| src/features/foo/bar.tsx | Fix typo en label |
| src/app/page.tsx | Añadir import |

Comandos:
- pnpm lint → OK
- pnpm test → OK (12 tests)
- pnpm build → OK
```

---

## 3. Prohibiciones

| Prohibido | Por qué |
|-----------|---------|
| Agregar deps nuevas | Aumenta bundle, requiere revisión |
| Refactors grandes | Riesgo de regresiones, difícil review |
| Mover carpetas | Rompe imports, confunde historial |
| Cambiar diseño global | Mantener estilo premium/oscuro existente |
| Duplicar lógica/UI | DRY: una sola fuente de verdad |

---

## 4. Si algo falta

Si una función, tipo o helper no existe y es necesario:

1. **Implementar lo mínimo** para la tarea.
2. **Colocarlo en el feature correspondiente** (`/src/features/*`).
3. **Exportar desde index.ts** del feature.
4. **Documentar brevemente** con JSDoc si es público.

---

## 5. Estándares de Código

### TypeScript
- **Strict-friendly:** No usar `any` salvo casos justificados.
- **Preferir tipos explícitos** en exports públicos.
- **Usar `type` para DTOs/interfaces**, `interface` para contratos extensibles.

### React/Next.js
- **Server Components por defecto** en App Router.
- **"use client"** solo donde sea necesario (hooks, eventos).
- **No lógica compleja en componentes:** Mover a hooks o funciones en `features/*`.

### Funciones puras
- **Helpers deben ser funciones puras** sin side effects.
- **Colocar en archivos separados** (ej: `utils.ts`, `helpers.ts`).

### Imports
- **Imports absolutos** con `@/` prefix.
- **Orden:** externos → internos → relativos.

---

## 6. Convención de Commits

Formato: `tipo(area): descripción breve`

| Tipo | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `chore` | Tareas de mantenimiento |
| `docs` | Documentación |
| `refactor` | Refactor sin cambio funcional |
| `test` | Tests |

Ejemplos:
- `feat(groups): add group name editor`
- `fix(auth): handle expired token`
- `chore(repo): add .gitattributes`

---

## 7. Antes de Commit

Checklist obligatorio:

```bash
pnpm lint      # Sin errores
pnpm test      # Todos pasan
pnpm build     # Build exitoso
```

Si alguno falla, **NO hacer commit** hasta corregir.
