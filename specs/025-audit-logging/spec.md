# Feature Specification: Audit Logging

**Feature Branch**: `025-audit-logging`
**Created**: 2026-01-29
**Status**: Draft
**Dependencies**: 001-cms-core
**Complexity**: M

---

## Executive Summary

Implementar sistema completo de audit logging para cumplimiento regulatorio (HIPAA, SOC2, GDPR). Registra todas las acciones significativas con detalle suficiente para auditorías, investigación de incidentes, y trazabilidad completa de cambios.

---

## User Scenarios & Testing

### User Story 1 - Action Logging (Priority: P1)

El sistema registra automáticamente todas las acciones significativas de usuarios.

**Why this priority**: Logging automático es la base de toda auditoría.

**Independent Test**: Crear, editar, eliminar documento y ver cada acción en el log.

**Acceptance Scenarios**:

1. **Given** usuario crea documento, **When** se guarda, **Then** acción se registra con detalles
2. **Given** usuario edita documento, **When** se guarda, **Then** se registra qué cambió (diff)
3. **Given** usuario elimina documento, **When** se elimina, **Then** se registra con snapshot previo
4. **Given** login/logout, **When** ocurren, **Then** se registran con IP y user agent

---

### User Story 2 - Audit Trail Viewing (Priority: P1)

El administrador puede ver el historial completo de acciones en el sistema.

**Why this priority**: Ver el trail es necesario para cualquier investigación.

**Independent Test**: Ver log de todas las acciones del último mes filtrado por usuario.

**Acceptance Scenarios**:

1. **Given** audit log, **When** lo abro, **Then** veo lista cronológica de acciones
2. **Given** filtros, **When** filtro por usuario, **Then** solo veo acciones de ese usuario
3. **Given** filtros, **When** filtro por tipo de acción, **Then** solo veo ese tipo
4. **Given** entrada del log, **When** veo detalle, **Then** muestra toda la información registrada

---

### User Story 3 - Document History (Priority: P1)

El administrador puede ver historial completo de un documento específico.

**Why this priority**: Trazabilidad por documento es el caso de uso más común.

**Independent Test**: Ver quién hizo qué cambios a un documento específico y cuándo.

**Acceptance Scenarios**:

1. **Given** documento, **When** abro su audit history, **Then** veo todas las acciones sobre él
2. **Given** audit history de documento, **When** veo edición, **Then** puedo ver el diff
3. **Given** documento eliminado, **When** busco en audit log, **Then** encuentro su historial
4. **Given** historial largo, **When** navego, **Then** tiene paginación y es performante

---

### User Story 4 - Compliance Reports (Priority: P2)

El administrador puede generar reportes de auditoría para compliance.

**Why this priority**: Reportes son requeridos para auditorías externas.

**Independent Test**: Generar reporte de acceso a datos sensibles del último trimestre.

**Acceptance Scenarios**:

1. **Given** reporte de compliance, **When** lo genero, **Then** incluye todas las acciones del período
2. **Given** reporte, **When** filtro por tipo de dato, **Then** solo incluye accesos a esos datos
3. **Given** formato requerido, **When** exporto, **Then** puedo elegir PDF, CSV, JSON
4. **Given** reporte programado, **When** configuro, **Then** se genera automáticamente

---

### User Story 5 - Data Retention (Priority: P2)

El administrador puede configurar políticas de retención de logs.

**Why this priority**: Regulaciones requieren retención específica (ej: 7 años para HIPAA).

**Independent Test**: Configurar retención de 365 días y verificar que logs antiguos se archivan.

**Acceptance Scenarios**:

1. **Given** política de retención, **When** configuro 365 días, **Then** logs >365 días se archivan
2. **Given** logs archivados, **When** necesito acceder, **Then** puedo restaurar del archivo
3. **Given** diferentes tipos de logs, **When** configuro, **Then** puedo tener retención diferente
4. **Given** regulación específica, **When** aplico preset HIPAA, **Then** configura retención correcta

---

### User Story 6 - Tamper Protection (Priority: P1)

Los logs de auditoría son inmutables y protegidos contra manipulación.

**Why this priority**: Logs manipulables no tienen valor para auditoría.

**Independent Test**: Intentar modificar un log entry y verificar que es imposible.

**Acceptance Scenarios**:

1. **Given** log entry, **When** intento modificar en DB, **Then** es detectado por checksum
2. **Given** logs, **When** hay gap en secuencia, **Then** se detecta y alerta
3. **Given** logs, **When** se exportan, **Then** incluyen firma verificable
4. **Given** admin malicioso, **When** intenta borrar logs, **Then** acción misma queda registrada

---

### Edge Cases

- ¿Qué pasa con operaciones bulk (import de 1000 docs)? Log agregado + detalle accesible
- ¿Qué pasa con datos muy sensibles (passwords)? Nunca logear valores sensibles, solo hashes
- ¿Qué pasa con logs de sistemas automatizados (cron)? Usuario "system" identificado
- ¿Qué pasa con volumen muy alto de logs? Compresión, archivado, sampling opcional

---

## Requirements

### Functional Requirements

**Event Logging:**
- **FR-001**: Sistema DEBE registrar creación de documentos
- **FR-002**: Sistema DEBE registrar modificación de documentos con diff
- **FR-003**: Sistema DEBE registrar eliminación de documentos con snapshot
- **FR-004**: Sistema DEBE registrar publicación/despublicación
- **FR-005**: Sistema DEBE registrar login/logout con IP y user agent
- **FR-006**: Sistema DEBE registrar cambios de permisos y roles
- **FR-007**: Sistema DEBE registrar acceso a datos sensibles (si marcados)

**Log Content:**
- **FR-008**: Cada entrada DEBE incluir: timestamp, userId, action, resource, metadata
- **FR-009**: Modificaciones DEBEN incluir before/after o diff
- **FR-010**: Eliminaciones DEBEN incluir snapshot del recurso eliminado
- **FR-011**: Logs DEBEN incluir IP de origen y user agent
- **FR-012**: Logs DEBEN tener ID único y secuencial

**Viewing:**
- **FR-013**: Sistema DEBE proveer UI para ver audit logs
- **FR-014**: Sistema DEBE permitir filtrar por: usuario, acción, recurso, fecha
- **FR-015**: Sistema DEBE permitir buscar en logs
- **FR-016**: Sistema DEBE permitir ver historial de documento específico

**Reports:**
- **FR-017**: Sistema DEBE permitir generar reportes de auditoría
- **FR-018**: Sistema DEBE soportar exportación a PDF, CSV, JSON
- **FR-019**: Sistema DEBE permitir reportes programados
- **FR-020**: Sistema DEBE incluir presets para HIPAA, SOC2, GDPR

**Retention:**
- **FR-021**: Sistema DEBE permitir configurar período de retención
- **FR-022**: Sistema DEBE archivar logs antiguos automáticamente
- **FR-023**: Sistema DEBE permitir restaurar logs archivados
- **FR-024**: Sistema DEBE permitir diferentes retenciones por tipo de log

**Security:**
- **FR-025**: Logs DEBEN ser append-only (no update, no delete)
- **FR-026**: Sistema DEBE detectar gaps en secuencia de logs
- **FR-027**: Sistema DEBE firmar/hashear logs para detectar manipulación
- **FR-028**: Logs de auditoría sobre los logs mismos DEBEN registrarse

### Key Entities

- **AuditLog**: Entrada individual del log
- **AuditReport**: Reporte generado con metadatos
- **RetentionPolicy**: Política de retención configurada
- **AuditArchive**: Logs archivados comprimidos

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% de acciones definidas se registran sin excepciones
- **SC-002**: Logging tiene <5ms de overhead por operación
- **SC-003**: Búsqueda en logs retorna en <2 segundos para 10M entries
- **SC-004**: Generación de reporte mensual completa en <5 minutos
- **SC-005**: 0% de logs pueden ser modificados post-creación
- **SC-006**: Audit logs pasan validación de auditores externos (SOC2)

---

## Technical Notes

### Log Schema

```typescript
interface AuditLogEntry {
  id: string;
  sequence: bigint; // Secuencial para detectar gaps
  timestamp: Date;

  // Actor
  userId: string | null; // null para system actions
  userEmail: string;
  userRole: string;
  ipAddress: string;
  userAgent: string;

  // Action
  action: AuditAction;
  resourceType: string; // 'document', 'user', 'media', 'settings'
  resourceId: string;

  // Details
  metadata: {
    documentType?: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    diff?: DiffEntry[];
    reason?: string;
  };

  // Integrity
  previousHash: string; // Hash de entrada anterior (blockchain-like)
  hash: string; // Hash de esta entrada
}

type AuditAction =
  | 'document.created'
  | 'document.updated'
  | 'document.deleted'
  | 'document.published'
  | 'document.unpublished'
  | 'document.viewed' // Solo para datos sensibles
  | 'user.login'
  | 'user.logout'
  | 'user.login_failed'
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'permission.granted'
  | 'permission.revoked'
  | 'settings.updated'
  | 'media.uploaded'
  | 'media.deleted'
  | 'export.created'
  | 'import.executed';
```

### Tamper Detection

```typescript
// Calcular hash de entrada
function calculateEntryHash(entry: AuditLogEntry): string {
  const data = JSON.stringify({
    sequence: entry.sequence,
    timestamp: entry.timestamp.toISOString(),
    userId: entry.userId,
    action: entry.action,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId,
    metadata: entry.metadata,
    previousHash: entry.previousHash,
  });

  return crypto.createHash('sha256').update(data).digest('hex');
}

// Verificar integridad de cadena
async function verifyAuditChain(startSeq: bigint, endSeq: bigint): Promise<VerificationResult> {
  const entries = await db.auditLog.findMany({
    where: { sequence: { gte: startSeq, lte: endSeq } },
    orderBy: { sequence: 'asc' },
  });

  const issues: string[] = [];
  let previousHash = entries[0]?.previousHash;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // Verificar hash de la entrada
    const calculatedHash = calculateEntryHash(entry);
    if (calculatedHash !== entry.hash) {
      issues.push(`Entry ${entry.sequence}: hash mismatch (tampered?)`);
    }

    // Verificar encadenamiento
    if (i > 0 && entry.previousHash !== entries[i - 1].hash) {
      issues.push(`Entry ${entry.sequence}: chain broken`);
    }

    // Verificar secuencia
    if (i > 0 && entry.sequence !== entries[i - 1].sequence + 1n) {
      issues.push(`Gap detected between ${entries[i - 1].sequence} and ${entry.sequence}`);
    }
  }

  return {
    valid: issues.length === 0,
    entriesVerified: entries.length,
    issues,
  };
}
```

### Logging Middleware

```typescript
// Middleware para capturar acciones
function auditMiddleware(action: AuditAction, options?: AuditOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const beforeState = options?.captureState ? await options.captureState(req) : undefined;

    // Interceptar respuesta
    const originalSend = res.send;
    res.send = function (body) {
      // Log después de operación exitosa
      if (res.statusCode < 400) {
        const afterState = options?.captureState ? options.captureState(req) : undefined;

        auditQueue.add({
          action,
          userId: req.user?.id,
          userEmail: req.user?.email,
          userRole: req.user?.role,
          ipAddress: getClientIP(req),
          userAgent: req.headers['user-agent'],
          resourceType: options?.resourceType,
          resourceId: req.params.id,
          metadata: {
            before: beforeState,
            after: afterState,
            duration: Date.now() - startTime,
          },
        });
      }

      return originalSend.call(this, body);
    };

    next();
  };
}

// Uso
router.put('/documents/:id',
  auditMiddleware('document.updated', {
    resourceType: 'document',
    captureState: async (req) => db.document.findUnique({ where: { id: req.params.id } }),
  }),
  updateDocumentHandler
);
```

### Audit Log Viewer UI

```
┌─────────────────────────────────────────────────────────────────────┐
│ Audit Log                                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Filters:                                                            │
│ User: [All Users ▼] Action: [All Actions ▼] Date: [Last 30 Days ▼] │
│ Resource: [_______________] [Search]                                │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Time          User           Action              Resource       │ │
│ │ ─────────────────────────────────────────────────────────────── │ │
│ │ 2024-01-15    Juan García    document.updated    Post: Hello... │ │
│ │ 14:32:15      (Admin)        IP: 192.168.1.1                    │ │
│ │               [View Diff]                                        │ │
│ │ ─────────────────────────────────────────────────────────────── │ │
│ │ 2024-01-15    María López    document.published  Post: Hello... │ │
│ │ 14:30:00      (Editor)       IP: 192.168.1.2                    │ │
│ │ ─────────────────────────────────────────────────────────────── │ │
│ │ 2024-01-15    System         user.login_failed   User: test@... │ │
│ │ 14:25:10      (System)       IP: 45.67.89.123 ⚠️                │ │
│ │               3 failed attempts                                  │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ Showing 1-50 of 12,345        [< Prev] [1] [2] [3] ... [247] [Next >]│
│                                                                     │
│ [Generate Report] [Export CSV] [Verify Integrity]                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Out of Scope (This Spec)

- SIEM integration (Splunk, Datadog)
- Real-time alerting basado en patterns
- AI-powered anomaly detection
- Legal hold / litigation support
