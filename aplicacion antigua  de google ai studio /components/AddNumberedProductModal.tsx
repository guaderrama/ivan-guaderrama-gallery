
import React, { useState, useEffect } from 'react';
import { NewNumberedProductData } from '../types';

interface AddNumberedProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NewNumberedProductData) => void;
  existingSkus: string[];
}

const AddNumberedProductModal: React.FC<AddNumberedProductModalProps> = ({ isOpen, onClose, onSave, existingSkus }) => {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [totalEditions, setTotalEditions] = useState<number>(1);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSku('');
      setName('');
      setTotalEditions(1);
      setImageUrl(undefined);
      setImagePreview(null);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setError("La imagen es muy grande. El límite es 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImageUrl(result);
        setImagePreview(result);
        setError('');
      };
      reader.onerror = () => {
        setError("No se pudo leer el archivo de imagen.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedSku = sku.trim();
    const trimmedName = name.trim();

    if (!trimmedName || !trimmedSku) {
      setError('Nombre y SKU son campos obligatorios.');
      return;
    }
    if (existingSkus.includes(trimmedSku)) {
      setError('Este SKU ya existe. Por favor, elige uno único.');
      return;
    }
    if (totalEditions <= 0) {
      setError('El número de ediciones debe ser mayor que cero.');
      return;
    }

    onSave({
      sku: trimmedSku,
      name: trimmedName,
      imageUrl: imageUrl,
      totalEditions,
    });
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
      aria-labelledby="add-numbered-product-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-95 opacity-0 animate-fade-in-scale"
        onClick={handleModalContentClick}
      >
        <form onSubmit={handleSubmit}>
          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 id="add-numbered-product-title" className="text-2xl sm:text-3xl font-bold font-serif text-gray-900">
                  Agregar Obra Seriada
                </h2>
                <p className="text-sm text-gray-500 mt-1">Crea una nueva serie de obras con su propio nombre y SKU.</p>
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
                <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-1">
                  Nombre de la Obra
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  placeholder="Ej: Escultura Abstracta de Metal"
                />
              </div>
               <div>
                <label htmlFor="sku" className="block text-sm font-bold text-gray-700 mb-1">
                  SKU
                </label>
                <input
                  type="text"
                  id="sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="form-input"
                  placeholder="Ej: ESC-MET-001-SERIE"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                    Foto de la Obra (Opcional)
                </label>
                <div className="mt-1 flex items-center gap-4">
                    {imagePreview && <img src={imagePreview} alt="Preview" className="h-16 w-16 object-cover rounded-md border" />}
                    <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                    {imagePreview ? 'Cambiar Foto' : 'Subir Foto'}
                    </button>
                    <input
                    id="image-upload"
                    name="image-upload"
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                    />
                </div>
              </div>
              <div>
                <label htmlFor="totalEditions" className="block text-sm font-bold text-gray-700 mb-1">
                  Número Total de Ediciones
                </label>
                <input
                  type="number"
                  id="totalEditions"
                  value={totalEditions || ''}
                  onChange={(e) => setTotalEditions(parseInt(e.target.value, 10) || 1)}
                  min="1"
                  className="form-input"
                />
              </div>
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
              className="px-5 py-2.5 border border-transparent text-sm font-bold rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Agregar Producto
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

export default AddNumberedProductModal;
