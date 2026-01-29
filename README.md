<p align="center">
  <img src="assets/logo.png" alt="HOOPERITS CMS" width="400" />
</p>

<p align="center">
  Headless content management system, 100% self-hosted
  <br />
  <a href="docs/quickstart.md"><strong>Documentation »</strong></a>
  <br />
  <br />
  <a href="docs/schemas.md">Schemas</a>
  ·
  <a href="docs/api.md">API Reference</a>
  ·
  <a href="https://github.com/hooperits/hooperits-cms/issues">Report Bug</a>
</p>

<p align="center">
  <a href="#español">🇪🇸 Español</a>
</p>

## About The Project

HOOPERITS CMS is a headless content management system designed for developers who need full control over their infrastructure. No external service dependencies—everything runs on your server.

### Key Features

| Feature | Status | Description |
|---------|--------|-------------|
| 100% Self-hosted | ✅ Designed | No external service dependencies |
| Schema-driven | ✅ Designed | Define content types in TypeScript |
| Auto-generated Admin UI | 🔲 Planned | Panel generated from schemas |
| Type-safe SDK | 🔲 Planned | Client with TypeScript types |
| Image optimization | 🔲 Planned | Automatic image optimization |

**Legend**: ✅ Implemented | 🚧 In Progress | 🔲 Planned

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL + Prisma
- **Auth**: NextAuth.js (credentials)
- **UI**: React + Tailwind CSS

## Installation

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm, yarn, or pnpm

### Quick Start

```bash
# In your Next.js project
npx @hooperits/cms init

# Configure database in .env
DATABASE_URL="postgresql://user:pass@localhost:5432/cms"

# Run migrations
npm run cms:migrate

# Start development
npm run dev
```

Access admin at `http://localhost:3000/admin`

## Usage

### Define Schemas

```typescript
// cms/schemas/product.ts
import { defineSchema, fields } from '@hooperits/cms';

export const productSchema = defineSchema({
  name: 'product',
  label: 'Product',
  fields: {
    title: fields.text({ label: 'Title', required: true }),
    price: fields.number({ label: 'Price', min: 0 }),
    image: fields.image({ label: 'Image' }),
    description: fields.richtext({ label: 'Description' }),
  },
});
```

### Consume in Frontend

```typescript
import { createCMSClient } from '@hooperits/cms/client';

const cms = createCMSClient({ apiUrl: '/api/cms' });

// Get all products
const products = await cms.content.getAll('product');

// Get a product by ID
const product = await cms.content.getById('product', 'abc123');
```

## Roadmap

### Version Milestones

| Version | Features | Description |
|---------|----------|-------------|
| **v1.0** | 001, 003, 005, 007 | MVP: Draft/publish, rich text, advanced schemas |
| **v1.1** | 002, 006 | Query language + real-time foundation |
| **v1.2** | 004, 008, 013 | Versioning, advanced media, webhooks |
| **v2.0** | 009, 010, 011, 017 | Collaboration + plugins |
| **v2.1** | 012, 014, 016 | i18n, search, workflows |
| **v3.0** | 015, 018, 019, 020, 021 | AI, customization, GraphQL, DX |
| **v4.0** | 022-027 | Enterprise features |

### Detailed Roadmap

#### Phase A: Core Infrastructure

| Spec | Name | Description | Status |
|------|------|-------------|--------|
| 001 | [CMS Core](specs/001-cms-core/spec.md) | CRUD, media, auth, schemas, REST API, CLI | 🔲 Planned |
| 002 | [Query Language](specs/002-query-language/spec.md) | HQL (HOOPERITS Query Language) inspired by GROQ | 🔲 Planned |
| 003 | [Document States](specs/003-document-states/spec.md) | Draft/published states with preview & scheduling | 🔲 Planned |
| 004 | [Document Versioning](specs/004-document-versioning/spec.md) | Full history with diff, rollback & retention | 🔲 Planned |
| 005 | [Rich Text](specs/005-rich-text-portable/spec.md) | Portable Text format for structured rich content | 🔲 Planned |
| 006 | [Real-time Sync](specs/006-real-time-sync/spec.md) | WebSocket sync for real-time updates | 🔲 Planned |

#### Phase B: Admin UI Enhancement

| Spec | Name | Description | Status |
|------|------|-------------|--------|
| 007 | [Advanced Schema Features](specs/007-advanced-schema-features/spec.md) | Conditional fields, cross-validation, groups/tabs | 🔲 Planned |
| 008 | [Advanced Media Library](specs/008-media-library-advanced/spec.md) | Folders, tags, search, image editing, focal point | 🔲 Planned |
| 009 | [Collaboration Features](specs/009-collaboration-features/spec.md) | Comments, tasks, mentions, activity feeds | 🔲 Planned |
| 010 | [Real-time Collaboration](specs/010-real-time-collaboration/spec.md) | Simultaneous editing with presence & conflict resolution | 🔲 Planned |
| 011 | [Content Releases](specs/011-content-releases/spec.md) | Bundled changes for atomic scheduled publishing | 🔲 Planned |

#### Phase C: Advanced Features

| Spec | Name | Description | Status |
|------|------|-------------|--------|
| 012 | [Internationalization](specs/012-internationalization/spec.md) | Multi-language support at document and field level | 🔲 Planned |
| 013 | [Webhooks & Events](specs/013-webhooks-events/spec.md) | Webhook system for external integrations | 🔲 Planned |
| 014 | [Search & Indexing](specs/014-search-indexing/spec.md) | Full-text search with PostgreSQL, facets & highlights | 🔲 Planned |
| 015 | [AI Assist](specs/015-ai-assist/spec.md) | Configurable AI assistance (OpenAI, local LLM) | 🔲 Planned |
| 016 | [Workflows & Approvals](specs/016-workflows-approvals/spec.md) | Configurable approval flows with states and roles | 🔲 Planned |

#### Phase D: Developer Experience

| Spec | Name | Description | Status |
|------|------|-------------|--------|
| 017 | [Plugin System](specs/017-plugin-system/spec.md) | Extensible architecture for inputs, tools & widgets | 🔲 Planned |
| 018 | [Studio Customization](specs/018-studio-customization/spec.md) | Themes, branding, navigation & custom layouts | 🔲 Planned |
| 019 | [GraphQL API](specs/019-graphql-api/spec.md) | Auto-generated GraphQL API as REST/HQL alternative | 🔲 Planned |
| 020 | [CLI Enhancements](specs/020-cli-enhancements/spec.md) | Query, export, import, backup, doctor commands | 🔲 Planned |
| 021 | [SDK Enhancements](specs/021-sdk-enhancements/spec.md) | Cache, React hooks, optimistic updates, offline support | 🔲 Planned |

#### Phase E: Enterprise Features

| Spec | Name | Description | Status |
|------|------|-------------|--------|
| 022 | [Multi-tenancy](specs/022-multi-tenancy/spec.md) | Multiple isolated datasets in one installation | 🔲 Planned |
| 023 | [Advanced Permissions](specs/023-advanced-permissions/spec.md) | ABAC, document/field permissions, custom roles | 🔲 Planned |
| 024 | [Analytics Dashboard](specs/024-analytics-dashboard/spec.md) | Content metrics, editor activity, API usage | 🔲 Planned |
| 025 | [Audit Logging](specs/025-audit-logging/spec.md) | Complete logging for compliance (HIPAA, SOC2) | 🔲 Planned |
| 026 | [Performance & Caching](specs/026-performance-caching/spec.md) | Advanced caching with tags, invalidation & CDN helpers | 🔲 Planned |
| 027 | [Backup & Restore](specs/027-backup-restore/spec.md) | Automated backups, point-in-time recovery, DR | 🔲 Planned |

**Legend**: ✅ Implemented | 🚧 In Progress | 🔲 Planned

See [specs/](specs/) for detailed feature specifications.

## Documentation

- [Quickstart](docs/quickstart.md) - Getting started guide
- [Schema Definition](docs/schemas.md) - How to define content types
- [API Reference](docs/api.md) - Complete API reference

## Project Structure

```
hooperits-cms/
├── specs/                          # Feature specifications (27 specs)
│   ├── 001-cms-core/              # Core CMS spec
│   ├── 002-query-language/        # HQL query language
│   ├── 003-document-states/       # Draft/published states
│   ├── 004-document-versioning/   # Version history
│   ├── 005-rich-text-portable/    # Portable Text format
│   ├── 006-real-time-sync/        # WebSocket sync
│   ├── 007-advanced-schema-features/
│   ├── 008-media-library-advanced/
│   ├── 009-collaboration-features/
│   ├── 010-real-time-collaboration/
│   ├── 011-content-releases/
│   ├── 012-internationalization/
│   ├── 013-webhooks-events/
│   ├── 014-search-indexing/
│   ├── 015-ai-assist/
│   ├── 016-workflows-approvals/
│   ├── 017-plugin-system/
│   ├── 018-studio-customization/
│   ├── 019-graphql-api/
│   ├── 020-cli-enhancements/
│   ├── 021-sdk-enhancements/
│   ├── 022-multi-tenancy/
│   ├── 023-advanced-permissions/
│   ├── 024-analytics-dashboard/
│   ├── 025-audit-logging/
│   ├── 026-performance-caching/
│   └── 027-backup-restore/
├── assets/                         # Images and static assets
│   └── logo.png                   # Project logo
├── docs/                           # Documentation
├── .specify/                       # Speckit templates and scripts
└── .claude/                        # Commands and agents
```

## Contributing

This is a proprietary project of HOOPER IT SERVICES. To contribute, contact the development team.

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

See [LICENSE](LICENSE) for the full license text.

Copyright (c) 2026 HOOPER IT SERVICES

---

<p id="español" align="center">
  <img src="assets/logo.png" alt="HOOPERITS CMS" width="400" />
</p>

<p align="center">
  Sistema de gestión de contenido headless, 100% self-hosted
  <br />
  <a href="docs/quickstart.md"><strong>Documentación »</strong></a>
  <br />
  <br />
  <a href="docs/schemas.md">Schemas</a>
  ·
  <a href="docs/api.md">API Reference</a>
  ·
  <a href="https://github.com/hooperits/hooperits-cms/issues">Reportar Bug</a>
</p>

<p align="center">
  <a href="#about-the-project">🇺🇸 English</a>
</p>

## Acerca del Proyecto

HOOPERITS CMS es un sistema de gestión de contenido headless diseñado para desarrolladores que necesitan control total sobre su infraestructura. Sin dependencias de servicios externos, todo corre en tu servidor.

### Características Principales

| Feature | Estado | Descripción |
|---------|--------|-------------|
| 100% Self-hosted | ✅ Diseñado | Sin dependencias de servicios externos |
| Schema-driven | ✅ Diseñado | Define tipos de contenido en TypeScript |
| Admin UI automático | 🔲 Planificado | Panel generado desde schemas |
| Type-safe SDK | 🔲 Planificado | Cliente con tipos TypeScript |
| Image optimization | 🔲 Planificado | Optimización automática de imágenes |

**Leyenda**: ✅ Implementado | 🚧 En Progreso | 🔲 Planificado

## Stack Tecnológico

- **Runtime**: Node.js 18+
- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL + Prisma
- **Auth**: NextAuth.js (credentials)
- **UI**: React + Tailwind CSS

## Instalación

### Prerrequisitos

- Node.js 18 o superior
- PostgreSQL 14 o superior
- npm, yarn, o pnpm

### Quick Start

```bash
# En tu proyecto Next.js
npx @hooperits/cms init

# Configurar base de datos en .env
DATABASE_URL="postgresql://user:pass@localhost:5432/cms"

# Ejecutar migraciones
npm run cms:migrate

# Iniciar desarrollo
npm run dev
```

Accede al admin en `http://localhost:3000/admin`

## Uso

### Definir Schemas

```typescript
// cms/schemas/product.ts
import { defineSchema, fields } from '@hooperits/cms';

export const productSchema = defineSchema({
  name: 'product',
  label: 'Producto',
  fields: {
    title: fields.text({ label: 'Título', required: true }),
    price: fields.number({ label: 'Precio', min: 0 }),
    image: fields.image({ label: 'Imagen' }),
    description: fields.richtext({ label: 'Descripción' }),
  },
});
```

### Consumir en Frontend

```typescript
import { createCMSClient } from '@hooperits/cms/client';

const cms = createCMSClient({ apiUrl: '/api/cms' });

// Obtener todos los productos
const products = await cms.content.getAll('product');

// Obtener un producto por ID
const product = await cms.content.getById('product', 'abc123');
```

## Roadmap

### Versiones Planificadas

| Versión | Features | Descripción |
|---------|----------|-------------|
| **v1.0** | 001, 003, 005, 007 | MVP: Draft/publish, rich text, schemas avanzados |
| **v1.1** | 002, 006 | Query language + base real-time |
| **v1.2** | 004, 008, 013 | Versionado, media avanzado, webhooks |
| **v2.0** | 009, 010, 011, 017 | Colaboración + plugins |
| **v2.1** | 012, 014, 016 | i18n, búsqueda, workflows |
| **v3.0** | 015, 018, 019, 020, 021 | IA, customización, GraphQL, DX |
| **v4.0** | 022-027 | Features enterprise |

### Roadmap Detallado

#### Fase A: Infraestructura Core

| Spec | Nombre | Descripción | Estado |
|------|--------|-------------|--------|
| 001 | [CMS Core](specs/001-cms-core/spec.md) | CRUD, media, auth, schemas, REST API, CLI | 🔲 Planificado |
| 002 | [Query Language](specs/002-query-language/spec.md) | HQL (HOOPERITS Query Language) inspirado en GROQ | 🔲 Planificado |
| 003 | [Document States](specs/003-document-states/spec.md) | Estados draft/published con preview y programación | 🔲 Planificado |
| 004 | [Document Versioning](specs/004-document-versioning/spec.md) | Historial completo con diff, rollback y retención | 🔲 Planificado |
| 005 | [Rich Text](specs/005-rich-text-portable/spec.md) | Formato Portable Text para contenido estructurado | 🔲 Planificado |
| 006 | [Real-time Sync](specs/006-real-time-sync/spec.md) | Sincronización WebSocket en tiempo real | 🔲 Planificado |

#### Fase B: Mejoras de Admin UI

| Spec | Nombre | Descripción | Estado |
|------|--------|-------------|--------|
| 007 | [Advanced Schema Features](specs/007-advanced-schema-features/spec.md) | Campos condicionales, validación cruzada, grupos/tabs | 🔲 Planificado |
| 008 | [Advanced Media Library](specs/008-media-library-advanced/spec.md) | Carpetas, tags, búsqueda, edición de imágenes, focal point | 🔲 Planificado |
| 009 | [Collaboration Features](specs/009-collaboration-features/spec.md) | Comentarios, tareas, menciones, activity feeds | 🔲 Planificado |
| 010 | [Real-time Collaboration](specs/010-real-time-collaboration/spec.md) | Edición simultánea con presencia y resolución de conflictos | 🔲 Planificado |
| 011 | [Content Releases](specs/011-content-releases/spec.md) | Bundles de cambios para publicación atómica programada | 🔲 Planificado |

#### Fase C: Features Avanzados

| Spec | Nombre | Descripción | Estado |
|------|--------|-------------|--------|
| 012 | [Internationalization](specs/012-internationalization/spec.md) | Soporte multi-idioma a nivel documento y campo | 🔲 Planificado |
| 013 | [Webhooks & Events](specs/013-webhooks-events/spec.md) | Sistema de webhooks para integraciones externas | 🔲 Planificado |
| 014 | [Search & Indexing](specs/014-search-indexing/spec.md) | Búsqueda full-text con PostgreSQL, facetas y highlights | 🔲 Planificado |
| 015 | [AI Assist](specs/015-ai-assist/spec.md) | Asistencia IA configurable (OpenAI, LLM local) | 🔲 Planificado |
| 016 | [Workflows & Approvals](specs/016-workflows-approvals/spec.md) | Flujos de aprobación configurables con estados y roles | 🔲 Planificado |

#### Fase D: Experiencia de Desarrollador

| Spec | Nombre | Descripción | Estado |
|------|--------|-------------|--------|
| 017 | [Plugin System](specs/017-plugin-system/spec.md) | Arquitectura extensible para inputs, tools y widgets | 🔲 Planificado |
| 018 | [Studio Customization](specs/018-studio-customization/spec.md) | Temas, branding, navegación y layouts personalizables | 🔲 Planificado |
| 019 | [GraphQL API](specs/019-graphql-api/spec.md) | API GraphQL auto-generada como alternativa a REST/HQL | 🔲 Planificado |
| 020 | [CLI Enhancements](specs/020-cli-enhancements/spec.md) | Comandos: query, export, import, backup, doctor | 🔲 Planificado |
| 021 | [SDK Enhancements](specs/021-sdk-enhancements/spec.md) | Caché, React hooks, optimistic updates, soporte offline | 🔲 Planificado |

#### Fase E: Features Enterprise

| Spec | Nombre | Descripción | Estado |
|------|--------|-------------|--------|
| 022 | [Multi-tenancy](specs/022-multi-tenancy/spec.md) | Múltiples datasets aislados en una instalación | 🔲 Planificado |
| 023 | [Advanced Permissions](specs/023-advanced-permissions/spec.md) | ABAC, permisos por documento/campo, roles custom | 🔲 Planificado |
| 024 | [Analytics Dashboard](specs/024-analytics-dashboard/spec.md) | Métricas de contenido, actividad de editores, uso de API | 🔲 Planificado |
| 025 | [Audit Logging](specs/025-audit-logging/spec.md) | Logging completo para compliance (HIPAA, SOC2) | 🔲 Planificado |
| 026 | [Performance & Caching](specs/026-performance-caching/spec.md) | Caché avanzado con tags, invalidación y CDN helpers | 🔲 Planificado |
| 027 | [Backup & Restore](specs/027-backup-restore/spec.md) | Backups automáticos, point-in-time recovery, DR | 🔲 Planificado |

**Leyenda**: ✅ Implementado | 🚧 En Progreso | 🔲 Planificado

Ver [specs/](specs/) para especificaciones detalladas de cada feature.

## Documentación

- [Quickstart](docs/quickstart.md) - Guía de inicio rápido
- [Definición de Schemas](docs/schemas.md) - Cómo definir tipos de contenido
- [API Reference](docs/api.md) - Referencia completa de la API

## Estructura del Proyecto

```
hooperits-cms/
├── specs/                          # Especificaciones de features (27 specs)
│   ├── 001-cms-core/              # Spec del core del CMS
│   ├── 002-query-language/        # Lenguaje de consulta HQL
│   ├── 003-document-states/       # Estados draft/published
│   ├── 004-document-versioning/   # Historial de versiones
│   ├── 005-rich-text-portable/    # Formato Portable Text
│   ├── 006-real-time-sync/        # Sincronización WebSocket
│   ├── 007-advanced-schema-features/
│   ├── 008-media-library-advanced/
│   ├── 009-collaboration-features/
│   ├── 010-real-time-collaboration/
│   ├── 011-content-releases/
│   ├── 012-internationalization/
│   ├── 013-webhooks-events/
│   ├── 014-search-indexing/
│   ├── 015-ai-assist/
│   ├── 016-workflows-approvals/
│   ├── 017-plugin-system/
│   ├── 018-studio-customization/
│   ├── 019-graphql-api/
│   ├── 020-cli-enhancements/
│   ├── 021-sdk-enhancements/
│   ├── 022-multi-tenancy/
│   ├── 023-advanced-permissions/
│   ├── 024-analytics-dashboard/
│   ├── 025-audit-logging/
│   ├── 026-performance-caching/
│   └── 027-backup-restore/
├── assets/                         # Imágenes y assets estáticos
│   └── logo.png                   # Logo del proyecto
├── docs/                           # Documentación
├── .specify/                       # Templates y scripts de speckit
└── .claude/                        # Comandos y agentes
```

## Contribuir

Este es un proyecto propietario de HOOPER IT SERVICES. Para contribuir, contacta al equipo de desarrollo.

## Licencia

Este proyecto está licenciado bajo la **GNU Affero General Public License v3.0 (AGPL-3.0)**.

Ver [LICENSE](LICENSE) para el texto completo de la licencia.

Copyright (c) 2026 HOOPER IT SERVICES

---

<p align="center">
  Developed by <a href="https://www.hooperits.com">HOOPERITS</a>
</p>
