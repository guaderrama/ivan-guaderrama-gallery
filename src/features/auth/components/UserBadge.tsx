import React from 'react';
import { useAuth } from '../context/AuthContext';

interface UserBadgeProps {
  className?: string;
  showRole?: boolean;
}

/**
 * User Badge Component
 *
 * Displays current user info with optional role badge
 */
export function UserBadge({ className, showRole = true }: UserBadgeProps) {
  const { user, isAdmin } = useAuth();

  if (!user) return null;

  return (
    <div className={className || 'flex items-center gap-2'}>
      {/* User Avatar/Initial */}
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
        {user.email?.[0]?.toUpperCase() || 'U'}
      </div>

      {/* User Info */}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-800">
          {user.displayName || user.email}
        </span>
        {showRole && (
          <span
            className={`text-xs ${
              isAdmin ? 'text-purple-600 font-semibold' : 'text-gray-500'
            }`}
          >
            {isAdmin ? 'Admin' : 'User'}
          </span>
        )}
      </div>
    </div>
  );
}
