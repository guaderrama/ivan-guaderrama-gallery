import React, { useState } from 'react';
import type { Relationship, PipelineStage, ActionType, InterestedArtwork } from '../types';
import { PIPELINE_STAGES, STAGE_LABELS, STAGE_COLORS, ACTION_LABELS } from '../types';

interface ClientDetailModalProps {
  client: Relationship;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Relationship>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onMoveStage: (id: string, stage: PipelineStage) => Promise<void>;
  onLogInteraction: (id: string, note: string, actionTaken: string) => Promise<void>;
  availableArtworks: InterestedArtwork[];
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  client,
  onClose,
  onUpdate,
  onDelete,
  onMoveStage,
  onLogInteraction,
  availableArtworks
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'artworks'>('info');

  const [newNote, setNewNote] = useState('');
  const [newAction, setNewAction] = useState('');

  const [editData, setEditData] = useState({
    name: client.name,
    email: client.email || '',
    phone: client.phone || '',
    city: client.city || '',
    country: client.country || '',
    emotionalNote: client.emotionalNote,
    nextAction: client.nextAction,
    nextActionDescription: client.nextActionDescription || '',
    nextActionDate: client.nextActionDate
  });

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      await onUpdate(client.id, editData);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddInteraction = async () => {
    if (!newNote.trim()) return;

    setIsSaving(true);
    try {
      await onLogInteraction(client.id, newNote, newAction);
      setNewNote('');
      setNewAction('');
    } catch (err) {
      console.error('Error adding interaction:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStageChange = async (newStage: PipelineStage) => {
    setIsSaving(true);
    try {
      await onMoveStage(client.id, newStage);
    } catch (err) {
      console.error('Error changing stage:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this contact? This action cannot be undone.')) return;

    setIsSaving(true);
    try {
      await onDelete(client.id);
      onClose();
    } catch (err) {
      console.error('Error deleting:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{client.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                {client.city && (
                  <span className="text-red-100 text-sm">📍 {client.city}{client.country ? `, ${client.country}` : ''}</span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stage selector */}
          <div className="mt-4 flex flex-wrap gap-2">
            {PIPELINE_STAGES.map(stage => (
              <button
                key={stage}
                onClick={() => handleStageChange(stage)}
                disabled={isSaving}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  client.stage === stage
                    ? 'bg-white text-red-600 shadow'
                    : 'bg-red-500/30 text-white hover:bg-red-500/50'
                }`}
              >
                {STAGE_LABELS[stage]}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b flex">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'info'
                ? 'border-b-2 border-red-500 text-red-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Information
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'border-b-2 border-red-500 text-red-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            History ({client.interactions.length})
          </button>
          <button
            onClick={() => setActiveTab('artworks')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'artworks'
                ? 'border-b-2 border-red-500 text-red-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Artworks ({client.interestedArtworks.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Tab: Information */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Emotional note */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-bold text-purple-800 mb-2">💜 Emotional Note</h3>
                {isEditing ? (
                  <textarea
                    value={editData.emotionalNote}
                    onChange={(e) => setEditData({ ...editData, emotionalNote: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                ) : (
                  <p className="text-gray-700 italic">"{client.emotionalNote}"</p>
                )}
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  ) : (
                    <p className="text-gray-900">{client.email || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Phone</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  ) : (
                    <p className="text-gray-900">{client.phone || '-'}</p>
                  )}
                </div>
              </div>

              {/* Next action */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-bold text-yellow-800 mb-3">📅 Next Follow-up</h3>
                {isEditing ? (
                  <div className="space-y-3">
                    <select
                      value={editData.nextAction || ''}
                      onChange={(e) => setEditData({ ...editData, nextAction: e.target.value as ActionType || undefined })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Select action...</option>
                      {Object.entries(ACTION_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={editData.nextActionDescription}
                      onChange={(e) => setEditData({ ...editData, nextActionDescription: e.target.value })}
                      placeholder="Description"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                    <input
                      type="date"
                      value={editData.nextActionDate ? editData.nextActionDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditData({ ...editData, nextActionDate: e.target.value ? new Date(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                ) : (
                  <>
                    {client.nextAction ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{ACTION_LABELS[client.nextAction]}</p>
                            {client.nextActionDescription && (
                              <p className="text-sm text-gray-600">{client.nextActionDescription}</p>
                            )}
                            {client.nextActionDate && (
                              <p className="text-sm text-yellow-700">
                                📆 {client.nextActionDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={async () => {
                              setIsSaving(true);
                              try {
                                const note = `Completed: ${ACTION_LABELS[client.nextAction!]}${client.nextActionDescription ? ` - ${client.nextActionDescription}` : ''}`;
                                await onLogInteraction(client.id, note, ACTION_LABELS[client.nextAction!]);
                                await onUpdate(client.id, {
                                  nextAction: undefined,
                                  nextActionDescription: '',
                                  nextActionDate: undefined
                                });
                              } catch (err) {
                                console.error('Error completing follow-up:', err);
                              } finally {
                                setIsSaving(false);
                              }
                            }}
                            disabled={isSaving}
                            className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            ✓ Done
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No follow-up scheduled</p>
                    )}
                  </>
                )}
              </div>

              {/* Edit buttons */}
              <div className="flex justify-between">
                {isEditing ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    ✏️ Edit
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          )}

          {/* Tab: History */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* Add new interaction */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-bold text-gray-700">Log Interaction</h3>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="What happened in this interaction?"
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value)}
                    placeholder="Action taken (e.g.: Call, Email...)"
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                  <button
                    onClick={handleAddInteraction}
                    disabled={isSaving || !newNote.trim()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* Interactions list */}
              {client.interactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No interactions recorded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...client.interactions].reverse().map(interaction => (
                    <div key={interaction.id} className="border-l-4 border-gray-300 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <p className="text-gray-700">{interaction.note}</p>
                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                          {interaction.date.toLocaleDateString()}
                        </span>
                      </div>
                      {interaction.actionTaken && (
                        <p className="text-sm text-gray-500 mt-1">
                          → {interaction.actionTaken}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Artworks */}
          {activeTab === 'artworks' && (
            <div>
              {client.interestedArtworks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No artworks of interest recorded</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {client.interestedArtworks.map(artwork => (
                    <div key={artwork.id} className="border rounded-lg overflow-hidden">
                      {artwork.imageUrl ? (
                        <img
                          src={artwork.imageUrl}
                          alt={artwork.nombre}
                          className="w-full aspect-square object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-gray-200 flex items-center justify-center text-gray-400">
                          No image
                        </div>
                      )}
                      <div className="p-2">
                        <p className="font-medium text-sm truncate">{artwork.nombre}</p>
                        <p className="text-xs text-gray-500">{artwork.sku}</p>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{artwork.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-3 bg-gray-50 text-xs text-gray-500 flex justify-between">
          <span>Created: {client.createdAt.toLocaleDateString()}</span>
          <span>Updated: {client.updatedAt.toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailModal;
