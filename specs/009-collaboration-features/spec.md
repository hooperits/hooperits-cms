# Feature Specification: Collaboration Features

**Feature Branch**: `009-collaboration-features`
**Created**: 2026-01-29
**Status**: Draft
**Dependencies**: 001-cms-core, 006-real-time-sync
**Complexity**: M

---

## Executive Summary

Implementar funcionalidades de colaboración asíncrona: comentarios en documentos, tareas asignables, sistema de menciones, y feeds de actividad. Esto permite que equipos editoriales coordinen su trabajo sin necesidad de herramientas externas como Slack o Notion.

---

## User Scenarios & Testing

### User Story 1 - Document Comments (Priority: P1)

El editor puede dejar comentarios en documentos para discutir cambios con el equipo.

**Why this priority**: Comentarios son la forma más básica de colaboración asíncrona.

**Independent Test**: Agregar comentario a un post, recibir respuesta, marcar como resuelto.

**Acceptance Scenarios**:

1. **Given** un documento abierto, **When** hago click en "Comentar", **Then** puedo escribir un comentario
2. **Given** un comentario existente, **When** respondo, **Then** se crea un thread de conversación
3. **Given** un comentario, **When** el tema se resuelve, **Then** puedo marcarlo como resuelto
4. **Given** un documento con comentarios, **When** lo abro, **Then** veo indicador de comentarios pendientes

---

### User Story 2 - Inline Comments (Priority: P2)

El editor puede comentar en secciones específicas del contenido, similar a Google Docs.

**Why this priority**: Comentarios contextuales son más útiles que comentarios generales.

**Independent Test**: Seleccionar texto en rich text, agregar comentario, ver el texto resaltado.

**Acceptance Scenarios**:

1. **Given** texto seleccionado en un campo, **When** hago click en "Comentar selección", **Then** el comentario se asocia al texto
2. **Given** texto con comentario inline, **When** veo el documento, **Then** el texto está resaltado
3. **Given** texto con comentario, **When** hago click en el resaltado, **Then** veo el comentario/thread
4. **Given** el texto comentado se edita/elimina, **When** reviso, **Then** el comentario muestra que el contexto cambió

---

### User Story 3 - Tasks & Assignments (Priority: P1)

El editor puede crear tareas asociadas a documentos y asignarlas a miembros del equipo.

**Why this priority**: Tareas permiten trackear trabajo pendiente y responsabilidades.

**Independent Test**: Crear tarea "Revisar ortografía", asignar a editor, marcar como completada.

**Acceptance Scenarios**:

1. **Given** un documento, **When** creo una tarea, **Then** puedo describir el trabajo y asignar a alguien
2. **Given** una tarea asignada a mí, **When** abro mi dashboard, **Then** veo la tarea en mi lista
3. **Given** una tarea, **When** la completo, **Then** puedo marcarla como hecha con nota opcional
4. **Given** múltiples tareas en un documento, **When** las reviso, **Then** veo el progreso general

---

### User Story 4 - Mentions & Notifications (Priority: P1)

El editor puede mencionar a otros usuarios para notificarles y llamar su atención.

**Why this priority**: Menciones son esenciales para comunicación dirigida.

**Independent Test**: Escribir @nombre en comentario, verificar que el mencionado recibe notificación.

**Acceptance Scenarios**:

1. **Given** un campo de texto, **When** escribo "@", **Then** aparece autocomplete de usuarios
2. **Given** un usuario mencionado, **When** se guarda el comentario, **Then** recibe notificación
3. **Given** notificaciones pendientes, **When** abro el CMS, **Then** veo badge con conteo
4. **Given** una notificación, **When** hago click, **Then** me lleva al contexto (comentario/tarea)

---

### User Story 5 - Activity Feed (Priority: P2)

El editor puede ver un feed de actividad reciente del equipo y documentos seguidos.

**Why this priority**: El feed provee awareness de lo que pasa sin tener que revisar cada documento.

**Independent Test**: Ver feed mostrando "Juan editó Post X", "María comentó en Página Y".

**Acceptance Scenarios**:

1. **Given** el dashboard, **When** reviso el activity feed, **Then** veo acciones recientes del equipo
2. **Given** un documento que sigo, **When** alguien lo edita, **Then** aparece en mi feed
3. **Given** el feed, **When** filtro por tipo de actividad, **Then** veo solo esas acciones
4. **Given** actividad de hace tiempo, **When** cargo más, **Then** el feed se pagina correctamente

---

### User Story 6 - Following Documents (Priority: P3)

El editor puede seguir documentos específicos para recibir notificaciones de cambios.

**Why this priority**: Seguir documentos permite monitoreo selectivo sin ruido.

**Independent Test**: Seguir un documento, recibir notificación cuando otro lo edita.

**Acceptance Scenarios**:

1. **Given** un documento, **When** hago click en "Seguir", **Then** me suscribo a sus notificaciones
2. **Given** un documento seguido, **When** alguien lo edita/comenta, **Then** recibo notificación
3. **Given** mis documentos seguidos, **When** quiero ver la lista, **Then** hay sección dedicada
4. **Given** demasiadas notificaciones, **When** dejo de seguir, **Then** ya no recibo updates

---

### Edge Cases

- ¿Qué pasa con comentarios en documentos eliminados? Se archivan con el documento
- ¿Qué pasa si menciono a usuario que ya no tiene acceso? Warning al crear, notificación igualmente
- ¿Qué pasa con tareas vencidas? Indicador visual, opcionalmente notificación
- ¿Qué pasa si el texto comentado inline se elimina completamente? El comentario queda huérfano con nota

---

## Requirements

### Functional Requirements

**Comments:**
- **FR-001**: Sistema DEBE permitir comentarios a nivel de documento
- **FR-002**: Sistema DEBE permitir comentarios inline en campos de rich text
- **FR-003**: Sistema DEBE soportar threads de respuestas en comentarios
- **FR-004**: Sistema DEBE permitir marcar comentarios como resueltos
- **FR-005**: Sistema DEBE permitir editar y eliminar comentarios propios

**Tasks:**
- **FR-006**: Sistema DEBE permitir crear tareas asociadas a documentos
- **FR-007**: Sistema DEBE permitir asignar tareas a usuarios
- **FR-008**: Sistema DEBE soportar estados: pending, in_progress, completed
- **FR-009**: Sistema DEBE permitir agregar due date a tareas
- **FR-010**: Sistema DEBE mostrar tareas asignadas en dashboard personal

**Mentions:**
- **FR-011**: Sistema DEBE soportar @mentions en comentarios y tareas
- **FR-012**: Sistema DEBE proveer autocomplete de usuarios al escribir "@"
- **FR-013**: Sistema DEBE notificar a usuarios mencionados
- **FR-014**: Sistema DEBE renderizar menciones como links al perfil del usuario

**Notifications:**
- **FR-015**: Sistema DEBE generar notificaciones para: menciones, asignaciones, comentarios en docs seguidos
- **FR-016**: Sistema DEBE mostrar badge de notificaciones no leídas
- **FR-017**: Sistema DEBE permitir marcar notificaciones como leídas
- **FR-018**: Sistema DEBE permitir configurar preferencias de notificación

**Activity Feed:**
- **FR-019**: Sistema DEBE registrar actividad: ediciones, publicaciones, comentarios, tareas
- **FR-020**: Sistema DEBE mostrar feed en dashboard con paginación
- **FR-021**: Sistema DEBE permitir filtrar feed por tipo de actividad
- **FR-022**: Sistema DEBE permitir filtrar feed por documentos seguidos

**Following:**
- **FR-023**: Sistema DEBE permitir seguir/dejar de seguir documentos
- **FR-024**: Sistema DEBE notificar cambios en documentos seguidos
- **FR-025**: Sistema DEBE auto-seguir documentos creados por el usuario

### Key Entities

- **Comment**: Comentario con autor, texto, replies, estado (open/resolved)
- **InlineComment**: Comentario asociado a selección de texto específica
- **Task**: Tarea con título, descripción, assignee, status, due_date, documento
- **Mention**: Referencia a usuario en texto
- **Notification**: Notificación con tipo, destinatario, contexto, read status
- **ActivityEvent**: Evento de actividad con tipo, actor, target, timestamp
- **Follow**: Relación de seguimiento usuario-documento

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Comentarios y respuestas se guardan en <500ms
- **SC-002**: Menciones notifican al usuario en <5 segundos (real-time)
- **SC-003**: Activity feed carga 20 eventos en <1 segundo
- **SC-004**: Notificaciones tienen 0% de pérdida (todas se entregan)
- **SC-005**: Autocomplete de menciones aparece en <200ms
- **SC-006**: El 90% de tareas asignadas se completan (metric de adopción)

---

## Technical Notes

### Data Models

```typescript
interface Comment {
  id: string;
  documentId: string;
  // Para inline comments
  fieldPath?: string;
  textRange?: { start: number; end: number };
  quotedText?: string;
  // Content
  content: string;
  authorId: string;
  parentId?: string; // Para threads
  status: 'open' | 'resolved';
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Task {
  id: string;
  documentId?: string;
  title: string;
  description?: string;
  assigneeId?: string;
  createdById: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Notification {
  id: string;
  userId: string;
  type: 'mention' | 'assignment' | 'comment' | 'task_completed' | 'document_updated';
  title: string;
  body?: string;
  linkTo: string; // URL al contexto
  read: boolean;
  createdAt: Date;
}

interface ActivityEvent {
  id: string;
  type: 'document.created' | 'document.updated' | 'document.published' |
        'comment.created' | 'task.created' | 'task.completed';
  actorId: string;
  documentId?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}
```

### Inline Comments Implementation

```typescript
// Guardar selección en rich text
interface InlineCommentAnchor {
  fieldPath: string; // e.g., "content"
  blockKey: string;  // ID del bloque en Portable Text
  textRange: {
    start: number;
    end: number;
  };
  quotedText: string; // Texto original para detectar cambios
}

// Al renderizar, resaltar el texto
function renderPortableTextWithComments(content, comments) {
  // ... añadir decorators para texto comentado
}
```

### Notification System

```typescript
// Service para crear notificaciones
class NotificationService {
  async notify(userId: string, notification: CreateNotification) {
    // 1. Guardar en DB
    const saved = await this.db.notification.create({
      userId,
      ...notification,
    });

    // 2. Enviar por WebSocket si está conectado
    await this.realtime.sendToUser(userId, {
      type: 'notification',
      payload: saved,
    });

    // 3. Opcional: email si no está online
    if (await this.shouldSendEmail(userId)) {
      await this.emailService.send(userId, notification);
    }
  }
}
```

---

## Out of Scope (This Spec)

- Edición colaborativa real-time (ver spec 010)
- Workflows de aprobación formal (ver spec 016)
- Integración con Slack/Teams
- Email digests de actividad
