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
import type { AuthContextType, AuthUser, UserRole } from '../types';
import { firebaseUserToAuthUser } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider Component
 *
 * Manages authentication state globally:
 * - Listens to Firebase auth state changes
 * - Fetches user role from Firestore
 * - Provides sign in/up/out methods
 * - Exposes auth state to entire app
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch user role from Firestore
   */
  const fetchUserRole = async (uid: string): Promise<'admin' | 'user'> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));

      if (userDoc.exists()) {
        const userData = userDoc.data() as UserRole;
        return userData.role || 'user';
      }

      // If user doc doesn't exist, create it with default role
      await setDoc(doc(db, 'users', uid), {
        uid,
        email: auth.currentUser?.email || '',
        role: 'user',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return 'user';
    } catch (err) {
      console.error('Error fetching user role:', err);
      return 'user'; // Default to user role on error
    }
  };

  /**
   * Listen to auth state changes
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setLoading(true);

      if (firebaseUser) {
        // User is signed in
        const role = await fetchUserRole(firebaseUser.uid);
        const authUser = firebaseUserToAuthUser(firebaseUser, role);
        setUser(authUser);
      } else {
        // User is signed out
        setUser(null);
      }

      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const role = await fetchUserRole(userCredential.user.uid);
      const authUser = firebaseUserToAuthUser(userCredential.user, role);

      setUser(authUser);
      setLoading(false);

      return true;
    } catch (err: any) {
      let errorMessage = 'Failed to sign in';

      // Firebase error codes
      switch (err.code) {
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
          errorMessage = err.message || 'Failed to sign in';
      }

      setError(errorMessage);
      setLoading(false);
      console.error('Sign in error:', err);

      return false;
    }
  };

  /**
   * Sign up with email and password
   */
  const signUp = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        role: 'user', // Default role
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const authUser = firebaseUserToAuthUser(userCredential.user, 'user');
      setUser(authUser);
      setLoading(false);

      return true;
    } catch (err: any) {
      let errorMessage = 'Failed to create account';

      switch (err.code) {
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
          errorMessage = err.message || 'Failed to create account';
      }

      setError(errorMessage);
      setLoading(false);
      console.error('Sign up error:', err);

      return false;
    }
  };

  /**
   * Sign out current user
   */
  const signOut = async (): Promise<void> => {
    try {
      setError(null);
      await firebaseSignOut(auth);
      setUser(null);
    } catch (err: any) {
      setError(err.message || 'Failed to sign out');
      console.error('Sign out error:', err);
      throw err;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook
 *
 * Access authentication context from any component
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, signIn, signOut } = useAuth();
 *
 *   if (!user) {
 *     return <button onClick={() => signIn(email, pass)}>Login</button>;
 *   }
 *
 *   return <button onClick={signOut}>Logout</button>;
 * }
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
