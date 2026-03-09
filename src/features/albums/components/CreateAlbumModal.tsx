import React, { useState, useEffect } from 'react';
import type { NewAlbumData } from '../types';

interface CreateAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NewAlbumData) => void;
}

const CreateAlbumModal: React.FC<CreateAlbumModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('El nombre del álbum es obligatorio.');
      return;
    }

    onSave({ name: trimmedName, description: description.trim() || undefined });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-95 opacity-0 animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold font-serif text-gray-900">Nuevo Álbum</h2>
                <p className="text-sm text-gray-500 mt-1">Crea un álbum para organizar fotos.</p>
              </div>
              <button type="button" onClick={onClose} className="-mt-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mt-4 rounded-md"><p>{error}</p></div>}

            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="album-name" className="block text-sm font-bold text-gray-700 mb-1">Nombre del Álbum</label>
                <input
                  type="text"
                  id="album-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  placeholder="Ej: Marcos, Envío, Embalaje"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="album-desc" className="block text-sm font-bold text-gray-700 mb-1">Descripción (opcional)</label>
                <textarea
                  id="album-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input"
                  placeholder="Breve descripción del álbum"
                  rows={2}
                />
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-4 flex justify-end items-center gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-300 text-sm font-bold rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2.5 border border-transparent text-sm font-bold rounded-md text-white bg-blue-600 hover:bg-blue-700">
              Crear Álbum
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes fade-in-scale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in-scale { animation: fade-in-scale 0.2s forwards; }
        .form-input { width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; background-color: #F9FAFB; font-weight: 500; }
        .form-input::placeholder { font-weight: normal; color: #9CA3AF; }
        .form-input:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #3B82F6; box-shadow: 0 0 0 2px #3B82F6; }
      `}</style>
    </div>
  );
};

export default CreateAlbumModal;
