import { useState, useEffect, useCallback } from 'react';
import { artworkService } from '../services/artworkService';
import type { Product, NewProduct, ArtworkStatus } from '../types';

interface UseArtworksOptions {
  /** Filter by status (default: 'active') */
  status?: ArtworkStatus | 'all';
  /** Enable real-time subscriptions (default: true) */
  realtime?: boolean;
}

interface UseArtworksReturn {
  /** List of artworks */
  artworks: Product[];
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Create a new artwork */
  createArtwork: (artwork: NewProduct) => Promise<string | null>;
  /** Update an existing artwork */
  updateArtwork: (id: string | number, artwork: Partial<Product>) => Promise<boolean>;
  /** Delete (soft) an artwork */
  deleteArtwork: (id: string | number) => Promise<boolean>;
  /** Archive an artwork */
  archiveArtwork: (id: string | number) => Promise<boolean>;
  /** Restore an archived/deleted artwork */
  restoreArtwork: (id: string | number) => Promise<boolean>;
  /** Refresh artworks manually */
  refresh: () => Promise<void>;
}

/**
 * Custom hook for managing artworks with Firestore
 *
 * Features:
 * - Real-time subscriptions (optional)
 * - CRUD operations
 * - Loading and error states
 * - Automatic cleanup
 *
 * @example
 * ```tsx
 * function ArtworksList() {
 *   const { artworks, loading, createArtwork } = useArtworks();
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       {artworks.map(art => <ArtCard key={art.id} artwork={art} />)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useArtworks(options: UseArtworksOptions = {}): UseArtworksReturn {
  const { status = 'active', realtime = true } = options;

  const [artworks, setArtworks] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch artworks (one-time or initial load)
  const fetchArtworks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let data: Product[];

      if (status === 'all') {
        data = await artworkService.getAllArtworks();
      } else {
        data = await artworkService.getArtworksByStatus(status);
      }

      setArtworks(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch artworks';
      setError(message);
      console.error('Error fetching artworks:', err);
    } finally {
      setLoading(false);
    }
  }, [status]);

  // Setup real-time subscription or one-time fetch
  useEffect(() => {
    if (!realtime) {
      // One-time fetch
      fetchArtworks();
      return;
    }

    // Real-time subscription
    setLoading(true);
    setError(null);

    let unsubscribe: (() => void) | undefined;

    try {
      if (status === 'all') {
        unsubscribe = artworkService.subscribeToAllArtworks((data) => {
          setArtworks(data);
          setLoading(false);
        });
      } else {
        unsubscribe = artworkService.subscribeToArtworksByStatus(status, (data) => {
          setArtworks(data);
          setLoading(false);
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to subscribe to artworks';
      setError(message);
      setLoading(false);
      console.error('Error subscribing to artworks:', err);
    }

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [status, realtime, fetchArtworks]);

  // Create artwork
  const createArtwork = useCallback(async (artwork: NewProduct): Promise<string | null> => {
    try {
      setError(null);
      const id = await artworkService.createArtwork(artwork);
      return id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create artwork';
      setError(message);
      console.error('Error creating artwork:', err);
      return null;
    }
  }, []);

  // Update artwork
  const updateArtwork = useCallback(
    async (id: string | number, artwork: Partial<Product>): Promise<boolean> => {
      try {
        setError(null);
        await artworkService.updateArtwork(id, artwork);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update artwork';
        setError(message);
        console.error('Error updating artwork:', err);
        return false;
      }
    },
    []
  );

  // Delete artwork (soft delete)
  const deleteArtwork = useCallback(async (id: string | number): Promise<boolean> => {
    try {
      setError(null);
      await artworkService.deleteArtwork(id);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete artwork';
      setError(message);
      console.error('Error deleting artwork:', err);
      return false;
    }
  }, []);

  // Archive artwork
  const archiveArtwork = useCallback(async (id: string | number): Promise<boolean> => {
    try {
      setError(null);
      await artworkService.archiveArtwork(id);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to archive artwork';
      setError(message);
      console.error('Error archiving artwork:', err);
      return false;
    }
  }, []);

  // Restore artwork
  const restoreArtwork = useCallback(async (id: string | number): Promise<boolean> => {
    try {
      setError(null);
      await artworkService.restoreArtwork(id);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to restore artwork';
      setError(message);
      console.error('Error restoring artwork:', err);
      return false;
    }
  }, []);

  return {
    artworks,
    loading,
    error,
    createArtwork,
    updateArtwork,
    deleteArtwork,
    archiveArtwork,
    restoreArtwork,
    refresh: fetchArtworks,
  };
}
