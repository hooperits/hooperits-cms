# Feature Specification: HOOPERITS CMS Core

**Feature Branch**: `001-cms-core`
**Created**: 2026-01-29
**Status**: Draft
**Input**: CMS propio, 100% self-hosted, reutilizable para múltiples proyectos de clientes

---

## Executive Summary

Desarrollar un sistema de gestión de contenido (CMS) headless, 100% self-hosted, que HOOPERITS pueda desplegar para cada cliente. El CMS será un producto interno que elimina dependencias de terceros como Sanity, Contentful, o Strapi.

### Propuesta de Valor

| Aspecto | CMS de Terceros | HOOPERITS CMS |
|---------|-----------------|---------------|
| **Propiedad** | Datos en servidores ajenos | 100% en servidor del cliente |
| **Costo** | Free tiers limitados, luego pago | $0 licencias, solo hosting |
| **Personalización** | Limitada por el proveedor | Total, código propio |
| **Vendor lock-in** | Alto | Ninguno |
| **Reutilizable** | N/A | Sí, para cada cliente |

---

## User Scenarios & Testing

### User Story 1 - Gestión de Contenido (Priority: P1)

El administrador del sitio puede crear, editar y eliminar contenido (páginas, servicios, productos) a través de una interfaz visual sin conocimientos técnicos.

**Why this priority**: Es la funcionalidad core de cualquier CMS. Sin esto, no hay producto.

**Independent Test**: Un usuario no técnico puede agregar un nuevo servicio con título, descripción e imagen, y verlo publicado en el sitio.

**Acceptance Scenarios**:

1. **Given** un usuario autenticado en el admin, **When** crea un nuevo "Servicio", **Then** puede agregar título, descripción, imagen y guardar
2. **Given** contenido existente, **When** el usuario lo edita, **Then** los cambios se reflejan en el sitio
3. **Given** contenido existente, **When** el usuario lo elimina, **Then** desaparece del sitio

---

### User Story 2 - Gestión de Medios (Priority: P1)

El administrador puede subir, organizar y usar imágenes y archivos en el contenido.

**Why this priority**: El contenido sin imágenes no es viable para sitios modernos.

**Independent Test**: Subir una imagen, usarla en un contenido, y verla optimizada en el frontend.

**Acceptance Scenarios**:

1. **Given** el panel de medios, **When** subo una imagen, **Then** se almacena y genera thumbnails automáticamente
2. **Given** una imagen subida, **When** la selecciono en un campo de contenido, **Then** se asocia correctamente
3. **Given** una imagen en uso, **When** se sirve al frontend, **Then** está optimizada (WebP, responsive)

---

### User Story 3 - Autenticación y Roles (Priority: P1)

Solo usuarios autorizados pueden acceder al panel de administración con diferentes niveles de permisos.

**Why this priority**: Seguridad básica requerida para cualquier sistema de administración.

**Independent Test**: Un usuario sin credenciales no puede acceder; un editor puede editar pero no eliminar.

**Acceptance Scenarios**:

1. **Given** un visitante sin cuenta, **When** intenta acceder al admin, **Then** ve la página de login
2. **Given** credenciales válidas, **When** hace login, **Then** accede al dashboard según su rol
3. **Given** un usuario con rol "Editor", **When** intenta eliminar contenido, **Then** no tiene permiso

---

### User Story 4 - Definición de Schemas (Priority: P1)

El desarrollador puede definir tipos de contenido (schemas) mediante código TypeScript que el CMS interpreta.

**Why this priority**: Flexibilidad para adaptar el CMS a cualquier proyecto.

**Independent Test**: Definir un schema "Producto" con campos personalizados y que aparezca en el admin.

**Acceptance Scenarios**:

1. **Given** un archivo de schema TypeScript, **When** el CMS inicia, **Then** genera las tablas y UI correspondientes
2. **Given** un schema con campo "imagen", **When** se ve en el admin, **Then** muestra un selector de medios
3. **Given** un schema con validaciones, **When** el usuario guarda sin cumplirlas, **Then** muestra errores claros

---

### User Story 5 - API para Frontend (Priority: P1)

El frontend (Next.js) puede consumir el contenido via API type-safe.

**Why this priority**: El CMS es headless, necesita exponer datos al frontend.

**Independent Test**: Hacer fetch de servicios desde Next.js y renderizarlos.

**Acceptance Scenarios**:

1. **Given** contenido publicado, **When** el frontend hace GET /api/content/services, **Then** recibe JSON con los servicios
2. **Given** el SDK del cliente, **When** importo y uso `cms.services.getAll()`, **Then** tengo tipos TypeScript correctos
3. **Given** contenido con imágenes, **When** consulto la API, **Then** incluye URLs optimizadas

---

### User Story 6 - Instalación por Proyecto (Priority: P2)

Un desarrollador puede instalar el CMS en un nuevo proyecto cliente en menos de 30 minutos.

**Why this priority**: El CMS debe ser fácil de desplegar para ser reutilizable.

**Independent Test**: Seguir el quickstart y tener el CMS funcionando con un schema básico.

**Acceptance Scenarios**:

1. **Given** un proyecto Next.js nuevo, **When** ejecuto `npx @hooperits/cms init`, **Then** se configura la estructura básica
2. **Given** el CMS instalado, **When** ejecuto `npm run cms:migrate`, **Then** crea las tablas en PostgreSQL
3. **Given** el CMS configurado, **When** accedo a `/admin`, **Then** veo el panel de administración

---

### Edge Cases

- ¿Qué pasa si la DB no está disponible? Error claro, el sitio muestra contenido cacheado si existe
- ¿Qué pasa si se sube un archivo muy grande? Límite configurable, error amigable
- ¿Qué pasa si dos usuarios editan el mismo contenido? Último en guardar gana (v1), conflictos (v2 futuro)
- ¿Qué pasa si se elimina una imagen en uso? Warning, opción de forzar o cancelar

---

## Requirements

### Functional Requirements

**Core CMS:**
- **FR-001**: Sistema DEBE permitir definir schemas de contenido via TypeScript
- **FR-002**: Sistema DEBE generar UI de administración automáticamente desde schemas
- **FR-003**: Sistema DEBE soportar campos: texto, rich text, número, fecha, imagen, referencia, array
- **FR-004**: Sistema DEBE validar contenido según reglas definidas en schema
- **FR-005**: Sistema DEBE soportar contenido en estado borrador y publicado

**Gestión de Medios:**
- **FR-006**: Sistema DEBE permitir subir imágenes (jpg, png, webp, gif)
- **FR-007**: Sistema DEBE generar thumbnails automáticamente
- **FR-008**: Sistema DEBE optimizar imágenes para web (WebP, resize)
- **FR-009**: Sistema DEBE almacenar archivos en filesystem o S3 (configurable)

**Autenticación:**
- **FR-010**: Sistema DEBE autenticar usuarios con email/password
- **FR-011**: Sistema DEBE soportar roles: Admin, Editor, Viewer
- **FR-012**: Sistema DEBE proteger todas las rutas del admin
- **FR-013**: Sistema DEBE hashear passwords con bcrypt o argon2

**API:**
- **FR-014**: Sistema DEBE exponer API REST para lectura de contenido
- **FR-015**: Sistema DEBE generar tipos TypeScript para el cliente
- **FR-016**: Sistema DEBE soportar filtros y paginación en queries
- **FR-017**: Sistema DEBE cachear respuestas (configurable)

**Instalación:**
- **FR-018**: Sistema DEBE instalarse como paquete npm
- **FR-019**: Sistema DEBE incluir CLI para setup y migraciones
- **FR-020**: Sistema DEBE funcionar con PostgreSQL 14+
- **FR-021**: Sistema DEBE ser deployable en cualquier servidor Node.js

### Key Entities

- **Schema**: Definición de un tipo de contenido (campos, validaciones, UI hints)
- **Content**: Instancia de un schema (datos reales)
- **Media**: Archivo subido (imagen, documento) con metadata
- **User**: Usuario del admin con rol y credenciales
- **Session**: Sesión de autenticación activa

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Un desarrollador puede instalar y configurar el CMS en <30 minutos siguiendo el quickstart
- **SC-002**: Un usuario no técnico puede crear contenido sin ayuda después de 10 minutos de capacitación
- **SC-003**: El admin UI funciona en Chrome, Firefox, Safari y Edge modernos
- **SC-004**: La API responde en <100ms para queries simples (contenido cacheado)
- **SC-005**: El CMS funciona en un servidor AWS Lightsail de $12/mes junto con el sitio
- **SC-006**: Zero dependencias de servicios externos (todo self-hosted)

---

## Technical Stack

| Capa | Tecnología | Justificación |
|------|------------|---------------|
| **Runtime** | Node.js 18+ | LTS, amplio soporte |
| **Framework** | Next.js 14 | Admin UI + API en uno |
| **Database** | PostgreSQL 14+ | Robusto, JSON support, self-hosted |
| **ORM** | Prisma | Type-safe, migraciones, introspección |
| **Auth** | NextAuth.js (credentials) | Sin dependencias externas |
| **Storage** | Filesystem / S3 | Configurable según cliente |
| **UI Admin** | React + Tailwind | Consistente con proyectos cliente |
| **Validación** | Zod | Type-safe, composable |

---

## Architecture

```
@hooperits/cms (monorepo)
├── packages/
│   ├── core/                    # Lógica principal
│   │   ├── src/
│   │   │   ├── schema/          # Parser de schemas
│   │   │   ├── content/         # CRUD de contenido
│   │   │   ├── media/           # Gestión de archivos
│   │   │   ├── auth/            # Autenticación
│   │   │   └── api/             # Handlers de API
│   │   └── package.json
│   │
│   ├── admin/                   # Panel de administración
│   │   ├── src/
│   │   │   ├── components/      # UI components
│   │   │   ├── pages/           # Rutas del admin
│   │   │   └── hooks/           # React hooks
│   │   └── package.json
│   │
│   ├── client/                  # SDK para frontend
│   │   ├── src/
│   │   │   ├── client.ts        # Cliente API
│   │   │   └── types.ts         # Tipos generados
│   │   └── package.json
│   │
│   └── cli/                     # Herramientas de línea de comando
│       ├── src/
│       │   ├── init.ts          # Setup inicial
│       │   ├── migrate.ts       # Migraciones DB
│       │   └── generate.ts      # Generar tipos
│       └── package.json
│
├── prisma/
│   └── schema.prisma            # Schema base de datos
│
├── docs/
│   ├── quickstart.md
│   ├── schemas.md
│   └── api.md
│
└── examples/
    └── basic-site/              # Ejemplo de uso
```

---

## Schema Definition Example

```typescript
// cms/schemas/service.ts
import { defineSchema, fields } from '@hooperits/cms';

export const serviceSchema = defineSchema({
  name: 'service',
  label: 'Servicios',
  labelPlural: 'Servicios',
  fields: {
    title: fields.text({
      label: 'Título',
      required: true,
      maxLength: 100,
    }),
    slug: fields.slug({
      label: 'URL',
      from: 'title',
    }),
    description: fields.richText({
      label: 'Descripción',
      required: true,
    }),
    image: fields.image({
      label: 'Imagen principal',
      required: true,
    }),
    specialists: fields.reference({
      label: 'Especialistas',
      to: 'specialist',
      many: true,
    }),
    order: fields.number({
      label: 'Orden',
      default: 0,
    }),
  },
});
```

---

## Client SDK Example

```typescript
// En el proyecto cliente (ej: FOPA)
import { createCMSClient } from '@hooperits/cms/client';
import type { Service } from './cms-types'; // Generado

const cms = createCMSClient({
  apiUrl: process.env.CMS_API_URL,
});

// En una página Next.js
export async function getStaticProps() {
  const services = await cms.content.getAll<Service>('service');
  return { props: { services } };
}
```

---

## Implementation Phases

### Phase 1: Core Foundation (4 semanas)
- Setup monorepo con Turborepo
- Prisma schema base (Content, Media, User)
- Parser de schemas TypeScript
- CRUD básico de contenido
- API REST mínima

### Phase 2: Admin UI (4 semanas)
- Autenticación con NextAuth
- Dashboard básico
- Formularios dinámicos desde schemas
- Lista y detalle de contenido
- Gestión de medios (upload, gallery)

### Phase 3: Polish & SDK (2 semanas)
- CLI para init/migrate/generate
- Cliente SDK con tipos
- Documentación
- Ejemplo de uso

### Phase 4: Testing & Release (2 semanas)
- Tests unitarios core
- Tests E2E admin
- Packaging npm
- Release v1.0.0

**Total estimado**: 12 semanas (~3 meses)

---

## Risks & Mitigation

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Scope creep | Alta | Alto | MVP estricto, features en backlog |
| Complejidad schema parser | Media | Alto | Empezar simple, iterar |
| Performance con mucho contenido | Baja | Medio | Paginación, caché desde v1 |
| Seguridad auth custom | Media | Alto | Usar NextAuth, auditar código |

---

## Out of Scope (v1)

- Multi-idioma (i18n) - Fase futura
- Versionado de contenido (historial) - Fase futura
- Workflows de aprobación - Fase futura
- Colaboración real-time - Fase futura
- GraphQL API - Solo REST en v1
- Plugins/extensiones - Fase futura

---

## Entregables

1. **Paquetes npm** - @hooperits/cms-core, @hooperits/cms-admin, @hooperits/cms-client, @hooperits/cms-cli
2. **Documentación** - Quickstart, API reference, guía de schemas
3. **Ejemplo funcional** - Sitio básico usando el CMS
4. **Tests** - Cobertura >80% en core

---

## Assumptions

- El CMS se desplegará junto con el sitio cliente en el mismo servidor
- PostgreSQL estará disponible (mismo Lightsail o RDS)
- El desarrollador que instala tiene conocimientos de Next.js
- Los clientes usarán el CMS solo para contenido público (no datos sensibles de pacientes)
