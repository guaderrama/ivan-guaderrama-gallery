import React from 'react';
import { useAuth } from '../context/AuthContext';

interface LogoutButtonProps {
  className?: string;
  onSuccess?: () => void;
}

/**
 * Logout Button Component
 *
 * Simple button to sign out the current user
 */
export function LogoutButton({ className, onSuccess }: LogoutButtonProps) {
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) return null;

  return (
    <button
      onClick={handleLogout}
      className={
        className ||
        'px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors duration-200'
      }
    >
      Sign Out
    </button>
  );
}
