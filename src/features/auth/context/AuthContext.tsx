import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/shared/lib/firebase';
import type { AuthContextType, AuthUser, AppRole, Permission } from '../types';
import { firebaseUserToAuthUser, ROLES } from '../types';
import { rolesHavePermission, rolesHaveAnyPermission } from '../permissions';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch user roles: try Custom Claims first, fallback to Firestore
   * Supports both new format (roles: []) and legacy format (role: string)
   */
  const fetchRoles = async (firebaseUser: FirebaseUser): Promise<AppRole[]> => {
    try {
      // 1. Try Custom Claims (authoritative after migration)
      const tokenResult = await firebaseUser.getIdTokenResult();

      // New format: roles array
      const claimRoles = tokenResult.claims.roles as string[] | undefined;
      if (Array.isArray(claimRoles) && claimRoles.length > 0) {
        return claimRoles.filter(r => (ROLES as readonly string[]).includes(r)) as AppRole[];
      }

      // Legacy format: single role string
      const claimRole = tokenResult.claims.role as string | undefined;
      if (claimRole && (ROLES as readonly string[]).includes(claimRole)) {
        return [claimRole as AppRole];
      }

      // 2. Fallback: read from Firestore (pre-migration / legacy)
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();

        // New format: roles array in Firestore
        if (Array.isArray(data.roles) && data.roles.length > 0) {
          return data.roles.filter((r: string) => (ROLES as readonly string[]).includes(r)) as AppRole[];
        }

        // Legacy format: single role string
        const firestoreRole = data.role as string;
        if (firestoreRole === 'admin') return ['superadmin'];
        if ((ROLES as readonly string[]).includes(firestoreRole)) {
          return [firestoreRole as AppRole];
        }
      }

      // 3. No roles found - create user doc with no roles
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      return [];
    } catch (err) {
      console.error('Error fetching user roles:', err);
      return [];
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setLoading(true);

      if (firebaseUser) {
        const roles = await fetchRoles(firebaseUser);
        const authUser = firebaseUserToAuthUser(firebaseUser, roles);
        setUser(authUser);
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const roles = await fetchRoles(userCredential.user);
      const authUser = firebaseUserToAuthUser(userCredential.user, roles);

      setUser(authUser);
      setLoading(false);
      return true;
    } catch (err: unknown) {
      let errorMessage = 'Failed to sign in';
      const firebaseErr = err as { code?: string; message?: string };

      switch (firebaseErr.code) {
        case 'auth/user-not-found':
          errorMessage = 'No user found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Try again later';
          break;
        default:
          errorMessage = firebaseErr.message || 'Failed to sign in';
      }

      setError(errorMessage);
      setLoading(false);
      console.error('Sign in error:', err);
      return false;
    }
  };

  const signUp = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const authUser = firebaseUserToAuthUser(userCredential.user, []);
      setUser(authUser);
      setLoading(false);
      return true;
    } catch (err: unknown) {
      let errorMessage = 'Failed to create account';
      const firebaseErr = err as { code?: string; message?: string };

      switch (firebaseErr.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email already in use';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters';
          break;
        default:
          errorMessage = firebaseErr.message || 'Failed to create account';
      }

      setError(errorMessage);
      setLoading(false);
      console.error('Sign up error:', err);
      return false;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setError(null);
      await firebaseSignOut(auth);
      setUser(null);
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      setError(firebaseErr.message || 'Failed to sign out');
      console.error('Sign out error:', err);
      throw err;
    }
  };

  const userRoles = user?.roles ?? [];

  const hasPermission = (permission: Permission): boolean => {
    return rolesHavePermission(userRoles, permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return rolesHaveAnyPermission(userRoles, permissions);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    isAdmin: userRoles.includes('superadmin'),
    hasPermission,
    hasAnyPermission,
    roles: userRoles,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
