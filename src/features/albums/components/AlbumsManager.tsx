import React, { useState, useRef, useMemo } from 'react';
import { useAlbums } from '../hooks/useAlbums';
import { storageService } from '@/shared/services/storageService';
import { PlusIcon, TrashIcon, SearchIcon } from '@/shared/components/Icons';
import CreateAlbumModal from './CreateAlbumModal';
import type { AlbumPhoto, NewAlbumData } from '../types';

interface AlbumsManagerProps {
  canWrite: boolean;
}

const AlbumsManager: React.FC<AlbumsManagerProps> = ({ canWrite }) => {
  const { albums, loading, error, createAlbum, deleteAlbum, addPhoto, removePhoto } = useAlbums();
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredAlbums = useMemo(() => {
    if (!searchTerm) return albums;
    const term = searchTerm.toLowerCase();
    return albums.filter(a => a.name.toLowerCase().includes(term));
  }, [albums, searchTerm]);

  const selectedAlbum = useMemo(() => {
    if (!selectedAlbumId) return albums[0] || null;
    return albums.find(a => a.id === selectedAlbumId) || albums[0] || null;
  }, [albums, selectedAlbumId]);

  const handleCreateAlbum = async (data: NewAlbumData) => {
    try {
      const id = await createAlbum(data);
      if (id) setSelectedAlbumId(id);
      setIsCreateModalOpen(false);
    } catch {
      alert('Error al crear el álbum.');
    }
  };

  const handleDeleteAlbum = async () => {
    if (!selectedAlbum) return;
    const confirmed = window.confirm(`¿Eliminar el álbum "${selectedAlbum.name}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    try {
      await deleteAlbum(selectedAlbum.id);
      setSelectedAlbumId(null);
    } catch {
      alert('Error al eliminar el álbum.');
    }
  };

  const handleUploadPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !selectedAlbum) return;

    setIsUploading(true);
    const total = files.length;

    for (let i = 0; i < total; i++) {
      const file = files[i];
      setUploadProgress(`Subiendo ${i + 1} de ${total}...`);
      try {
        const filename = storageService.generateUniqueFilename(file.name, 'albums');
        const url = await storageService.uploadImage(file, filename);

        const photo: AlbumPhoto = {
          id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
          url,
          fileName: file.name,
          createdAt: new Date().toISOString(),
        };

        await addPhoto(selectedAlbum.id, photo);
      } catch (err) {
        console.error('Error uploading photo:', err);
      }
    }

    setIsUploading(false);
    setUploadProgress('');

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePhoto = async (photo: AlbumPhoto) => {
    if (!selectedAlbum) return;
    const confirmed = window.confirm('¿Eliminar esta foto?');
    if (!confirmed) return;

    try {
      await removePhoto(selectedAlbum.id, photo);
    } catch {
      alert('Error al eliminar la foto.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Cargando álbumes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg inline-block">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-1">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold font-serif text-gray-900">Álbumes</h2>
      </div>

      {albums.length === 0 && !canWrite && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No hay álbumes disponibles.</p>
        </div>
      )}

      {albums.length === 0 && canWrite && (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg mb-4">No hay álbumes todavía.</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Crear Primer Álbum
          </button>
        </div>
      )}

      {albums.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left panel: Album list */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-3">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar álbum..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm placeholder:text-gray-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Album list */}
              <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                {filteredAlbums.map((album) => (
                  <button
                    key={album.id}
                    onClick={() => setSelectedAlbumId(album.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors text-sm font-medium flex justify-between items-center ${
                      selectedAlbum?.id === album.id
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="truncate">{album.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      selectedAlbum?.id === album.id ? 'bg-white/20' : 'bg-gray-200'
                    }`}>
                      {album.photos.length}
                    </span>
                  </button>
                ))}
              </div>

              {canWrite && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="w-full px-4 py-2.5 text-sm font-medium text-gray-600 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-700 transition-colors"
                >
                  + Nuevo Álbum
                </button>
              )}
            </div>
          </div>

          {/* Right panel: Photos grid */}
          <div className="lg:col-span-3">
            {selectedAlbum ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold font-serif text-gray-900">{selectedAlbum.name}</h3>
                    {selectedAlbum.description && (
                      <p className="text-sm text-gray-500 mt-1">{selectedAlbum.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{selectedAlbum.photos.length} fotos</p>
                  </div>
                  {canWrite && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {isUploading ? uploadProgress : 'Subir Fotos'}
                      </button>
                      <button
                        onClick={handleDeleteAlbum}
                        className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        title="Eliminar álbum"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUploadPhotos}
                  className="hidden"
                  accept="image/png, image/jpeg, image/webp"
                  multiple
                />

                {selectedAlbum.photos.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-lg">
                    <p className="text-gray-500">No hay fotos en este álbum.</p>
                    {canWrite && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Subir fotos
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {selectedAlbum.photos.map((photo) => (
                      <div key={photo.id} className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={photo.url}
                          alt={photo.fileName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {canWrite && (
                          <button
                            onClick={() => handleRemovePhoto(photo)}
                            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            title="Eliminar foto"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <p>Selecciona un álbum para ver sus fotos.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      {canWrite && albums.length > 0 && (
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40"
          title="Nuevo álbum"
        >
          <PlusIcon className="h-7 w-7" />
        </button>
      )}

      <CreateAlbumModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateAlbum}
      />
    </div>
  );
};

export default AlbumsManager;
