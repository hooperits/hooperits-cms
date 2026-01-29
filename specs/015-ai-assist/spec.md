# Feature Specification: AI Assist

**Feature Branch**: `015-ai-assist`
**Created**: 2026-01-29
**Status**: Draft
**Dependencies**: 001-cms-core, 005-rich-text-portable
**Complexity**: L

---

## Executive Summary

Integrar asistencia de IA configurable para ayudar a editores con tareas de contenido: generación de texto, reescritura, traducción, resumen, SEO suggestions, y más. Soporta múltiples proveedores (OpenAI, Anthropic, Ollama local) respetando el principio de self-hosted (LLM local como opción).

---

## User Scenarios & Testing

### User Story 1 - Text Generation (Priority: P1)

El editor puede generar texto basado en un prompt usando IA directamente en el editor.

**Why this priority**: Generación de texto es el caso de uso más común de IA en editores.

**Independent Test**: Escribir "Genera introducción sobre beneficios de Next.js" y recibir párrafo generado.

**Acceptance Scenarios**:

1. **Given** el editor de rich text, **When** activo AI assist, **Then** puedo escribir un prompt
2. **Given** un prompt, **When** ejecuto, **Then** la IA genera texto relevante
3. **Given** texto generado, **When** reviso, **Then** puedo insertarlo, editarlo, o descartarlo
4. **Given** múltiples sugerencias, **When** genero alternativas, **Then** puedo elegir entre varias

---

### User Story 2 - Text Improvement (Priority: P1)

El editor puede mejorar texto existente: reescribir, simplificar, expandir, o cambiar tono.

**Why this priority**: Mejorar texto existente es más útil que generar desde cero.

**Independent Test**: Seleccionar párrafo, pedir "hazlo más conciso", recibir versión mejorada.

**Acceptance Scenarios**:

1. **Given** texto seleccionado, **When** pido "reescribir más formal", **Then** recibo versión formal
2. **Given** texto técnico, **When** pido "simplificar para principiantes", **Then** recibo versión simplificada
3. **Given** texto corto, **When** pido "expandir con más detalle", **Then** recibo versión extendida
4. **Given** mejora propuesta, **When** acepto, **Then** reemplaza el texto original

---

### User Story 3 - AI Translation (Priority: P2)

El editor puede traducir contenido usando IA como alternativa a traducción manual.

**Why this priority**: Traducción es tarea común y la IA puede acelerar significativamente.

**Independent Test**: Seleccionar post en español, traducir a inglés con IA, revisar y ajustar.

**Acceptance Scenarios**:

1. **Given** documento en español, **When** pido traducir a inglés, **Then** se genera traducción
2. **Given** traducción generada, **When** reviso, **Then** puedo editar antes de guardar
3. **Given** campos localizados, **When** traduzco, **Then** se llena el idioma destino
4. **Given** traducción parcial, **When** hay texto que no traduzco, **Then** se preserva original

---

### User Story 4 - SEO Suggestions (Priority: P2)

La IA puede sugerir mejoras de SEO: meta descriptions, títulos optimizados, keywords.

**Why this priority**: SEO es técnico y la IA puede hacer sugerencias útiles.

**Independent Test**: Analizar post y recibir sugerencias de meta description y título SEO-friendly.

**Acceptance Scenarios**:

1. **Given** un post completo, **When** pido sugerencias SEO, **Then** recibo meta description propuesta
2. **Given** título existente, **When** pido optimizar para SEO, **Then** recibo alternativas
3. **Given** contenido, **When** pido keywords, **Then** recibo lista de términos relevantes
4. **Given** sugerencia SEO, **When** acepto, **Then** se llena el campo correspondiente

---

### User Story 5 - Provider Configuration (Priority: P1)

El administrador puede configurar qué proveedor de IA usar, respetando opción self-hosted.

**Why this priority**: Flexibilidad de proveedores respeta el principio de zero external dependencies.

**Independent Test**: Configurar Ollama local como proveedor de IA sin usar servicios externos.

**Acceptance Scenarios**:

1. **Given** configuración, **When** elijo OpenAI, **Then** las llamadas van a OpenAI API
2. **Given** configuración, **When** elijo Ollama local, **Then** las llamadas van al servidor local
3. **Given** API keys, **When** las configuro, **Then** se almacenan de forma segura
4. **Given** proveedor no disponible, **When** intento usar IA, **Then** veo error claro

---

### User Story 6 - Usage Controls (Priority: P2)

El administrador puede controlar quién puede usar IA y establecer límites de uso.

**Why this priority**: Control de costos y acceso es importante para proveedores pagos.

**Independent Test**: Establecer límite de 100 requests/día por usuario, verificar que se respeta.

**Acceptance Scenarios**:

1. **Given** límite de uso, **When** usuario lo alcanza, **Then** ve mensaje de límite
2. **Given** roles, **When** configuro que solo Admin usa IA, **Then** Editor no ve la opción
3. **Given** métricas de uso, **When** reviso dashboard, **Then** veo uso por usuario/día
4. **Given** costos de API, **When** se trackean, **Then** tengo visibilidad de gasto estimado

---

### Edge Cases

- ¿Qué pasa si el proveedor de IA está caído? Mensaje de error, opción de reintentar
- ¿Qué pasa con contenido sensible/inapropiado generado? Disclaimer, opción de moderar
- ¿Qué pasa con rate limits del proveedor? Queue de requests, backoff automático
- ¿Qué pasa con documentos muy largos? Chunking del contenido, procesamiento por partes

---

## Requirements

### Functional Requirements

**AI Features:**
- **FR-001**: Sistema DEBE permitir generar texto desde prompt
- **FR-002**: Sistema DEBE permitir reescribir texto seleccionado
- **FR-003**: Sistema DEBE permitir resumir contenido largo
- **FR-004**: Sistema DEBE permitir traducir texto a otros idiomas
- **FR-005**: Sistema DEBE permitir sugerir mejoras SEO

**Editor Integration:**
- **FR-006**: Sistema DEBE integrar AI assist en el editor de rich text
- **FR-007**: Sistema DEBE mostrar respuesta de IA con opción de aceptar/rechazar
- **FR-008**: Sistema DEBE preservar formato al insertar texto generado
- **FR-009**: Sistema DEBE permitir editar texto generado antes de insertar

**Provider Support:**
- **FR-010**: Sistema DEBE soportar OpenAI API (GPT-4, GPT-3.5)
- **FR-011**: Sistema DEBE soportar Anthropic API (Claude)
- **FR-012**: Sistema DEBE soportar Ollama para LLM local
- **FR-013**: Sistema DEBE abstraer proveedores con interfaz común
- **FR-014**: Sistema DEBE permitir configurar modelo específico por proveedor

**Configuration:**
- **FR-015**: Sistema DEBE almacenar API keys de forma segura (encrypted)
- **FR-016**: Sistema DEBE permitir configurar proveedor default
- **FR-017**: Sistema DEBE permitir prompts personalizados por tipo de asistencia
- **FR-018**: Sistema DEBE permitir configurar parámetros (temperature, max_tokens)

**Usage Control:**
- **FR-019**: Sistema DEBE permitir límites de uso por usuario o rol
- **FR-020**: Sistema DEBE trackear uso de AI por usuario y función
- **FR-021**: Sistema DEBE permitir deshabilitar AI para ciertos roles
- **FR-022**: Sistema DEBE mostrar métricas de uso en dashboard admin

### Key Entities

- **AIProvider**: Configuración de proveedor (type, apiKey, model, endpoint)
- **AIPromptTemplate**: Template de prompt para cada tipo de asistencia
- **AIUsageLog**: Registro de uso (user, type, tokens, timestamp)
- **AIResponse**: Respuesta de IA con texto generado y metadata

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Respuestas de IA llegan en <5 segundos para prompts típicos
- **SC-002**: 90% de usuarios encuentran útil el texto generado (medido por aceptación)
- **SC-003**: Integración con 3+ proveedores (OpenAI, Anthropic, Ollama)
- **SC-004**: 100% de API keys almacenadas con encryption
- **SC-005**: Dashboard de uso muestra métricas en tiempo real
- **SC-006**: LLM local (Ollama) funciona sin conectividad externa

---

## Technical Notes

### Provider Abstraction

```typescript
interface AIProvider {
  name: string;
  generate(prompt: string, options?: AIOptions): Promise<AIResponse>;
  stream?(prompt: string, options?: AIOptions): AsyncGenerator<string>;
}

interface AIOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

interface AIResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
  model: string;
  provider: string;
}

// Implementaciones
class OpenAIProvider implements AIProvider {
  async generate(prompt: string, options?: AIOptions): Promise<AIResponse> {
    const response = await openai.chat.completions.create({
      model: options?.model ?? 'gpt-4',
      messages: [
        { role: 'system', content: options?.systemPrompt ?? '' },
        { role: 'user', content: prompt },
      ],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1000,
    });
    // ...
  }
}

class OllamaProvider implements AIProvider {
  constructor(private endpoint: string = 'http://localhost:11434') {}

  async generate(prompt: string, options?: AIOptions): Promise<AIResponse> {
    const response = await fetch(`${this.endpoint}/api/generate`, {
      method: 'POST',
      body: JSON.stringify({
        model: options?.model ?? 'llama2',
        prompt,
        options: { temperature: options?.temperature ?? 0.7 },
      }),
    });
    // ...
  }
}
```

### Prompt Templates

```typescript
const PROMPT_TEMPLATES = {
  rewrite_formal: `
    Reescribe el siguiente texto en un tono más formal y profesional.
    Mantén el significado original pero usa vocabulario más sofisticado.

    Texto original:
    {input}

    Texto formal:
  `,

  summarize: `
    Resume el siguiente texto en {length} oraciones.
    Mantén los puntos clave y la información más importante.

    Texto:
    {input}

    Resumen:
  `,

  seo_meta: `
    Genera una meta description optimizada para SEO basada en el siguiente contenido.
    La meta description debe tener entre 120-160 caracteres, incluir palabras clave relevantes,
    y ser atractiva para el usuario.

    Título: {title}
    Contenido: {content}

    Meta description:
  `,

  translate: `
    Traduce el siguiente texto de {sourceLang} a {targetLang}.
    Mantén el tono y estilo original. No traduzcas nombres propios o términos técnicos
    que se usan comúnmente en el idioma original.

    Texto en {sourceLang}:
    {input}

    Traducción en {targetLang}:
  `,
};
```

### Editor Integration

```tsx
// Componente de AI Assist en el editor
function AIAssistButton({ selectedText, onInsert }) {
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const actions = [
    { id: 'rewrite', label: 'Reescribir', icon: '✏️' },
    { id: 'simplify', label: 'Simplificar', icon: '📝' },
    { id: 'expand', label: 'Expandir', icon: '📖' },
    { id: 'formal', label: 'Más formal', icon: '👔' },
    { id: 'translate', label: 'Traducir', icon: '🌐' },
  ];

  const handleAction = async (actionId: string) => {
    setLoading(true);
    const response = await fetch('/api/ai/assist', {
      method: 'POST',
      body: JSON.stringify({
        action: actionId,
        text: selectedText,
      }),
    });
    const data = await response.json();
    setResult(data.text);
    setLoading(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger>
        <Button variant="ghost" size="sm">✨ AI</Button>
      </PopoverTrigger>
      <PopoverContent>
        {!result ? (
          <div className="grid grid-cols-2 gap-2">
            {actions.map(action => (
              <Button
                key={action.id}
                onClick={() => handleAction(action.id)}
                disabled={loading}
              >
                {action.icon} {action.label}
              </Button>
            ))}
          </div>
        ) : (
          <div>
            <p className="text-sm mb-2">{result}</p>
            <div className="flex gap-2">
              <Button onClick={() => onInsert(result)}>Insertar</Button>
              <Button variant="ghost" onClick={() => setResult(null)}>Otra vez</Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
```

---

## Out of Scope (This Spec)

- Image generation (DALL-E, Midjourney)
- Automatic content moderation
- AI-powered chatbot para el frontend
- Voice transcription
