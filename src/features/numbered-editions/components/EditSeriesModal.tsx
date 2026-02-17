
import React, { useState, useEffect, useRef } from 'react';
import { NumberedProduct } from '../types';
import { CATEGORIES, ProductCategory } from '@/features/artwork-management/types';
import { storageService } from '@/shared/services/storageService';

const validCategory = (cat: string | undefined): ProductCategory => {
  if (cat && (CATEGORIES as readonly string[]).includes(cat)) return cat as ProductCategory;
  return 'ORIGINAL';
};

interface EditSeriesModalProps {
  product: NumberedProduct;
  onClose: () => void;
  onSave: (updates: Partial<NumberedProduct>) => void;
}

const EditSeriesModal: React.FC<EditSeriesModalProps> = ({ onClose, onSave, product }) => {
  const [name, setName] = useState(product.seriesName || product.name || '');
  const [sku, setSku] = useState(product.sku || '');
  const [description, setDescription] = useState(product.description || '');
  const [basePrice, setBasePrice] = useState(product.basePrice || 0);
  const [category, setCategory] = useState<ProductCategory>(validCategory(product.category));
  const [imageUrl, setImageUrl] = useState(product.imageUrl || '');
  const [imagePreview, setImagePreview] = useState(product.imageUrl || '');
  const [newTotalEditions, setNewTotalEditions] = useState(product.totalEditions);
  const [error, setError] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(product.seriesName || product.name || '');
    setSku(product.sku || '');
    setDescription(product.description || '');
    setBasePrice(product.basePrice || 0);
    setCategory(validCategory(product.category));
    setImageUrl(product.imageUrl || '');
    setImagePreview(product.imageUrl || '');
    setNewTotalEditions(product.totalEditions);
    setError('');
  }, [product]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      setError('');

      // Preview
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);

      // Upload
      const filename = storageService.generateUniqueFilename(file.name, 'numbered-editions');
      const downloadURL = await storageService.uploadImage(file, filename);
      setImageUrl(downloadURL);
      setIsUploadingImage(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir imagen.');
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedSku = sku.trim();

    if (!trimmedName || !trimmedSku) {
      setError('Nombre y SKU son campos obligatorios.');
      return;
    }

    if (newTotalEditions <= 0) {
      setError('El numero de ediciones debe ser mayor que cero.');
      return;
    }

    onSave({
      seriesName: trimmedName,
      sku: trimmedSku,
      description,
      basePrice,
      category,
      imageUrl: imageUrl || undefined,
      totalEditions: newTotalEditions,
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
      aria-labelledby="edit-series-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-95 opacity-0 animate-fade-in-scale"
        onClick={handleModalContentClick}
      >
        <form onSubmit={handleSubmit}>
          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 id="edit-series-title" className="text-2xl sm:text-3xl font-bold font-serif text-gray-900">
                  Editar Serie
                </h2>
                <p className="text-sm text-gray-500 mt-1">Modifica los datos de la obra seriada</p>
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
              {/* Imagen */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Imagen de la Obra</label>
                <div className="flex items-center gap-4">
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-lg border" />
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    {isUploadingImage ? 'Subiendo...' : (imagePreview ? 'Cambiar Imagen' : 'Subir Imagen')}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                  />
                </div>
              </div>

              {/* Nombre */}
              <div>
                <label htmlFor="edit-name" className="block text-sm font-bold text-gray-700 mb-1">
                  Nombre de la Obra
                </label>
                <input
                  type="text"
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  placeholder="Nombre de la obra"
                />
              </div>

              {/* SKU */}
              <div>
                <label htmlFor="edit-sku" className="block text-sm font-bold text-gray-700 mb-1">
                  SKU
                </label>
                <input
                  type="text"
                  id="edit-sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="form-input"
                  placeholder="SKU de la serie"
                />
              </div>

              {/* Categoria y Precio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-category" className="block text-sm font-bold text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    id="edit-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProductCategory)}
                    className="form-input"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-price" className="block text-sm font-bold text-gray-700 mb-1">
                    Precio Base (USD)
                  </label>
                  <input
                    type="number"
                    id="edit-price"
                    step="0.01"
                    value={basePrice || ''}
                    onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                    className="form-input"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Descripcion */}
              <div>
                <label htmlFor="edit-description" className="block text-sm font-bold text-gray-700 mb-1">
                  Descripcion
                </label>
                <textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input"
                  rows={3}
                  placeholder="Descripcion de la obra seriada..."
                />
              </div>

              {/* Total Ediciones */}
              <div>
                <label htmlFor="edit-totalEditions" className="block text-sm font-bold text-gray-700 mb-1">
                  Total de Ediciones
                </label>
                <input
                  type="number"
                  id="edit-totalEditions"
                  value={newTotalEditions || ''}
                  onChange={(e) => setNewTotalEditions(parseInt(e.target.value, 10) || 0)}
                  min="1"
                  className="form-input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Actualmente existen {product.editions.length} ediciones.
                  {newTotalEditions > product.editions.length && (
                    <span className="text-green-600 font-medium">
                      {' '}Se crearan {newTotalEditions - product.editions.length} ediciones nuevas automaticamente.
                    </span>
                  )}
                </p>
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
              disabled={isUploadingImage}
              className="px-5 py-2.5 border border-transparent text-sm font-bold rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isUploadingImage ? 'Subiendo imagen...' : 'Guardar Cambios'}
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

export default EditSeriesModal;
