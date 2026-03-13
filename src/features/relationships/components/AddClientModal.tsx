import React, { useState } from 'react';
import type { NewRelationship, PipelineStage, ActionType, InterestedArtwork } from '../types';
import { PIPELINE_STAGES, STAGE_LABELS, ACTION_LABELS } from '../types';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NewRelationship) => Promise<string>;
  availableArtworks: InterestedArtwork[];
}

export const AddClientModal: React.FC<AddClientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  availableArtworks
}) => {
  const [formData, setFormData] = useState<NewRelationship>({
    name: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    stage: 'interes_nuevo',
    emotionalNote: '',
    nextAction: undefined,
    nextActionDescription: '',
    nextActionDate: undefined,
    interestedArtworks: []
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener categorías únicas de las obras
  const categories = ['ALL', ...new Set(availableArtworks.map(a => a.category))];

  // Filtrar obras por categoría
  const filteredArtworks = selectedCategory === 'ALL'
    ? availableArtworks
    : availableArtworks.filter(a => a.category === selectedCategory);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!formData.emotionalNote.trim()) {
      setError('The emotional note is important to remember the connection');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(formData);
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        city: '',
        country: '',
        stage: 'interes_nuevo',
        emotionalNote: '',
        nextAction: undefined,
        nextActionDescription: '',
        nextActionDate: undefined,
        interestedArtworks: []
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleArtwork = (artwork: InterestedArtwork) => {
    const exists = formData.interestedArtworks.find(a => a.id === artwork.id);
    if (exists) {
      setFormData({
        ...formData,
        interestedArtworks: formData.interestedArtworks.filter(a => a.id !== artwork.id)
      });
    } else {
      setFormData({
        ...formData,
        interestedArtworks: [...formData.interestedArtworks, artwork]
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Register Client</h2>
              <p className="text-sm text-gray-500">Capture the essence of the visit</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Datos básicos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Client name"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="+52 123 456 7890"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="client@email.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Country"
                  />
                </div>
              </div>
            </div>

            {/* Etapa inicial */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Initial Stage</label>
              <div className="flex flex-wrap gap-2">
                {PIPELINE_STAGES.slice(0, 4).map(stage => (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => setFormData({ ...formData, stage })}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      formData.stage === stage
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {STAGE_LABELS[stage]}
                  </button>
                ))}
              </div>
            </div>

            {/* Nota emocional */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Emotional Note <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Why did they connect with the artwork? What did it remind them of? This detail will help you resume the conversation.
              </p>
              <textarea
                value={formData.emotionalNote}
                onChange={(e) => setFormData({ ...formData, emotionalNote: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="E.g.: It reminded them of their childhood in the countryside, visiting their grandmother..."
              />
            </div>

            {/* Compromiso de seguimiento */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4">
              <h3 className="font-bold text-yellow-800">📅 Follow-up Commitment</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Next Action</label>
                  <select
                    value={formData.nextAction || ''}
                    onChange={(e) => setFormData({ ...formData, nextAction: e.target.value as ActionType || undefined })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Select...</option>
                    {Object.entries(ACTION_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.nextActionDate ? formData.nextActionDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({ ...formData, nextActionDate: e.target.value ? new Date(e.target.value) : undefined })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.nextActionDescription}
                  onChange={(e) => setFormData({ ...formData, nextActionDescription: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="E.g.: Send video of the artwork with natural light"
                />
              </div>
            </div>

            {/* Obras de interés */}
            <div>
              <h3 className="font-bold text-gray-700 mb-2">🎨 Artworks of Interest</h3>

              {/* Filtro por categoría */}
              <div className="flex flex-wrap gap-2 mb-3">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedCategory === cat
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat === 'ALL' ? 'All' : cat}
                  </button>
                ))}
              </div>

              {/* Grid de obras */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                {filteredArtworks.map(artwork => {
                  const isSelected = formData.interestedArtworks.some(a => a.id === artwork.id);
                  return (
                    <button
                      key={artwork.id}
                      type="button"
                      onClick={() => toggleArtwork(artwork)}
                      className={`relative p-2 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-red-500 bg-red-50'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      {artwork.imageUrl ? (
                        <img
                          src={artwork.imageUrl}
                          alt={artwork.nombre}
                          className="w-full aspect-square object-cover rounded"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">
                          No image
                        </div>
                      )}
                      <p className="text-xs mt-1 truncate">{artwork.nombre}</p>
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {formData.interestedArtworks.length > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  {formData.interestedArtworks.length} artwork(s) selected
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClientModal;
