# Feature Specification: Internationalization (i18n)

**Feature Branch**: `012-internationalization`
**Created**: 2026-01-29
**Status**: Draft
**Dependencies**: 001-cms-core, 007-advanced-schema-features
**Complexity**: L

---

## Executive Summary

Implementar soporte completo de internacionalización a nivel de documento y campo. Permite gestionar contenido en múltiples idiomas con traducciones vinculadas, workflows de traducción, y fallbacks configurables para sitios multilingües.

---

## User Scenarios & Testing

### User Story 1 - Document-level i18n (Priority: P1)

El editor puede crear versiones de un documento en diferentes idiomas, manteniendo la relación entre traducciones.

**Why this priority**: Traducción a nivel documento es el patrón más común.

**Independent Test**: Crear post en español, agregar traducción en inglés, verificar que están vinculados.

**Acceptance Scenarios**:

1. **Given** un documento en español, **When** hago click en "Traducir", **Then** puedo crear versión en inglés
2. **Given** traducciones de un documento, **When** veo la lista, **Then** veo indicador de idiomas disponibles
3. **Given** traducción creada, **When** edito el original, **Then** la traducción muestra que el original cambió
4. **Given** documentos traducidos, **When** consulto el API, **Then** puedo filtrar por idioma

---

### User Story 2 - Field-level i18n (Priority: P1)

El editor puede marcar campos específicos como traducibles mientras otros campos se comparten entre idiomas.

**Why this priority**: Algunos campos (como imágenes o fechas) no necesitan traducción.

**Independent Test**: Campo "título" traducible, campo "fecha" compartido entre idiomas.

**Acceptance Scenarios**:

1. **Given** schema con campos localizados, **When** edito documento, **Then** veo tabs/selector de idioma
2. **Given** campo traducible, **When** cambio de idioma, **Then** veo el valor de ese idioma
3. **Given** campo NO traducible, **When** cambio de idioma, **Then** el valor es el mismo
4. **Given** edición en un idioma, **When** guardo, **Then** otros idiomas no se afectan

---

### User Story 3 - Translation Workflow (Priority: P2)

El editor puede ver qué traducciones faltan o están desactualizadas y gestionar el workflow de traducción.

**Why this priority**: Gestionar estado de traducciones es esencial para equipos.

**Independent Test**: Ver dashboard de traducciones pendientes filtrado por idioma.

**Acceptance Scenarios**:

1. **Given** contenido en español, **When** reviso traducciones, **Then** veo que inglés está "pendiente"
2. **Given** original actualizado, **When** reviso traducción, **Then** muestra "desactualizado" con diff
3. **Given** traducciones pendientes, **When** filtro por idioma, **Then** veo lista de documentos a traducir
4. **Given** una traducción completa, **When** la marco como revisada, **Then** se actualiza el estado

---

### User Story 4 - Language Fallbacks (Priority: P2)

El desarrollador puede configurar fallbacks de idioma para cuando no existe traducción.

**Why this priority**: Fallbacks evitan páginas vacías en idiomas sin traducir.

**Independent Test**: Documento sin traducción alemana muestra contenido en inglés (fallback).

**Acceptance Scenarios**:

1. **Given** fallback configurado de->en, **When** pido documento en alemán sin traducción, **Then** recibo versión inglesa
2. **Given** documento parcialmente traducido, **When** un campo está vacío, **Then** usa valor del fallback
3. **Given** fallback chain (de->en->es), **When** no hay en, **Then** sigue hasta encontrar valor
4. **Given** API response con fallback, **When** consulto, **Then** incluye metadata de qué idioma se usó

---

### User Story 5 - Language Configuration (Priority: P1)

El administrador puede configurar qué idiomas están disponibles y cuál es el default.

**Why this priority**: Configuración base es prerequisito para todo i18n.

**Independent Test**: Configurar proyecto con es, en, pt como idiomas disponibles.

**Acceptance Scenarios**:

1. **Given** configuración del CMS, **When** agrego un idioma, **Then** aparece como opción en el admin
2. **Given** idiomas configurados, **When** creo contenido, **Then** puedo elegir el idioma
3. **Given** idioma default, **When** creo documento sin especificar idioma, **Then** usa el default
4. **Given** un idioma en uso, **When** intento eliminarlo, **Then** veo warning de contenido existente

---

### User Story 6 - Bulk Translation Tools (Priority: P3)

El editor puede exportar contenido para traducción externa e importar traducciones.

**Why this priority**: Integración con traductores profesionales o servicios de traducción.

**Independent Test**: Exportar 10 posts a XLIFF, enviar a traductor, importar traducciones.

**Acceptance Scenarios**:

1. **Given** contenido seleccionado, **When** exporto para traducción, **Then** genera archivo XLIFF o JSON
2. **Given** archivo de traducción, **When** lo importo, **Then** se crean/actualizan las traducciones
3. **Given** importación con errores, **When** completo, **Then** veo reporte de qué falló
4. **Given** exportación, **When** incluyo contexto para traductor, **Then** el archivo incluye notas

---

### Edge Cases

- ¿Qué pasa con referencias a documentos en otro idioma? Warning, opción de crear traducción o usar existente
- ¿Qué pasa si se elimina el documento original? Las traducciones se vuelven standalone con warning
- ¿Qué pasa con campos rich text muy largos? Traducción a nivel de bloque para más granularidad
- ¿Qué pasa con URLs/slugs por idioma? Soporte para slugs localizados

---

## Requirements

### Functional Requirements

**Language Configuration:**
- **FR-001**: Sistema DEBE permitir configurar lista de idiomas disponibles
- **FR-002**: Sistema DEBE permitir definir idioma default
- **FR-003**: Sistema DEBE permitir configurar fallback chain por idioma
- **FR-004**: Sistema DEBE soportar códigos de idioma ISO 639-1 (en, es, fr, etc.)

**Document-level i18n:**
- **FR-005**: Sistema DEBE soportar crear traducciones de documentos
- **FR-006**: Sistema DEBE mantener relación entre documento original y traducciones
- **FR-007**: Sistema DEBE mostrar indicador de idiomas disponibles en listados
- **FR-008**: Sistema DEBE permitir navegar entre traducciones de un documento

**Field-level i18n:**
- **FR-009**: Sistema DEBE soportar campos marcados como `localized: true`
- **FR-010**: Sistema DEBE mostrar UI de cambio de idioma para campos localizados
- **FR-011**: Sistema DEBE almacenar valores por idioma para campos localizados
- **FR-012**: Sistema DEBE compartir campos no-localizados entre idiomas

**Translation Status:**
- **FR-013**: Sistema DEBE trackear estado de traducción: missing, outdated, current
- **FR-014**: Sistema DEBE detectar cuando el original cambia después de traducir
- **FR-015**: Sistema DEBE mostrar diff entre versión traducida y original actual
- **FR-016**: Sistema DEBE proveer dashboard de traducciones pendientes

**API:**
- **FR-017**: API DEBE soportar parámetro `locale` para filtrar por idioma
- **FR-018**: API DEBE aplicar fallbacks cuando contenido no existe en idioma pedido
- **FR-019**: API DEBE incluir metadata de locale usado (original vs fallback)
- **FR-020**: API DEBE permitir obtener todas las traducciones de un documento

**Import/Export:**
- **FR-021**: Sistema DEBE soportar exportación a XLIFF 1.2 o 2.0
- **FR-022**: Sistema DEBE soportar importación desde XLIFF
- **FR-023**: Sistema DEBE soportar exportación/importación JSON alternativa

### Key Entities

- **Locale**: Configuración de un idioma (code, name, fallback)
- **Translation**: Relación entre documento y su traducción
- **TranslationStatus**: Estado de una traducción (missing, outdated, current)
- **LocalizedValue**: Valor de campo por idioma `{ en: "Hello", es: "Hola" }`

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Crear traducción de documento en <3 clicks
- **SC-002**: Cambiar idioma en editor es instantáneo (<200ms)
- **SC-003**: API con fallbacks responde en <100ms adicionales vs sin fallback
- **SC-004**: Dashboard de traducciones carga en <2 segundos para 1000 documentos
- **SC-005**: Import/export de 100 documentos completa en <30 segundos
- **SC-006**: 100% de campos localizados muestran indicador de idioma actual

---

## Technical Notes

### Schema Definition

```typescript
// Configuración de idiomas en el proyecto
export const i18nConfig = {
  locales: [
    { code: 'es', name: 'Español', isDefault: true },
    { code: 'en', name: 'English', fallback: 'es' },
    { code: 'pt', name: 'Português', fallback: 'es' },
  ],
};

// Schema con campos localizados
export const postSchema = defineSchema({
  name: 'post',
  // Estrategia a nivel documento (traducciones separadas)
  i18n: 'document',
  fields: {
    title: fields.text({
      label: 'Título',
      localized: true, // Este campo se traduce
    }),
    slug: fields.slug({
      label: 'URL',
      localized: true, // URLs diferentes por idioma
    }),
    content: fields.portableText({
      label: 'Contenido',
      localized: true,
    }),
    author: fields.reference({
      label: 'Autor',
      to: 'author',
      localized: false, // Mismo autor en todos los idiomas
    }),
    publishedAt: fields.datetime({
      label: 'Fecha de publicación',
      localized: false, // Misma fecha
    }),
  },
});
```

### Storage Strategy

```typescript
// Opción A: Document-level (documentos separados)
interface Document {
  id: string;
  _type: string;
  _locale: string; // 'es', 'en', etc.
  _translations?: string[]; // IDs de otros idiomas
  // ... fields
}

// Opción B: Field-level (valores anidados)
interface Document {
  id: string;
  _type: string;
  title: {
    es: 'Hola Mundo',
    en: 'Hello World',
  };
  publishedAt: Date; // No localizado, valor único
}
```

### API Usage

```typescript
// Obtener documento en español (default)
const post = await cms.query(`*[_type == "post" && slug == "hello"][0]`, {
  locale: 'es',
});

// Obtener con fallback automático
const post = await cms.query(`*[_type == "post" && slug == "hello"][0]`, {
  locale: 'de', // No existe, fallback a 'en' o 'es'
});
// Response incluye: { _locale: 'en', _requestedLocale: 'de', _isFallback: true }

// Obtener todas las traducciones
const translations = await cms.getTranslations(postId);
// Returns: { es: {...}, en: {...}, pt: null }
```

### Translation Status Tracking

```typescript
interface TranslationMeta {
  documentId: string;
  locale: string;
  status: 'missing' | 'outdated' | 'current';
  originalVersion?: string; // Hash/version del original cuando se tradujo
  translatedAt?: Date;
  translatedBy?: string;
}

// Detectar si traducción está outdated
function isOutdated(original: Document, translation: TranslationMeta): boolean {
  return original._rev !== translation.originalVersion;
}
```

---

## Out of Scope (This Spec)

- Machine translation integrada (futuro)
- Traducción en tiempo real de la UI del admin
- RTL layout support (futuro)
- Region-specific content (en-US vs en-UK)
