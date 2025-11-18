// components/CreateTextModal.tsx
'use client';

import { useState, FormEvent } from 'react';
import { X, Loader2 } from 'lucide-react';
import { createText } from '../utils/api';

interface CreateTextModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateTextModal({ onClose, onCreated }: CreateTextModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createText({
        title: formData.title,
        content: formData.content,
        category: formData.category || undefined,
      });
      onCreated();
    } catch (err: any) {
      setError(err.message || 'Error al crear texto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-black border border-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-900">
          <h2 className="text-xl font-bold">Crear Nuevo Texto</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-900 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-300">
              Título
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 transition"
              placeholder="Título del texto"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label htmlFor="category" className="block text-sm font-medium text-gray-300">
              Categoría (opcional)
            </label>
            <input
              type="text"
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 transition"
              placeholder="Ej: trabajo, personal, estudio"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label htmlFor="content" className="block text-sm font-medium text-gray-300">
              Contenido
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              rows={10}
              className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 transition resize-none"
              placeholder="Escribe tu texto aquí... (mínimo 10 caracteres)"
            />
            <div className="text-xs text-gray-600 text-right">
              {formData.content.length} caracteres
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-800 rounded-lg hover:border-gray-600 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Texto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}