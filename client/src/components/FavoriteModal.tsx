'use client';

import { X, Volume2 } from 'lucide-react';
import { Text } from '../types';

interface FavoriteModalProps {
  favorites: Text[];
  onClose: () => void;
}

export default function FavoriteModal({ favorites, onClose }: FavoriteModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-black p-6 rounded-2xl w-full max-w-md space-y-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2">
          <X className="w-5 h-5 text-gray-400" />
        </button>
        <h2 className="text-lg font-semibold">Favoritos</h2>

        <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
          {favorites.length === 0 && (
            <p className="text-gray-400 text-sm">No tienes favoritos</p>
          )}

          {favorites.map(fav => (
            <div key={fav.id} className="text-gray-200">
              {/* Título */}
              <h3 className="font-semibold text-sm truncate">{fav.title}</h3>
              
              {/* Contenido truncado */}
              <p className="text-xs text-gray-400 line-clamp-2">{fav.content}</p>
              
              {/* Detalles mínimos */}
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                {fav.category && <span>{fav.category}</span>}
                {fav.audio_generated && (
                  <span className="flex items-center gap-1">
                    <Volume2 className="w-4 h-4 text-blue-500" />
                    Audio
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
