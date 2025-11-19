export interface MiniWork {
  id: number;
  name: string;
  sku: string;
  imageUrl?: string;
  archived?: boolean;
}

export type NewMiniWork = Omit<MiniWork, 'id'>;
