# Feature Specification: Real-Time Collaboration

**Feature Branch**: `010-real-time-collaboration`
**Created**: 2026-01-29
**Status**: Draft
**Dependencies**: 001-cms-core, 005-rich-text-portable, 006-real-time-sync
**Complexity**: XL

---

## Executive Summary

Implementar edición colaborativa en tiempo real similar a Google Docs, donde múltiples editores pueden trabajar en el mismo documento simultáneamente. Incluye cursores de presencia, resolución de conflictos automática usando CRDTs, y sincronización instantánea de cambios.

---

## User Scenarios & Testing

### User Story 1 - Simultaneous Editing (Priority: P1)

Múltiples editores pueden editar el mismo documento al mismo tiempo sin perder cambios de nadie.

**Why this priority**: Es el core de la colaboración real-time.

**Independent Test**: Dos usuarios editan diferentes párrafos del mismo artículo, ambos cambios persisten.

**Acceptance Scenarios**:

1. **Given** dos editores en el mismo documento, **When** ambos escriben en diferentes campos, **Then** ambos cambios se guardan
2. **Given** ediciones simultáneas en el mismo párrafo, **When** se sincronizan, **Then** los cambios se fusionan automáticamente
3. **Given** latencia de red, **When** los cambios llegan desordenados, **Then** el resultado final es consistente para todos
4. **Given** un usuario offline temporalmente, **When** reconecta, **Then** sus cambios se sincronizan sin perder nada

---

### User Story 2 - Presence Cursors (Priority: P1)

Cada editor puede ver dónde están trabajando los otros editores en tiempo real.

**Why this priority**: La presencia visual evita conflictos y mejora la coordinación.

**Independent Test**: Ver cursor de María con su color/nombre mientras ella escribe en otro párrafo.

**Acceptance Scenarios**:

1. **Given** múltiples editores en el documento, **When** uno posiciona el cursor, **Then** los otros ven su cursor con nombre/color
2. **Given** un editor escribiendo, **When** tipea, **Then** los otros ven el cursor moverse en tiempo real
3. **Given** un editor seleccionando texto, **When** hace la selección, **Then** los otros ven el área seleccionada
4. **Given** un editor que sale del documento, **When** se desconecta, **Then** su cursor desaparece

---

### User Story 3 - Conflict Resolution (Priority: P1)

Cuando dos editores modifican el mismo texto simultáneamente, el sistema resuelve conflictos automáticamente de forma predecible.

**Why this priority**: Conflictos mal manejados causan pérdida de datos y frustración.

**Independent Test**: Dos usuarios editan la misma palabra al mismo tiempo, el resultado es determinístico.

**Acceptance Scenarios**:

1. **Given** dos usuarios editando la misma línea, **When** hay conflicto, **Then** se resuelve automáticamente sin intervención
2. **Given** conflicto resuelto, **When** ambos usuarios ven el resultado, **Then** ven exactamente lo mismo
3. **Given** ediciones conflictivas, **When** la resolución no es ideal, **Then** el historial permite ver/recuperar versiones anteriores
4. **Given** operaciones offline, **When** el usuario reconecta, **Then** sus cambios se integran correctamente

---

### User Story 4 - Field-level Collaboration (Priority: P2)

La colaboración funciona no solo en rich text sino en todos los campos del documento.

**Why this priority**: Los documentos tienen múltiples campos, no solo contenido.

**Independent Test**: Un editor cambia el título mientras otro edita la descripción, ambos cambios se guardan.

**Acceptance Scenarios**:

1. **Given** un documento con múltiples campos, **When** dos editores trabajan en campos diferentes, **Then** no hay conflictos
2. **Given** campos de texto simple, **When** dos editan el mismo campo, **Then** se usa estrategia "último gana" con warning
3. **Given** campos de rich text, **When** dos editan simultáneamente, **Then** se usa CRDT para merge
4. **Given** campos de array (ej: tags), **When** dos agregan items, **Then** ambos items aparecen

---

### User Story 5 - Awareness Indicators (Priority: P2)

La UI muestra claramente qué campos están siendo editados por otros usuarios.

**Why this priority**: Indicators previenen conflictos antes de que ocurran.

**Independent Test**: Ver campo "título" resaltado con avatar de quien lo está editando.

**Acceptance Scenarios**:

1. **Given** otro usuario editando un campo, **When** veo el formulario, **Then** el campo tiene indicador de quién lo edita
2. **Given** campo siendo editado por otro, **When** intento editarlo también, **Then** veo warning amigable
3. **Given** múltiples editores, **When** están en diferentes campos, **Then** cada campo muestra su editor
4. **Given** un usuario deja de editar un campo, **When** mueve el cursor, **Then** el indicador desaparece

---

### User Story 6 - Session Management (Priority: P2)

El sistema maneja sesiones de edición colaborativa de forma robusta.

**Why this priority**: Sesiones estables son prerequisito para buena experiencia.

**Independent Test**: Cerrar laptop, reabrir, continuar editando sin perder cambios.

**Acceptance Scenarios**:

1. **Given** una sesión de edición, **When** pierdo conexión brevemente, **Then** mis cambios locales se preservan
2. **Given** reconexión, **When** vuelvo online, **Then** mis cambios se sincronizan automáticamente
3. **Given** sesión prolongada offline, **When** reconecto, **Then** veo si hubo cambios remotos y cómo se fusionaron
4. **Given** múltiples pestañas abiertas, **When** edito en una, **Then** las otras se actualizan o muestran warning

---

### Edge Cases

- ¿Qué pasa si dos usuarios eliminan y editan el mismo bloque? La eliminación generalmente gana, con opción de recuperar
- ¿Qué pasa con operaciones en campos no-CRDT como números? Último valor gana con notificación
- ¿Qué pasa si un usuario tiene conexión muy lenta? Indicador de "sincronizando", cambios se bufferean
- ¿Qué pasa con documentos muy grandes? Sincronización por chunks, lazy loading de secciones

---

## Requirements

### Functional Requirements

**CRDT Implementation:**
- **FR-001**: Sistema DEBE usar CRDTs para rich text (Portable Text)
- **FR-002**: Sistema DEBE garantizar convergencia eventual en todos los clientes
- **FR-003**: Sistema DEBE manejar operaciones insert, delete, format en rich text
- **FR-004**: Sistema DEBE preservar intención del usuario en resolución de conflictos

**Presence:**
- **FR-005**: Sistema DEBE mostrar cursores remotos con nombre y color del usuario
- **FR-006**: Sistema DEBE actualizar posición de cursores en tiempo real (<100ms latencia)
- **FR-007**: Sistema DEBE mostrar selecciones de texto de otros usuarios
- **FR-008**: Sistema DEBE limpiar presencia cuando usuario sale

**Synchronization:**
- **FR-009**: Sistema DEBE sincronizar cambios en <200ms bajo condiciones normales
- **FR-010**: Sistema DEBE bufferear cambios cuando hay desconexión
- **FR-011**: Sistema DEBE reconciliar cambios offline al reconectar
- **FR-012**: Sistema DEBE mostrar indicador de estado de sincronización

**Field-level:**
- **FR-013**: Sistema DEBE trackear presencia a nivel de campo, no solo documento
- **FR-014**: Sistema DEBE indicar qué campos están siendo editados por quién
- **FR-015**: Sistema DEBE usar estrategia apropiada por tipo de campo (CRDT vs LWW)
- **FR-016**: Sistema DEBE permitir bloqueo optimista de campos para evitar conflictos

**Session:**
- **FR-017**: Sistema DEBE persistir cambios locales antes de sincronizar
- **FR-018**: Sistema DEBE detectar y manejar múltiples pestañas del mismo usuario
- **FR-019**: Sistema DEBE recuperar sesión después de crash del navegador
- **FR-020**: Sistema DEBE mostrar historial de cambios de la sesión colaborativa

### Key Entities

- **CollaborativeSession**: Sesión de edición con participantes y estado
- **Operation**: Operación CRDT (insert, delete, format, etc.)
- **PresenceState**: Estado de presencia de un usuario (cursor, selección, campo activo)
- **SyncState**: Estado de sincronización (synced, pending, conflict)

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Cambios se propagan a otros usuarios en <200ms (p95)
- **SC-002**: Cursores de presencia tienen <100ms de latencia
- **SC-003**: 100% de operaciones convergen al mismo estado final (determinismo)
- **SC-004**: Zero pérdida de datos en escenarios de reconexión
- **SC-005**: Sistema soporta 10+ usuarios editando simultáneamente sin degradación
- **SC-006**: Conflictos se resuelven automáticamente sin intervención en 99% de casos

---

## Technical Notes

### CRDT Selection

Para Portable Text, usar **Yjs** o similar:
- Soporta text, arrays, maps
- Probado en producción (Notion, etc.)
- Tiene bindings para múltiples frameworks

```typescript
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

// Crear documento CRDT
const ydoc = new Y.Doc();
const ytext = ydoc.getText('content');

// Conectar al servidor de sync
const provider = new WebsocketProvider(
  'wss://cms.example.com/collab',
  documentId,
  ydoc
);

// Escuchar cambios
ytext.observe(event => {
  // Actualizar UI con cambios
});
```

### Presence System

```typescript
interface UserPresence {
  oderId: string;
  documentId: string;
  cursor?: {
    fieldPath: string;
    position: number;
  };
  selection?: {
    fieldPath: string;
    start: number;
    end: number;
  };
  activeField?: string;
  color: string;
  name: string;
  avatar?: string;
  lastSeen: Date;
}

// Awareness protocol (parte de Yjs)
const awareness = provider.awareness;

awareness.setLocalState({
  user: { name: 'Juan', color: '#ff0000' },
  cursor: { position: 42 },
});

awareness.on('change', () => {
  const states = awareness.getStates();
  // Renderizar cursores de otros usuarios
});
```

### Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        Frontend                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │   Editor    │  │  Presence   │  │   Cursors   │      │
│  │  Component  │  │   Layer     │  │   Layer     │      │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘      │
│         │                │                │              │
│         └────────────────┼────────────────┘              │
│                          │                               │
│                    ┌─────▼─────┐                         │
│                    │    Yjs    │                         │
│                    │   Doc     │                         │
│                    └─────┬─────┘                         │
└──────────────────────────┼───────────────────────────────┘
                           │ WebSocket
                           │
┌──────────────────────────▼───────────────────────────────┐
│                     Backend                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │  y-websocket│  │   Presence  │  │  Persistence│      │
│  │   Provider  │  │   Server    │  │   Layer     │      │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘      │
│         │                │                │              │
│         └────────────────┼────────────────┘              │
│                          │                               │
│                    ┌─────▼─────┐                         │
│                    │ PostgreSQL│ (state persistence)     │
│                    └───────────┘                         │
└──────────────────────────────────────────────────────────┘
```

### Field Type Strategies

| Field Type | Strategy | Notes |
|------------|----------|-------|
| Rich Text (Portable) | CRDT (Yjs) | Full collaborative editing |
| Text (short) | LWW + presence lock | Last Write Wins with visual lock |
| Number | LWW | Último valor gana |
| Boolean | LWW | Último valor gana |
| Array (simple) | CRDT Set | Items se fusionan |
| Reference | LWW + warning | Notificar si otro cambió |
| Image | LWW | Asset reference |

---

## Out of Scope (This Spec)

- Comentarios inline colaborativos (ver spec 009)
- Sugerencias estilo "Track Changes" (futuro)
- Voice/video durante colaboración
- Collaborative canvas/whiteboard
