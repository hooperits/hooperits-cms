# Feature Specification: Analytics Dashboard

**Feature Branch**: `024-analytics-dashboard`
**Created**: 2026-01-29
**Status**: Draft
**Dependencies**: 001-cms-core
**Complexity**: M

---

## Executive Summary

Implementar dashboard de analytics interno que muestra métricas de contenido, actividad de editores, y uso de API. Proporciona visibilidad sobre cómo se usa el CMS sin depender de herramientas externas, respetando el principio self-hosted.

---

## User Scenarios & Testing

### User Story 1 - Content Metrics (Priority: P1)

El administrador puede ver métricas sobre el contenido del CMS.

**Why this priority**: Entender el estado del contenido es fundamental para administradores.

**Independent Test**: Ver dashboard con conteo de documentos por tipo, estado, y tendencia.

**Acceptance Scenarios**:

1. **Given** dashboard de contenido, **When** lo abro, **Then** veo total de documentos por tipo
2. **Given** métricas, **When** veo estados, **Then** veo cuántos están draft/published/scheduled
3. **Given** gráfico de tendencia, **When** selecciono rango de fechas, **Then** veo contenido creado por período
4. **Given** filtro por tipo, **When** selecciono "posts", **Then** métricas se filtran a posts

---

### User Story 2 - Editor Activity (Priority: P1)

El administrador puede ver actividad de los editores para gestión del equipo.

**Why this priority**: Visibilidad de actividad es esencial para managers de contenido.

**Independent Test**: Ver quién ha publicado más contenido esta semana.

**Acceptance Scenarios**:

1. **Given** dashboard de editores, **When** lo abro, **Then** veo lista de editores activos
2. **Given** editor seleccionado, **When** veo detalle, **Then** veo su actividad reciente
3. **Given** métricas de equipo, **When** veo, **Then** muestra documentos creados/editados/publicados por persona
4. **Given** período seleccionado, **When** cambio a "último mes", **Then** métricas se actualizan

---

### User Story 3 - API Usage (Priority: P2)

El administrador puede ver cómo se usa la API del CMS.

**Why this priority**: Entender uso de API ayuda con planning de capacidad.

**Independent Test**: Ver requests por día, endpoints más usados, latencia promedio.

**Acceptance Scenarios**:

1. **Given** dashboard de API, **When** lo abro, **Then** veo requests totales por período
2. **Given** métricas de endpoints, **When** veo, **Then** muestra cuáles se usan más
3. **Given** gráfico de latencia, **When** veo, **Then** muestra p50, p95, p99
4. **Given** errores de API, **When** hay, **Then** muestra tasa de error y tipos

---

### User Story 4 - Media Usage (Priority: P2)

El administrador puede ver uso de storage y media.

**Why this priority**: Storage tiene costo y necesita monitoreo.

**Independent Test**: Ver total de storage usado, archivos más grandes, crecimiento.

**Acceptance Scenarios**:

1. **Given** dashboard de media, **When** lo abro, **Then** veo storage total usado
2. **Given** breakdown por tipo, **When** veo, **Then** muestra images vs documents vs otros
3. **Given** archivos grandes, **When** veo top 10, **Then** puedo identificar oportunidades de optimización
4. **Given** tendencia de crecimiento, **When** veo, **Then** puedo proyectar necesidades futuras

---

### User Story 5 - Exportable Reports (Priority: P3)

El administrador puede exportar reportes de analytics.

**Why this priority**: Reportes son necesarios para stakeholders que no acceden al CMS.

**Independent Test**: Exportar reporte mensual de actividad a PDF.

**Acceptance Scenarios**:

1. **Given** dashboard, **When** hago click en "Exportar", **Then** puedo elegir formato (PDF, CSV)
2. **Given** exportación, **When** selecciono rango de fechas, **Then** el reporte incluye ese período
3. **Given** reporte PDF, **When** lo genero, **Then** incluye gráficos y tablas legibles
4. **Given** reporte CSV, **When** lo descargo, **Then** puedo abrirlo en Excel

---

### User Story 6 - Real-time Dashboard (Priority: P3)

El dashboard muestra datos en tiempo real para monitoreo activo.

**Why this priority**: Real-time permite detectar problemas rápidamente.

**Independent Test**: Ver contador de requests actualizado en vivo.

**Acceptance Scenarios**:

1. **Given** dashboard abierto, **When** hay actividad, **Then** métricas se actualizan sin refresh
2. **Given** pico de tráfico, **When** ocurre, **Then** es visible inmediatamente en gráficos
3. **Given** error rate alto, **When** ocurre, **Then** alerta visual en dashboard
4. **Given** modo auto-refresh, **When** está activo, **Then** datos se actualizan cada N segundos

---

### Edge Cases

- ¿Qué pasa con mucha data histórica? Agregación por períodos, retención configurable
- ¿Qué pasa si analytics afecta performance? Procesamiento async, sampling opcional
- ¿Qué pasa con datos personales de editores? Opción de anonimizar para cumplir privacy
- ¿Qué pasa con múltiples datasets? Analytics por dataset o agregado

---

## Requirements

### Functional Requirements

**Content Metrics:**
- **FR-001**: Sistema DEBE mostrar conteo de documentos por tipo
- **FR-002**: Sistema DEBE mostrar conteo de documentos por estado
- **FR-003**: Sistema DEBE mostrar tendencia de creación de contenido (gráfico)
- **FR-004**: Sistema DEBE permitir filtrar por tipo de documento y período

**Editor Activity:**
- **FR-005**: Sistema DEBE mostrar lista de editores con actividad reciente
- **FR-006**: Sistema DEBE mostrar documentos creados/editados/publicados por editor
- **FR-007**: Sistema DEBE mostrar "última actividad" por editor
- **FR-008**: Sistema DEBE permitir ver detalle de actividad por editor

**API Metrics:**
- **FR-009**: Sistema DEBE trackear requests a la API
- **FR-010**: Sistema DEBE mostrar requests por período (hora/día/semana)
- **FR-011**: Sistema DEBE mostrar endpoints más usados
- **FR-012**: Sistema DEBE mostrar latencia (p50, p95, p99)
- **FR-013**: Sistema DEBE mostrar tasa de error y tipos de error

**Media Metrics:**
- **FR-014**: Sistema DEBE mostrar storage total usado
- **FR-015**: Sistema DEBE mostrar breakdown por tipo de archivo
- **FR-016**: Sistema DEBE mostrar archivos más grandes
- **FR-017**: Sistema DEBE mostrar tendencia de crecimiento de storage

**Export:**
- **FR-018**: Sistema DEBE permitir exportar reportes a PDF
- **FR-019**: Sistema DEBE permitir exportar datos a CSV
- **FR-020**: Sistema DEBE permitir seleccionar rango de fechas para exportación

**Real-time:**
- **FR-021**: Sistema DEBE actualizar métricas en tiempo real (opcional)
- **FR-022**: Sistema DEBE mostrar alertas visuales para anomalías
- **FR-023**: Sistema DEBE permitir configurar intervalo de refresh

### Key Entities

- **AnalyticsEvent**: Evento individual (type, timestamp, metadata)
- **ContentMetric**: Métrica agregada de contenido
- **APIMetric**: Métrica de uso de API
- **EditorActivity**: Actividad de un editor

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Dashboard carga en <3 segundos con 1M+ eventos históricos
- **SC-002**: Tracking de eventos tiene <1% overhead en performance
- **SC-003**: Datos se agregan con máximo 5 minutos de delay
- **SC-004**: Exportación de reporte completa en <30 segundos
- **SC-005**: Dashboard real-time actualiza cada 10 segundos sin flicker
- **SC-006**: 100% de métricas tienen tooltips explicativos

---

## Technical Notes

### Data Collection

```typescript
// Middleware para trackear eventos
async function analyticsMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    // Enviar a cola async para no bloquear
    analyticsQueue.add({
      type: 'api_request',
      timestamp: new Date(),
      data: {
        path: req.path,
        method: req.method,
        statusCode: res.statusCode,
        duration,
        userId: req.user?.id,
        userAgent: req.headers['user-agent'],
      },
    });
  });

  next();
}

// Trackear eventos de contenido
async function trackContentEvent(type: string, document: Document, user: User) {
  await analyticsQueue.add({
    type,
    timestamp: new Date(),
    data: {
      documentId: document._id,
      documentType: document._type,
      userId: user.id,
    },
  });
}
```

### Aggregation Strategy

```typescript
// Agregación periódica (cada hora)
async function aggregateHourlyMetrics() {
  const hourAgo = subHours(new Date(), 1);

  // Content metrics
  const contentMetrics = await db.analyticsEvent.groupBy({
    by: ['data.documentType', 'type'],
    where: {
      timestamp: { gte: hourAgo },
      type: { in: ['document.created', 'document.updated', 'document.published'] },
    },
    _count: true,
  });

  // API metrics
  const apiMetrics = await db.$queryRaw`
    SELECT
      data->>'path' as path,
      COUNT(*) as count,
      AVG((data->>'duration')::int) as avg_duration,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (data->>'duration')::int) as p95
    FROM analytics_events
    WHERE type = 'api_request' AND timestamp >= ${hourAgo}
    GROUP BY data->>'path'
  `;

  // Guardar agregaciones
  await db.hourlyMetric.create({
    data: {
      hour: startOfHour(hourAgo),
      contentMetrics,
      apiMetrics,
    },
  });
}
```

### Dashboard Components

```tsx
// Dashboard principal
function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>(last7Days());

  return (
    <div className="analytics-dashboard">
      <header>
        <h1>Analytics</h1>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </header>

      <div className="metrics-grid">
        <MetricCard
          title="Total Documents"
          value={metrics.totalDocuments}
          change={metrics.documentsChange}
        />
        <MetricCard
          title="Published This Period"
          value={metrics.publishedCount}
          change={metrics.publishedChange}
        />
        <MetricCard
          title="API Requests"
          value={metrics.apiRequests}
          change={metrics.apiRequestsChange}
        />
        <MetricCard
          title="Storage Used"
          value={formatBytes(metrics.storageUsed)}
          change={metrics.storageChange}
        />
      </div>

      <div className="charts-grid">
        <ContentTrendChart data={metrics.contentTrend} dateRange={dateRange} />
        <TopEndpointsChart data={metrics.topEndpoints} />
        <EditorActivityChart data={metrics.editorActivity} />
        <LatencyChart data={metrics.latency} />
      </div>

      <div className="tables-section">
        <TopEditorsTable data={metrics.topEditors} />
        <RecentActivityTable data={metrics.recentActivity} />
      </div>
    </div>
  );
}
```

### Dashboard UI Mockup

```
┌─────────────────────────────────────────────────────────────────────┐
│ Analytics                                      [Last 7 Days ▼] [⟳]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐│
│  │ Documents    │  │ Published    │  │ API Requests │  │ Storage  ││
│  │    1,247     │  │     89       │  │   125.3K     │  │  4.2 GB  ││
│  │   ↑ 12%      │  │   ↑ 23%      │  │   ↓ 5%       │  │  ↑ 8%    ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘│
│                                                                     │
│  ┌────────────────────────────────┐  ┌────────────────────────────┐ │
│  │ Content Created (Last 7 Days) │  │ Top API Endpoints          │ │
│  │ ▁▂▃▅▆▇█▇▆▅▄▃▂▁               │  │ /api/posts        45.2K   │ │
│  │ Mon Tue Wed Thu Fri Sat Sun   │  │ /api/media        32.1K   │ │
│  │                                │  │ /api/search       18.7K   │ │
│  │ Posts ─── Pages --- Products  │  │ /api/pages        15.3K   │ │
│  └────────────────────────────────┘  └────────────────────────────┘ │
│                                                                     │
│  ┌────────────────────────────────┐  ┌────────────────────────────┐ │
│  │ Editor Activity               │  │ API Latency                │ │
│  │ María García      23 edits    │  │                            │ │
│  │ Juan Pérez        18 edits    │  │ p50: 45ms                  │ │
│  │ Ana López         12 edits    │  │ p95: 120ms                 │ │
│  │ Carlos Ruiz        8 edits    │  │ p99: 350ms                 │ │
│  └────────────────────────────────┘  └────────────────────────────┘ │
│                                                                     │
│                                              [Export PDF] [Export CSV]│
└─────────────────────────────────────────────────────────────────────┘
```

---

## Out of Scope (This Spec)

- Analytics de frontend (page views, engagement)
- Integration con Google Analytics o similares
- Predictive analytics / ML
- Custom dashboard builder
