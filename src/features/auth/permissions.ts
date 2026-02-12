import type { Permission, AppRole } from './types';
import { ROLE_PERMISSIONS } from './types';

/**
 * Check if any of the given roles has a specific permission
 */
export function rolesHavePermission(roles: AppRole[], permission: Permission): boolean {
  if (!roles || roles.length === 0) return false;
  return roles.some(role => (ROLE_PERMISSIONS[role] as readonly string[]).includes(permission));
}

/**
 * Check if any of the given roles has at least one of the permissions
 */
export function rolesHaveAnyPermission(roles: AppRole[], permissions: Permission[]): boolean {
  if (!roles || roles.length === 0) return false;
  return permissions.some(p => rolesHavePermission(roles, p));
}

/**
 * Check if roles include superadmin
 */
export function isSuperAdmin(roles: AppRole[]): boolean {
  return roles.includes('superadmin');
}
