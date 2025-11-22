import React, { useState, useRef, useEffect } from 'react';
import { CameraIcon, SaveIcon, SparklesIcon, UploadIcon } from './Icons';
import { generateTitlesFromImage } from '../services/geminiService';
import Loader from './Loader';
import { NewMiniWork } from '../types';

interface GenerateNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (work: NewMiniWork) => void;
  existingSkus: string[];
  existingNames: string[];
}

const GenerateNameModal: React.FC<GenerateNameModalProps> = ({ isOpen, onClose, onSave, existingSkus, existingNames }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skus, setSkus] = useState<string[]>(['', '', '']);
  const [skuErrors, setSkuErrors] = useState<string[]>(['', '', '']);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setGeneratedTitles([]);
      setError(null);
      setIsLoading(false);
      setSkus(['', '', '']);
      setSkuErrors(['', '', '']);
    }
  }, [isOpen]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleOpenCamera = async () => {
    setError(null);
    setCapturedImage(null);
    setGeneratedTitles([]);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("No se pudo acceder a la cámara. Asegúrate de haber dado permiso en tu navegador.");
    }
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("La imagen es muy grande. El límite es 5MB.");
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError("Tipo de archivo no válido. Sube un JPG, PNG o WEBP.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCapturedImage(result);
        setError(null);
      };
      reader.onerror = () => {
        setError("No se pudo leer el archivo de imagen.");
      };
      reader.readAsDataURL(file);
    }
    // Reset file input to allow re-uploading the same file
    if(e.target) {
      e.target.value = '';
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleChangeImage = () => {
    setCapturedImage(null);
    setGeneratedTitles([]);
    setSkus(['', '', '']);
    setSkuErrors(['', '', '']);
    setError(null);
    stopCamera();
  };
  
  const handleGenerate = async () => {
    if (!capturedImage) return;
    setIsLoading(true);
    setError(null);
    setGeneratedTitles([]);
    setSkus(['', '', '']);
    setSkuErrors(['', '', '']);

    try {
      const base64Data = capturedImage.split(',')[1];
      const titles = await generateTitlesFromImage(base64Data, existingNames);
      const shortTitles = titles.map(t => t.split(':')[0].trim());
      setGeneratedTitles(shortTitles);
    } catch (err) {
      setError("Hubo un error al generar los nombres. Por favor, intenta de nuevo.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSkuChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newSkus = [...skus];
    newSkus[index] = e.target.value;
    setSkus(newSkus);
    if (skuErrors[index]) {
      const newErrors = [...skuErrors];
      newErrors[index] = '';
      setSkuErrors(newErrors);
    }
  };

  const handleSave = (title: string, index: number) => {
    const sku = skus[index].trim();
    const newErrors = [...skuErrors];
    let hasError = false;

    if (!sku) {
      newErrors[index] = 'SKU es requerido.';
      hasError = true;
    } else if (existingSkus.includes(sku)) {
      newErrors[index] = 'Este SKU ya existe.';
      hasError = true;
    } else {
      newErrors[index] = '';
    }

    setSkuErrors(newErrors);

    if (!hasError) {
      onSave({
        name: title,
        sku: sku,
        imageUrl: capturedImage!,
      });
    }
  };

  const handleModalContentClick = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-out" onClick={handleModalContentClick} style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)' }}>
        <div className="p-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold font-serif text-gray-900">Generar Nombre con IA</h2>
                    <p className="text-sm text-gray-500 mt-1">Usa tu cámara para obtener sugerencias de nombres para tus obras.</p>
                </div>
                <button type="button" onClick={onClose} className="-mt-2 -mr-2 text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            
            {error && <div className="mt-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert"><p>{error}</p></div>}
            
            <div className="mt-5 h-72 w-full bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
                {!stream && !capturedImage && (
                    <div className="text-center">
                        <CameraIcon className="mx-auto h-16 w-16 text-gray-600"/>
                        <p className="mt-2 text-sm text-gray-400">Abre la cámara o sube una imagen</p>
                    </div>
                )}
                <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover ${stream ? 'block' : 'hidden'}`}></video>
                {capturedImage && <img src={capturedImage} alt="Obra capturada" className={`w-full h-full object-contain ${capturedImage ? 'block' : 'hidden'}`} />}
                <canvas ref={canvasRef} className="hidden"></canvas>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
            />

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
                {!stream && !capturedImage && (
                    <>
                        <button onClick={handleOpenCamera} className="flex-1 btn-primary"><CameraIcon className="h-5 w-5 mr-2"/>Abrir Cámara</button>
                        <button onClick={() => fileInputRef.current?.click()} className="flex-1 btn-secondary"><UploadIcon className="h-5 w-5 mr-2"/>Subir Imagen</button>
                    </>
                )}
                {stream && <button onClick={handleCapture} className="flex-1 btn-primary">Tomar Foto</button>}
                {capturedImage && (
                    <>
                        <button onClick={handleChangeImage} className="flex-1 btn-secondary">Cambiar Imagen</button>
                        <button onClick={handleGenerate} disabled={isLoading} className="flex-1 btn-primary w-full sm:w-auto">
                            {isLoading ? <Loader /> : <><SparklesIcon className="h-5 w-5 mr-2"/>Generar Nombres</>}
                        </button>
                    </>
                )}
            </div>

            {generatedTitles.length > 0 && (
                <div className="mt-5 border-t pt-4">
                    <h3 className="text-lg font-bold text-gray-800">Sugerencias de Títulos:</h3>
                    <ul className="mt-2 space-y-4">
                        {generatedTitles.map((title, index) => (
                            <li key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50 p-3 rounded-lg">
                                <span className="font-semibold text-gray-700 flex-1">{title}</span>
                                <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
                                  <div className="w-full sm:w-auto">
                                    <input
                                      type="text"
                                      placeholder="Ingresar SKU"
                                      value={skus[index]}
                                      onChange={(e) => handleSkuChange(e, index)}
                                      className={`form-input-sm ${skuErrors[index] ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {skuErrors[index] && <p className="text-xs text-red-600 mt-1">{skuErrors[index]}</p>}
                                  </div>
                                  <button onClick={() => handleSave(title, index)} className="btn-save w-full sm:w-auto">
                                      <SaveIcon className="h-4 w-4"/>
                                      Guardar
                                  </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
      </div>
      <style>{`
        .btn-primary { display: inline-flex; items-center: justify-content: center; padding: 0.75rem 1.25rem; border: 1px solid transparent; font-size: 0.875rem; font-weight: bold; border-radius: 0.5rem; color: white; background-color: #4338CA; transition: background-color 0.2s; }
        .btn-primary:hover { background-color: #3730A3; }
        .btn-primary:disabled { background-color: #9CA3AF; cursor: not-allowed; }
        .btn-secondary { display: inline-flex; items-center: justify-content: center; padding: 0.75rem 1.25rem; border: 1px solid #D1D5DB; font-size: 0.875rem; font-weight: bold; border-radius: 0.5rem; color: #374151; background-color: white; transition: background-color 0.2s; }
        .btn-secondary:hover { background-color: #F3F4F6; }
        .form-input-sm { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid; border-radius: 0.375rem; background-color: white; font-weight: 500; font-size: 0.875rem; }
        .form-input-sm:focus { outline: 2px solid transparent; outline-offset: 2px; --tw-ring-color: #4338CA; border-color: #4338CA; }
        .btn-save { display: inline-flex; items-center: justify-center; gap: 0.5rem; padding: 0.5rem 1rem; border: 1px solid transparent; font-size: 0.875rem; font-weight: bold; border-radius: 0.375rem; color: white; background-color: #16A34A; transition: background-color 0.2s; }
        .btn-save:hover { background-color: #15803D; }
      `}</style>
    </div>
  );
};

export default GenerateNameModal;