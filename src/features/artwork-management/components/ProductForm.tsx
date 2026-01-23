
import React, { useState, useRef, useEffect } from 'react';
import type { NewProduct, Product, ShippingSettings } from '../types';
import { CATEGORIES } from '../types';
import { SaveIcon } from '@/shared/components/Icons';
import { calculateNewShippingCosts } from '@/shared/utils/envio_usa_canada';
import { storageService } from '@/shared/services/storageService';

interface ProductFormProps {
  onAddProduct: (product: NewProduct) => void;
  editingProduct: Product | null;
  onUpdateProduct: (product: Product) => void;
  onCancelEdit: () => void;
  shippingSettings: ShippingSettings;
}

const ProductForm: React.FC<ProductFormProps> = (
  { onAddProduct, editingProduct, onUpdateProduct, onCancelEdit, shippingSettings }
) => {
  const initialFormState: NewProduct = {
    nombre: '',
    descripcion: '',
    detalles: '',
    precioUSD: 0,
    medidas: '',
    peso: 0,
    sku: '',
    imagenUrl: '',
    interactiva: false,
    medidasCaja: '',
    costoEnvioUSA: 0,
    costoEnvioCanada: 0,
    category: CATEGORIES[0],
    vendido: false,
  };

  const [productData, setProductData] = useState<NewProduct | Product>(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isShippingCostManual, setIsShippingCostManual] = useState({ usa: false, can: false });
  const [shippingError, setShippingError] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const isEditing = !!editingProduct;

  useEffect(() => {
    const stateToEdit = editingProduct || initialFormState;
    setProductData(stateToEdit);

    setImagePreview(editingProduct?.imagenUrl || null);
    setIsShippingCostManual({ usa: false, can: false });
    setShippingError('');
    if (!editingProduct && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [editingProduct]);


  useEffect(() => {
    if (isShippingCostManual.usa && isShippingCostManual.can) return;

    const result = calculateNewShippingCosts({
        price: productData.precioUSD,
        dimensionsStr: productData.medidasCaja,
        settings: shippingSettings,
    });

    setShippingError(result.error ?? '');

    setProductData(prev => ({
        ...prev,
        costoEnvioUSA: isShippingCostManual.usa ? prev.costoEnvioUSA : result.usaCost,
        costoEnvioCanada: isShippingCostManual.can ? prev.costoEnvioCanada : result.canadaCost,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productData.medidasCaja, productData.precioUSD, shippingSettings, isShippingCostManual.usa, isShippingCostManual.can]);


  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'costoEnvioUSA') {
        setIsShippingCostManual(prev => ({ ...prev, usa: true }));
    }
    if (name === 'costoEnvioCanada') {
        setIsShippingCostManual(prev => ({ ...prev, can: true }));
    }
    
    const numericFields = ['precioUSD', 'peso', 'costoEnvioUSA', 'costoEnvioCanada'];
    setProductData((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? parseFloat(value) || 0 : value,
    }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setProductData(prev => ({
        ...prev,
        [name]: checked,
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🖼️ [IMAGE UPLOAD] Starting image upload process...');
    const file = e.target.files?.[0];
    if (!file) {
      console.log('⚠️ [IMAGE UPLOAD] No file selected');
      return;
    }

    console.log('📁 [IMAGE UPLOAD] File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeInMB: (file.size / 1024 / 1024).toFixed(2) + 'MB'
    });

    try {
      setIsUploadingImage(true);
      setError(null);

      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        console.error('❌ [IMAGE UPLOAD] File too large:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
        setError("La imagen es muy grande. El límite es 100MB.");
        setIsUploadingImage(false);
        return;
      }

      console.log('✅ [IMAGE UPLOAD] File size OK');

      // Create preview using FileReader
      console.log('🔄 [IMAGE UPLOAD] Creating preview...');
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        console.log('✅ [IMAGE UPLOAD] Preview created');
      };
      reader.readAsDataURL(file);

      // Upload to Firebase Storage
      const filename = storageService.generateUniqueFilename(file.name, 'artworks');
      console.log('📤 [IMAGE UPLOAD] Uploading to Firebase Storage:', filename);

      const downloadURL = await storageService.uploadImage(file, filename);
      console.log('✅ [IMAGE UPLOAD] Upload successful! URL:', downloadURL);

      // Save the download URL (not base64)
      setProductData(prev => ({ ...prev, imagenUrl: downloadURL }));
      console.log('✅ [IMAGE UPLOAD] URL saved to product data');

      setIsUploadingImage(false);
      console.log('✅ [IMAGE UPLOAD] Process complete!');
    } catch (err) {
      console.error('❌ [IMAGE UPLOAD] Upload failed:', err);
      setError(err instanceof Error ? err.message : "No se pudo cargar la imagen.");
      setIsUploadingImage(false);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('💾 [SAVE] Form submitted');
    console.log('📦 [SAVE] Product data:', productData);
    console.log('🖼️ [SAVE] Image URL type:', typeof productData.imagenUrl);
    console.log('🖼️ [SAVE] Image URL length:', productData.imagenUrl?.length || 0);
    console.log('🖼️ [SAVE] Image URL preview:', productData.imagenUrl?.substring(0, 100) + '...');

    if (!productData.nombre || !productData.sku) {
      console.error('❌ [SAVE] Missing required fields');
      setError("Nombre y SKU son campos obligatorios.");
      return;
    }

    console.log('✅ [SAVE] Validation passed');

    if (isEditing) {
      console.log('🔄 [SAVE] Updating existing product...');
      onUpdateProduct(productData as Product);
    } else {
      console.log('➕ [SAVE] Adding new product...');
      onAddProduct(productData as NewProduct);
      setProductData(initialFormState);
      setImagePreview(null);
      if (fileInputRef.current) {
          fileInputRef.current.value = "";
      }
    }
    setError(null);
    console.log('✅ [SAVE] Save process initiated');
  };

  return (
    <div className="bg-white p-6 rounded-xl">
      <h2 className="text-3xl font-bold font-serif mb-6 text-gray-900" id="form-modal-title">{isEditing ? 'Editar Producto' : 'Agregar Nuevo Producto'}</h2>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input type="text" name="nombre" placeholder="Nombre de la Pieza" value={productData.nombre} onChange={handleInputChange} required className="form-input" />
          <input type="text" name="sku" placeholder="SKU" value={productData.sku} onChange={handleInputChange} required className="form-input" />
        </div>
        
        <div>
          <label htmlFor="category" className="block text-sm font-bold text-gray-700">Categoría</label>
          <select id="category" name="category" value={productData.category} onChange={handleInputChange} className="mt-1 form-input">
              {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
              ))}
          </select>
        </div>

        <textarea name="descripcion" placeholder="Descripción manual del producto..." value={productData.descripcion} onChange={handleInputChange} className="form-input" rows={4}></textarea>
        <textarea name="detalles" placeholder="Detalles técnicos (material, año, etc.)" value={productData.detalles} onChange={handleInputChange} className="form-input" rows={3}></textarea>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input type="number" step="0.01" name="precioUSD" placeholder="Precio (USD)" value={productData.precioUSD || ''} onChange={handleInputChange} className="form-input" />
            <input type="number" step="0.01" name="peso" placeholder="Peso (kg)" value={productData.peso || ''} onChange={handleInputChange} className="form-input" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
                <input type="text" name="medidas" placeholder="ej: 10x20x30 cm" value={productData.medidas} onChange={handleInputChange} className="form-input" />
                <span className="absolute top-[-0.6rem] left-2 px-1 bg-white text-xs font-bold text-gray-500">Medidas</span>
            </div>
            <div className="relative">
                <input type="text" name="medidasCaja" placeholder="ej: 40x30x20" value={productData.medidasCaja} onChange={handleInputChange} className="form-input" />
                <span className="absolute top-[-0.6rem] left-2 px-1 bg-white text-xs font-bold text-gray-500">Medidas de la Caja</span>
            </div>
        </div>
        
        <div className="space-y-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                  <input type="number" step="0.01" id="costoEnvioUSA" name="costoEnvioUSA" value={productData.costoEnvioUSA || ''} onChange={handleInputChange} className="form-input" />
                  <span className="absolute top-[-0.6rem] left-2 px-1 bg-white text-xs font-bold text-gray-500">Costo de Envío EE.UU.</span>
              </div>
               <div className="relative">
                  <input type="number" step="0.01" id="costoEnvioCanada" name="costoEnvioCanada" value={productData.costoEnvioCanada || ''} onChange={handleInputChange} className="form-input" />
                  <span className="absolute top-[-0.6rem] left-2 px-1 bg-white text-xs font-bold text-gray-500">Costo de Envío Canadá</span>
              </div>
          </div>
          {shippingError && <p className="text-xs text-orange-500 px-1">{shippingError}</p>}
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center">
            <input id="interactiva" name="interactiva" type="checkbox" checked={productData.interactiva} onChange={handleCheckboxChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded bg-gray-50" />
            <label htmlFor="interactiva" className="ml-2 block text-sm font-bold text-gray-700">
                Pieza Interactiva
            </label>
          </div>
          <div className="flex items-center">
            <input id="vendido" name="vendido" type="checkbox" checked={productData.vendido} onChange={handleCheckboxChange} className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded bg-gray-50" />
            <label htmlFor="vendido" className="ml-2 block text-sm font-bold text-gray-700">
                Marcar como Vendido
            </label>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Imagen del Producto (Opcional, máx 100MB)
          </label>
          <div className="mt-1 flex items-center gap-4">
            {imagePreview && <img src={imagePreview} alt="Preview" className="h-16 w-16 object-cover rounded-md border" />}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploadingImage ? 'Subiendo...' : (imagePreview ? 'Cambiar Imagen' : 'Subir Imagen')}
            </button>
            <input
              id="image-upload"
              name="image-upload"
              type="file"
              accept="image/png, image/jpeg, image/webp"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
              disabled={isUploadingImage}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={isUploadingImage}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-transparent text-sm font-bold rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
            <SaveIcon className="h-5 w-5" />
            {isUploadingImage ? 'Subiendo imagen...' : (isEditing ? 'Actualizar Producto' : 'Guardar Producto')}
            </button>
            
            <button 
                type="button" 
                onClick={onCancelEdit}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-bold rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                Cancelar
            </button>
        </div>
      </form>
      <style>{`
      .form-input { width: 100%; padding: 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; background-color: #F9FAFB; font-weight: 500; } 
      .form-input::placeholder { font-weight: normal; color: #6B7280; }
      .form-input:focus { outline: 2px solid transparent; outline-offset: 2px; --tw-ring-color: #3B82F6; border-color: #3B82F6; box-shadow: 0 0 0 2px var(--tw-ring-color); }
      `}</style>
    </div>
  );
};

export default ProductForm;