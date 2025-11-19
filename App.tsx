
import React, { useState, useMemo, lazy, Suspense } from 'react';
import type { Product, NewProduct, ProductCategory, ShippingSettings } from '@/features/artwork-management/types';
import type { NumberedProduct, Edition, NewNumberedProductData } from '@/features/numbered-editions/types';
import type { MiniWork, NewMiniWork } from '@/features/mini-works/types';
import { CATEGORIES } from '@/features/artwork-management/types';
import { initialCatalog, initialShippingSettings, initialNumberedProducts, initialMiniWorks } from '@/shared/constants/data';
import { ProductCard, ProductDetailModal, ProductFormModal } from '@/features/artwork-management/components';
import { SettingsModal, BulkUploadModal, SearchIcon, SettingsIcon, PlusIcon, UploadIcon, ArchiveBoxIcon, XIcon } from '@/shared/components';
import { NumberedEditionsManager, AddNumberedProductModal, EditSeriesModal } from '@/features/numbered-editions/components';
import { MiniWorksManager, AddMiniWorkModal } from '@/features/mini-works/components';
import { useAuth } from '@/features/auth/context/AuthContext';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { LogoutButton } from '@/features/auth/components/LogoutButton';
import { UserBadge } from '@/features/auth/components/UserBadge';

// 🔧 LAZY LOAD problematic components (AI features with external deps)
const GenerateNameModal = lazy(() => import('@/features/ai-naming/components/GenerateNameModal'));
const ArtworkSimulator = lazy(() => import('@/features/artwork-simulator/components/ArtworkSimulator'));

type ActiveTab = 'catalog' | 'seriadas' | 'miniWorks' | 'simulator';

const App: React.FC = () => {
  // ALL HOOKS MUST BE AT THE TOP (React Rules of Hooks)
  const { user, loading } = useAuth();
  const [catalog, setCatalog] = useState<Product[]>(initialCatalog);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'ALL'>('ALL');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(initialShippingSettings);
  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog');
  const [showArchived, setShowArchived] = useState(false);

  // State for Numbered Editions
  const [numberedProducts, setNumberedProducts] = useState<NumberedProduct[]>(initialNumberedProducts);
  const [isAddNumberedProductModalOpen, setIsAddNumberedProductModalOpen] = useState(false);
  const [editingSeriesProduct, setEditingSeriesProduct] = useState<NumberedProduct | null>(null);

  // State for Mini Works
  const [miniWorks, setMiniWorks] = useState<MiniWork[]>(initialMiniWorks);
  const [isAddMiniWorkModalOpen, setIsAddMiniWorkModalOpen] = useState(false);
  const [isGenerateNameModalOpen, setIsGenerateNameModalOpen] = useState(false);
  const [editingMiniWork, setEditingMiniWork] = useState<MiniWork | null>(null);
  const [showArchivedMiniWorks, setShowArchivedMiniWorks] = useState(false);

  // State for Bulk Upload
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);

  const allExistingNames = useMemo(() => {
    return [
      ...catalog.map(p => p.name?.toLowerCase() || '').filter(n => n),
      ...numberedProducts.flatMap(np => np.editions?.map(e => e.name?.toLowerCase() || '').filter(n => n) || []),
      ...miniWorks.map(mw => mw.name?.toLowerCase() || '').filter(n => n)
    ];
  }, [catalog, numberedProducts, miniWorks]);

  const allExistingSkus = useMemo(() => {
    return [
      ...catalog.map(p => p.sku?.toUpperCase() || '').filter(s => s),
      ...numberedProducts.flatMap(np => np.editions?.map(e => e.sku?.toUpperCase() || '').filter(s => s) || []),
      ...miniWorks.map(mw => mw.sku?.toUpperCase() || '').filter(s => s)
    ];
  }, [catalog, numberedProducts, miniWorks]);

  // Computed values
  const filteredCatalog = useMemo(() => {
    let filtered = catalog.filter(product =>
      (!showArchived ? product.status !== 'archived' : true)
    );

    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [catalog, searchTerm, selectedCategory, showArchived]);

  const filteredMiniWorks = useMemo(() => {
    return miniWorks.filter(work =>
      (!showArchivedMiniWorks ? work.status !== 'archived' : true)
    );
  }, [miniWorks, showArchivedMiniWorks]);

  // ============= Event Handlers =============

  // Catalog handlers
  const handleAddProduct = (newProduct: NewProduct) => {
    const product: Product = {
      id: Date.now(),
      ...newProduct,
      stock: newProduct.stock || 0,
      images: newProduct.images || [],
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    setCatalog([...catalog, product]);
    setIsFormModalOpen(false);
  };

  const handleEditProduct = (updatedProduct: Product) => {
    setCatalog(catalog.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id: number) => {
    setCatalog(catalog.filter(p => p.id !== id));
    setViewingProduct(null);
  };

  const handleArchiveProduct = (id: number) => {
    setCatalog(catalog.map(p =>
      p.id === id ? { ...p, status: p.status === 'archived' ? 'active' : 'archived' as Product['status'] } : p
    ));
  };

  const handleSaveSettings = (settings: ShippingSettings) => {
    setShippingSettings(settings);
  };

  // Numbered Products handlers
  const handleAddNumberedProduct = (data: NewNumberedProductData) => {
    const newProduct: NumberedProduct = {
      id: Date.now(),
      ...data,
      editions: [],
      seriesStatus: 'active',
      createdAt: new Date().toISOString()
    };
    setNumberedProducts([...numberedProducts, newProduct]);
    setIsAddNumberedProductModalOpen(false);
  };

  const handleSaveEdition = (productId: number, edition: Edition) => {
    setNumberedProducts(numberedProducts.map(np => {
      if (np.id === productId) {
        const existingIndex = np.editions.findIndex(e => e.id === edition.id);
        if (existingIndex >= 0) {
          return {
            ...np,
            editions: np.editions.map(e => e.id === edition.id ? edition : e)
          };
        } else {
          return {
            ...np,
            editions: [...np.editions, edition]
          };
        }
      }
      return np;
    }));
  };

  const handleArchiveEdition = (productId: number, editionId: number) => {
    setNumberedProducts(numberedProducts.map(np => {
      if (np.id === productId) {
        return {
          ...np,
          editions: np.editions.map(e =>
            e.id === editionId
              ? { ...e, status: e.status === 'archived' ? 'active' : 'archived' as Edition['status'] }
              : e
          )
        };
      }
      return np;
    }));
  };

  const handleDeleteEdition = (productId: number, editionId: number) => {
    setNumberedProducts(numberedProducts.map(np => {
      if (np.id === productId) {
        return {
          ...np,
          editions: np.editions.filter(e => e.id !== editionId)
        };
      }
      return np;
    }));
  };

  const handleArchiveSeries = (productId: number) => {
    setNumberedProducts(numberedProducts.map(np =>
      np.id === productId
        ? { ...np, seriesStatus: np.seriesStatus === 'archived' ? 'active' : 'archived' as NumberedProduct['seriesStatus'] }
        : np
    ));
  };

  const handleDeleteSeries = (productId: number) => {
    setNumberedProducts(numberedProducts.filter(np => np.id !== productId));
  };

  const handleEditSeries = (productId: number, updates: { seriesName: string; category: ProductCategory; description: string; basePrice: number }) => {
    setNumberedProducts(numberedProducts.map(np =>
      np.id === productId ? { ...np, ...updates } : np
    ));
    setEditingSeriesProduct(null);
  };

  // Mini Works handlers
  const handleAddMiniWork = (newWork: NewMiniWork) => {
    const work: MiniWork = {
      id: Date.now(),
      ...newWork,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    setMiniWorks([...miniWorks, work]);
    setIsAddMiniWorkModalOpen(false);
  };

  const handleEditMiniWork = (updatedWork: MiniWork) => {
    setMiniWorks(miniWorks.map(w => w.id === updatedWork.id ? updatedWork : w));
    setEditingMiniWork(null);
  };

  const handleDeleteMiniWork = (id: number) => {
    setMiniWorks(miniWorks.filter(w => w.id !== id));
  };

  const handleArchiveMiniWork = (id: number) => {
    setMiniWorks(miniWorks.map(w =>
      w.id === id ? { ...w, status: w.status === 'archived' ? 'active' : 'archived' as MiniWork['status'] } : w
    ));
  };

  const handleBulkUpload = (products: NewProduct[]) => {
    const newProducts: Product[] = products.map(p => ({
      id: Date.now() + Math.random(),
      ...p,
      stock: p.stock || 0,
      images: p.images || [],
      status: 'active',
      createdAt: new Date().toISOString(),
    }));
    setCatalog([...catalog, ...newProducts]);
    setIsBulkUploadModalOpen(false);
  };

  // ============= Early Returns (After ALL hooks) =============

  if (loading) {
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
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            aria-label="Settings"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
          <LogoutButton />
        </div>
      </header>

      {/* Tabs */}
      <div className="flex space-x-2 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'catalog'
              ? 'text-gray-900 border-gray-900'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          Catálogo General
        </button>
        <button
          onClick={() => setActiveTab('seriadas')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'seriadas'
              ? 'text-gray-900 border-gray-900'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          Ediciones Numeradas
        </button>
        <button
          onClick={() => setActiveTab('miniWorks')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'miniWorks'
              ? 'text-gray-900 border-gray-900'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          Mini Obras
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'simulator'
              ? 'text-gray-900 border-gray-900'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          Simulador
        </button>
      </div>

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

            <button
              onClick={() => setIsBulkUploadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <UploadIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Bulk Upload</span>
            </button>

            <button
              onClick={() => setIsFormModalOpen(true)}
              className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Agregar Obra</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCatalog.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                shippingSettings={shippingSettings}
                onView={(p) => setViewingProduct(p)}
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
          onArchiveSeries={handleArchiveSeries}
          onDeleteSeries={handleDeleteSeries}
          onSaveEdition={handleSaveEdition}
          onArchiveEdition={handleArchiveEdition}
          onDeleteEdition={handleDeleteEdition}
          existingSkus={allExistingSkus}
          existingNames={allExistingNames}
        />
      )}

      {/* Mini Works Tab */}
      {activeTab === 'miniWorks' && (
        <MiniWorksManager
          works={filteredMiniWorks}
          showArchived={showArchivedMiniWorks}
          onToggleArchived={() => setShowArchivedMiniWorks(!showArchivedMiniWorks)}
          onAdd={() => setIsAddMiniWorkModalOpen(true)}
          onGenerateName={() => setIsGenerateNameModalOpen(true)}
          onEdit={setEditingMiniWork}
          onArchive={handleArchiveMiniWork}
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
        settings={shippingSettings}
        onSave={handleSaveSettings}
      />

      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleAddProduct}
        existingSkus={allExistingSkus}
      />

      {editingProduct && (
        <ProductFormModal
          isOpen={true}
          onClose={() => setEditingProduct(null)}
          onSave={handleEditProduct}
          product={editingProduct}
          existingSkus={allExistingSkus}
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
      />

      {editingSeriesProduct && (
        <EditSeriesModal
          product={editingSeriesProduct}
          onClose={() => setEditingSeriesProduct(null)}
          onSave={(updates) => handleEditSeries(editingSeriesProduct.id, updates)}
        />
      )}

      <AddMiniWorkModal
        isOpen={isAddMiniWorkModalOpen}
        onClose={() => setIsAddMiniWorkModalOpen(false)}
        onSave={handleAddMiniWork}
        existingSkus={allExistingSkus}
      />

      {editingMiniWork && (
        <AddMiniWorkModal
          isOpen={true}
          onClose={() => setEditingMiniWork(null)}
          onSave={handleEditMiniWork}
          work={editingMiniWork}
          existingSkus={allExistingSkus}
        />
      )}

      {/* GenerateNameModal - LAZY LOADED */}
      {isGenerateNameModalOpen && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          </div>
        }>
          <GenerateNameModal
            isOpen={isGenerateNameModalOpen}
            onClose={() => setIsGenerateNameModalOpen(false)}
            onSave={handleAddMiniWork}
            existingSkus={allExistingSkus}
            existingNames={allExistingNames}
          />
        </Suspense>
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
