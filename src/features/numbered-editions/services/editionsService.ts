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
    console.log('🆕 [SERVICE] Creating new series:', seriesData);
    const seriesRef = collection(db, SERIES_COLLECTION);

    // Step 1: Create the series document
    const docRef = await addDoc(seriesRef, {
      ...seriesData,
      seriesStatus: 'active',
      createdAt: serverTimestamp(),
    });
    console.log('✅ [SERVICE] Series created with ID:', docRef.id);

    // Step 2: Create editions in batches of 10 to avoid Firestore write limits
    const totalEditions = seriesData.totalEditions || 1;
    console.log(`🔢 [SERVICE] Creating ${totalEditions} editions for series ${docRef.id}...`);

    const editionsRef = collection(db, SERIES_COLLECTION, docRef.id, EDITIONS_SUBCOLLECTION);
    const BATCH_SIZE = 10;

    for (let batchStart = 1; batchStart <= totalEditions; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, totalEditions);
      const batchPromises = [];

      for (let i = batchStart; i <= batchEnd; i++) {
        batchPromises.push(addDoc(editionsRef, {
          editionNumber: i,
          editionStatus: 'active' as EditionStatus,
          clientName: '',
          gallerySeller: '',
          saleDate: null,
          notes: '',
          createdAt: serverTimestamp(),
        }));
      }

      await Promise.all(batchPromises);
      console.log(`✅ [SERVICE] Created editions ${batchStart}-${batchEnd}`);
    }

    console.log(`✅ [SERVICE] Created all ${totalEditions} editions successfully`);

    // Step 3: Touch the series document to trigger the real-time subscription refresh
    // (the subscription listens to the series collection, not the editions subcollection)
    await updateDoc(docRef, { updatedAt: serverTimestamp() });

    return docRef.id;
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
      console.log('📚 [SERIES] Getting all series...');
      const seriesRef = collection(db, SERIES_COLLECTION);
      // Simplified query - no composite index required
      const q = query(seriesRef, orderBy('createdAt', 'desc'));

      const snapshot = await getDocs(q);
      console.log(`📚 [SERIES] Found ${snapshot.docs.length} series documents (before filtering)`);
      const seriesList: NumberedProduct[] = [];

      for (const seriesDoc of snapshot.docs) {
        const seriesData = seriesDoc.data();

        // Filter out deleted series in memory
        if (seriesData.seriesStatus === 'deleted') {
          console.log(`📚 [SERIES] Skipping deleted series: ${seriesDoc.id}`);
          continue;
        }

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

      console.log(`📚 [SERIES] Returning ${seriesList.length} active series`);
      return seriesList;
    } catch (error) {
      console.error('❌ [SERIES] Error getting all series:', error);
      throw new Error('Failed to fetch series');
    }
  },

  /**
   * Subscribe to series changes (real-time)
   */
  subscribeToAllSeries(callback: (series: NumberedProduct[]) => void): () => void {
    console.log('📚 [SERIES] Setting up subscription to series...');
    const seriesRef = collection(db, SERIES_COLLECTION);
    // Simplified query - no composite index required
    const q = query(seriesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        console.log(`📚 [SERIES] Received ${snapshot.docs.length} series documents`);
        const seriesList: NumberedProduct[] = [];

        for (const seriesDoc of snapshot.docs) {
          const seriesData = seriesDoc.data();

          // Filter out deleted series in memory (no index needed)
          if (seriesData.seriesStatus === 'deleted') {
            console.log(`📚 [SERIES] Skipping deleted series: ${seriesDoc.id}`);
            continue;
          }

          console.log(`📚 [SERIES] Processing series: ${seriesDoc.id}`, seriesData);

          // Get editions for this series
          const editions = await editionsService.getEditionsBySeries(seriesDoc.id);
          console.log(`📚 [SERIES] Found ${editions.length} editions for series ${seriesDoc.id}`);

          seriesList.push({
            id: seriesDoc.id,
            ...seriesData,
            editions,
            createdAt: seriesData.createdAt instanceof Timestamp
              ? seriesData.createdAt.toDate().toISOString()
              : new Date().toISOString(),
          } as NumberedProduct);
        }

        console.log(`✅ [SERIES] Callback with ${seriesList.length} series total`);
        callback(seriesList);
      },
      (error) => {
        console.error('❌ [SERIES] Error in series subscription:', error);
        console.error('❌ [SERIES] Error code:', error.code);
        console.error('❌ [SERIES] Error message:', error.message);

        // If it's an index error, provide helpful message
        if (error.code === 'failed-precondition' || error.message.includes('index')) {
          console.error('❌ [SERIES] INDEX REQUIRED: Create the composite index in Firebase Console');
          console.error('❌ [SERIES] Go to: https://console.firebase.google.com/project/ivan-guaderrama-gallery/firestore/indexes');
        }
      }
    );

    return unsubscribe;
  },

  /**
   * Sync editions to match the desired total.
   * - Creates missing edition numbers (1..newTotal)
   * - Soft-deletes editions with editionNumber > newTotal
   */
  async syncEditions(seriesId: string, newTotal: number): Promise<void> {
    console.log(`🔢 [SERVICE] Syncing editions for series ${seriesId} to total: ${newTotal}`);
    const editionsRef = collection(db, SERIES_COLLECTION, seriesId, EDITIONS_SUBCOLLECTION);
    const snapshot = await getDocs(query(editionsRef));

    // Map existing edition numbers to their doc IDs and status
    const existingEditions = new Map<number, { id: string; status: string }>();
    snapshot.docs.forEach(d => {
      const data = d.data();
      const num = data.editionNumber as number;
      // If duplicate, keep the first one found
      if (!existingEditions.has(num)) {
        existingEditions.set(num, { id: d.id, status: data.editionStatus || data.status || 'active' });
      } else {
        // Duplicate - soft delete it
        console.log(`🗑️ [SERVICE] Removing duplicate edition #${num}`);
        updateDoc(doc(db, SERIES_COLLECTION, seriesId, EDITIONS_SUBCOLLECTION, d.id), {
          editionStatus: 'deleted', status: 'deleted', updatedAt: serverTimestamp(),
        });
      }
    });

    const promises: Promise<unknown>[] = [];

    // Create missing editions (1..newTotal)
    for (let i = 1; i <= newTotal; i++) {
      if (!existingEditions.has(i)) {
        console.log(`➕ [SERVICE] Creating edition #${i}`);
        promises.push(addDoc(editionsRef, {
          editionNumber: i,
          editionStatus: 'active' as EditionStatus,
          clientName: '',
          gallerySeller: '',
          saleDate: null,
          notes: '',
          createdAt: serverTimestamp(),
        }));
      } else {
        // If it was deleted, reactivate it
        const existing = existingEditions.get(i)!;
        if (existing.status === 'deleted') {
          promises.push(updateDoc(doc(db, SERIES_COLLECTION, seriesId, EDITIONS_SUBCOLLECTION, existing.id), {
            editionStatus: 'active', status: 'active', updatedAt: serverTimestamp(),
          }));
        }
      }
    }

    // Soft-delete editions above newTotal
    existingEditions.forEach((val, num) => {
      if (num > newTotal && val.status !== 'deleted') {
        console.log(`🗑️ [SERVICE] Soft-deleting edition #${num}`);
        promises.push(updateDoc(doc(db, SERIES_COLLECTION, seriesId, EDITIONS_SUBCOLLECTION, val.id), {
          editionStatus: 'deleted', status: 'deleted', updatedAt: serverTimestamp(),
        }));
      }
    });

    await Promise.all(promises);
    console.log(`✅ [SERVICE] Sync complete for series ${seriesId}`);
  },

  // ============= EDITIONS OPERATIONS =============

  /**
   * Touch the series document to trigger real-time subscription refresh.
   * Needed because the subscription listens to the series collection,
   * not the editions subcollection.
   */
  async _touchSeries(seriesId: string | number): Promise<void> {
    const seriesRef = doc(db, SERIES_COLLECTION, seriesId.toString());
    await updateDoc(seriesRef, { updatedAt: serverTimestamp() });
  },

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
      await this._touchSeries(seriesId);
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
      console.error('❌ [SERVICE] Error updating edition:', error);
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
      await this._touchSeries(seriesId);
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
      await this._touchSeries(seriesId);
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
      console.log(`📄 [EDITIONS] Getting editions for series: ${seriesId}`);
      const editionsRef = collection(db, SERIES_COLLECTION, seriesId.toString(), EDITIONS_SUBCOLLECTION);
      // Simplified query - no composite index required
      const q = query(editionsRef, orderBy('editionNumber', 'asc'));

      const snapshot = await getDocs(q);
      console.log(`📄 [EDITIONS] Found ${snapshot.docs.length} editions (before filtering)`);

      // Filter out deleted editions in memory
      const editions = snapshot.docs
        .map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp
              ? data.createdAt.toDate().toISOString()
              : new Date().toISOString(),
          } as Edition;
        })
        .filter(edition => edition.editionStatus !== 'deleted' && edition.status !== 'deleted');

      console.log(`📄 [EDITIONS] Returning ${editions.length} active editions`);
      return editions;
    } catch (error) {
      console.error('❌ [EDITIONS] Error getting editions:', error);
      throw new Error('Failed to fetch editions');
    }
  },
};
