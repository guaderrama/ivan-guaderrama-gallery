
import React, { useState, useMemo } from 'react';
import { Product, NewProduct, ProductCategory, ShippingSettings, NumberedProduct, Edition, NewNumberedProductData, MiniWork, NewMiniWork } from './types';
import { initialCatalog, CATEGORIES, initialShippingSettings, initialNumberedProducts, initialMiniWorks } from './constants';
import ProductCard from './components/ProductCard';
import ProductDetailModal from './components/ProductDetailModal';
import SettingsModal from './components/SettingsModal';
import ProductFormModal from './components/ProductFormModal';
import { SearchIcon, SettingsIcon, PlusIcon, UploadIcon, ArchiveBoxIcon, XIcon } from './components/Icons';
import NumberedEditionsManager from './components/NumberedEditionsManager';
import AddNumberedProductModal from './components/AddNumberedProductModal';
import BulkUploadModal from './components/BulkUploadModal';
import EditSeriesModal from './components/EditSeriesModal';
import MiniWorksManager from './components/MiniWorksManager';
import AddMiniWorkModal from './components/AddMiniWorkModal';
import GenerateNameModal from './components/GenerateNameModal';
import ArtworkSimulator from './components/ArtworkSimulator';

type ActiveTab = 'catalog' | 'seriadas' | 'miniWorks' | 'simulator';

const App: React.FC = () => {
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
    const catalogNames = catalog.map(p => p.nombre);
    const miniWorkNames = miniWorks.map(w => w.name);
    return [...catalogNames, ...miniWorkNames];
  }, [catalog, miniWorks]);

  const handleAddProduct = (newProductData: NewProduct) => {
    const productToAdd: Product = {
      id: Date.now(),
      ...newProductData,
    };
    setCatalog((prevCatalog) => [productToAdd, ...prevCatalog]);
    setIsFormModalOpen(false);
  };
  
  const handleSelectProductToEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormModalOpen(true);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setCatalog(catalog => catalog.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    setEditingProduct(null);
    setIsFormModalOpen(false);
  };
  
  const handleCancelEdit = () => {
    setEditingProduct(null);
    setIsFormModalOpen(false);
  };

  const handleViewDetails = (product: Product) => {
    setViewingProduct(product);
  };

  const handleCloseDetailsModal = () => {
    setViewingProduct(null);
  };
  
  const handleSaveSettings = (newSettings: ShippingSettings) => {
    setShippingSettings(newSettings);
  };
  
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsFormModalOpen(true);
  }

  // Handlers for Numbered Editions
  const handleUpdateEdition = (updatedEdition: Edition, productSku: string) => {
    setNumberedProducts(prevProducts =>
      prevProducts.map(p => {
        if (p.sku === productSku) {
          return {
            ...p,
            editions: p.editions.map(e =>
              e.id === updatedEdition.id ? updatedEdition : e
            ),
          };
        }
        return p;
      })
    );
  };

  const handleAddNumberedProduct = (data: NewNumberedProductData) => {
    if (numberedProducts.some(p => p.sku === data.sku)) {
        alert("A numbered product with this SKU already exists.");
        return;
    }

    const newEditions: Edition[] = Array.from({ length: data.totalEditions }, (_, i) => ({
      id: `${data.sku}-${i + 1}`,
      editionNumber: i + 1,
      comments: "",
      exhibitionLocation: "Warehouse",
      gallerySeller: "",
      clientName: "",
      salesInvoice: ""
    }));

    const newNumberedProduct: NumberedProduct = {
      sku: data.sku,
      name: data.name,
      imageUrl: data.imageUrl,
      totalEditions: data.totalEditions,
      editions: newEditions,
    };

    setNumberedProducts(prev => [newNumberedProduct, ...prev]);
    setIsAddNumberedProductModalOpen(false);
  };

  const handleSelectSeriesToEdit = (product: NumberedProduct) => {
    setEditingSeriesProduct(product);
  };

  const handleCancelEditSeries = () => {
    setEditingSeriesProduct(null);
  };
  
  const handleUpdateNumberedProductSeries = (sku: string, newTotalEditions: number) => {
      setNumberedProducts(prevProducts =>
          prevProducts.map(p => {
              if (p.sku === sku) {
                  if (newTotalEditions < p.editions.length) {
                      // This validation is also in the modal, but good to have it here as a safeguard
                      alert("El nuevo total no puede ser menor que el número de ediciones existentes.");
                      return p;
                  }

                  const currentEditionCount = p.editions.length;
                  const newEditions: Edition[] = [...p.editions];

                  for (let i = currentEditionCount + 1; i <= newTotalEditions; i++) {
                      newEditions.push({
                          id: `${sku}-${i}`,
                          editionNumber: i,
                          comments: "",
                          exhibitionLocation: "Warehouse",
                          gallerySeller: "",
                          clientName: "",
                          salesInvoice: ""
                      });
                  }

                  return {
                      ...p,
                      totalEditions: newTotalEditions,
                      editions: newEditions
                  };
              }
              return p;
          })
      );
      setEditingSeriesProduct(null);
  };

  const handleUpdateNumberedProductImage = (sku: string, newImageUrl: string) => {
    setNumberedProducts(prevProducts =>
      prevProducts.map(p =>
        p.sku === sku ? { ...p, imageUrl: newImageUrl } : p
      )
    );
  };
  
  // Handler for Mini Works
  const handleAddMiniWork = (newMiniWorkData: NewMiniWork) => {
    const workToAdd: MiniWork = {
      id: Date.now(),
      ...newMiniWorkData,
      archived: false,
    };
    setMiniWorks((prev) => [...prev, workToAdd].sort((a,b) => a.name.localeCompare(b.name)));
    setIsAddMiniWorkModalOpen(false);
  };

  const handleSelectMiniWorkToEdit = (work: MiniWork) => {
    setEditingMiniWork(work);
    setIsAddMiniWorkModalOpen(true);
  };

  const handleUpdateMiniWork = (updatedWork: MiniWork) => {
    setMiniWorks(prev =>
      prev
        .map(w => (w.id === updatedWork.id ? updatedWork : w))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
    setEditingMiniWork(null);
    setIsAddMiniWorkModalOpen(false);
  };
  
  const handleCancelEditMiniWork = () => {
    setEditingMiniWork(null);
    setIsAddMiniWorkModalOpen(false);
  };
  
  const handleArchiveMiniWork = (workId: number) => {
    setMiniWorks(prevWorks =>
      prevWorks.map(w =>
        w.id === workId ? { ...w, archived: !w.archived } : w
      )
    );
  };

  const handleSaveGeneratedWork = (work: NewMiniWork) => {
    handleAddMiniWork(work);
    setIsGenerateNameModalOpen(false);
  };

  // Handlers for Bulk Upload
  const handleCatalogBulkUpload = (data: Record<string, string>[]) => {
      setCatalog(prevCatalog => {
          const newCatalog = [...prevCatalog];
          const updatedSkus = new Set<string>();

          // FIX: Using Object.assign instead of object spread syntax to help TypeScript
          // correctly infer the type of processedData items. The spread syntax was causing
          // TS to lose track of properties from `item`, leading to errors.
          const processedData = data.map(item => Object.assign({}, item, {
              precioUSD: parseFloat(item.precioUSD) || 0,
              peso: parseFloat(item.peso) || 0,
              interactiva: item.interactiva?.toLowerCase() === 'true',
              costoEnvioUSA: parseFloat(item.costoEnvioUSA) || 0,
              costoEnvioCanada: parseFloat(item.costoEnvioCanada) || 0,
              category: CATEGORIES.includes(item.category as ProductCategory) ? item.category as ProductCategory : 'ORIGINAL'
          }));

          processedData.forEach(item => {
              if (!item.sku) return;
              const index = newCatalog.findIndex(p => p.sku === item.sku);
              if (index !== -1) {
                  newCatalog[index] = { ...newCatalog[index], ...item };
                  updatedSkus.add(item.sku);
              }
          });

          processedData.forEach(item => {
              if (item.sku && !prevCatalog.some(p => p.sku === item.sku)) {
                   const newProduct: Product = {
                      id: Date.now() + Math.random(),
                      nombre: item.nombre || 'N/A',
                      descripcion: item.descripcion || '',
                      detalles: item.detalles || '',
                      precioUSD: item.precioUSD,
                      medidas: item.medidas || '',
                      peso: item.peso,
                      sku: item.sku,
                      imagenUrl: item.imagenUrl || '',
                      interactiva: item.interactiva,
                      medidasCaja: item.medidasCaja || '',
                      costoEnvioUSA: item.costoEnvioUSA,
                      costoEnvioCanada: item.costoEnvioCanada,
                      category: item.category,
                  };
                  newCatalog.push(newProduct);
              }
          });
          return newCatalog.sort((a, b) => b.id - a.id);
      });
  };

  const handleNumberedEditionsBulkUpload = (data: Record<string, string>[]) => {
      setNumberedProducts(prevProducts => {
          const newProducts = JSON.parse(JSON.stringify(prevProducts));
          data.forEach(item => {
              const editionNumber = parseInt(item.edition_number, 10);
              if (!item.product_sku || isNaN(editionNumber)) return;

              const product = newProducts.find((p: NumberedProduct) => p.sku === item.product_sku);
              if (product) {
                  const edition = product.editions.find((e: Edition) => e.editionNumber === editionNumber);
                  if (edition) {
                      edition.comments = item.comments ?? edition.comments;
                      edition.exhibitionLocation = item.exhibitionLocation ?? edition.exhibitionLocation;
                      edition.gallerySeller = item.gallerySeller ?? edition.gallerySeller;
                      edition.clientName = item.clientName ?? edition.clientName;
                      edition.salesInvoice = item.salesInvoice ?? edition.salesInvoice;
                  }
              }
          });
          return newProducts;
      });
  };

  const filteredCatalog = useMemo(() => {
    return catalog
      .filter((p) => p.vendido === showArchived) // Filter by archived status
      .filter((p) => {
        const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              p.sku.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => b.id - a.id);
  }, [catalog, searchTerm, selectedCategory, showArchived]);
  
  const filteredMiniWorks = useMemo(() => {
    return miniWorks.filter(w => (w.archived || false) === showArchivedMiniWorks);
  }, [miniWorks, showArchivedMiniWorks]);

  const TabButton: React.FC<{ tabName: ActiveTab; label: string }> = ({ tabName, label }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`relative whitespace-nowrap py-4 px-2 text-sm font-medium transition-colors focus:outline-none ${
        activeTab === tabName
          ? 'text-gray-900'
          : 'text-gray-500 hover:text-gray-800'
      }`}
    >
      {label}
      {activeTab === tabName && (
        <span className="absolute inset-x-0 bottom-0 h-1 bg-red-500 rounded-full"></span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-black font-serif text-gray-900 tracking-wider">
              IVAN GUADERRAMA
            </h1>
            <p className="text-sm text-gray-500 tracking-widest">ART GALLERY</p>
          </div>
          <div className="flex items-center gap-2">
             <button
                onClick={() => setIsBulkUploadModalOpen(true)}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="Carga masiva"
              >
                <UploadIcon className="h-6 w-6" />
              </button>
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="Ajustes de envío"
              >
                <SettingsIcon className="h-6 w-6" />
              </button>
          </div>
        </header>

        <div className="mb-8 border-b border-gray-200">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                <TabButton tabName="catalog" label="Catálogo de Productos" />
                <TabButton tabName="seriadas" label="Obras Seriadas" />
                <TabButton tabName="miniWorks" label="Nombre Obras Mini" />
                <TabButton tabName="simulator" label="Simulador de Obras" />
            </nav>
        </div>

        {activeTab === 'catalog' && (
            <main>
                <div className="p-1">
                    <h2 className="text-2xl font-bold font-serif text-gray-800 mb-6">
                        {showArchived ? 'Archivo de Productos Vendidos' : 'Catálogo de Productos Activos'}
                    </h2>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
                      <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar por nombre o SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none text-sm placeholder:text-gray-500"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                          <button
                              onClick={() => setSelectedCategory('ALL')}
                              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors duration-200 ${
                              selectedCategory === 'ALL'
                                  ? 'bg-gray-900 text-white'
                                  : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                              }`}
                          >
                              Todos
                          </button>
                          {CATEGORIES.map(cat => (
                              <button
                              key={cat}
                              onClick={() => setSelectedCategory(cat)}
                              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors duration-200 ${
                              selectedCategory === cat
                                  ? 'bg-gray-900 text-white'
                                  : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                              }`}
                              >
                              {cat}
                              </button>
                          ))}
                      </div>
                    </div>

                    {filteredCatalog.length > 0 ? (
                    <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                        {filteredCatalog.map((product) => (
                        <ProductCard 
                            key={product.id} 
                            product={product} 
                            onEdit={handleSelectProductToEdit}
                            onViewDetails={handleViewDetails}
                        />
                        ))}
                    </div>
                    ) : (
                    <div className="text-center py-16 text-gray-500">
                        <p className="text-lg">{
                            showArchived 
                            ? "No hay productos en el archivo." 
                            : "No se encontraron productos. Intenta una búsqueda diferente o agrega un nuevo producto."
                        }</p>
                    </div>
                    )}
                </div>
            </main>
        )}

        {activeTab === 'seriadas' && (
            <main>
                <NumberedEditionsManager 
                    products={numberedProducts}
                    onUpdateEdition={handleUpdateEdition}
                    onSelectSeriesToEdit={handleSelectSeriesToEdit}
                    onUpdateProductImage={handleUpdateNumberedProductImage}
                />
            </main>
        )}
        
        {activeTab === 'miniWorks' && (
            <main>
                <MiniWorksManager 
                    works={filteredMiniWorks}
                    onOpenGenerateNameModal={() => setIsGenerateNameModalOpen(true)}
                    onEdit={handleSelectMiniWorkToEdit}
                    onArchive={handleArchiveMiniWork}
                    isArchivedView={showArchivedMiniWorks}
                />
            </main>
        )}

        {activeTab === 'simulator' && (
            <main>
                <ArtworkSimulator />
            </main>
        )}

      </div>

      {viewingProduct && (
        <ProductDetailModal 
          product={viewingProduct}
          onClose={handleCloseDetailsModal}
        />
      )}

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={handleSaveSettings}
        currentSettings={shippingSettings}
      />
      
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={handleCancelEdit}
        onAddProduct={handleAddProduct}
        editingProduct={editingProduct}
        onUpdateProduct={handleUpdateProduct}
        shippingSettings={shippingSettings}
      />

      <AddNumberedProductModal
        isOpen={isAddNumberedProductModalOpen}
        onClose={() => setIsAddNumberedProductModalOpen(false)}
        onSave={handleAddNumberedProduct}
        existingSkus={numberedProducts.map(p => p.sku)}
      />

      <AddMiniWorkModal
        isOpen={isAddMiniWorkModalOpen}
        onClose={handleCancelEditMiniWork}
        onSave={handleAddMiniWork}
        existingSkus={miniWorks.map(w => w.sku)}
        editingWork={editingMiniWork}
        onUpdate={handleUpdateMiniWork}
      />

      {editingSeriesProduct && (
        <EditSeriesModal
            isOpen={!!editingSeriesProduct}
            onClose={handleCancelEditSeries}
            onSave={handleUpdateNumberedProductSeries}
            product={editingSeriesProduct}
        />
      )}

      <BulkUploadModal
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        onCatalogUpload={handleCatalogBulkUpload}
        onNumberedEditionsUpload={handleNumberedEditionsBulkUpload}
      />
      
      <GenerateNameModal
        isOpen={isGenerateNameModalOpen}
        onClose={() => setIsGenerateNameModalOpen(false)}
        onSave={handleSaveGeneratedWork}
        existingSkus={miniWorks.map(w => w.sku)}
        existingNames={allExistingNames}
      />

      {activeTab === 'catalog' && !showArchived && (
          <button
            onClick={handleOpenAddModal}
            className="fixed bottom-8 right-8 bg-red-500 hover:bg-red-600 text-white rounded-full p-4 shadow-lg transition-transform duration-200 ease-in-out hover:scale-110 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-red-300"
            aria-label="Agregar nuevo producto"
            >
            <PlusIcon className="h-8 w-8" />
        </button>
      )}

      {activeTab === 'catalog' && (
        <button
            onClick={() => setShowArchived(prev => !prev)}
            className="fixed bottom-8 left-8 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 ease-in-out hover:scale-110 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-zinc-400"
            aria-label={showArchived ? 'Cerrar archivo' : 'Ver productos vendidos'}
        >
            {showArchived ? <XIcon className="h-8 w-8" /> : <ArchiveBoxIcon className="h-8 w-8" />}
        </button>
      )}

      {activeTab === 'seriadas' && (
        <button
            onClick={() => setIsAddNumberedProductModalOpen(true)}
            className="fixed bottom-8 right-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg transition-transform duration-200 ease-in-out hover:scale-110 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-blue-300"
            aria-label="Agregar nueva obra seriada"
        >
            <PlusIcon className="h-8 w-8" />
        </button>
      )}
      
      {activeTab === 'miniWorks' && !showArchivedMiniWorks && (
        <button
            onClick={() => {
                setEditingMiniWork(null);
                setIsAddMiniWorkModalOpen(true);
            }}
            className="fixed bottom-8 right-8 bg-teal-500 hover:bg-teal-600 text-white rounded-full p-4 shadow-lg transition-transform duration-200 ease-in-out hover:scale-110 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-teal-300"
            aria-label="Agregar Nueva Obra Mini"
        >
            <PlusIcon className="h-8 w-8" />
        </button>
      )}

      {activeTab === 'miniWorks' && (
        <button
            onClick={() => setShowArchivedMiniWorks(prev => !prev)}
            className="fixed bottom-8 left-8 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 ease-in-out hover:scale-110 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-zinc-400"
            aria-label={showArchivedMiniWorks ? 'Cerrar archivo' : 'Ver obras archivadas'}
        >
            {showArchivedMiniWorks ? <XIcon className="h-8 w-8" /> : <ArchiveBoxIcon className="h-8 w-8" />}
        </button>
      )}

    </div>
  );
};

export default App;
