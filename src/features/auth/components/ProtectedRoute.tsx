import React, { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoginForm } from './LoginForm';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Require admin role */
  requireAdmin?: boolean;
  /** Custom fallback component */
  fallback?: ReactNode;
  /** Custom unauthorized component */
  unauthorized?: ReactNode;
}

/**
 * Protected Route Component
 *
 * Wraps components that require authentication.
 * Optionally requires admin role.
 *
 * @example
 * ```tsx
 * // Require any authenticated user
 * <ProtectedRoute>
 *   <AdminPanel />
 * </ProtectedRoute>
 *
 * // Require admin role
 * <ProtectedRoute requireAdmin>
 *   <AdminPanel />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
  children,
  requireAdmin = false,
  fallback,
  unauthorized,
}: ProtectedRouteProps) {
  const { user, loading, isAdmin } = useAuth();

  // Show loading state
  if (loading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      )
    );
  }

  // Show login if not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoginForm />
      </div>
    );
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin) {
    return (
      unauthorized || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You need admin privileges to access this page.
            </p>
            <p className="text-sm text-gray-500">
              Logged in as: <strong>{user.email}</strong>
            </p>
          </div>
        </div>
      )
    );
  }

  // Render protected content
  return <>{children}</>;
}
