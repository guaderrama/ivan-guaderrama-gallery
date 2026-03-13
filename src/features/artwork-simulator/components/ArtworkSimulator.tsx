import React, { useState, useRef, useEffect, useMemo } from 'react';
import { UploadIcon, SparklesIcon, TrashIcon, UndoIcon } from '@/shared/components/Icons';
import { GoogleGenAI, Modality } from '@google/genai';
import Loader from '@/shared/components/Loader';

const HANDLE_SIZE = 12;

interface Artwork {
    id: number;
    src: string;
    img: HTMLImageElement;
    width: number;
    height: number;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    brightness: number;
}

const ArtworkSimulator: React.FC = () => {
    // State for images
    const [spaceImage, setSpaceImage] = useState<string | null>(null);
    const [history, setHistory] = useState<Artwork[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const artworks = history[historyIndex];
    
    const [selectedArtworkId, setSelectedArtworkId] = useState<number | null>(null);
    const [nextArtworkId, setNextArtworkId] = useState(1);
    
    // Refs for file inputs
    const spaceFileInputRef = useRef<HTMLInputElement>(null);
    const artworkFileInputRef = useRef<HTMLInputElement>(null);
    
    // Ref for canvas
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const bgImageRef = useRef<HTMLImageElement | null>(null);
    
    // State for artwork adjustments
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // New state for selection and resizing
    const [resizingCorner, setResizingCorner] = useState<string | null>(null);
    const [hoveredObject, setHoveredObject] = useState<string | null>(null);
    
    // State for AI background removal
    const [isRemovingBg, setIsRemovingBg] = useState(false);
    const [isEditingBackground, setIsEditingBackground] = useState(false);
    const [backgroundRemovalPrompt, setBackgroundRemovalPrompt] = useState('');

    const updateArtworks = (newArtworks: Artwork[]) => {
        if (JSON.stringify(newArtworks) === JSON.stringify(artworks)) return;
        const newHistory = [...history.slice(0, historyIndex + 1), newArtworks];
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(prevIndex => prevIndex - 1);
        }
    };

    const canUndo = historyIndex > 0;

    // Handle image upload
    const handleSpaceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setSpaceImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleArtworkImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const src = event.target?.result as string;
                const img = new Image();
                img.src = src;
                img.onload = () => {
                    const canvas = canvasRef.current;
                    const newArtwork: Artwork = {
                        id: nextArtworkId,
                        src,
                        img,
                        width: img.width,
                        height: img.height,
                        x: canvas ? canvas.width / 2 : 150,
                        y: canvas ? canvas.height / 2 : 150,
                        scale: 0.3,
                        rotation: 0,
                        brightness: 100,
                    };
                    updateArtworks([...artworks, newArtwork]);
                    setSelectedArtworkId(nextArtworkId);
                    setNextArtworkId(prev => prev + 1);
                };
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveBackground = async () => {
        if (!spaceImage || !backgroundRemovalPrompt) return;
        setIsRemovingBg(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const base64Data = spaceImage.split(',')[1];
            const mimeType = spaceImage.match(/:(.*?);/)?.[1] || 'image/jpeg';
            const textPrompt = `User wants to remove the following from the image: "${backgroundRemovalPrompt}". Your task is to edit the image to remove only these specified elements. Fill in the area where the objects were with a texture and color that seamlessly matches the surrounding wall. The final output must be a single image. Do not add any new elements or change other parts of the image.`;
            
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash-image',
              contents: {
                parts: [{ inlineData: { data: base64Data, mimeType } }, { text: textPrompt }],
              },
              config: { responseModalities: [Modality.IMAGE] },
            });

            let newImageBase64: string | null = null;
            if (response.candidates && response.candidates.length > 0) {
                 for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        newImageBase64 = part.inlineData.data;
                        break;
                    }
                }
            }

            if (newImageBase64) {
                setSpaceImage(`data:image/png;base64,${newImageBase64}`);
                setIsEditingBackground(false);
                setBackgroundRemovalPrompt('');
            } else {
                alert("La IA no pudo procesar la imagen con esa descripción. Intenta ser más específico.");
            }
        } catch (error) {
            console.error("Error removing background:", error);
            alert("Ocurrió un error al intentar quitar el fondo. Por favor, intenta de nuevo.");
        } finally {
            setIsRemovingBg(false);
        }
    };

    const handleArtworkUpdate = (id: number, newProps: Partial<Omit<Artwork, 'id' | 'src' | 'img'>>) => {
        const updatedArtworks = artworks.map(art => (art.id === id ? { ...art, ...newProps } : art));
        updateArtworks(updatedArtworks);
    };

    const getCornerPositions = (artwork: Artwork) => {
        const hw = (artwork.width * artwork.scale) / 2;
        const hh = (artwork.height * artwork.scale) / 2;
        const angle = artwork.rotation * Math.PI / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const cornersRelative = [ { x: -hw, y: -hh }, { x: hw, y: -hh }, { x: hw, y: hh }, { x: -hw, y: hh } ];
        return cornersRelative.map(corner => ({
            x: artwork.x + corner.x * cos - corner.y * sin,
            y: artwork.y + corner.x * sin + corner.y * cos,
        }));
    };
    
    // Load background image when spaceImage changes
    useEffect(() => {
        if (!spaceImage) {
            bgImageRef.current = null;
            return;
        }
        const bg = new Image();
        bg.src = spaceImage;
        bg.onload = () => {
            bgImageRef.current = bg;
            // Trigger a re-render to draw
            const canvas = canvasRef.current;
            if (canvas) {
                const container = canvas.parentElement;
                if (container) {
                    const containerWidth = container.clientWidth;
                    const scale = containerWidth / bg.width;
                    canvas.width = containerWidth;
                    canvas.height = bg.height * scale;
                }
            }
            // Force redraw by setting a dummy state
            setRedrawTick(t => t + 1);
        };
    }, [spaceImage]);

    const [redrawTick, setRedrawTick] = useState(0);

    // Draw canvas synchronously using cached background
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const bg = bgImageRef.current;
        if (!bg) return;

        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

        artworks.forEach(art => {
            ctx.save();
            ctx.translate(art.x, art.y);
            ctx.rotate(art.rotation * Math.PI / 180);
            ctx.filter = `brightness(${art.brightness}%)`;

            const scaledWidth = art.width * art.scale;
            const scaledHeight = art.height * art.scale;

            ctx.drawImage(art.img, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);

            if (art.id === selectedArtworkId) {
                ctx.setLineDash([6, 3]);
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 2;
                ctx.filter = 'none';
                ctx.strokeRect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
                ctx.setLineDash([]);
                ctx.fillStyle = 'white';
                const handleRadius = HANDLE_SIZE / 2;
                const corners = [ { x: -scaledWidth / 2, y: -scaledHeight / 2 }, { x: scaledWidth / 2, y: -scaledHeight / 2 }, { x: scaledWidth / 2, y: scaledHeight / 2 }, { x: -scaledWidth / 2, y: scaledHeight / 2 } ];
                corners.forEach(corner => {
                    ctx.beginPath();
                    ctx.arc(corner.x, corner.y, handleRadius, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.stroke();
                });
            }
            ctx.restore();
        });
    }, [artworks, selectedArtworkId, redrawTick]);

    const getCanvasCoords = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const isOverArtwork = (artwork: Artwork, x: number, y: number) => {
        const hw = (artwork.width * artwork.scale) / 2;
        const hh = (artwork.height * artwork.scale) / 2;
        const angle = -artwork.rotation * Math.PI / 180;
        const localX = (x - artwork.x) * Math.cos(angle) - (y - artwork.y) * Math.sin(angle);
        const localY = (x - artwork.x) * Math.sin(angle) + (y - artwork.y) * Math.cos(angle);
        return Math.abs(localX) < hw && Math.abs(localY) < hh;
    };


    const handleMouseDown = (e: React.MouseEvent) => {
        const { x, y } = getCanvasCoords(e);
        const selectedArtwork = artworks.find(art => art.id === selectedArtworkId);

        if (selectedArtwork) {
            const corners = getCornerPositions(selectedArtwork);
            const cornerNames = ['tl', 'tr', 'br', 'bl'];
            for (let i = 0; i < corners.length; i++) {
                const corner = corners[i];
                const dx = x - corner.x;
                const dy = y - corner.y;
                if (dx * dx + dy * dy < HANDLE_SIZE * HANDLE_SIZE) {
                    setResizingCorner(cornerNames[i]);
                    return;
                }
            }
        }
        
        let clickedArtwork = null;
        for (let i = artworks.length - 1; i >= 0; i--) {
            const art = artworks[i];
            if (isOverArtwork(art, x, y)) {
                clickedArtwork = art;
                break;
            }
        }
        
        if (clickedArtwork) {
            setSelectedArtworkId(clickedArtwork.id);
            setIsDragging(true);
            setDragStart({ x: x - clickedArtwork.x, y: y - clickedArtwork.y });
            updateArtworks([...artworks.filter(a => a.id !== clickedArtwork.id), clickedArtwork]);
        } else {
            setSelectedArtworkId(null);
        }
    };
    
    const handleMouseMove = (e: React.MouseEvent) => {
        const { x, y } = getCanvasCoords(e);
        const selectedArtwork = artworks.find(art => art.id === selectedArtworkId);

        if (resizingCorner && selectedArtwork) {
            const vec_x = x - selectedArtwork.x;
            const vec_y = y - selectedArtwork.y;
            const angle = -selectedArtwork.rotation * Math.PI / 180;
            const unrotated_x = vec_x * Math.cos(angle) - vec_y * Math.sin(angle);
            const unrotated_y = vec_x * Math.sin(angle) + vec_y * Math.cos(angle);

            const diag_mouse = Math.hypot(unrotated_x * 2, unrotated_y * 2);
            const diag_original = Math.hypot(selectedArtwork.width, selectedArtwork.height);
            
            if (diag_original > 0) {
                let newScale = diag_mouse / diag_original;
                newScale = Math.max(0.01, Math.min(newScale, 5));
                handleArtworkUpdate(selectedArtwork.id, { scale: newScale });
            }
            return;
        }

        if (isDragging && selectedArtwork) {
            handleArtworkUpdate(selectedArtwork.id, { x: x - dragStart.x, y: y - dragStart.y });
            return;
        }
        
        let newCursor: string | null = null;
        if (selectedArtwork) {
            const corners = getCornerPositions(selectedArtwork);
            const cornerCursors = ['nwse-resize', 'nesw-resize', 'nwse-resize', 'nesw-resize'];
            let onHandle = false;
            for (let i = 0; i < corners.length; i++) {
                if (Math.hypot(x - corners[i].x, y - corners[i].y) < HANDLE_SIZE) {
                    newCursor = cornerCursors[i]; onHandle = true; break;
                }
            }
            if (!onHandle && isOverArtwork(selectedArtwork, x, y)) newCursor = 'grab';
        } else {
            for (let i = artworks.length - 1; i >= 0; i--) {
                if (isOverArtwork(artworks[i], x, y)) {
                    newCursor = 'pointer'; break;
                }
            }
        }
        setHoveredObject(newCursor);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setResizingCorner(null);
    };

    const downloadSimulation = () => {
        const currentSelectedId = selectedArtworkId;
        setSelectedArtworkId(null);

        setTimeout(() => {
            const canvas = canvasRef.current;
            if (canvas) {
                const link = document.createElement('a');
                link.download = 'artwork-simulation.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            }
            setSelectedArtworkId(currentSelectedId);
        }, 100);
    };

    const getCursorStyle = () => {
        if (resizingCorner) return hoveredObject || 'default';
        if (isDragging) return 'grabbing';
        return hoveredObject || 'default';
    }

    const selectedArtwork = useMemo(() => 
        artworks.find(art => art.id === selectedArtworkId), 
    [artworks, selectedArtworkId]);

    const handleDeleteArtwork = (id: number) => {
        updateArtworks(artworks.filter(art => art.id !== id));
        if (selectedArtworkId === id) setSelectedArtworkId(null);
    };

    const handleSelectArtwork = (id: number) => {
        setSelectedArtworkId(id);
        const artToSelect = artworks.find(a => a.id === id);
        if (artToSelect) {
            updateArtworks([...artworks.filter(a => a.id !== id), artToSelect]);
        }
    };
    
    return (
        <div className="p-1">
            <h2 className="text-3xl font-bold font-serif text-gray-900 mb-6">Simulador de Obras en tu Espacio</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Input Column */}
                <div>
                    <div className="mb-6 p-4 border rounded-lg bg-white shadow-sm">
                        <label className="block text-lg font-semibold text-gray-800 mb-2">Paso 1: Carga tu Espacio</label>
                        <p className="text-sm text-gray-600 mb-3">Sube una foto de la pared donde te gustaría ver la obra.</p>
                        <div className="h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                            {spaceImage ? <img src={spaceImage} alt="Espacio del cliente" className="h-full w-full object-contain" /> : <span className="text-gray-500">Vista previa del espacio</span>}
                        </div>
                        <input type="file" ref={spaceFileInputRef} className="hidden" accept="image/*" onChange={handleSpaceImageUpload} />
                         <div className="mt-3 flex flex-col gap-3">
                            <button onClick={() => spaceFileInputRef.current?.click()} className="w-full btn-secondary"><UploadIcon className="h-5 w-5 mr-2" />{spaceImage ? 'Cambiar Foto' : 'Subir Foto'}</button>
                            {spaceImage && (
                                <>
                                    <button onClick={() => setIsEditingBackground(!isEditingBackground)} className="w-full btn-primary">
                                        <SparklesIcon className="h-5 w-5 mr-2" />
                                        {isEditingBackground ? 'Cancelar Edición' : 'Quitar Objetos del Fondo'}
                                    </button>
                                    {isEditingBackground && (
                                        <div className="border rounded-lg p-4 bg-gray-50">
                                            <label htmlFor="bg-prompt" className="block text-sm font-medium text-gray-700 mb-2">Describe qué objetos quitar:</label>
                                            <input
                                                id="bg-prompt"
                                                type="text"
                                                value={backgroundRemovalPrompt}
                                                onChange={(e) => setBackgroundRemovalPrompt(e.target.value)}
                                                placeholder="ej: la planta y el cuadro de la derecha"
                                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                            />
                                            <button
                                                onClick={handleRemoveBackground}
                                                className="mt-3 w-full flex items-center justify-center p-3 border border-transparent text-sm font-bold rounded-md text-white bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                                disabled={isRemovingBg || !backgroundRemovalPrompt}
                                            >
                                                {isRemovingBg ? <Loader /> : 'Procesar con IA'}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg bg-white shadow-sm">
                        <label className="block text-lg font-semibold text-gray-800 mb-2">Paso 2: Carga Obras</label>
                        <p className="text-sm text-gray-600 mb-3">Sube una o más fotos de las obras de arte que quieres simular.</p>
                        {artworks.length > 0 && (
                            <div className="mb-3 space-y-2 max-h-48 overflow-y-auto p-1">
                                {artworks.map((art, index) => (
                                    <div key={art.id} onClick={() => handleSelectArtwork(art.id)} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedArtworkId === art.id ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-gray-100 hover:bg-gray-200'}`}>
                                        <img src={art.src} alt={`Obra ${index + 1}`} className="w-12 h-12 object-contain rounded-md bg-white border"/>
                                        <span className="text-sm font-medium text-gray-700 flex-grow">Obra #{index + 1}</span>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteArtwork(art.id); }} className="p-2 rounded-full text-gray-500 hover:bg-red-100 hover:text-red-600"><TrashIcon className="h-5 w-5"/></button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <input type="file" ref={artworkFileInputRef} className="hidden" accept="image/*" onChange={handleArtworkImageUpload} />
                        <button onClick={() => artworkFileInputRef.current?.click()} className="mt-3 w-full btn-secondary">Agregar Obra</button>
                    </div>
                </div>
                
                {/* Output Column */}
                <div className="sticky top-8">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <label className="block text-lg font-semibold text-gray-800">Paso 3: Visualiza y Ajusta</label>
                            <p className="text-sm text-gray-600">Haz clic en una obra para seleccionarla. Arrastra para moverla.</p>
                        </div>
                        <button
                            onClick={handleUndo}
                            disabled={!canUndo}
                            title="Deshacer último cambio"
                            aria-label="Deshacer último cambio"
                            className="p-2 rounded-full text-gray-500 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <UndoIcon className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="relative border-2 border-gray-300 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shadow-inner">
                        {!spaceImage && <div className="aspect-video w-full flex items-center justify-center"><span className="text-gray-500">Aquí aparecerá tu simulación</span></div>}
                        <canvas ref={canvasRef} className="w-full h-auto" style={{ cursor: getCursorStyle() }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} />
                    </div>
                     {spaceImage && (
                        <>
                            <div className="mt-4 p-4 bg-white rounded-lg border shadow-sm">
                                <h3 className="font-semibold text-gray-800 mb-3">Herramientas de Ajuste {selectedArtwork ? `(Obra #${artworks.findIndex(a => a.id === selectedArtwork.id) + 1} Seleccionada)` : ''}</h3>
                                {selectedArtwork ? (
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-center text-sm">
                                            <label htmlFor="scale" className="font-medium text-gray-700">Tamaño</label>
                                            <span className="text-gray-600 font-mono">{(selectedArtwork.scale * 100).toFixed(0)}%</span>
                                        </div>
                                        <input type="range" id="scale" min="1" max="500" step="1" value={selectedArtwork.scale * 100} onChange={(e) => handleArtworkUpdate(selectedArtwork.id, { scale: parseFloat(e.target.value) / 100 })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center text-sm">
                                            <label htmlFor="rotation" className="font-medium text-gray-700">Rotación</label>
                                             <span className="text-gray-600 font-mono">{selectedArtwork.rotation}°</span>
                                        </div>
                                        <input type="range" id="rotation" min="-45" max="45" step="1" value={selectedArtwork.rotation} onChange={(e) => handleArtworkUpdate(selectedArtwork.id, { rotation: parseInt(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center text-sm">
                                            <label htmlFor="brightness" className="font-medium text-gray-700">Brillo</label>
                                             <span className="text-gray-600 font-mono">{selectedArtwork.brightness}%</span>
                                        </div>
                                        <input type="range" id="brightness" min="50" max="150" step="1" value={selectedArtwork.brightness} onChange={(e) => handleArtworkUpdate(selectedArtwork.id, { brightness: parseInt(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                    </div>
                                    <button onClick={() => handleDeleteArtwork(selectedArtwork.id)} className="w-full btn-danger mt-2">Eliminar Obra Seleccionada</button>
                                </div>
                                 ) : <p className="text-sm text-gray-500 text-center py-4">Selecciona una obra en la imagen para ver los controles.</p>}
                            </div>
                            <button onClick={downloadSimulation} className="mt-4 w-full btn-primary" disabled={artworks.length === 0}>Descargar Simulación</button>
                        </>
                    )}
                </div>
            </div>
            <style>{`
                .btn-primary { display: inline-flex; items-center: justify-content: center; padding: 0.75rem 1.25rem; border: 1px solid transparent; font-size: 0.875rem; font-weight: bold; border-radius: 0.5rem; color: white; background-color: #4F46E5; transition: background-color 0.2s; }
                .btn-primary:hover { background-color: #4338CA; }
                .btn-primary:disabled { background-color: #a5b4fc; cursor: not-allowed; }
                .btn-secondary { display: inline-flex; items-center: justify-content: center; padding: 0.75rem 1.25rem; border: 1px solid #D1D5DB; font-size: 0.875rem; font-weight: bold; border-radius: 0.5rem; color: #374151; background-color: white; transition: background-color 0.2s; }
                .btn-secondary:hover { background-color: #F9FAFB; }
                .btn-danger { display: inline-flex; items-center: justify-content: center; padding: 0.75rem 1.25rem; border: 1px solid transparent; font-size: 0.875rem; font-weight: bold; border-radius: 0.5rem; color: white; background-color: #EF4444; transition: background-color 0.2s; }
                .btn-danger:hover { background-color: #DC2626; }
            `}</style>
        </div>
    );
};

export default ArtworkSimulator;