'use client';

import { X, Volume2, Star, Calendar, FileText } from 'lucide-react';
import { Text } from '../types';

interface FavoriteModalProps {
  favorites: Text[];
  onClose: () => void;
  onSelectText?: (text: Text) => void;
}

export default function FavoriteModal({ favorites, onClose, onSelectText }: FavoriteModalProps) {
  const handleTextClick = (text: Text) => {
    if (onSelectText) {
      onSelectText(text);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-gray-900 rounded-2xl w-full max-w-3xl p-6 relative shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Favoritos</h2>
              <p className="text-sm text-gray-500">{favorites.length} texto{favorites.length !== 1 ? 's' : ''} marcado{favorites.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {favorites.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-gray-700" />
              </div>
              <p className="text-gray-400 text-sm mb-1">No tienes favoritos aún</p>
              <p className="text-gray-600 text-xs">Marca textos como favoritos para acceder rápidamente</p>
            </div>
          ) : (
            favorites.map((fav) => (
              <div
                key={fav.id}
                onClick={() => handleTextClick(fav)}
                className="border border-gray-900 rounded-xl p-4 hover:border-gray-800 hover:bg-gray-950/50 transition-all cursor-pointer group"
              >
                {/* Header del texto */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate group-hover:text-blue-400 transition-colors">
                      {fav.title}
                    </h3>
                    {fav.category && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-gray-900 rounded text-xs text-gray-500">
                        {fav.category}
                      </span>
                    )}
                  </div>
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 shrink-0" />
                </div>

                {/* Contenido */}
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                  {fav.content}
                </p>

                {/* Footer con metadata */}
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  {fav.word_count && (
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {fav.word_count} palabras
                    </span>
                  )}
                  
                  {fav.audio_generated && (
                    <span className="flex items-center gap-1 text-blue-500">
                      <Volume2 className="w-3.5 h-3.5" />
                      Audio generado
                    </span>
                  )}
                  
                  {fav.created_at && (
                    <span className="flex items-center gap-1 ml-auto">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(fav.created_at).toLocaleDateString('es-ES', { 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer con stats */}
        {favorites.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-900">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-lg font-semibold text-blue-400">{favorites.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Con audio</p>
                <p className="text-lg font-semibold text-purple-400">
                  {favorites.filter(f => f.audio_generated).length}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Palabras</p>
                <p className="text-lg font-semibold text-green-400">
                  {favorites.reduce((acc, f) => acc + (f.word_count || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}