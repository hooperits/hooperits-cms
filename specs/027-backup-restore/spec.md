# Feature Specification: Backup & Restore

**Feature Branch**: `027-backup-restore`
**Created**: 2026-01-29
**Status**: Draft
**Dependencies**: 001-cms-core
**Complexity**: M

---

## Executive Summary

Implementar sistema completo de backup y restauración que incluye backups automáticos programados, point-in-time recovery, y disaster recovery planning. Garantiza que los datos del CMS puedan recuperarse ante cualquier incidente, cumpliendo con mejores prácticas de continuidad de negocio.

---

## User Scenarios & Testing

### User Story 1 - Manual Backup (Priority: P1)

El administrador puede crear backups manuales del CMS completo o parcial.

**Why this priority**: Backups manuales son necesarios antes de cambios importantes.

**Independent Test**: Crear backup antes de migración, restaurar si algo falla.

**Acceptance Scenarios**:

1. **Given** admin panel, **When** hago click en "Create Backup", **Then** se genera backup completo
2. **Given** opciones de backup, **When** selecciono "solo contenido", **Then** excluye media pesados
3. **Given** backup en progreso, **When** reviso, **Then** veo progreso y ETA
4. **Given** backup completado, **When** descargo, **Then** obtengo archivo comprimido

---

### User Story 2 - Scheduled Backups (Priority: P1)

El sistema crea backups automáticos según programación configurada.

**Why this priority**: Backups automáticos son la línea base de cualquier DR plan.

**Independent Test**: Configurar backup diario a las 3am, verificar que se crea.

**Acceptance Scenarios**:

1. **Given** configuración de backups, **When** programo backup diario, **Then** se ejecuta automáticamente
2. **Given** backup programado, **When** falla, **Then** recibo notificación
3. **Given** múltiples schedules, **When** configuro (diario + semanal), **Then** ambos se respetan
4. **Given** retención configurada, **When** hay más backups del límite, **Then** los antiguos se eliminan

---

### User Story 3 - Restore from Backup (Priority: P1)

El administrador puede restaurar el CMS desde un backup previo.

**Why this priority**: La utilidad de un backup se mide por la capacidad de restaurar.

**Independent Test**: Eliminar contenido accidentalmente, restaurar desde backup de ayer.

**Acceptance Scenarios**:

1. **Given** backup disponible, **When** selecciono "Restore", **Then** se restaura el estado de ese momento
2. **Given** restore en progreso, **When** reviso, **Then** veo progreso y logs
3. **Given** opciones de restore, **When** elijo "solo contenido", **Then** no sobrescribe configuración
4. **Given** restore completado, **When** verifico, **Then** el CMS está en el estado del backup

---

### User Story 4 - Point-in-Time Recovery (Priority: P2)

El administrador puede restaurar a cualquier punto específico en el tiempo.

**Why this priority**: PITR permite recuperación granular sin depender de schedules de backup.

**Independent Test**: Restaurar al estado exacto de ayer a las 14:30.

**Acceptance Scenarios**:

1. **Given** PITR habilitado, **When** selecciono timestamp, **Then** puedo restaurar a ese momento exacto
2. **Given** ventana de PITR, **When** excedo (ej: >30 días), **Then** veo que no está disponible
3. **Given** PITR, **When** restauro, **Then** incluye cambios hasta ese microsegundo
4. **Given** costos de PITR, **When** configuro, **Then** puedo balancear granularidad vs storage

---

### User Story 5 - Off-site Storage (Priority: P2)

Los backups se almacenan en ubicación remota para disaster recovery.

**Why this priority**: Backups en mismo servidor no protegen contra fallo de hardware/DC.

**Independent Test**: Verificar que backup se copia a S3 en otra región.

**Acceptance Scenarios**:

1. **Given** S3 configurado, **When** backup se crea, **Then** se sube automáticamente
2. **Given** múltiples destinos, **When** configuro S3 + GCS, **Then** backup va a ambos
3. **Given** fallo de upload, **When** ocurre, **Then** se reintenta y notifica si falla definitivamente
4. **Given** backup remoto, **When** quiero restaurar, **Then** puedo desde el destino remoto

---

### User Story 6 - Backup Verification (Priority: P2)

El sistema verifica automáticamente que los backups son válidos y restaurables.

**Why this priority**: Backups corruptos o incompletos son peor que ningún backup.

**Independent Test**: Verificación automática post-backup prueba restore en ambiente aislado.

**Acceptance Scenarios**:

1. **Given** backup creado, **When** se completa, **Then** se ejecuta verificación automática
2. **Given** verificación, **When** encuentra problema, **Then** marca backup como inválido y notifica
3. **Given** backup verificado, **When** reviso, **Then** veo status de verificación con detalles
4. **Given** prueba de restore, **When** se ejecuta, **Then** es en ambiente aislado (no afecta prod)

---

### Edge Cases

- ¿Qué pasa si backup se interrumpe a mitad? Cleanup automático, retry desde inicio o checkpoint
- ¿Qué pasa con restore parcial (solo algunos documentos)? Soporte para restore selectivo
- ¿Qué pasa si el schema cambió desde el backup? Warnings, migración automática si es posible
- ¿Qué pasa con backups de datasets muy grandes (100GB+)? Streaming, incremental, compresión

---

## Requirements

### Functional Requirements

**Manual Backup:**
- **FR-001**: Sistema DEBE permitir crear backup manual desde UI y CLI
- **FR-002**: Sistema DEBE permitir seleccionar qué incluir (contenido, media, config, users)
- **FR-003**: Sistema DEBE mostrar progreso durante backup
- **FR-004**: Sistema DEBE permitir descargar backup como archivo

**Scheduled Backups:**
- **FR-005**: Sistema DEBE permitir programar backups (diario, semanal, etc.)
- **FR-006**: Sistema DEBE ejecutar backups en horario de bajo tráfico (configurable)
- **FR-007**: Sistema DEBE notificar si backup programado falla
- **FR-008**: Sistema DEBE aplicar políticas de retención (mantener últimos N, últimos N días)

**Restore:**
- **FR-009**: Sistema DEBE permitir restaurar desde cualquier backup disponible
- **FR-010**: Sistema DEBE permitir restore completo o parcial
- **FR-011**: Sistema DEBE mostrar progreso durante restore
- **FR-012**: Sistema DEBE crear backup automático antes de restore (rollback)

**Point-in-Time Recovery:**
- **FR-013**: Sistema DEBE mantener WAL/logs para PITR (si PostgreSQL lo soporta)
- **FR-014**: Sistema DEBE permitir especificar timestamp exacto para restore
- **FR-015**: Sistema DEBE mostrar ventana de PITR disponible
- **FR-016**: Sistema DEBE permitir configurar retención de PITR logs

**Storage:**
- **FR-017**: Sistema DEBE soportar storage local para backups
- **FR-018**: Sistema DEBE soportar S3/S3-compatible para backups remotos
- **FR-019**: Sistema DEBE soportar múltiples destinos simultáneos
- **FR-020**: Sistema DEBE encriptar backups en reposo (opcional)

**Verification:**
- **FR-021**: Sistema DEBE verificar integridad de backup (checksums)
- **FR-022**: Sistema DEBE probar restaurabilidad automáticamente (opcional)
- **FR-023**: Sistema DEBE marcar backups como verified/unverified
- **FR-024**: Sistema DEBE notificar si verificación falla

### Key Entities

- **Backup**: Registro de backup con metadata, status, verificación
- **BackupSchedule**: Configuración de backup programado
- **RestorePoint**: Punto de restauración disponible (backup o PITR)
- **BackupDestination**: Configuración de destino de almacenamiento

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Backup de 10GB completa en <15 minutos
- **SC-002**: Restore de 10GB completa en <30 minutos
- **SC-003**: 100% de backups pasan verificación de integridad
- **SC-004**: Backups programados tienen 99.9% de reliability
- **SC-005**: PITR disponible hasta 30 días atrás (configurable)
- **SC-006**: Upload a S3 completa antes de 2x tiempo de creación local

---

## Technical Notes

### Backup Format

```typescript
// Estructura de backup
interface Backup {
  id: string;
  type: 'full' | 'incremental' | 'differential';
  createdAt: Date;
  completedAt?: Date;
  status: 'in_progress' | 'completed' | 'failed' | 'verified';

  // Qué incluye
  includes: {
    content: boolean;
    media: boolean;
    config: boolean;
    users: boolean;
  };

  // Metadata
  metadata: {
    documentCount: number;
    mediaCount: number;
    totalSize: number;
    compressedSize: number;
    cmsVersion: string;
    schemaVersion: string;
  };

  // Storage
  storage: {
    local?: { path: string };
    s3?: { bucket: string; key: string };
  };

  // Verification
  verification?: {
    status: 'pending' | 'passed' | 'failed';
    verifiedAt?: Date;
    checksums: Record<string, string>;
    restoreTest?: {
      status: 'passed' | 'failed';
      testedAt: Date;
      log: string;
    };
  };
}
```

### Backup Process

```typescript
async function createBackup(options: BackupOptions): Promise<Backup> {
  const backup = await db.backup.create({
    data: {
      type: options.type || 'full',
      status: 'in_progress',
      includes: options.includes,
    },
  });

  try {
    // 1. Crear directorio temporal
    const tempDir = await createTempDir();

    // 2. Dump de base de datos
    if (options.includes.content || options.includes.users || options.includes.config) {
      await dumpDatabase(tempDir, options);
    }

    // 3. Copiar media files
    if (options.includes.media) {
      await copyMediaFiles(tempDir, options);
    }

    // 4. Guardar metadata
    await saveMetadata(tempDir, backup);

    // 5. Comprimir
    const archivePath = await compressBackup(tempDir);

    // 6. Calcular checksums
    const checksums = await calculateChecksums(archivePath);

    // 7. Subir a destinos
    const storage = await uploadToDestinations(archivePath, options.destinations);

    // 8. Actualizar registro
    await db.backup.update({
      where: { id: backup.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        storage,
        metadata: await getBackupMetadata(tempDir),
        verification: { status: 'pending', checksums },
      },
    });

    // 9. Cleanup
    await cleanup(tempDir);

    // 10. Trigger verificación async
    await verificationQueue.add({ backupId: backup.id });

    return backup;
  } catch (error) {
    await db.backup.update({
      where: { id: backup.id },
      data: { status: 'failed', error: error.message },
    });
    throw error;
  }
}
```

### Database Dump with PostgreSQL

```typescript
async function dumpDatabase(destDir: string, options: BackupOptions): Promise<void> {
  const tables = [];

  if (options.includes.content) {
    tables.push('documents', 'media', 'versions');
  }
  if (options.includes.users) {
    tables.push('users', 'sessions', 'permissions');
  }
  if (options.includes.config) {
    tables.push('settings', 'schemas', 'webhooks');
  }

  // Usar pg_dump para backup consistente
  await exec(`pg_dump \
    --host=${DB_HOST} \
    --port=${DB_PORT} \
    --username=${DB_USER} \
    --format=custom \
    --file=${destDir}/database.dump \
    ${tables.map(t => `--table=${t}`).join(' ')} \
    ${DB_NAME}
  `);
}

// Para PITR, configurar PostgreSQL para archivar WAL
// postgresql.conf:
// archive_mode = on
// archive_command = 'aws s3 cp %p s3://backup-bucket/wal/%f'
```

### Restore Process

```typescript
async function restoreFromBackup(backupId: string, options: RestoreOptions): Promise<void> {
  const backup = await db.backup.findUnique({ where: { id: backupId } });

  // 1. Crear backup de seguridad antes de restore
  if (options.createSafetyBackup) {
    await createBackup({ type: 'full', includes: { content: true, media: true, config: true, users: true } });
  }

  // 2. Descargar backup si es remoto
  const archivePath = await downloadBackup(backup);

  // 3. Verificar checksums
  if (!await verifyChecksums(archivePath, backup.verification.checksums)) {
    throw new Error('Backup integrity check failed');
  }

  // 4. Extraer
  const extractDir = await extractBackup(archivePath);

  // 5. Restaurar base de datos
  if (options.includes.content || options.includes.users || options.includes.config) {
    // Poner CMS en maintenance mode
    await setMaintenanceMode(true);

    // Restore
    await exec(`pg_restore \
      --host=${DB_HOST} \
      --port=${DB_PORT} \
      --username=${DB_USER} \
      --dbname=${DB_NAME} \
      --clean \
      ${options.includes.content ? '' : '--exclude-table=documents'} \
      ${extractDir}/database.dump
    `);

    await setMaintenanceMode(false);
  }

  // 6. Restaurar media
  if (options.includes.media) {
    await restoreMediaFiles(extractDir);
  }

  // 7. Invalidar cachés
  await invalidateAllCaches();

  // 8. Log restore event
  await db.restoreLog.create({
    data: {
      backupId,
      restoredAt: new Date(),
      restoredBy: options.userId,
      includes: options.includes,
    },
  });
}
```

### Admin UI

```
┌─────────────────────────────────────────────────────────────────────┐
│ Backup & Restore                                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Quick Actions                                                   │ │
│ │ [Create Backup Now]  [Restore from Backup]  [Configure Schedule]│ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ Scheduled Backups: ● Enabled (Daily at 3:00 AM)    [Configure]     │
│ Retention: Keep last 30 days                                        │
│ Destinations: Local + S3 (us-east-1)                               │
│                                                                     │
│ Recent Backups:                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Date                 Type    Size    Status      Actions        │ │
│ │ ───────────────────────────────────────────────────────────────│ │
│ │ 2024-01-15 03:00    Full    4.2GB   ✓ Verified  [⬇️][🔄][🗑️]   │ │
│ │ 2024-01-14 03:00    Full    4.1GB   ✓ Verified  [⬇️][🔄][🗑️]   │ │
│ │ 2024-01-13 03:00    Full    4.1GB   ✓ Verified  [⬇️][🔄][🗑️]   │ │
│ │ 2024-01-13 10:30    Manual  4.1GB   ⚠️ Unverified [⬇️][🔄][🗑️]  │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ Point-in-Time Recovery:                                             │
│ Available window: Jan 1, 2024 00:00 - Jan 15, 2024 14:32 (now)     │
│ [Select timestamp for recovery...]                                  │
│                                                                     │
│ Storage Usage:                                                      │
│ Local: 45.2 GB / 100 GB   [████████░░] 45%                         │
│ S3:    45.2 GB / Unlimited                                         │
└─────────────────────────────────────────────────────────────────────┘
```

### CLI Commands

```bash
# Crear backup
cms backup create --full
cms backup create --content-only --destination s3://my-bucket

# Listar backups
cms backup list
cms backup list --status verified

# Restaurar
cms backup restore <backup-id>
cms backup restore <backup-id> --content-only --dry-run

# Point-in-time recovery
cms backup restore --pitr "2024-01-15 14:30:00"

# Verificar backup
cms backup verify <backup-id>

# Configurar schedule
cms backup schedule --daily --time "03:00" --retention 30d
```

---

## Out of Scope (This Spec)

- Continuous replication a standby server
- Multi-region active-active
- Backup encryption key management (HSM)
- Disaster recovery runbooks/automation
