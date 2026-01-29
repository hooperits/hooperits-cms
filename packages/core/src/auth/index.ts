/**
 * HOOPERITS CMS - Auth Module
 * Public API for authentication
 */

// Password utilities
export { hashPassword, verifyPassword, validatePasswordStrength } from './password';

// Permissions
export type { UserRole, Permission } from './permissions';
export {
  hasPermission,
  getPermissions,
  canManageContent,
  canManageUsers,
  canPublishContent,
  canSyncSchemas,
  requirePermission,
} from './permissions';

// User service
export type { UserInput, User, UserWithPassword } from './service';
export {
  createUser,
  authenticateUser,
  getUserById,
  getUserByEmail,
  updateUser,
  updatePassword,
  deleteUser,
  listUsers,
} from './service';
