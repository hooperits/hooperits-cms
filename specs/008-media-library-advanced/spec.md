# Feature Specification: Advanced Media Library

**Feature Branch**: `008-media-library-advanced`
**Created**: 2026-01-29
**Status**: Draft
**Dependencies**: 001-cms-core
**Complexity**: M

---

## Executive Summary

Extender la biblioteca de medios con funcionalidades avanzadas: organización en carpetas, etiquetado, búsqueda avanzada, edición básica de imágenes (crop, rotate), y selección de punto focal. Esto transforma el media library de un simple uploader a una herramienta de gestión de assets profesional.

---

## User Scenarios & Testing

### User Story 1 - Folder Organization (Priority: P1)

El editor puede organizar archivos en carpetas para mantener orden en proyectos con muchos assets.

**Why this priority**: Organización básica es esencial cuando hay cientos de archivos.

**Independent Test**: Crear carpeta "Productos/2024", mover imágenes, navegar la estructura.

**Acceptance Scenarios**:

1. **Given** el media library, **When** creo una carpeta, **Then** puedo darle nombre y ubicación
2. **Given** carpetas existentes, **When** arrastro archivos, **Then** se mueven a la carpeta destino
3. **Given** carpetas anidadas, **When** navego, **Then** veo breadcrumbs y puedo subir/bajar niveles
4. **Given** una carpeta con archivos, **When** la elimino, **Then** se pregunta qué hacer con los archivos

---

### User Story 2 - Tagging & Metadata (Priority: P1)

El editor puede agregar tags y metadata personalizada a los archivos para mejor organización y búsqueda.

**Why this priority**: Tags permiten organización transversal que complementa las carpetas.

**Independent Test**: Agregar tags "producto", "hero" a una imagen y buscarla por esos tags.

**Acceptance Scenarios**:

1. **Given** un archivo seleccionado, **When** abro sus detalles, **Then** puedo agregar/editar tags
2. **Given** tags existentes en el sistema, **When** escribo un tag, **Then** aparece autocompletado
3. **Given** archivos con tags, **When** filtro por tag, **Then** veo solo archivos con ese tag
4. **Given** un archivo, **When** edito su metadata (título, alt, descripción), **Then** se guarda correctamente

---

### User Story 3 - Advanced Search (Priority: P1)

El editor puede buscar archivos por nombre, tipo, tags, fecha, tamaño, y otros criterios.

**Why this priority**: Con muchos archivos, la búsqueda eficiente es crítica.

**Independent Test**: Buscar "logo" filtrando por tipo SVG y subido este mes.

**Acceptance Scenarios**:

1. **Given** el media library, **When** escribo en el buscador, **Then** filtra archivos por nombre en tiempo real
2. **Given** filtros avanzados, **When** selecciono tipo "imagen", **Then** solo veo imágenes
3. **Given** múltiples filtros, **When** combino búsqueda + tipo + fecha, **Then** se aplican todos
4. **Given** búsqueda sin resultados, **When** hay archivos similares, **Then** sugiere alternativas

---

### User Story 4 - Image Editing (Priority: P2)

El editor puede realizar ediciones básicas de imágenes sin salir del CMS: recortar, rotar, ajustar.

**Why this priority**: Ediciones básicas evitan el flujo de descargar -> editar en otro programa -> re-subir.

**Independent Test**: Recortar una imagen a 16:9, rotarla 90°, y guardar.

**Acceptance Scenarios**:

1. **Given** una imagen seleccionada, **When** abro el editor, **Then** veo opciones de crop, rotate, flip
2. **Given** el editor de crop, **When** selecciono ratio 16:9, **Then** el área de recorte mantiene esa proporción
3. **Given** ediciones aplicadas, **When** guardo, **Then** se crea nueva versión preservando la original
4. **Given** edición en progreso, **When** cancelo, **Then** no se guardan cambios

---

### User Story 5 - Focal Point Selection (Priority: P1)

El editor puede definir el punto focal de una imagen para que los crops automáticos se centren correctamente.

**Why this priority**: Punto focal es crítico para responsive images que se recortan diferente por viewport.

**Independent Test**: Marcar el rostro como punto focal en foto, verificar que crops verticales lo incluyen.

**Acceptance Scenarios**:

1. **Given** una imagen, **When** abro selector de punto focal, **Then** puedo hacer click donde debe centrarse
2. **Given** punto focal definido, **When** el frontend genera crops, **Then** se centran en ese punto
3. **Given** imagen en contenido, **When** se muestra en diferentes tamaños, **Then** el punto focal es visible
4. **Given** punto focal, **When** quiero cambiarlo, **Then** puedo ajustarlo fácilmente

---

### User Story 6 - Bulk Operations (Priority: P2)

El editor puede realizar operaciones en múltiples archivos a la vez.

**Why this priority**: Operaciones masivas ahorran tiempo significativo.

**Independent Test**: Seleccionar 20 imágenes, moverlas a una carpeta, agregar tag común.

**Acceptance Scenarios**:

1. **Given** el media library, **When** activo modo selección múltiple, **Then** puedo seleccionar varios archivos
2. **Given** archivos seleccionados, **When** elijo "mover", **Then** se mueven todos a la carpeta elegida
3. **Given** archivos seleccionados, **When** elijo "agregar tag", **Then** el tag se agrega a todos
4. **Given** archivos seleccionados, **When** elijo "eliminar", **Then** se confirma y eliminan todos

---

### Edge Cases

- ¿Qué pasa si muevo archivo usado en contenido a otra carpeta? Las referencias se mantienen (por ID, no path)
- ¿Qué pasa si aplico crop a imagen ya usada en 50 lugares? La original se preserva, se usa la editada opcionalmente
- ¿Qué pasa con archivos duplicados? Detección opcional de duplicados por hash
- ¿Qué pasa si se busca en carpeta vacía? Mensaje claro, opción de buscar globalmente

---

## Requirements

### Functional Requirements

**Folder Management:**
- **FR-001**: Sistema DEBE soportar carpetas anidadas sin límite de profundidad
- **FR-002**: Sistema DEBE permitir crear, renombrar, mover y eliminar carpetas
- **FR-003**: Sistema DEBE mostrar navegación con breadcrumbs
- **FR-004**: Sistema DEBE permitir drag & drop de archivos entre carpetas

**Tagging:**
- **FR-005**: Sistema DEBE soportar tags múltiples por archivo
- **FR-006**: Sistema DEBE proveer autocompletado de tags existentes
- **FR-007**: Sistema DEBE permitir crear nuevos tags al escribir
- **FR-008**: Sistema DEBE mostrar listado de tags con conteo de archivos

**Metadata:**
- **FR-009**: Sistema DEBE permitir editar: título, alt text, descripción, copyright
- **FR-010**: Sistema DEBE extraer metadata EXIF de imágenes automáticamente
- **FR-011**: Sistema DEBE mostrar información técnica: dimensiones, formato, tamaño, fecha

**Search:**
- **FR-012**: Sistema DEBE soportar búsqueda por texto en nombre, título, descripción
- **FR-013**: Sistema DEBE soportar filtros: tipo, tags, fecha, tamaño, dimensiones
- **FR-014**: Sistema DEBE combinar múltiples filtros con AND
- **FR-015**: Sistema DEBE guardar búsquedas frecuentes como "smart folders"

**Image Editing:**
- **FR-016**: Sistema DEBE soportar crop con ratios presets y libre
- **FR-017**: Sistema DEBE soportar rotación (90°, 180°, 270°) y flip
- **FR-018**: Sistema DEBE preservar imagen original al editar
- **FR-019**: Sistema DEBE generar previews en tiempo real durante edición

**Focal Point:**
- **FR-020**: Sistema DEBE permitir seleccionar punto focal con click
- **FR-021**: Sistema DEBE mostrar preview de cómo se verá en diferentes crops
- **FR-022**: Sistema DEBE usar punto focal al generar thumbnails/crops automáticos
- **FR-023**: Sistema DEBE tener hotspot por defecto en centro si no se define

**Bulk Operations:**
- **FR-024**: Sistema DEBE soportar selección múltiple (click + shift, checkbox)
- **FR-025**: Sistema DEBE permitir mover, eliminar, agregar tags a múltiples archivos
- **FR-026**: Sistema DEBE mostrar progreso durante operaciones bulk
- **FR-027**: Sistema DEBE permitir cancelar operaciones bulk en progreso

### Key Entities

- **MediaFolder**: Carpeta con nombre, parent_id, y path
- **MediaTag**: Tag con nombre y conteo de uso
- **MediaMetadata**: Metadata extendida de un archivo (EXIF, custom)
- **FocalPoint**: Coordenadas X/Y del punto focal (0-1 relativo)
- **ImageEdit**: Registro de edición con operaciones aplicadas

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Búsqueda retorna resultados en <500ms para 10,000+ archivos
- **SC-002**: Navegación de carpetas es instantánea (<200ms)
- **SC-003**: Editor de imágenes carga en <2 segundos para imágenes de 5MB
- **SC-004**: Operaciones bulk procesan 100 archivos en <30 segundos
- **SC-005**: Punto focal se aplica correctamente en 100% de los crops generados
- **SC-006**: Metadata EXIF se extrae automáticamente de 100% de imágenes compatibles

---

## Technical Notes

### Folder Structure

```typescript
interface MediaFolder {
  id: string;
  name: string;
  parentId: string | null;
  path: string; // e.g., "/products/2024/summer"
  createdAt: Date;
  updatedAt: Date;
}

// Media asset extends with folder reference
interface MediaAsset {
  id: string;
  folderId: string | null;
  filename: string;
  mimeType: string;
  size: number;
  // ... existing fields
  tags: string[];
  metadata: {
    title?: string;
    altText?: string;
    description?: string;
    copyright?: string;
    exif?: Record<string, unknown>;
  };
  focalPoint?: {
    x: number; // 0-1
    y: number; // 0-1
  };
}
```

### Image Editor Integration

```tsx
// Componente de edición de imagen
function ImageEditor({ asset, onSave, onCancel }) {
  const [edits, setEdits] = useState<ImageEdit>({
    crop: null,
    rotate: 0,
    flip: { horizontal: false, vertical: false },
  });

  return (
    <div className="image-editor">
      <Canvas
        src={asset.url}
        edits={edits}
        onCropChange={(crop) => setEdits({ ...edits, crop })}
      />
      <Toolbar
        onRotate={(deg) => setEdits({ ...edits, rotate: edits.rotate + deg })}
        onFlip={(dir) => setEdits({ ...edits, flip: { ...edits.flip, [dir]: !edits.flip[dir] } })}
        cropRatios={['free', '1:1', '16:9', '4:3', '3:2']}
      />
      <Actions onSave={() => onSave(edits)} onCancel={onCancel} />
    </div>
  );
}
```

### Focal Point in Image Delivery

```typescript
// Al generar URL de imagen con crop
function getImageUrl(asset: MediaAsset, options: { width: number; height: number }) {
  const params = new URLSearchParams({
    w: options.width.toString(),
    h: options.height.toString(),
    fit: 'crop',
    // Usar focal point para centrar el crop
    fp-x: (asset.focalPoint?.x ?? 0.5).toString(),
    fp-y: (asset.focalPoint?.y ?? 0.5).toString(),
  });

  return `${asset.url}?${params}`;
}
```

---

## Out of Scope (This Spec)

- Video transcoding y streaming
- AI-powered tagging automático (ver spec 015)
- CDN integration (ver spec 026)
- Version control de assets
