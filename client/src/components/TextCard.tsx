'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Trash2, Share2, Edit, Download, Volume2, RefreshCw, AlertCircle, MessageCircle, StarOff, Star, X, Loader } from 'lucide-react';
import { Text } from '../types';
import { deleteText, addFavorite, removeFavorite, checkFavorite } from '../utils/api';
import { trackPlayStart, updatePlaySession, trackAudioDownload } from '../utils/api';
import ShareTextModal from './ShareTextModal';
import EditTextModal from './EditTextModal';
import GenerateAudioModal from './GenerateAudioModal';
import ShareWhatsAppModal from './ShareWhatsAppModal';

interface TextCardProps {
  text: Text;
  onUpdated: () => void;
}

export default function TextCard({ text, onUpdated }: TextCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localText, setLocalText] = useState(text);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioKey, setAudioKey] = useState(Date.now());
  const [audioError, setAudioError] = useState(false);
  
  // Analytics tracking
  const [playSessionId, setPlaySessionId] = useState<string | null>(null);
  const [lastTrackedTime, setLastTrackedTime] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar audio
  useEffect(() => {
    if (typeof Audio !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio();

      audioRef.current.addEventListener('timeupdate', () => setCurrentTime(audioRef.current?.currentTime || 0));
      audioRef.current.addEventListener('loadedmetadata', () => { 
        setDuration(audioRef.current?.duration || 0); 
        setAudioError(false); 
      });
      audioRef.current.addEventListener('ended', handleAudioEnded);
      audioRef.current.addEventListener('error', () => { 
        if (localText.audio_url) { 
          setAudioError(true); 
          setIsPlaying(false); 
        } 
      });
      audioRef.current.addEventListener('canplay', () => setAudioError(false));
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, [localText.audio_url]);

  // Cargar src de audio cuando cambia
  useEffect(() => {
    if (audioRef.current && localText.audio_url) {
      const isFullUrl = localText.audio_url.startsWith('http');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';
      
      // Siempre agregar cache-buster para forzar recarga
      const newSrc = isFullUrl 
        ? `${localText.audio_url}?t=${audioKey}`
        : `${baseUrl}${localText.audio_url}?t=${audioKey}`;
      
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setAudioError(false);
      audioRef.current.src = newSrc;
      audioRef.current.load();
    }
  }, [localText.audio_url, audioKey]);

  // Verificar si el texto ya es favorito al cargar la tarjeta
  useEffect(() => {
    const checkIfFavorite = async () => {
      try {
        const res = await checkFavorite(localText.id);
        setIsFavorite(res.is_favorite);
      } catch (err) {
        console.error('Error al verificar favorito:', err);
      }
    };
    checkIfFavorite();
  }, [localText.id]);

  // ===== ANALYTICS: Tracking de reproducción =====
  const startPlayTracking = async () => {
    try {
      const response = await trackPlayStart(localText.id);
      setPlaySessionId(response.session_id);
      setLastTrackedTime(0);
      
      trackingIntervalRef.current = setInterval(() => {
        if (audioRef.current && playSessionId) {
          const currentDuration = audioRef.current.currentTime;
          updatePlayTracking(currentDuration, false);
        }
      }, 10000);
    } catch (err) {
      console.error('Error iniciando tracking:', err);
    }
  };

  const updatePlayTracking = async (durationPlayed: number, completed: boolean) => {
    if (!playSessionId) return;
    
    try {
      if (Math.abs(durationPlayed - lastTrackedTime) > 1 || completed) {
        await updatePlaySession(playSessionId, durationPlayed, completed);
        setLastTrackedTime(durationPlayed);
      }
    } catch (err) {
      console.error('Error actualizando tracking:', err);
    }
  };

  const stopPlayTracking = async (completed: boolean = false) => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
    
    if (audioRef.current && playSessionId) {
      const finalDuration = audioRef.current.currentTime;
      await updatePlayTracking(finalDuration, completed);
      setPlaySessionId(null);
    }
  };

  // ===== Handlers de audio con tracking =====
  const handlePlayPause = async () => {
    if (!audioRef.current || !localText.audio_url || audioError) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      await stopPlayTracking(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        await startPlayTracking();
      } catch (err) {
        console.warn(err);
        setAudioError(true);
        setIsPlaying(false);
      }
    }
  };

  const handleAudioEnded = async () => {
    setIsPlaying(false);
    setCurrentTime(0);
    await stopPlayTracking(true);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration || audioError) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newTime = (x / rect.width) * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  const handleDownloadAudio = async () => {
  if (!localText.audio_url) return;
  
  try {
    await trackAudioDownload(localText.id);
  } catch (err) {
    console.error('Error trackeando descarga:', err);
  }
  
  const isFullUrl = localText.audio_url.startsWith('http');
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';
  
  // Siempre agregar cache-buster
  const audioSrc = isFullUrl 
    ? `${localText.audio_url}?t=${audioKey}`
    : `${baseUrl}${localText.audio_url}?t=${audioKey}`;
  
  const link = document.createElement('a');
  link.href = audioSrc;
  link.download = `${localText.title}.mp3`;
  link.click();
};

  const handleDelete = async () => {
    setIsDeleting(true);
    try { 
      if (isPlaying) {
        await stopPlayTracking(false);
      }
      await deleteText(localText.id); 
      setShowDeleteModal(false);
      onUpdated(); 
    } catch (err) { 
      console.error(err); 
      alert('Error al eliminar texto'); 
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAudioGenerated = (audioUrl: string) => {
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.src = ''; // Limpiar src anterior
  }
  if (isPlaying) {
    stopPlayTracking(false);
  }
  setIsPlaying(false);
  setAudioKey(Date.now()); // Nuevo timestamp para forzar recarga
  setLocalText({ ...localText, audio_url: audioUrl, audio_generated: true });
  setShowGenerateModal(false);
  onUpdated();
};

  const handleTextUpdated = (updatedText: Text) => {
    setLocalText(updatedText);
    setShowEditModal(false);
    onUpdated();
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorite) await removeFavorite(localText.id);
      else await addFavorite(localText.id);
      setIsFavorite(!isFavorite);
    } catch (err) { 
      console.error('Error al actualizar favorito:', err); 
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2,'0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hasContentChanged = localText.content !== text.content;

  return (
    <>
      <div className="bg-black border border-gray-900 rounded-lg p-5 hover:border-gray-800 transition space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{localText.title}</h3>
            {localText.category && <span className="text-xs text-gray-600">{localText.category}</span>}
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={toggleFavorite} 
              className="p-2 hover:bg-gray-900 rounded-lg transition" 
              title={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
            >
              {isFavorite ? <Star className="w-4 h-4 text-yellow-400"/> : <StarOff className="w-4 h-4 text-gray-400"/>}
            </button>
            <button 
              onClick={() => setShowEditModal(true)} 
              className="p-2 hover:bg-gray-900 rounded-lg transition" 
              title="Editar"
            >
              <Edit className="w-4 h-4 text-gray-400"/>
            </button>
            <button 
              onClick={() => setShowShareModal(true)} 
              className="p-2 hover:bg-gray-900 rounded-lg transition" 
              title="Compartir"
            >
              <Share2 className="w-4 h-4 text-gray-400"/>
            </button>
            <button 
              onClick={() => setShowWhatsAppModal(true)} 
              className="p-2 hover:bg-gray-900 rounded-lg transition" 
              title="Compartir por WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-gray-400"/>
            </button>
            <button 
              onClick={() => setShowDeleteModal(true)} 
              className="p-2 hover:bg-gray-900 rounded-lg transition" 
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4 text-gray-400"/>
            </button>
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-gray-500 line-clamp-3">{localText.content}</p>

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

        {localText.audio_url && hasContentChanged && (
          <div className="px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-500 text-xs">
            El contenido cambió. Genera un nuevo audio para reflejar los cambios.
          </div>
        )}

        {/* Audio Controls */}
        <div className="pt-3 border-t border-gray-900 space-y-3">
          {localText.audio_url ? (
            <>
              {audioError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>No se pudo cargar el audio. Intenta regenerarlo.</span>
                </div>
              )}
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
                      <Pause className="w-4 h-4"/>
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4"/>
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
                  <Download className="w-4 h-4"/>
                </button>
              </div>
              {duration > 0 && !audioError && (
                <div className="space-y-1">
                  <div 
                    className="h-1.5 bg-gray-900 rounded-full cursor-pointer overflow-hidden" 
                    onClick={handleTimelineClick}
                  >
                    <div 
                      className="h-full bg-linear-to-r from-blue-500 to-purple-600 transition-all" 
                      style={{width:`${progress}%`}}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              )}
              <button 
                onClick={() => setShowGenerateModal(true)} 
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-900 rounded-lg hover:bg-gray-900 transition text-sm text-gray-400"
              >
                <RefreshCw className="w-3.5 h-3.5"/>
                Regenerar Audio
              </button>
            </>
          ) : (
            <button 
              onClick={() => setShowGenerateModal(true)} 
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-900 rounded-lg hover:bg-gray-900 transition text-sm"
            >
              <Volume2 className="w-4 h-4"/>
              Generar Audio
            </button>
          )}
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-gray-900 rounded-2xl w-full max-w-sm p-6 relative shadow-xl">
            <button 
              onClick={() => setShowDeleteModal(false)} 
              className="absolute top-4 right-4 p-2 hover:bg-gray-900 rounded-lg transition"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>

            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold">Eliminar texto</h3>
                <p className="text-sm text-gray-500 mt-1">
                  ¿Estás seguro de eliminar "{localText.title}"?
                </p>
                {localText.audio_url && (
                  <p className="text-xs text-gray-600 mt-2">
                    El audio asociado también será eliminado.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 border border-gray-800 rounded-lg hover:bg-gray-900 transition text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg transition text-sm font-medium flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    'Eliminar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
      {showWhatsAppModal && (
        <ShareWhatsAppModal 
          textId={localText.id} 
          textTitle={localText.title}
          hasAudio={localText.audio_generated || !!localText.audio_url}
          onClose={() => setShowWhatsAppModal(false)}
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