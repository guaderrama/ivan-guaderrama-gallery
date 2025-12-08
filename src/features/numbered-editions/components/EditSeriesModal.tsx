
import React, { useState, useEffect } from 'react';
import { NumberedProduct } from '../types';

interface EditSeriesModalProps {
  product: NumberedProduct;
  onClose: () => void;
  onSave: (updates: Partial<NumberedProduct>) => void;
}

const EditSeriesModal: React.FC<EditSeriesModalProps> = ({ onClose, onSave, product }) => {
  const [newTotalEditions, setNewTotalEditions] = useState(product.totalEditions);
  const [error, setError] = useState('');

  useEffect(() => {
    setNewTotalEditions(product.totalEditions);
    setError('');
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newTotalEditions < product.editions.length) {
      setError(`El nuevo total no puede ser menor que el número de ediciones existentes (${product.editions.length}).`);
      return;
    }

    if (newTotalEditions <= 0) {
      setError('El número de ediciones debe ser mayor que cero.');
      return;
    }

    onSave({ totalEditions: newTotalEditions });
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
      aria-labelledby="edit-series-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-95 opacity-0 animate-fade-in-scale"
        onClick={handleModalContentClick}
      >
        <form onSubmit={handleSubmit}>
          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 id="edit-series-title" className="text-2xl sm:text-3xl font-bold font-serif text-gray-900">
                  Editar Serie
                </h2>
                <p className="text-sm text-gray-500 mt-1">{product.name} ({product.sku})</p>
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

            <div className="mt-6">
              <label htmlFor="totalEditions" className="block text-sm font-bold text-gray-700 mb-1">
                Nuevo Número Total de Ediciones
              </label>
              <input
                type="number"
                id="totalEditions"
                value={newTotalEditions || ''}
                onChange={(e) => setNewTotalEditions(parseInt(e.target.value, 10) || 1)}
                min="1"
                className="form-input"
              />
              <p className="text-xs text-gray-500 mt-1">
                Actualmente existen {product.editions.length} ediciones.
              </p>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
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
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes fade-in-scale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in-scale { animation: fade-in-scale 0.2s forwards; }
        .form-input { width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; background-color: #F9FAFB; font-weight: 500; }
        .form-input:focus { outline: 2px solid transparent; outline-offset: 2px; --tw-ring-color: #3B82F6; border-color: #3B82F6; box-shadow: 0 0 0 2px var(--tw-ring-color); }
      `}</style>
    </div>
  );
};

export default EditSeriesModal;
