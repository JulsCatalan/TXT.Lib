// components/TextCard.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Trash2, Share2, Edit, Download, Volume2, RefreshCw, AlertCircle } from 'lucide-react';
import { Text } from '../types';
import { deleteText } from '../utils/api';
import ShareTextModal from './ShareTextModal';
import EditTextModal from './EditTextModal';
import GenerateAudioModal from './GenerateAudioModal';

interface TextCardProps {
  text: Text;
  onUpdated: () => void;
  currentUserId?: string;
}

export default function TextCard({ text, onUpdated }: TextCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [localText, setLocalText] = useState(text);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioKey, setAudioKey] = useState(Date.now());
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Inicializar audio element
  useEffect(() => {
    if (typeof Audio !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio();
      
      // Event listeners
      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      });
      
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current?.duration || 0);
        setAudioError(false); // Reset error on successful load
      });
      
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });

      audioRef.current.addEventListener('error', () => {
        // Solo mostrar error si realmente hay una URL de audio
        if (localText.audio_url) {
          setAudioError(true);
          setIsPlaying(false);
        }
      });

      audioRef.current.addEventListener('canplay', () => {
        setAudioError(false); // Reset error when audio can play
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [localText.audio_url]);

  // Actualizar src del audio cuando cambia la URL o el audioKey
  useEffect(() => {
    if (audioRef.current && localText.audio_url) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000';
      const newSrc = `${baseUrl}${localText.audio_url}?t=${audioKey}`;
      
      // Detener y limpiar el audio anterior
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setAudioError(false);
      
      // Cargar nuevo audio
      audioRef.current.src = newSrc;
      audioRef.current.load();
    }
  }, [localText.audio_url, audioKey]);

  const handlePlayPause = () => {
    if (!audioRef.current || !localText.audio_url || audioError) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setAudioError(false);
        })
        .catch((error) => {
          console.warn('No se pudo reproducir el audio:', error.message);
          setAudioError(true);
          setIsPlaying(false);
        });
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration || audioError) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleDownloadAudio = () => {
    if (!localText.audio_url) return;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000';
    const link = document.createElement('a');
    link.href = `${baseUrl}${localText.audio_url}?t=${audioKey}`;
    link.download = `${localText.title}.mp3`;
    link.click();
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este texto?')) return;

    try {
      await deleteText(localText.id);
      onUpdated();
    } catch (error) {
      console.error('Error deleting text:', error);
      alert('Error al eliminar texto');
    }
  };

  const handleAudioGenerated = (audioUrl: string) => {
    // Detener audio actual si está reproduciendo
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    // Generar nuevo audioKey para forzar recarga
    const newAudioKey = Date.now();
    setAudioKey(newAudioKey);

    // Actualizar el estado local inmediatamente
    setLocalText({ 
      ...localText, 
      audio_url: audioUrl, 
      audio_generated: true 
    });
    
    setShowGenerateModal(false);
    
    // Notificar al padre para actualizar la lista completa
    onUpdated();
  };

  const handleTextUpdated = (updatedText: Text) => {
    // Actualizar el estado local inmediatamente
    setLocalText(updatedText);
    setShowEditModal(false);
    // Notificar al padre
    onUpdated();
  };

  const hasContentChanged = localText.content !== text.content;

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <div className="bg-black border border-gray-900 rounded-lg p-5 hover:border-gray-800 transition space-y-4">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{localText.title}</h3>
            {localText.category && (
              <span className="text-xs text-gray-600">{localText.category}</span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowEditModal(true)}
              className="p-2 hover:bg-gray-900 rounded-lg transition"
              title="Editar"
            >
              <Edit className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="p-2 hover:bg-gray-900 rounded-lg transition"
              title="Compartir"
            >
              <Share2 className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-gray-900 rounded-lg transition"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content Preview */}
        <p className="text-sm text-gray-500 line-clamp-3">
          {localText.content}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-700">
          <span>{localText.word_count} palabras</span>
          {localText.audio_generated && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Audio generado
            </span>
          )}
        </div>

        {/* Audio warning if content changed */}
        {localText.audio_url && hasContentChanged && (
          <div className="px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-500 text-xs">
            El contenido cambió. Genera un nuevo audio para reflejar los cambios.
          </div>
        )}

        {/* Audio Controls */}
        <div className="pt-3 border-t border-gray-900 space-y-3">
          {localText.audio_url ? (
            <>
              {/* Error message si hay problema con el audio */}
              {audioError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>No se pudo cargar el audio. Intenta regenerarlo.</span>
                </div>
              )}

              {/* Play/Pause and Download */}
              <div className="flex gap-2">
                <button
                  onClick={handlePlayPause}
                  disabled={audioError}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition text-sm ${
                    audioError 
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                      : 'bg-white text-black hover:bg-gray-200'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Reproducir
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownloadAudio}
                  disabled={audioError}
                  className={`px-4 py-2.5 border rounded-lg transition ${
                    audioError
                      ? 'border-gray-800 text-gray-600 cursor-not-allowed'
                      : 'border-gray-900 hover:bg-gray-900'
                  }`}
                  title="Descargar audio"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>

              {/* Timeline */}
              {duration > 0 && !audioError && (
                <div className="space-y-1">
                  <div 
                    className="h-1.5 bg-gray-900 rounded-full cursor-pointer overflow-hidden"
                    onClick={handleTimelineClick}
                  >
                    <div 
                      className="h-full bg-linear-to-r from-blue-500 to-purple-600 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              )}
              
              {/* Regenerate audio button */}
              <button
                onClick={() => setShowGenerateModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-900 rounded-lg hover:bg-gray-900 transition text-sm text-gray-400"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerar Audio
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowGenerateModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-900 rounded-lg hover:bg-gray-900 transition text-sm"
            >
              <Volume2 className="w-4 h-4" />
              Generar Audio
            </button>
          )}
        </div>
      </div>

      {showShareModal && (
        <ShareTextModal
          textId={localText.id}
          textTitle={localText.title}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {showEditModal && (
        <EditTextModal
          text={localText}
          onClose={() => setShowEditModal(false)}
          onUpdated={handleTextUpdated}
        />
      )}

      {showGenerateModal && (
        <GenerateAudioModal
          textId={localText.id}
          textTitle={localText.title}
          hasExistingAudio={!!localText.audio_url}
          onClose={() => setShowGenerateModal(false)}
          onGenerated={handleAudioGenerated}
        />
      )}
    </>
  );
}