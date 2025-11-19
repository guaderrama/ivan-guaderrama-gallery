import { db } from '@/shared/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { Product, NewProduct, ArtworkStatus } from '../types';

const COLLECTION_NAME = 'artworks';

/**
 * Artwork Service - Firestore Integration
 *
 * Handles all CRUD operations for artworks with:
 * - Soft-delete pattern (status field)
 * - Real-time subscriptions
 * - Optimized queries
 * - Type-safe operations
 */

/**
 * Convert Firestore document to Product
 */
function docToProduct(doc: QueryDocumentSnapshot<DocumentData>): Product {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    createdAt: data.createdAt?.toDate?.() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
  } as Product;
}

export const artworkService = {
  /**
   * Create a new artwork in Firestore
   * @param artwork - New artwork data
   * @returns Promise with the created artwork ID
   */
  async createArtwork(artwork: NewProduct): Promise<string> {
    try {
      const artworkData = {
        ...artwork,
        status: (artwork.status || 'active') as ArtworkStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), artworkData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating artwork:', error);
      throw new Error('Failed to create artwork');
    }
  },

  /**
   * Update an existing artwork
   * @param id - Artwork ID (can be string or number)
   * @param artwork - Updated artwork data
   */
  async updateArtwork(id: string | number, artwork: Partial<Product>): Promise<void> {
    try {
      const docId = String(id);
      const docRef = doc(db, COLLECTION_NAME, docId);

      // Remove fields that shouldn't be updated
      const { id: _id, createdAt, ...updateData } = artwork;

      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating artwork:', error);
      throw new Error('Failed to update artwork');
    }
  },

  /**
   * Soft delete an artwork (set status to 'deleted')
   * @param id - Artwork ID
   */
  async deleteArtwork(id: string | number): Promise<void> {
    try {
      const docId = String(id);
      const docRef = doc(db, COLLECTION_NAME, docId);

      await updateDoc(docRef, {
        status: 'deleted',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error deleting artwork:', error);
      throw new Error('Failed to delete artwork');
    }
  },

  /**
   * Archive an artwork (set status to 'archived')
   * @param id - Artwork ID
   */
  async archiveArtwork(id: string | number): Promise<void> {
    try {
      const docId = String(id);
      const docRef = doc(db, COLLECTION_NAME, docId);

      await updateDoc(docRef, {
        status: 'archived',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error archiving artwork:', error);
      throw new Error('Failed to archive artwork');
    }
  },

  /**
   * Restore an archived/deleted artwork to active
   * @param id - Artwork ID
   */
  async restoreArtwork(id: string | number): Promise<void> {
    try {
      const docId = String(id);
      const docRef = doc(db, COLLECTION_NAME, docId);

      await updateDoc(docRef, {
        status: 'active',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error restoring artwork:', error);
      throw new Error('Failed to restore artwork');
    }
  },

  /**
   * Get a single artwork by ID
   * @param id - Artwork ID
   * @returns Promise with the artwork or null if not found
   */
  async getArtworkById(id: string | number): Promise<Product | null> {
    try {
      const docId = String(id);
      const docRef = doc(db, COLLECTION_NAME, docId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return docToProduct(docSnap as QueryDocumentSnapshot<DocumentData>);
    } catch (error) {
      console.error('Error getting artwork:', error);
      throw new Error('Failed to get artwork');
    }
  },

  /**
   * Get all active artworks (status === 'active')
   * @returns Promise with array of artworks
   */
  async getActiveArtworks(): Promise<Product[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(docToProduct);
    } catch (error) {
      console.error('Error getting active artworks:', error);
      throw new Error('Failed to get active artworks');
    }
  },

  /**
   * Get all artworks (any status)
   * @returns Promise with array of artworks
   */
  async getAllArtworks(): Promise<Product[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(docToProduct);
    } catch (error) {
      console.error('Error getting all artworks:', error);
      throw new Error('Failed to get all artworks');
    }
  },

  /**
   * Get artworks by status
   * @param status - Artwork status to filter by
   * @returns Promise with array of artworks
   */
  async getArtworksByStatus(status: ArtworkStatus): Promise<Product[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(docToProduct);
    } catch (error) {
      console.error(`Error getting ${status} artworks:`, error);
      throw new Error(`Failed to get ${status} artworks`);
    }
  },

  /**
   * Subscribe to real-time updates for active artworks
   * @param callback - Function to call when data changes
   * @returns Unsubscribe function
   */
  subscribeToActiveArtworks(callback: (artworks: Product[]) => void): () => void {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const artworks = querySnapshot.docs.map(docToProduct);
        callback(artworks);
      },
      (error) => {
        console.error('Error in active artworks subscription:', error);
        callback([]);
      }
    );

    return unsubscribe;
  },

  /**
   * Subscribe to real-time updates for all artworks
   * @param callback - Function to call when data changes
   * @returns Unsubscribe function
   */
  subscribeToAllArtworks(callback: (artworks: Product[]) => void): () => void {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const artworks = querySnapshot.docs.map(docToProduct);
        callback(artworks);
      },
      (error) => {
        console.error('Error in all artworks subscription:', error);
        callback([]);
      }
    );

    return unsubscribe;
  },

  /**
   * Subscribe to artworks by status
   * @param status - Status to filter by
   * @param callback - Function to call when data changes
   * @returns Unsubscribe function
   */
  subscribeToArtworksByStatus(
    status: ArtworkStatus,
    callback: (artworks: Product[]) => void
  ): () => void {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const artworks = querySnapshot.docs.map(docToProduct);
        callback(artworks);
      },
      (error) => {
        console.error(`Error in ${status} artworks subscription:`, error);
        callback([]);
      }
    );

    return unsubscribe;
  },
};
