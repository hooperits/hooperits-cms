# Feature Specification: Webhooks & Events

**Feature Branch**: `013-webhooks-events`
**Created**: 2026-01-29
**Status**: Draft
**Dependencies**: 001-cms-core
**Complexity**: M

---

## Executive Summary

Implementar sistema de webhooks que permite notificar a servicios externos cuando ocurren eventos en el CMS (publicación, edición, eliminación). Esto habilita integraciones con build systems (Vercel, Netlify), servicios de notificación, analytics, y cualquier sistema externo que necesite reaccionar a cambios de contenido.

---

## User Scenarios & Testing

### User Story 1 - Webhook Configuration (Priority: P1)

El administrador puede configurar webhooks que se disparan cuando ocurren eventos específicos.

**Why this priority**: Configurar webhooks es el prerequisito para toda la funcionalidad.

**Independent Test**: Crear webhook que llama a URL de Vercel cuando se publica un post.

**Acceptance Scenarios**:

1. **Given** el panel de configuración, **When** creo un webhook, **Then** puedo definir URL, eventos y filtros
2. **Given** un webhook configurado, **When** ocurre el evento, **Then** se hace POST a la URL con payload
3. **Given** webhook con filtros, **When** evento no cumple filtro, **Then** no se dispara
4. **Given** múltiples webhooks para mismo evento, **When** ocurre evento, **Then** todos se disparan

---

### User Story 2 - Event Types (Priority: P1)

El sistema dispara webhooks para diferentes tipos de eventos del CMS.

**Why this priority**: Variedad de eventos permite diversas integraciones.

**Independent Test**: Configurar webhook diferente para create, update, delete, publish.

**Acceptance Scenarios**:

1. **Given** webhook para "document.created", **When** creo documento, **Then** webhook se dispara
2. **Given** webhook para "document.published", **When** publico documento, **Then** webhook se dispara
3. **Given** webhook para "media.uploaded", **When** subo imagen, **Then** webhook se dispara
4. **Given** webhook para "user.created", **When** creo usuario, **Then** webhook se dispara

---

### User Story 3 - Webhook Filtering (Priority: P2)

El administrador puede filtrar qué eventos disparan un webhook basado en tipo de documento u otras condiciones.

**Why this priority**: Filtros evitan notificaciones innecesarias y reducen ruido.

**Independent Test**: Webhook que solo dispara para posts publicados, no para páginas.

**Acceptance Scenarios**:

1. **Given** webhook filtrado por tipo "post", **When** publico página, **Then** no se dispara
2. **Given** webhook filtrado por tipo "post", **When** publico post, **Then** se dispara
3. **Given** webhook con filtro custom, **When** condición no se cumple, **Then** no se dispara
4. **Given** múltiples filtros, **When** se combinan con AND, **Then** todos deben cumplirse

---

### User Story 4 - Webhook Security (Priority: P1)

Los webhooks incluyen firma de seguridad para que el receptor pueda verificar autenticidad.

**Why this priority**: Seguridad es crítica para evitar ataques de spoofing.

**Independent Test**: Receptor verifica firma HMAC del webhook antes de procesarlo.

**Acceptance Scenarios**:

1. **Given** webhook configurado con secret, **When** se dispara, **Then** incluye header de firma
2. **Given** receptor con secret compartido, **When** recibe webhook, **Then** puede verificar firma
3. **Given** webhook sin secret válido, **When** receptor verifica, **Then** rechaza la request
4. **Given** admin, **When** genera nuevo secret, **Then** webhooks futuros usan el nuevo secret

---

### User Story 5 - Webhook Reliability (Priority: P1)

El sistema garantiza entrega de webhooks con reintentos automáticos en caso de fallo.

**Why this priority**: Webhooks no entregados causan desincronización.

**Independent Test**: Webhook falla, sistema reintenta 3 veces con backoff exponencial.

**Acceptance Scenarios**:

1. **Given** webhook que falla (500 error), **When** pasan 30 segundos, **Then** se reintenta
2. **Given** reintentos fallidos, **When** alcanza límite, **Then** se marca como failed y notifica
3. **Given** webhook exitoso (200), **When** se entrega, **Then** se marca como delivered
4. **Given** receptor lento (timeout), **When** excede límite, **Then** se reintenta

---

### User Story 6 - Webhook Monitoring (Priority: P2)

El administrador puede ver logs de webhooks disparados y su estado de entrega.

**Why this priority**: Debugging y monitoreo son esenciales para mantenimiento.

**Independent Test**: Ver historial de webhooks mostrando éxitos, fallos, y payloads.

**Acceptance Scenarios**:

1. **Given** webhooks disparados, **When** abro el monitor, **Then** veo lista con estado
2. **Given** webhook fallido, **When** reviso detalles, **Then** veo error y payload
3. **Given** webhook fallido, **When** quiero reintentar manual, **Then** puedo hacerlo
4. **Given** historial largo, **When** filtro por webhook/estado/fecha, **Then** encuentro lo buscado

---

### Edge Cases

- ¿Qué pasa si el servidor receptor está caído por horas? Cola de webhooks con límite de tiempo
- ¿Qué pasa con loops (webhook dispara acción que dispara webhook)? Detectar y prevenir loops
- ¿Qué pasa con webhooks muy lentos? Timeout configurable, procesamiento async
- ¿Qué pasa si hay 1000 documentos publicados a la vez (release)? Batching de webhooks

---

## Requirements

### Functional Requirements

**Webhook Configuration:**
- **FR-001**: Sistema DEBE permitir crear webhooks con URL, eventos, y descripción
- **FR-002**: Sistema DEBE permitir habilitar/deshabilitar webhooks
- **FR-003**: Sistema DEBE permitir filtrar por tipo de documento
- **FR-004**: Sistema DEBE permitir filtros custom con expresiones simples

**Events:**
- **FR-005**: Sistema DEBE emitir eventos: document.created, document.updated, document.deleted
- **FR-006**: Sistema DEBE emitir eventos: document.published, document.unpublished
- **FR-007**: Sistema DEBE emitir eventos: media.uploaded, media.deleted
- **FR-008**: Sistema DEBE emitir eventos: user.created, user.updated, user.deleted
- **FR-009**: Sistema DEBE emitir eventos: release.published (si spec 011 implementado)

**Payload:**
- **FR-010**: Payload DEBE incluir tipo de evento, timestamp, y datos relevantes
- **FR-011**: Payload DEBE incluir documento completo o diff según configuración
- **FR-012**: Payload DEBE incluir ID de usuario que causó el evento
- **FR-013**: Payload DEBE ser JSON serializable

**Security:**
- **FR-014**: Sistema DEBE generar secret único por webhook
- **FR-015**: Sistema DEBE firmar payloads con HMAC-SHA256
- **FR-016**: Sistema DEBE incluir firma en header `X-HOOPERITS-Signature`
- **FR-017**: Sistema DEBE permitir rotar secrets sin downtime

**Reliability:**
- **FR-018**: Sistema DEBE reintentar webhooks fallidos con backoff exponencial
- **FR-019**: Sistema DEBE marcar webhook como failed después de N reintentos
- **FR-020**: Sistema DEBE soportar timeout configurable (default 30s)
- **FR-021**: Sistema DEBE procesar webhooks en cola async para no bloquear

**Monitoring:**
- **FR-022**: Sistema DEBE loggear cada intento de webhook con resultado
- **FR-023**: Sistema DEBE mostrar historial de entregas por webhook
- **FR-024**: Sistema DEBE permitir reintentar manualmente webhooks fallidos
- **FR-025**: Sistema DEBE alertar cuando webhook tiene muchos fallos consecutivos

### Key Entities

- **Webhook**: Configuración de webhook (URL, events, filters, secret)
- **WebhookDelivery**: Registro de un intento de entrega
- **WebhookEvent**: Evento que dispara webhooks (type, payload, timestamp)

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Webhooks se disparan en <5 segundos después del evento
- **SC-002**: Tasa de entrega exitosa >99% para endpoints saludables
- **SC-003**: Reintentos automáticos recuperan 90% de fallos temporales
- **SC-004**: UI de configuración permite crear webhook en <1 minuto
- **SC-005**: Historial de entregas carga en <2 segundos para 10000 registros
- **SC-006**: 100% de webhooks incluyen firma verificable

---

## Technical Notes

### Webhook Payload

```typescript
interface WebhookPayload {
  event: string; // 'document.published'
  timestamp: string; // ISO 8601
  webhookId: string;
  // Datos del evento
  document?: {
    _id: string;
    _type: string;
    _rev: string;
    // ... campos del documento
  };
  // Metadata
  user: {
    id: string;
    email: string;
  };
  // Para updates, incluir cambios
  changes?: {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  };
}
```

### Signature Verification

```typescript
// En el servidor receptor
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// Uso
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-hooperits-signature'];
  const isValid = verifyWebhookSignature(
    JSON.stringify(req.body),
    signature,
    process.env.WEBHOOK_SECRET
  );

  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  // Procesar webhook...
});
```

### Retry Strategy

```typescript
const RETRY_DELAYS = [
  30 * 1000,      // 30 seconds
  5 * 60 * 1000,  // 5 minutes
  30 * 60 * 1000, // 30 minutes
  2 * 60 * 60 * 1000, // 2 hours
  24 * 60 * 60 * 1000, // 24 hours (final attempt)
];

async function deliverWebhook(delivery: WebhookDelivery): Promise<void> {
  try {
    const response = await fetch(delivery.webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-HOOPERITS-Signature': generateSignature(delivery.payload, delivery.webhook.secret),
        'X-HOOPERITS-Webhook-ID': delivery.webhookId,
        'X-HOOPERITS-Delivery-ID': delivery.id,
      },
      body: JSON.stringify(delivery.payload),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    if (response.ok) {
      await markDelivered(delivery);
    } else {
      await scheduleRetry(delivery);
    }
  } catch (error) {
    await scheduleRetry(delivery);
  }
}
```

### Admin UI Configuration

```
┌─────────────────────────────────────────────────────────┐
│                    Webhook Configuration                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Name: [Vercel Deploy Hook_________________]             │
│                                                         │
│ URL:  [https://api.vercel.com/v1/integrations...]       │
│                                                         │
│ Events:                                                 │
│ ☑ document.created    ☑ document.updated               │
│ ☐ document.deleted    ☑ document.published             │
│ ☐ media.uploaded      ☐ media.deleted                  │
│                                                         │
│ Filters:                                                │
│ Document Types: [post, page____________] (empty = all)  │
│ Custom Filter:  [status == "published"_____] (optional) │
│                                                         │
│ Secret: sk_webhook_abc123... [🔄 Rotate] [👁 Show]      │
│                                                         │
│ Status: ● Active   [Save] [Test Webhook] [Delete]      │
└─────────────────────────────────────────────────────────┘
```

---

## Out of Scope (This Spec)

- Incoming webhooks (recibir eventos de externos)
- Event sourcing completo
- GraphQL subscriptions (ver spec 019)
- Integración con servicios específicos (Zapier, etc.)
