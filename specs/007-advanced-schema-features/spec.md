# Feature Specification: Advanced Schema Features

**Feature Branch**: `007-advanced-schema-features`
**Created**: 2026-01-29
**Status**: Draft
**Dependencies**: 001-cms-core
**Complexity**: M

---

## Executive Summary

Extender el sistema de schemas para soportar campos condicionales, validación cruzada entre campos, agrupación visual con tabs/groups, y reglas de visibilidad avanzadas. Esto permite crear formularios dinámicos que se adaptan al contenido y simplifican la experiencia de edición.

---

## User Scenarios & Testing

### User Story 1 - Conditional Fields (Priority: P1)

El desarrollador puede definir campos que solo aparecen cuando se cumple cierta condición basada en otros campos.

**Why this priority**: Formularios dinámicos reducen complejidad visual y errores del editor.

**Independent Test**: Campo "fechaVencimiento" que solo aparece si "tieneVencimiento" es true.

**Acceptance Scenarios**:

1. **Given** un schema con campo condicional, **When** la condición es false, **Then** el campo no se muestra en el admin
2. **Given** un campo oculto por condición, **When** la condición cambia a true, **Then** el campo aparece inmediatamente
3. **Given** un campo condicional con valor, **When** la condición cambia a false, **Then** se pregunta si borrar el valor
4. **Given** condiciones anidadas, **When** se evalúan, **Then** respetan la jerarquía correctamente

---

### User Story 2 - Cross-field Validation (Priority: P1)

El desarrollador puede definir validaciones que dependen de múltiples campos simultáneamente.

**Why this priority**: Muchas reglas de negocio involucran relaciones entre campos.

**Independent Test**: Validar que "fechaFin" sea posterior a "fechaInicio".

**Acceptance Scenarios**:

1. **Given** una regla de validación cruzada, **When** los campos no cumplen la regla, **Then** se muestra error claro
2. **Given** campos interdependientes, **When** uno cambia, **Then** la validación se re-evalúa
3. **Given** error de validación cruzada, **When** intento guardar, **Then** se bloquea con mensaje explicativo
4. **Given** múltiples validaciones cruzadas, **When** hay varios errores, **Then** se muestran todos

---

### User Story 3 - Field Groups & Tabs (Priority: P1)

El desarrollador puede organizar campos en grupos visuales y tabs para formularios más legibles.

**Why this priority**: Formularios largos necesitan organización para ser usables.

**Independent Test**: Crear schema con tabs "General", "SEO", "Avanzado" cada uno con sus campos.

**Acceptance Scenarios**:

1. **Given** un schema con grupos definidos, **When** se renderiza el formulario, **Then** los campos aparecen agrupados
2. **Given** un schema con tabs, **When** hago click en un tab, **Then** veo solo los campos de ese tab
3. **Given** error en campo de tab inactivo, **When** intento guardar, **Then** veo indicador de error en el tab
4. **Given** grupos con descripción, **When** renderizo, **Then** se muestra el título y descripción del grupo

---

### User Story 4 - Field Dependencies (Priority: P2)

El desarrollador puede hacer que el valor de un campo afecte las opciones o comportamiento de otro.

**Why this priority**: Muchos formularios tienen campos relacionados (ej: país -> ciudad).

**Independent Test**: Select de "categoría" que cambia las opciones disponibles en "subcategoría".

**Acceptance Scenarios**:

1. **Given** campo con opciones dependientes, **When** el campo padre cambia, **Then** las opciones del hijo se actualizan
2. **Given** campo hijo con valor seleccionado, **When** el padre cambia y el valor ya no es válido, **Then** se limpia el campo
3. **Given** dependencia a API externa, **When** el padre cambia, **Then** se cargan opciones del endpoint configurado
4. **Given** cadena de dependencias A->B->C, **When** A cambia, **Then** B y C se actualizan en cascada

---

### User Story 5 - Read-only & Computed Fields (Priority: P2)

El desarrollador puede definir campos que se calculan automáticamente o son de solo lectura.

**Why this priority**: Campos calculados evitan duplicación y errores de sincronización manual.

**Independent Test**: Campo "precioConIVA" que se calcula automáticamente desde "precio".

**Acceptance Scenarios**:

1. **Given** un campo computado, **When** se muestra en el formulario, **Then** aparece como read-only con valor calculado
2. **Given** un campo computado, **When** sus dependencias cambian, **Then** se recalcula automáticamente
3. **Given** un campo read-only manual, **When** el editor intenta editarlo, **Then** está deshabilitado
4. **Given** un campo computado, **When** se guarda el documento, **Then** el valor computado se almacena

---

### User Story 6 - Field Hints & Help (Priority: P3)

El desarrollador puede agregar información de ayuda contextual a los campos.

**Why this priority**: Buena documentación inline mejora la experiencia del editor.

**Independent Test**: Mostrar tooltip con instrucciones al pasar sobre el icono de ayuda de un campo.

**Acceptance Scenarios**:

1. **Given** un campo con helpText, **When** renderizo, **Then** se muestra texto de ayuda bajo el campo
2. **Given** un campo con tooltip, **When** paso el mouse sobre el icono de ayuda, **Then** veo el tooltip
3. **Given** un campo con placeholder, **When** el campo está vacío, **Then** muestra el placeholder
4. **Given** un campo con warning, **When** se muestra el campo, **Then** el warning es visible pero no bloquea

---

### Edge Cases

- ¿Qué pasa con condiciones circulares (A depende de B, B depende de A)? Detectar y error en build time
- ¿Qué pasa si una validación cruzada es muy costosa? Debounce + indicador de validando
- ¿Qué pasa con campos computados que dependen de referencias externas? Lazy computation, cache
- ¿Qué pasa si hay 20+ tabs? Scroll horizontal o dropdown de tabs

---

## Requirements

### Functional Requirements

**Conditional Fields:**
- **FR-001**: Sistema DEBE soportar `hidden: (doc) => boolean` en definición de campo
- **FR-002**: Sistema DEBE re-evaluar condiciones cuando cualquier campo cambia
- **FR-003**: Sistema DEBE preguntar antes de borrar valores de campos ocultos
- **FR-004**: Sistema DEBE permitir condiciones basadas en cualquier campo del documento

**Cross-field Validation:**
- **FR-005**: Sistema DEBE soportar `validate: (value, context) => string | undefined` con acceso al documento completo
- **FR-006**: Sistema DEBE mostrar errores de validación junto al campo relevante
- **FR-007**: Sistema DEBE re-evaluar validaciones cruzadas cuando campos relacionados cambien
- **FR-008**: Sistema DEBE bloquear guardado si hay errores de validación

**Groups & Tabs:**
- **FR-009**: Sistema DEBE soportar `groups` en schema para agrupar campos visualmente
- **FR-010**: Sistema DEBE soportar modo "tabs" donde cada grupo es un tab
- **FR-011**: Sistema DEBE mostrar indicador de errores en tabs inactivos
- **FR-012**: Sistema DEBE permitir grupos colapsables

**Dependencies:**
- **FR-013**: Sistema DEBE soportar opciones dinámicas basadas en otros campos
- **FR-014**: Sistema DEBE limpiar valores inválidos cuando dependencias cambien
- **FR-015**: Sistema DEBE soportar carga de opciones desde API externa
- **FR-016**: Sistema DEBE cachear opciones cargadas para evitar llamadas repetidas

**Computed Fields:**
- **FR-017**: Sistema DEBE soportar `computed: (doc) => value` para campos calculados
- **FR-018**: Sistema DEBE mostrar campos computados como read-only
- **FR-019**: Sistema DEBE permitir marcar cualquier campo como readOnly
- **FR-020**: Sistema DEBE almacenar valores computados al guardar

**Help & Hints:**
- **FR-021**: Sistema DEBE soportar `description`, `helpText`, `placeholder` en campos
- **FR-022**: Sistema DEBE soportar `warning` para mostrar mensajes no bloqueantes
- **FR-023**: Sistema DEBE soportar tooltips con información extendida

### Key Entities

- **FieldCondition**: Función que determina visibilidad de un campo
- **CrossFieldValidator**: Validador que accede a múltiples campos
- **FieldGroup**: Agrupación visual de campos con título y descripción
- **ComputedFieldDefinition**: Definición de campo con función de cálculo

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Condiciones se evalúan en <50ms incluso con 50+ campos
- **SC-002**: Validaciones cruzadas se ejecutan con debounce de 300ms para evitar lag
- **SC-003**: UI no bloquea durante re-evaluación de condiciones/validaciones
- **SC-004**: Formularios con 10+ tabs son navegables sin problemas
- **SC-005**: Errores de configuración de schema se detectan en build time
- **SC-006**: 100% de campos muestran sus hints/help correctamente

---

## Technical Notes

### Schema Definition Examples

```typescript
// Campos condicionales
export const productSchema = defineSchema({
  name: 'product',
  fields: {
    hasDiscount: fields.boolean({
      label: 'Tiene descuento',
    }),
    discountPercent: fields.number({
      label: 'Porcentaje de descuento',
      min: 1,
      max: 99,
      // Solo visible si hasDiscount es true
      hidden: (doc) => !doc.hasDiscount,
    }),
    discountEndDate: fields.datetime({
      label: 'Fecha fin descuento',
      hidden: (doc) => !doc.hasDiscount,
    }),
  },
  // Validación cruzada
  validation: (doc) => {
    const errors = [];
    if (doc.hasDiscount && !doc.discountEndDate) {
      errors.push({
        field: 'discountEndDate',
        message: 'Requerido cuando hay descuento',
      });
    }
    return errors;
  },
});

// Groups y Tabs
export const pageSchema = defineSchema({
  name: 'page',
  groups: [
    { name: 'general', title: 'General' },
    { name: 'seo', title: 'SEO', collapsible: true },
    { name: 'advanced', title: 'Avanzado', collapsible: true },
  ],
  layout: 'tabs', // o 'accordion' o 'default'
  fields: {
    title: fields.text({
      label: 'Título',
      group: 'general',
    }),
    content: fields.portableText({
      label: 'Contenido',
      group: 'general',
    }),
    metaTitle: fields.text({
      label: 'Meta Title',
      group: 'seo',
      helpText: 'Máximo 60 caracteres para mejor SEO',
    }),
    metaDescription: fields.text({
      label: 'Meta Description',
      group: 'seo',
      helpText: 'Máximo 160 caracteres',
    }),
    customCSS: fields.code({
      label: 'CSS Custom',
      group: 'advanced',
      language: 'css',
      warning: 'Usar con precaución',
    }),
  },
});

// Campo computado
export const invoiceSchema = defineSchema({
  name: 'invoice',
  fields: {
    items: fields.array({
      label: 'Items',
      of: fields.object({
        fields: {
          description: fields.text({ label: 'Descripción' }),
          quantity: fields.number({ label: 'Cantidad' }),
          price: fields.number({ label: 'Precio' }),
        },
      }),
    }),
    subtotal: fields.number({
      label: 'Subtotal',
      computed: (doc) =>
        doc.items?.reduce((sum, item) => sum + item.quantity * item.price, 0) || 0,
    }),
    tax: fields.number({
      label: 'IVA (16%)',
      computed: (doc) => (doc.subtotal || 0) * 0.16,
    }),
    total: fields.number({
      label: 'Total',
      computed: (doc) => (doc.subtotal || 0) + (doc.tax || 0),
    }),
  },
});
```

---

## Out of Scope (This Spec)

- Campos custom con UI propia (ver spec 017 - plugin system)
- Wizards/formularios multi-step
- Validación async contra APIs externas (futuro)
