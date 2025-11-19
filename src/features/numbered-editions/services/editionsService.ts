import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import type { NumberedProduct, Edition, NewNumberedProductData, NewEditionData, SeriesStatus, EditionStatus } from '../types';

const SERIES_COLLECTION = 'numbered-editions';
const EDITIONS_SUBCOLLECTION = 'editions';

/**
 * Numbered Editions Service
 *
 * Handles series (numbered-editions collection) and their individual editions (subcollection).
 * Uses Firestore with subcollections pattern.
 */

export const editionsService = {
  // ============= SERIES OPERATIONS =============

  /**
   * Create a new numbered series
   */
  async createSeries(seriesData: NewNumberedProductData): Promise<string> {
    try {
      const seriesRef = collection(db, SERIES_COLLECTION);
      const docRef = await addDoc(seriesRef, {
        ...seriesData,
        seriesStatus: 'active',
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating series:', error);
      throw new Error('Failed to create series');
    }
  },

  /**
   * Update a series
   */
  async updateSeries(seriesId: string | number, updates: Partial<NumberedProduct>): Promise<void> {
    try {
      const seriesRef = doc(db, SERIES_COLLECTION, seriesId.toString());
      await updateDoc(seriesRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating series:', error);
      throw new Error('Failed to update series');
    }
  },

  /**
   * Archive/unarchive a series
   */
  async archiveSeries(seriesId: string | number): Promise<void> {
    try {
      const seriesRef = doc(db, SERIES_COLLECTION, seriesId.toString());
      const seriesDoc = await getDoc(seriesRef);

      if (!seriesDoc.exists()) {
        throw new Error('Series not found');
      }

      const currentStatus = seriesDoc.data().seriesStatus || 'active';
      const newStatus: SeriesStatus = currentStatus === 'archived' ? 'active' : 'archived';

      await updateDoc(seriesRef, {
        seriesStatus: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error archiving series:', error);
      throw new Error('Failed to archive series');
    }
  },

  /**
   * Delete a series (soft delete)
   */
  async deleteSeries(seriesId: string | number): Promise<void> {
    try {
      const seriesRef = doc(db, SERIES_COLLECTION, seriesId.toString());
      await updateDoc(seriesRef, {
        seriesStatus: 'deleted',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error deleting series:', error);
      throw new Error('Failed to delete series');
    }
  },

  /**
   * Get all series (with editions)
   */
  async getAllSeries(): Promise<NumberedProduct[]> {
    try {
      const seriesRef = collection(db, SERIES_COLLECTION);
      const q = query(
        seriesRef,
        where('seriesStatus', '!=', 'deleted'),
        orderBy('seriesStatus'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const seriesList: NumberedProduct[] = [];

      for (const seriesDoc of snapshot.docs) {
        const seriesData = seriesDoc.data();

        // Get editions for this series
        const editions = await editionsService.getEditionsBySeries(seriesDoc.id);

        seriesList.push({
          id: seriesDoc.id,
          ...seriesData,
          editions,
          createdAt: seriesData.createdAt instanceof Timestamp
            ? seriesData.createdAt.toDate().toISOString()
            : new Date().toISOString(),
        } as NumberedProduct);
      }

      return seriesList;
    } catch (error) {
      console.error('Error getting all series:', error);
      throw new Error('Failed to fetch series');
    }
  },

  /**
   * Subscribe to series changes (real-time)
   */
  subscribeToAllSeries(callback: (series: NumberedProduct[]) => void): () => void {
    const seriesRef = collection(db, SERIES_COLLECTION);
    const q = query(
      seriesRef,
      where('seriesStatus', '!=', 'deleted'),
      orderBy('seriesStatus'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const seriesList: NumberedProduct[] = [];

        for (const seriesDoc of snapshot.docs) {
          const seriesData = seriesDoc.data();

          // Get editions for this series
          const editions = await editionsService.getEditionsBySeries(seriesDoc.id);

          seriesList.push({
            id: seriesDoc.id,
            ...seriesData,
            editions,
            createdAt: seriesData.createdAt instanceof Timestamp
              ? seriesData.createdAt.toDate().toISOString()
              : new Date().toISOString(),
          } as NumberedProduct);
        }

        callback(seriesList);
      },
      (error) => {
        console.error('Error in series subscription:', error);
      }
    );

    return unsubscribe;
  },

  // ============= EDITIONS OPERATIONS =============

  /**
   * Create a new edition in a series
   */
  async createEdition(seriesId: string | number, editionData: NewEditionData): Promise<string> {
    try {
      const editionsRef = collection(db, SERIES_COLLECTION, seriesId.toString(), EDITIONS_SUBCOLLECTION);
      const docRef = await addDoc(editionsRef, {
        ...editionData,
        status: 'active',
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating edition:', error);
      throw new Error('Failed to create edition');
    }
  },

  /**
   * Update an edition
   */
  async updateEdition(seriesId: string | number, editionId: string | number, updates: Partial<Edition>): Promise<void> {
    try {
      const editionRef = doc(db, SERIES_COLLECTION, seriesId.toString(), EDITIONS_SUBCOLLECTION, editionId.toString());
      await updateDoc(editionRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating edition:', error);
      throw new Error('Failed to update edition');
    }
  },

  /**
   * Archive/unarchive an edition
   */
  async archiveEdition(seriesId: string | number, editionId: string | number): Promise<void> {
    try {
      const editionRef = doc(db, SERIES_COLLECTION, seriesId.toString(), EDITIONS_SUBCOLLECTION, editionId.toString());
      const editionDoc = await getDoc(editionRef);

      if (!editionDoc.exists()) {
        throw new Error('Edition not found');
      }

      const currentStatus = editionDoc.data().status || 'active';
      const newStatus: EditionStatus = currentStatus === 'archived' ? 'active' : 'archived';

      await updateDoc(editionRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error archiving edition:', error);
      throw new Error('Failed to archive edition');
    }
  },

  /**
   * Delete an edition (soft delete)
   */
  async deleteEdition(seriesId: string | number, editionId: string | number): Promise<void> {
    try {
      const editionRef = doc(db, SERIES_COLLECTION, seriesId.toString(), EDITIONS_SUBCOLLECTION, editionId.toString());
      await updateDoc(editionRef, {
        status: 'deleted',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error deleting edition:', error);
      throw new Error('Failed to delete edition');
    }
  },

  /**
   * Get all editions for a series
   */
  async getEditionsBySeries(seriesId: string | number): Promise<Edition[]> {
    try {
      const editionsRef = collection(db, SERIES_COLLECTION, seriesId.toString(), EDITIONS_SUBCOLLECTION);
      const q = query(
        editionsRef,
        where('status', '!=', 'deleted'),
        orderBy('status'),
        orderBy('editionNumber', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt instanceof Timestamp
          ? doc.data().createdAt.toDate().toISOString()
          : new Date().toISOString(),
      })) as Edition[];
    } catch (error) {
      console.error('Error getting editions:', error);
      throw new Error('Failed to fetch editions');
    }
  },
};
