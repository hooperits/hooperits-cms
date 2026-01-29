/**
 * HOOPERITS CMS - Permissions
 * Role-based access control
 */

export type UserRole = 'ADMIN' | 'EDITOR' | 'VIEWER';

export type Permission =
  | '*' // All permissions
  | 'content:read'
  | 'content:create'
  | 'content:update'
  | 'content:delete'
  | 'content:publish'
  | 'media:read'
  | 'media:create'
  | 'media:delete'
  | 'user:read'
  | 'user:create'
  | 'user:update'
  | 'user:delete'
  | 'schema:read'
  | 'schema:sync';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: ['*'],
  EDITOR: [
    'content:read',
    'content:create',
    'content:update',
    'content:delete',
    'content:publish',
    'media:read',
    'media:create',
    'media:delete',
    'schema:read',
  ],
  VIEWER: ['content:read', 'media:read', 'schema:read'],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes('*') || permissions.includes(permission);
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Check if a role can perform an action on content
 */
export function canManageContent(role: UserRole): boolean {
  return hasPermission(role, 'content:create') || hasPermission(role, '*');
}

/**
 * Check if a role can manage users
 */
export function canManageUsers(role: UserRole): boolean {
  return hasPermission(role, 'user:create') || hasPermission(role, '*');
}

/**
 * Check if a role can publish content
 */
export function canPublishContent(role: UserRole): boolean {
  return hasPermission(role, 'content:publish') || hasPermission(role, '*');
}

/**
 * Check if a role can sync schemas
 */
export function canSyncSchemas(role: UserRole): boolean {
  return hasPermission(role, 'schema:sync') || hasPermission(role, '*');
}

/**
 * Guard function that throws if permission is denied
 */
export function requirePermission(role: UserRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Permission denied: ${permission}`);
  }
}
