
import React from 'react';
import type { MiniWork } from '../types';
import { SparklesIcon, ArchiveBoxIcon } from '@/shared/components/Icons';

interface MiniWorksManagerProps {
  works: MiniWork[];
  onOpenGenerateNameModal: () => void;
  onEdit: (work: MiniWork) => void;
  onArchive: (workId: string) => void;
  isArchivedView: boolean;
}

const MiniWorksManager: React.FC<MiniWorksManagerProps> = ({ works, onOpenGenerateNameModal, onEdit, onArchive, isArchivedView }) => {
  
  return (
    <div className="p-1">
      <div className="mb-6">
        <h2 className="text-3xl font-bold font-serif text-gray-900 text-center sm:text-left">
          {isArchivedView ? 'Archivo de Obras Mini' : 'Listado de Obras Mini'}
        </h2>
      </div>

      {!isArchivedView && (
        <div className="mb-8">
           <button
            onClick={onOpenGenerateNameModal}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-transparent text-sm font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-sm hover:shadow-md"
          >
            <SparklesIcon className="h-5 w-5" />
            Generar Nombre con IA
          </button>
        </div>
      )}

      {works.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {works.map((work) => (
            <div 
              key={work.id} 
              className="group relative border rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 ease-in-out cursor-pointer"
            >
              {work.archived && (
                 <div className="absolute inset-0 bg-white/75 backdrop-blur-sm flex items-center justify-center z-10 pointer-events-none">
                    <span className="text-xl font-black font-serif text-gray-900 border-2 border-gray-900 px-4 py-2 rounded-md transform -rotate-6">
                        ARCHIVADO
                    </span>
                </div>
              )}
              <div onClick={() => onEdit(work)}>
                <div className="aspect-[4/3] bg-gray-100">
                  {work.imageUrl ? (
                    <img src={work.imageUrl} alt={work.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">Sin foto</div>
                  )}
                </div>
                <div className="p-4 bg-white">
                  <h3 className="font-bold text-gray-900 truncate">{work.name}</h3>
                  <p className="text-sm font-mono text-gray-500">{work.sku}</p>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                    onClick={(e) => { e.stopPropagation(); onArchive(work.id); }}
                    className="p-2.5 rounded-full bg-zinc-700 text-white hover:bg-zinc-600 transition-all transform hover:scale-110"
                    aria-label={isArchivedView ? 'Restaurar obra' : 'Archivar obra'}
                    title={isArchivedView ? 'Restaurar' : 'Archivar'}
                >
                    <ArchiveBoxIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-lg">
            {isArchivedView ? 'No hay obras mini en el archivo.' : 'No hay obras mini registradas.'}
          </p>
          {!isArchivedView && <p className="mt-2 text-sm">Agrega una nueva obra usando el botón de `+`.</p>}
        </div>
      )}
    </div>
  );
};

export default MiniWorksManager;
