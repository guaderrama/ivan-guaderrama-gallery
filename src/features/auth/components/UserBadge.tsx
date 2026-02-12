import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS, ROLE_COLORS } from '../types';

interface UserBadgeProps {
  className?: string;
  showRole?: boolean;
}

export function UserBadge({ className, showRole = true }: UserBadgeProps) {
  const { user, roles } = useAuth();

  if (!user) return null;

  return (
    <div className={className || 'flex items-center gap-2'}>
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
        {user.email?.[0]?.toUpperCase() || 'U'}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-800">
          {user.displayName || user.email}
        </span>
        {showRole && (
          <span className="text-xs">
            {roles.length > 0
              ? roles.map((r, i) => (
                  <span key={r}>
                    {i > 0 && <span className="text-gray-400"> · </span>}
                    <span className={ROLE_COLORS[r]}>{ROLE_LABELS[r]}</span>
                  </span>
                ))
              : <span className="text-gray-500">Sin rol asignado</span>
            }
          </span>
        )}
      </div>
    </div>
  );
}
