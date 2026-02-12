/**
 * Cloud Functions for Ivan Guaderrama Gallery
 *
 * Functions:
 * 1. generateArtNames - Secure proxy for Gemini API
 * 2. processBulkArtUpload - Process CSV bulk uploads
 * 3. onArtworkUpdate - Trigger on artwork changes
 * 4. setUserRoles - Assign roles to users (superadmin only)
 * 5. listUsers - List all users (superadmin only)
 * 6. migrateExistingRoles - One-time migration from admin→superadmin
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

admin.initializeApp();
const db = admin.firestore();

const VALID_ROLES = ['superadmin', 'editor_catalogo', 'gestor_crm', 'gestor_cursos', 'visualizador'];

// ─── Role Helpers ───────────────────────────────────────

function getUserRoles(claims: Record<string, any> | undefined): string[] {
  if (!claims) return [];
  // New format: roles array
  if (Array.isArray(claims.roles)) return claims.roles;
  // Legacy format: single role string
  if (typeof claims.role === 'string') return [claims.role];
  return [];
}

async function checkSuperAdmin(uid: string): Promise<boolean> {
  try {
    const userRecord = await admin.auth().getUser(uid);
    const roles = getUserRoles(userRecord.customClaims);
    return roles.includes('superadmin');
  } catch {
    return false;
  }
}

async function hasAnyRole(uid: string, allowedRoles: string[]): Promise<boolean> {
  try {
    const userRecord = await admin.auth().getUser(uid);
    const roles = getUserRoles(userRecord.customClaims);
    if (roles.some(r => allowedRoles.includes(r))) return true;

    // Fallback to Firestore (pre-migration)
    const userDoc = await db.collection('users').doc(uid).get();
    const data = userDoc.data();
    if (!data) return false;

    // Check roles array in Firestore
    if (Array.isArray(data.roles)) {
      return data.roles.some((r: string) => allowedRoles.includes(r));
    }
    // Legacy single role
    if (data.role === 'admin' && allowedRoles.includes('superadmin')) return true;
    return data.role && allowedRoles.includes(data.role);
  } catch {
    return false;
  }
}

function requireAuth(context: functions.https.CallableContext): string {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }
  return context.auth.uid;
}

// ─── FUNCTION 4: Set User Roles (multi-role) ────────────

export const setUserRoles = functions.https.onCall(async (data, context) => {
  const callerId = requireAuth(context);

  const isSuperAdmin = await checkSuperAdmin(callerId);
  if (!isSuperAdmin) {
    const callerDoc = await db.collection('users').doc(callerId).get();
    const isLegacyAdmin = callerDoc.data()?.role === 'admin';
    if (!isLegacyAdmin) {
      throw new functions.https.HttpsError('permission-denied', 'Only superadmin can manage roles');
    }
  }

  const { targetUid, roles } = data;

  if (!targetUid || typeof targetUid !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'targetUid is required');
  }
  if (!Array.isArray(roles) || roles.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'roles must be a non-empty array');
  }
  const invalidRoles = roles.filter((r: string) => !VALID_ROLES.includes(r));
  if (invalidRoles.length > 0) {
    throw new functions.https.HttpsError('invalid-argument', `Invalid roles: ${invalidRoles.join(', ')}. Valid: ${VALID_ROLES.join(', ')}`);
  }

  // Prevent self-demotion (removing superadmin from yourself)
  if (targetUid === callerId && !roles.includes('superadmin')) {
    throw new functions.https.HttpsError('failed-precondition', 'Cannot remove superadmin from yourself');
  }

  try {
    // Set Custom Claims (new format: roles array)
    await admin.auth().setCustomUserClaims(targetUid, { roles });

    // Dual-write to Firestore
    await db.collection('users').doc(targetUid).set(
      { roles, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );

    // Audit log
    await db.collection('audit-log').add({
      action: 'roles_change',
      targetUid,
      newRoles: roles,
      performedBy: callerId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Roles changed: ${targetUid} -> [${roles.join(', ')}] by ${callerId}`);
    return { success: true, uid: targetUid, roles };
  } catch (error: any) {
    console.error('Error setting user roles:', error);
    throw new functions.https.HttpsError('internal', `Failed to set roles: ${error.message}`);
  }
});

// Keep backward compat: setUserRole still works (wraps single role in array)
export const setUserRole = functions.https.onCall(async (data, context) => {
  const { targetUid, role } = data;
  // Delegate to setUserRoles with single-element array
  const callerId = requireAuth(context);

  const isSuperAdmin = await checkSuperAdmin(callerId);
  if (!isSuperAdmin) {
    const callerDoc = await db.collection('users').doc(callerId).get();
    const isLegacyAdmin = callerDoc.data()?.role === 'admin';
    if (!isLegacyAdmin) {
      throw new functions.https.HttpsError('permission-denied', 'Only superadmin can manage roles');
    }
  }

  if (!targetUid || typeof targetUid !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'targetUid is required');
  }
  if (!role || !VALID_ROLES.includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', `role must be one of: ${VALID_ROLES.join(', ')}`);
  }

  try {
    await admin.auth().setCustomUserClaims(targetUid, { roles: [role] });
    await db.collection('users').doc(targetUid).set(
      { roles: [role], updatedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
    await db.collection('audit-log').add({
      action: 'roles_change',
      targetUid,
      newRoles: [role],
      performedBy: callerId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, uid: targetUid, roles: [role] };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', `Failed to set role: ${error.message}`);
  }
});

// ─── FUNCTION 5: List Users ─────────────────────────────

export const listUsers = functions.https.onCall(async (_data, context) => {
  const callerId = requireAuth(context);

  const isSuperAdmin = await checkSuperAdmin(callerId);
  if (!isSuperAdmin) {
    const callerDoc = await db.collection('users').doc(callerId).get();
    if (callerDoc.data()?.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Only superadmin can list users');
    }
  }

  try {
    const usersSnapshot = await db.collection('users')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const users = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      // Normalize: return roles array (handle legacy single role)
      let roles: string[] = [];
      if (Array.isArray(data.roles)) {
        roles = data.roles;
      } else if (data.role) {
        roles = [data.role === 'admin' ? 'superadmin' : data.role];
      }

      return {
        uid: doc.id,
        email: data.email || '',
        displayName: data.displayName || '',
        roles,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      };
    });

    return { success: true, users };
  } catch (error: any) {
    console.error('Error listing users:', error);
    throw new functions.https.HttpsError('internal', `Failed to list users: ${error.message}`);
  }
});

// ─── FUNCTION 6: Migrate Existing Roles ─────────────────

export const migrateExistingRoles = functions.https.onCall(async (_data, context) => {
  const callerId = requireAuth(context);

  const isSuperAdmin = await checkSuperAdmin(callerId);
  if (!isSuperAdmin) {
    const callerDoc = await db.collection('users').doc(callerId).get();
    if (callerDoc.data()?.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Only admins can run migration');
    }
  }

  try {
    const usersSnapshot = await db.collection('users').get();
    let migrated = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();

      if (userData.role === 'admin') {
        // Migrate to new format: roles array
        await admin.auth().setCustomUserClaims(userDoc.id, { roles: ['superadmin'] });
        await db.collection('users').doc(userDoc.id).update({
          roles: ['superadmin'],
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        migrated++;
      }
    }

    console.log(`Migration complete: ${migrated} users migrated to superadmin (multi-role format)`);
    return { success: true, migrated };
  } catch (error: any) {
    console.error('Migration failed:', error);
    throw new functions.https.HttpsError('internal', `Migration failed: ${error.message}`);
  }
});

// ─── FUNCTION 1: Generate Art Names ─────────────────────

export const generateArtNames = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);

  const allowed = await hasAnyRole(userId, ['superadmin', 'editor_catalogo']);
  if (!allowed) {
    throw new functions.https.HttpsError('permission-denied', 'No permission to generate art names');
  }

  const { prompt, count = 5 } = data;

  if (!prompt || typeof prompt !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Prompt must be a non-empty string');
  }

  if (count < 1 || count > 20) {
    throw new functions.https.HttpsError('invalid-argument', 'Count must be between 1 and 20');
  }

  try {
    const apiKey = functions.config().gemini?.api_key || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Gemini API key not configured. Run: firebase functions:config:set gemini.api_key="YOUR_KEY"'
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const enhancedPrompt = `Generate ${count} creative and unique art piece names based on this description: "${prompt}".

    Return ONLY a JSON array of strings, nothing else. Example format:
    ["Name 1", "Name 2", "Name 3"]

    Requirements:
    - Each name should be artistic and evocative
    - Names should be 2-5 words long
    - Avoid generic names
    - Return exactly ${count} names`;

    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const text = response.text();

    let generatedNames: string[];
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        generatedNames = JSON.parse(jsonMatch[0]);
      } else {
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
      throw new functions.https.HttpsError('internal', 'Failed to parse AI response');
    }

    const batch = db.batch();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    generatedNames.forEach(name => {
      const docRef = db.collection('generatedNames').doc();
      batch.set(docRef, { name, prompt, generatedBy: userId, createdAt: timestamp });
    });

    await batch.commit();

    return { success: true, names: generatedNames, count: generatedNames.length };
  } catch (error: any) {
    console.error('Error generating art names:', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', `Failed to generate art names: ${error.message}`);
  }
});

// ─── FUNCTION 2: Process Bulk Art Upload ────────────────

export const processBulkArtUpload = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);

  const allowed = await hasAnyRole(userId, ['superadmin', 'editor_catalogo']);
  if (!allowed) {
    throw new functions.https.HttpsError('permission-denied', 'No permission to bulk upload');
  }

  const { filePath } = data;

  if (!filePath || typeof filePath !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'File path must be provided');
  }

  try {
    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);

    const [exists] = await file.exists();
    if (!exists) {
      throw new functions.https.HttpsError('not-found', 'File not found in Storage');
    }

    const [contents] = await file.download();
    const csvText = contents.toString('utf-8');

    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());

    const artworks: any[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim());
        const artwork: any = {};

        headers.forEach((header, index) => {
          artwork[header] = values[index];
        });

        if (!artwork.nombre || !artwork.precioUSD || !artwork.category) {
          errors.push(`Line ${i + 1}: Missing required fields`);
          continue;
        }

        artwork.status = 'active';
        artwork.createdAt = admin.firestore.FieldValue.serverTimestamp();
        artwork.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        artworks.push(artwork);
      } catch (error: any) {
        errors.push(`Line ${i + 1}: ${error.message}`);
      }
    }

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

    return { success: true, total: lines.length - 1, created, errors };
  } catch (error: any) {
    console.error('Error processing bulk upload:', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', `Failed to process bulk upload: ${error.message}`);
  }
});

// ─── FUNCTION 3: On Artwork Update Trigger ──────────────

export const onArtworkUpdate = functions.firestore
  .document('artworks/{artworkId}')
  .onWrite(async (change, context) => {
    const artworkId = context.params.artworkId;

    if (!change.before.exists && change.after.exists) {
      const newArtwork = change.after.data();
      console.log('New artwork created:', { id: artworkId, nombre: newArtwork?.nombre, category: newArtwork?.category });
      return null;
    }

    if (change.before.exists && !change.after.exists) {
      const deletedArtwork = change.before.data();
      console.log('Artwork deleted:', { id: artworkId, nombre: deletedArtwork?.nombre });
      return null;
    }

    if (change.before.exists && change.after.exists) {
      const before = change.before.data();
      const after = change.after.data();

      if (before?.status !== after?.status) {
        console.log('Artwork status changed:', { id: artworkId, from: before?.status, to: after?.status });
      }

      return null;
    }

    return null;
  });
