import React, { useState, useEffect } from 'react';
import { Edition } from '../types';

interface EditEditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (edition: Edition) => void;
  edition: Edition;
  productName: string;
}

// Define InputField helper component outside of the main component to prevent re-creation on every render.
// This solves the bug where typing one character causes the input to lose focus.
const InputField = ({ label, name, value, placeholder, onChange }: { 
  label: string; 
  name: keyof Edition; 
  value: string; 
  placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div>
    <label htmlFor={name} className="block text-sm font-bold text-gray-700 mb-1">
      {label}
    </label>
    <input
      type="text"
      name={name}
      id={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="form-input"
    />
  </div>
);

const EditEditionModal: React.FC<EditEditionModalProps> = ({ isOpen, onClose, onSave, edition, productName }) => {
  const [formData, setFormData] = useState<Edition>(edition);

  useEffect(() => {
    // Only reset formData when the edition ID changes (different edition selected)
    // NOT when the edition object is recreated with same data
    console.log('🔄 [MODAL] useEffect triggered - resetting formData with edition:', edition);
    setFormData(edition);
  }, [edition.id]); // Only depend on edition.id, not the whole object

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log('✏️ [MODAL] Input changed:', { field: name, value });
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      console.log('✏️ [MODAL] Updated formData:', updated);
      return updated;
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📋 [MODAL] handleSave called with formData:', formData);
    console.log('📋 [MODAL] Original edition:', edition);
    onSave(formData);
    onClose();
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
      aria-labelledby="edit-edition-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-95 opacity-0 animate-fade-in-scale"
        onClick={handleModalContentClick}
      >
        <form onSubmit={handleSave}>
          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 id="edit-edition-title" className="text-2xl sm:text-3xl font-bold font-serif text-gray-900">
                  Editar Edición #{edition.editionNumber}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{productName}</p>
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

            <div className="mt-6 space-y-4">
              <InputField 
                label="Ubicación de Exhibición" 
                name="exhibitionLocation" 
                value={formData.exhibitionLocation} 
                placeholder="ej: Galería Alvaro Obregon"
                onChange={handleInputChange} 
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField 
                  label="Galería / Vendedor" 
                  name="gallerySeller" 
                  value={formData.gallerySeller} 
                  placeholder="ej: Quivira / Jonathan"
                  onChange={handleInputChange} 
                />
                <InputField 
                  label="Nombre del Cliente" 
                  name="clientName" 
                  value={formData.clientName} 
                  placeholder="ej: John Doe"
                  onChange={handleInputChange} 
                />
              </div>
              
              <InputField 
                label="OBR" 
                name="salesInvoice" 
                value={formData.salesInvoice} 
                placeholder="ej: QV-12345"
                onChange={handleInputChange} 
              />

              <div>
                <label htmlFor="comments" className="block text-sm font-bold text-gray-700 mb-1">
                  Comentarios
                </label>
                <textarea
                  id="comments"
                  name="comments"
                  value={formData.comments}
                  onChange={handleInputChange}
                  rows={4}
                  className="form-input"
                  placeholder="ej: En préstamo, vendida, devuelta..."
                ></textarea>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-4 flex justify-end">
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
        .form-input::placeholder { font-weight: normal; color: #9CA3AF; }
        .form-input:focus { outline: 2px solid transparent; outline-offset: 2px; --tw-ring-color: #3B82F6; border-color: #3B82F6; box-shadow: 0 0 0 2px var(--tw-ring-color); }
      `}</style>
    </div>
  );
};

export default EditEditionModal;