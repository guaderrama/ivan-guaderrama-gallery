import React, { useState, useEffect, lazy, Suspense } from 'react';
import { ShippingSettings } from '../types';
import { useAuth } from '@/features/auth/context/AuthContext';

const UserManagementPanel = lazy(() => import('@/features/user-management/components/UserManagementPanel'));

type SettingsTab = 'shipping' | 'users';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: ShippingSettings) => void;
  currentSettings: ShippingSettings;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentSettings }) => {
  const [settings, setSettings] = useState<ShippingSettings>(currentSettings);
  const { hasPermission } = useAuth();
  const isSuperAdmin = hasPermission('users:manage');

  const [activeTab, setActiveTab] = useState<SettingsTab>('shipping');

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings, isOpen]);

  // Reset tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('shipping');
    }
  }, [isOpen]);

  if (!isOpen || !isSuperAdmin) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const InputField = ({ label, name, value }: { label: string, name: keyof ShippingSettings, value: number }) => (
    <div className="sm:col-span-1">
      <label htmlFor={name} className="block text-sm font-semibold text-gray-700">
        {label}
      </label>
      <input
        type="number"
        name={name}
        id={name}
        value={value || ''}
        onChange={handleInputChange}
        step="0.0001"
        className="mt-1 form-input"
      />
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${activeTab === 'users' ? 'max-w-4xl' : 'max-w-2xl'} max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-95 opacity-0 animate-fade-in-scale`}
        onClick={handleModalContentClick}
      >
        <div className="p-8 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h2 id="settings-title" className="text-3xl font-bold font-serif text-gray-900 mb-6">Ajustes</h2>

          {/* Tabs */}
          <nav className="flex space-x-1 mb-6 border-b border-gray-200">
            <TabBtn label="Envío" tab="shipping" activeTab={activeTab} onClick={setActiveTab} />
            <TabBtn label="Usuarios" tab="users" activeTab={activeTab} onClick={setActiveTab} />
          </nav>

          {/* Shipping Settings Tab */}
          {activeTab === 'shipping' && (
            <>
              <div className="space-y-6">
                <fieldset className="border p-4 rounded-lg">
                    <legend className="text-lg font-semibold text-gray-800 px-2">Parámetros EE.UU.</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        <InputField label="Costo de Guía (USD)" name="costoGuiaUSA" value={settings.costoGuiaUSA} />
                        <InputField label="Costo por Kg Volumétrico (USD)" name="costoPorKiloUSA" value={settings.costoPorKiloUSA} />
                    </div>
                </fieldset>

                <fieldset className="border p-4 rounded-lg">
                    <legend className="text-lg font-semibold text-gray-800 px-2">Parámetros Canadá</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        <InputField label="Costo de Guía (CAD)" name="costoGuiaCanada" value={settings.costoGuiaCanada} />
                        <InputField label="Costo por Kg Volumétrico (CAD)" name="costoPorKiloCanada" value={settings.costoPorKiloCanada} />
                    </div>
                </fieldset>

                <fieldset className="border p-4 rounded-lg">
                    <legend className="text-lg font-semibold text-gray-800 px-2">Factores Generales de Cálculo</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                        <InputField label="Tasa de Seguro (ej: 0.0125)" name="tasaSeguro" value={settings.tasaSeguro} />
                        <InputField label="Divisor de IVA (ej: 1.16)" name="divisorIVA" value={settings.divisorIVA} />
                        <InputField label="Divisor Volumétrico" name="divisorVolumetrico" value={settings.divisorVolumetrico} />
                    </div>
                </fieldset>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleSave}
                  className="px-6 py-3 border border-transparent text-base font-bold rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Guardar Ajustes
                </button>
              </div>
            </>
          )}

          {/* Users Management Tab */}
          {activeTab === 'users' && (
            <Suspense fallback={
              <div className="flex items-center justify-center p-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            }>
              <UserManagementPanel />
            </Suspense>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fade-in-scale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in-scale { animation: fade-in-scale 0.2s forwards; }
        .form-input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; background-color: #F9FAFB; font-weight: 500; }
        .form-input::placeholder { font-weight: normal; color: #6B7280; }
        .form-input:focus { outline: 2px solid transparent; outline-offset: 2px; --tw-ring-color: #3B82F6; border-color: #3B82F6; box-shadow: 0 0 0 2px var(--tw-ring-color); }
      `}</style>
    </div>
  );
};

// Small tab button helper
function TabBtn({ label, tab, activeTab, onClick }: { label: string; tab: SettingsTab; activeTab: SettingsTab; onClick: (t: SettingsTab) => void }) {
  return (
    <button
      onClick={() => onClick(tab)}
      className={`px-4 py-2 text-sm font-medium transition-colors relative ${
        activeTab === tab ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
      {activeTab === tab && (
        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-600 rounded-full"></span>
      )}
    </button>
  );
}

export default SettingsModal;
