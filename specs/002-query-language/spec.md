# Feature Specification: HQL - HOOPERITS Query Language

**Feature Branch**: `002-query-language`
**Created**: 2026-01-29
**Status**: Draft
**Dependencies**: 001-cms-core
**Complexity**: XL

---

## Executive Summary

Implementar HQL (HOOPERITS Query Language), un lenguaje de consulta inspirado en GROQ de Sanity, que permita queries expresivas y type-safe sobre el contenido del CMS. HQL será la forma principal de consultar datos desde el frontend, ofreciendo una alternativa más potente y flexible que REST endpoints básicos.

---

## User Scenarios & Testing

### User Story 1 - Basic Content Queries (Priority: P1)

El desarrollador frontend puede consultar contenido usando una sintaxis expresiva similar a GROQ, filtrando y proyectando campos específicos.

**Why this priority**: Sin queries básicas no hay forma de obtener contenido del CMS de manera flexible.

**Independent Test**: Ejecutar una query HQL que filtre servicios por categoría y retorne solo título e imagen.

**Acceptance Scenarios**:

1. **Given** contenido de tipo "service" en el CMS, **When** ejecuto `*[_type == "service"]`, **Then** retorna todos los servicios
2. **Given** servicios con campo "active", **When** ejecuto `*[_type == "service" && active == true]`, **Then** retorna solo servicios activos
3. **Given** una query con proyección, **When** ejecuto `*[_type == "service"]{title, slug}`, **Then** retorna solo esos campos

---

### User Story 2 - References & Joins (Priority: P1)

El desarrollador puede resolver referencias entre documentos en una sola query, evitando múltiples llamadas al API.

**Why this priority**: El contenido relacionado es fundamental para sitios reales (ej: productos con categorías).

**Independent Test**: Query que retorne servicios con sus especialistas relacionados expandidos.

**Acceptance Scenarios**:

1. **Given** servicios con referencia a especialistas, **When** ejecuto `*[_type == "service"]{..., specialists[]->}`, **Then** retorna servicios con especialistas expandidos
2. **Given** referencias anidadas, **When** ejecuto `*[_type == "post"]{..., author->{name, avatar}}`, **Then** retorna posts con datos del autor proyectados
3. **Given** referencias múltiples, **When** uso el operador `->`, **Then** se resuelven todas sin N+1 queries

---

### User Story 3 - Ordering & Pagination (Priority: P1)

El desarrollador puede ordenar y paginar resultados para implementar listados y feeds.

**Why this priority**: Todo listado de contenido requiere ordenamiento y paginación.

**Independent Test**: Query que retorne los 10 posts más recientes ordenados por fecha.

**Acceptance Scenarios**:

1. **Given** múltiples posts, **When** ejecuto `*[_type == "post"] | order(publishedAt desc)`, **Then** retorna posts ordenados por fecha descendente
2. **Given** 100 posts, **When** ejecuto `*[_type == "post"][0..9]`, **Then** retorna los primeros 10
3. **Given** paginación, **When** ejecuto `*[_type == "post"][10..19]`, **Then** retorna el segundo "page" de 10 elementos

---

### User Story 4 - Functions & Operators (Priority: P2)

El desarrollador tiene acceso a funciones y operadores para transformar y filtrar datos en la query.

**Why this priority**: Operaciones comunes como count, búsqueda, y transformaciones mejoran la DX.

**Independent Test**: Query que cuente documentos y filtre por texto parcial.

**Acceptance Scenarios**:

1. **Given** múltiples posts, **When** ejecuto `count(*[_type == "post"])`, **Then** retorna el número total
2. **Given** posts con títulos, **When** ejecuto `*[_type == "post" && title match "Next*"]`, **Then** retorna posts cuyo título comienza con "Next"
3. **Given** arrays en documentos, **When** uso `length(tags)`, **Then** retorna la cantidad de elementos
4. **Given** strings, **When** uso `lower(title)`, **Then** convierte a minúsculas

---

### User Story 5 - API Integration (Priority: P1)

Las queries HQL se ejecutan via API REST con soporte para caché y type-safety.

**Why this priority**: La query language debe integrarse con el sistema de API existente.

**Independent Test**: Llamar al endpoint `/api/hql` con una query y recibir resultados JSON.

**Acceptance Scenarios**:

1. **Given** una query HQL válida, **When** POST a `/api/hql` con body `{query: "..."}`, **Then** retorna resultados JSON
2. **Given** una query con parámetros, **When** paso `{query: "...", params: {id: "..."}}`, **Then** los parámetros se sustituyen de forma segura
3. **Given** caching habilitado, **When** ejecuto la misma query dos veces, **Then** la segunda usa caché
4. **Given** el cliente SDK, **When** uso `cms.query(...)`, **Then** tengo autocompletado de tipos

---

### User Story 6 - Error Handling (Priority: P2)

El sistema provee errores claros y útiles cuando una query es inválida.

**Why this priority**: Debugging de queries es crítico para productividad del desarrollador.

**Independent Test**: Ejecutar una query con sintaxis inválida y recibir error descriptivo.

**Acceptance Scenarios**:

1. **Given** una query con sintaxis inválida, **When** la ejecuto, **Then** recibo error con línea y columna del problema
2. **Given** una referencia a tipo inexistente, **When** la ejecuto, **Then** recibo warning (no error) indicando el problema
3. **Given** una query válida pero sin resultados, **When** la ejecuto, **Then** retorna array vacío (no error)

---

### Edge Cases

- ¿Qué pasa con queries muy complejas que podrían ser lentas? Timeout configurable + query cost estimation
- ¿Qué pasa si se pide un campo que no existe en el schema? Se ignora silenciosamente o warning
- ¿Cómo manejar referencias a documentos eliminados? Retornar null con metadata de referencia rota
- ¿Qué pasa con queries infinitamente recursivas? Límite de profundidad configurable (default: 5)

---

## Requirements

### Functional Requirements

**Query Language Core:**
- **FR-001**: Sistema DEBE implementar parser de HQL con sintaxis compatible con GROQ básico
- **FR-002**: Sistema DEBE soportar filtros con operadores: `==`, `!=`, `>`, `<`, `>=`, `<=`, `&&`, `||`, `!`
- **FR-003**: Sistema DEBE soportar proyecciones `{field1, field2}` para seleccionar campos específicos
- **FR-004**: Sistema DEBE soportar spread operator `{...}` para todos los campos
- **FR-005**: Sistema DEBE soportar slicing `[0..9]` para paginación

**References:**
- **FR-006**: Sistema DEBE soportar operador `->` para resolver referencias
- **FR-007**: Sistema DEBE resolver referencias sin causar N+1 queries (batching)
- **FR-008**: Sistema DEBE soportar referencias anidadas con proyección `author->{name}`

**Ordering:**
- **FR-009**: Sistema DEBE soportar `| order(field asc/desc)` para ordenamiento
- **FR-010**: Sistema DEBE soportar ordenamiento por múltiples campos

**Functions:**
- **FR-011**: Sistema DEBE implementar `count()` para contar resultados
- **FR-012**: Sistema DEBE implementar `length()` para arrays y strings
- **FR-013**: Sistema DEBE implementar `lower()` y `upper()` para strings
- **FR-014**: Sistema DEBE implementar `match` para pattern matching básico
- **FR-015**: Sistema DEBE implementar `defined()` para verificar existencia de campo
- **FR-016**: Sistema DEBE implementar `coalesce()` para valores por defecto

**API Integration:**
- **FR-017**: Sistema DEBE exponer endpoint `POST /api/hql` para ejecutar queries
- **FR-018**: Sistema DEBE soportar parámetros en queries `$param` para prevenir injection
- **FR-019**: Sistema DEBE cachear resultados de queries (configurable)
- **FR-020**: Sistema DEBE limitar complejidad/costo de queries (configurable)

**Type Safety:**
- **FR-021**: Cliente SDK DEBE proveer tipos TypeScript para resultados de queries conocidas
- **FR-022**: Sistema DEBE validar que campos en queries existan en schemas

### Key Entities

- **HQLQuery**: String de query parseada y validada
- **HQLResult**: Resultado de ejecutar una query (array de documentos o valor escalar)
- **HQLParams**: Parámetros para sustituir en la query
- **QueryCost**: Estimación de costo computacional de una query

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Queries simples (`*[_type == "x"]`) ejecutan en <50ms
- **SC-002**: Queries con 1 nivel de referencias ejecutan en <100ms
- **SC-003**: Parser de HQL cubre 80% de funcionalidad de GROQ básico
- **SC-004**: Mensajes de error incluyen posición exacta del problema
- **SC-005**: SDK genera tipos correctos para proyecciones específicas
- **SC-006**: No hay SQL injection posible via HQL (queries parametrizadas)

---

## Technical Notes

### HQL Syntax Examples

```hql
// Todos los posts
*[_type == "post"]

// Posts publicados ordenados por fecha
*[_type == "post" && status == "published"] | order(publishedAt desc)

// Primeros 10 posts con autor expandido
*[_type == "post"][0..9]{
  title,
  slug,
  publishedAt,
  author->{name, avatar}
}

// Contar posts por categoría
count(*[_type == "post" && category == $categoryId])

// Búsqueda por texto
*[_type == "post" && title match $searchTerm + "*"]
```

### Implementation Approach

1. Parser usando biblioteca como `nearley` o `chevrotain`
2. AST (Abstract Syntax Tree) intermedio
3. Transpilación a Prisma queries o SQL directo
4. Batching de referencias para evitar N+1
5. Query cost calculation antes de ejecutar

---

## Out of Scope (This Spec)

- GraphQL-style subscriptions (ver spec 006)
- Full-text search avanzado (ver spec 014)
- Aggregations complejas (GROUP BY, etc.)
- Mutations via HQL (solo lectura)
