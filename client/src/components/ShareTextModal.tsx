'use client';

import { useState, FormEvent, useEffect } from 'react';
import { X, Loader2, UserPlus, Search, User } from 'lucide-react';
import { shareWithMultiple, searchUsers } from '../utils/api';

interface ShareTextModalProps {
  textId: string;
  textTitle: string;
  onClose: () => void;
}

interface UserSearchResult {
  id: string;
  username: string;
  email: string;
}

export default function ShareTextModal({ textId, textTitle, onClose }: ShareTextModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  // Buscar usuarios
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setSearching(true);
        try {
          const results = await searchUsers(searchQuery);
          setSearchResults(results);
        } catch {
          setSearchResults([]);
        } finally {
          setSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Añadir usuario seleccionado (evitar duplicados)
  const handleSelectUser = (user: UserSearchResult) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }

    setSearchQuery('');
    setSearchResults([]);
  };

  const removeSelected = (id: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== id));
  };

  // Enviar al backend (compartir múltiple)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (selectedUsers.length === 0) {
      setError("Selecciona al menos un usuario.");
      return;
    }

    setError('');
    setSuccess(null);
    setLoading(true);

    try {
      const usernames = selectedUsers.map(u => u.username);

      const res = await shareWithMultiple({
        text_id: textId,
        usernames
      });

      setSuccess(res.message);
      setSelectedUsers([]);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Error al compartir texto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="bg-black border border-gray-900 rounded-lg w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-900">
          <h2 className="text-xl font-bold">Compartir Texto</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-900 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">
            Compartiendo: <span className="text-white font-medium">{textTitle}</span>
          </p>

          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Campo de búsqueda */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-400">
                Buscar y seleccionar usuarios
              </label>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-black border border-gray-900 rounded-lg text-white placeholder-gray-700 focus:outline-none focus:border-gray-700 transition"
                  placeholder="Escribe un nombre..."
                  autoComplete="off"
                />

                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-600" />
                )}
              </div>

              {/* Chips de usuarios seleccionados */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 px-3 py-1 bg-gray-900 border border-gray-800 rounded-full"
                    >
                      <User className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-white">{user.username}</span>
                      <button
                        type="button"
                        onClick={() => removeSelected(user.id)}
                        className="text-gray-500 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Resultados de búsqueda */}
              {searchResults.length > 0 && (
                <div className="border border-gray-900 rounded-lg overflow-hidden">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-900 transition text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-500/80 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user.username}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-900 rounded-lg hover:bg-gray-900 transition"
              >
                Cerrar
              </button>

              <button
                type="submit"
                disabled={loading || selectedUsers.length === 0}
                className="flex-1 px-4 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Compartiendo...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Compartir
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
