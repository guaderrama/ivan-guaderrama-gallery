import { useState, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { AppRole } from '@/features/auth/types';
import type { ManagedUser } from '../types';

interface ListUsersResponse {
  success: boolean;
  users: Array<{
    uid: string;
    email: string;
    displayName: string;
    roles: string[];
    createdAt: string | null;
    updatedAt: string | null;
  }>;
}

export function useUserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const functions = getFunctions();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const listUsersFn = httpsCallable<void, ListUsersResponse>(functions, 'listUsers');
      const result = await listUsersFn();
      // Map response to ManagedUser with roles array
      const mapped: ManagedUser[] = result.data.users.map(u => ({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName || undefined,
        roles: (u.roles || []) as AppRole[],
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }));
      setUsers(mapped);
    } catch (err: any) {
      const msg = err?.message || 'Error al cargar usuarios';
      setError(msg);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [functions]);

  const setUserRoles = useCallback(async (targetUid: string, roles: AppRole[]) => {
    setError(null);
    try {
      const setRolesFn = httpsCallable<{ targetUid: string; roles: string[] }, { success: boolean }>(functions, 'setUserRoles');
      await setRolesFn({ targetUid, roles });
      // Update local state
      setUsers(prev => prev.map(u => u.uid === targetUid ? { ...u, roles } : u));
    } catch (err: any) {
      const msg = err?.message || 'Error al cambiar roles';
      setError(msg);
      console.error('Error setting user roles:', err);
      throw err;
    }
  }, [functions]);

  const changeUserPassword = useCallback(async (targetUid: string, newPassword: string) => {
    setError(null);
    try {
      const changePasswordFn = httpsCallable<{ targetUid: string; newPassword: string }, { success: boolean }>(functions, 'changeUserPassword');
      await changePasswordFn({ targetUid, newPassword });
    } catch (err: any) {
      const msg = err?.message || 'Error al cambiar contraseña';
      setError(msg);
      console.error('Error changing password:', err);
      throw err;
    }
  }, [functions]);

  return { users, loading, error, fetchUsers, setUserRoles, changeUserPassword };
}
