# Feature Specification: Rich Text (Portable Text)

**Feature Branch**: `005-rich-text-portable`
**Created**: 2026-01-29
**Status**: Draft
**Dependencies**: 001-cms-core
**Complexity**: XL

---

## Executive Summary

Implementar un sistema de rich text estructurado inspirado en Portable Text de Sanity. A diferencia de HTML o Markdown almacenado como string, Portable Text es un formato JSON estructurado que permite renderizado flexible en cualquier plataforma, validación de contenido, y extensibilidad con bloques custom.

---

## User Scenarios & Testing

### User Story 1 - Basic Rich Text Editing (Priority: P1)

El editor puede crear contenido con formato básico: encabezados, negritas, cursivas, listas, y links.

**Why this priority**: Formato básico es el mínimo viable para cualquier editor de contenido.

**Independent Test**: Crear un artículo con H2, párrafos, lista con bullets, y links.

**Acceptance Scenarios**:

1. **Given** un campo de rich text, **When** el editor escribe, **Then** puede aplicar formato usando toolbar o atajos de teclado
2. **Given** texto seleccionado, **When** presiono Ctrl+B, **Then** se aplica negrita
3. **Given** el editor, **When** creo una lista, **Then** puedo elegir bullets o numerada
4. **Given** texto seleccionado, **When** agrego un link, **Then** puedo ingresar URL y título

---

### User Story 2 - Block-level Content (Priority: P1)

El editor puede insertar bloques especiales como imágenes, videos, quotes, y código.

**Why this priority**: Contenido moderno requiere más que solo texto formateado.

**Independent Test**: Insertar imagen, bloque de código, y quote en un artículo.

**Acceptance Scenarios**:

1. **Given** el editor, **When** inserto una imagen, **Then** puedo seleccionarla del media library y agregar alt text
2. **Given** el editor, **When** inserto un bloque de código, **Then** puedo especificar el lenguaje para syntax highlighting
3. **Given** el editor, **When** inserto un quote, **Then** puedo agregar texto y atribución
4. **Given** bloques insertados, **When** los arrastro, **Then** puedo reordenarlos

---

### User Story 3 - Custom Blocks (Priority: P1)

El desarrollador puede definir bloques custom que aparecen en el editor y se renderizan en el frontend.

**Why this priority**: Cada proyecto tiene necesidades únicas (CTAs, embeds, tablas custom, etc.).

**Independent Test**: Crear bloque "CallToAction" con título, descripción y botón, usarlo en contenido.

**Acceptance Scenarios**:

1. **Given** un schema con bloque custom definido, **When** el editor abre el rich text, **Then** ve el bloque custom en el menú de inserción
2. **Given** un bloque custom insertado, **When** lo edito, **Then** veo formulario con los campos definidos
3. **Given** contenido con bloques custom, **When** consulto el API, **Then** el JSON incluye los bloques con su tipo y datos
4. **Given** un bloque custom en frontend, **When** renderizo, **Then** puedo usar componente React específico

---

### User Story 4 - Inline Objects (Priority: P2)

El editor puede insertar objetos inline como menciones, variables, o tooltips dentro del texto.

**Why this priority**: Objetos inline enriquecen el contenido (ej: @menciones, términos con definición).

**Independent Test**: Insertar mención de producto inline que se resuelve al nombre actual del producto.

**Acceptance Scenarios**:

1. **Given** el editor, **When** escribo "@", **Then** aparece autocomplete de usuarios/documentos para mencionar
2. **Given** una mención insertada, **When** el documento referenciado cambia nombre, **Then** la mención se actualiza automáticamente
3. **Given** un inline object custom, **When** lo inserto, **Then** puedo configurar sus propiedades
4. **Given** inline objects en el texto, **When** serializo a HTML, **Then** se renderizan correctamente

---

### User Story 5 - Portable Text Serialization (Priority: P1)

El contenido se almacena en formato JSON estructurado que puede serializarse a HTML, React, o cualquier formato.

**Why this priority**: La portabilidad del formato es su principal ventaja.

**Independent Test**: Renderizar mismo contenido en Next.js (React) y email (HTML) desde la misma data.

**Acceptance Scenarios**:

1. **Given** contenido rich text, **When** consulto el API, **Then** recibo JSON en formato Portable Text
2. **Given** Portable Text, **When** uso el serializer React, **Then** se renderiza con componentes correctos
3. **Given** Portable Text, **When** uso el serializer HTML, **Then** genera HTML semántico válido
4. **Given** bloques custom, **When** serializo, **Then** puedo proveer componentes/handlers custom

---

### User Story 6 - Annotations & Decorators (Priority: P2)

El editor puede aplicar anotaciones custom al texto como comments, highlights, o metadata.

**Why this priority**: Anotaciones permiten funcionalidad avanzada como comentarios en texto específico.

**Independent Test**: Resaltar texto con comentario interno para revisión.

**Acceptance Scenarios**:

1. **Given** texto seleccionado, **When** aplico una anotación "comment", **Then** el texto queda marcado
2. **Given** texto con anotación, **When** paso el mouse, **Then** veo la información de la anotación
3. **Given** anotaciones, **When** serializo para frontend público, **Then** puedo elegir mostrar u ocultar
4. **Given** múltiples anotaciones en mismo texto, **When** se superponen, **Then** se manejan correctamente

---

### Edge Cases

- ¿Qué pasa si pego contenido de Word/Google Docs? Limpiar HTML y convertir a Portable Text
- ¿Qué pasa con bloques custom que ya no existen en el schema? Mostrar como "bloque desconocido" con data raw
- ¿Qué pasa si una imagen referenciada se elimina? Mostrar placeholder con warning
- ¿Qué pasa con contenido muy largo (50+ bloques)? Virtualización en el editor para performance

---

## Requirements

### Functional Requirements

**Portable Text Format:**
- **FR-001**: Sistema DEBE almacenar rich text como JSON siguiendo spec de Portable Text
- **FR-002**: Sistema DEBE soportar bloques: paragraph, heading (1-6), blockquote, list (bullet, number)
- **FR-003**: Sistema DEBE soportar marks/decorators: strong, em, underline, strikethrough, code
- **FR-004**: Sistema DEBE soportar links como annotation con href, title, target
- **FR-005**: Sistema DEBE soportar bloques custom definidos en schema

**Editor UI:**
- **FR-006**: Sistema DEBE proveer editor WYSIWYG con toolbar configurable
- **FR-007**: Sistema DEBE soportar atajos de teclado estándar (Ctrl+B, Ctrl+I, etc.)
- **FR-008**: Sistema DEBE permitir drag & drop para reordenar bloques
- **FR-009**: Sistema DEBE mostrar menú de inserción para bloques (slash commands `/`)
- **FR-010**: Sistema DEBE soportar paste inteligente de HTML/texto

**Block Types:**
- **FR-011**: Sistema DEBE soportar bloque de imagen con campos: asset, alt, caption
- **FR-012**: Sistema DEBE soportar bloque de código con campos: code, language, filename
- **FR-013**: Sistema DEBE soportar bloque de video (embed URL o asset)
- **FR-014**: Sistema DEBE permitir definir bloques custom en schema con campos propios

**Inline Objects:**
- **FR-015**: Sistema DEBE soportar inline objects custom definidos en schema
- **FR-016**: Sistema DEBE soportar referencias inline a otros documentos
- **FR-017**: Sistema DEBE resolver referencias inline al serializar

**Serialization:**
- **FR-018**: Sistema DEBE proveer serializer a HTML configurable
- **FR-019**: Sistema DEBE proveer componentes React para renderizar Portable Text
- **FR-020**: Sistema DEBE permitir custom serializers por tipo de bloque/mark
- **FR-021**: Sistema DEBE validar Portable Text contra schema antes de guardar

**Annotations:**
- **FR-022**: Sistema DEBE soportar annotations custom (además de links)
- **FR-023**: Sistema DEBE permitir múltiples annotations en mismo span de texto
- **FR-024**: Sistema DEBE preservar annotations al editar texto

### Key Entities

- **PortableTextBlock**: Un bloque de contenido (paragraph, heading, custom, etc.)
- **PortableTextSpan**: Texto con marks/decorators aplicados
- **PortableTextMark**: Decorator o annotation aplicada a texto
- **BlockDefinition**: Schema de un tipo de bloque custom
- **InlineObjectDefinition**: Schema de un objeto inline custom

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Editor carga en <1 segundo para documentos con 100 bloques
- **SC-002**: Typing latency <50ms en documentos de cualquier tamaño
- **SC-003**: Paste de HTML preserva 90%+ del formato original relevante
- **SC-004**: Serialización a HTML/React de 100 bloques <100ms
- **SC-005**: Formato Portable Text es válido JSON que puede parsearse en cualquier lenguaje
- **SC-006**: Bloques custom se definen en <20 líneas de código

---

## Technical Notes

### Portable Text Structure

```typescript
// Estructura de Portable Text
type PortableText = PortableTextBlock[];

interface PortableTextBlock {
  _type: string; // 'block' para texto, o tipo custom
  _key: string;  // ID único
  style?: 'normal' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'blockquote';
  listItem?: 'bullet' | 'number';
  level?: number;
  children?: PortableTextSpan[];
  // ... campos adicionales para bloques custom
}

interface PortableTextSpan {
  _type: 'span';
  _key: string;
  text: string;
  marks?: string[]; // Referencias a markDefs o decorators
}
```

### Custom Block Definition

```typescript
// En schema
export const articleSchema = defineSchema({
  name: 'article',
  fields: {
    content: fields.portableText({
      label: 'Contenido',
      blocks: [
        // Bloques custom
        {
          type: 'callToAction',
          title: 'Call to Action',
          fields: {
            heading: fields.text({ required: true }),
            description: fields.text(),
            buttonText: fields.text({ required: true }),
            buttonLink: fields.url({ required: true }),
          },
        },
        {
          type: 'codeBlock',
          title: 'Código',
          fields: {
            code: fields.code({ required: true }),
            language: fields.select({
              options: ['javascript', 'typescript', 'python', 'bash'],
            }),
            filename: fields.text(),
          },
        },
      ],
    }),
  },
});
```

### React Serializer

```tsx
import { PortableText } from '@hooperits/cms/react';

// Componentes custom
const components = {
  block: {
    callToAction: ({ value }) => (
      <div className="cta-box">
        <h3>{value.heading}</h3>
        <p>{value.description}</p>
        <a href={value.buttonLink}>{value.buttonText}</a>
      </div>
    ),
  },
  marks: {
    highlight: ({ children }) => (
      <mark className="highlight">{children}</mark>
    ),
  },
};

// Uso
<PortableText value={article.content} components={components} />
```

---

## Out of Scope (This Spec)

- Colaboración real-time en el editor (ver spec 010)
- Comments/suggestions como en Google Docs (ver spec 009)
- Markdown import/export (futuro)
- Table block (complejidad alta, futuro)
