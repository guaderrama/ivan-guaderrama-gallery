import React, { useState, useRef } from 'react';
import { UploadIcon, XIcon } from '@/shared/components/Icons';

interface AddPDFCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (file: File, title: string, description?: string) => Promise<void>;
}

const AddPDFCourseModal: React.FC<AddPDFCourseModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<'uploading' | 'extracting' | 'generating'>('uploading');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const loadingMessages = {
    uploading: 'Subiendo PDF...',
    extracting: 'Extrayendo contenido...',
    generating: 'Generando curso con IA...',
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Solo se permiten archivos PDF.');
        return;
      }
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        setError('El archivo es muy grande. El límite es 50MB.');
        return;
      }
      setSelectedFile(file);
      setError('');
      // Auto-fill title from filename if empty
      if (!title) {
        const nameWithoutExt = file.name.replace(/\.pdf$/i, '');
        setTitle(nameWithoutExt);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('El título es obligatorio.');
      return;
    }
    if (!selectedFile) {
      setError('Debes seleccionar un archivo PDF.');
      return;
    }

    setIsLoading(true);
    setLoadingStep('uploading');

    try {
      // Simulate progress through steps
      setTimeout(() => setLoadingStep('extracting'), 2000);
      setTimeout(() => setLoadingStep('generating'), 5000);

      await onSave(selectedFile, title.trim(), description.trim() || undefined);
      handleClose();
    } catch (err) {
      setError('Error al procesar el curso. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
      setLoadingStep('uploading');
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setSelectedFile(null);
    setError('');
    onClose();
  };

  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-pdf-course-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-95 opacity-0 animate-fade-in-scale"
        onClick={handleModalContentClick}
      >
        <form onSubmit={handleSubmit}>
          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-start">
              <div>
                <h2
                  id="add-pdf-course-title"
                  className="text-2xl sm:text-3xl font-bold font-serif text-gray-900"
                >
                  Subir Curso PDF
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Sube un archivo PDF para agregar un nuevo curso.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="-mt-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Cerrar modal"
              >
                <XIcon className="h-7 w-7" />
              </button>
            </div>

            {error && (
              <div
                className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mt-4 rounded-md"
                role="alert"
              >
                <p>{error}</p>
              </div>
            )}

            <div className="mt-6 space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Archivo PDF
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    selectedFile
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="bg-red-100 p-3 rounded-lg">
                        <svg
                          className="h-8 w-8 text-red-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-800 truncate max-w-[200px]">
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <UploadIcon className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600 font-medium">
                        Haz clic para seleccionar un PDF
                      </p>
                      <p className="text-sm text-gray-400 mt-1">Máximo 50MB</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="application/pdf"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Title */}
              <div>
                <label
                  htmlFor="course-title"
                  className="block text-sm font-bold text-gray-700 mb-1"
                >
                  Título del Curso
                </label>
                <input
                  type="text"
                  id="course-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input"
                  placeholder="Ej: Técnicas de Venta Avanzadas"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="course-description"
                  className="block text-sm font-bold text-gray-700 mb-1"
                >
                  Descripción (Opcional)
                </label>
                <textarea
                  id="course-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="form-input resize-none"
                  placeholder="Breve descripción del contenido del curso..."
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-5 py-2.5 border border-gray-300 text-sm font-bold rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedFile}
              className="px-5 py-2.5 border border-transparent text-sm font-bold rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {loadingMessages[loadingStep]}
                </>
              ) : (
                'Procesar con IA'
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fade-in-scale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.2s forwards;
        }
        .form-input {
          width: 100%;
          padding: 0.6rem 0.8rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          background-color: #f9fafb;
          font-weight: 500;
        }
        .form-input::placeholder {
          font-weight: normal;
          color: #9ca3af;
        }
        .form-input:focus {
          outline: 2px solid transparent;
          outline-offset: 2px;
          --tw-ring-color: #3b82f6;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px var(--tw-ring-color);
        }
      `}</style>
    </div>
  );
};

export default AddPDFCourseModal;
