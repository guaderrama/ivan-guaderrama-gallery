
import React, { useState, useEffect } from 'react';
import { UploadIcon, SaveIcon } from './Icons';
import Loader from './Loader';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCatalogUpload: (data: Record<string, string>[]) => void;
  onNumberedEditionsUpload: (data: Record<string, string>[]) => void;
}

type ActiveTab = 'catalog' | 'seriadas';

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ isOpen, onClose, onCatalogUpload, onNumberedEditionsUpload }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setMessage(null);
      setIsLoading(false);
      setActiveTab('catalog');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(null);
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const parseCSV = (csvText: string): Record<string, string>[] => {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    // Auto-detect delimiter by checking the header line
    const headerLine = lines[0];
    const delimiter = headerLine.includes(';') ? ';' : ',';

    const headers = headerLine.split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = [];

    // This regex helps split by the delimiter, but ignores delimiters inside double quotes.
    const splitRegex = new RegExp(`${delimiter}(?=(?:[^"]*"[^"]*")*[^"]*$)`);

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      const values = line.split(splitRegex);
      
      if (values.length === headers.length) {
        const rowObject = headers.reduce((obj, header, index) => {
          let value = values[index]?.trim() || '';
          // Remove surrounding quotes, if any
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          }
          // Handle escaped quotes (e.g., "" becomes ")
          value = value.replace(/""/g, '"');
          obj[header] = value;
          return obj;
        }, {} as Record<string, string>);
        rows.push(rowObject);
      }
    }
    return rows;
  };


  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Por favor, selecciona un archivo para subir.' });
      return;
    }
    setIsLoading(true);
    setMessage(null);

    try {
      const text = await file.text();
      const data = parseCSV(text);

      if (data.length === 0) {
        throw new Error("El archivo CSV está vacío o tiene un formato incorrecto.");
      }

      if (activeTab === 'catalog') {
        onCatalogUpload(data);
      } else {
        onNumberedEditionsUpload(data);
      }
      setMessage({ type: 'success', text: `Se procesaron exitosamente ${data.length} filas.` });
      setFile(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
      setMessage({ type: 'error', text: `La carga falló: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    let headers: string;
    let filename: string;

    if (activeTab === 'catalog') {
        headers = 'sku,nombre,descripcion,detalles,precioUSD,peso,medidas,imagenUrl,interactiva,medidasCaja,costoEnvioUSA,costoEnvioCanada,category';
        filename = 'catalog_template.csv';
    } else {
        headers = 'product_sku,edition_number,comments,exhibitionLocation,gallerySeller,clientName,salesInvoice';
        filename = 'numbered_editions_template.csv';
    }

    const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleModalContentClick = (e: React.MouseEvent) => e.stopPropagation();

  const TabButton: React.FC<{ tabName: ActiveTab; label: string }> = ({ tabName, label }) => (
    <button
      type="button"
      onClick={() => { setActiveTab(tabName); setMessage(null); setFile(null); }}
      className={`flex-1 whitespace-nowrap py-3 px-1 text-center border-b-4 font-bold text-base transition-colors focus:outline-none ${
        activeTab === tabName
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 ease-out scale-95 opacity-0 animate-fade-in-scale" onClick={handleModalContentClick}>
        <div className="p-6 sm:p-8">
            <div className="flex justify-between items-start">
                <div>
                    <h2 id="bulk-upload-title" className="text-2xl sm:text-3xl font-bold font-serif text-gray-900">
                      Carga Masiva de Datos
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Sube archivos CSV para actualizar tus datos de forma masiva.</p>
                </div>
                <button type="button" onClick={onClose} className="-mt-2 -mr-2 text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            
            <div className="mt-4 border-b border-gray-200">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <TabButton tabName="catalog" label="Catálogo de Productos" />
                    <TabButton tabName="seriadas" label="Obras Seriadas" />
                </nav>
            </div>
            
            <div className="mt-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-bold text-gray-800">Instrucciones</h3>
                     <ol className="list-decimal list-inside text-sm text-gray-600 mt-1 space-y-1">
                      <li>Descarga el archivo de plantilla CSV.</li>
                      <li>Abre la plantilla con un editor de hojas de cálculo (como Microsoft Excel o Google Sheets).</li>
                      <li>Llénalo con tus datos. <strong>No cambies los encabezados de las columnas.</strong></li>
                      <li>Al terminar, guarda o exporta el archivo en formato <strong>CSV (delimitado por comas)</strong>.</li>
                      <li>Sube el archivo CSV completado aquí abajo.</li>
                    </ol>
                    <button onClick={downloadTemplate} className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 border border-transparent text-xs font-bold rounded-md text-white bg-gray-600 hover:bg-gray-700">
                        <SaveIcon className="h-4 w-4" /> Descargar Plantilla
                    </button>
                </div>

                <div className="mt-5">
                    <label htmlFor="file-upload" className="block text-sm font-bold text-gray-700 mb-1">
                        Subir Archivo CSV
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                    <span>{file ? file.name : 'Selecciona un archivo'}</span>
                                    <input id="file-upload" name="file-upload" type="file" accept=".csv" className="sr-only" onChange={handleFileChange} />
                                </label>
                                {!file && <p className="pl-1">o arrastra y suelta</p>}
                            </div>
                            <p className="text-xs text-gray-500">CSV de hasta 10MB</p>
                        </div>
                    </div>
                </div>
                 {message && (
                    <div className={`mt-4 p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {message.text}
                    </div>
                 )}
            </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
             <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-300 text-sm font-bold rounded-md text-gray-700 bg-white hover:bg-gray-50">Cancelar</button>
             <button type="button" onClick={handleUpload} disabled={!file || isLoading} className="w-32 flex justify-center items-center px-5 py-2.5 border border-transparent text-sm font-bold rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                {isLoading ? <Loader /> : 'Subir'}
            </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-scale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in-scale { animation: fade-in-scale 0.2s forwards; }
      `}</style>
    </div>
  );
};

export default BulkUploadModal;
