# Feature Specification: Workflows & Approvals

**Feature Branch**: `016-workflows-approvals`
**Created**: 2026-01-29
**Status**: Draft
**Dependencies**: 001-cms-core, 003-document-states, 009-collaboration-features
**Complexity**: L

---

## Executive Summary

Implementar sistema de workflows de aprobación configurables que permiten definir flujos multi-paso para publicación de contenido. Soporta estados custom, asignación de revisores, notificaciones, y reglas de transición, permitiendo adaptar el proceso editorial a las necesidades de cada organización.

---

## User Scenarios & Testing

### User Story 1 - Submit for Review (Priority: P1)

El editor puede enviar contenido para revisión en lugar de publicar directamente.

**Why this priority**: El flujo básico de submit-review-approve es el core del feature.

**Independent Test**: Editor envía post para revisión, revisor recibe notificación, aprueba, se publica.

**Acceptance Scenarios**:

1. **Given** documento draft, **When** editor hace click en "Submit for Review", **Then** cambia a estado "pending_review"
2. **Given** documento en revisión, **When** revisor asignado accede, **Then** puede aprobar o rechazar
3. **Given** documento aprobado, **When** se aprueba, **Then** se publica automáticamente
4. **Given** documento rechazado, **When** se rechaza, **Then** vuelve a draft con comentarios

---

### User Story 2 - Multi-step Workflow (Priority: P1)

El administrador puede configurar workflows con múltiples pasos de aprobación.

**Why this priority**: Organizaciones grandes necesitan múltiples niveles de revisión.

**Independent Test**: Workflow Draft -> Legal Review -> Editorial Review -> Published.

**Acceptance Scenarios**:

1. **Given** workflow de 3 pasos, **When** documento avanza, **Then** pasa por cada paso en orden
2. **Given** paso actual, **When** se aprueba, **Then** avanza al siguiente paso
3. **Given** paso intermedio, **When** se rechaza, **Then** vuelve al paso anterior o inicio
4. **Given** último paso, **When** se aprueba, **Then** el documento se publica

---

### User Story 3 - Reviewer Assignment (Priority: P1)

El sistema asigna revisores según configuración del workflow o manualmente.

**Why this priority**: Saber quién debe revisar es esencial para el flujo.

**Independent Test**: Workflow asigna automáticamente a usuarios con rol "Editor Senior" en paso de revisión.

**Acceptance Scenarios**:

1. **Given** paso con rol asignado, **When** documento llega, **Then** todos los usuarios con ese rol pueden revisar
2. **Given** paso con usuario específico, **When** documento llega, **Then** solo ese usuario puede revisar
3. **Given** asignación manual, **When** se requiere, **Then** se puede seleccionar revisor específico
4. **Given** múltiples revisores, **When** cualquiera aprueba, **Then** el documento avanza (configurable)

---

### User Story 4 - Review Interface (Priority: P1)

El revisor tiene una interfaz clara para ver qué documentos debe revisar y tomar acción.

**Why this priority**: UX de revisión impacta directamente la productividad.

**Independent Test**: Ver inbox de documentos pendientes de mi revisión con acciones claras.

**Acceptance Scenarios**:

1. **Given** revisor logueado, **When** accede al dashboard, **Then** ve lista de documentos pendientes
2. **Given** documento en revisión, **When** lo abro, **Then** veo contenido + diff vs versión anterior
3. **Given** decisión de revisor, **When** apruebo/rechazo, **Then** puedo agregar comentario
4. **Given** documento rechazado, **When** editor lo corrige, **Then** puede re-enviar para revisión

---

### User Story 5 - Workflow Configuration (Priority: P2)

El administrador puede crear y modificar workflows sin código.

**Why this priority**: Flexibilidad sin código reduce barrera de adopción.

**Independent Test**: Crear workflow custom con 4 pasos usando UI de configuración.

**Acceptance Scenarios**:

1. **Given** panel de configuración, **When** creo workflow, **Then** defino nombre, pasos, y transiciones
2. **Given** un paso, **When** configuro, **Then** defino nombre, revisores, y reglas
3. **Given** workflow existente, **When** edito, **Then** los documentos en progreso pueden continuar o reiniciar
4. **Given** múltiples workflows, **When** asigno a schema, **Then** ese tipo de documento usa ese workflow

---

### User Story 6 - Notifications & Reminders (Priority: P2)

El sistema notifica a los involucrados en cada etapa del workflow.

**Why this priority**: Sin notificaciones, los documentos quedan estancados.

**Independent Test**: Revisor recibe email cuando documento llega a su bandeja.

**Acceptance Scenarios**:

1. **Given** documento enviado a revisión, **When** llega, **Then** revisor recibe notificación
2. **Given** documento aprobado/rechazado, **When** ocurre, **Then** editor recibe notificación
3. **Given** documento en revisión por 48h, **When** configuro reminder, **Then** se envía recordatorio
4. **Given** documento estancado, **When** escalación configurada, **Then** se notifica a supervisor

---

### Edge Cases

- ¿Qué pasa si el revisor asignado ya no tiene acceso? Fallback a rol, notificar admin
- ¿Qué pasa si se modifica workflow con documentos en progreso? Opción de migrar o mantener workflow anterior
- ¿Qué pasa con aprobaciones paralelas (A y B deben aprobar)? Soporte para gates paralelos
- ¿Qué pasa si se necesita aprobación urgente? Bypass con audit trail y permisos especiales

---

## Requirements

### Functional Requirements

**Workflow Definition:**
- **FR-001**: Sistema DEBE permitir crear workflows con nombre y descripción
- **FR-002**: Sistema DEBE permitir definir pasos (stages) con orden
- **FR-003**: Sistema DEBE permitir configurar transiciones entre pasos
- **FR-004**: Sistema DEBE permitir asignar workflow a tipos de documento específicos

**Stages:**
- **FR-005**: Sistema DEBE soportar tipos de stage: draft, review, approved, published, rejected
- **FR-006**: Sistema DEBE permitir configurar quién puede actuar en cada stage (rol o usuario)
- **FR-007**: Sistema DEBE permitir reglas de entrada/salida por stage
- **FR-008**: Sistema DEBE permitir stages paralelos (requiere múltiples aprobaciones)

**Actions:**
- **FR-009**: Sistema DEBE soportar acciones: submit, approve, reject, request_changes
- **FR-010**: Sistema DEBE permitir agregar comentario obligatorio/opcional en acciones
- **FR-011**: Sistema DEBE registrar cada acción con timestamp, usuario, y comentario
- **FR-012**: Sistema DEBE permitir bypass de workflow con permisos especiales

**Notifications:**
- **FR-013**: Sistema DEBE notificar cuando documento llega a un stage
- **FR-014**: Sistema DEBE notificar cuando documento es aprobado/rechazado
- **FR-015**: Sistema DEBE soportar reminders para documentos estancados
- **FR-016**: Sistema DEBE permitir configurar escalación automática

**UI:**
- **FR-017**: Sistema DEBE mostrar inbox de documentos pendientes de acción
- **FR-018**: Sistema DEBE mostrar estado actual del workflow en el documento
- **FR-019**: Sistema DEBE mostrar historial de acciones del workflow
- **FR-020**: Sistema DEBE mostrar diff entre versiones en review

### Key Entities

- **Workflow**: Definición del flujo (name, stages, transitions)
- **WorkflowStage**: Paso del workflow (name, type, reviewers)
- **WorkflowTransition**: Transición válida entre stages
- **WorkflowInstance**: Instancia de workflow para un documento
- **WorkflowAction**: Acción tomada (submit, approve, reject, etc.)

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Submit for review completa en <3 clicks
- **SC-002**: Notificaciones llegan en <30 segundos después de acción
- **SC-003**: Inbox de revisión carga en <2 segundos con 100+ documentos
- **SC-004**: Crear workflow nuevo toma <5 minutos en UI de configuración
- **SC-005**: 100% de acciones tienen audit trail completo
- **SC-006**: Documentos no quedan estancados >configurado sin notificación

---

## Technical Notes

### Workflow Definition Schema

```typescript
interface Workflow {
  id: string;
  name: string;
  description?: string;
  documentTypes: string[]; // Qué schemas usan este workflow
  stages: WorkflowStage[];
  transitions: WorkflowTransition[];
  settings: {
    allowBypass: boolean;
    bypassRoles: string[];
    reminderAfterHours: number;
    escalateAfterHours: number;
  };
}

interface WorkflowStage {
  id: string;
  name: string;
  type: 'draft' | 'review' | 'approved' | 'published' | 'rejected';
  order: number;
  reviewers: {
    type: 'role' | 'user' | 'author' | 'field'; // 'field' = campo del documento
    value: string; // roleId, oderId, fieldPath
  };
  rules: {
    requireComment: boolean;
    requiredApprovals?: number; // Para stages paralelos
    autoAdvanceAfterHours?: number;
  };
}

interface WorkflowTransition {
  id: string;
  from: string; // stageId
  to: string;   // stageId
  action: 'submit' | 'approve' | 'reject' | 'request_changes' | 'publish';
  conditions?: string; // Expresión evaluable
}
```

### Workflow Instance

```typescript
interface WorkflowInstance {
  id: string;
  workflowId: string;
  documentId: string;
  currentStageId: string;
  history: WorkflowAction[];
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowAction {
  id: string;
  instanceId: string;
  stageId: string;
  action: string;
  userId: string;
  comment?: string;
  createdAt: Date;
}
```

### API Endpoints

```typescript
// Obtener estado del workflow de un documento
GET /api/documents/:id/workflow
// Returns: { currentStage, availableActions, history }

// Ejecutar acción del workflow
POST /api/documents/:id/workflow/action
// Body: { action: 'approve', comment: '...' }

// Inbox de documentos pendientes
GET /api/workflow/inbox
// Returns: [{ document, stage, waitingSince }]
```

### UI Flow

```
┌─────────────────────────────────────────────────────────┐
│                Document: "Q1 Report"                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Workflow: Editorial Review                              │
│ ┌───────────────────────────────────────────────────┐   │
│ │ ✓ Draft → ✓ Submitted → ● Legal Review → Edit. → Pub│   │
│ └───────────────────────────────────────────────────┘   │
│                                                         │
│ Current Stage: Legal Review                             │
│ Assigned to: Legal Team                                 │
│ Waiting since: 2 hours ago                              │
│                                                         │
│ Actions:                                                │
│ [✓ Approve] [✗ Reject] [Request Changes]                │
│                                                         │
│ Comment (required for reject):                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Please review section 3...                          │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ History:                                                │
│ • Jan 15, 10:30 - Juan submitted for review            │
│ • Jan 15, 09:00 - Juan created draft                   │
└─────────────────────────────────────────────────────────┘
```

---

## Out of Scope (This Spec)

- Workflows visuales drag-and-drop (builder avanzado)
- Conditional branching complejo (if/else)
- Integration con sistemas externos de workflow (JIRA, etc.)
- Audit compliance específico (SOX, etc.)
