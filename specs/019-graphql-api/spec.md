# Feature Specification: GraphQL API

**Feature Branch**: `019-graphql-api`
**Created**: 2026-01-29
**Status**: Draft
**Dependencies**: 001-cms-core, 002-query-language
**Complexity**: L

---

## Executive Summary

Implementar API GraphQL auto-generada desde los schemas del CMS como alternativa a REST y HQL. GraphQL permite a los clientes frontend solicitar exactamente los datos que necesitan, con types auto-generados, introspection, y soporte para relaciones y fragmentos.

---

## User Scenarios & Testing

### User Story 1 - Schema-driven GraphQL (Priority: P1)

Los tipos GraphQL se generan automáticamente desde los schemas de contenido del CMS.

**Why this priority**: Generación automática elimina duplicación y mantiene consistencia.

**Independent Test**: Definir schema "Post" en CMS, ver tipo GraphQL generado con todos los campos.

**Acceptance Scenarios**:

1. **Given** schema de CMS definido, **When** se inicia el server, **Then** tipos GraphQL se generan automáticamente
2. **Given** schema modificado, **When** reinicio, **Then** tipos GraphQL se actualizan
3. **Given** tipos generados, **When** uso introspection, **Then** veo toda la estructura
4. **Given** referencias entre schemas, **When** genero tipos, **Then** las relaciones son resolvibles

---

### User Story 2 - Flexible Queries (Priority: P1)

El desarrollador frontend puede consultar exactamente los campos que necesita.

**Why this priority**: Eficiencia de GraphQL es no traer datos innecesarios.

**Independent Test**: Query que solo pide título y slug de posts, sin traer contenido completo.

**Acceptance Scenarios**:

1. **Given** tipo Post, **When** pido solo `{title, slug}`, **Then** respuesta contiene solo esos campos
2. **Given** tipo con relaciones, **When** pido `{author {name}}`, **Then** se resuelve la relación
3. **Given** campos anidados, **When** los pido, **Then** se traen con profundidad correcta
4. **Given** alias, **When** uso `postTitle: title`, **Then** el campo se renombra en respuesta

---

### User Story 3 - Type Safety (Priority: P1)

El desarrollador puede generar tipos TypeScript desde el schema GraphQL.

**Why this priority**: Type safety mejora DX y reduce bugs.

**Independent Test**: Generar tipos con graphql-codegen, usarlos en cliente Next.js.

**Acceptance Scenarios**:

1. **Given** schema GraphQL, **When** corro codegen, **Then** genera tipos TypeScript correctos
2. **Given** tipos generados, **When** escribo query, **Then** tengo autocompletado
3. **Given** query con campo inexistente, **When** compilo, **Then** TypeScript da error
4. **Given** mutation, **When** genero tipos, **Then** incluye tipos de input y response

---

### User Story 4 - Filtering & Pagination (Priority: P1)

Las queries soportan filtros, ordenamiento, y paginación estándar.

**Why this priority**: Listados necesitan filtros y paginación para ser útiles.

**Independent Test**: Query de posts filtrados por categoría, ordenados por fecha, con limit/offset.

**Acceptance Scenarios**:

1. **Given** lista de posts, **When** filtro `where: {category: "tech"}`, **Then** solo retorna posts de tech
2. **Given** lista, **When** ordeno `orderBy: {publishedAt: DESC}`, **Then** vienen ordenados
3. **Given** paginación, **When** uso `first: 10, skip: 20`, **Then** retorna página correcta
4. **Given** cursor pagination, **When** uso `after: cursor`, **Then** funciona correctamente

---

### User Story 5 - Mutations (Priority: P2)

Las mutations permiten crear, actualizar, y eliminar contenido (con autenticación).

**Why this priority**: CRUD completo via GraphQL permite clientes más poderosos.

**Independent Test**: Mutation que crea un post y retorna el ID generado.

**Acceptance Scenarios**:

1. **Given** mutation createPost, **When** ejecuto con data válida, **Then** crea el documento
2. **Given** mutation updatePost, **When** ejecuto con id y data, **Then** actualiza el documento
3. **Given** mutation deletePost, **When** ejecuto, **Then** elimina el documento
4. **Given** mutation sin auth, **When** ejecuto, **Then** recibo error de autenticación

---

### User Story 6 - Real-time Subscriptions (Priority: P3)

Subscriptions permiten recibir updates en tiempo real.

**Why this priority**: Subscriptions complementan el sistema de real-time (spec 006).

**Independent Test**: Subscription que recibe notificación cuando se publica un post.

**Acceptance Scenarios**:

1. **Given** subscription a posts, **When** se publica post, **Then** recibo evento
2. **Given** subscription con filtro, **When** se publica post que no cumple, **Then** no recibo evento
3. **Given** conexión WebSocket, **When** pierdo conexión, **Then** se reconecta automáticamente
4. **Given** múltiples subscriptions, **When** manejo, **Then** cada una recibe sus eventos

---

### Edge Cases

- ¿Qué pasa con queries muy profundas (depth > 10)? Límite de profundidad configurable
- ¿Qué pasa con N+1 queries en relaciones? DataLoader para batching
- ¿Qué pasa con queries muy costosas? Query complexity analysis y límites
- ¿Qué pasa con campos de Portable Text? Tipo custom PortableText o JSON escalar

---

## Requirements

### Functional Requirements

**Schema Generation:**
- **FR-001**: Sistema DEBE generar tipos GraphQL desde schemas de CMS
- **FR-002**: Sistema DEBE generar Query root con queries por tipo de documento
- **FR-003**: Sistema DEBE generar resolvers para relaciones/referencias
- **FR-004**: Sistema DEBE actualizar schema cuando schemas de CMS cambien

**Queries:**
- **FR-005**: Sistema DEBE soportar query de documento por ID
- **FR-006**: Sistema DEBE soportar query de lista con filtros
- **FR-007**: Sistema DEBE soportar ordenamiento (orderBy)
- **FR-008**: Sistema DEBE soportar paginación (first, skip, after/cursor)
- **FR-009**: Sistema DEBE soportar introspection

**Mutations:**
- **FR-010**: Sistema DEBE generar mutations CRUD para cada tipo
- **FR-011**: Sistema DEBE autenticar mutations
- **FR-012**: Sistema DEBE validar input contra schema
- **FR-013**: Sistema DEBE retornar documento creado/actualizado

**Subscriptions:**
- **FR-014**: Sistema DEBE soportar subscriptions via WebSocket
- **FR-015**: Sistema DEBE soportar filtros en subscriptions
- **FR-016**: Sistema DEBE integrar con sistema de real-time (spec 006)

**Performance:**
- **FR-017**: Sistema DEBE usar DataLoader para evitar N+1
- **FR-018**: Sistema DEBE implementar query complexity analysis
- **FR-019**: Sistema DEBE limitar profundidad de queries
- **FR-020**: Sistema DEBE cachear respuestas (opcional, configurable)

### Key Entities

- **GraphQLSchema**: Schema generado con tipos y resolvers
- **GraphQLQuery**: Query root con queries por tipo
- **GraphQLMutation**: Mutation root con operaciones CRUD
- **GraphQLSubscription**: Subscription root para real-time

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Schema GraphQL se genera en <5 segundos al iniciar
- **SC-002**: Queries simples responden en <100ms
- **SC-003**: Queries con relaciones (1 nivel) responden en <200ms
- **SC-004**: N+1 queries eliminadas al 100% usando DataLoader
- **SC-005**: Tipos TypeScript generables con graphql-codegen
- **SC-006**: 100% de campos de schemas de CMS representados en GraphQL

---

## Technical Notes

### Generated Schema Example

```graphql
# Auto-generated from CMS schemas

type Post {
  _id: ID!
  _type: String!
  _createdAt: DateTime!
  _updatedAt: DateTime!
  title: String!
  slug: String!
  content: PortableText
  excerpt: String
  author: Author
  categories: [Category!]!
  publishedAt: DateTime
  status: DocumentStatus!
}

type Author {
  _id: ID!
  name: String!
  email: String
  bio: String
  avatar: Image
}

type Query {
  # Single document
  post(id: ID!): Post
  author(id: ID!): Author

  # Lists with filtering
  allPosts(
    where: PostFilter
    orderBy: [PostOrderBy!]
    first: Int
    skip: Int
    after: String
  ): PostConnection!

  allAuthors(
    where: AuthorFilter
    orderBy: [AuthorOrderBy!]
    first: Int
    skip: Int
  ): AuthorConnection!
}

type Mutation {
  createPost(input: CreatePostInput!): Post!
  updatePost(id: ID!, input: UpdatePostInput!): Post!
  deletePost(id: ID!): Boolean!
}

type Subscription {
  postUpdated(where: PostFilter): Post!
  postCreated: Post!
  postDeleted: ID!
}

# Filter inputs
input PostFilter {
  title_contains: String
  status: DocumentStatus
  author: ID
  publishedAt_gt: DateTime
  _and: [PostFilter!]
  _or: [PostFilter!]
}

# Pagination
type PostConnection {
  edges: [PostEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PostEdge {
  node: Post!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

### Server Implementation

```typescript
import { createYoga, createSchema } from 'graphql-yoga';
import { generateGraphQLSchema } from '@hooperits/cms/graphql';
import { createDataLoaders } from '@hooperits/cms/graphql/loaders';

// Generar schema desde CMS
const schema = generateGraphQLSchema(cmsSchemas);

// Crear servidor
const yoga = createYoga({
  schema,
  context: async ({ request }) => ({
    // Auth
    user: await authenticateRequest(request),
    // DataLoaders para evitar N+1
    loaders: createDataLoaders(),
  }),
  plugins: [
    // Limitar complejidad de queries
    useQueryComplexity({
      maximumComplexity: 1000,
      estimators: [fieldExtensionsEstimator(), simpleEstimator({ defaultComplexity: 1 })],
    }),
    // Limitar profundidad
    useDepthLimit(10),
  ],
});
```

### Client Usage

```typescript
// Con graphql-request
import { GraphQLClient, gql } from 'graphql-request';

const client = new GraphQLClient('/api/graphql');

// Query
const { allPosts } = await client.request(gql`
  query RecentPosts($limit: Int!) {
    allPosts(first: $limit, orderBy: [{ publishedAt: DESC }]) {
      edges {
        node {
          _id
          title
          slug
          author {
            name
          }
        }
      }
    }
  }
`, { limit: 10 });

// Con tipos generados
import type { RecentPostsQuery } from './generated/graphql';
// allPosts está typed correctamente
```

### Portable Text Handling

```graphql
# Opción A: JSON escalar
scalar PortableText

# Opción B: Tipos estructurados
union PortableTextBlock = TextBlock | ImageBlock | CodeBlock | CustomBlock

type TextBlock {
  _type: String!
  _key: String!
  style: String
  children: [TextSpan!]!
}

type TextSpan {
  _type: String!
  text: String!
  marks: [String!]
}
```

---

## Out of Scope (This Spec)

- Federation/stitching con otros GraphQL APIs
- Persisted queries
- Automatic query batching
- GraphQL playground customization
