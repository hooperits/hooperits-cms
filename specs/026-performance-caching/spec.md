# Feature Specification: Performance & Caching

**Feature Branch**: `026-performance-caching`
**Created**: 2026-01-29
**Status**: Draft
**Dependencies**: 001-cms-core, 013-webhooks-events
**Complexity**: M

---

## Executive Summary

Implementar sistema de caché avanzado con tags, invalidación inteligente, y helpers para integración con CDN. Optimiza performance de la API del CMS para soportar alto tráfico sin escalar infraestructura, manteniendo contenido siempre actualizado mediante invalidación granular.

---

## User Scenarios & Testing

### User Story 1 - Automatic Response Caching (Priority: P1)

El sistema cachea respuestas de API automáticamente para queries frecuentes.

**Why this priority**: Caché automático da beneficios inmediatos sin configuración.

**Independent Test**: Hacer misma query 100 veces, verificar que 99 son de caché.

**Acceptance Scenarios**:

1. **Given** query a la API, **When** se ejecuta, **Then** respuesta se cachea automáticamente
2. **Given** respuesta cacheada, **When** repito la query, **Then** responde desde caché
3. **Given** caché, **When** documento cambia, **Then** se invalida automáticamente
4. **Given** parámetros diferentes, **When** ejecuto, **Then** cada combinación tiene su caché

---

### User Story 2 - Tag-based Invalidation (Priority: P1)

El contenido se cachea con tags que permiten invalidación granular.

**Why this priority**: Invalidación por tags evita invalidar todo cuando solo cambia una cosa.

**Independent Test**: Publicar post, solo se invalida caché relacionado a posts, no páginas.

**Acceptance Scenarios**:

1. **Given** respuesta cacheada con tags, **When** invalido por tag, **Then** solo esas respuestas se invalidan
2. **Given** documento de tipo "post", **When** se actualiza, **Then** se invalida tag "post" y tag del documento
3. **Given** múltiples tags en respuesta, **When** invalido uno, **Then** respuesta se invalida
4. **Given** tags jerárquicos, **When** invalido padre, **Then** hijos se invalidan también

---

### User Story 3 - CDN Integration (Priority: P2)

El sistema provee headers y helpers para integración con CDN (Cloudflare, Fastly, etc.).

**Why this priority**: CDN edge caching reduce latencia y carga en origen.

**Independent Test**: Configurar con Cloudflare, ver headers de caché correctos, invalidar via API.

**Acceptance Scenarios**:

1. **Given** API response, **When** se envía, **Then** incluye headers de caché apropiados
2. **Given** configuración de CDN, **When** contenido cambia, **Then** se purga caché del CDN
3. **Given** preview mode, **When** se usa, **Then** headers indican no cachear
4. **Given** contenido dinámico, **When** se sirve, **Then** headers indican caché corto o none

---

### User Story 4 - Cache Warming (Priority: P3)

El sistema puede pre-calentar caché para contenido importante.

**Why this priority**: Cache warming evita cold starts después de deploy o invalidación masiva.

**Independent Test**: Ejecutar warm-up de homepage y top 100 posts, verificar caché poblado.

**Acceptance Scenarios**:

1. **Given** comando de warm-up, **When** ejecuto, **Then** queries predefinidas se ejecutan y cachean
2. **Given** webhook de deploy, **When** se recibe, **Then** se dispara warm-up automático
3. **Given** warm-up en progreso, **When** reviso, **Then** veo progreso y errores
4. **Given** lista de URLs críticas, **When** configuro, **Then** esas se incluyen en warm-up

---

### User Story 5 - Cache Metrics (Priority: P2)

El administrador puede ver métricas de efectividad del caché.

**Why this priority**: Métricas permiten optimizar configuración de caché.

**Independent Test**: Ver dashboard con hit rate, tamaño de caché, y top keys.

**Acceptance Scenarios**:

1. **Given** dashboard de caché, **When** lo abro, **Then** veo hit rate y miss rate
2. **Given** métricas, **When** veo por endpoint, **Then** identifico cuáles se benefician más
3. **Given** tamaño de caché, **When** veo, **Then** sé cuánta memoria se usa
4. **Given** keys más accedidas, **When** veo top 10, **Then** puedo optimizar warming

---

### User Story 6 - Manual Cache Control (Priority: P2)

El administrador puede invalidar caché manualmente cuando sea necesario.

**Why this priority**: A veces se necesita control manual (debugging, emergencias).

**Independent Test**: Invalidar todo el caché de posts vía UI o CLI.

**Acceptance Scenarios**:

1. **Given** admin UI, **When** hago click en "Purge Cache", **Then** puedo elegir qué invalidar
2. **Given** CLI, **When** ejecuto `cms cache purge --tag post`, **Then** se invalida ese tag
3. **Given** documento específico, **When** invalido su caché, **Then** solo ese se invalida
4. **Given** invalidación masiva, **When** ejecuto, **Then** se confirma con warning

---

### Edge Cases

- ¿Qué pasa si Redis no está disponible? Fallback a sin caché, no romper el servicio
- ¿Qué pasa con caché muy grande? LRU eviction, límites configurables
- ¿Qué pasa con invalidación durante pico de tráfico? Stale-while-revalidate
- ¿Qué pasa con contenido personalizado (por usuario)? No cachear o cache por user key

---

## Requirements

### Functional Requirements

**Automatic Caching:**
- **FR-001**: Sistema DEBE cachear respuestas de API GET por defecto
- **FR-002**: Sistema DEBE generar cache keys basadas en URL + params
- **FR-003**: Sistema DEBE soportar TTL configurable por tipo de contenido
- **FR-004**: Sistema DEBE excluir rutas específicas del caché (configurable)

**Tag-based Invalidation:**
- **FR-005**: Sistema DEBE asignar tags a respuestas cacheadas (tipo, id, etc.)
- **FR-006**: Sistema DEBE invalidar por tag cuando documentos cambian
- **FR-007**: Sistema DEBE soportar tags custom definidos por el desarrollador
- **FR-008**: Sistema DEBE soportar invalidación por patrón/wildcard

**CDN Integration:**
- **FR-009**: Sistema DEBE incluir headers Cache-Control apropiados
- **FR-010**: Sistema DEBE incluir headers para CDN (Surrogate-Control, etc.)
- **FR-011**: Sistema DEBE soportar purge API de CDNs populares (Cloudflare, Fastly)
- **FR-012**: Sistema DEBE configurar stale-while-revalidate cuando apropiado

**Cache Warming:**
- **FR-013**: Sistema DEBE soportar warm-up de URLs predefinidas
- **FR-014**: Sistema DEBE soportar warm-up automático post-deploy
- **FR-015**: Sistema DEBE soportar warm-up incremental (no bloquear)
- **FR-016**: CLI DEBE incluir comando `cms cache warm`

**Metrics:**
- **FR-017**: Sistema DEBE trackear hit rate y miss rate
- **FR-018**: Sistema DEBE trackear tamaño de caché
- **FR-019**: Sistema DEBE identificar top cached keys
- **FR-020**: Sistema DEBE mostrar métricas en dashboard

**Manual Control:**
- **FR-021**: Sistema DEBE permitir purge de todo el caché
- **FR-022**: Sistema DEBE permitir purge por tag
- **FR-023**: Sistema DEBE permitir purge por documento
- **FR-024**: CLI DEBE incluir comandos de cache management

### Key Entities

- **CacheEntry**: Entrada de caché con tags, TTL, metadata
- **CacheTag**: Tag asociado a entradas de caché
- **CacheMetrics**: Métricas agregadas de caché
- **WarmupConfig**: Configuración de warm-up

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Cache hit rate >90% para contenido publicado
- **SC-002**: Respuestas cacheadas <10ms (vs 50-200ms sin caché)
- **SC-003**: Invalidación se propaga en <1 segundo
- **SC-004**: Cache warm-up de 1000 URLs completa en <2 minutos
- **SC-005**: Overhead de caching <5ms por request
- **SC-006**: CDN purge se ejecuta en <5 segundos post-publicación

---

## Technical Notes

### Cache Architecture

```typescript
// Cache service con Redis
interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options: CacheOptions): Promise<void>;
  invalidateByTag(tag: string): Promise<number>;
  invalidateByPattern(pattern: string): Promise<number>;
  getMetrics(): Promise<CacheMetrics>;
}

interface CacheOptions {
  ttl?: number; // seconds
  tags?: string[];
  staleWhileRevalidate?: number;
}

// Implementación con Redis
class RedisCacheService implements CacheService {
  constructor(private redis: Redis) {}

  async set<T>(key: string, value: T, options: CacheOptions): Promise<void> {
    const serialized = JSON.stringify(value);

    // Guardar valor con TTL
    await this.redis.set(key, serialized, 'EX', options.ttl || 3600);

    // Asociar tags
    if (options.tags) {
      for (const tag of options.tags) {
        await this.redis.sadd(`tag:${tag}`, key);
      }
    }
  }

  async invalidateByTag(tag: string): Promise<number> {
    const keys = await this.redis.smembers(`tag:${tag}`);
    if (keys.length === 0) return 0;

    await this.redis.del(...keys);
    await this.redis.del(`tag:${tag}`);

    return keys.length;
  }
}
```

### API Caching Middleware

```typescript
function cacheMiddleware(options?: CacheMiddlewareOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip para métodos no-GET o rutas excluidas
    if (req.method !== 'GET' || isExcluded(req.path)) {
      return next();
    }

    // Skip para preview mode o authenticated requests que no deben cachearse
    if (req.query.preview || shouldSkipCache(req)) {
      res.setHeader('Cache-Control', 'no-store');
      return next();
    }

    const cacheKey = generateCacheKey(req);

    // Intentar obtener de caché
    const cached = await cache.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', `public, max-age=${options?.clientTTL || 60}`);
      return res.json(cached);
    }

    // Interceptar respuesta para cachear
    const originalJson = res.json;
    res.json = function (body) {
      // Determinar tags basado en la respuesta
      const tags = extractTags(body, req);

      // Cachear la respuesta
      cache.set(cacheKey, body, {
        ttl: options?.ttl || 3600,
        tags,
      });

      res.setHeader('X-Cache', 'MISS');
      res.setHeader('Cache-Control', `public, max-age=${options?.clientTTL || 60}, stale-while-revalidate=60`);

      return originalJson.call(this, body);
    };

    next();
  };
}
```

### Auto-invalidation on Changes

```typescript
// Hook que se ejecuta después de cambios en documentos
async function onDocumentChange(event: DocumentEvent) {
  const { document, action } = event;

  // Tags a invalidar
  const tags = [
    `doc:${document._id}`,
    `type:${document._type}`,
    'all-content',
  ];

  // Tags adicionales basados en campos del documento
  if (document.category) {
    tags.push(`category:${document.category}`);
  }

  // Invalidar caché local
  await cache.invalidateByTags(tags);

  // Invalidar CDN si está configurado
  if (cdnConfig.enabled) {
    await purgeCDN(tags);
  }
}
```

### CDN Integration

```typescript
// Cloudflare purge
async function purgeCloudflare(tags: string[]) {
  await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tags: tags.map(t => `cms:${t}`), // Prefixar para evitar colisiones
    }),
  });
}

// Headers para CDN
function setCDNHeaders(res: Response, options: CDNHeaderOptions) {
  // Browser cache
  res.setHeader('Cache-Control', `public, max-age=${options.browserTTL}`);

  // CDN cache (puede ser más largo que browser)
  res.setHeader('Surrogate-Control', `max-age=${options.cdnTTL}`);

  // Cache tags para invalidación granular
  res.setHeader('Cache-Tag', options.tags.join(', '));

  // Stale-while-revalidate
  if (options.staleWhileRevalidate) {
    res.setHeader('Surrogate-Control',
      `max-age=${options.cdnTTL}, stale-while-revalidate=${options.staleWhileRevalidate}`
    );
  }
}
```

### Cache Warming

```typescript
// Configuración de warm-up
interface WarmupConfig {
  urls: string[];
  queries: { hql: string; params?: Record<string, unknown> }[];
  documentTypes: string[];
  concurrent: number;
  delayMs: number;
}

async function warmCache(config: WarmupConfig): Promise<WarmupResult> {
  const results = { success: 0, failed: 0, errors: [] };
  const queue = new PQueue({ concurrency: config.concurrent });

  // URLs estáticas
  for (const url of config.urls) {
    queue.add(async () => {
      try {
        await fetch(url);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ url, error: error.message });
      }
      await sleep(config.delayMs);
    });
  }

  // Queries HQL
  for (const query of config.queries) {
    queue.add(async () => {
      try {
        await cms.query(query.hql, query.params);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ query: query.hql, error: error.message });
      }
    });
  }

  await queue.onIdle();
  return results;
}
```

### CLI Commands

```bash
# Ver métricas de caché
cms cache stats

# Purge por tag
cms cache purge --tag post
cms cache purge --tag "doc:post-123"

# Purge todo
cms cache purge --all

# Warm-up
cms cache warm --config ./warmup.json
cms cache warm --urls "/,/about,/blog" --concurrent 5

# Ver keys cacheadas
cms cache keys --pattern "type:post*"
```

---

## Out of Scope (This Spec)

- Page-level caching (SSG/ISR en Next.js)
- Database query caching
- Full-page CDN (Vercel, Netlify)
- Geographic routing
