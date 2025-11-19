'use client';

import { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { sendAudio, getWhatsAppConfig } from '../utils/api'; // tus funciones API

interface ShareWhatsAppModalProps {
  textId: string;
  textTitle: string;
  onClose: () => void;
}

export default function ShareWhatsAppModal({ textId, textTitle, onClose }: ShareWhatsAppModalProps) {
  const [toSelf, setToSelf] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // Obtener configuración del usuario
    getWhatsAppConfig().then(config => {
      setPhoneNumber(config.phone_number || '');
      setVerified(config.is_verified || false);
    });
  }, []);

  const handleSend = async () => {
    if (!toSelf && !phoneNumber) {
      alert('Ingresa un número de WhatsApp válido');
      return;
    }

    setLoading(true);
    try {
      await sendAudio({
        text_id: textId,
        to_self: toSelf,
        to_phone: toSelf ? undefined : phoneNumber
      });
      alert('Audio enviado por WhatsApp');
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al enviar audio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-black p-6 rounded-2xl w-full max-w-md space-y-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2">
          <X className="w-5 h-5 text-gray-400" />
        </button>
        <h2 className="text-lg font-semibold">{textTitle}</h2>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={toSelf}
              onChange={() => setToSelf(true)}
            />
            Enviarme el audio a mí mismo
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={!toSelf}
              onChange={() => setToSelf(false)}
            />
            Compartir el audio con otro usuario
          </label>
          {!toSelf && (
            <input
              type="text"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              placeholder="+521234567890"
              className="w-full px-3 py-2 rounded-lg border border-gray-700 bg-gray-900 text-white"
            />
          )}
        </div>

        {!verified && toSelf && (
          <div className="text-yellow-400 text-sm">
            Tu número aún no está verificado. Primero verifica tu número en la configuración de WhatsApp.
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={loading || (toSelf && !verified)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition text-white font-medium"
        >
          <Send className="w-4 h-4" />
          {loading ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </div>
  );
}
