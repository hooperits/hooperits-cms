# Feature Specification: Content Releases

**Feature Branch**: `011-content-releases`
**Created**: 2026-01-29
**Status**: Draft
**Dependencies**: 001-cms-core, 003-document-states, 004-document-versioning
**Complexity**: L

---

## Executive Summary

Implementar sistema de "Content Releases" que permite agrupar múltiples cambios en un bundle para publicación atómica. Esto permite coordinar lanzamientos de campañas, rediseños, o cualquier cambio que involucre múltiples documentos que deben publicarse simultáneamente.

---

## User Scenarios & Testing

### User Story 1 - Create Release (Priority: P1)

El editor puede crear un "release" y agregar documentos que quiere publicar juntos.

**Why this priority**: Crear releases es el primer paso para toda la funcionalidad.

**Independent Test**: Crear release "Campaña Navidad", agregar 5 posts y 2 páginas.

**Acceptance Scenarios**:

1. **Given** el dashboard, **When** creo un nuevo release, **Then** puedo darle nombre y descripción
2. **Given** un release existente, **When** edito un documento, **Then** puedo agregarlo al release
3. **Given** documentos en un release, **When** reviso el release, **Then** veo lista de todos los cambios incluidos
4. **Given** un release, **When** agrego documento ya incluido, **Then** se actualiza con los nuevos cambios

---

### User Story 2 - Review Release (Priority: P1)

El editor puede revisar todos los cambios incluidos en un release antes de publicar.

**Why this priority**: Revisión antes de publicar previene errores.

**Independent Test**: Ver diff de todos los documentos en el release con un click.

**Acceptance Scenarios**:

1. **Given** un release con documentos, **When** abro la vista de revisión, **Then** veo resumen de todos los cambios
2. **Given** la revisión, **When** hago click en un documento, **Then** veo el diff detallado
3. **Given** documentos con errores de validación, **When** reviso, **Then** veo warnings claros
4. **Given** la revisión completa, **When** apruebo, **Then** puedo proceder a publicar

---

### User Story 3 - Publish Release (Priority: P1)

El editor puede publicar todos los documentos de un release simultáneamente.

**Why this priority**: La publicación atómica es el valor principal del feature.

**Independent Test**: Publicar release con 10 documentos, verificar que todos cambian al mismo tiempo.

**Acceptance Scenarios**:

1. **Given** un release revisado, **When** hago click en "Publicar Release", **Then** todos los documentos se publican
2. **Given** publicación en progreso, **When** un documento falla, **Then** se hace rollback de todo el release
3. **Given** release publicado, **When** consulto el API, **Then** todos los cambios son visibles
4. **Given** publicación exitosa, **When** reviso el release, **Then** se marca como "Published" con timestamp

---

### User Story 4 - Schedule Release (Priority: P2)

El editor puede programar un release para publicarse automáticamente en una fecha/hora futura.

**Why this priority**: Programación es común para lanzamientos coordinados.

**Independent Test**: Programar release para las 00:00 del 1 de enero, verificar publicación automática.

**Acceptance Scenarios**:

1. **Given** un release listo, **When** selecciono "Programar", **Then** puedo elegir fecha y hora
2. **Given** release programado, **When** llega el momento, **Then** se publica automáticamente
3. **Given** release programado, **When** quiero cancelar, **Then** puedo desprogramar
4. **Given** release programado, **When** necesito hacer cambios, **Then** puedo editar antes de la fecha

---

### User Story 5 - Rollback Release (Priority: P2)

El editor puede revertir un release completo si algo salió mal.

**Why this priority**: Poder revertir cambios masivos es crítico para recovery.

**Independent Test**: Hacer rollback de un release publicado, verificar que todos los documentos vuelven al estado anterior.

**Acceptance Scenarios**:

1. **Given** un release publicado, **When** hago click en "Rollback", **Then** todos los documentos vuelven a su versión anterior
2. **Given** rollback en progreso, **When** falla un documento, **Then** continúa con los demás y reporta errores
3. **Given** rollback exitoso, **When** reviso, **Then** el release se marca como "Rolled back"
4. **Given** un release con rollback, **When** quiero republicar, **Then** puedo hacerlo

---

### User Story 6 - Release Collaboration (Priority: P3)

Múltiples editores pueden colaborar en preparar un release.

**Why this priority**: Releases grandes típicamente involucran varios editores.

**Independent Test**: Editor A y Editor B agregan documentos al mismo release.

**Acceptance Scenarios**:

1. **Given** un release, **When** varios editores agregan documentos, **Then** todos aparecen en el release
2. **Given** editores trabajando en release, **When** uno hace cambio, **Then** otros ven actualización (real-time)
3. **Given** un release, **When** el owner lo cierra para edición, **Then** solo él puede agregar más
4. **Given** release en revisión, **When** alguien comenta, **Then** el comentario es visible para el equipo

---

### Edge Cases

- ¿Qué pasa si documento del release se edita fuera del release? Warning, opción de actualizar o excluir
- ¿Qué pasa si documento del release es eliminado? Se remueve del release con notificación
- ¿Qué pasa con releases muy grandes (100+ documentos)? Procesamiento en batches, barra de progreso
- ¿Qué pasa si el servidor falla durante publicación? Transacción atómica, rollback automático

---

## Requirements

### Functional Requirements

**Release Management:**
- **FR-001**: Sistema DEBE permitir crear releases con nombre y descripción
- **FR-002**: Sistema DEBE permitir agregar documentos (drafts) a un release
- **FR-003**: Sistema DEBE permitir remover documentos de un release
- **FR-004**: Sistema DEBE mostrar estado de cada documento en el release

**Release States:**
- **FR-005**: Sistema DEBE soportar estados: draft, review, scheduled, published, rolled_back
- **FR-006**: Sistema DEBE trackear transiciones de estado con timestamps y usuarios
- **FR-007**: Sistema DEBE permitir cerrar release para evitar más cambios

**Review:**
- **FR-008**: Sistema DEBE mostrar resumen de cambios de todos los documentos
- **FR-009**: Sistema DEBE mostrar diff de cada documento vs versión publicada
- **FR-010**: Sistema DEBE validar todos los documentos y mostrar errores
- **FR-011**: Sistema DEBE permitir aprobar release para publicación

**Publishing:**
- **FR-012**: Sistema DEBE publicar todos los documentos en una transacción atómica
- **FR-013**: Sistema DEBE hacer rollback si cualquier documento falla
- **FR-014**: Sistema DEBE registrar el release en historial de cada documento
- **FR-015**: Sistema DEBE notificar a usuarios relevantes post-publicación

**Scheduling:**
- **FR-016**: Sistema DEBE permitir programar release para fecha/hora futura
- **FR-017**: Sistema DEBE ejecutar publicación programada automáticamente
- **FR-018**: Sistema DEBE soportar timezone del usuario para scheduling
- **FR-019**: Sistema DEBE permitir cancelar scheduling

**Rollback:**
- **FR-020**: Sistema DEBE permitir rollback de release publicado
- **FR-021**: Sistema DEBE restaurar versiones anteriores de todos los documentos
- **FR-022**: Sistema DEBE registrar rollback en historial
- **FR-023**: Sistema DEBE permitir re-publicar release después de rollback

### Key Entities

- **Release**: Bundle de cambios con nombre, estado, documentos
- **ReleaseItem**: Documento incluido en un release con snapshot de cambios
- **ReleaseEvent**: Evento de release (created, published, rolled_back, etc.)
- **ReleaseSchedule**: Programación de publicación de un release

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Releases con 50 documentos se publican en <30 segundos
- **SC-002**: Publicación atómica tiene 100% de consistencia (todo o nada)
- **SC-003**: Rollback restaura estado anterior en <30 segundos
- **SC-004**: Scheduling tiene accuracy de ±1 minuto
- **SC-005**: UI de review carga resumen de 50 documentos en <3 segundos
- **SC-006**: 0 casos de publicación parcial no intencional

---

## Technical Notes

### Data Model

```typescript
interface Release {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'review' | 'scheduled' | 'publishing' | 'published' | 'rolled_back';
  createdById: string;
  scheduledAt?: Date;
  publishedAt?: Date;
  rolledBackAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ReleaseItem {
  id: string;
  releaseId: string;
  documentId: string;
  documentType: string;
  // Snapshot del draft al momento de agregar
  draftSnapshot: Record<string, unknown>;
  // Snapshot de published (para rollback)
  publishedSnapshot?: Record<string, unknown>;
  status: 'pending' | 'published' | 'failed' | 'rolled_back';
  addedById: string;
  addedAt: Date;
}

interface ReleaseEvent {
  id: string;
  releaseId: string;
  type: 'created' | 'item_added' | 'item_removed' | 'submitted_review' |
        'approved' | 'scheduled' | 'published' | 'rolled_back' | 'cancelled';
  userId: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
```

### Atomic Publishing

```typescript
async function publishRelease(releaseId: string): Promise<PublishResult> {
  const release = await db.release.findUnique({ where: { id: releaseId } });
  const items = await db.releaseItem.findMany({ where: { releaseId } });

  // Usar transacción de base de datos para atomicidad
  return await db.$transaction(async (tx) => {
    const results = [];

    for (const item of items) {
      try {
        // Guardar snapshot actual como "pre-release" para rollback
        const current = await tx.document.findUnique({
          where: { id: item.documentId },
        });

        await tx.releaseItem.update({
          where: { id: item.id },
          data: { publishedSnapshot: current.published },
        });

        // Publicar draft
        await tx.document.update({
          where: { id: item.documentId },
          data: {
            published: item.draftSnapshot,
            publishedAt: new Date(),
          },
        });

        results.push({ documentId: item.documentId, success: true });
      } catch (error) {
        // Si falla cualquiera, la transacción hace rollback automático
        throw new ReleasePublishError(item.documentId, error);
      }
    }

    // Marcar release como publicado
    await tx.release.update({
      where: { id: releaseId },
      data: { status: 'published', publishedAt: new Date() },
    });

    return { success: true, results };
  });
}
```

### UI Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Release: "Q1 Campaign"               │
├─────────────────────────────────────────────────────────┤
│ Status: Draft                    Created: Jan 15, 2026  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Documents (7):                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ✓ Homepage Banner       [Page]      Modified        │ │
│ │ ✓ Q1 Promo Post        [Post]      New             │ │
│ │ ✓ Product: Widget X     [Product]   Modified        │ │
│ │ ✓ Product: Widget Y     [Product]   Modified        │ │
│ │ ✓ Campaign Landing Page [Page]      New             │ │
│ │ ⚠ Service: Consulting  [Service]   Validation Error│ │
│ │ ✓ Footer Links          [Settings]  Modified        │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [+ Add Document]  [Review Changes]  [Schedule]  [Publish]│
└─────────────────────────────────────────────────────────┘
```

---

## Out of Scope (This Spec)

- Branches/environments (dev, staging, prod)
- A/B testing de releases
- Gradual rollout (percentage-based)
- Integración con CI/CD
