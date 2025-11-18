// components/GenerateAudioModal.tsx
'use client';

import { useState } from 'react';
import { X, Loader2, Volume2, AlertTriangle } from 'lucide-react';
import { generateAudio } from '../utils/api';

interface GenerateAudioModalProps {
  textId: string;
  textTitle: string;
  hasExistingAudio: boolean;
  onClose: () => void;
  onGenerated: (audioUrl: string) => void;
}

export default function GenerateAudioModal({ 
  textId, 
  textTitle, 
  hasExistingAudio,
  onClose, 
  onGenerated 
}: GenerateAudioModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);

  const handleGenerate = async (gender: 'male' | 'female') => {
    setError('');
    setLoading(true);
    setSelectedGender(gender);

    try {
      const response = await generateAudio(textId, gender);
      onGenerated(response.audio_url);
    } catch (err: any) {
      setError(err.message || 'Error al generar audio');
      setSelectedGender(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="bg-black border border-gray-900 rounded-lg w-full max-w-md">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-900">
          <h2 className="text-xl font-bold">
            {hasExistingAudio ? 'Regenerar Audio' : 'Generar Audio'}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-900 rounded-lg transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Texto:</p>
            <p className="text-white font-medium">{textTitle}</p>
          </div>

          {/* Warning for existing audio */}
          {hasExistingAudio && (
            <div className="flex items-start gap-3 px-4 py-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div className="text-sm text-orange-400">
                <p className="font-medium mb-1">Audio existente será reemplazado</p>
                <p className="text-orange-500/80">
                  Al generar un nuevo audio, el audio anterior se eliminará permanentemente.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm text-gray-400">Selecciona el tipo de voz:</p>
            
            {/* Voz Masculina */}
            <button
              onClick={() => handleGenerate('male')}
              disabled={loading}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-linear-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg hover:border-blue-500/40 transition disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Volume2 className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white">Voz Masculina</p>
                  <p className="text-xs text-gray-500">Profesional y cálida</p>
                </div>
              </div>
              {loading && selectedGender === 'male' && (
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              )}
            </button>

            {/* Voz Femenina */}
            <button
              onClick={() => handleGenerate('female')}
              disabled={loading}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-linear-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg hover:border-purple-500/40 transition disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <Volume2 className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white">Voz Femenina</p>
                  <p className="text-xs text-gray-500">Natural y clara</p>
                </div>
              </div>
              {loading && selectedGender === 'female' && (
                <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
              )}
            </button>
          </div>

          {loading && (
            <p className="text-center text-sm text-gray-500">
              Generando audio, esto puede tomar unos segundos...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}