<p align="center">
  <h1 align="center">HOOPERITS CMS</h1>
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

| Feature | Status | Target Version |
|---------|--------|----------------|
| Core CMS Engine | 🚧 In Progress | v0.1.0 |
| Schema Definition API | 🔲 Planned | v0.1.0 |
| Admin UI Generation | 🔲 Planned | v0.2.0 |
| Client SDK | 🔲 Planned | v0.2.0 |
| Image Optimization | 🔲 Planned | v0.3.0 |
| Webhooks | 🔲 Planned | v0.4.0 |
| Multi-language Support | 🔲 Planned | v0.5.0 |

See [specs/](specs/) for detailed feature specifications.

## Documentation

- [Quickstart](docs/quickstart.md) - Getting started guide
- [Schema Definition](docs/schemas.md) - How to define content types
- [API Reference](docs/api.md) - Complete API reference

## Project Structure

```
hooperits-cms/
├── specs/                 # Feature specifications
│   └── 001-cms-core/     # Core CMS spec
├── docs/                  # Documentation
├── .specify/              # Speckit templates and scripts
└── .claude/               # Commands and agents
```

## Contributing

This is a proprietary project of HOOPER IT SERVICES. To contribute, contact the development team.

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

See [LICENSE](LICENSE) for the full license text.

Copyright (c) 2026 HOOPER IT SERVICES

---

<h1 id="español" align="center">HOOPERITS CMS</h1>

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

| Feature | Estado | Versión Target |
|---------|--------|----------------|
| Core CMS Engine | 🚧 En Progreso | v0.1.0 |
| Schema Definition API | 🔲 Planificado | v0.1.0 |
| Admin UI Generation | 🔲 Planificado | v0.2.0 |
| Client SDK | 🔲 Planificado | v0.2.0 |
| Image Optimization | 🔲 Planificado | v0.3.0 |
| Webhooks | 🔲 Planificado | v0.4.0 |
| Multi-language Support | 🔲 Planificado | v0.5.0 |

Ver [specs/](specs/) para especificaciones detalladas de cada feature.

## Documentación

- [Quickstart](docs/quickstart.md) - Guía de inicio rápido
- [Definición de Schemas](docs/schemas.md) - Cómo definir tipos de contenido
- [API Reference](docs/api.md) - Referencia completa de la API

## Estructura del Proyecto

```
hooperits-cms/
├── specs/                 # Especificaciones de features
│   └── 001-cms-core/     # Spec del core del CMS
├── docs/                  # Documentación
├── .specify/              # Templates y scripts de speckit
└── .claude/               # Comandos y agentes
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
