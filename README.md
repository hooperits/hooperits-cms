# HOOPERITS CMS

Sistema de gestión de contenido headless, 100% self-hosted, desarrollado por HOOPER IT SERVICES.

## Características

- **100% Self-hosted**: Sin dependencias de servicios externos
- **Schema-driven**: Define tus tipos de contenido en TypeScript
- **Admin UI automático**: Panel de administración generado desde schemas
- **Type-safe**: SDK con tipos TypeScript para tu frontend
- **PostgreSQL**: Base de datos robusta y probada

## Quick Start

```bash
# En tu proyecto Next.js
npx @hooperits/cms init

# Configurar base de datos en .env
DATABASE_URL="postgresql://..."

# Ejecutar migraciones
npm run cms:migrate

# Iniciar desarrollo
npm run dev
```

Accede al admin en `http://localhost:3000/admin`

## Definir Schemas

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
  },
});
```

## Consumir en Frontend

```typescript
import { createCMSClient } from '@hooperits/cms/client';

const cms = createCMSClient({ apiUrl: '/api/cms' });

const products = await cms.content.getAll('product');
```

## Stack

- Next.js 14 (App Router)
- PostgreSQL + Prisma
- NextAuth.js (credentials)
- React + Tailwind CSS

## Documentación

- [Quickstart](docs/quickstart.md)
- [Definición de Schemas](docs/schemas.md)
- [API Reference](docs/api.md)

## Licencia

Propietario - HOOPER IT SERVICES

---

Desarrollado por [HOOPERITS](https://www.hooperits.com)
