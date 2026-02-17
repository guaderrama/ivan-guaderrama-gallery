
import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import type { Product, NewProduct, ProductCategory, ShippingSettings } from '@/features/artwork-management/types';
import type { NumberedProduct, Edition, NewNumberedProductData } from '@/features/numbered-editions/types';
import type { Permission } from '@/features/auth/types';
import { CATEGORIES } from '@/features/artwork-management/types';
import { ProductCard, ProductDetailModal, ProductFormModal } from '@/features/artwork-management/components';
import { SettingsModal, BulkUploadModal, SearchIcon, SettingsIcon, PlusIcon, UploadIcon, ArchiveBoxIcon, XIcon } from '@/shared/components';
import { NumberedEditionsManager, AddNumberedProductModal, EditSeriesModal } from '@/features/numbered-editions/components';
import { useAuth } from '@/features/auth/context/AuthContext';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { LogoutButton } from '@/features/auth/components/LogoutButton';
import { UserBadge } from '@/features/auth/components/UserBadge';
import { useArtworks } from '@/features/artwork-management/hooks/useArtworks';
import { useNumberedEditions } from '@/features/numbered-editions/hooks/useNumberedEditions';
import CoursesManager from '@/features/courses/components/CoursesManager';
import { RelationshipsManager } from '@/features/relationships/components';

// Lazy load heavy components
const ArtworkSimulator = lazy(() => import('@/features/artwork-simulator/components/ArtworkSimulator'));

// Default shipping settings (defined here to avoid import issues)
const initialShippingSettings: ShippingSettings = {
  costoGuiaUSA: 33,
  costoPorKiloUSA: 8,
  costoGuiaCanada: 55,
  costoPorKiloCanada: 12,
  tasaSeguro: 0.0125,
  divisorIVA: 1.16,
  divisorVolumetrico: 5000,
};

type ActiveTab = 'catalog' | 'seriadas' | 'simulator' | 'courses' | 'relationships';

// Tab definition with permission requirement
interface TabDef {
  name: ActiveTab;
  label: string;
  permission: Permission;
}

const ALL_TABS: TabDef[] = [
  { name: 'catalog', label: 'Catálogo General', permission: 'catalog:read' },
  { name: 'seriadas', label: 'Ediciones Numeradas', permission: 'editions:read' },
  { name: 'simulator', label: 'Simulador', permission: 'simulator:access' },
  { name: 'courses', label: 'Cursos', permission: 'courses:read' },
  { name: 'relationships', label: 'Relaciones', permission: 'crm:read' },
];

// TabButton component for consistent tab styling
interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`relative px-6 py-3 font-medium transition-all duration-300 focus:outline-none ${
      isActive
        ? 'text-gray-900'
        : 'text-gray-500 hover:text-gray-800'
    }`}
  >
    {label}
    {isActive && (
      <span className="absolute inset-x-0 bottom-0 h-1 bg-red-500 rounded-full transition-all duration-300"></span>
    )}
  </button>
);

const App: React.FC = () => {
  // ALL HOOKS MUST BE AT THE TOP (React Rules of Hooks)
  const { user, loading: authLoading, hasPermission, roles } = useAuth();

  // UI State (must be before Firestore hooks that depend on them)
  const [showArchived, setShowArchived] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'ALL'>('ALL');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(initialShippingSettings);

  const [activeTab, setActiveTabState] = useState<ActiveTab>(() => {
    const stored = localStorage.getItem('activeTab');
    const validNames = ALL_TABS.map(t => t.name);
    if (stored && validNames.includes(stored as ActiveTab)) {
      return stored as ActiveTab;
    }
    return 'simulator';
  });
  const [isAddNumberedProductModalOpen, setIsAddNumberedProductModalOpen] = useState(false);

  const setActiveTab = (tab: ActiveTab) => {
    localStorage.setItem('activeTab', tab);
    setActiveTabState(tab);
  };

  // Compute visible tabs based on permissions
  const visibleTabs = useMemo(() => {
    return ALL_TABS.filter(tab => hasPermission(tab.permission));
  }, [roles]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select first visible tab if current is not accessible
  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some(t => t.name === activeTab)) {
      setActiveTab(visibleTabs[0].name);
    }
  }, [visibleTabs, activeTab]);

  const canWriteCatalog = hasPermission('catalog:write');
  const canWriteEditions = hasPermission('editions:write');
  const [editingSeriesProduct, setEditingSeriesProduct] = useState<NumberedProduct | null>(null);

  // Firestore hooks (use state from above)
  const {
    artworks: catalog,
    loading: artworksLoading,
    error: artworksError,
    createArtwork,
    updateArtwork,
    deleteArtwork,
    archiveArtwork,
  } = useArtworks({ status: 'all' });

  const {
    series: numberedProducts,
    loading: editionsLoading,
    error: editionsError,
    createSeries,
    updateSeries,
    archiveSeries,
    deleteSeries,
    createEdition,
    updateEdition,
    archiveEdition,
    deleteEdition,
    syncEditions,
  } = useNumberedEditions();


  // State for Bulk Upload
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);

  const allExistingNames = useMemo(() => {
    return [
      ...catalog.map(p => p.nombre?.toLowerCase() || '').filter(n => n),
      ...numberedProducts.flatMap(np => np.editions?.map(e => e.name?.toLowerCase() || '').filter(n => n) || []),
    ];
  }, [catalog, numberedProducts]);

  const allExistingSkus = useMemo(() => {
    return [
      ...catalog.map(p => p.sku?.toUpperCase() || '').filter(s => s),
      ...numberedProducts.flatMap(np => np.editions?.map(e => e.sku?.toUpperCase() || '').filter(s => s) || []),
    ];
  }, [catalog, numberedProducts]);

  const numberedEditionsSkus = useMemo(() => {
    return numberedProducts.map(np => np.sku?.toUpperCase() || '').filter(s => s);
  }, [numberedProducts]);

  // Computed values
  const filteredCatalog = useMemo(() => {
    let filtered: typeof catalog;

    if (searchTerm) {
      // When searching, search ALL items (active + archived + sold)
      filtered = catalog.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      // No search: apply archive/sold filter
      filtered = catalog.filter(product => {
        if (!showArchived) {
          return product.status !== 'archived' && !product.vendido;
        }
        return product.vendido === true;
      });
    }

    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    return filtered;
  }, [catalog, searchTerm, selectedCategory, showArchived]);


  // ============= Event Handlers =============

  // Catalog handlers
  const handleAddProduct = async (newProduct: NewProduct) => {
    try {
      await createArtwork(newProduct);
      setIsFormModalOpen(false);
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error al agregar la obra. Por favor intenta de nuevo.');
    }
  };

  const handleEditProduct = async (updatedProduct: Product) => {
    try {
      await updateArtwork(updatedProduct.id.toString(), updatedProduct);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Error al actualizar la obra. Por favor intenta de nuevo.');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      await deleteArtwork(id.toString());
      setViewingProduct(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error al eliminar la obra. Por favor intenta de nuevo.');
    }
  };

  const handleArchiveProduct = async (id: number) => {
    try {
      await archiveArtwork(id.toString());
    } catch (error) {
      console.error('Error archiving product:', error);
      alert('Error al archivar la obra. Por favor intenta de nuevo.');
    }
  };

  const handleSaveSettings = (settings: ShippingSettings) => {
    setShippingSettings(settings);
  };

  // Numbered Products handlers
  const handleAddNumberedProduct = async (data: NewNumberedProductData) => {
    try {
      await createSeries(data);
      setIsAddNumberedProductModalOpen(false);
    } catch (error) {
      console.error('Error adding series:', error);
      alert('Error al agregar la serie. Por favor intenta de nuevo.');
    }
  };

  const handleSaveEdition = async (productId: string, edition: Edition) => {
    try {
      console.log('💾 [APP] handleSaveEdition called with:', { productId, edition });

      // Check if it's a new edition (no existing id in Firestore) or an update
      const existingSeries = numberedProducts.find(np => np.id === productId);
      if (!existingSeries) {
        throw new Error('Series not found');
      }
      console.log('💾 [APP] Found series:', existingSeries.seriesName);

      const existingEdition = existingSeries.editions.find(e => e.id === edition.id);

      if (existingEdition) {
        // Update existing edition
        console.log('💾 [APP] Updating existing edition:', edition.id);
        await updateEdition(productId, edition.id, edition);
        console.log('✅ [APP] Edition updated successfully!');
      } else {
        // Create new edition
        console.log('💾 [APP] Creating new edition');
        const { id, status, createdAt, ...editionData } = edition;
        await createEdition(productId, editionData);
        console.log('✅ [APP] Edition created successfully!');
      }
    } catch (error) {
      console.error('❌ [APP] Error saving edition:', error);
      alert('Error al guardar la edición. Por favor intenta de nuevo.');
    }
  };

  const handleArchiveEdition = async (productId: string, editionId: string) => {
    try {
      await archiveEdition(productId, editionId);
    } catch (error) {
      console.error('Error archiving edition:', error);
      alert('Error al archivar la edición. Por favor intenta de nuevo.');
    }
  };

  const handleDeleteEdition = async (productId: string, editionId: string) => {
    try {
      await deleteEdition(productId, editionId);
    } catch (error) {
      console.error('Error deleting edition:', error);
      alert('Error al eliminar la edición. Por favor intenta de nuevo.');
    }
  };

  const handleArchiveSeries = async (productId: string) => {
    try {
      await archiveSeries(productId);
    } catch (error) {
      console.error('Error archiving series:', error);
      alert('Error al archivar la serie. Por favor intenta de nuevo.');
    }
  };

  const handleDeleteSeries = async (productId: string) => {
    try {
      await deleteSeries(productId);
    } catch (error) {
      console.error('Error deleting series:', error);
      alert('Error al eliminar la serie. Por favor intenta de nuevo.');
    }
  };

  const handleEditSeries = async (productId: string, updates: Partial<NumberedProduct>) => {
    try {
      await updateSeries(productId, updates);

      // Sync editions: create missing, remove excess, fix duplicates
      if (updates.totalEditions) {
        await syncEditions(productId, updates.totalEditions);
      }

      setEditingSeriesProduct(null);
    } catch (error) {
      console.error('Error updating series:', error);
      alert('Error al actualizar la serie. Por favor intenta de nuevo.');
    }
  };


  const handleBulkUpload = async (products: NewProduct[]) => {
    try {
      // Create all products in parallel
      await Promise.all(products.map(p => createArtwork(p)));
      setIsBulkUploadModalOpen(false);
    } catch (error) {
      console.error('Error bulk uploading products:', error);
      alert('Error al subir las obras. Por favor intenta de nuevo.');
    }
  };

  // ============= Early Returns (After ALL hooks) =============

  if (authLoading || artworksLoading || editionsLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black font-serif text-gray-900 tracking-wider mb-2">
              IVAN GUADERRAMA
            </h1>
            <p className="text-sm text-gray-500 tracking-widest">ART GALLERY</p>
          </div>
          <LoginForm />
        </div>
      </div>
    );
  }

  // Authenticated but no roles assigned
  if (roles.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
            <h2 className="text-xl font-bold text-yellow-900 mb-3">Sin acceso</h2>
            <p className="text-yellow-800 mb-2">
              Tu cuenta aún no tiene un rol asignado.
            </p>
            <p className="text-yellow-700 text-sm mb-6">
              Contacta al administrador para que te asigne un rol y puedas acceder al sistema.
            </p>
            <LogoutButton />
          </div>
        </div>
      </div>
    );
  }

  // Show error if Firestore connection fails
  if (artworksError || editionsError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Error de conexión</h2>
            <p className="text-red-700 mb-4">
              No se pudo conectar con la base de datos. Por favor verifica tu conexión e intenta de nuevo.
            </p>
            {artworksError && <p className="text-sm text-red-600 mb-2">Catálogo: {artworksError}</p>}
            {editionsError && <p className="text-sm text-red-600 mb-2">Ediciones: {editionsError}</p>}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors mt-4"
            >
              Reintentar
            </button>
          </div>
          <LogoutButton />
        </div>
      </div>
    );
  }

  // ============= Main App UI =============

  return (
    <div className="min-h-screen bg-white p-8">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-black font-serif text-gray-900 tracking-wider">
            IVAN GUADERRAMA
          </h1>
          <p className="text-sm text-gray-500 tracking-widest">ART GALLERY MANAGEMENT</p>
        </div>
        <div className="flex items-center gap-3">
          <UserBadge />
          {hasPermission('users:manage') && (
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              aria-label="Settings"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          )}
          <LogoutButton />
        </div>
      </header>

      {/* Tabs - Permission-based */}
      <nav className="flex space-x-2 mb-8 border-b border-gray-200 overflow-x-auto" aria-label="Tabs">
        {visibleTabs.map(tab => (
          <TabButton
            key={tab.name}
            label={tab.label}
            isActive={activeTab === tab.name}
            onClick={() => setActiveTab(tab.name)}
          />
        ))}
      </nav>

      {/* Catalog Tab */}
      {activeTab === 'catalog' && (
        <>
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar por nombre o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <SearchIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ProductCategory | 'ALL')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="ALL">Todas las categorías</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showArchived
                  ? 'bg-gray-900 text-white'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ArchiveBoxIcon className="w-5 h-5" />
              <span className="hidden sm:inline">
                {showArchived ? 'Ocultar archivados' : 'Ver archivados'}
              </span>
            </button>

            {canWriteCatalog && (
              <button
                onClick={() => setIsBulkUploadModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <UploadIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Bulk Upload</span>
              </button>
            )}

            {canWriteCatalog && (
              <button
                onClick={() => setIsFormModalOpen(true)}
                className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Agregar Obra</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCatalog.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={(p) => setEditingProduct(p)}
                onViewDetails={(p) => setViewingProduct(p)}
                canEdit={canWriteCatalog}
              />
            ))}
          </div>
        </>
      )}

      {/* Numbered Editions Tab */}
      {activeTab === 'seriadas' && (
        <NumberedEditionsManager
          products={numberedProducts}
          onAddProduct={() => setIsAddNumberedProductModalOpen(true)}
          onEditSeries={(product) => setEditingSeriesProduct(product)}
          onUpdateSeriesImage={async (productId: string, imageUrl: string) => {
            await updateSeries(productId, { imageUrl });
          }}
          onArchiveSeries={handleArchiveSeries}
          onDeleteSeries={handleDeleteSeries}
          onSaveEdition={handleSaveEdition}
          onArchiveEdition={handleArchiveEdition}
          onDeleteEdition={handleDeleteEdition}
          existingSkus={allExistingSkus}
          existingNames={allExistingNames}
          canEditSeries={canWriteEditions}
        />
      )}

      
      {/* Courses Tab */}
      {activeTab === 'courses' && <CoursesManager />}

      {/* Relationships Tab */}
      {activeTab === 'relationships' && (
        <RelationshipsManager
          availableArtworks={catalog.map(p => ({
            id: p.id.toString(),
            nombre: p.nombre,
            sku: p.sku,
            category: p.category || 'ORIGINAL',
            imageUrl: p.imagenUrl
          }))}
        />
      )}

      {/* Simulator Tab - LAZY LOADED */}
      {activeTab === 'simulator' && (
        <Suspense fallback={
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
              <p className="text-gray-600">Cargando simulador...</p>
            </div>
          </div>
        }>
          <ArtworkSimulator />
        </Suspense>
      )}

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentSettings={shippingSettings}
        onSave={handleSaveSettings}
      />

      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleAddProduct}
        existingSkus={allExistingSkus}
        shippingSettings={shippingSettings}
      />

      {editingProduct && (
        <ProductFormModal
          isOpen={true}
          onClose={() => setEditingProduct(null)}
          onSave={handleEditProduct}
          product={editingProduct}
          existingSkus={allExistingSkus}
          shippingSettings={shippingSettings}
        />
      )}

      {viewingProduct && (
        <ProductDetailModal
          product={viewingProduct}
          onClose={() => setViewingProduct(null)}
          onEdit={(p) => {
            setEditingProduct(p);
            setViewingProduct(null);
          }}
          onDelete={handleDeleteProduct}
          onArchive={handleArchiveProduct}
          shippingSettings={shippingSettings}
        />
      )}

      <AddNumberedProductModal
        isOpen={isAddNumberedProductModalOpen}
        onClose={() => setIsAddNumberedProductModalOpen(false)}
        onSave={handleAddNumberedProduct}
        existingSkus={numberedEditionsSkus}
      />

      {editingSeriesProduct && (
        <EditSeriesModal
          product={editingSeriesProduct}
          onClose={() => setEditingSeriesProduct(null)}
          onSave={(updates) => handleEditSeries(editingSeriesProduct.id, updates)}
        />
      )}



      <BulkUploadModal
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        onUpload={handleBulkUpload}
        existingSkus={allExistingSkus}
      />
    </div>
  );
};

export default App;
