# Feature Specification: Plugin System

**Feature Branch**: `017-plugin-system`
**Created**: 2026-01-29
**Status**: Draft
**Dependencies**: 001-cms-core, 007-advanced-schema-features
**Complexity**: XL

---

## Executive Summary

Implementar arquitectura de plugins extensible que permita crear inputs personalizados, herramientas de dashboard, widgets, y extensiones de funcionalidad sin modificar el core del CMS. Los plugins pueden ser distribuidos como paquetes npm y habilitados por proyecto.

---

## User Scenarios & Testing

### User Story 1 - Custom Input Plugins (Priority: P1)

El desarrollador puede crear inputs personalizados para campos que el core no soporta.

**Why this priority**: Inputs custom son la extensión más común y valiosa.

**Independent Test**: Crear plugin de input "ColorPicker" y usarlo en un schema.

**Acceptance Scenarios**:

1. **Given** un plugin de input instalado, **When** lo uso en schema, **Then** renderiza en el admin
2. **Given** input custom, **When** edito valor, **Then** se guarda correctamente en el documento
3. **Given** input con validación custom, **When** valor inválido, **Then** muestra error
4. **Given** input custom, **When** consulto API, **Then** el valor se retorna como espero

---

### User Story 2 - Dashboard Tools (Priority: P1)

El desarrollador puede agregar herramientas al dashboard del admin.

**Why this priority**: Dashboard tools amplían funcionalidad sin cambiar el core.

**Independent Test**: Crear tool que muestra analytics de contenido en el dashboard.

**Acceptance Scenarios**:

1. **Given** plugin de tool instalado, **When** accedo al dashboard, **Then** veo la herramienta
2. **Given** tool con configuración, **When** la configuro, **Then** se comporta según settings
3. **Given** tool con permisos, **When** usuario sin permiso accede, **Then** no ve la tool
4. **Given** múltiples tools, **When** las ordeno, **Then** aparecen en el orden configurado

---

### User Story 3 - Document Actions (Priority: P2)

El desarrollador puede agregar acciones custom a los documentos.

**Why this priority**: Acciones custom permiten integraciones y automatizaciones.

**Independent Test**: Crear acción "Export to PDF" que aparece en el menú del documento.

**Acceptance Scenarios**:

1. **Given** plugin de acción instalado, **When** abro documento, **Then** veo la acción en el menú
2. **Given** acción ejecutada, **When** completa, **Then** veo resultado (éxito/error)
3. **Given** acción con UI, **When** la ejecuto, **Then** puede mostrar modal o sidebar
4. **Given** acción que modifica documento, **When** ejecuta, **Then** los cambios se guardan

---

### User Story 4 - Plugin Configuration (Priority: P1)

El administrador puede configurar plugins sin código.

**Why this priority**: Configuración sin código mejora adopción de plugins.

**Independent Test**: Instalar plugin, configurar opciones en UI, ver cambios aplicados.

**Acceptance Scenarios**:

1. **Given** plugin con opciones, **When** accedo a settings, **Then** veo formulario de configuración
2. **Given** configuración modificada, **When** guardo, **Then** el plugin usa nueva config
3. **Given** plugin deshabilitado, **When** lo deshabilito, **Then** no aparece en el admin
4. **Given** múltiples instancias del proyecto, **When** configuro, **Then** cada una tiene su config

---

### User Story 5 - Plugin Distribution (Priority: P2)

Los plugins se pueden distribuir como paquetes npm e instalar fácilmente.

**Why this priority**: Distribución npm permite ecosistema de plugins.

**Independent Test**: Publicar plugin a npm, instalarlo con `npm install`, usarlo.

**Acceptance Scenarios**:

1. **Given** plugin publicado, **When** ejecuto `npm install @hooperits/cms-plugin-x`, **Then** se instala
2. **Given** plugin instalado, **When** lo registro en config, **Then** está disponible
3. **Given** plugin con dependencias, **When** instalo, **Then** las dependencias se resuelven
4. **Given** actualización de plugin, **When** actualizo, **Then** funciona sin breaking changes

---

### User Story 6 - Plugin API Access (Priority: P2)

Los plugins tienen acceso controlado a APIs del CMS para leer/escribir datos.

**Why this priority**: Plugins necesitan acceso a datos para ser útiles.

**Independent Test**: Plugin que lee documentos y genera reporte.

**Acceptance Scenarios**:

1. **Given** plugin con permisos declarados, **When** accede a API, **Then** puede leer lo permitido
2. **Given** plugin sin permiso de escritura, **When** intenta escribir, **Then** recibe error
3. **Given** plugin con hooks, **When** documento se guarda, **Then** el hook se ejecuta
4. **Given** plugin, **When** accede a user context, **Then** sabe quién está logueado

---

### Edge Cases

- ¿Qué pasa si un plugin causa error crítico? Sandboxing, fallback a estado sin plugin
- ¿Qué pasa con plugins incompatibles entre sí? Sistema de dependencias y conflictos
- ¿Qué pasa si plugin accede a datos que no debe? Sistema de permisos declarativos
- ¿Qué pasa con plugins abandonados? Warning de no mantenido, opción de fork

---

## Requirements

### Functional Requirements

**Plugin Types:**
- **FR-001**: Sistema DEBE soportar plugins de tipo: input, tool, action, widget
- **FR-002**: Sistema DEBE soportar plugins de tipo: hook (pre/post save, etc.)
- **FR-003**: Sistema DEBE soportar plugins de tipo: API extension
- **FR-004**: Sistema DEBE permitir plugins que combinan múltiples tipos

**Input Plugins:**
- **FR-005**: Input plugins DEBEN recibir props: value, onChange, field config
- **FR-006**: Input plugins DEBEN poder definir validación custom
- **FR-007**: Input plugins DEBEN poder definir serialización/deserialización
- **FR-008**: Input plugins DEBEN integrarse con el form state del admin

**Tool Plugins:**
- **FR-009**: Tool plugins DEBEN poder agregar items al sidebar
- **FR-010**: Tool plugins DEBEN poder definir su propia ruta/página
- **FR-011**: Tool plugins DEBEN poder acceder a la API del CMS
- **FR-012**: Tool plugins DEBEN poder definir permisos requeridos

**Action Plugins:**
- **FR-013**: Action plugins DEBEN aparecer en menú contextual de documentos
- **FR-014**: Action plugins DEBEN poder ejecutar lógica server-side
- **FR-015**: Action plugins DEBEN poder mostrar UI (modal, drawer)
- **FR-016**: Action plugins DEBEN reportar éxito/error al usuario

**Configuration:**
- **FR-017**: Sistema DEBE permitir configurar plugins via UI de admin
- **FR-018**: Sistema DEBE almacenar configuración por proyecto/environment
- **FR-019**: Sistema DEBE permitir habilitar/deshabilitar plugins
- **FR-020**: Sistema DEBE validar configuración contra schema del plugin

**Distribution:**
- **FR-021**: Plugins DEBEN poder publicarse como paquetes npm
- **FR-022**: Sistema DEBE proveer CLI para scaffold de nuevos plugins
- **FR-023**: Sistema DEBE validar compatibilidad de versiones
- **FR-024**: Sistema DEBE documentar API pública para plugins

### Key Entities

- **Plugin**: Definición de plugin (name, type, version, components)
- **PluginConfig**: Configuración de instancia de plugin
- **PluginPermission**: Permiso declarado por plugin
- **PluginHook**: Hook registrado por plugin

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Crear plugin básico de input toma <30 minutos con docs
- **SC-002**: Instalar plugin de npm toma <5 minutos
- **SC-003**: Plugins no afectan performance del admin (<10% overhead)
- **SC-004**: Error en plugin no crashea el admin (graceful degradation)
- **SC-005**: 100% de APIs de plugin están documentadas
- **SC-006**: CLI genera scaffold funcional en <1 minuto

---

## Technical Notes

### Plugin Definition

```typescript
// Plugin de input
import { definePlugin, defineInput } from '@hooperits/cms/plugin';

export default definePlugin({
  name: '@myorg/color-picker',
  version: '1.0.0',
  inputs: {
    colorPicker: defineInput({
      name: 'colorPicker',
      component: ColorPickerInput,
      // Schema del valor almacenado
      valueSchema: z.object({
        hex: z.string(),
        rgba: z.object({
          r: z.number(),
          g: z.number(),
          b: z.number(),
          a: z.number(),
        }),
      }),
      // Configuración del campo
      configSchema: z.object({
        showAlpha: z.boolean().default(true),
        presets: z.array(z.string()).optional(),
      }),
    }),
  },
});

// Componente React del input
function ColorPickerInput({ value, onChange, config }) {
  return (
    <div>
      <input
        type="color"
        value={value?.hex || '#000000'}
        onChange={(e) => onChange({
          hex: e.target.value,
          rgba: hexToRgba(e.target.value),
        })}
      />
      {config.presets?.map(preset => (
        <button key={preset} onClick={() => onChange({ hex: preset, rgba: hexToRgba(preset) })}>
          {preset}
        </button>
      ))}
    </div>
  );
}
```

### Plugin Registration

```typescript
// cms.config.ts
import { defineConfig } from '@hooperits/cms';
import colorPickerPlugin from '@myorg/color-picker';

export default defineConfig({
  plugins: [
    colorPickerPlugin({
      // Configuración del plugin
      defaultPresets: ['#ff0000', '#00ff00', '#0000ff'],
    }),
  ],
});
```

### Using Custom Input in Schema

```typescript
// schemas/brand.ts
import { defineSchema, fields } from '@hooperits/cms';

export const brandSchema = defineSchema({
  name: 'brand',
  fields: {
    name: fields.text({ label: 'Name' }),
    primaryColor: fields.custom('colorPicker', {
      label: 'Primary Color',
      config: {
        showAlpha: false,
        presets: ['#1a1a1a', '#ffffff', '#0066cc'],
      },
    }),
  },
});
```

### Plugin API

```typescript
// API disponible para plugins
interface PluginAPI {
  // Acceso a documentos
  documents: {
    get(id: string): Promise<Document>;
    query(hql: string): Promise<Document[]>;
    create(type: string, data: any): Promise<Document>;
    update(id: string, data: any): Promise<Document>;
  };

  // Acceso a media
  media: {
    upload(file: File): Promise<MediaAsset>;
    get(id: string): Promise<MediaAsset>;
  };

  // Contexto actual
  context: {
    user: User;
    project: Project;
    locale: string;
  };

  // UI helpers
  ui: {
    showModal(component: React.FC, props?: any): void;
    showNotification(message: string, type: 'success' | 'error'): void;
    navigate(path: string): void;
  };

  // Hooks
  hooks: {
    on(event: string, handler: Function): () => void;
  };
}
```

### Tool Plugin Example

```typescript
// Plugin que agrega herramienta de analytics
export default definePlugin({
  name: '@myorg/content-analytics',
  tools: [{
    name: 'analytics',
    title: 'Content Analytics',
    icon: ChartIcon,
    route: '/tools/analytics',
    component: AnalyticsDashboard,
    permissions: ['admin', 'editor'],
  }],
});

function AnalyticsDashboard({ api }: { api: PluginAPI }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function loadStats() {
      const posts = await api.documents.query('*[_type == "post"]');
      setStats({
        total: posts.length,
        published: posts.filter(p => p.status === 'published').length,
        // ...
      });
    }
    loadStats();
  }, []);

  return (
    <div>
      <h1>Content Analytics</h1>
      {/* Dashboard UI */}
    </div>
  );
}
```

---

## Out of Scope (This Spec)

- Plugin marketplace/registry
- Monetización de plugins
- Visual plugin builder (no-code)
- Server-side only plugins (lambdas)
