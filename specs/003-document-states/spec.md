# Feature Specification: Document States (Draft/Published)

**Feature Branch**: `003-document-states`
**Created**: 2026-01-29
**Status**: Draft
**Dependencies**: 001-cms-core
**Complexity**: L

---

## Executive Summary

Implementar un sistema completo de estados de documentos que permita trabajar con borradores (drafts) y versiones publicadas por separado. Incluye preview de borradores, publicación programada, y despublicación, dando a los editores control total sobre el ciclo de vida del contenido.

---

## User Scenarios & Testing

### User Story 1 - Draft Editing (Priority: P1)

El editor puede trabajar en borradores sin afectar el contenido publicado visible en el sitio.

**Why this priority**: Separar draft de published es fundamental para cualquier CMS profesional.

**Independent Test**: Crear un borrador, editarlo múltiples veces, verificar que el sitio público no cambia.

**Acceptance Scenarios**:

1. **Given** un documento publicado, **When** el editor hace cambios, **Then** se guarda como draft sin afectar la versión publicada
2. **Given** un draft existente, **When** el editor continúa editando, **Then** solo se actualiza el draft
3. **Given** un documento sin publicar, **When** se crea nuevo contenido, **Then** comienza como draft automáticamente
4. **Given** el admin UI, **When** miro un documento, **Then** veo claramente si tiene cambios no publicados

---

### User Story 2 - Publishing Workflow (Priority: P1)

El editor puede publicar borradores para hacerlos visibles en el sitio público.

**Why this priority**: La acción de publicar es el core del workflow editorial.

**Independent Test**: Publicar un draft y verificar que aparece en el API público.

**Acceptance Scenarios**:

1. **Given** un documento con draft, **When** el editor hace click en "Publicar", **Then** el draft se convierte en la versión publicada
2. **Given** un documento publicado, **When** consulto el API público, **Then** solo veo la versión publicada
3. **Given** un documento con draft y versión publicada, **When** el editor descarta el draft, **Then** la versión publicada permanece intacta
4. **Given** múltiples documentos con drafts, **When** el editor revisa la lista, **Then** ve indicador de "cambios pendientes"

---

### User Story 3 - Preview Mode (Priority: P1)

El editor puede previsualizar cómo se verá el contenido draft antes de publicar.

**Why this priority**: Previsualizar antes de publicar evita errores costosos.

**Independent Test**: Usar link de preview para ver un draft en el contexto del sitio real.

**Acceptance Scenarios**:

1. **Given** un documento con draft, **When** el editor hace click en "Preview", **Then** se genera un link temporal de preview
2. **Given** un link de preview válido, **When** lo abro en el frontend, **Then** veo el contenido draft en el contexto del sitio
3. **Given** un link de preview, **When** pasan 24 horas, **Then** el link expira por seguridad
4. **Given** preview mode en el frontend, **When** navego, **Then** veo banner indicando que es preview

---

### User Story 4 - Scheduled Publishing (Priority: P2)

El editor puede programar contenido para publicarse automáticamente en una fecha/hora futura.

**Why this priority**: Publicación programada es común para campañas y lanzamientos.

**Independent Test**: Programar un post para mañana a las 9am y verificar que se publica automáticamente.

**Acceptance Scenarios**:

1. **Given** un draft, **When** el editor selecciona "Programar" con fecha futura, **Then** el documento queda en estado "scheduled"
2. **Given** un documento scheduled, **When** llega la fecha/hora programada, **Then** se publica automáticamente
3. **Given** un documento scheduled, **When** el editor decide cancelar, **Then** puede volver a draft sin publicar
4. **Given** múltiples documentos scheduled, **When** reviso el dashboard, **Then** veo calendario/lista de publicaciones programadas

---

### User Story 5 - Unpublish & Archive (Priority: P2)

El editor puede despublicar contenido para removerlo del sitio sin eliminarlo permanentemente.

**Why this priority**: A veces se necesita quitar contenido temporalmente sin perderlo.

**Independent Test**: Despublicar un servicio y verificar que no aparece en el API pero se puede republicar.

**Acceptance Scenarios**:

1. **Given** un documento publicado, **When** el editor hace click en "Despublicar", **Then** desaparece del API público pero se conserva en admin
2. **Given** un documento despublicado, **When** el editor lo republica, **Then** vuelve a aparecer en el sitio
3. **Given** un documento despublicado, **When** paso tiempo, **Then** puedo archivar para organización
4. **Given** documentos archivados, **When** busco en admin, **Then** puedo filtrar para verlos o excluirlos

---

### Edge Cases

- ¿Qué pasa si el servidor falla durante scheduled publish? Job de retry + notificación al editor
- ¿Qué pasa si dos editores publican el mismo documento simultáneamente? Último en publicar gana, warning al primero
- ¿Qué pasa con referencias a documentos despublicados? Se muestran como "contenido no disponible" con warning en admin
- ¿Qué pasa si se edita un documento scheduled? El schedule se mantiene con el nuevo draft

---

## Requirements

### Functional Requirements

**Document States:**
- **FR-001**: Sistema DEBE soportar estados: draft, published, scheduled, unpublished, archived
- **FR-002**: Sistema DEBE mantener versión draft y published por separado cuando existan ambas
- **FR-003**: Sistema DEBE mostrar indicador visual claro del estado actual en admin UI
- **FR-004**: Sistema DEBE permitir comparar draft vs published side-by-side

**Publishing:**
- **FR-005**: Sistema DEBE permitir publicar draft con un click
- **FR-006**: Sistema DEBE registrar timestamp y usuario de cada publicación
- **FR-007**: Sistema DEBE permitir descartar draft y volver a versión publicada
- **FR-008**: Sistema DEBE notificar a otros editores cuando un documento se publica

**Preview:**
- **FR-009**: Sistema DEBE generar tokens de preview seguros con expiración
- **FR-010**: Sistema DEBE exponer endpoint `/api/preview` para obtener drafts con token válido
- **FR-011**: Sistema DEBE proveer utilidad para frontend que detecta modo preview
- **FR-012**: Preview tokens DEBEN ser revocables por el editor

**Scheduled Publishing:**
- **FR-013**: Sistema DEBE permitir seleccionar fecha/hora de publicación futura
- **FR-014**: Sistema DEBE ejecutar job periódico para publicar contenido scheduled
- **FR-015**: Sistema DEBE soportar timezone del usuario para scheduling
- **FR-016**: Sistema DEBE permitir cancelar publicación programada

**Unpublish & Archive:**
- **FR-017**: Sistema DEBE permitir despublicar contenido manteniendo datos
- **FR-018**: Sistema DEBE permitir archivar contenido despublicado
- **FR-019**: Sistema DEBE permitir restaurar contenido archivado
- **FR-020**: Sistema DEBE filtrar contenido archivado por defecto en listados

### Key Entities

- **DocumentState**: Enum de estados posibles (draft, published, scheduled, unpublished, archived)
- **PublishEvent**: Registro de cada acción de publicación (timestamp, user, document)
- **PreviewToken**: Token temporal para acceso a drafts
- **ScheduledPublish**: Programación de publicación futura

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Editores pueden publicar contenido en <3 clicks desde el editor
- **SC-002**: Preview links se generan en <1 segundo
- **SC-003**: Scheduled publishing tiene accuracy de ±1 minuto respecto a hora programada
- **SC-004**: 100% de documentos publicados tienen registro de quién/cuándo publicó
- **SC-005**: El sitio público NUNCA muestra contenido draft accidentalmente
- **SC-006**: La UI muestra estado del documento de forma inmediatamente visible (sin buscar)

---

## Technical Notes

### State Machine

```
        ┌──────────────────────────────────────────┐
        │                                          │
        ▼                                          │
    ┌───────┐    publish    ┌───────────┐    unpublish    ┌─────────────┐
───▶│ draft │──────────────▶│ published │────────────────▶│ unpublished │
    └───────┘               └───────────┘                 └─────────────┘
        │                        ▲                              │
        │ schedule               │ auto-publish                 │ archive
        ▼                        │                              ▼
    ┌───────────┐               │                         ┌──────────┐
    │ scheduled │───────────────┘                         │ archived │
    └───────────┘                                         └──────────┘
```

### Preview Implementation

```typescript
// Generar preview token
const token = await cms.preview.createToken({
  documentId: 'service-123',
  expiresIn: '24h',
});

// En frontend Next.js
export async function getStaticProps({ preview, previewData }) {
  if (preview) {
    const data = await cms.preview.fetch(previewData.token);
    return { props: { data, isPreview: true } };
  }
  // ... fetch published
}
```

---

## Out of Scope (This Spec)

- Historial de versiones completo (ver spec 004)
- Workflows de aprobación multi-paso (ver spec 016)
- Publicación atómica de múltiples documentos (ver spec 011)
