# Feature Specification: Document Versioning

**Feature Branch**: `004-document-versioning`
**Created**: 2026-01-29
**Status**: Draft
**Dependencies**: 001-cms-core, 003-document-states
**Complexity**: L

---

## Executive Summary

Implementar un sistema completo de versionado de documentos que mantenga historial de todos los cambios, permita ver diffs entre versiones, hacer rollback a versiones anteriores, y configurar políticas de retención. Esto proporciona seguridad editorial y auditabilidad completa.

---

## User Scenarios & Testing

### User Story 1 - Version History (Priority: P1)

El editor puede ver el historial completo de cambios de un documento, incluyendo quién hizo cada cambio y cuándo.

**Why this priority**: Ver historial es prerequisito para cualquier otra funcionalidad de versionado.

**Independent Test**: Editar un documento 5 veces y ver las 5 versiones en el historial.

**Acceptance Scenarios**:

1. **Given** un documento con múltiples ediciones, **When** abro el panel de historial, **Then** veo lista de versiones con fecha, autor y resumen
2. **Given** el historial de un documento, **When** hago click en una versión, **Then** veo el contenido de esa versión
3. **Given** versiones con diferentes autores, **When** reviso el historial, **Then** veo claramente quién hizo cada cambio
4. **Given** muchas versiones, **When** navego el historial, **Then** puedo filtrar por fecha o autor

---

### User Story 2 - Version Diff (Priority: P1)

El editor puede comparar dos versiones de un documento para ver exactamente qué cambió.

**Why this priority**: Entender qué cambió es esencial para revisión y debugging.

**Independent Test**: Comparar versión 3 vs versión 5 y ver campos modificados resaltados.

**Acceptance Scenarios**:

1. **Given** dos versiones de un documento, **When** selecciono "comparar", **Then** veo diff visual lado a lado
2. **Given** un diff, **When** hay campos añadidos, **Then** se muestran en verde
3. **Given** un diff, **When** hay campos eliminados, **Then** se muestran en rojo
4. **Given** un diff de rich text, **When** hay cambios en texto, **Then** se resaltan las diferencias inline

---

### User Story 3 - Rollback (Priority: P1)

El editor puede restaurar una versión anterior del documento si algo salió mal.

**Why this priority**: Poder revertir errores es crítico para la confianza del editor.

**Independent Test**: Hacer rollback a la versión de ayer y verificar que el contenido se restaura.

**Acceptance Scenarios**:

1. **Given** una versión anterior en el historial, **When** hago click en "Restaurar esta versión", **Then** se crea un nuevo draft con ese contenido
2. **Given** un rollback, **When** se ejecuta, **Then** la acción queda registrada en el historial
3. **Given** un rollback, **When** no estoy conforme, **Then** puedo hacer rollback del rollback
4. **Given** un documento con versión publicada, **When** hago rollback, **Then** no afecta la versión publicada hasta que publique

---

### User Story 4 - Auto-save Versions (Priority: P2)

El sistema guarda automáticamente versiones mientras el editor trabaja, evitando pérdida de datos.

**Why this priority**: Auto-save protege contra pérdida de trabajo y crashes del navegador.

**Independent Test**: Editar un documento, cerrar el navegador sin guardar, reabrir y recuperar los cambios.

**Acceptance Scenarios**:

1. **Given** un editor trabajando en un documento, **When** pasan 30 segundos sin guardar, **Then** se auto-guarda una versión draft
2. **Given** versiones auto-guardadas, **When** reviso el historial, **Then** se distinguen de guardados manuales
3. **Given** múltiples auto-saves en una sesión, **When** el editor guarda manualmente, **Then** los auto-saves se consolidan
4. **Given** un crash del navegador, **When** el editor vuelve al documento, **Then** puede recuperar el último auto-save

---

### User Story 5 - Retention Policies (Priority: P2)

El administrador puede configurar políticas de retención para controlar cuántas versiones se guardan y por cuánto tiempo.

**Why this priority**: Sin políticas de retención, el storage crece indefinidamente.

**Independent Test**: Configurar retención de 90 días y verificar que versiones antiguas se limpian.

**Acceptance Scenarios**:

1. **Given** una política de "mantener últimas 50 versiones", **When** se crea la versión 51, **Then** la más antigua se elimina automáticamente
2. **Given** una política de "mantener 90 días", **When** una versión tiene 91 días, **Then** se elimina en la próxima limpieza
3. **Given** una versión marcada como "importante", **When** corre la limpieza, **Then** esa versión se preserva sin importar antigüedad
4. **Given** diferentes schemas, **When** configuro políticas, **Then** puedo tener políticas diferentes por tipo de contenido

---

### User Story 6 - Named Versions (Priority: P3)

El editor puede nombrar versiones importantes para encontrarlas fácilmente después.

**Why this priority**: Nombres descriptivos facilitan navegación en documentos con mucho historial.

**Independent Test**: Nombrar una versión "Antes de rediseño" y encontrarla por ese nombre.

**Acceptance Scenarios**:

1. **Given** una versión en el historial, **When** el editor le asigna un nombre, **Then** aparece con ese nombre en el listado
2. **Given** versiones nombradas, **When** busco en el historial, **Then** puedo buscar por nombre
3. **Given** una versión nombrada, **When** aplica política de retención, **Then** se preserva automáticamente (como importante)

---

### Edge Cases

- ¿Qué pasa si el documento tiene muchos MB de rich text? Almacenamiento diferencial (solo cambios)
- ¿Qué pasa si se restaura una versión que referencia contenido eliminado? Warning con opciones de arreglar referencias
- ¿Qué pasa con versiones durante migración de schema? Metadata de schema version, migración lazy al cargar
- ¿Qué pasa si dos usuarios hacen rollback simultáneamente? Último en confirmar gana, notificación al otro

---

## Requirements

### Functional Requirements

**Version Storage:**
- **FR-001**: Sistema DEBE almacenar snapshot completo de cada versión guardada
- **FR-002**: Sistema DEBE registrar metadata: timestamp, userId, tipo de cambio, tamaño
- **FR-003**: Sistema DEBE optimizar almacenamiento usando compresión o diffing
- **FR-004**: Sistema DEBE soportar versiones de documentos con cualquier tamaño de contenido

**History UI:**
- **FR-005**: Sistema DEBE mostrar historial de versiones con paginación
- **FR-006**: Sistema DEBE permitir filtrar historial por autor, fecha, tipo de cambio
- **FR-007**: Sistema DEBE mostrar preview rápido de cada versión en el listado
- **FR-008**: Sistema DEBE indicar cuáles versiones fueron publicadas

**Diff & Compare:**
- **FR-009**: Sistema DEBE generar diff entre cualquier par de versiones
- **FR-010**: Sistema DEBE mostrar diff visual lado a lado o inline
- **FR-011**: Sistema DEBE resaltar campos añadidos, modificados y eliminados
- **FR-012**: Sistema DEBE generar diff legible para rich text (Portable Text)

**Rollback:**
- **FR-013**: Sistema DEBE permitir restaurar cualquier versión como nuevo draft
- **FR-014**: Sistema DEBE registrar acción de rollback en el historial
- **FR-015**: Sistema DEBE mostrar confirmación antes de restaurar con preview de cambios
- **FR-016**: Sistema DEBE preservar la versión actual antes del rollback

**Auto-save:**
- **FR-017**: Sistema DEBE auto-guardar drafts cada N segundos (configurable)
- **FR-018**: Sistema DEBE marcar auto-saves diferente a saves manuales
- **FR-019**: Sistema DEBE consolidar auto-saves cuando usuario guarda manualmente
- **FR-020**: Sistema DEBE permitir recuperar último auto-save después de crash

**Retention:**
- **FR-021**: Sistema DEBE soportar políticas de retención por cantidad o tiempo
- **FR-022**: Sistema DEBE ejecutar limpieza de versiones periódicamente
- **FR-023**: Sistema DEBE permitir marcar versiones como "protegidas" de limpieza
- **FR-024**: Sistema DEBE permitir políticas diferentes por tipo de contenido

### Key Entities

- **DocumentVersion**: Snapshot de un documento en un punto en el tiempo
- **VersionMetadata**: Info de la versión (autor, fecha, tipo, tamaño, nombre)
- **VersionDiff**: Resultado de comparar dos versiones
- **RetentionPolicy**: Configuración de cuánto tiempo/cuántas versiones mantener

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Historial de versiones carga en <2 segundos para documentos con 100+ versiones
- **SC-002**: Diff entre dos versiones se genera en <1 segundo
- **SC-003**: Rollback completa en <3 segundos
- **SC-004**: Auto-save no bloquea la UI del editor
- **SC-005**: Storage de versiones usa <50% del tamaño de almacenamiento ingenuo (por compresión/diff)
- **SC-006**: Retención automática mantiene storage predecible y controlado

---

## Technical Notes

### Storage Strategy

```typescript
// Opción A: Snapshot completo (simple, más storage)
interface DocumentVersion {
  id: string;
  documentId: string;
  content: JsonValue; // Documento completo
  createdAt: Date;
  userId: string;
}

// Opción B: Delta storage (complejo, menos storage)
interface DocumentVersion {
  id: string;
  documentId: string;
  baseVersionId?: string; // null = snapshot completo
  delta?: JsonPatch; // RFC 6902 JSON Patch
  createdAt: Date;
  userId: string;
}
```

### Diff Algorithm

Para rich text (Portable Text), usar:
1. Structural diff para bloques
2. Text diff (Myers algorithm) para contenido de texto
3. Visual markers para inline diffs

```typescript
// Ejemplo de diff output
{
  type: 'field_modified',
  field: 'title',
  oldValue: 'Hello World',
  newValue: 'Hello HOOPERITS',
  textDiff: [
    { type: 'unchanged', text: 'Hello ' },
    { type: 'removed', text: 'World' },
    { type: 'added', text: 'HOOPERITS' },
  ]
}
```

---

## Out of Scope (This Spec)

- Branching/merging de documentos (no es Git)
- Diff de assets binarios (solo metadata)
- Colaboración real-time (ver spec 010)
