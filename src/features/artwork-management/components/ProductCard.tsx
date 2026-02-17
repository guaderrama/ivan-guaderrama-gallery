
import React from 'react';
import type { Product } from '../types';
import { EditIcon, ExpandIcon } from '@/shared/components/Icons';
import { CATEGORY_COLORS } from '@/shared/constants';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  canEdit?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onViewDetails, canEdit = true }) => {
  return (
    <div className="group relative break-inside-avoid overflow-hidden rounded-lg shadow-sm hover:shadow-xl transition-shadow duration-300">
      {product.vendido && (
        <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
          <span className="text-3xl font-black font-serif text-white bg-red-600 border-4 border-white px-8 py-3 rounded-md transform -rotate-12 shadow-lg">
            VENDIDO
          </span>
        </div>
      )}
      {product.imagenUrl ? (
        <img 
          src={product.imagenUrl} 
          alt={`Imagen de ${product.nombre}`}
          className="w-full h-auto object-cover"
        />
      ) : (
        <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded-lg">
          <span className="text-gray-500">Sin Imagen</span>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out pointer-events-none z-10"></div>

      <div className="absolute inset-0 p-4 flex flex-col justify-end text-white opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-300 ease-in-out z-50">
        <h3 className="text-lg font-bold font-serif">{product.nombre}</h3>
        <p className="text-sm font-mono opacity-80 mt-1">{product.sku}</p>
        
        <div className="flex justify-between items-center mt-4">
          <p className="text-xl font-serif font-black">${product.precioUSD.toLocaleString()}</p>
          <div className="flex items-center space-x-2">
            <button
                onClick={(e) => { e.stopPropagation(); onViewDetails(product); }}
                className="p-2.5 rounded-full bg-yellow-400 text-gray-900 hover:bg-yellow-300 transition-all transform hover:scale-110"
                aria-label={`Ver detalles de ${product.nombre}`}
            >
                <ExpandIcon className="h-4 w-4" />
            </button>
            {canEdit && (
              <button
                  onClick={(e) => { e.stopPropagation(); onEdit(product); }}
                  className="p-2.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-all transform hover:scale-110"
                  aria-label={`Editar ${product.nombre}`}
              >
                  <EditIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {product.category && CATEGORY_COLORS[product.category] && (
          <span className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full shadow-lg z-30 ${CATEGORY_COLORS[product.category]}`}>
              {product.category}
          </span>
      )}
      <div className="absolute top-3 left-3 flex flex-col gap-1 z-30">
        {product.limitedEdition && (
          <span className="bg-gray-800 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg uppercase tracking-wider">Limited Edition</span>
        )}
        {product.galeria && (
          <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg uppercase tracking-wider">Galeria</span>
        )}
        {product.bodega && (
          <span className="bg-amber-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg uppercase tracking-wider">Bodega</span>
        )}
      </div>
    </div>
  );
};

export default ProductCard;