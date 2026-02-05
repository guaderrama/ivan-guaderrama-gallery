import { useState, useEffect, useMemo } from 'react';
import type { Relationship, NewRelationship, PipelineStage } from '../types';
import {
  subscribeToRelationships,
  createRelationship,
  updateRelationship,
  deleteRelationship,
  changeStage,
  addInteraction,
  filterRitualDiario,
  groupByStage
} from '../services/relationshipsService';

interface UseRelationshipsReturn {
  relationships: Relationship[];
  loading: boolean;
  error: string | null;

  // Vistas filtradas
  ritualDiario: Relationship[];
  pipelineGroups: Record<PipelineStage, Relationship[]>;

  // Acciones
  create: (data: NewRelationship) => Promise<string>;
  update: (id: string, updates: Partial<Relationship>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  moveToStage: (id: string, stage: PipelineStage) => Promise<void>;
  logInteraction: (id: string, note: string, actionTaken: string) => Promise<void>;

  // Búsqueda
  searchRelationships: (term: string) => Relationship[];
}

export const useRelationships = (): UseRelationshipsReturn => {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Suscripción a Firestore
  useEffect(() => {
    console.log('📚 [HOOK] useRelationships initialized');

    const unsubscribe = subscribeToRelationships(
      (data) => {
        console.log('📚 [HOOK] Received', data.length, 'relationships');
        setRelationships(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('❌ [HOOK] Error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      console.log('📚 [HOOK] Cleaning up subscription');
      unsubscribe();
    };
  }, []);

  // Ritual Diario: filtrar tareas pendientes para hoy o vencidas
  const ritualDiario = useMemo(() => {
    return filterRitualDiario(relationships);
  }, [relationships]);

  // Pipeline agrupado por etapas
  const pipelineGroups = useMemo(() => {
    return groupByStage(relationships);
  }, [relationships]);

  // Crear nuevo relationship
  const create = async (data: NewRelationship): Promise<string> => {
    try {
      return await createRelationship(data);
    } catch (err: unknown) {
      console.error('❌ [HOOK] Error creating:', err);
      throw err;
    }
  };

  // Actualizar relationship
  const update = async (id: string, updates: Partial<Relationship>): Promise<void> => {
    try {
      await updateRelationship(id, updates);
    } catch (err: unknown) {
      console.error('❌ [HOOK] Error updating:', err);
      throw err;
    }
  };

  // Eliminar relationship
  const remove = async (id: string): Promise<void> => {
    try {
      await deleteRelationship(id);
    } catch (err: unknown) {
      console.error('❌ [HOOK] Error deleting:', err);
      throw err;
    }
  };

  // Cambiar etapa (con automatización)
  const moveToStage = async (id: string, stage: PipelineStage): Promise<void> => {
    try {
      const current = relationships.find(r => r.id === id);
      if (!current) throw new Error('Relationship not found');
      await changeStage(id, stage, current);
    } catch (err: unknown) {
      console.error('❌ [HOOK] Error changing stage:', err);
      throw err;
    }
  };

  // Agregar interacción
  const logInteraction = async (id: string, note: string, actionTaken: string): Promise<void> => {
    try {
      const current = relationships.find(r => r.id === id);
      if (!current) throw new Error('Relationship not found');
      await addInteraction(id, note, actionTaken, current.interactions);
    } catch (err: unknown) {
      console.error('❌ [HOOK] Error logging interaction:', err);
      throw err;
    }
  };

  // Búsqueda por nombre, ciudad o nota emocional
  const searchRelationships = (term: string): Relationship[] => {
    if (!term.trim()) return relationships;

    const lowerTerm = term.toLowerCase();
    return relationships.filter(r =>
      r.name.toLowerCase().includes(lowerTerm) ||
      r.city?.toLowerCase().includes(lowerTerm) ||
      r.country?.toLowerCase().includes(lowerTerm) ||
      r.emotionalNote.toLowerCase().includes(lowerTerm) ||
      r.email?.toLowerCase().includes(lowerTerm)
    );
  };

  return {
    relationships,
    loading,
    error,
    ritualDiario,
    pipelineGroups,
    create,
    update,
    remove,
    moveToStage,
    logInteraction,
    searchRelationships
  };
};
