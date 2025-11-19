import { db } from '@/shared/lib/firebase';
import type { MiniWork, NewMiniWork } from '../types';

const COLLECTION_NAME = 'miniWorks';

/**
 * Mini Works Service
 *
 * Handles mini artworks with archive functionality.
 */

export const miniWorksService = {
  /**
   * Create a new mini work
   */
  async createMiniWork(work: NewMiniWork): Promise<string> {
    // TODO: Implement
    throw new Error('Not implemented yet - using localStorage');
  },

  /**
   * Archive/unarchive a mini work
   */
  async toggleArchive(id: number, archived: boolean): Promise<void> {
    // TODO: Implement
    throw new Error('Not implemented yet - using localStorage');
  },

  /**
   * Get all mini works (excluding archived)
   */
  async getActiveMiniWorks(): Promise<MiniWork[]> {
    // TODO: Implement
    throw new Error('Not implemented yet - using localStorage');
  },
};
