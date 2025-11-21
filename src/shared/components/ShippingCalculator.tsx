import React, { useState, useEffect } from 'react';
import { calculateNewShippingCosts } from '../utils/envio_usa_canada';
import { ShippingSettings } from '../types';

interface ShippingCalculatorProps {
    shippingSettings: ShippingSettings;
}

const ShippingCalculator: React.FC<ShippingCalculatorProps> = ({ shippingSettings }) => {
    const [price, setPrice] = useState<number>(0);
    const [boxDimensions, setBoxDimensions] = useState<string>('');
    const [shippingCosts, setShippingCosts] = useState<{ usa: number; can: number }>({ usa: 0, can: 0 });
    const [error, setError] = useState<string>('');

    // Debug: Log received settings
    useEffect(() => {
        console.log('📦 ShippingCalculator received settings:', shippingSettings);
    }, [shippingSettings]);

    useEffect(() => {
        const result = calculateNewShippingCosts({
            price: price,
            dimensionsStr: boxDimensions,
            settings: shippingSettings,
        });

        setError(result.error ?? '');
        setShippingCosts({
            usa: result.usaCost,
            can: result.canadaCost
        });
    }, [boxDimensions, price, shippingSettings]);

    const formatCost = (cost: number) => {
        if (cost === 0 && error) {
             return <span className="text-orange-500">-</span>;
        }
        return `$${cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center">Calculadora de Costos de Envío</h2>
                <div className="space-y-6">
                    <div>
                        <label htmlFor="price" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Valor de la Mercancía (USD)
                        </label>
                        <input
                            type="number"
                            name="price"
                            id="price"
                            step="0.01"
                            placeholder="0.00"
                            value={price || ''}
                            onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                            className="mt-1 form-input"
                        />
                    </div>
                    <div>
                        <label htmlFor="boxDimensions" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Medidas de la Caja (ej: 40x30x20)
                        </label>
                        <input
                            type="text"
                            name="boxDimensions"
                            id="boxDimensions"
                            placeholder="Largo x Ancho x Alto"
                            value={boxDimensions}
                            onChange={(e) => setBoxDimensions(e.target.value)}
                            className="mt-1 form-input"
                        />
                         {error && <p className="text-xs text-orange-500 mt-1 px-1">{error}</p>}
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Resultados del Cálculo:</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center">
                                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Costo de Envío a USA</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {formatCost(shippingCosts.usa)}
                                </p>
                            </div>
                             <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center">
                                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Costo de Envío a Canadá</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {formatCost(shippingCosts.can)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
            .form-input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; background-color: #F9FAFB; font-weight: bold; }
            .form-input::placeholder { font-weight: normal; color: #6B7280; }
            .dark .form-input { border-color: #4B5563; background-color: #374151; color: #F3F4F6; } 
            .form-input:focus { outline: 2px solid transparent; outline-offset: 2px; --tw-ring-color: #3B82F6; --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color); --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color); box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000); }
            `}</style>
        </div>
    );
};

export default ShippingCalculator;