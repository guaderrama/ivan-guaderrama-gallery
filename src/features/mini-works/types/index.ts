export type MiniWorkStatus = 'active' | 'archived' | 'deleted';

export interface MiniWork {
  id: string;
  name: string;
  sku: string;
  imageUrl?: string;
  status: MiniWorkStatus;
  createdAt: string;
}

export type NewMiniWork = Omit<MiniWork, 'id' | 'status' | 'createdAt'>;
