import React, { useState } from 'react';
import { useRelationships } from '../hooks/useRelationships';
import type { Relationship, RelationshipView, PipelineStage, InterestedArtwork } from '../types';
import { PIPELINE_STAGES, STAGE_LABELS, STAGE_COLORS, ACTION_LABELS } from '../types';
import { AddClientModal } from './AddClientModal';
import { ClientDetailModal } from './ClientDetailModal';

interface RelationshipsManagerProps {
  availableArtworks: InterestedArtwork[];
}

export const RelationshipsManager: React.FC<RelationshipsManagerProps> = ({ availableArtworks }) => {
  const {
    relationships,
    loading,
    error,
    ritualDiario,
    pipelineGroups,
    create,
    update,
    remove,
    moveToStage,
    logInteraction,
    searchRelationships
  } = useRelationships();

  const [activeView, setActiveView] = useState<RelationshipView>('ritual');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Relationship | null>(null);

  const filteredRelationships = searchTerm ? searchRelationships(searchTerm) : relationships;

  // View: Daily Ritual
  const renderRitualDiario = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Your Daily Ritual</h3>
          <p className="text-gray-600">
            {ritualDiario.length === 0
              ? 'Excellent! You have no pending tasks for today. 🎉'
              : `You have ${ritualDiario.length} contact${ritualDiario.length > 1 ? 's' : ''} waiting for your attention.`}
          </p>
        </div>

        {ritualDiario.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">☀️</div>
            <p className="text-lg">Your list is clean. Great job!</p>
            <p className="text-sm mt-2">Use this time to connect with new prospects.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ritualDiario.map(client => {
              const isOverdue = client.nextActionDate && client.nextActionDate < today;
              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={`bg-white border-l-4 ${isOverdue ? 'border-red-500' : 'border-yellow-500'} rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-900">{client.name}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STAGE_COLORS[client.stage]}`}>
                          {STAGE_LABELS[client.stage]}
                        </span>
                      </div>
                      {client.city && (
                        <p className="text-sm text-gray-500 mb-2">📍 {client.city}{client.country ? `, ${client.country}` : ''}</p>
                      )}
                      <p className="text-sm text-gray-700 italic line-clamp-2">"{client.emotionalNote}"</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-yellow-600'}`}>
                        {isOverdue ? '⚠️ Overdue' : '📅 Today'}
                      </p>
                      {client.nextAction && (
                        <p className="text-xs text-gray-500 mt-1">
                          {ACTION_LABELS[client.nextAction]}
                        </p>
                      )}
                    </div>
                  </div>
                  {client.nextActionDescription && (
                    <p className="mt-2 text-sm bg-gray-50 rounded p-2 text-gray-600">
                      → {client.nextActionDescription}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // View: Pipeline (Kanban)
  const renderPipeline = () => {
    return (
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {PIPELINE_STAGES.map(stage => (
            <div key={stage} className="w-72 flex-shrink-0">
              <div className={`${STAGE_COLORS[stage]} rounded-t-lg px-4 py-2 border`}>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold">{STAGE_LABELS[stage]}</h3>
                  <span className="bg-white/50 px-2 py-0.5 rounded-full text-sm">
                    {pipelineGroups[stage].length}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 border border-t-0 rounded-b-lg p-2 min-h-[400px] space-y-2">
                {pipelineGroups[stage].map(client => (
                  <div
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className="bg-white rounded-lg shadow-sm p-3 cursor-pointer hover:shadow-md transition-shadow border border-gray-100"
                  >
                    <h4 className="font-semibold text-gray-900 text-sm">{client.name}</h4>
                    {client.city && (
                      <p className="text-xs text-gray-500">📍 {client.city}</p>
                    )}
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2 italic">
                      "{client.emotionalNote}"
                    </p>
                    {client.interestedArtworks.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {client.interestedArtworks.slice(0, 2).map(art => (
                          <span key={art.id} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                            {art.nombre.substring(0, 15)}...
                          </span>
                        ))}
                        {client.interestedArtworks.length > 2 && (
                          <span className="text-xs text-gray-400">
                            +{client.interestedArtworks.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                    {client.nextActionDate && (
                      <p className="text-xs text-gray-400 mt-2">
                        📅 {client.nextActionDate.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
                {pipelineGroups[stage].length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No contacts
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // View: Directory
  const renderDirectory = () => {
    const displayedClients = searchTerm ? filteredRelationships : relationships;

    return (
      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, city or emotional note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {displayedClients.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No contacts found</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayedClients.map(client => (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className="bg-white border rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-900">{client.name}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STAGE_COLORS[client.stage]}`}>
                    {STAGE_LABELS[client.stage]}
                  </span>
                </div>
                {(client.city || client.country) && (
                  <p className="text-sm text-gray-500 mb-2">
                    📍 {client.city}{client.country ? `, ${client.country}` : ''}
                  </p>
                )}
                {client.email && (
                  <p className="text-sm text-gray-500">✉️ {client.email}</p>
                )}
                {client.phone && (
                  <p className="text-sm text-gray-500">📞 {client.phone}</p>
                )}
                <p className="text-sm text-gray-600 mt-2 italic line-clamp-2">"{client.emotionalNote}"</p>
                <div className="mt-3 pt-3 border-t flex justify-between items-center text-xs text-gray-400">
                  <span>{client.interestedArtworks.length} artwork(s) of interest</span>
                  <span>{client.interactions.length} interactions</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
          <p className="text-gray-600">Loading relationships...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600">Error loading: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with view selector and add button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveView('ritual')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'ritual'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ☀️ Daily Ritual
            {ritualDiario.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {ritualDiario.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveView('pipeline')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'pipeline'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 Pipeline
          </button>
          <button
            onClick={() => setActiveView('directory')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'directory'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📖 Directory
          </button>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Register Client
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{relationships.length}</p>
          <p className="text-sm text-blue-800">Total Contacts</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{ritualDiario.length}</p>
          <p className="text-sm text-yellow-800">Pending Today</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{pipelineGroups.venta_realizada.length}</p>
          <p className="text-sm text-green-800">Sales</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">
            {pipelineGroups.conexion_emocional.length + pipelineGroups.seguimiento_activo.length}
          </p>
          <p className="text-sm text-purple-800">In Progress</p>
        </div>
      </div>

      {/* Active view */}
      {activeView === 'ritual' && renderRitualDiario()}
      {activeView === 'pipeline' && renderPipeline()}
      {activeView === 'directory' && renderDirectory()}

      {/* Add client modal */}
      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={create}
        availableArtworks={availableArtworks}
      />

      {/* Client detail modal */}
      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onUpdate={update}
          onDelete={remove}
          onMoveStage={moveToStage}
          onLogInteraction={logInteraction}
          availableArtworks={availableArtworks}
        />
      )}
    </div>
  );
};

export default RelationshipsManager;
