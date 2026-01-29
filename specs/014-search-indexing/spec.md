# Feature Specification: Search & Indexing

**Feature Branch**: `014-search-indexing`
**Created**: 2026-01-29
**Status**: Draft
**Dependencies**: 001-cms-core, 002-query-language
**Complexity**: M

---

## Executive Summary

Implementar búsqueda full-text avanzada usando capacidades nativas de PostgreSQL (tsvector, tsquery, GIN indexes). Incluye indexación automática de contenido, búsqueda con relevancia, facetas/filtros, highlighting de resultados, y sugerencias de búsqueda.

---

## User Scenarios & Testing

### User Story 1 - Full-text Search (Priority: P1)

El usuario puede buscar contenido por texto que aparece en cualquier parte del documento.

**Why this priority**: Búsqueda es funcionalidad core para encontrar contenido.

**Independent Test**: Buscar "Next.js" y encontrar posts que mencionan ese término en título o contenido.

**Acceptance Scenarios**:

1. **Given** contenido indexado, **When** busco "Next.js tutorial", **Then** encuentro documentos relevantes
2. **Given** búsqueda con múltiples palabras, **When** ejecuto, **Then** los resultados contienen todas/algunas palabras
3. **Given** término parcial, **When** busco "program", **Then** encuentra "programación", "programming"
4. **Given** búsqueda sin resultados, **When** ejecuto, **Then** sugiere términos alternativos

---

### User Story 2 - Search Relevance (Priority: P1)

Los resultados de búsqueda se ordenan por relevancia, priorizando coincidencias en campos importantes.

**Why this priority**: Resultados ordenados por relevancia mejoran la experiencia.

**Independent Test**: Buscar "react" muestra primero posts con "React" en título sobre los que solo lo mencionan en el contenido.

**Acceptance Scenarios**:

1. **Given** múltiples resultados, **When** reviso orden, **Then** los más relevantes aparecen primero
2. **Given** configuración de pesos, **When** título tiene peso 4 y contenido peso 1, **Then** título impacta más
3. **Given** documento con término en título, **When** comparo con documento que lo tiene en body, **Then** el de título rankea más alto
4. **Given** resultados, **When** muestro scores, **Then** son consistentes y explicables

---

### User Story 3 - Faceted Search (Priority: P2)

El usuario puede filtrar resultados de búsqueda por facetas (tipo, categoría, fecha, etc.).

**Why this priority**: Facetas permiten refinar búsquedas en grandes volúmenes de contenido.

**Independent Test**: Buscar "javascript" y filtrar solo por tipo "post" y categoría "tutorials".

**Acceptance Scenarios**:

1. **Given** resultados de búsqueda, **When** veo facetas, **Then** muestran conteos por tipo de documento
2. **Given** faceta seleccionada, **When** filtro por tipo "post", **Then** solo veo posts
3. **Given** múltiples facetas, **When** combino tipo + categoría, **Then** se aplican ambos filtros
4. **Given** facetas, **When** una no tiene resultados, **Then** se muestra disabled o con count 0

---

### User Story 4 - Search Highlighting (Priority: P2)

Los resultados muestran fragmentos del contenido con los términos de búsqueda resaltados.

**Why this priority**: Highlighting ayuda al usuario a entender por qué un resultado es relevante.

**Independent Test**: Buscar "PostgreSQL" y ver los términos resaltados en el snippet del resultado.

**Acceptance Scenarios**:

1. **Given** resultado de búsqueda, **When** muestro snippet, **Then** los términos buscados están resaltados
2. **Given** documento largo, **When** muestro snippet, **Then** muestra la parte más relevante (con el término)
3. **Given** múltiples términos, **When** resalto, **Then** todos los términos coincidentes se marcan
4. **Given** API response, **When** incluyo highlighting, **Then** viene con markers que frontend puede estilizar

---

### User Story 5 - Auto-indexing (Priority: P1)

El sistema indexa automáticamente el contenido cuando se crea/actualiza/publica.

**Why this priority**: Indexación automática garantiza que la búsqueda esté siempre actualizada.

**Independent Test**: Publicar post, buscarlo inmediatamente, encontrarlo en resultados.

**Acceptance Scenarios**:

1. **Given** documento publicado, **When** se guarda, **Then** se indexa automáticamente
2. **Given** documento actualizado, **When** se guarda, **Then** el índice se actualiza
3. **Given** documento eliminado, **When** busco, **Then** ya no aparece en resultados
4. **Given** documento draft, **When** busco en admin, **Then** lo encuentro; en API público no

---

### User Story 6 - Search Suggestions (Priority: P3)

El sistema sugiere términos de búsqueda mientras el usuario escribe.

**Why this priority**: Autocomplete mejora la experiencia y reduce búsquedas fallidas.

**Independent Test**: Escribir "java" y ver sugerencias "javascript", "java tutorial", etc.

**Acceptance Scenarios**:

1. **Given** campo de búsqueda, **When** escribo 3+ caracteres, **Then** aparecen sugerencias
2. **Given** sugerencias, **When** selecciono una, **Then** se ejecuta la búsqueda
3. **Given** histórico de búsquedas populares, **When** sugiero, **Then** priorizo términos frecuentes
4. **Given** sin sugerencias relevantes, **When** escribo, **Then** no muestro sugerencias vacías

---

### Edge Cases

- ¿Qué pasa con contenido en múltiples idiomas? Configurar diccionario por idioma
- ¿Qué pasa con caracteres especiales en búsqueda? Escapar correctamente, buscar literal o ignorar
- ¿Qué pasa con documentos muy grandes? Indexar primeros N caracteres o por secciones
- ¿Qué pasa con reindex masivo? Background job con progreso, sin afectar búsquedas activas

---

## Requirements

### Functional Requirements

**Full-text Search:**
- **FR-001**: Sistema DEBE implementar búsqueda full-text usando PostgreSQL tsvector
- **FR-002**: Sistema DEBE soportar búsqueda en múltiples campos (título, contenido, etc.)
- **FR-003**: Sistema DEBE soportar operadores: AND, OR, NOT, phrase search ("exact phrase")
- **FR-004**: Sistema DEBE normalizar texto (stemming, lowercase, accents)

**Relevance:**
- **FR-005**: Sistema DEBE ordenar resultados por relevancia (ts_rank)
- **FR-006**: Sistema DEBE permitir configurar pesos por campo
- **FR-007**: Sistema DEBE considerar factores adicionales (fecha, popularidad) en ranking
- **FR-008**: Sistema DEBE exponer score de relevancia en resultados

**Facets:**
- **FR-009**: Sistema DEBE generar facetas automáticas por tipo de documento
- **FR-010**: Sistema DEBE soportar facetas por campos específicos (categoría, tags, autor)
- **FR-011**: Sistema DEBE mostrar conteos precisos por faceta
- **FR-012**: Sistema DEBE permitir filtrar por múltiples facetas simultáneamente

**Highlighting:**
- **FR-013**: Sistema DEBE generar snippets con términos resaltados
- **FR-014**: Sistema DEBE usar ts_headline de PostgreSQL
- **FR-015**: Sistema DEBE permitir configurar longitud de snippet y markers

**Indexing:**
- **FR-016**: Sistema DEBE indexar documentos automáticamente al crear/actualizar
- **FR-017**: Sistema DEBE usar índices GIN para performance
- **FR-018**: Sistema DEBE soportar reindexación manual y masiva
- **FR-019**: Sistema DEBE indexar solo contenido publicado para API público

**Suggestions:**
- **FR-020**: Sistema DEBE proveer endpoint de sugerencias/autocomplete
- **FR-021**: Sistema DEBE basar sugerencias en contenido indexado y búsquedas populares
- **FR-022**: Sistema DEBE responder sugerencias en <100ms

### Key Entities

- **SearchIndex**: Configuración de índice (campos, pesos, idioma)
- **SearchResult**: Resultado de búsqueda con score, snippets, facets
- **SearchQuery**: Query parseada con términos, filtros, opciones
- **SearchSuggestion**: Sugerencia de autocompletado

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Búsquedas retornan resultados en <200ms para 100K documentos
- **SC-002**: Indexación de documento individual <100ms
- **SC-003**: Reindex masivo procesa 10K documentos en <5 minutos
- **SC-004**: Relevancia: término en título rankea >2x que en body
- **SC-005**: Sugerencias aparecen en <100ms
- **SC-006**: 100% de documentos publicados están indexados (zero drift)

---

## Technical Notes

### PostgreSQL Full-text Setup

```sql
-- Añadir columna de búsqueda
ALTER TABLE documents ADD COLUMN search_vector tsvector;

-- Crear índice GIN
CREATE INDEX documents_search_idx ON documents USING GIN (search_vector);

-- Trigger para actualizar automáticamente
CREATE OR REPLACE FUNCTION documents_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.excerpt, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.content_text, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_search_update
  BEFORE INSERT OR UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION documents_search_trigger();
```

### Search Query Implementation

```typescript
interface SearchOptions {
  query: string;
  filters?: {
    type?: string[];
    tags?: string[];
    dateRange?: { from?: Date; to?: Date };
  };
  facets?: string[]; // campos para facetas
  highlight?: boolean;
  limit?: number;
  offset?: number;
}

async function search(options: SearchOptions): Promise<SearchResults> {
  const { query, filters, highlight, limit = 20, offset = 0 } = options;

  // Construir tsquery
  const tsquery = query
    .split(/\s+/)
    .map(term => `${term}:*`) // prefix matching
    .join(' & ');

  const results = await prisma.$queryRaw`
    SELECT
      id,
      title,
      _type,
      ts_rank(search_vector, to_tsquery('spanish', ${tsquery})) as score,
      ${highlight ? Prisma.sql`ts_headline('spanish', content_text, to_tsquery('spanish', ${tsquery}), 'MaxWords=50, MinWords=20') as snippet` : Prisma.sql`NULL as snippet`}
    FROM documents
    WHERE
      search_vector @@ to_tsquery('spanish', ${tsquery})
      AND status = 'published'
      ${filters?.type ? Prisma.sql`AND _type = ANY(${filters.type})` : Prisma.empty}
    ORDER BY score DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  return {
    results,
    total: await countResults(tsquery, filters),
    facets: await generateFacets(tsquery, filters, options.facets),
  };
}
```

### HQL Integration

```typescript
// Extender HQL con operador de búsqueda
// *[_type == "post" && search("react hooks")] | order(score desc)

function parseSearchInHQL(query: string): HQLNode {
  // Detectar search() function y convertir a query PostgreSQL
  // Integrar con el parser existente de HQL
}
```

### Admin UI Search

```
┌─────────────────────────────────────────────────────────┐
│ 🔍 [Search content...________________________] [Search] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Filters:                 Results (47)                   │
│ ┌─────────────┐         ┌─────────────────────────────┐ │
│ │ Type        │         │ Getting Started with React  │ │
│ │ ☑ Posts (32)│         │ Learn how to build **React**│ │
│ │ ☐ Pages (10)│         │ apps from scratch...       │ │
│ │ ☐ Products 5│         │ Score: 0.95 | Post | 2d ago │ │
│ │             │         ├─────────────────────────────┤ │
│ │ Category    │         │ **React** Hooks Deep Dive   │ │
│ │ ☑ Tutorials │         │ Understanding useEffect and │ │
│ │ ☐ News      │         │ **React** lifecycle...     │ │
│ │ ☐ Reviews   │         │ Score: 0.89 | Post | 1w ago │ │
│ └─────────────┘         └─────────────────────────────┘ │
│                                                         │
│                         [Load More]                     │
└─────────────────────────────────────────────────────────┘
```

---

## Out of Scope (This Spec)

- Elasticsearch/Algolia como backend alternativo
- Semantic search / vector embeddings (ver spec 015 AI)
- Search analytics (qué busca la gente)
- Federated search (múltiples fuentes)
