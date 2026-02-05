import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import type { Relationship, NewRelationship, PipelineStage, Interaction } from '../types';

const COLLECTION_NAME = 'relationships';

// Convertir Firestore doc a Relationship

const docToRelationship = (docSnap: QueryDocumentSnapshot<DocumentData>): Relationship => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    city: data.city || '',
    country: data.country || '',
    stage: data.stage || 'interes_nuevo',
    emotionalNote: data.emotionalNote || '',
    nextAction: data.nextAction,
    nextActionDescription: data.nextActionDescription || '',
    nextActionDate: data.nextActionDate?.toDate(),
    interestedArtworks: data.interestedArtworks || [],
    interactions: (data.interactions || []).map((i: Record<string, unknown>) => ({
      ...i,
      date: (i.date as { toDate?: () => Date })?.toDate?.() || new Date()
    })),
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    saleId: data.saleId,
    saleDate: data.saleDate?.toDate()
  };
};

// Suscripción a todos los relationships
export const subscribeToRelationships = (
  callback: (relationships: Relationship[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const relationships = snapshot.docs.map(docToRelationship);
      callback(relationships);
    },
    (error) => {
      console.error('❌ [RELATIONSHIPS] Error in subscription:', error);
      onError?.(error);
    }
  );
};

// Crear nuevo relationship
export const createRelationship = async (data: NewRelationship): Promise<string> => {
  console.log('📝 [RELATIONSHIPS] Creating new relationship:', data.name);

  const docData = {
    ...data,
    nextActionDate: data.nextActionDate ? Timestamp.fromDate(data.nextActionDate) : null,
    interactions: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };

  const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
  console.log('✅ [RELATIONSHIPS] Created with ID:', docRef.id);
  return docRef.id;
};

// Actualizar relationship
export const updateRelationship = async (
  id: string,
  updates: Partial<Relationship>
): Promise<void> => {
  console.log('🔄 [RELATIONSHIPS] Updating:', id);

  const docRef = doc(db, COLLECTION_NAME, id);

  const updateData: Record<string, unknown> = {
    ...updates,
    updatedAt: Timestamp.now()
  };

  // Convertir fechas a Timestamp
  if (updates.nextActionDate) {
    updateData.nextActionDate = Timestamp.fromDate(updates.nextActionDate);
  }
  if (updates.saleDate) {
    updateData.saleDate = Timestamp.fromDate(updates.saleDate);
  }

  // Convertir interacciones si existen
  if (updates.interactions) {
    updateData.interactions = updates.interactions.map(i => ({
      ...i,
      date: Timestamp.fromDate(i.date)
    }));
  }

  await updateDoc(docRef, updateData);
  console.log('✅ [RELATIONSHIPS] Updated successfully');
};

// Cambiar etapa del pipeline (con automatización de post-venta)
export const changeStage = async (
  id: string,
  newStage: PipelineStage,
  currentRelationship: Relationship
): Promise<void> => {
  console.log('🔄 [RELATIONSHIPS] Changing stage to:', newStage);

  const updates: Partial<Relationship> = {
    stage: newStage
  };

  // AUTOMATIZACIÓN: Si pasa a "Venta Realizada", programar seguimiento post-venta en 7 días
  if (newStage === 'venta_realizada') {
    updates.saleDate = new Date();

    // Programar seguimiento post-venta
    const postVentaDate = new Date();
    postVentaDate.setDate(postVentaDate.getDate() + 7);

    updates.nextAction = 'confirmar_entrega';
    updates.nextActionDescription = 'Seguimiento post-venta: confirmar entrega y satisfacción';
    updates.nextActionDate = postVentaDate;

    // Agregar nota de interacción
    const newInteraction: Interaction = {
      id: Date.now().toString(),
      date: new Date(),
      note: '🎉 ¡Venta realizada! Se programó seguimiento post-venta automático para 7 días.',
      actionTaken: 'Venta completada'
    };

    updates.interactions = [...currentRelationship.interactions, newInteraction];
  }

  // Si pasa a post-venta automáticamente después del seguimiento
  if (newStage === 'post_venta' && currentRelationship.stage === 'venta_realizada') {
    updates.nextAction = 'agradecer';
    updates.nextActionDescription = 'Agradecer y confirmar satisfacción con la obra';
  }

  await updateRelationship(id, updates);
};

// Agregar interacción
export const addInteraction = async (
  id: string,
  note: string,
  actionTaken: string,
  currentInteractions: Interaction[]
): Promise<void> => {
  const newInteraction: Interaction = {
    id: Date.now().toString(),
    date: new Date(),
    note,
    actionTaken
  };

  await updateRelationship(id, {
    interactions: [...currentInteractions, newInteraction]
  });
};

// Eliminar relationship
export const deleteRelationship = async (id: string): Promise<void> => {
  console.log('🗑️ [RELATIONSHIPS] Deleting:', id);
  await deleteDoc(doc(db, COLLECTION_NAME, id));
  console.log('✅ [RELATIONSHIPS] Deleted successfully');
};

// Obtener relationships con acción pendiente para hoy o vencidas (Ritual Diario)
export const filterRitualDiario = (relationships: Relationship[]): Relationship[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return relationships.filter(r => {
    if (!r.nextActionDate) return false;
    const actionDate = new Date(r.nextActionDate);
    actionDate.setHours(0, 0, 0, 0);
    // Incluir si es hoy o está vencida (antes de hoy)
    return actionDate < tomorrow;
  }).sort((a, b) => {
    // Ordenar por fecha, las más vencidas primero
    const dateA = a.nextActionDate?.getTime() || 0;
    const dateB = b.nextActionDate?.getTime() || 0;
    return dateA - dateB;
  });
};

// Agrupar por etapa para Pipeline
export const groupByStage = (relationships: Relationship[]): Record<PipelineStage, Relationship[]> => {
  const grouped: Record<PipelineStage, Relationship[]> = {
    interes_nuevo: [],
    conexion_emocional: [],
    seguimiento_activo: [],
    obra_apartada: [],
    venta_realizada: [],
    post_venta: []
  };

  relationships.forEach(r => {
    if (grouped[r.stage]) {
      grouped[r.stage].push(r);
    }
  });

  return grouped;
};
