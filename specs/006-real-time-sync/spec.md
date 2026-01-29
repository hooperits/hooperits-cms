# Feature Specification: Real-Time Sync

**Feature Branch**: `006-real-time-sync`
**Created**: 2026-01-29
**Status**: Draft
**Dependencies**: 001-cms-core
**Complexity**: L

---

## Executive Summary

Implementar sincronización en tiempo real usando WebSockets para notificar cambios de contenido instantáneamente. Esto permite que el admin UI refleje cambios de otros editores, que el frontend pueda recibir actualizaciones live, y sienta las bases para colaboración real-time.

---

## User Scenarios & Testing

### User Story 1 - Admin Live Updates (Priority: P1)

Cuando un editor guarda un documento, otros editores ven la actualización sin recargar la página.

**Why this priority**: Evita conflictos y confusión cuando múltiples editores trabajan simultáneamente.

**Independent Test**: Abrir mismo documento en dos ventanas, editar en una, ver cambio reflejado en la otra.

**Acceptance Scenarios**:

1. **Given** dos editores viendo la lista de posts, **When** uno crea un nuevo post, **Then** el otro ve el post aparecer inmediatamente
2. **Given** dos editores viendo el mismo documento, **When** uno guarda cambios, **Then** el otro ve notificación de "documento actualizado"
3. **Given** un documento siendo editado, **When** otro usuario lo elimina, **Then** el editor ve mensaje de "documento eliminado"
4. **Given** conexión perdida, **When** se reconecta, **Then** la UI se sincroniza automáticamente

---

### User Story 2 - Presence Indicators (Priority: P1)

El editor puede ver quién más está viendo o editando el mismo documento.

**Why this priority**: Saber quién más está trabajando evita conflictos y permite coordinación.

**Independent Test**: Ver avatar de otro usuario cuando ambos abren el mismo documento.

**Acceptance Scenarios**:

1. **Given** un documento abierto, **When** otro usuario lo abre, **Then** veo su avatar/nombre en la UI
2. **Given** múltiples usuarios en el documento, **When** uno sale, **Then** su indicador desaparece
3. **Given** presencia de otros usuarios, **When** paso el mouse sobre un avatar, **Then** veo su nombre y hace cuánto entró
4. **Given** un documento, **When** otro usuario está editando un campo específico, **Then** veo indicador de dónde está

---

### User Story 3 - Frontend Live Preview (Priority: P2)

El frontend puede suscribirse a cambios para implementar preview live mientras el editor trabaja.

**Why this priority**: Preview live es una experiencia de edición superior.

**Independent Test**: Ver cambios en el preview del sitio mientras edito en el admin.

**Acceptance Scenarios**:

1. **Given** preview mode activo en frontend, **When** editor modifica contenido, **Then** el preview se actualiza en <1 segundo
2. **Given** suscripción a un documento, **When** se publica, **Then** el frontend recibe evento
3. **Given** cliente SDK, **When** me suscribo a cambios, **Then** recibo callback con datos actualizados
4. **Given** múltiples documentos suscritos, **When** hay cambios, **Then** solo recibo los relevantes

---

### User Story 4 - Connection Management (Priority: P1)

El sistema maneja conexiones WebSocket de forma robusta con reconexión automática.

**Why this priority**: Conexiones inestables no deben romper la experiencia del usuario.

**Independent Test**: Desconectar WiFi por 30 segundos, reconectar, verificar que todo sigue funcionando.

**Acceptance Scenarios**:

1. **Given** conexión WebSocket activa, **When** pierdo conexión, **Then** veo indicador de "reconectando"
2. **Given** reconexión en progreso, **When** la conexión se restablece, **Then** me re-suscribo automáticamente
3. **Given** múltiples intentos fallidos de reconexión, **When** el límite se alcanza, **Then** muestro error con opción de reintentar manual
4. **Given** conexión restablecida, **When** hubo cambios mientras estaba offline, **Then** recibo los cambios pendientes

---

### User Story 5 - Subscription Management (Priority: P2)

El desarrollador puede configurar qué cambios recibir para optimizar tráfico.

**Why this priority**: Suscripciones granulares reducen tráfico y mejoran performance.

**Independent Test**: Suscribirse solo a cambios de posts publicados y verificar que no llegan otros eventos.

**Acceptance Scenarios**:

1. **Given** el cliente SDK, **When** me suscribo con filtro `{_type: "post"}`, **Then** solo recibo cambios de posts
2. **Given** suscripción activa, **When** quiero dejar de recibir eventos, **Then** puedo unsuscribirme
3. **Given** suscripciones múltiples, **When** me suscribo al mismo recurso dos veces, **Then** se deduplica
4. **Given** el admin UI, **When** cambio de documento, **Then** la suscripción se actualiza automáticamente

---

### Edge Cases

- ¿Qué pasa si hay 100+ usuarios conectados al mismo tiempo? Escalabilidad con rooms/channels
- ¿Qué pasa si un cliente envía muchos mensajes rápidamente? Rate limiting por cliente
- ¿Qué pasa con mensajes muy grandes? Límite de tamaño, fragmentación si es necesario
- ¿Qué pasa si el servidor reinicia? Clientes reconectan automáticamente

---

## Requirements

### Functional Requirements

**WebSocket Infrastructure:**
- **FR-001**: Sistema DEBE implementar servidor WebSocket en la misma instancia del CMS
- **FR-002**: Sistema DEBE autenticar conexiones WebSocket usando tokens de sesión
- **FR-003**: Sistema DEBE escalar horizontalmente usando Redis pub/sub si hay múltiples instancias
- **FR-004**: Sistema DEBE soportar heartbeat para detectar conexiones muertas

**Event Types:**
- **FR-005**: Sistema DEBE emitir eventos: document.created, document.updated, document.deleted
- **FR-006**: Sistema DEBE emitir eventos: document.published, document.unpublished
- **FR-007**: Sistema DEBE emitir eventos: user.joined, user.left (presencia)
- **FR-008**: Sistema DEBE incluir metadata relevante en cada evento (userId, timestamp, documentId)

**Presence:**
- **FR-009**: Sistema DEBE trackear qué usuarios tienen qué documentos abiertos
- **FR-010**: Sistema DEBE notificar cuando usuarios entran/salen de un documento
- **FR-011**: Sistema DEBE limpiar presencia cuando conexión se pierde
- **FR-012**: Sistema DEBE soportar indicador de "editando campo X" para presencia granular

**Client SDK:**
- **FR-013**: Cliente SDK DEBE proveer API para conectar a WebSocket
- **FR-014**: Cliente SDK DEBE implementar reconexión automática con backoff exponencial
- **FR-015**: Cliente SDK DEBE proveer métodos para subscribe/unsubscribe
- **FR-016**: Cliente SDK DEBE emitir eventos locales que la UI puede escuchar

**Admin UI:**
- **FR-017**: Admin UI DEBE conectar a WebSocket automáticamente al cargar
- **FR-018**: Admin UI DEBE mostrar indicadores de presencia en documentos
- **FR-019**: Admin UI DEBE mostrar notificación cuando documento cambia externamente
- **FR-020**: Admin UI DEBE mostrar estado de conexión (conectado/reconectando/offline)

### Key Entities

- **WebSocketConnection**: Conexión de un cliente con metadata (userId, sessionId)
- **Subscription**: Suscripción de un cliente a ciertos eventos/documentos
- **PresenceInfo**: Información de presencia de un usuario (documento, campo, timestamp)
- **RealtimeEvent**: Evento emitido por el sistema (type, payload, timestamp)

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Eventos se propagan a clientes suscritos en <100ms
- **SC-002**: Reconexión automática ocurre en <5 segundos después de detectar desconexión
- **SC-003**: Sistema soporta 500+ conexiones WebSocket simultáneas en un servidor estándar
- **SC-004**: Presencia se actualiza en <200ms cuando usuario cambia de documento
- **SC-005**: Memory leak = 0 después de 1000 ciclos de connect/disconnect
- **SC-006**: CPU overhead de WebSocket <5% bajo uso normal

---

## Technical Notes

### Event Structure

```typescript
interface RealtimeEvent {
  type:
    | 'document.created'
    | 'document.updated'
    | 'document.deleted'
    | 'document.published'
    | 'document.unpublished'
    | 'presence.joined'
    | 'presence.left'
    | 'presence.updated';
  documentId?: string;
  documentType?: string;
  userId: string;
  timestamp: string;
  payload: Record<string, unknown>;
}
```

### Client SDK Usage

```typescript
import { createRealtimeClient } from '@hooperits/cms/realtime';

const realtime = createRealtimeClient({
  url: 'wss://cms.example.com/realtime',
  token: sessionToken,
});

// Conectar
await realtime.connect();

// Suscribirse a cambios de un tipo
const unsubscribe = realtime.subscribe(
  { _type: 'post' },
  (event) => {
    console.log('Post changed:', event);
  }
);

// Obtener presencia en un documento
realtime.getPresence('doc-123').then(users => {
  console.log('Users viewing:', users);
});

// Reportar mi presencia
realtime.setPresence({
  documentId: 'doc-123',
  field: 'title',
});

// Desconectar
realtime.disconnect();
```

### Server Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │     │   Client    │     │   Client    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    WebSocket Server
                           │
                    ┌──────┴──────┐
                    │             │
              ┌─────▼─────┐ ┌─────▼─────┐
              │ Instance 1│ │ Instance 2│
              └─────┬─────┘ └─────┬─────┘
                    │             │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    Redis    │  (pub/sub para scaling)
                    │   (optional)│
                    └─────────────┘
```

### Admin UI Integration

```tsx
// Hook de React para estado de conexión
function useRealtimeStatus() {
  const [status, setStatus] = useState<'connected' | 'reconnecting' | 'offline'>('offline');
  // ... WebSocket connection management
  return status;
}

// Hook para presencia
function useDocumentPresence(documentId: string) {
  const [users, setUsers] = useState<User[]>([]);
  // ... presence tracking
  return users;
}

// En componente
function DocumentEditor({ document }) {
  const status = useRealtimeStatus();
  const presentUsers = useDocumentPresence(document._id);

  return (
    <div>
      <StatusIndicator status={status} />
      <PresenceAvatars users={presentUsers} />
      {/* ... editor */}
    </div>
  );
}
```

---

## Out of Scope (This Spec)

- Edición colaborativa real-time (CRDTs, OT) - ver spec 010
- Offline-first con sync - ver spec 021
- Webhooks para servicios externos - ver spec 013
