import { useState, useEffect, useCallback } from 'react';
import { miniWorksService } from '../services/miniWorksService';
import type { MiniWork, NewMiniWork, MiniWorkStatus } from '../types';

interface UseMiniWorksOptions {
  /** Filter by status (default: 'active') */
  status?: MiniWorkStatus | 'all';
  /** Enable real-time subscriptions (default: true) */
  realtime?: boolean;
}

interface UseMiniWorksReturn {
  /** List of mini works */
  miniWorks: MiniWork[];
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Create a new mini work */
  createMiniWork: (work: NewMiniWork) => Promise<string | null>;
  /** Update an existing mini work */
  updateMiniWork: (id: string | number, work: Partial<MiniWork>) => Promise<boolean>;
  /** Delete (soft) a mini work */
  deleteMiniWork: (id: string | number) => Promise<boolean>;
  /** Archive a mini work */
  archiveMiniWork: (id: string | number) => Promise<boolean>;
  /** Restore an archived/deleted mini work */
  restoreMiniWork: (id: string | number) => Promise<boolean>;
  /** Refresh mini works manually */
  refresh: () => Promise<void>;
}

/**
 * Custom hook for managing mini works with Firestore
 *
 * Features:
 * - Real-time subscriptions (optional)
 * - CRUD operations
 * - Loading and error states
 * - Automatic cleanup
 *
 * @example
 * ```tsx
 * function MiniWorksList() {
 *   const { miniWorks, loading, createMiniWork } = useMiniWorks();
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       {miniWorks.map(work => <WorkCard key={work.id} work={work} />)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMiniWorks(options: UseMiniWorksOptions = {}): UseMiniWorksReturn {
  const { status = 'active', realtime = true } = options;

  const [miniWorks, setMiniWorks] = useState<MiniWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch mini works (one-time or initial load)
  const fetchMiniWorks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let data: MiniWork[];

      if (status === 'all') {
        data = await miniWorksService.getAllMiniWorks();
      } else {
        data = await miniWorksService.getMiniWorksByStatus(status);
      }

      setMiniWorks(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch mini works';
      setError(message);
      console.error('Error fetching mini works:', err);
    } finally {
      setLoading(false);
    }
  }, [status]);

  // Setup real-time subscription or one-time fetch
  useEffect(() => {
    if (!realtime) {
      // One-time fetch
      fetchMiniWorks();
      return;
    }

    // Real-time subscription
    setLoading(true);
    setError(null);

    let unsubscribe: (() => void) | undefined;

    try {
      if (status === 'all') {
        unsubscribe = miniWorksService.subscribeToAllMiniWorks((data) => {
          setMiniWorks(data);
          setLoading(false);
        });
      } else {
        unsubscribe = miniWorksService.subscribeToMiniWorksByStatus(status, (data) => {
          setMiniWorks(data);
          setLoading(false);
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to subscribe to mini works';
      setError(message);
      setLoading(false);
      console.error('Error subscribing to mini works:', err);
    }

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [status, realtime, fetchMiniWorks]);

  // Create mini work
  const createMiniWork = useCallback(async (work: NewMiniWork): Promise<string | null> => {
    try {
      setError(null);
      const id = await miniWorksService.createMiniWork(work);
      return id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create mini work';
      setError(message);
      console.error('Error creating mini work:', err);
      return null;
    }
  }, []);

  // Update mini work
  const updateMiniWork = useCallback(
    async (id: string | number, work: Partial<MiniWork>): Promise<boolean> => {
      try {
        setError(null);
        await miniWorksService.updateMiniWork(id, work);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update mini work';
        setError(message);
        console.error('Error updating mini work:', err);
        return false;
      }
    },
    []
  );

  // Delete mini work (soft delete)
  const deleteMiniWork = useCallback(async (id: string | number): Promise<boolean> => {
    try {
      setError(null);
      await miniWorksService.deleteMiniWork(id);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete mini work';
      setError(message);
      console.error('Error deleting mini work:', err);
      return false;
    }
  }, []);

  // Archive mini work
  const archiveMiniWork = useCallback(async (id: string | number): Promise<boolean> => {
    try {
      setError(null);
      await miniWorksService.archiveMiniWork(id);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to archive mini work';
      setError(message);
      console.error('Error archiving mini work:', err);
      return false;
    }
  }, []);

  // Restore mini work
  const restoreMiniWork = useCallback(async (id: string | number): Promise<boolean> => {
    try {
      setError(null);
      await miniWorksService.restoreMiniWork(id);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to restore mini work';
      setError(message);
      console.error('Error restoring mini work:', err);
      return false;
    }
  }, []);

  return {
    miniWorks,
    loading,
    error,
    createMiniWork,
    updateMiniWork,
    deleteMiniWork,
    archiveMiniWork,
    restoreMiniWork,
    refresh: fetchMiniWorks,
  };
}
