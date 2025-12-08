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
      console.log('🆕 [SERVICE] Creating new series:', seriesData);
      const seriesRef = collection(db, SERIES_COLLECTION);
      const docRef = await addDoc(seriesRef, {
        ...seriesData,
        seriesStatus: 'active',
        createdAt: serverTimestamp(),
      });
      console.log('✅ [SERVICE] Series created with ID:', docRef.id);

      // Create all editions for this series
      const totalEditions = seriesData.totalEditions || 1;
      console.log(`🔢 [SERVICE] Creating ${totalEditions} editions for series ${docRef.id}...`);

      const editionsRef = collection(db, SERIES_COLLECTION, docRef.id, EDITIONS_SUBCOLLECTION);
      const editionPromises = [];

      for (let i = 1; i <= totalEditions; i++) {
        const editionData = {
          editionNumber: i,
          editionStatus: 'active' as EditionStatus,
          clientName: '',
          gallerySeller: '',
          saleDate: null,
          notes: '',
          createdAt: serverTimestamp(),
        };
        editionPromises.push(addDoc(editionsRef, editionData));
      }

      await Promise.all(editionPromises);
      console.log(`✅ [SERVICE] Created ${totalEditions} editions successfully`);

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
      console.log('🔧 [SERVICE] updateEdition called with:', { seriesId, editionId, updates });
      const editionRef = doc(db, SERIES_COLLECTION, seriesId.toString(), EDITIONS_SUBCOLLECTION, editionId.toString());
      console.log('🔧 [SERVICE] Edition path:', editionRef.path);

      await updateDoc(editionRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      console.log('✅ [SERVICE] Edition updated in Firestore successfully');
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
      console.log(`📄 [EDITIONS] Getting editions for series: ${seriesId}`);
      const editionsRef = collection(db, SERIES_COLLECTION, seriesId.toString(), EDITIONS_SUBCOLLECTION);
      // Simplified query - no composite index required
      const q = query(editionsRef, orderBy('editionNumber', 'asc'));

      const snapshot = await getDocs(q);
      console.log(`📄 [EDITIONS] Found ${snapshot.docs.length} editions (before filtering)`);

      // Filter out deleted editions in memory
      const editions = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt instanceof Timestamp
            ? doc.data().createdAt.toDate().toISOString()
            : new Date().toISOString(),
        }))
        .filter(edition => edition.status !== 'deleted') as Edition[];

      console.log(`📄 [EDITIONS] Returning ${editions.length} active editions`);
      return editions;
    } catch (error) {
      console.error('❌ [EDITIONS] Error getting editions:', error);
      throw new Error('Failed to fetch editions');
    }
  },
};
