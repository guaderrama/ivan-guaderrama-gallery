import type { AppRole } from '@/features/auth/types';

export interface ManagedUser {
  uid: string;
  email: string;
  roles: AppRole[];
  displayName?: string;
  password?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}
