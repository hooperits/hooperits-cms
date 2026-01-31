<p align="center">
  <img src="assets/logo.png" alt="HOOPERITS CMS" width="400" />
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-blue.svg" alt="License: AGPL-3.0" /></a>
  <img src="https://img.shields.io/badge/version-1.0.0-green.svg" alt="Version: 1.0.0" />
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node: >=18.0.0" />
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
| 100% Self-hosted | ✅ Implemented | No external service dependencies |
| Schema-driven | ✅ Implemented | Define content types in TypeScript |
| Auto-generated Admin UI | ✅ Implemented | Panel generated from schemas |
| Type-safe SDK | ✅ Implemented | Client with TypeScript types |
| HQL Query Language | ✅ Implemented | GROQ-inspired query language for flexible content retrieval |
| Document States | ✅ Implemented | Draft/published workflow with preview, scheduling, and archive |
| Image optimization | ✅ Implemented | Automatic image optimization with Sharp |
| RBAC Authentication | ✅ Implemented | Role-based access control (Admin/Editor/Viewer) |
| CLI Tools | ✅ Implemented | Init, migrate, generate, create-admin commands |
| Rich Text Editor | ✅ Implemented | Portable Text format for structured rich content |

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

### Query with HQL

HOOPERITS CMS includes HQL (HOOPERITS Query Language), a GROQ-inspired query language for flexible content retrieval:

```typescript
// Basic query
const posts = await cms.query('*[_type == "post"]');

// With filtering and projection
const activeServices = await cms.query(
  '*[_type == "service" && active == true]{title, slug, price}'
);

// With ordering and pagination
const recentPosts = await cms.query(
  '*[_type == "post"] | order(publishedAt desc)[0..9]'
);

// With reference resolution
const postsWithAuthor = await cms.query(
  '*[_type == "post"]{title, author->{name, avatar}}'
);

// With parameters (SQL injection safe)
const categoryPosts = await cms.query(
  '*[_type == "post" && category._ref == $categoryId]',
  { categoryId: 'cat_123' }
);
```

Available functions: `count()`, `length()`, `lower()`, `upper()`, `defined()`, `coalesce()`, `math::sum()`, `math::avg()`, `array::unique()`, and more.

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
| 001 | CMS Core | CRUD, media, auth, schemas, REST API, CLI | ✅ Implemented |
| 002 | Query Language | HQL (HOOPERITS Query Language) inspired by GROQ | ✅ Implemented |
| 003 | Document States | Draft/published states with preview & scheduling | ✅ Implemented |
| 004 | Document Versioning | Full history with diff, rollback & retention | ✅ Implemented |
| 005 | Rich Text | Portable Text format for structured rich content | ✅ Implemented |
| 006 | Real-time Sync | WebSocket sync for real-time updates | ✅ Implemented |

#### Phase B: Admin UI Enhancement

| Spec | Name | Description | Status |
|------|------|-------------|--------|
| 007 | Advanced Schema Features | Conditional fields, cross-validation, groups/tabs | 🔲 Planned |
| 008 | Advanced Media Library | Folders, tags, search, image editing, focal point | 🔲 Planned |
| 009 | Collaboration Features | Comments, tasks, mentions, activity feeds | 🔲 Planned |
| 010 | Real-time Collaboration | Simultaneous editing with presence & conflict resolution | 🔲 Planned |
| 011 | Content Releases | Bundled changes for atomic scheduled publishing | 🔲 Planned |

#### Phase C: Advanced Features

| Spec | Name | Description | Status |
|------|------|-------------|--------|
| 012 | Internationalization | Multi-language support at document and field level | 🔲 Planned |
| 013 | Webhooks & Events | Webhook system for external integrations | 🔲 Planned |
| 014 | Search & Indexing | Full-text search with PostgreSQL, facets & highlights | 🔲 Planned |
| 015 | AI Assist | Configurable AI assistance (OpenAI, local LLM) | 🔲 Planned |
| 016 | Workflows & Approvals | Configurable approval flows with states and roles | 🔲 Planned |

#### Phase D: Developer Experience

| Spec | Name | Description | Status |
|------|------|-------------|--------|
| 017 | Plugin System | Extensible architecture for inputs, tools & widgets | 🔲 Planned |
| 018 | Studio Customization | Themes, branding, navigation & custom layouts | 🔲 Planned |
| 019 | GraphQL API | Auto-generated GraphQL API as REST/HQL alternative | 🔲 Planned |
| 020 | CLI Enhancements | Query, export, import, backup, doctor commands | 🔲 Planned |
| 021 | SDK Enhancements | Cache, React hooks, optimistic updates, offline support | 🔲 Planned |

#### Phase E: Enterprise Features

| Spec | Name | Description | Status |
|------|------|-------------|--------|
| 022 | Multi-tenancy | Multiple isolated datasets in one installation | 🔲 Planned |
| 023 | Advanced Permissions | ABAC, document/field permissions, custom roles | 🔲 Planned |
| 024 | Analytics Dashboard | Content metrics, editor activity, API usage | 🔲 Planned |
| 025 | Audit Logging | Complete logging for compliance (HIPAA, SOC2) | 🔲 Planned |
| 026 | Performance & Caching | Advanced caching with tags, invalidation & CDN helpers | 🔲 Planned |
| 027 | Backup & Restore | Automated backups, point-in-time recovery, DR | 🔲 Planned |

**Legend**: ✅ Implemented | 🚧 In Progress | 🔲 Planned

## Documentation

- [Quickstart](docs/quickstart.md) - Getting started guide
- [Schema Definition](docs/schemas.md) - How to define content types
- [API Reference](docs/api.md) - Complete API reference

## Project Structure

```
hooperits-cms/
├── packages/
│   ├── core/                      # @hooperits/cms - Core library
│   │   └── src/
│   │       ├── schema/           # Schema definition and validation
│   │       ├── auth/             # Authentication and permissions
│   │       ├── content/          # Content CRUD operations
│   │       ├── media/            # Media handling and optimization
│   │       ├── hql/              # HQL query language (parser, executor)
│   │       └── api/              # HTTP handlers
│   ├── admin/                     # @hooperits/admin - Admin UI
│   │   └── src/
│   │       ├── app/              # Next.js App Router pages
│   │       └── components/       # React components
│   ├── client/                    # @hooperits/client - Frontend SDK
│   │   └── src/                  # Client and React hooks
│   └── cli/                       # @hooperits/cli - CLI tools
│       └── src/commands/         # init, migrate, generate, create-admin
├── prisma/                        # Database schema
├── assets/                        # Static assets
└── docs/                          # Documentation
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
  <a href="LICENSE"><img src="https://img.shields.io/badge/licencia-AGPL--3.0-blue.svg" alt="Licencia: AGPL-3.0" /></a>
  <img src="https://img.shields.io/badge/versión-1.0.0-green.svg" alt="Versión: 1.0.0" />
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node: >=18.0.0" />
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
| 100% Self-hosted | ✅ Implementado | Sin dependencias de servicios externos |
| Schema-driven | ✅ Implementado | Define tipos de contenido en TypeScript |
| Admin UI automático | ✅ Implementado | Panel generado desde schemas |
| Type-safe SDK | ✅ Implementado | Cliente con tipos TypeScript |
| HQL Query Language | ✅ Implementado | Lenguaje de consulta inspirado en GROQ |
| Document States | ✅ Implementado | Flujo borrador/publicado con preview, programación y archivo |
| Image optimization | ✅ Implementado | Optimización automática con Sharp |
| Autenticación RBAC | ✅ Implementado | Control de acceso por roles (Admin/Editor/Viewer) |
| CLI Tools | ✅ Implementado | Comandos init, migrate, generate, create-admin |
| Rich Text Editor | ✅ Implementado | Formato Portable Text para contenido estructurado |

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

### Consultas con HQL

HOOPERITS CMS incluye HQL (HOOPERITS Query Language), un lenguaje de consulta inspirado en GROQ para obtener contenido de forma flexible:

```typescript
// Consulta básica
const posts = await cms.query('*[_type == "post"]');

// Con filtros y proyección
const activeServices = await cms.query(
  '*[_type == "service" && active == true]{title, slug, price}'
);

// Con ordenamiento y paginación
const recentPosts = await cms.query(
  '*[_type == "post"] | order(publishedAt desc)[0..9]'
);

// Con resolución de referencias
const postsWithAuthor = await cms.query(
  '*[_type == "post"]{title, author->{name, avatar}}'
);

// Con parámetros (seguro contra SQL injection)
const categoryPosts = await cms.query(
  '*[_type == "post" && category._ref == $categoryId]',
  { categoryId: 'cat_123' }
);
```

Funciones disponibles: `count()`, `length()`, `lower()`, `upper()`, `defined()`, `coalesce()`, `math::sum()`, `math::avg()`, `array::unique()`, y más.

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
| 001 | CMS Core | CRUD, media, auth, schemas, REST API, CLI | ✅ Implementado |
| 002 | Query Language | HQL (HOOPERITS Query Language) inspirado en GROQ | ✅ Implementado |
| 003 | Document States | Estados draft/published con preview y programación | ✅ Implementado |
| 004 | Document Versioning | Historial completo con diff, rollback y retención | ✅ Implementado |
| 005 | Rich Text | Formato Portable Text para contenido estructurado | ✅ Implementado |
| 006 | Real-time Sync | Sincronización WebSocket en tiempo real | ✅ Implementado |

#### Fase B: Mejoras de Admin UI

| Spec | Nombre | Descripción | Estado |
|------|--------|-------------|--------|
| 007 | Advanced Schema Features | Campos condicionales, validación cruzada, grupos/tabs | 🔲 Planificado |
| 008 | Advanced Media Library | Carpetas, tags, búsqueda, edición de imágenes, focal point | 🔲 Planificado |
| 009 | Collaboration Features | Comentarios, tareas, menciones, activity feeds | 🔲 Planificado |
| 010 | Real-time Collaboration | Edición simultánea con presencia y resolución de conflictos | 🔲 Planificado |
| 011 | Content Releases | Bundles de cambios para publicación atómica programada | 🔲 Planificado |

#### Fase C: Features Avanzados

| Spec | Nombre | Descripción | Estado |
|------|--------|-------------|--------|
| 012 | Internationalization | Soporte multi-idioma a nivel documento y campo | 🔲 Planificado |
| 013 | Webhooks & Events | Sistema de webhooks para integraciones externas | 🔲 Planificado |
| 014 | Search & Indexing | Búsqueda full-text con PostgreSQL, facetas y highlights | 🔲 Planificado |
| 015 | AI Assist | Asistencia IA configurable (OpenAI, LLM local) | 🔲 Planificado |
| 016 | Workflows & Approvals | Flujos de aprobación configurables con estados y roles | 🔲 Planificado |

#### Fase D: Experiencia de Desarrollador

| Spec | Nombre | Descripción | Estado |
|------|--------|-------------|--------|
| 017 | Plugin System | Arquitectura extensible para inputs, tools y widgets | 🔲 Planificado |
| 018 | Studio Customization | Temas, branding, navegación y layouts personalizables | 🔲 Planificado |
| 019 | GraphQL API | API GraphQL auto-generada como alternativa a REST/HQL | 🔲 Planificado |
| 020 | CLI Enhancements | Comandos: query, export, import, backup, doctor | 🔲 Planificado |
| 021 | SDK Enhancements | Caché, React hooks, optimistic updates, soporte offline | 🔲 Planificado |

#### Fase E: Features Enterprise

| Spec | Nombre | Descripción | Estado |
|------|--------|-------------|--------|
| 022 | Multi-tenancy | Múltiples datasets aislados en una instalación | 🔲 Planificado |
| 023 | Advanced Permissions | ABAC, permisos por documento/campo, roles custom | 🔲 Planificado |
| 024 | Analytics Dashboard | Métricas de contenido, actividad de editores, uso de API | 🔲 Planificado |
| 025 | Audit Logging | Logging completo para compliance (HIPAA, SOC2) | 🔲 Planificado |
| 026 | Performance & Caching | Caché avanzado con tags, invalidación y CDN helpers | 🔲 Planificado |
| 027 | Backup & Restore | Backups automáticos, point-in-time recovery, DR | 🔲 Planificado |

**Leyenda**: ✅ Implementado | 🚧 En Progreso | 🔲 Planificado

## Documentación

- [Quickstart](docs/quickstart.md) - Guía de inicio rápido
- [Definición de Schemas](docs/schemas.md) - Cómo definir tipos de contenido
- [API Reference](docs/api.md) - Referencia completa de la API

## Estructura del Proyecto

```
hooperits-cms/
├── packages/
│   ├── core/                      # @hooperits/cms - Librería core
│   │   └── src/
│   │       ├── schema/           # Definición y validación de schemas
│   │       ├── auth/             # Autenticación y permisos
│   │       ├── content/          # Operaciones CRUD de contenido
│   │       ├── media/            # Manejo y optimización de media
│   │       ├── hql/              # Lenguaje de consulta HQL (parser, executor)
│   │       └── api/              # HTTP handlers
│   ├── admin/                     # @hooperits/admin - Admin UI
│   │   └── src/
│   │       ├── app/              # Páginas Next.js App Router
│   │       └── components/       # Componentes React
│   ├── client/                    # @hooperits/client - SDK para frontend
│   │   └── src/                  # Cliente y React hooks
│   └── cli/                       # @hooperits/cli - CLI tools
│       └── src/commands/         # init, migrate, generate, create-admin
├── prisma/                        # Schema de base de datos
├── assets/                        # Assets estáticos
└── docs/                          # Documentación
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
