
import React, { useState, useEffect } from 'react';
import { NewMiniWork, MiniWork } from '../types';

interface AddMiniWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NewMiniWork) => void;
  existingSkus: string[];
  editingWork: MiniWork | null;
  onUpdate: (data: MiniWork) => void;
}

const AddMiniWorkModal: React.FC<AddMiniWorkModalProps> = ({ isOpen, onClose, onSave, existingSkus, editingWork, onUpdate }) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [error, setError] = useState('');
  const isEditing = !!editingWork;

  useEffect(() => {
    if (isOpen) {
      if (editingWork) {
        setName(editingWork.name);
        setSku(editingWork.sku);
      } else {
        setName('');
        setSku('');
      }
      setError('');
    }
  }, [isOpen, editingWork]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedSku = sku.trim();

    if (!trimmedName || !trimmedSku) {
      setError('Nombre y SKU son campos obligatorios.');
      return;
    }
    
    const otherSkus = isEditing ? existingSkus.filter(s => s !== editingWork.sku) : existingSkus;
    if (otherSkus.includes(trimmedSku)) {
      setError('Este SKU ya existe. Por favor, elige uno único.');
      return;
    }

    if (isEditing) {
      onUpdate({ ...editingWork, name: trimmedName, sku: trimmedSku });
    } else {
      onSave({ name: trimmedName, sku: trimmedSku });
    }
  };

  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-mini-work-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-95 opacity-0 animate-fade-in-scale"
        onClick={handleModalContentClick}
      >
        <form onSubmit={handleSubmit}>
          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 id="add-mini-work-title" className="text-2xl sm:text-3xl font-bold font-serif text-gray-900">
                  {isEditing ? 'Editar Obra Mini' : 'Agregar Nombre de Obra Mini'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {isEditing ? 'Modifica los detalles de la obra mini.' : 'Crea un nuevo registro para una obra mini.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="-mt-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Cerrar modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mt-4 rounded-md" role="alert"><p>{error}</p></div>}

            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="mini-work-name" className="block text-sm font-bold text-gray-700 mb-1">
                  Nombre de la Obra
                </label>
                <input
                  type="text"
                  id="mini-work-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  placeholder="Ej: Corazón Mini"
                />
              </div>
               <div>
                <label htmlFor="mini-work-sku" className="block text-sm font-bold text-gray-700 mb-1">
                  SKU
                </label>
                <input
                  type="text"
                  id="mini-work-sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="form-input"
                  placeholder="Ej: MINI-COR-001"
                />
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-4 flex justify-end items-center gap-3">
            <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border border-gray-300 text-sm font-bold rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 border border-transparent text-sm font-bold rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isEditing ? 'Actualizar Obra' : 'Guardar Obra Mini'}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes fade-in-scale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in-scale { animation: fade-in-scale 0.2s forwards; }
        .form-input { width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; background-color: #F9FAFB; font-weight: 500; }
        .form-input::placeholder { font-weight: normal; color: #9CA3AF; }
        .form-input:focus { outline: 2px solid transparent; outline-offset: 2px; --tw-ring-color: #3B82F6; border-color: #3B82F6; box-shadow: 0 0 0 2px var(--tw-ring-color); }
      `}</style>
    </div>
  );
};

export default AddMiniWorkModal;
