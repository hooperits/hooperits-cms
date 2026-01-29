# Feature Specification: Multi-tenancy

**Feature Branch**: `022-multi-tenancy`
**Created**: 2026-01-29
**Status**: Draft
**Dependencies**: 001-cms-core, 007-advanced-schema-features
**Complexity**: L

---

## Executive Summary

Implementar soporte multi-tenant que permite manejar múltiples datasets aislados en una sola instalación del CMS. Cada dataset puede tener sus propios schemas, contenido, usuarios, y configuración, mientras comparten la infraestructura base. Ideal para agencias que manejan múltiples clientes o empresas con múltiples sitios/marcas.

---

## User Scenarios & Testing

### User Story 1 - Dataset Creation (Priority: P1)

El administrador puede crear datasets aislados para diferentes proyectos o clientes.

**Why this priority**: Crear datasets es el prerequisito para toda la funcionalidad multi-tenant.

**Independent Test**: Crear dataset "cliente-a" y "cliente-b", verificar que están aislados.

**Acceptance Scenarios**:

1. **Given** el admin global, **When** creo un dataset, **Then** se genera espacio aislado con su propia configuración
2. **Given** datasets creados, **When** los listo, **Then** veo todos los datasets disponibles
3. **Given** un dataset, **When** lo configuro, **Then** puede tener schemas y settings propios
4. **Given** dataset con contenido, **When** lo elimino, **Then** se confirma y elimina todo

---

### User Story 2 - Data Isolation (Priority: P1)

El contenido de cada dataset está completamente aislado y no se mezcla.

**Why this priority**: Aislamiento es crítico para seguridad y privacidad entre clientes.

**Independent Test**: Crear post en dataset-a, verificar que no aparece en dataset-b.

**Acceptance Scenarios**:

1. **Given** documento en dataset-a, **When** consulto desde dataset-b, **Then** no existe
2. **Given** media en dataset-a, **When** intento acceder desde dataset-b, **Then** es inaccesible
3. **Given** usuarios de dataset-a, **When** listo usuarios en dataset-b, **Then** no aparecen
4. **Given** queries HQL, **When** ejecuto en dataset-a, **Then** solo retorna datos de dataset-a

---

### User Story 3 - User Access Control (Priority: P1)

Los usuarios pueden tener acceso a uno o múltiples datasets con diferentes roles.

**Why this priority**: Control de acceso granular es esencial para multi-tenancy seguro.

**Independent Test**: Usuario con acceso a dataset-a no puede ver nada de dataset-b.

**Acceptance Scenarios**:

1. **Given** usuario, **When** le asigno acceso a dataset-a, **Then** solo puede ver ese dataset
2. **Given** usuario multi-dataset, **When** accede, **Then** puede cambiar entre datasets
3. **Given** usuario, **When** tiene rol diferente por dataset, **Then** permisos aplican correctamente
4. **Given** admin global, **When** accede, **Then** puede ver y administrar todos los datasets

---

### User Story 4 - Dataset Switching (Priority: P1)

El usuario puede cambiar entre datasets a los que tiene acceso.

**Why this priority**: UX fluida para usuarios con múltiples datasets.

**Independent Test**: Cambiar de dataset-a a dataset-b sin logout, ver contenido correcto.

**Acceptance Scenarios**:

1. **Given** usuario con múltiples datasets, **When** accede al admin, **Then** ve selector de datasets
2. **Given** selector de datasets, **When** cambio, **Then** la UI muestra contenido del nuevo dataset
3. **Given** cambio de dataset, **When** navego, **Then** la URL refleja el dataset actual
4. **Given** sesión, **When** cambio dataset, **Then** no necesito re-autenticar

---

### User Story 5 - Per-Dataset Configuration (Priority: P2)

Cada dataset puede tener su propia configuración de schemas, branding, y settings.

**Why this priority**: Flexibilidad por dataset permite adaptar a cada cliente.

**Independent Test**: Dataset-a con schemas de blog, dataset-b con schemas de e-commerce.

**Acceptance Scenarios**:

1. **Given** dataset-a, **When** defino schemas, **Then** solo aplican a ese dataset
2. **Given** dataset-b, **When** configuro branding diferente, **Then** la UI refleja su marca
3. **Given** dataset con plugins, **When** habilito plugin, **Then** solo aplica a ese dataset
4. **Given** dataset con i18n config, **When** configuro idiomas, **Then** son independientes

---

### User Story 6 - Dataset API Access (Priority: P1)

Las APIs soportan especificar qué dataset consultar.

**Why this priority**: Cada frontend necesita acceder a su dataset específico.

**Independent Test**: Query a `/api/dataset-a/hql` retorna solo contenido de dataset-a.

**Acceptance Scenarios**:

1. **Given** API con dataset en path, **When** consulto `/api/dataset-a/`, **Then** retorna datos de ese dataset
2. **Given** API con header, **When** envío `X-Dataset: dataset-a`, **Then** usa ese dataset
3. **Given** token de API, **When** es específico de dataset, **Then** solo puede acceder a ese
4. **Given** token global, **When** accedo sin especificar dataset, **Then** error claro

---

### Edge Cases

- ¿Qué pasa con contenido compartido entre datasets? No soportado en v1, futuro shared assets
- ¿Qué pasa si dataset excede límites de storage? Alertas, opción de expandir o limpiar
- ¿Qué pasa con migración de dataset a instalación propia? Export completo soportado
- ¿Qué pasa con nombres de dataset conflictivos? Validación de unicidad, slugs

---

## Requirements

### Functional Requirements

**Dataset Management:**
- **FR-001**: Sistema DEBE permitir crear datasets con nombre único (slug)
- **FR-002**: Sistema DEBE permitir configurar metadata por dataset (nombre, descripción)
- **FR-003**: Sistema DEBE permitir archivar/eliminar datasets
- **FR-004**: Sistema DEBE listar datasets disponibles para el usuario

**Data Isolation:**
- **FR-005**: Sistema DEBE aislar completamente contenido entre datasets
- **FR-006**: Sistema DEBE aislar media/archivos entre datasets
- **FR-007**: Sistema DEBE aislar configuración de schemas entre datasets
- **FR-008**: Sistema DEBE aislar usuarios y roles entre datasets

**User Access:**
- **FR-009**: Sistema DEBE permitir asignar usuarios a datasets
- **FR-010**: Sistema DEBE soportar roles diferentes por dataset por usuario
- **FR-011**: Sistema DEBE soportar usuarios "globales" con acceso a todo
- **FR-012**: Sistema DEBE permitir invitar usuarios a datasets específicos

**Dataset Switching:**
- **FR-013**: Sistema DEBE mostrar selector de datasets para usuarios multi-dataset
- **FR-014**: Sistema DEBE recordar último dataset usado por usuario
- **FR-015**: Sistema DEBE actualizar URL al cambiar dataset
- **FR-016**: Sistema DEBE preservar sesión al cambiar dataset

**Configuration:**
- **FR-017**: Sistema DEBE permitir schemas custom por dataset
- **FR-018**: Sistema DEBE permitir branding custom por dataset
- **FR-019**: Sistema DEBE permitir plugins habilitados por dataset
- **FR-020**: Sistema DEBE permitir webhooks configurados por dataset

**API:**
- **FR-021**: API DEBE soportar dataset en URL path (`/api/datasets/:dataset/...`)
- **FR-022**: API DEBE soportar dataset en header (`X-Dataset`)
- **FR-023**: API tokens DEBEN poder ser scoped a datasets específicos
- **FR-024**: API DEBE retornar error claro si dataset no especificado o inválido

### Key Entities

- **Dataset**: Espacio aislado con su contenido, config, y usuarios
- **DatasetMembership**: Relación usuario-dataset con rol
- **DatasetConfig**: Configuración específica del dataset

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Crear nuevo dataset toma <30 segundos
- **SC-002**: Cambiar entre datasets es instantáneo (<500ms)
- **SC-003**: 100% de aislamiento de datos (zero data leakage)
- **SC-004**: Soportar 100+ datasets en una instalación sin degradación
- **SC-005**: Queries no son más lentas con multi-tenancy (<10% overhead)
- **SC-006**: Export de dataset individual funciona correctamente

---

## Technical Notes

### Database Strategy

```typescript
// Opción A: Schema-based isolation (PostgreSQL schemas)
// Cada dataset tiene su propio schema en PostgreSQL
CREATE SCHEMA dataset_client_a;
CREATE SCHEMA dataset_client_b;

// Queries incluyen schema
SELECT * FROM dataset_client_a.documents WHERE ...

// Opción B: Row-level isolation (dataset_id column)
// Todos los datos en mismas tablas con dataset_id
interface Document {
  id: string;
  datasetId: string; // FK to datasets
  _type: string;
  data: JsonValue;
}

// Queries incluyen filtro
SELECT * FROM documents WHERE dataset_id = 'client_a' AND ...
```

### API Structure

```typescript
// URL-based dataset selection
// /api/datasets/:datasetSlug/documents
// /api/datasets/:datasetSlug/hql
// /api/datasets/:datasetSlug/media

// Header-based selection
// X-Dataset: client-a
// Useful when dataset is configured once at client level

// API routes
app.use('/api/datasets/:dataset/*', (req, res, next) => {
  const dataset = await validateDatasetAccess(req.params.dataset, req.user);
  if (!dataset) return res.status(403).json({ error: 'Access denied' });
  req.dataset = dataset;
  next();
});
```

### Dataset Context

```typescript
// En el admin UI
const DatasetProvider = ({ children }) => {
  const [currentDataset, setCurrentDataset] = useState<Dataset | null>(null);
  const [availableDatasets, setAvailableDatasets] = useState<Dataset[]>([]);

  // Cargar datasets disponibles para el usuario
  useEffect(() => {
    fetchUserDatasets().then(setAvailableDatasets);
  }, []);

  // Cambiar dataset
  const switchDataset = async (datasetSlug: string) => {
    const dataset = availableDatasets.find(d => d.slug === datasetSlug);
    setCurrentDataset(dataset);
    localStorage.setItem('lastDataset', datasetSlug);
    // Update URL
    router.push(`/${datasetSlug}/...`);
  };

  return (
    <DatasetContext.Provider value={{ currentDataset, availableDatasets, switchDataset }}>
      {children}
    </DatasetContext.Provider>
  );
};

// Hook para usar en componentes
const useDataset = () => useContext(DatasetContext);
```

### User-Dataset Relationship

```typescript
interface DatasetMembership {
  id: string;
  userId: string;
  datasetId: string;
  role: 'admin' | 'editor' | 'viewer' | 'custom';
  customPermissions?: string[]; // Si role es 'custom'
  createdAt: Date;
  invitedBy: string;
}

// Usuario puede tener diferentes roles en diferentes datasets
// User A: admin en dataset-1, editor en dataset-2
// User B: viewer en dataset-1, sin acceso a dataset-2
```

### Admin UI

```
┌─────────────────────────────────────────────────────────┐
│ 🏢 [Client A ▼]              [👤 Juan] [⚙️] [Logout]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Dataset Selector:                                       │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🏢 Client A               [Current]                 │ │
│ │ 🏢 Client B               [Switch]                  │ │
│ │ 🏢 Internal Website       [Switch]                  │ │
│ │ ─────────────────────────                           │ │
│ │ ➕ Create New Dataset (Admin only)                  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Out of Scope (This Spec)

- Billing/metering por dataset
- Dataset templates/cloning
- Cross-dataset references
- Hierarchical datasets (sub-datasets)
