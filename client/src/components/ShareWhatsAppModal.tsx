'use client';

import { useState, useEffect } from 'react';
import { X, Send, MessageCircle, AlertCircle, CheckCircle, Loader, Settings, FileText, Volume2, MessageSquare } from 'lucide-react';
import { sendAudio, sendText, sendTextAndAudio, getUserProfile } from '../utils/api';
import toast from 'react-hot-toast';

interface ShareWhatsAppModalProps {
  textId: string;
  textTitle: string;
  hasAudio: boolean;
  onClose: () => void;
  onOpenProfile?: () => void;
}

export default function ShareWhatsAppModal({ 
  textId, 
  textTitle,
  hasAudio,
  onClose,
  onOpenProfile 
}: ShareWhatsAppModalProps) {
  const [toSelf, setToSelf] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  // Tipo de contenido a enviar
  const [contentType, setContentType] = useState<'audio' | 'text' | 'both'>('audio');
  
  // Estados del perfil del usuario
  const [hasPhone, setHasPhone] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [userPhone, setUserPhone] = useState('');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoadingProfile(true);
      const profile = await getUserProfile();
      
      setHasPhone(!!profile.user.phone_number);
      setIsVerified(profile.user.whatsapp_verified || false);
      setUserPhone(profile.user.phone_number || '');
    } catch (err) {
      console.error('Error cargando perfil:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSend = async () => {
    if (!toSelf && !phoneNumber.trim()) {
      toast.error('Ingresa un número de WhatsApp válido');
      return;
    }

    setLoading(true);
    try {
      const params = {
        text_id: textId,
        to_self: toSelf,
        to_phone: toSelf ? undefined : phoneNumber
      };

      // Enviar según el tipo seleccionado
      if (contentType === 'audio') {
        await sendAudio(params);
      } else if (contentType === 'text') {
        await sendText(params);
      } else {
        await sendTextAndAudio(params);
      }

      toast.success('Contenido enviado por WhatsApp');
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al enviar por WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToProfile = () => {
    onClose();
    if (onOpenProfile) {
      onOpenProfile();
    }
  };

  // Validar si puede enviar
  const canSend = toSelf ? (hasPhone && isVerified) : phoneNumber.trim().length > 0;

  if (loadingProfile) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-black border border-gray-900 rounded-2xl p-8">
          <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-gray-900 rounded-2xl w-full max-w-md p-6 relative shadow-xl">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Compartir por WhatsApp</h2>
              <p className="text-xs text-gray-500 truncate max-w-[250px]">{textTitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          
          {/* Verificación de configuración */}
          {(!hasPhone || !isVerified) && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-500 mb-1">
                    Configuración de WhatsApp incompleta
                  </p>
                  <ul className="text-xs text-yellow-500/80 space-y-1">
                    {!hasPhone && (
                      <li>• Debes agregar tu número de teléfono</li>
                    )}
                    {hasPhone && !isVerified && (
                      <li>• Debes verificar tu número de WhatsApp</li>
                    )}
                  </ul>
                </div>
              </div>
              <button
                onClick={handleGoToProfile}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition text-sm font-medium"
              >
                <Settings className="w-4 h-4" />
                Ir a configuración
              </button>
            </div>
          )}

          {/* Estado verificado */}
          {hasPhone && isVerified && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <div className="flex-1">
                  <p className="text-sm text-green-500 font-medium">WhatsApp configurado</p>
                  <p className="text-xs text-green-500/70">{userPhone}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tipo de contenido a enviar */}
          <div>
            <label className="block text-xs text-gray-500 mb-3">¿Qué deseas enviar?</label>
            <div className="space-y-2">
              {/* Solo Audio */}
              <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition ${
                contentType === 'audio' 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-gray-900 hover:border-gray-800'
              } ${!hasAudio ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="radio"
                  name="contentType"
                  checked={contentType === 'audio'}
                  onChange={() => setContentType('audio')}
                  disabled={!hasAudio}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-blue-400" />
                    <p className="text-sm font-medium">Solo audio</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {hasAudio ? 'Envía el archivo de audio' : 'No hay audio generado'}
                  </p>
                </div>
              </label>

              {/* Solo Texto */}
              <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition ${
                contentType === 'text' 
                  ? 'border-purple-500 bg-purple-500/10' 
                  : 'border-gray-900 hover:border-gray-800'
              }`}>
                <input
                  type="radio"
                  name="contentType"
                  checked={contentType === 'text'}
                  onChange={() => setContentType('text')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <p className="text-sm font-medium">Solo texto</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Envía el contenido como mensaje
                  </p>
                </div>
              </label>

              {/* Texto + Audio */}
              <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition ${
                contentType === 'both' 
                  ? 'border-green-500 bg-green-500/10' 
                  : 'border-gray-900 hover:border-gray-800'
              } ${!hasAudio ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="radio"
                  name="contentType"
                  checked={contentType === 'both'}
                  onChange={() => setContentType('both')}
                  disabled={!hasAudio}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-green-400" />
                    <p className="text-sm font-medium">Texto + Audio</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {hasAudio ? 'Envía ambos (recomendado)' : 'Requiere audio generado'}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Opciones de envío */}
          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 border border-gray-900 rounded-lg cursor-pointer hover:border-gray-800 transition">
              <input
                type="radio"
                name="sendOption"
                checked={toSelf}
                onChange={() => setToSelf(true)}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">Enviarme a mí mismo</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Recibirás el contenido en tu WhatsApp
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 border border-gray-900 rounded-lg cursor-pointer hover:border-gray-800 transition">
              <input
                type="radio"
                name="sendOption"
                checked={!toSelf}
                onChange={() => setToSelf(false)}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">Enviar a otro número</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Comparte con cualquier número
                </p>
              </div>
            </label>
          </div>

          {/* Input para otro número */}
          {!toSelf && (
            <div className="pt-2">
              <label className="block text-xs text-gray-500 mb-2">
                Número de WhatsApp
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+52 123 456 7890"
                className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition"
              />
              <p className="text-xs text-gray-600 mt-1">
                Incluye código de país (ej: +52 para México)
              </p>
            </div>
          )}

          {/* Botón de envío */}
          <button
            onClick={handleSend}
            disabled={loading || !canSend || (contentType !== 'text' && !hasAudio)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
              canSend && !loading && (contentType === 'text' || hasAudio)
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-900 text-gray-600 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Enviar por WhatsApp
              </>
            )}
          </button>

          {/* Mensaje de ayuda */}
          {toSelf && !canSend && (
            <p className="text-xs text-center text-gray-600">
              Completa la configuración de WhatsApp para enviar
            </p>
          )}
        </div>
      </div>
    </div>
  );
}