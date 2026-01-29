# Feature Specification: Studio Customization

**Feature Branch**: `018-studio-customization`
**Created**: 2026-01-29
**Status**: Draft
**Dependencies**: 001-cms-core, 017-plugin-system
**Complexity**: M

---

## Executive Summary

Permitir personalización completa del admin UI (Studio): temas visuales, branding del cliente, navegación custom, layouts personalizados, y dashboard widgets. Esto permite que cada instalación del CMS tenga identidad propia y se adapte al flujo de trabajo del equipo.

---

## User Scenarios & Testing

### User Story 1 - Custom Branding (Priority: P1)

El administrador puede personalizar el branding del admin con logo, colores, y nombre del cliente.

**Why this priority**: Branding es lo más visible y solicitado por clientes.

**Independent Test**: Cambiar logo y colores, ver reflejados en login y header.

**Acceptance Scenarios**:

1. **Given** configuración de branding, **When** subo logo, **Then** aparece en header y login
2. **Given** colores primarios configurados, **When** aplico, **Then** botones y acentos usan esos colores
3. **Given** nombre del proyecto, **When** configuro, **Then** aparece en título y meta tags
4. **Given** favicon custom, **When** subo, **Then** reemplaza el default

---

### User Story 2 - Theme Customization (Priority: P1)

El administrador puede elegir entre temas predefinidos o crear tema custom.

**Why this priority**: Temas mejoran la experiencia visual y consistencia.

**Independent Test**: Cambiar de tema light a dark, ver cambio inmediato.

**Acceptance Scenarios**:

1. **Given** temas disponibles, **When** selecciono "dark", **Then** la UI cambia a modo oscuro
2. **Given** tema custom, **When** defino variables CSS, **Then** se aplican al admin
3. **Given** preferencia de usuario, **When** cambio tema, **Then** se recuerda por usuario
4. **Given** sistema con "auto", **When** selecciono, **Then** sigue preferencia del OS

---

### User Story 3 - Navigation Customization (Priority: P1)

El administrador puede personalizar la estructura de navegación del sidebar.

**Why this priority**: Navegación organizada mejora productividad del equipo.

**Independent Test**: Crear grupos de navegación "Blog", "Productos", "Configuración".

**Acceptance Scenarios**:

1. **Given** items de navegación, **When** reordeno, **Then** el sidebar refleja el nuevo orden
2. **Given** grupos de navegación, **When** creo grupo "Blog", **Then** puedo agregar Posts, Categorías dentro
3. **Given** item oculto, **When** lo oculto, **Then** no aparece en navegación (pero sigue accesible por URL)
4. **Given** item con icono custom, **When** configuro, **Then** muestra el icono elegido

---

### User Story 4 - Dashboard Customization (Priority: P2)

El administrador puede personalizar qué widgets aparecen en el dashboard.

**Why this priority**: Dashboard útil mejora productividad y onboarding.

**Independent Test**: Agregar widget de "Posts recientes" y "Tareas pendientes" al dashboard.

**Acceptance Scenarios**:

1. **Given** widgets disponibles, **When** los agrego al dashboard, **Then** aparecen en la página principal
2. **Given** widgets en dashboard, **When** los reordeno, **Then** respetan el nuevo layout
3. **Given** widget con configuración, **When** lo configuro, **Then** muestra datos según config
4. **Given** widget removido, **When** lo quito, **Then** desaparece del dashboard

---

### User Story 5 - Custom CSS/JS (Priority: P3)

El desarrollador puede inyectar CSS/JS custom para ajustes avanzados.

**Why this priority**: Escape hatch para casos no cubiertos por configuración.

**Independent Test**: Agregar CSS que oculta un campo específico solo para ciertos usuarios.

**Acceptance Scenarios**:

1. **Given** CSS custom, **When** lo agrego, **Then** se aplica al admin
2. **Given** JS custom, **When** lo agrego, **Then** se ejecuta en el cliente
3. **Given** código con error, **When** lo agrego, **Then** no rompe el admin (sandboxed)
4. **Given** código, **When** quiero revertir, **Then** puedo eliminarlo fácilmente

---

### User Story 6 - Document List Customization (Priority: P2)

El administrador puede personalizar columnas y vistas de listados de documentos.

**Why this priority**: Listados optimizados mejoran la gestión de contenido.

**Independent Test**: Agregar columna "Autor" y "Estado" a la lista de Posts.

**Acceptance Scenarios**:

1. **Given** lista de documentos, **When** configuro columnas, **Then** se muestran las elegidas
2. **Given** columnas, **When** reordeno, **Then** el listado refleja el nuevo orden
3. **Given** columna con formato, **When** configuro, **Then** se renderiza correctamente (ej: fecha, imagen)
4. **Given** vista guardada, **When** la aplico, **Then** carga con filtros y columnas configurados

---

### Edge Cases

- ¿Qué pasa si el logo es muy grande? Resize automático, warning si excede límite
- ¿Qué pasa con CSS que rompe la UI? Preview antes de aplicar, botón de revertir
- ¿Qué pasa con navegación que oculta todo? Siempre mostrar Settings como fallback
- ¿Qué pasa con temas de alto contraste para accesibilidad? Soporte a11y en temas

---

## Requirements

### Functional Requirements

**Branding:**
- **FR-001**: Sistema DEBE permitir subir logo (header y login)
- **FR-002**: Sistema DEBE permitir configurar nombre/título del proyecto
- **FR-003**: Sistema DEBE permitir configurar favicon
- **FR-004**: Sistema DEBE permitir configurar colores primarios y secundarios

**Themes:**
- **FR-005**: Sistema DEBE incluir temas predefinidos (light, dark)
- **FR-006**: Sistema DEBE permitir crear temas custom con variables CSS
- **FR-007**: Sistema DEBE permitir tema "auto" que sigue preferencia del sistema
- **FR-008**: Sistema DEBE guardar preferencia de tema por usuario

**Navigation:**
- **FR-009**: Sistema DEBE permitir reordenar items del sidebar
- **FR-010**: Sistema DEBE permitir agrupar items en secciones colapsables
- **FR-011**: Sistema DEBE permitir ocultar items de navegación
- **FR-012**: Sistema DEBE permitir agregar links externos a la navegación
- **FR-013**: Sistema DEBE permitir iconos custom para items de navegación

**Dashboard:**
- **FR-014**: Sistema DEBE proveer widgets predefinidos (recent docs, tasks, activity)
- **FR-015**: Sistema DEBE permitir agregar/remover widgets del dashboard
- **FR-016**: Sistema DEBE permitir reordenar widgets en grid
- **FR-017**: Sistema DEBE permitir widgets custom via plugin system

**Advanced:**
- **FR-018**: Sistema DEBE permitir inyectar CSS custom
- **FR-019**: Sistema DEBE permitir inyectar JS custom (sandboxed)
- **FR-020**: Sistema DEBE permitir preview de cambios antes de aplicar

**Document Lists:**
- **FR-021**: Sistema DEBE permitir configurar columnas visibles por tipo de documento
- **FR-022**: Sistema DEBE permitir guardar vistas/filtros como presets
- **FR-023**: Sistema DEBE permitir configurar ordenamiento default

### Key Entities

- **StudioConfig**: Configuración general del studio (branding, theme, nav)
- **NavigationItem**: Item de navegación (type, label, icon, target, children)
- **DashboardWidget**: Widget configurado (type, position, config)
- **ListViewConfig**: Configuración de vista de lista (columns, sort, filters)

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Cambio de branding se aplica en <5 segundos sin reload
- **SC-002**: Cambio de tema es instantáneo (<100ms)
- **SC-003**: Navegación custom soporta hasta 50 items sin degradación
- **SC-004**: Dashboard con 10 widgets carga en <3 segundos
- **SC-005**: CSS/JS custom no puede acceder a datos sensibles (sandboxed)
- **SC-006**: 100% de cambios son reversibles

---

## Technical Notes

### Configuration Schema

```typescript
interface StudioConfig {
  branding: {
    projectName: string;
    logo?: MediaReference;
    favicon?: MediaReference;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };

  theme: {
    mode: 'light' | 'dark' | 'auto';
    customCSS?: string;
    variables?: Record<string, string>;
  };

  navigation: {
    items: NavigationItem[];
    footer?: NavigationItem[];
  };

  dashboard: {
    widgets: DashboardWidget[];
    layout: 'grid' | 'list';
  };

  advanced: {
    customCSS?: string;
    customJS?: string;
  };
}

interface NavigationItem {
  id: string;
  type: 'link' | 'divider' | 'group' | 'document-type';
  label?: string;
  icon?: string;
  href?: string;
  documentType?: string;
  hidden?: boolean;
  children?: NavigationItem[];
}

interface DashboardWidget {
  id: string;
  type: 'recent-documents' | 'tasks' | 'activity' | 'custom';
  position: { row: number; col: number; width: number; height: number };
  config?: Record<string, unknown>;
}
```

### Theme Variables

```css
/* Variables CSS customizables */
:root {
  /* Colors */
  --studio-color-primary: #0066cc;
  --studio-color-secondary: #6c757d;
  --studio-color-accent: #28a745;
  --studio-color-background: #ffffff;
  --studio-color-surface: #f8f9fa;
  --studio-color-text: #212529;
  --studio-color-text-muted: #6c757d;

  /* Typography */
  --studio-font-family: 'Inter', sans-serif;
  --studio-font-size-base: 14px;

  /* Spacing */
  --studio-spacing-unit: 4px;
  --studio-border-radius: 4px;

  /* Sidebar */
  --studio-sidebar-width: 240px;
  --studio-sidebar-background: #1a1a1a;
  --studio-sidebar-text: #ffffff;
}

/* Dark theme override */
[data-theme='dark'] {
  --studio-color-background: #121212;
  --studio-color-surface: #1e1e1e;
  --studio-color-text: #ffffff;
  --studio-color-text-muted: #a0a0a0;
}
```

### Configuration UI

```
┌─────────────────────────────────────────────────────────┐
│                    Studio Settings                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [Branding] [Theme] [Navigation] [Dashboard] [Advanced]  │
│                                                         │
│ ═══════════════════════════════════════════════════════ │
│                                                         │
│ Branding                                                │
│ ─────────                                               │
│ Project Name: [My Awesome CMS_____________]             │
│                                                         │
│ Logo:         [📷 Upload...] [Current: logo.svg]        │
│ Favicon:      [📷 Upload...] [Current: favicon.ico]     │
│                                                         │
│ Colors:                                                 │
│ Primary:      [████ #0066cc] [Pick Color]               │
│ Secondary:    [████ #6c757d] [Pick Color]               │
│ Accent:       [████ #28a745] [Pick Color]               │
│                                                         │
│ Preview:                                                │
│ ┌─────────────────────────────────────────────┐         │
│ │ [Logo] My Awesome CMS     [████] [████]    │         │
│ │                                             │         │
│ │  [Primary Button]  [Secondary Button]       │         │
│ └─────────────────────────────────────────────┘         │
│                                                         │
│                              [Reset to Default] [Save]  │
└─────────────────────────────────────────────────────────┘
```

### Navigation Builder

```typescript
// Configuración en código
import { defineStudio } from '@hooperits/cms';

export default defineStudio({
  navigation: [
    { type: 'divider', label: 'Content' },
    {
      type: 'group',
      label: 'Blog',
      icon: 'newspaper',
      children: [
        { type: 'document-type', documentType: 'post', label: 'Posts' },
        { type: 'document-type', documentType: 'category', label: 'Categories' },
        { type: 'document-type', documentType: 'author', label: 'Authors' },
      ],
    },
    {
      type: 'group',
      label: 'Shop',
      icon: 'shopping-cart',
      children: [
        { type: 'document-type', documentType: 'product' },
        { type: 'document-type', documentType: 'order' },
      ],
    },
    { type: 'divider', label: 'Settings' },
    { type: 'link', label: 'Site Settings', href: '/settings/site', icon: 'cog' },
    { type: 'link', label: 'Analytics', href: 'https://analytics.example.com', icon: 'chart', external: true },
  ],
});
```

---

## Out of Scope (This Spec)

- White-labeling completo (remover toda mención de HOOPERITS)
- Custom login page layouts
- Multi-tenant branding dinámico
- Temas por usuario (más allá de light/dark)
