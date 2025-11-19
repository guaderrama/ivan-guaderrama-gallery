import { db } from '@/shared/lib/firebase';
import type { NumberedProduct, Edition } from '../types';

const COLLECTION_NAME = 'artworks';
const SUBCOLLECTION_NAME = 'pieces';

/**
 * Numbered Editions Service
 *
 * Handles series and their individual pieces (editions).
 * Prepared for Firebase migration.
 */

export const editionsService = {
  /**
   * Create a new numbered series
   */
  async createSeries(series: Omit<NumberedProduct, 'editions'>): Promise<string> {
    // TODO: Implement
    throw new Error('Not implemented yet - using localStorage');
  },

  /**
   * Update an edition within a series
   */
  async updateEdition(seriesSku: string, edition: Edition): Promise<void> {
    // TODO: Implement
    throw new Error('Not implemented yet - using localStorage');
  },

  /**
   * Get all series
   */
  async getAllSeries(): Promise<NumberedProduct[]> {
    // TODO: Implement
    throw new Error('Not implemented yet - using localStorage');
  },
};
