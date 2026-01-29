# Feature Specification: Advanced Permissions (ABAC)

**Feature Branch**: `023-advanced-permissions`
**Created**: 2026-01-29
**Status**: Draft
**Dependencies**: 001-cms-core
**Complexity**: L

---

## Executive Summary

Implementar sistema de permisos avanzado basado en atributos (ABAC - Attribute-Based Access Control) que permite permisos granulares a nivel de documento, campo, y operación. Soporta roles custom, permisos condicionales, y políticas flexibles para organizaciones con necesidades de seguridad complejas.

---

## User Scenarios & Testing

### User Story 1 - Document-level Permissions (Priority: P1)

El administrador puede configurar permisos específicos por documento o grupo de documentos.

**Why this priority**: Permisos por documento son el nivel más solicitado de granularidad.

**Independent Test**: Editor de "Marketing" solo puede editar documentos de categoría "Marketing".

**Acceptance Scenarios**:

1. **Given** permiso por categoría, **When** editor accede a doc de su categoría, **Then** puede editar
2. **Given** permiso por categoría, **When** editor accede a doc de otra categoría, **Then** solo lectura
3. **Given** permiso por autor, **When** editor accede a doc que creó, **Then** puede editar
4. **Given** permiso por autor, **When** editor accede a doc de otro, **Then** según política

---

### User Story 2 - Field-level Permissions (Priority: P1)

El administrador puede ocultar o hacer read-only campos específicos según el rol.

**Why this priority**: Datos sensibles a veces están en campos específicos (precio, notas internas).

**Independent Test**: Campo "precio_costo" solo visible para rol "Finanzas".

**Acceptance Scenarios**:

1. **Given** campo con permiso restringido, **When** usuario sin permiso ve el doc, **Then** campo no aparece
2. **Given** campo read-only para rol, **When** ese rol edita, **Then** campo aparece pero no es editable
3. **Given** campo en API response, **When** usuario sin permiso consulta, **Then** campo no viene
4. **Given** múltiples campos restringidos, **When** se combinan, **Then** cada uno respeta su regla

---

### User Story 3 - Custom Roles (Priority: P1)

El administrador puede crear roles personalizados con combinaciones específicas de permisos.

**Why this priority**: Los roles predefinidos (Admin, Editor, Viewer) no cubren todos los casos.

**Independent Test**: Crear rol "Content Manager" con permisos específicos para posts pero no para settings.

**Acceptance Scenarios**:

1. **Given** panel de roles, **When** creo rol custom, **Then** puedo definir permisos granulares
2. **Given** rol custom, **When** lo asigno a usuario, **Then** el usuario tiene esos permisos
3. **Given** rol custom, **When** lo edito, **Then** usuarios con ese rol se actualizan
4. **Given** rol en uso, **When** lo elimino, **Then** se pregunta qué hacer con usuarios asignados

---

### User Story 4 - Conditional Permissions (Priority: P2)

Los permisos pueden depender de condiciones basadas en atributos del documento o contexto.

**Why this priority**: Políticas complejas requieren condiciones (ej: solo publicar docs propios).

**Independent Test**: Editor puede publicar solo si es autor Y documento está en "review".

**Acceptance Scenarios**:

1. **Given** permiso condicional, **When** condición se cumple, **Then** acción permitida
2. **Given** permiso condicional, **When** condición no se cumple, **Then** acción denegada
3. **Given** condición con atributo de usuario, **When** evalúo, **Then** considera el contexto
4. **Given** condición con atributo de documento, **When** evalúo, **Then** considera el estado actual

---

### User Story 5 - Permission Inheritance (Priority: P2)

Los permisos pueden heredarse de roles padres o grupos.

**Why this priority**: Herencia simplifica administración en organizaciones grandes.

**Independent Test**: Rol "Senior Editor" hereda permisos de "Editor" y agrega más.

**Acceptance Scenarios**:

1. **Given** rol hijo de otro, **When** evalúo permisos, **Then** hereda del padre
2. **Given** permiso overrideado en hijo, **When** evalúo, **Then** el hijo gana
3. **Given** usuario en múltiples roles, **When** evalúo, **Then** combina permisos (union)
4. **Given** permiso denegado explícito, **When** evalúo, **Then** deny gana sobre allow

---

### User Story 6 - Permission Audit (Priority: P2)

El administrador puede ver qué permisos tiene cada usuario y por qué.

**Why this priority**: Debugging de permisos es esencial para troubleshooting.

**Independent Test**: Ver por qué usuario X no puede editar documento Y.

**Acceptance Scenarios**:

1. **Given** usuario seleccionado, **When** veo sus permisos, **Then** lista todos con origen
2. **Given** documento y usuario, **When** evalúo acceso, **Then** veo resultado y explicación
3. **Given** permiso denegado, **When** veo detalle, **Then** explica qué regla lo denegó
4. **Given** historial de cambios de permisos, **When** reviso, **Then** veo quién cambió qué

---

### Edge Cases

- ¿Qué pasa con operaciones bulk que afectan docs con diferentes permisos? Aplicar a cada uno, reportar fallos
- ¿Qué pasa si reglas entran en conflicto? Deny wins, o prioridad configurable
- ¿Qué pasa con permisos en documentos referenciados? Permiso de lectura en referencia, no escritura
- ¿Qué pasa con API tokens? Pueden tener permisos más restrictivos que el usuario

---

## Requirements

### Functional Requirements

**Document-level:**
- **FR-001**: Sistema DEBE soportar permisos basados en tipo de documento
- **FR-002**: Sistema DEBE soportar permisos basados en campos del documento (ej: category)
- **FR-003**: Sistema DEBE soportar permisos basados en autor/creador
- **FR-004**: Sistema DEBE soportar permisos basados en estado (draft, published)

**Field-level:**
- **FR-005**: Sistema DEBE permitir ocultar campos según rol
- **FR-006**: Sistema DEBE permitir campos read-only según rol
- **FR-007**: Sistema DEBE aplicar permisos de campo en UI y API
- **FR-008**: Sistema DEBE permitir permisos de campo por tipo de documento

**Custom Roles:**
- **FR-009**: Sistema DEBE permitir crear roles con nombre y descripción
- **FR-010**: Sistema DEBE permitir asignar permisos granulares a roles
- **FR-011**: Sistema DEBE permitir roles jerárquicos (herencia)
- **FR-012**: Sistema DEBE permitir editar y eliminar roles custom

**Conditions (ABAC):**
- **FR-013**: Sistema DEBE soportar condiciones en permisos usando expresiones
- **FR-014**: Sistema DEBE soportar atributos de usuario en condiciones (role, id, email, custom)
- **FR-015**: Sistema DEBE soportar atributos de documento en condiciones (type, status, fields)
- **FR-016**: Sistema DEBE soportar atributos de contexto (action, timestamp)

**Permission Resolution:**
- **FR-017**: Sistema DEBE evaluar permisos en orden: explicit deny > explicit allow > inherited > default
- **FR-018**: Sistema DEBE combinar permisos de múltiples roles con union
- **FR-019**: Sistema DEBE cachear evaluación de permisos para performance
- **FR-020**: Sistema DEBE invalidar caché cuando permisos cambian

**Audit:**
- **FR-021**: Sistema DEBE proveer herramienta de debugging de permisos
- **FR-022**: Sistema DEBE explicar por qué un permiso fue granted/denied
- **FR-023**: Sistema DEBE loggear cambios a configuración de permisos
- **FR-024**: Sistema DEBE permitir simular permisos de otro usuario (admin only)

### Key Entities

- **Permission**: Definición de permiso (action, resource, conditions)
- **Role**: Conjunto de permisos con nombre
- **Policy**: Regla que combina permisos con condiciones
- **PermissionEvaluation**: Resultado de evaluación con explicación

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Evaluación de permisos <10ms por request (con caché)
- **SC-002**: Crear rol custom toma <5 minutos en UI
- **SC-003**: Debug de "por qué no puedo acceder" responde en <2 segundos
- **SC-004**: 100% de accesos denegados tienen explicación en audit log
- **SC-005**: Permisos de campo se aplican consistentemente en UI y API
- **SC-006**: Cambios de permisos se reflejan inmediatamente (invalidación de caché)

---

## Technical Notes

### Permission Model

```typescript
interface Permission {
  id: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'publish' | 'manage';
  resource: {
    type: 'document' | 'field' | 'media' | 'user' | 'settings';
    documentType?: string; // e.g., 'post', 'page', '*'
    fieldPath?: string;    // e.g., 'price', 'content.blocks'
  };
  effect: 'allow' | 'deny';
  conditions?: PermissionCondition[];
}

interface PermissionCondition {
  attribute: string;  // e.g., 'document.author', 'user.role', 'document.status'
  operator: 'eq' | 'neq' | 'in' | 'contains' | 'matches';
  value: unknown;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  parentRoleId?: string; // Para herencia
  permissions: Permission[];
  isSystem: boolean; // true para Admin, Editor, Viewer
}
```

### Policy Evaluation

```typescript
interface PermissionContext {
  user: {
    id: string;
    roles: Role[];
    attributes: Record<string, unknown>;
  };
  resource: {
    type: string;
    documentType?: string;
    document?: Document;
    field?: string;
  };
  action: string;
}

interface PermissionResult {
  allowed: boolean;
  reason: string;
  matchedRule?: Permission;
  evaluationPath: string[]; // Para debugging
}

async function evaluatePermission(context: PermissionContext): Promise<PermissionResult> {
  // 1. Collect all permissions from user's roles
  const permissions = collectPermissions(context.user.roles);

  // 2. Filter relevant permissions
  const relevant = permissions.filter(p =>
    matchesResource(p, context.resource) &&
    matchesAction(p, context.action)
  );

  // 3. Evaluate conditions
  const evaluated = await Promise.all(
    relevant.map(p => evaluateConditions(p, context))
  );

  // 4. Apply precedence: explicit deny > explicit allow > inherited > default deny
  const explicitDeny = evaluated.find(e => e.permission.effect === 'deny' && e.matched);
  if (explicitDeny) {
    return { allowed: false, reason: 'Explicit deny', matchedRule: explicitDeny.permission };
  }

  const explicitAllow = evaluated.find(e => e.permission.effect === 'allow' && e.matched);
  if (explicitAllow) {
    return { allowed: true, reason: 'Explicit allow', matchedRule: explicitAllow.permission };
  }

  return { allowed: false, reason: 'No matching permission (default deny)' };
}
```

### Condition Expressions

```typescript
// Ejemplo de permisos con condiciones
const permissions: Permission[] = [
  // Editor puede editar solo posts de su categoría
  {
    action: 'update',
    resource: { type: 'document', documentType: 'post' },
    effect: 'allow',
    conditions: [
      { attribute: 'document.category', operator: 'in', value: '$user.categories' }
    ]
  },

  // Autor puede editar sus propios documentos
  {
    action: 'update',
    resource: { type: 'document', documentType: '*' },
    effect: 'allow',
    conditions: [
      { attribute: 'document._createdBy', operator: 'eq', value: '$user.id' }
    ]
  },

  // Solo admin puede ver el campo 'internalNotes'
  {
    action: 'read',
    resource: { type: 'field', documentType: 'post', fieldPath: 'internalNotes' },
    effect: 'deny',
    conditions: [
      { attribute: 'user.role', operator: 'neq', value: 'admin' }
    ]
  },

  // Editor puede publicar solo si documento está en status 'approved'
  {
    action: 'publish',
    resource: { type: 'document', documentType: '*' },
    effect: 'allow',
    conditions: [
      { attribute: 'document.status', operator: 'eq', value: 'approved' }
    ]
  },
];
```

### Admin UI

```
┌─────────────────────────────────────────────────────────┐
│                    Role: Content Manager                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Name: [Content Manager_________________________]        │
│ Description: [Manages blog posts and pages_____]        │
│ Inherits from: [Editor ▼]                               │
│                                                         │
│ Permissions:                                            │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Document Type    Action    Effect    Conditions     │ │
│ │ ───────────────────────────────────────────────────│ │
│ │ post            create    ✓ Allow   -              │ │
│ │ post            update    ✓ Allow   author = self  │ │
│ │ post            delete    ✗ Deny    -              │ │
│ │ post            publish   ✓ Allow   status=approved│ │
│ │ page            create    ✓ Allow   -              │ │
│ │ page            update    ✓ Allow   -              │ │
│ │ settings        manage    ✗ Deny    -              │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Field Permissions:                                      │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Field              Access                           │ │
│ │ ─────────────────────────────────────────────────── │ │
│ │ post.internalNotes Hidden                           │ │
│ │ post.seoSettings   Read-only                        │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│                              [Cancel] [Save Role]       │
└─────────────────────────────────────────────────────────┘
```

### Permission Debugger

```
┌─────────────────────────────────────────────────────────┐
│                   Permission Debugger                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ User: [Juan García ▼]                                   │
│ Action: [Update ▼]                                      │
│ Document: [Post: "Hello World" ▼]                       │
│                                                         │
│ [Check Permission]                                      │
│                                                         │
│ Result: ✗ DENIED                                        │
│ ═══════════════════════════════════════════════════════ │
│                                                         │
│ Evaluation Path:                                        │
│ 1. User has roles: [Editor, Content Manager]            │
│ 2. Checking 'update' on 'post' document                 │
│ 3. Found rule: "Editor can update posts they created"   │
│    → Condition: document._createdBy == user.id          │
│    → document._createdBy = "user-456"                   │
│    → user.id = "user-123"                               │
│    → Condition NOT MET                                  │
│ 4. Found rule: "Content Manager can update posts"       │
│    → Condition: document.category in user.categories    │
│    → document.category = "tech"                         │
│    → user.categories = ["marketing", "news"]            │
│    → Condition NOT MET                                  │
│ 5. No more rules found                                  │
│ 6. Default: DENY                                        │
│                                                         │
│ Suggestion: Assign user to "tech" category or make      │
│ them author of this document.                           │
└─────────────────────────────────────────────────────────┘
```

---

## Out of Scope (This Spec)

- Row-level security en PostgreSQL (RLS) como implementación
- Permisos basados en tiempo (temporal access)
- Approval workflows para cambios de permisos
- SSO/SCIM integration para roles
