import { useState, useEffect, useCallback } from 'react';
import { editionsService } from '../services/editionsService';
import type { NumberedProduct, Edition, NewNumberedProductData, NewEditionData } from '../types';

interface UseNumberedEditionsReturn {
  /** List of series with their editions */
  series: NumberedProduct[];
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Create a new series */
  createSeries: (seriesData: NewNumberedProductData) => Promise<string | null>;
  /** Update a series */
  updateSeries: (seriesId: string, updates: Partial<NumberedProduct>) => Promise<boolean>;
  /** Archive/unarchive a series */
  archiveSeries: (seriesId: string) => Promise<boolean>;
  /** Delete a series (soft delete) */
  deleteSeries: (seriesId: string) => Promise<boolean>;
  /** Create a new edition in a series */
  createEdition: (seriesId: string, editionData: NewEditionData) => Promise<string | null>;
  /** Update an edition */
  updateEdition: (seriesId: string, editionId: string, updates: Partial<Edition>) => Promise<boolean>;
  /** Archive/unarchive an edition */
  archiveEdition: (seriesId: string, editionId: string) => Promise<boolean>;
  /** Delete an edition (soft delete) */
  deleteEdition: (seriesId: string, editionId: string) => Promise<boolean>;
  /** Sync editions to match desired total */
  syncEditions: (seriesId: string, newTotal: number) => Promise<boolean>;
  /** Refresh series manually */
  refresh: () => Promise<void>;
}

/**
 * Custom hook for managing numbered editions (series and individual editions) with Firestore
 *
 * Features:
 * - Real-time subscriptions
 * - CRUD operations for series and editions
 * - Subcollections support
 * - Loading and error states
 * - Automatic cleanup
 *
 * @example
 * ```tsx
 * function SeriesList() {
 *   const { series, loading, createSeries, createEdition } = useNumberedEditions();
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       {series.map(s => (
 *         <div key={s.id}>
 *           <h3>{s.seriesName}</h3>
 *           {s.editions.map(e => (
 *             <p key={e.id}>Edition {e.editionNumber}</p>
 *           ))}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useNumberedEditions(): UseNumberedEditionsReturn {
  console.log('📚 [HOOK] useNumberedEditions initialized');
  const [series, setSeries] = useState<NumberedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch series (one-time)
  const fetchSeries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await editionsService.getAllSeries();
      setSeries(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch series';
      setError(message);
      console.error('Error fetching series:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Setup real-time subscription
  useEffect(() => {
    console.log('📚 [HOOK] Setting up subscription in useEffect...');
    setLoading(true);
    setError(null);

    let unsubscribe: (() => void) | undefined;
    let timeoutId: NodeJS.Timeout | undefined;

    // Safety timeout - if loading takes > 10 seconds, something is wrong
    timeoutId = setTimeout(() => {
      console.error('❌ [HOOK] Subscription timeout after 10 seconds');
      setLoading(false);
      setError('Timeout loading series data. Please refresh the page.');
    }, 10000);

    try {
      unsubscribe = editionsService.subscribeToAllSeries((data) => {
        console.log('📚 [HOOK] Subscription callback received data:', data.length, 'series');
        if (timeoutId) clearTimeout(timeoutId);
        setSeries(data);
        setLoading(false);
      });
      console.log('📚 [HOOK] Subscription set up successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to subscribe to series';
      console.error('❌ [HOOK] Error in useEffect:', err);
      if (timeoutId) clearTimeout(timeoutId);
      setError(message);
      setLoading(false);
    }

    // Cleanup subscription on unmount
    return () => {
      console.log('📚 [HOOK] Cleaning up subscription...');
      if (timeoutId) clearTimeout(timeoutId);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // ============= SERIES OPERATIONS =============

  // Create series - throws on error so caller can handle it (does NOT set global error)
  const createSeries = useCallback(async (seriesData: NewNumberedProductData): Promise<string | null> => {
    try {
      const id = await editionsService.createSeries(seriesData);
      return id;
    } catch (err) {
      console.error('Error creating series:', err);
      throw err;
    }
  }, []);

  // Update series - optimistic local state update + Firestore write
  const updateSeries = useCallback(
    async (seriesId: string, updates: Partial<NumberedProduct>): Promise<boolean> => {
      try {
        await editionsService.updateSeries(seriesId, updates);

        // Optimistic update: patch the local state immediately
        setSeries(prev => prev.map(s => {
          if (s.id !== seriesId) return s;
          return {
            ...s,
            ...updates,
            // Sync name with seriesName for display
            ...(updates.seriesName ? { name: updates.seriesName } : {}),
          };
        }));

        return true;
      } catch (err) {
        console.error('Error updating series:', err);
        throw err;
      }
    },
    []
  );

  // Archive series - throws on error so caller can handle it
  const archiveSeries = useCallback(async (seriesId: string): Promise<boolean> => {
    try {
      await editionsService.archiveSeries(seriesId);
      return true;
    } catch (err) {
      console.error('Error archiving series:', err);
      throw err;
    }
  }, []);

  // Delete series - throws on error so caller can handle it
  const deleteSeries = useCallback(async (seriesId: string): Promise<boolean> => {
    try {
      await editionsService.deleteSeries(seriesId);
      return true;
    } catch (err) {
      console.error('Error deleting series:', err);
      throw err;
    }
  }, []);

  // ============= EDITIONS OPERATIONS =============

  // Create edition - service touches series doc to trigger subscription refresh
  const createEdition = useCallback(
    async (seriesId: string, editionData: NewEditionData): Promise<string | null> => {
      try {
        const id = await editionsService.createEdition(seriesId, editionData);
        return id;
      } catch (err) {
        console.error('Error creating edition:', err);
        throw err;
      }
    },
    []
  );

  // Update edition - optimistic local state update (no re-fetch needed)
  const updateEdition = useCallback(
    async (seriesId: string, editionId: string, updates: Partial<Edition>): Promise<boolean> => {
      try {
        await editionsService.updateEdition(seriesId, editionId, updates);

        // Optimistic update: patch the local state immediately
        setSeries(prev => prev.map(s => {
          if (s.id !== seriesId) return s;
          return {
            ...s,
            editions: s.editions.map(e =>
              e.id === editionId ? { ...e, ...updates } : e
            ),
          };
        }));

        return true;
      } catch (err) {
        console.error('Error updating edition:', err);
        throw err;
      }
    },
    []
  );

  // Archive edition - service touches series doc to trigger subscription refresh
  const archiveEdition = useCallback(
    async (seriesId: string, editionId: string): Promise<boolean> => {
      try {
        await editionsService.archiveEdition(seriesId, editionId);
        return true;
      } catch (err) {
        console.error('Error archiving edition:', err);
        throw err;
      }
    },
    []
  );

  // Delete edition - service touches series doc to trigger subscription refresh
  const deleteEdition = useCallback(
    async (seriesId: string, editionId: string): Promise<boolean> => {
      try {
        await editionsService.deleteEdition(seriesId, editionId);
        return true;
      } catch (err) {
        console.error('Error deleting edition:', err);
        throw err;
      }
    },
    []
  );

  // Sync editions - needs manual fetch since it creates many docs
  const syncEditions = useCallback(
    async (seriesId: string, newTotal: number): Promise<boolean> => {
      try {
        await editionsService.syncEditions(seriesId, newTotal);
        return true;
      } catch (err) {
        console.error('Error syncing editions:', err);
        throw err;
      }
    },
    []
  );

  return {
    series,
    loading,
    error,
    createSeries,
    updateSeries,
    archiveSeries,
    deleteSeries,
    createEdition,
    updateEdition,
    archiveEdition,
    deleteEdition,
    syncEditions,
    refresh: fetchSeries,
  };
}
