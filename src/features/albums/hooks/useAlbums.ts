import { useState, useEffect, useCallback } from 'react';
import { albumsService } from '../services/albumsService';
import type { Album, AlbumPhoto, NewAlbumData } from '../types';

export function useAlbums() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    let timeoutId: NodeJS.Timeout | undefined;

    timeoutId = setTimeout(() => {
      setLoading(false);
      setError('Timeout cargando álbumes. Recarga la página.');
    }, 30000);

    const unsubscribe = albumsService.subscribeToAlbums((data) => {
      if (timeoutId) clearTimeout(timeoutId);
      setAlbums(data);
      setLoading(false);
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const createAlbum = useCallback(async (data: NewAlbumData): Promise<string | null> => {
    try {
      return await albumsService.createAlbum(data);
    } catch (err) {
      console.error('Error creating album:', err);
      throw err;
    }
  }, []);

  const updateAlbum = useCallback(async (id: string, updates: Partial<Album>): Promise<void> => {
    try {
      await albumsService.updateAlbum(id, updates);
    } catch (err) {
      console.error('Error updating album:', err);
      throw err;
    }
  }, []);

  const deleteAlbum = useCallback(async (id: string): Promise<void> => {
    try {
      await albumsService.deleteAlbum(id);
    } catch (err) {
      console.error('Error deleting album:', err);
      throw err;
    }
  }, []);

  const addPhoto = useCallback(async (albumId: string, photo: AlbumPhoto): Promise<void> => {
    try {
      await albumsService.addPhoto(albumId, photo);
    } catch (err) {
      console.error('Error adding photo:', err);
      throw err;
    }
  }, []);

  const removePhoto = useCallback(async (albumId: string, photo: AlbumPhoto): Promise<void> => {
    try {
      await albumsService.removePhoto(albumId, photo);
    } catch (err) {
      console.error('Error removing photo:', err);
      throw err;
    }
  }, []);

  return { albums, loading, error, createAlbum, updateAlbum, deleteAlbum, addPhoto, removePhoto };
}
