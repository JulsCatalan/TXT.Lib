// components/SharedTextCard.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Download, User, AlertCircle } from 'lucide-react';

interface SharedText {
  share_id: string;
  can_edit: boolean;
  shared_at: string;
  shared_by: {
    id: string;
    username: string;
    email: string;
  };
  text: {
    id: string;
    title: string;
    content: string;
    audio_url: string | null;
    audio_generated: boolean;
    category: string | null;
    word_count: number;
    created_at: string;
  };
}

interface SharedTextCardProps {
  sharedText: SharedText;
}

export default function SharedTextCard({ sharedText }: SharedTextCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioKey, setAudioKey] = useState(Date.now());
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { text, shared_by } = sharedText;

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
        if (text.audio_url) {
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
  }, [text.audio_url]);

  // Actualizar src del audio cuando cambia la URL o el audioKey
  useEffect(() => {
    if (audioRef.current && text.audio_url) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';
      const newSrc = `${baseUrl}${text.audio_url}?t=${audioKey}`;
      
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
  }, [text.audio_url, audioKey]);

  const handlePlayPause = () => {
    if (!audioRef.current || !text.audio_url || audioError) return;

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
    if (!text.audio_url) return;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';
    const link = document.createElement('a');
    link.href = `${baseUrl}${text.audio_url}?t=${audioKey}`;
    link.download = `${text.title}.mp3`;
    link.click();
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-black border border-gray-900 rounded-lg p-5 hover:border-gray-800 transition space-y-4">
      
      {/* Header con badge de "Compartido" */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg truncate">{text.title}</h3>
            <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 rounded text-purple-400 text-xs whitespace-nowrap">
              Compartido
            </span>
          </div>
          {text.category && (
            <span className="text-xs text-gray-600">{text.category}</span>
          )}
        </div>
      </div>

      {/* Shared by info */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-900/30 border border-gray-900 rounded-lg">
        <User className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-xs text-gray-500">
          Compartido por <span className="text-gray-400 font-medium">{shared_by.username}</span>
        </span>
      </div>

      {/* Content Preview */}
      <p className="text-sm text-gray-500 line-clamp-3">
        {text.content}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-700">
        <span>{text.word_count} palabras</span>
        {text.audio_generated && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Audio generado
          </span>
        )}
      </div>

      {/* Audio Controls (solo si hay audio disponible) */}
      {text.audio_url ? (
        <div className="pt-3 border-t border-gray-900 space-y-3">
          {/* Error message si hay problema con el audio */}
          {audioError && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>No se pudo cargar el audio. Intenta recargar la página.</span>
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
                  className="h-full bg-linear-to-r from-purple-500 to-blue-600 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="pt-3 border-t border-gray-900">
          <div className="px-4 py-3 bg-gray-900/30 border border-gray-900 rounded-lg text-center">
            <p className="text-xs text-gray-600">
              Este texto aún no tiene audio generado
            </p>
          </div>
        </div>
      )}
    </div>
  );
}