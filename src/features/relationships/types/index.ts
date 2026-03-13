// Etapas del pipeline de clientes
export const PIPELINE_STAGES = [
  'interes_nuevo',
  'conexion_emocional',
  'seguimiento_activo',
  'obra_apartada',
  'venta_realizada',
  'post_venta'
] as const;

export type PipelineStage = typeof PIPELINE_STAGES[number];

export const STAGE_LABELS: Record<PipelineStage, string> = {
  interes_nuevo: 'New Interest',
  conexion_emocional: 'Emotional Connection',
  seguimiento_activo: 'Active Follow-up',
  obra_apartada: 'Reserved Artwork',
  venta_realizada: 'Sale Completed',
  post_venta: 'Post-Sale'
};

export const STAGE_COLORS: Record<PipelineStage, string> = {
  interes_nuevo: 'bg-blue-100 text-blue-800 border-blue-300',
  conexion_emocional: 'bg-purple-100 text-purple-800 border-purple-300',
  seguimiento_activo: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  obra_apartada: 'bg-orange-100 text-orange-800 border-orange-300',
  venta_realizada: 'bg-green-100 text-green-800 border-green-300',
  post_venta: 'bg-teal-100 text-teal-800 border-teal-300'
};

// Tipos de acción de seguimiento
export type ActionType =
  | 'llamar'
  | 'enviar_fotos'
  | 'enviar_cotizacion'
  | 'enviar_video'
  | 'visita_galeria'
  | 'confirmar_entrega'
  | 'agradecer'
  | 'otro';

export const ACTION_LABELS: Record<ActionType, string> = {
  llamar: 'Call',
  enviar_fotos: 'Send photos',
  enviar_cotizacion: 'Send quote',
  enviar_video: 'Send video',
  visita_galeria: 'Invite to gallery',
  confirmar_entrega: 'Confirm delivery',
  agradecer: 'Thank',
  otro: 'Other'
};

// Obra de interés vinculada
export interface InterestedArtwork {
  id: string;
  nombre: string;
  sku: string;
  category: string;
  imageUrl?: string;
}

// Interacción/Nota histórica
export interface Interaction {
  id: string;
  date: Date;
  note: string;
  actionTaken?: string;
}

// Cliente/Relación
export interface Relationship {
  id: string;
  // Datos básicos
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;

  // Estado del pipeline
  stage: PipelineStage;

  // Nota emocional (el corazón del CRM)
  emotionalNote: string;

  // Seguimiento
  nextAction?: ActionType;
  nextActionDescription?: string;
  nextActionDate?: Date;

  // Obras de interés
  interestedArtworks: InterestedArtwork[];

  // Historial de interacciones
  interactions: Interaction[];

  // Metadatos
  createdAt: Date;
  updatedAt: Date;

  // Referencia a venta si aplica
  saleId?: string;
  saleDate?: Date;
}

// Para crear nuevo cliente
export interface NewRelationship {
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  stage: PipelineStage;
  emotionalNote: string;
  nextAction?: ActionType;
  nextActionDescription?: string;
  nextActionDate?: Date;
  interestedArtworks: InterestedArtwork[];
}

// Vista activa
export type RelationshipView = 'ritual' | 'pipeline' | 'directory';
