import type { User as FirebaseUser } from 'firebase/auth';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: 'admin' | 'user';
}

export interface AuthContextType {
  /** Current authenticated user */
  user: AuthUser | null;
  /** Loading state during auth check */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<boolean>;
  /** Sign up new user */
  signUp: (email: string, password: string) => Promise<boolean>;
  /** Sign out current user */
  signOut: () => Promise<void>;
  /** Check if user is admin */
  isAdmin: boolean;
}

export interface UserRole {
  uid: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert Firebase User to AuthUser
 */
export function firebaseUserToAuthUser(fbUser: FirebaseUser, role?: 'admin' | 'user'): AuthUser {
  return {
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: fbUser.displayName,
    photoURL: fbUser.photoURL,
    role: role || 'user',
  };
}
