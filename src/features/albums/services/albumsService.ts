import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { storageService } from '@/shared/services/storageService';
import type { Album, AlbumPhoto, NewAlbumData } from '../types';

const COLLECTION_NAME = 'albums';

export const albumsService = {
  subscribeToAlbums(callback: (albums: Album[]) => void): () => void {
    const ref = collection(db, COLLECTION_NAME);
    const q = query(ref, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const albums: Album[] = snapshot.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              photos: data.photos || [],
              createdAt: data.createdAt instanceof Timestamp
                ? data.createdAt.toDate().toISOString()
                : new Date().toISOString(),
            } as Album;
          })
          .filter((a) => a.status !== 'deleted');

        callback(albums);
      },
      (error) => {
        console.error('Error in albums subscription:', error);
      }
    );
  },

  async createAlbum(data: NewAlbumData): Promise<string> {
    const ref = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(ref, {
      ...data,
      photos: [],
      status: 'active',
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateAlbum(id: string, updates: Partial<Album>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteAlbum(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      status: 'deleted',
      updatedAt: serverTimestamp(),
    });
  },

  async addPhoto(albumId: string, photo: AlbumPhoto): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, albumId);
    await updateDoc(docRef, {
      photos: arrayUnion(photo),
      updatedAt: serverTimestamp(),
    });
  },

  async removePhoto(albumId: string, photo: AlbumPhoto): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, albumId);
    await updateDoc(docRef, {
      photos: arrayRemove(photo),
      updatedAt: serverTimestamp(),
    });

    // Clean up from Storage
    try {
      await storageService.deleteImage(photo.url);
    } catch {
      // Photo may already be deleted from storage, ignore
    }
  },
};
