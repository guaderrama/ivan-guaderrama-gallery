import { storage } from '../lib/firebase';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';

/**
 * Storage Service - Firebase Storage Integration
 *
 * Handles file uploads and deletions in Firebase Storage
 */

export const storageService = {
  /**
   * Upload an image file to Firebase Storage
   * @param file - File to upload
   * @param path - Storage path (e.g., 'artworks/image.jpg')
   * @returns Promise with download URL
   */
  async uploadImage(file: File, path: string): Promise<string> {
    try {
      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        throw new Error('El archivo es demasiado grande. El límite es 100MB.');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen.');
      }

      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  /**
   * Delete an image from Firebase Storage
   * @param url - Download URL of the image to delete
   */
  async deleteImage(url: string): Promise<void> {
    try {
      // Extract path from URL
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/o\/(.*?)\?/);

      if (!pathMatch) {
        throw new Error('Invalid storage URL');
      }

      const path = decodeURIComponent(pathMatch[1]);
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  },

  /**
   * Generate a unique filename for storage
   * @param originalName - Original filename
   * @param prefix - Optional prefix (e.g., 'artworks')
   * @returns Unique filename with timestamp
   */
  generateUniqueFilename(originalName: string, prefix: string = ''): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const extension = originalName.split('.').pop();
    const baseName = prefix ? `${prefix}/` : '';

    return `${baseName}${timestamp}-${randomStr}.${extension}`;
  },
};
