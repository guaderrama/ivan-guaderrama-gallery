import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/shared/lib/firebase';
import { useAuth } from '../context/AuthContext';

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { signIn, signUp, error: authError, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password) {
      setLocalError('Completa todos los campos');
      return;
    }

    if (password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    const success = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    if (success && onSuccess) {
      onSuccess();
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setResetSent(false);

    if (!email) {
      setLocalError('Ingresa tu email');
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        // Don't reveal if user exists or not - show success anyway
        setResetSent(true);
      } else if (err.code === 'auth/invalid-email') {
        setLocalError('Email inválido');
      } else {
        setLocalError('Error al enviar el correo. Intenta de nuevo.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const displayError = localError || authError;

  // Reset password view
  if (isResetPassword) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">
          Restablecer Contraseña
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Te enviaremos un enlace para crear una nueva contraseña.
        </p>

        {resetSent ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800 font-medium">Correo enviado</p>
              <p className="text-sm text-green-700 mt-1">
                Revisa tu bandeja de entrada en <strong>{email}</strong> y haz clic en el enlace para crear tu nueva contraseña.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsResetPassword(false);
                setResetSent(false);
                setLocalError(null);
              }}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-200"
            >
              Volver a Iniciar Sesión
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={resetLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="correo@ejemplo.com"
                autoComplete="email"
              />
            </div>

            {displayError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{displayError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={resetLoading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition-colors duration-200"
            >
              {resetLoading ? 'Enviando...' : 'Enviar enlace'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsResetPassword(false);
                  setLocalError(null);
                }}
                disabled={resetLoading}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Volver a Iniciar Sesión
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // Login / Sign up view
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="correo@ejemplo.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="••••••••"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
          />
          {isSignUp && (
            <p className="mt-1 text-xs text-gray-500">Mínimo 6 caracteres</p>
          )}
        </div>

        {displayError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{displayError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition-colors duration-200"
        >
          {loading ? 'Cargando...' : isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
        </button>

        {!isSignUp && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsResetPassword(true);
                setLocalError(null);
              }}
              disabled={loading}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setLocalError(null);
            }}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:text-blue-400"
          >
            {isSignUp
              ? '¿Ya tienes cuenta? Inicia sesión'
              : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </form>
    </div>
  );
}
