import type { User as FirebaseUser } from 'firebase/auth';

// ─── Role Definitions ───────────────────────────────────
export const ROLES = ['superadmin', 'editor_catalogo', 'editor_seriadas', 'gestor_crm', 'gestor_cursos', 'visualizador'] as const;
export type AppRole = typeof ROLES[number];

// ─── Permission Definitions ─────────────────────────────
export const PERMISSIONS = [
  'catalog:read',
  'catalog:write',
  'editions:read',
  'editions:write',
  'simulator:access',
  'crm:read',
  'crm:write',
  'courses:read',
  'courses:write',
  'users:manage',
] as const;
export type Permission = typeof PERMISSIONS[number];

// ─── Role → Permission Map ──────────────────────────────
export const ROLE_PERMISSIONS: Record<AppRole, readonly Permission[]> = {
  superadmin: PERMISSIONS,
  editor_catalogo: [
    'catalog:read', 'catalog:write',
    'editions:read', 'editions:write',
    'simulator:access',
  ],
  editor_seriadas: [
    'editions:read', 'editions:write',
    'simulator:access',
  ],
  gestor_crm: [
    'crm:read', 'crm:write',
    'simulator:access',
  ],
  gestor_cursos: [
    'courses:read', 'courses:write',
    'simulator:access',
  ],
  visualizador: [
    'catalog:read',
    'editions:read',
    'simulator:access',
  ],
} as const;

// ─── Role Display Labels ────────────────────────────────
export const ROLE_LABELS: Record<AppRole, string> = {
  superadmin: 'Administrador',
  editor_catalogo: 'Editor de Catálogo',
  editor_seriadas: 'Editor de Seriadas',
  gestor_crm: 'Gestor CRM',
  gestor_cursos: 'Gestor de Cursos',
  visualizador: 'Visualizador',
};

export const ROLE_COLORS: Record<AppRole, string> = {
  superadmin: 'text-red-600 font-semibold',
  editor_catalogo: 'text-blue-600 font-semibold',
  editor_seriadas: 'text-purple-600 font-semibold',
  gestor_crm: 'text-green-600 font-semibold',
  gestor_cursos: 'text-orange-600 font-semibold',
  visualizador: 'text-gray-600 font-semibold',
};

// ─── Auth Interfaces ────────────────────────────────────
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  roles: AppRole[];
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  roles: AppRole[];
}

export interface UserDocument {
  uid: string;
  email: string;
  roles: AppRole[];
  displayName?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert Firebase User to AuthUser
 */
export function firebaseUserToAuthUser(fbUser: FirebaseUser, roles: AppRole[]): AuthUser {
  return {
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: fbUser.displayName,
    photoURL: fbUser.photoURL,
    roles,
  };
}
