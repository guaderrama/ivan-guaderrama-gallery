import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import type { MiniWork, NewMiniWork, MiniWorkStatus } from '../types';

const COLLECTION_NAME = 'mini-works';

/**
 * Mini Works Service
 *
 * Handles mini artworks with archive functionality and Firestore persistence.
 */

export const miniWorksService = {
  /**
   * Create a new mini work
   */
  async createMiniWork(work: NewMiniWork): Promise<string> {
    try {
      const worksRef = collection(db, COLLECTION_NAME);
      const docRef = await addDoc(worksRef, {
        ...work,
        status: 'active',
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating mini work:', error);
      throw new Error('Failed to create mini work');
    }
  },

  /**
   * Update a mini work
   */
  async updateMiniWork(id: string | number, updates: Partial<MiniWork>): Promise<void> {
    try {
      const workRef = doc(db, COLLECTION_NAME, id.toString());
      await updateDoc(workRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating mini work:', error);
      throw new Error('Failed to update mini work');
    }
  },

  /**
   * Archive/unarchive a mini work
   */
  async archiveMiniWork(id: string | number): Promise<void> {
    try {
      const workRef = doc(db, COLLECTION_NAME, id.toString());
      const workDoc = await getDoc(workRef);

      if (!workDoc.exists()) {
        throw new Error('Mini work not found');
      }

      const currentStatus = workDoc.data().status || 'active';
      const newStatus: MiniWorkStatus = currentStatus === 'archived' ? 'active' : 'archived';

      await updateDoc(workRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error archiving mini work:', error);
      throw new Error('Failed to archive mini work');
    }
  },

  /**
   * Delete a mini work (soft delete)
   */
  async deleteMiniWork(id: string | number): Promise<void> {
    try {
      const workRef = doc(db, COLLECTION_NAME, id.toString());
      await updateDoc(workRef, {
        status: 'deleted',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error deleting mini work:', error);
      throw new Error('Failed to delete mini work');
    }
  },

  /**
   * Restore a mini work
   */
  async restoreMiniWork(id: string | number): Promise<void> {
    try {
      const workRef = doc(db, COLLECTION_NAME, id.toString());
      await updateDoc(workRef, {
        status: 'active',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error restoring mini work:', error);
      throw new Error('Failed to restore mini work');
    }
  },

  /**
   * Get all mini works
   */
  async getAllMiniWorks(): Promise<MiniWork[]> {
    try {
      const worksRef = collection(db, COLLECTION_NAME);
      const q = query(
        worksRef,
        where('status', '!=', 'deleted'),
        orderBy('status'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt instanceof Timestamp
          ? doc.data().createdAt.toDate().toISOString()
          : new Date().toISOString(),
      })) as MiniWork[];
    } catch (error) {
      console.error('Error getting all mini works:', error);
      throw new Error('Failed to fetch mini works');
    }
  },

  /**
   * Get mini works by status
   */
  async getMiniWorksByStatus(status: MiniWorkStatus): Promise<MiniWork[]> {
    try {
      const worksRef = collection(db, COLLECTION_NAME);
      const q = query(
        worksRef,
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt instanceof Timestamp
          ? doc.data().createdAt.toDate().toISOString()
          : new Date().toISOString(),
      })) as MiniWork[];
    } catch (error) {
      console.error('Error getting mini works by status:', error);
      throw new Error('Failed to fetch mini works');
    }
  },

  /**
   * Subscribe to all mini works (real-time)
   */
  subscribeToAllMiniWorks(callback: (works: MiniWork[]) => void): () => void {
    const worksRef = collection(db, COLLECTION_NAME);
    const q = query(
      worksRef,
      where('status', '!=', 'deleted'),
      orderBy('status'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const works = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt instanceof Timestamp
            ? doc.data().createdAt.toDate().toISOString()
            : new Date().toISOString(),
        })) as MiniWork[];

        callback(works);
      },
      (error) => {
        console.error('Error in mini works subscription:', error);
      }
    );

    return unsubscribe;
  },

  /**
   * Subscribe to mini works by status (real-time)
   */
  subscribeToMiniWorksByStatus(status: MiniWorkStatus, callback: (works: MiniWork[]) => void): () => void {
    const worksRef = collection(db, COLLECTION_NAME);
    const q = query(
      worksRef,
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const works = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt instanceof Timestamp
            ? doc.data().createdAt.toDate().toISOString()
            : new Date().toISOString(),
        })) as MiniWork[];

        callback(works);
      },
      (error) => {
        console.error('Error in mini works subscription:', error);
      }
    );

    return unsubscribe;
  },
};
