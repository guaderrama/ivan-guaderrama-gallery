export interface AlbumPhoto {
  id: string;
  url: string;
  fileName: string;
  createdAt: string;
}

export interface Album {
  id: string;
  name: string;
  description?: string;
  photos: AlbumPhoto[];
  status: 'active' | 'deleted';
  createdAt: string;
  updatedAt?: string;
}

export type NewAlbumData = {
  name: string;
  description?: string;
};
