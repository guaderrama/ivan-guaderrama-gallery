import React from 'react';
import { Product } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  // Prevent clicks inside the modal from closing it
  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-detail-title"
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-95 opacity-0 animate-fade-in-scale"
        onClick={handleModalContentClick}
      >
        <div className="p-8 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
            aria-label="Cerrar modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
            {/* --- Image Column --- */}
            <div className="w-full">
              {product.imagenUrl && (
                <div className="sticky top-0">
                  <img 
                    src={product.imagenUrl} 
                    alt={`Imagen de ${product.nombre}`}
                    className="w-full h-auto max-h-[80vh] object-contain rounded-lg border"
                  />
                </div>
              )}
            </div>

            {/* --- Details Column --- */}
            <div>
              <div className="space-y-4">
                <h2 id="product-detail-title" className="text-4xl font-bold font-serif text-gray-900">{product.nombre}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  {product.vendido && (
                    <span className="bg-red-600 text-white text-sm font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">Vendido</span>
                  )}
                  {product.category && (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[product.category]}`}>
                        {product.category}
                    </span>
                  )}
                  {product.interactiva && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">Interactiva</span>
                  )}
                </div>
                <p className="text-gray-600 italic pt-2">{product.descripcion}</p>
              </div>

              <div className="mt-8 border-t border-gray-200 pt-6">
                 <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-base">
                    <div className="sm:col-span-1">
                        <dt className="font-semibold text-gray-800">SKU</dt>
                        <dd className="mt-1 text-gray-600">{product.sku}</dd>
                    </div>
                     <div className="sm:col-span-1">
                        <dt className="font-bold text-gray-800">Categoría</dt>
                        <dd className="mt-1 text-gray-600">{product.category}</dd>
                    </div>
                    <div className="sm:col-span-1">
                        <dt className="font-semibold text-gray-800">Precio</dt>
                        <dd className="mt-1 text-gray-600">${product.precioUSD.toLocaleString()}</dd>
                    </div>
                    <div className="sm:col-span-1">
                        <dt className="font-semibold text-gray-800">Peso</dt>
                        <dd className="mt-1 text-gray-600">{product.peso} kg</dd>
                    </div>
                    <div className="sm:col-span-2">
                        <dt className="font-semibold text-gray-800">Detalles Técnicos</dt>
                        <dd className="mt-1 text-gray-600 whitespace-pre-wrap">{product.detalles}</dd>
                    </div>
                     <div className="sm:col-span-1">
                        <dt className="font-semibold text-gray-800">Medidas de la Pieza</dt>
                        <dd className="mt-1 text-gray-600">{product.medidas}</dd>
                    </div>
                    <div className="sm:col-span-1">
                        <dt className="font-semibold text-gray-800">Medidas de la Caja</dt>
                        <dd className="mt-1 text-gray-600">{product.medidasCaja}</dd>
                    </div>
                     <div className="sm:col-span-2 mt-2 border-t pt-4">
                        <dt className="font-bold text-gray-800">Costos de Envío Calculados</dt>
                        <dd className="mt-1 text-gray-600">
                          <p><strong>EE.UU.:</strong> ${product.costoEnvioUSA.toLocaleString()}</p>
                          <p><strong>Canadá:</strong> ${product.costoEnvioCanada.toLocaleString()}</p>
                        </dd>
                    </div>
                 </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-scale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.2s forwards;
        }
      `}</style>
    </div>
  );
};

export default ProductDetailModal;
