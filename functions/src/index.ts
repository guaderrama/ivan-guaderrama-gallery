/**
 * Cloud Functions for Ivan Guaderrama Gallery
 *
 * Functions:
 * 1. generateArtNames - Secure proxy for Gemini API
 * 2. processBulkArtUpload - Process CSV bulk uploads
 * 3. onArtworkUpdate - Trigger on artwork changes
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Firestore
const db = admin.firestore();

/**
 * Helper function to check if user is authenticated admin
 */
async function isAdmin(userId: string): Promise<boolean> {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return false;
    }
    const userData = userDoc.data();
    return userData?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * FUNCTION 1: Generate Art Names
 *
 * Callable function that proxies requests to Gemini API
 * - Requires authentication
 * - Requires admin role
 * - Stores results in Firestore
 * - API key stored in Secret Manager
 *
 * @param data.prompt - The prompt for name generation
 * @param data.count - Number of names to generate (default: 5, max: 20)
 * @returns Array of generated names
 */
export const generateArtNames = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to generate art names'
    );
  }

  // Check admin role
  const userId = context.auth.uid;
  const userIsAdmin = await isAdmin(userId);

  if (!userIsAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can generate art names'
    );
  }

  // Validate input
  const { prompt, count = 5 } = data;

  if (!prompt || typeof prompt !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Prompt must be a non-empty string'
    );
  }

  if (count < 1 || count > 20) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Count must be between 1 and 20'
    );
  }

  try {
    // Get API key from environment/secret manager
    const apiKey = functions.config().gemini?.api_key || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Gemini API key not configured. Run: firebase functions:config:set gemini.api_key="YOUR_KEY"'
      );
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Create enhanced prompt
    const enhancedPrompt = `Generate ${count} creative and unique art piece names based on this description: "${prompt}".

    Return ONLY a JSON array of strings, nothing else. Example format:
    ["Name 1", "Name 2", "Name 3"]

    Requirements:
    - Each name should be artistic and evocative
    - Names should be 2-5 words long
    - Avoid generic names
    - Return exactly ${count} names`;

    // Call Gemini API
    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const text = response.text();

    // Parse response
    let generatedNames: string[];
    try {
      // Try to extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        generatedNames = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: split by newlines and clean
        generatedNames = text
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0 && !line.startsWith('[') && !line.startsWith(']'))
          .map(line => line.replace(/^["'\-\d\.\)]\s*/, '').replace(/["']$/, ''))
          .filter(line => line.length > 0)
          .slice(0, count);
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to parse AI response'
      );
    }

    // Store in Firestore
    const batch = db.batch();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    generatedNames.forEach(name => {
      const docRef = db.collection('generatedNames').doc();
      batch.set(docRef, {
        name,
        prompt,
        generatedBy: userId,
        createdAt: timestamp,
      });
    });

    await batch.commit();

    // Log for analytics
    console.log('Generated names:', {
      userId,
      prompt: prompt.substring(0, 50),
      count: generatedNames.length,
    });

    return {
      success: true,
      names: generatedNames,
      count: generatedNames.length,
    };

  } catch (error: any) {
    console.error('Error generating art names:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      `Failed to generate art names: ${error.message}`
    );
  }
});

/**
 * FUNCTION 2: Process Bulk Art Upload
 *
 * Callable function that processes CSV file from Storage
 * - Requires authentication
 * - Requires admin role
 * - Validates CSV data
 * - Creates artworks in batch
 *
 * @param data.filePath - Path to CSV file in Storage
 * @returns Summary of upload results
 */
export const processBulkArtUpload = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  // Check admin role
  const userId = context.auth.uid;
  const userIsAdmin = await isAdmin(userId);

  if (!userIsAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can bulk upload artworks'
    );
  }

  const { filePath } = data;

  if (!filePath || typeof filePath !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'File path must be provided'
    );
  }

  try {
    // Get file from Storage
    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'File not found in Storage'
      );
    }

    // Download and parse CSV
    const [contents] = await file.download();
    const csvText = contents.toString('utf-8');

    // Simple CSV parsing (for production, use a proper CSV library)
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());

    const artworks: any[] = [];
    const errors: string[] = [];

    // Parse each line
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim());
        const artwork: any = {};

        headers.forEach((header, index) => {
          artwork[header] = values[index];
        });

        // Validate required fields
        if (!artwork.nombre || !artwork.precioUSD || !artwork.category) {
          errors.push(`Line ${i + 1}: Missing required fields`);
          continue;
        }

        // Add metadata
        artwork.status = 'active';
        artwork.createdAt = admin.firestore.FieldValue.serverTimestamp();
        artwork.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        artworks.push(artwork);
      } catch (error: any) {
        errors.push(`Line ${i + 1}: ${error.message}`);
      }
    }

    // Batch write to Firestore (max 500 per batch)
    const batchSize = 500;
    let created = 0;

    for (let i = 0; i < artworks.length; i += batchSize) {
      const batch = db.batch();
      const chunk = artworks.slice(i, i + batchSize);

      chunk.forEach(artwork => {
        const docRef = db.collection('artworks').doc();
        batch.set(docRef, artwork);
      });

      await batch.commit();
      created += chunk.length;
    }

    console.log('Bulk upload completed:', {
      userId,
      total: artworks.length,
      created,
      errors: errors.length,
    });

    return {
      success: true,
      total: lines.length - 1,
      created,
      errors,
    };

  } catch (error: any) {
    console.error('Error processing bulk upload:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      `Failed to process bulk upload: ${error.message}`
    );
  }
});

/**
 * FUNCTION 3: On Artwork Update Trigger
 *
 * Background function triggered when artwork is updated
 * - Sends notifications
 * - Updates search indexes
 * - Logs analytics
 */
export const onArtworkUpdate = functions.firestore
  .document('artworks/{artworkId}')
  .onWrite(async (change, context) => {
    const artworkId = context.params.artworkId;

    // New artwork created
    if (!change.before.exists && change.after.exists) {
      const newArtwork = change.after.data();
      console.log('New artwork created:', {
        id: artworkId,
        nombre: newArtwork?.nombre,
        category: newArtwork?.category,
      });

      // TODO: Send notification to subscribers
      // TODO: Update search index
      // TODO: Log to analytics

      return null;
    }

    // Artwork deleted
    if (change.before.exists && !change.after.exists) {
      const deletedArtwork = change.before.data();
      console.log('Artwork deleted:', {
        id: artworkId,
        nombre: deletedArtwork?.nombre,
      });

      return null;
    }

    // Artwork updated
    if (change.before.exists && change.after.exists) {
      const before = change.before.data();
      const after = change.after.data();

      // Check if status changed
      if (before?.status !== after?.status) {
        console.log('Artwork status changed:', {
          id: artworkId,
          from: before?.status,
          to: after?.status,
        });

        // TODO: Send notification if published
        // TODO: Update indexes
      }

      return null;
    }

    return null;
  });
