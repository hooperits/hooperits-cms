# Feature Specification: CLI Enhancements

**Feature Branch**: `020-cli-enhancements`
**Created**: 2026-01-29
**Status**: Draft
**Dependencies**: 001-cms-core
**Complexity**: M

---

## Executive Summary

Extender el CLI del CMS con comandos adicionales para tareas comunes de desarrollo y operaciones: queries desde terminal, export/import de contenido, backups, diagnósticos, y más. Esto mejora la experiencia del desarrollador y facilita automatización en CI/CD.

---

## User Scenarios & Testing

### User Story 1 - Query Command (Priority: P1)

El desarrollador puede ejecutar queries HQL directamente desde la terminal.

**Why this priority**: Queries rápidas desde terminal son útiles para debug y scripting.

**Independent Test**: Ejecutar `cms query '*[_type == "post"][0..4]'` y ver resultados JSON.

**Acceptance Scenarios**:

1. **Given** el CLI, **When** ejecuto `cms query 'HQL'`, **Then** veo resultados en JSON
2. **Given** query con params, **When** paso `--param id=123`, **Then** se sustituyen en la query
3. **Given** resultados, **When** uso `--format table`, **Then** muestra en formato tabla
4. **Given** query inválida, **When** ejecuto, **Then** veo error descriptivo

---

### User Story 2 - Export Command (Priority: P1)

El desarrollador puede exportar contenido a JSON/NDJSON para backup o migración.

**Why this priority**: Export es esencial para backups y transferencia entre environments.

**Independent Test**: Ejecutar `cms export --type post --output posts.json`.

**Acceptance Scenarios**:

1. **Given** contenido existente, **When** ejecuto `cms export`, **Then** genera archivo con todos los documentos
2. **Given** filtro por tipo, **When** uso `--type post`, **Then** solo exporta posts
3. **Given** formato NDJSON, **When** uso `--format ndjson`, **Then** genera un documento por línea
4. **Given** export incremental, **When** uso `--since 2024-01-01`, **Then** solo exporta modificados después de esa fecha

---

### User Story 3 - Import Command (Priority: P1)

El desarrollador puede importar contenido desde archivos JSON/NDJSON.

**Why this priority**: Import permite restaurar backups y migrar de otros sistemas.

**Independent Test**: Ejecutar `cms import posts.json` e ver documentos creados.

**Acceptance Scenarios**:

1. **Given** archivo JSON, **When** ejecuto `cms import file.json`, **Then** crea los documentos
2. **Given** documentos existentes, **When** importo con `--update`, **Then** actualiza en lugar de crear
3. **Given** import con errores, **When** un documento falla, **Then** continúa y reporta errores al final
4. **Given** dry run, **When** uso `--dry-run`, **Then** muestra qué haría sin ejecutar

---

### User Story 4 - Doctor Command (Priority: P2)

El desarrollador puede diagnosticar problemas de configuración y health del CMS.

**Why this priority**: Diagnósticos automáticos aceleran troubleshooting.

**Independent Test**: Ejecutar `cms doctor` y ver reporte de estado.

**Acceptance Scenarios**:

1. **Given** CMS configurado, **When** ejecuto `cms doctor`, **Then** verifica conexión a DB, schemas, etc.
2. **Given** problema detectado, **When** doctor lo encuentra, **Then** muestra descripción y sugerencia de fix
3. **Given** todo OK, **When** ejecuto, **Then** muestra checkmarks verdes
4. **Given** opción verbose, **When** uso `--verbose`, **Then** muestra detalles de cada check

---

### User Story 5 - Backup Command (Priority: P2)

El desarrollador puede crear backups completos del CMS (contenido + media).

**Why this priority**: Backups confiables son críticos para operaciones.

**Independent Test**: Ejecutar `cms backup --output backup.tar.gz` y verificar contenido.

**Acceptance Scenarios**:

1. **Given** el CMS, **When** ejecuto `cms backup`, **Then** genera archivo con DB dump y media
2. **Given** backup sin media, **When** uso `--no-media`, **Then** solo incluye contenido
3. **Given** destino S3, **When** uso `--destination s3://bucket/path`, **Then** sube directamente
4. **Given** backup programado, **When** configuro cron, **Then** funciona automáticamente

---

### User Story 6 - Schema Commands (Priority: P2)

El desarrollador puede inspeccionar y validar schemas desde el CLI.

**Why this priority**: Validación de schemas antes de deploy previene errores.

**Independent Test**: Ejecutar `cms schema validate` y ver si hay errores.

**Acceptance Scenarios**:

1. **Given** schemas, **When** ejecuto `cms schema list`, **Then** veo lista de tipos definidos
2. **Given** schema específico, **When** ejecuto `cms schema show post`, **Then** veo su estructura
3. **Given** schemas, **When** ejecuto `cms schema validate`, **Then** verifica consistencia y errores
4. **Given** diff de schemas, **When** ejecuto `cms schema diff`, **Then** muestra cambios vs DB actual

---

### Edge Cases

- ¿Qué pasa si export es muy grande (100K+ documentos)? Streaming, progress bar, memory efficient
- ¿Qué pasa si import tiene IDs duplicados? Opciones: skip, update, fail
- ¿Qué pasa con media en import/export? Referencias se mantienen, opción de incluir binarios
- ¿Qué pasa si DB no está disponible? Error claro con sugerencias de troubleshooting

---

## Requirements

### Functional Requirements

**Query:**
- **FR-001**: CLI DEBE soportar comando `cms query <hql>` para ejecutar queries
- **FR-002**: CLI DEBE soportar parámetros con `--param key=value`
- **FR-003**: CLI DEBE soportar formatos de output: json, ndjson, table, csv
- **FR-004**: CLI DEBE soportar pipe de resultados para scripting

**Export:**
- **FR-005**: CLI DEBE soportar `cms export` para exportar contenido
- **FR-006**: CLI DEBE soportar filtro por tipo con `--type`
- **FR-007**: CLI DEBE soportar filtro por fecha con `--since` y `--until`
- **FR-008**: CLI DEBE soportar formatos: json, ndjson
- **FR-009**: CLI DEBE soportar export a stdout o archivo

**Import:**
- **FR-010**: CLI DEBE soportar `cms import <file>` para importar contenido
- **FR-011**: CLI DEBE soportar `--update` para actualizar documentos existentes
- **FR-012**: CLI DEBE soportar `--dry-run` para preview sin ejecutar
- **FR-013**: CLI DEBE reportar errores y continuar con `--continue-on-error`
- **FR-014**: CLI DEBE soportar input desde stdin

**Doctor:**
- **FR-015**: CLI DEBE verificar conexión a base de datos
- **FR-016**: CLI DEBE verificar schemas son válidos
- **FR-017**: CLI DEBE verificar configuración de storage
- **FR-018**: CLI DEBE verificar permisos y accesos
- **FR-019**: CLI DEBE sugerir fixes para problemas encontrados

**Backup:**
- **FR-020**: CLI DEBE soportar `cms backup` para backup completo
- **FR-021**: CLI DEBE incluir dump de base de datos
- **FR-022**: CLI DEBE incluir media files (opcional)
- **FR-023**: CLI DEBE soportar destinos: local, S3, GCS
- **FR-024**: CLI DEBE comprimir backups

**Schema:**
- **FR-025**: CLI DEBE soportar `cms schema list` para listar tipos
- **FR-026**: CLI DEBE soportar `cms schema show <type>` para ver estructura
- **FR-027**: CLI DEBE soportar `cms schema validate` para verificar schemas
- **FR-028**: CLI DEBE soportar `cms schema diff` para comparar con DB

### Key Entities

- **CLICommand**: Definición de comando con opciones y handler
- **ExportOptions**: Opciones de exportación (type, since, format)
- **ImportResult**: Resultado de importación (created, updated, errors)
- **DoctorCheck**: Verificación de diagnóstico con resultado y sugerencia

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Query command responde en <2 segundos para queries simples
- **SC-002**: Export de 10K documentos completa en <1 minuto
- **SC-003**: Import de 10K documentos completa en <5 minutos
- **SC-004**: Doctor command completa todos los checks en <30 segundos
- **SC-005**: Backup completo (10GB media) completa en <10 minutos
- **SC-006**: Todos los comandos tienen `--help` documentado

---

## Technical Notes

### Command Structure

```bash
# Query
cms query '*[_type == "post"]' --format table
cms query '*[_id == $id]' --param id=abc123 --format json

# Export
cms export --output backup.json
cms export --type post,page --format ndjson --output content.ndjson
cms export --since 2024-01-01 | gzip > incremental.json.gz

# Import
cms import backup.json
cms import content.ndjson --update --continue-on-error
cat documents.json | cms import --stdin

# Doctor
cms doctor
cms doctor --verbose
cms doctor --fix  # Intenta arreglar problemas automáticamente

# Backup
cms backup --output ./backups/backup-$(date +%Y%m%d).tar.gz
cms backup --no-media --destination s3://mybucket/backups/

# Schema
cms schema list
cms schema show post --format json
cms schema validate
cms schema diff  # Compara schemas vs DB actual
```

### Implementation

```typescript
// Estructura del CLI usando commander
import { Command } from 'commander';
import { createCMSClient } from '@hooperits/cms/client';

const program = new Command();

program
  .name('cms')
  .description('HOOPERITS CMS Command Line Interface')
  .version('1.0.0');

// Query command
program
  .command('query <hql>')
  .description('Execute an HQL query')
  .option('-p, --param <params...>', 'Query parameters (key=value)')
  .option('-f, --format <format>', 'Output format', 'json')
  .option('--pretty', 'Pretty print JSON output')
  .action(async (hql, options) => {
    const client = await createCMSClient();
    const params = parseParams(options.param);
    const results = await client.query(hql, params);
    output(results, options.format, options.pretty);
  });

// Export command
program
  .command('export')
  .description('Export content to file')
  .option('-t, --type <types...>', 'Document types to export')
  .option('-o, --output <file>', 'Output file (default: stdout)')
  .option('-f, --format <format>', 'Output format', 'json')
  .option('--since <date>', 'Only export documents modified after date')
  .option('--include-drafts', 'Include draft documents')
  .action(async (options) => {
    const client = await createCMSClient();
    const stream = client.exportDocuments(options);

    if (options.output) {
      const file = createWriteStream(options.output);
      stream.pipe(file);
    } else {
      stream.pipe(process.stdout);
    }
  });

// Doctor command
program
  .command('doctor')
  .description('Diagnose CMS configuration and health')
  .option('-v, --verbose', 'Show detailed output')
  .option('--fix', 'Attempt to fix issues automatically')
  .action(async (options) => {
    const checks = [
      { name: 'Database connection', fn: checkDatabase },
      { name: 'Schema validation', fn: checkSchemas },
      { name: 'Storage configuration', fn: checkStorage },
      { name: 'Environment variables', fn: checkEnv },
    ];

    for (const check of checks) {
      const result = await check.fn();
      printCheckResult(check.name, result, options.verbose);

      if (!result.ok && options.fix && result.fix) {
        await result.fix();
        console.log(`  ↳ Fixed!`);
      }
    }
  });
```

### Export/Import Format

```json
// JSON format
{
  "version": "1.0",
  "exportedAt": "2024-01-15T10:30:00Z",
  "documents": [
    {
      "_id": "post-123",
      "_type": "post",
      "_createdAt": "2024-01-10T10:00:00Z",
      "_updatedAt": "2024-01-15T09:00:00Z",
      "title": "Hello World",
      "slug": "hello-world",
      "content": [...]
    }
  ]
}

// NDJSON format (one document per line)
{"_id":"post-123","_type":"post","title":"Hello World",...}
{"_id":"post-456","_type":"post","title":"Second Post",...}
```

### Doctor Output

```
$ cms doctor

HOOPERITS CMS Doctor
====================

✓ Database connection
  └─ PostgreSQL 14.5 at localhost:5432

✓ Schema validation
  └─ 12 schemas validated, 0 errors

✗ Storage configuration
  └─ S3 bucket 'my-bucket' is not accessible
  └─ Suggestion: Check AWS credentials in environment variables

✓ Environment variables
  └─ All required variables present

─────────────────────────
Summary: 3 passed, 1 failed

Run with --fix to attempt automatic fixes
```

---

## Out of Scope (This Spec)

- GUI wizard (usar Inquirer prompts en v2)
- Watch mode para desarrollo
- Plugin para generar schemas desde DB existente
- Benchmark/performance testing commands
