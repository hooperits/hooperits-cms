<!--
=============================================================================
SYNC IMPACT REPORT
=============================================================================
Version Change: 1.2.0 → 1.2.1 (PATCH)
Bump Rationale: Expanded Principle VII with bilingual requirement

Modified Principles:
  - VII. Living Documentation → Added bilingual (EN/ES) requirement

Added Sections: None
Removed Sections: None

Templates/Files Status:
  ✅ .specify/templates/plan-template.md - No changes needed
  ✅ .specify/templates/spec-template.md - No changes needed
  ✅ .specify/templates/tasks-template.md - No changes needed
  ✅ .claude/commands/speckit.implement.md - Updated (bilingual README sync)
  ✅ README.md - Updated with bilingual structure (EN/ES)

Follow-up TODOs: None
=============================================================================
-->

# HOOPERITS CMS Constitution

## Core Principles

### I. Zero External Dependencies

El CMS NO DEBE depender de servicios externos para funcionar. Todo DEBE ser self-hosted:

- Base de datos PostgreSQL en servidor del cliente
- Almacenamiento de archivos en filesystem local o S3 propio
- Autenticación sin OAuth externo (solo credentials)
- Sin analytics, telemetry, o "call home"

**Rationale**: El cliente debe tener control total. Si el proveedor de un servicio externo cierra o cambia términos, el CMS sigue funcionando.

### II. Schema-Driven

Toda la funcionalidad del CMS se deriva de los schemas definidos por el desarrollador:

- Los schemas son código TypeScript, versionable en Git
- El admin UI se genera automáticamente desde schemas
- Los tipos del cliente SDK se generan desde schemas
- Las migraciones de DB se derivan de cambios en schemas

**Rationale**: Un solo punto de verdad reduce bugs y facilita mantenimiento.

### III. Developer Experience First

El CMS debe ser fácil de instalar, configurar y extender:

- Setup inicial en <30 minutos
- CLI para tareas comunes (init, migrate, generate)
- Documentación clara con ejemplos
- Errores descriptivos y accionables

**Rationale**: Si es difícil de usar, no lo usaremos ni nosotros mismos.

### IV. Performance Budget

El CMS no debe impactar negativamente el rendimiento del sitio cliente:

| Métrica | Target |
|---------|--------|
| API response (cached) | <50ms |
| API response (uncached) | <200ms |
| Admin UI initial load | <3s |
| Image optimization | Automático |

**Rationale**: Un CMS lento frustra a editores y afecta el sitio público.

### V. Security by Default

Todas las rutas del admin DEBEN estar protegidas:

- Autenticación requerida para cualquier operación
- Passwords hasheados con algoritmos modernos
- CSRF protection en formularios
- Rate limiting en login
- Sin información sensible en logs

**Rationale**: Los CMS son targets comunes de ataques.

### VI. Attribution & Branding

Toda autoría y créditos del proyecto DEBEN atribuirse exclusivamente a HOOPERITS:

- README, documentación y GitHub DEBEN mencionar únicamente a "HOOPERITS" o "HOOPER IT SERVICES"
- NO DEBE mencionarse a terceros (herramientas de IA, frameworks de desarrollo asistido, etc.) como co-autores
- Commits, PRs y reviews automatizados DEBEN usar "HOOPERITS Engineering" como firma
- La licencia es AGPL-3.0 y el copyright pertenece a HOOPER IT SERVICES

**Rationale**: El producto es propiedad intelectual de HOOPERITS. Las herramientas utilizadas en el desarrollo son medios, no co-autores.

### VII. Living Documentation

El README.md DEBE mantenerse actualizado y seguir las mejores prácticas de documentación GitHub:

- **Estructura requerida**: Título, badges, descripción, características, instalación, uso, API/ejemplos, stack, roadmap, licencia
- **Bilingüe obligatorio**: El README DEBE estar en inglés Y español. Estructura: English section primero, luego "---" separador, luego sección en Español
- **Sincronización obligatoria**: Al completar cualquier spec de speckit (`/speckit.implement`), el README DEBE actualizarse en AMBOS idiomas
- **Sección Features**: DEBE reflejar las características realmente implementadas (no futuras)
- **Sección Roadmap**: DEBE listar features planificadas con estado (Planned/In Progress/Done)
- **Badges**: DEBE incluir badges de build status, version, y license cuando aplique

**Rationale**: El README es la primera impresión del proyecto. Documentación bilingüe amplía el alcance a mercados hispanohablantes y angloparlantes.

## Technology Constraints

| Capa | Tecnología | No Usar |
|------|------------|---------|
| Runtime | Node.js 18+ | Deno, Bun (por ahora) |
| Framework | Next.js 14 | Express standalone |
| Database | PostgreSQL | MySQL, MongoDB, SQLite |
| ORM | Prisma | TypeORM, Drizzle |
| Auth | NextAuth.js | Passport, custom JWT |
| UI | React + Tailwind | Vue, Svelte |

## Quality Standards

### Testing
- Unit tests para lógica de core (Vitest)
- E2E tests para flujos críticos del admin (Playwright)
- Cobertura mínima: 80% en packages/core

### Code Style
- TypeScript strict mode
- ESLint + Prettier
- No `any` types sin justificación

## Governance

Esta constitución aplica a todo el desarrollo del CMS.

**Proceso de cambios:**
1. Proponer cambio con justificación
2. Evaluar impacto en proyectos cliente existentes
3. Documentar migración si hay breaking changes
4. Incrementar versión según semver

**Version**: 1.2.1 | **Ratified**: 2026-01-29 | **Last Amended**: 2026-01-29
