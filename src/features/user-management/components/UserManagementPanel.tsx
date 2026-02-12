import React, { useEffect, useState } from 'react';
import { useUserManagement } from '../hooks/useUserManagement';
import { ROLES, ROLE_LABELS, ROLE_COLORS } from '@/features/auth/types';
import type { AppRole } from '@/features/auth/types';

const UserManagementPanel: React.FC = () => {
  const { users, loading, error, fetchUsers, setUserRoles } = useUserManagement();
  const [changingUid, setChangingUid] = useState<string | null>(null);
  const [pendingRoles, setPendingRoles] = useState<Record<string, AppRole[]>>({});

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleRole = (uid: string, role: AppRole, currentRoles: AppRole[]) => {
    const base = pendingRoles[uid] ?? currentRoles;
    const newRoles = base.includes(role)
      ? base.filter(r => r !== role)
      : [...base, role];
    setPendingRoles(prev => ({ ...prev, [uid]: newRoles }));
  };

  const hasPendingChanges = (uid: string, currentRoles: AppRole[]): boolean => {
    const pending = pendingRoles[uid];
    if (!pending) return false;
    if (pending.length !== currentRoles.length) return true;
    return !pending.every(r => currentRoles.includes(r));
  };

  const handleSaveRoles = async (uid: string) => {
    const roles = pendingRoles[uid];
    if (!roles || roles.length === 0) {
      alert('Debes asignar al menos un rol.');
      return;
    }

    const user = users.find(u => u.uid === uid);
    const roleLabels = roles.map(r => ROLE_LABELS[r]).join(', ');
    const confirmed = window.confirm(
      `¿Cambiar los roles de ${user?.email || uid} a: ${roleLabels}?\n\nEl usuario deberá cerrar sesión e iniciar de nuevo para que el cambio surta efecto.`
    );
    if (!confirmed) return;

    setChangingUid(uid);
    try {
      await setUserRoles(uid, roles);
      // Clear pending state for this user
      setPendingRoles(prev => {
        const next = { ...prev };
        delete next[uid];
        return next;
      });
    } catch {
      // error is handled in the hook
    } finally {
      setChangingUid(null);
    }
  };

  const handleCancelChanges = (uid: string) => {
    setPendingRoles(prev => {
      const next = { ...prev };
      delete next[uid];
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-1">
      <div className="mb-6">
        <h2 className="text-3xl font-bold font-serif text-gray-900 text-center sm:text-left">
          Gestión de Usuarios
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Asigna uno o más roles para controlar el acceso de cada usuario.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-6 text-sm">
        Los cambios de rol surten efecto cuando el usuario cierra sesión e inicia de nuevo.
      </div>

      <div className="space-y-4">
        {users.map(user => {
          const displayRoles = pendingRoles[user.uid] ?? user.roles;
          const hasChanges = hasPendingChanges(user.uid, user.roles);
          const isChanging = changingUid === user.uid;

          return (
            <div key={user.uid} className={`border rounded-lg p-4 ${hasChanges ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200'}`}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                {/* User info */}
                <div className="flex-shrink-0">
                  <span className="text-sm font-medium text-gray-900">{user.email}</span>
                  {user.displayName && (
                    <span className="block text-xs text-gray-500">{user.displayName}</span>
                  )}
                  <span className="block text-xs text-gray-400 mt-0.5">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-MX') : '—'}
                  </span>
                </div>

                {/* Role checkboxes */}
                <div className="flex flex-wrap gap-2">
                  {ROLES.map(role => {
                    const isActive = displayRoles.includes(role);
                    const colorClass = ROLE_COLORS[role].replace('font-semibold', '').trim();

                    return (
                      <label
                        key={role}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all border ${
                          isActive
                            ? `${colorClass} bg-white border-current shadow-sm`
                            : 'text-gray-400 border-gray-200 bg-gray-50 hover:border-gray-300'
                        } ${isChanging ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={() => handleToggleRole(user.uid, role, user.roles)}
                          disabled={isChanging}
                          className="sr-only"
                        />
                        <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                          isActive ? 'bg-current border-current' : 'border-gray-300'
                        }`}>
                          {isActive && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        {ROLE_LABELS[role]}
                      </label>
                    );
                  })}
                </div>

                {/* Save / Cancel buttons */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  {hasChanges && (
                    <>
                      <button
                        onClick={() => handleSaveRoles(user.uid)}
                        disabled={isChanging}
                        className="px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
                      >
                        {isChanging ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button
                        onClick={() => handleCancelChanges(user.uid)}
                        disabled={isChanging}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Current roles display */}
              {user.roles.length > 0 && !hasChanges && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {user.roles.map(r => (
                    <span key={r} className={`text-xs px-2 py-0.5 rounded-full bg-white border ${ROLE_COLORS[r].replace('font-semibold', '').trim()} border-current`}>
                      {ROLE_LABELS[r]}
                    </span>
                  ))}
                </div>
              )}
              {user.roles.length === 0 && !hasChanges && (
                <div className="mt-2">
                  <span className="text-xs text-gray-400 italic">Sin roles asignados</span>
                </div>
              )}
            </div>
          );
        })}
        {users.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            No hay usuarios registrados.
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementPanel;
