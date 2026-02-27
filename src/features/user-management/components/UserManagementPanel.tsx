import React, { useEffect, useState } from 'react';
import { useUserManagement } from '../hooks/useUserManagement';
import { ROLES, ROLE_LABELS, ROLE_COLORS } from '@/features/auth/types';
import type { AppRole } from '@/features/auth/types';

const UserManagementPanel: React.FC = () => {
  const { users, loading, error, fetchUsers, setUserRoles, changeUserPassword, createUser } = useUserManagement();
  const [changingUid, setChangingUid] = useState<string | null>(null);
  const [pendingRoles, setPendingRoles] = useState<Record<string, AppRole[]>>({});

  // Create user state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRoles, setCreateRoles] = useState<AppRole[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Password change state
  const [passwordUid, setPasswordUid] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [visiblePasswordUid, setVisiblePasswordUid] = useState<string | null>(null);

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

  const handleOpenPasswordChange = (uid: string) => {
    setPasswordUid(uid);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setPasswordSuccess(null);
  };

  const handleCancelPasswordChange = () => {
    setPasswordUid(null);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
  };

  const handleChangePassword = async () => {
    if (!passwordUid) return;
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.');
      return;
    }

    const user = users.find(u => u.uid === passwordUid);
    const confirmed = window.confirm(
      `¿Cambiar la contraseña de ${user?.email || passwordUid}?`
    );
    if (!confirmed) return;

    setPasswordLoading(true);
    try {
      await changeUserPassword(passwordUid, newPassword);
      setPasswordSuccess(user?.email || passwordUid);
      setPasswordUid(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPasswordError('Error al cambiar la contraseña.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCreateUser = async () => {
    setCreateError(null);

    if (!createEmail.trim()) {
      setCreateError('El email es requerido.');
      return;
    }
    if (createPassword.length < 6) {
      setCreateError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (createRoles.length === 0) {
      setCreateError('Debes asignar al menos un rol.');
      return;
    }

    setCreateLoading(true);
    try {
      await createUser(createEmail.trim(), createPassword, createRoles);
      setShowCreateForm(false);
      setCreateEmail('');
      setCreatePassword('');
      setCreateRoles([]);
    } catch {
      // error handled in hook, but show local too
      setCreateError('Error al crear el usuario. Verifica los datos.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleCreateRole = (role: AppRole) => {
    setCreateRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
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
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold font-serif text-gray-900 text-center sm:text-left">
            Gestión de Usuarios
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Asigna uno o más roles para controlar el acceso de cada usuario.
          </p>
        </div>
        {!showCreateForm && (
          <button
            onClick={() => { setShowCreateForm(true); setCreateError(null); }}
            className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors whitespace-nowrap self-center sm:self-auto"
          >
            + Agregar Usuario
          </button>
        )}
      </div>

      {/* Create user form */}
      {showCreateForm && (
        <div className="border border-blue-300 bg-blue-50/30 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-gray-800 mb-3">Nuevo Usuario</p>
          {createError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md mb-3 text-xs">
              {createError}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input
              type="email"
              value={createEmail}
              onChange={e => setCreateEmail(e.target.value)}
              placeholder="Email"
              disabled={createLoading}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <input
              type="password"
              value={createPassword}
              onChange={e => setCreatePassword(e.target.value)}
              placeholder="Contraseña (mín. 6)"
              disabled={createLoading}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
          <div className="mb-3">
            <p className="text-xs text-gray-600 mb-2">Roles:</p>
            <div className="flex flex-wrap gap-2">
              {ROLES.map(role => {
                const isActive = createRoles.includes(role);
                const colorClass = ROLE_COLORS[role].replace('font-semibold', '').trim();
                return (
                  <label
                    key={role}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all border ${
                      isActive
                        ? `${colorClass} bg-white border-current shadow-sm`
                        : 'text-gray-400 border-gray-200 bg-gray-50 hover:border-gray-300'
                    } ${createLoading ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => handleToggleCreateRole(role)}
                      disabled={createLoading}
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
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateUser}
              disabled={createLoading}
              className="px-4 py-2 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {createLoading ? 'Creando...' : 'Crear Usuario'}
            </button>
            <button
              onClick={() => { setShowCreateForm(false); setCreateError(null); }}
              disabled={createLoading}
              className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-6 text-sm">
        Los cambios de rol surten efecto cuando el usuario cierra sesión e inicia de nuevo.
      </div>

      {passwordSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm flex justify-between items-center">
          <span>Contraseña de <strong>{passwordSuccess}</strong> actualizada correctamente.</span>
          <button onClick={() => setPasswordSuccess(null)} className="text-green-500 hover:text-green-700 ml-2">✕</button>
        </div>
      )}

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

                {/* Save / Cancel / Password buttons */}
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
                  {!hasChanges && passwordUid !== user.uid && (
                    <>
                      {user.password && (
                        <button
                          onClick={() => setVisiblePasswordUid(prev => prev === user.uid ? null : user.uid)}
                          title={visiblePasswordUid === user.uid ? 'Ocultar contraseña' : 'Ver contraseña'}
                          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          {visiblePasswordUid === user.uid ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenPasswordChange(user.uid)}
                        title="Cambiar contraseña"
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
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

              {/* Show password */}
              {visiblePasswordUid === user.uid && user.password && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-500">Contraseña:</span>
                  <code className="text-xs bg-gray-100 border border-gray-200 px-2 py-0.5 rounded font-mono text-gray-800">{user.password}</code>
                </div>
              )}

              {/* Inline password change form */}
              {passwordUid === user.uid && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-700 mb-2">Cambiar contraseña de {user.email}</p>
                  {passwordError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md mb-2 text-xs">
                      {passwordError}
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Nueva contraseña (mín. 6)"
                      disabled={passwordLoading}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirmar contraseña"
                      disabled={passwordLoading}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleChangePassword}
                        disabled={passwordLoading}
                        className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                      >
                        {passwordLoading ? 'Cambiando...' : 'Cambiar'}
                      </button>
                      <button
                        onClick={handleCancelPasswordChange}
                        disabled={passwordLoading}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
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
