# Feature Specification: SDK Enhancements

**Feature Branch**: `021-sdk-enhancements`
**Created**: 2026-01-29
**Status**: Draft
**Dependencies**: 001-cms-core, 002-query-language, 006-real-time-sync
**Complexity**: L

---

## Executive Summary

Mejorar el SDK del cliente con funcionalidades avanzadas: caché inteligente, React hooks, optimistic updates, soporte offline, y mejor integración con frameworks como Next.js. Esto eleva la experiencia del desarrollador frontend al usar contenido del CMS.

---

## User Scenarios & Testing

### User Story 1 - Intelligent Caching (Priority: P1)

El SDK cachea respuestas automáticamente y las invalida inteligentemente.

**Why this priority**: Caché reduce latencia y carga en el servidor significativamente.

**Independent Test**: Hacer misma query dos veces, segunda es instantánea desde caché.

**Acceptance Scenarios**:

1. **Given** query ejecutada, **When** la repito, **Then** usa caché local
2. **Given** documento cacheado, **When** se actualiza en CMS, **Then** caché se invalida (vía realtime)
3. **Given** caché lleno, **When** excede límite, **Then** evicta entradas menos usadas (LRU)
4. **Given** caché, **When** paso `{cache: false}`, **Then** bypassa el caché

---

### User Story 2 - React Hooks (Priority: P1)

El SDK provee hooks de React para consumir contenido de forma declarativa.

**Why this priority**: Hooks son el patrón estándar en React para data fetching.

**Independent Test**: Usar `useDocument(id)` y ver que retorna documento con loading/error states.

**Acceptance Scenarios**:

1. **Given** `useDocument(id)`, **When** se monta, **Then** retorna `{data, loading, error}`
2. **Given** `useQuery(hql)`, **When** cambia el hql, **Then** re-fetch automático
3. **Given** hook con realtime, **When** documento cambia, **Then** hook se actualiza
4. **Given** error de red, **When** ocurre, **Then** hook retorna error manejable

---

### User Story 3 - Optimistic Updates (Priority: P2)

El SDK soporta actualizaciones optimistas para UX instantánea.

**Why this priority**: Optimistic updates hacen la UI sentir más responsiva.

**Independent Test**: Actualizar documento, ver cambio inmediato, luego confirmación del server.

**Acceptance Scenarios**:

1. **Given** mutación con optimistic, **When** ejecuto, **Then** UI se actualiza inmediatamente
2. **Given** mutación exitosa, **When** server confirma, **Then** estado optimista se confirma
3. **Given** mutación fallida, **When** server rechaza, **Then** se revierte al estado anterior
4. **Given** rollback, **When** ocurre, **Then** se notifica al usuario del error

---

### User Story 4 - Offline Support (Priority: P2)

El SDK funciona offline y sincroniza cuando recupera conexión.

**Why this priority**: Offline support es crítico para apps móviles y conexiones inestables.

**Independent Test**: Desconectar, hacer queries (desde caché), editar, reconectar, ver sync.

**Acceptance Scenarios**:

1. **Given** sin conexión, **When** hago query, **Then** usa datos cacheados
2. **Given** sin conexión, **When** hago mutación, **Then** se encola para sync
3. **Given** conexión restaurada, **When** reconecto, **Then** mutaciones pendientes se ejecutan
4. **Given** conflicto en sync, **When** ocurre, **Then** se reporta con opciones de resolución

---

### User Story 5 - Next.js Integration (Priority: P1)

El SDK se integra perfectamente con Next.js (SSR, ISR, App Router).

**Why this priority**: Next.js es el framework recomendado por HOOPERITS.

**Independent Test**: Usar SDK en getStaticProps con ISR y ver revalidación funcionando.

**Acceptance Scenarios**:

1. **Given** getStaticProps, **When** uso SDK, **Then** funciona server-side
2. **Given** ISR configurado, **When** contenido cambia, **Then** revalida automáticamente
3. **Given** App Router, **When** uso SDK en Server Component, **Then** funciona correctamente
4. **Given** preview mode, **When** activo, **Then** SDK retorna drafts

---

### User Story 6 - Type Safety (Priority: P1)

El SDK provee tipos TypeScript generados desde schemas para type safety completa.

**Why this priority**: Type safety reduce bugs y mejora DX significativamente.

**Independent Test**: Importar tipos generados, tener autocompletado de campos en IDE.

**Acceptance Scenarios**:

1. **Given** schemas de CMS, **When** genero tipos, **Then** cada tipo de documento tiene su interface
2. **Given** tipos generados, **When** escribo query, **Then** resultado está typed
3. **Given** campo inexistente, **When** accedo, **Then** TypeScript da error
4. **Given** actualización de schema, **When** regenero tipos, **Then** se actualizan correctamente

---

### Edge Cases

- ¿Qué pasa con mutaciones offline que fallan al sync? Cola de reintentos, notificación al usuario
- ¿Qué pasa si caché tiene versión muy vieja? TTL configurable, revalidación en background
- ¿Qué pasa con queries muy grandes? Streaming de resultados, paginación automática
- ¿Qué pasa con múltiples tabs? Sincronización de caché entre tabs (BroadcastChannel)

---

## Requirements

### Functional Requirements

**Caching:**
- **FR-001**: SDK DEBE cachear respuestas de queries por defecto
- **FR-002**: SDK DEBE invalidar caché cuando documentos cambian (vía realtime)
- **FR-003**: SDK DEBE soportar cache policies: cache-first, network-first, cache-only
- **FR-004**: SDK DEBE implementar LRU eviction con límite configurable
- **FR-005**: SDK DEBE persistir caché en localStorage/IndexedDB (configurable)

**React Hooks:**
- **FR-006**: SDK DEBE proveer `useDocument(id)` para documento único
- **FR-007**: SDK DEBE proveer `useQuery(hql, params)` para queries HQL
- **FR-008**: SDK DEBE proveer `useSubscription(hql)` para real-time updates
- **FR-009**: Hooks DEBEN retornar `{data, loading, error, refetch}`
- **FR-010**: Hooks DEBEN deduplicar requests idénticos

**Optimistic Updates:**
- **FR-011**: SDK DEBE soportar `optimisticResponse` en mutaciones
- **FR-012**: SDK DEBE actualizar caché inmediatamente con respuesta optimista
- **FR-013**: SDK DEBE revertir si mutación falla
- **FR-014**: SDK DEBE proveer callbacks `onSuccess`, `onError`, `onSettled`

**Offline:**
- **FR-015**: SDK DEBE detectar estado de conexión
- **FR-016**: SDK DEBE servir queries desde caché cuando offline
- **FR-017**: SDK DEBE encolar mutaciones cuando offline
- **FR-018**: SDK DEBE sincronizar mutaciones al reconectar
- **FR-019**: SDK DEBE manejar conflictos de sincronización

**Next.js:**
- **FR-020**: SDK DEBE funcionar en Server Components y Client Components
- **FR-021**: SDK DEBE soportar preview mode de Next.js
- **FR-022**: SDK DEBE soportar on-demand revalidation para ISR
- **FR-023**: SDK DEBE proveer handler de revalidación para webhooks

**Types:**
- **FR-024**: SDK DEBE generar tipos TypeScript desde schemas
- **FR-025**: SDK DEBE inferir tipos de retorno de queries
- **FR-026**: CLI DEBE incluir comando para generar tipos

### Key Entities

- **CMSClient**: Cliente principal con configuración y métodos
- **CacheStore**: Store de caché con políticas de eviction
- **QueryResult**: Resultado de query con metadata y tipos
- **MutationState**: Estado de mutación (pending, success, error)

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Queries cacheadas responden en <10ms
- **SC-002**: Hooks re-renderizan en <50ms cuando datos cambian
- **SC-003**: Optimistic updates reflejan en UI en <16ms (1 frame)
- **SC-004**: Sync de mutaciones offline completa en <5 segundos al reconectar
- **SC-005**: Tipos generados tienen 100% de cobertura de schemas
- **SC-006**: Bundle size del SDK <50KB gzipped

---

## Technical Notes

### Client Usage

```typescript
import { createCMSClient } from '@hooperits/cms/client';
import type { Post, Author } from './cms-types';

// Crear cliente
const cms = createCMSClient({
  apiUrl: process.env.CMS_API_URL,
  token: process.env.CMS_TOKEN,
  cache: {
    strategy: 'cache-first',
    maxSize: 100, // MB
    persist: true, // localStorage
  },
  realtime: true, // Habilitar sync en tiempo real
});

// Query con tipos
const posts = await cms.query<Post[]>(`*[_type == "post"]`);

// Documento por ID
const post = await cms.getDocument<Post>('post-123');

// Mutación con optimistic
await cms.update<Post>('post-123',
  { title: 'Updated Title' },
  {
    optimisticResponse: (current) => ({
      ...current,
      title: 'Updated Title',
    }),
  }
);
```

### React Hooks

```typescript
import { useDocument, useQuery, useMutation } from '@hooperits/cms/react';
import type { Post } from './cms-types';

function PostDetail({ id }: { id: string }) {
  const { data: post, loading, error } = useDocument<Post>(id);

  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return <article>{post.title}</article>;
}

function PostList() {
  const { data: posts, loading } = useQuery<Post[]>(
    `*[_type == "post"] | order(publishedAt desc)[0..9]`
  );

  return (
    <ul>
      {posts?.map(post => (
        <li key={post._id}>{post.title}</li>
      ))}
    </ul>
  );
}

function EditPost({ post }: { post: Post }) {
  const [updatePost, { loading }] = useMutation(
    (data: Partial<Post>) => cms.update(post._id, data),
    {
      optimisticResponse: (data) => ({ ...post, ...data }),
      onSuccess: () => toast.success('Saved!'),
      onError: (err) => toast.error(err.message),
    }
  );

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      updatePost({ title: e.target.title.value });
    }}>
      <input name="title" defaultValue={post.title} />
      <button disabled={loading}>Save</button>
    </form>
  );
}
```

### Next.js Integration

```typescript
// app/posts/[slug]/page.tsx (App Router)
import { cms } from '@/lib/cms';
import type { Post } from '@/cms-types';

// Server Component - fetches at build/request time
export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await cms.query<Post>(
    `*[_type == "post" && slug.current == $slug][0]`,
    { slug: params.slug }
  );

  return <article>{post.content}</article>;
}

// Generate static params
export async function generateStaticParams() {
  const posts = await cms.query<Post[]>(`*[_type == "post"]{slug}`);
  return posts.map((post) => ({ slug: post.slug.current }));
}

// ISR revalidation
export const revalidate = 60; // Revalidate every 60 seconds
```

```typescript
// pages/api/revalidate.ts (Webhook handler)
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificar webhook signature
  if (!verifyWebhookSignature(req)) {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  const { documentId, type } = req.body;

  // Revalidar paths afectados
  if (type === 'post') {
    await res.revalidate(`/posts/${documentId}`);
    await res.revalidate('/posts');
  }

  return res.json({ revalidated: true });
}
```

### Type Generation

```bash
# Generar tipos desde schemas
cms types generate --output ./src/cms-types.ts
```

```typescript
// Generated cms-types.ts
export interface Post {
  _id: string;
  _type: 'post';
  _createdAt: string;
  _updatedAt: string;
  title: string;
  slug: { current: string };
  content: PortableTextBlock[];
  author: Reference<Author>;
  categories: Reference<Category>[];
  publishedAt: string | null;
  status: 'draft' | 'published';
}

export interface Author {
  _id: string;
  _type: 'author';
  name: string;
  email: string;
  bio?: string;
  avatar?: ImageAsset;
}

// Type helper for queries
export type QueryResult<T> = T extends Array<infer U> ? U[] : T;
```

### Offline Queue

```typescript
interface OfflineQueue {
  mutations: QueuedMutation[];
  add(mutation: QueuedMutation): void;
  process(): Promise<SyncResult>;
  clear(): void;
}

interface QueuedMutation {
  id: string;
  type: 'create' | 'update' | 'delete';
  documentId?: string;
  data: unknown;
  timestamp: Date;
  retries: number;
}

interface SyncResult {
  success: QueuedMutation[];
  failed: { mutation: QueuedMutation; error: Error }[];
  conflicts: { mutation: QueuedMutation; serverVersion: unknown }[];
}
```

---

## Out of Scope (This Spec)

- Vue/Svelte bindings
- GraphQL client integration (Apollo, urql)
- Service Worker implementation
- E2E encryption
