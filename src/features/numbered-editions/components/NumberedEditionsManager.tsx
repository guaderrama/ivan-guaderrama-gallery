import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { NumberedProduct, Edition } from '../types';
import { EditIcon, SearchIcon, PlusIcon, TrashIcon } from '@/shared/components/Icons';
import EditEditionModal from './EditEditionModal';
import { storageService } from '@/shared/services/storageService';

interface NumberedEditionsManagerProps {
  products: NumberedProduct[];
  onAddProduct: () => void;
  onEditSeries: (product: NumberedProduct) => void;
  onUpdateSeriesImage: (productId: string, imageUrl: string) => Promise<void>;
  onArchiveSeries: (productId: string) => void;
  onDeleteSeries: (productId: string) => void;
  onSaveEdition: (productId: string, edition: Edition) => void;
  onArchiveEdition: (productId: string, editionId: string) => void;
  onDeleteEdition: (productId: string, editionId: string) => void;
  existingSkus: string[];
  existingNames: string[];
  canEditSeries?: boolean;
}

const NumberedEditionsManager: React.FC<NumberedEditionsManagerProps> = ({
  products,
  onAddProduct,
  onEditSeries,
  onUpdateSeriesImage,
  onArchiveSeries,
  onDeleteSeries,
  onSaveEdition,
  onArchiveEdition,
  onDeleteEdition,
  existingSkus,
  existingNames,
  canEditSeries = true
}) => {
  console.log('📚 [COMPONENT] NumberedEditionsManager rendered with', products.length, 'products');
  console.log('📚 [COMPONENT] Products:', products);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSku, setSelectedSku] = useState<string | undefined>(
    products.length > 0 ? products[0].sku : undefined
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingEdition, setEditingEdition] = useState<Edition | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'sold' | 'available'>('all');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (!selectedSku && products.length > 0) {
      setSelectedSku(products[0].sku);
    }
  }, [products, selectedSku]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) {
      return products;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return products.filter(p =>
        p.name.toLowerCase().includes(lowercasedTerm) ||
        p.sku.toLowerCase().includes(lowercasedTerm)
    );
  }, [products, searchTerm]);

  useEffect(() => {
    const isSelectedInList = filteredProducts.some(p => p.sku === selectedSku);
    if (!isSelectedInList && filteredProducts.length > 0) {
        setSelectedSku(filteredProducts[0].sku);
    } else if (filteredProducts.length === 0) {
        setSelectedSku(undefined);
    }
    setFilterStatus('all'); // Reset filter when product changes
  }, [filteredProducts, selectedSku]);


  const selectedProduct = useMemo(() => {
    if (!selectedSku) return null;
    return products.find(p => p.sku === selectedSku) || null;
  }, [products, selectedSku]);
  
  const filteredEditions = useMemo(() => {
    if (!selectedProduct) return [];
    if (filterStatus === 'all') {
      return selectedProduct.editions;
    }
    return selectedProduct.editions.filter(edition => {
        const isSold = !!edition.clientName || !!edition.gallerySeller;
        if (filterStatus === 'available') return !isSold;
        if (filterStatus === 'sold') return isSold;
        return false;
    });
  }, [selectedProduct, filterStatus]);


  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🖼️ [SERIES IMAGE] Starting image upload process...');
    const file = e.target.files?.[0];
    if (!file || !selectedProduct) {
      console.log('⚠️ [SERIES IMAGE] No file or no selected product');
      return;
    }

    console.log('📁 [SERIES IMAGE] File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeInMB: (file.size / 1024 / 1024).toFixed(2) + 'MB'
    });

    try {
      setIsUploadingImage(true);

      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        console.error('❌ [SERIES IMAGE] File too large:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
        alert("La imagen es muy grande. El límite es 100MB.");
        setIsUploadingImage(false);
        return;
      }

      console.log('✅ [SERIES IMAGE] File size OK');

      // Upload to Firebase Storage
      const filename = storageService.generateUniqueFilename(file.name, 'numbered-editions');
      console.log('📤 [SERIES IMAGE] Uploading to Firebase Storage:', filename);

      const downloadURL = await storageService.uploadImage(file, filename);
      console.log('✅ [SERIES IMAGE] Upload successful! URL:', downloadURL);

      // Update series with new image URL in Firestore
      console.log('🔄 [SERIES IMAGE] Updating series in Firestore...');
      await onUpdateSeriesImage(selectedProduct.id, downloadURL);
      console.log('✅ [SERIES IMAGE] Series updated successfully in Firestore!');

      setIsUploadingImage(false);
    } catch (err) {
      console.error('❌ [SERIES IMAGE] Upload failed:', err);
      alert(err instanceof Error ? err.message : "No se pudo cargar la imagen.");
      setIsUploadingImage(false);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSelectEditionToEdit = (edition: Edition) => {
    setEditingEdition(edition);
  };

  const handleCancelEditEdition = () => {
    setEditingEdition(null);
  };

  const handleSaveEditedEdition = (updatedEdition: Edition) => {
    if (selectedProduct) {
      onSaveEdition(selectedProduct.id, updatedEdition);
    }
    setEditingEdition(null);
  };

  const FilterButton: React.FC<{
      status: 'all' | 'sold' | 'available';
      label: string;
      count: number;
    }> = ({ status, label, count }) => {
    const isActive = filterStatus === status;
    const baseClasses = "px-4 py-1.5 text-sm font-bold rounded-full transition-colors duration-200 flex items-center gap-2";
    const activeClasses = {
        all: 'bg-gray-800 text-white',
        available: 'bg-green-600 text-white',
        sold: 'bg-blue-600 text-white',
    };
    const inactiveClasses = "bg-gray-100 text-gray-600 hover:bg-gray-200";

    return (
        <button
            onClick={() => setFilterStatus(status)}
            className={`${baseClasses} ${isActive ? activeClasses[status] : inactiveClasses}`}
        >
            {label}
            <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-gray-300'}`}>{count}</span>
        </button>
    );
  };

  return (
    <div className="p-1">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold font-serif text-gray-900">Obras Seriadas</h2>
        {products.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
                <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-48 pl-10 pr-4 py-2 border border-gray-300 rounded-full bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm placeholder:text-gray-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
            </div>
            <select
                value={selectedSku || ''}
                onChange={(e) => setSelectedSku(e.target.value)}
                className="form-input w-full sm:w-auto max-w-xs py-2 pl-3 pr-8 border border-gray-300 rounded-full bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm font-medium"
                aria-label="Seleccionar una obra seriada"
            >
                {filteredProducts.length > 0 ? (
                    filteredProducts.map(p => (
                        <option key={p.sku} value={p.sku}>
                            {p.name} ({p.sku})
                        </option>
                    ))
                ) : (
                    <option disabled>No se encontraron obras</option>
                )}
            </select>
            {canEditSeries && (
              <>
                <button
                  onClick={() => selectedProduct && onEditSeries(selectedProduct)}
                  disabled={!selectedProduct}
                  className="p-2.5 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Editar número de series"
                  title="Editar Serie"
                >
                  <EditIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    if (selectedProduct && window.confirm(`¿Estás seguro de que deseas eliminar "${selectedProduct.name}"? Esta acción no se puede deshacer.`)) {
                      onDeleteSeries(selectedProduct.id);
                    }
                  }}
                  disabled={!selectedProduct}
                  className="p-2.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Eliminar serie"
                  title="Eliminar Serie"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {selectedProduct ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <div className="sticky top-8">
                    <div className="relative group">
                        {selectedProduct.imageUrl ? (
                            <img 
                                src={selectedProduct.imageUrl} 
                                alt={`Foto de ${selectedProduct.name}`}
                                className="w-full h-auto object-cover rounded-lg shadow-lg border"
                            />
                        ) : (
                            <div className="w-full aspect-[4/3] bg-gray-200 flex items-center justify-center rounded-lg shadow-md">
                                <span className="text-gray-500">Sin Imagen</span>
                            </div>
                        )}
                         {canEditSeries && (
                          <>
                            <button
                                onClick={triggerImageUpload}
                                disabled={isUploadingImage}
                                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 flex items-center justify-center text-white text-sm font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg cursor-pointer disabled:cursor-wait disabled:opacity-100 disabled:bg-opacity-60"
                                aria-label="Cambiar foto de la obra"
                            >
                                {isUploadingImage ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Subiendo...</span>
                                    </>
                                ) : (
                                    <>
                                        <EditIcon className="h-5 w-5 mr-2" />
                                        <span>Cambiar Foto</span>
                                    </>
                                )}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                className="hidden"
                                accept="image/png, image/jpeg, image/webp"
                            />
                          </>
                         )}
                    </div>
                    <div className="mt-4">
                        <h3 className="text-2xl font-bold font-serif text-gray-900">{selectedProduct.name}</h3>
                        <p className="text-sm text-gray-500 font-mono">{selectedProduct.sku}</p>
                        <p className="text-sm text-gray-600 mt-2">
                            Total de Ediciones: <span className="font-bold">{selectedProduct.totalEditions}</span>
                        </p>
                    </div>
                </div>
            </div>
            <div className="lg:col-span-2">
                <div className="flex items-center gap-2 mb-6 flex-wrap">
                    <FilterButton status="all" label="Todos" count={selectedProduct.editions.length} />
                    <FilterButton status="available" label="Disponibles" count={selectedProduct.editions.filter(e => !e.clientName && !e.gallerySeller).length} />
                    <FilterButton status="sold" label="Vendidas" count={selectedProduct.editions.filter(e => e.clientName || e.gallerySeller).length} />
                </div>
                 <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3">
                    {filteredEditions.map(edition => {
                        const isSold = !!edition.clientName || !!edition.gallerySeller;
                        return (
                            <button
                                key={edition.id}
                                onClick={() => handleSelectEditionToEdit(edition)}
                                className={`flex flex-col items-center justify-center aspect-square rounded-lg border-2 transition-all duration-200 cursor-pointer hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                    isSold
                                    ? 'border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100 focus:ring-blue-500'
                                    : 'border-green-300 bg-green-50 text-green-800 hover:bg-green-100 focus:ring-green-500'
                                }`}
                                aria-label={`Editar edición #${edition.editionNumber}`}
                            >
                                <span className="text-3xl font-bold">{edition.editionNumber}</span>
                                <span className="text-xs font-medium uppercase tracking-wider">{isSold ? 'Vendida' : 'Disponible'}</span>
                            </button>
                        )
                    })}
                 </div>
                 {filteredEditions.length === 0 && (
                    <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">
                        <p>No hay ediciones que coincidan con el filtro seleccionado.</p>
                    </div>
                 )}
            </div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">{searchTerm ? `No se encontraron obras para "${searchTerm}".` : 'No hay obras seriadas disponibles.'}</p>
        </div>
      )}
       <style>{`.form-input { appearance: none; -webkit-appearance: none; -moz-appearance: none; }`}</style>
        {editingEdition && selectedProduct && (
            <EditEditionModal
                isOpen={!!editingEdition}
                onClose={handleCancelEditEdition}
                onSave={handleSaveEditedEdition}
                edition={editingEdition}
                productName={`${selectedProduct.seriesName} (${selectedProduct.sku})`}
                readOnly={!canEditSeries && !!(editingEdition.clientName || editingEdition.gallerySeller)}
            />
        )}

      {/* Floating Action Button */}
      {canEditSeries && (
        <button
          onClick={onAddProduct}
          className="fixed bottom-8 right-8 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40"
          aria-label="Agregar nueva obra seriada"
          title="Agregar nueva obra seriada"
        >
          <PlusIcon className="h-7 w-7" />
        </button>
      )}
    </div>
  );
};

export default NumberedEditionsManager;
