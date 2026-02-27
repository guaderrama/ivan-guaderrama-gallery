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
    password: string | null;
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
        password: u.password || null,
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
      // Update local state with new password
      setUsers(prev => prev.map(u => u.uid === targetUid ? { ...u, password: newPassword } : u));
    } catch (err: any) {
      const msg = err?.message || 'Error al cambiar contraseña';
      setError(msg);
      console.error('Error changing password:', err);
      throw err;
    }
  }, [functions]);

  const createUser = useCallback(async (email: string, password: string, roles: AppRole[]) => {
    setError(null);
    try {
      const createUserFn = httpsCallable<{ email: string; password: string; roles: string[] }, { success: boolean; uid: string }>(functions, 'createUser');
      const result = await createUserFn({ email, password, roles });
      // Add to local state
      const newUser: ManagedUser = {
        uid: result.data.uid,
        email,
        roles,
        password,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUsers(prev => [newUser, ...prev]);
      return result.data.uid;
    } catch (err: any) {
      const msg = err?.message || 'Error al crear usuario';
      setError(msg);
      console.error('Error creating user:', err);
      throw err;
    }
  }, [functions]);

  return { users, loading, error, fetchUsers, setUserRoles, changeUserPassword, createUser };
}
