import React from 'react';
import ProductForm from './ProductForm';
import { NewProduct, Product, ShippingSettings } from '../types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: NewProduct | Product) => void;
  product?: Product;
  existingSkus: string[];
  shippingSettings: ShippingSettings;
}

const ProductFormModal: React.FC<ProductFormModalProps> = (props) => {
  const { isOpen, onClose, onSave, product, shippingSettings } = props;

  if (!isOpen) return null;

  const handleRequestClose = () => {
    // Se eliminó la confirmación de cambios sin guardar para solucionar un error
    // en el que los cálculos automáticos activaban incorrectamente el diálogo
    // de confirmación, haciendo que los botones de cerrar y cancelar no respondieran.
    onClose();
  };

  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={handleRequestClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-modal-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-95 opacity-0 animate-fade-in-scale"
        onClick={handleModalContentClick}
      >
        <div className="relative">
          <button
            onClick={handleRequestClose}
            className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
            aria-label="Cerrar modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <ProductForm
            onAddProduct={onSave as (product: NewProduct) => void}
            editingProduct={product || null}
            onUpdateProduct={onSave as (product: Product) => void}
            onCancelEdit={handleRequestClose}
            shippingSettings={shippingSettings}
          />
          
        </div>
      </div>
      <style>{`
        @keyframes fade-in-scale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in-scale { animation: fade-in-scale 0.2s forwards; }
      `}</style>
    </div>
  );
};

export default ProductFormModal;