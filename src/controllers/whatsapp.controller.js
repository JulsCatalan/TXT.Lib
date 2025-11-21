import { supabase } from '../config/supabase.js';
import { kapso } from '../config/kapso.js';

/* ========================================
   HELPER: Manejar errores de Kapso/WhatsApp
======================================== */
const handleKapsoError = (error) => {
  console.error('Error enviando por Kapso:', error);

  // Error de ventana de 24 horas
  if (error.raw?.error?.includes('24-hour window') || 
      error.message?.includes('24-hour window')) {
    return {
      code: 'SESSION_EXPIRED',
      message: 'Tu sesión de WhatsApp expiró. Envía "hola" al número de TXT.Audio en WhatsApp para reactivarla.',
      userFriendly: true
    };
  }

  // Error de número inválido
  if (error.raw?.error?.includes('invalid phone') || 
      error.code === 400) {
    return {
      code: 'INVALID_PHONE',
      message: 'El número de teléfono no es válido. Verifica que incluya el código de país.',
      userFriendly: true
    };
  }

  // Error de audio no accesible
  if (error.raw?.error?.includes('unable to download') || 
      error.raw?.error?.includes('media')) {
    return {
      code: 'AUDIO_NOT_ACCESSIBLE',
      message: 'No se pudo acceder al archivo de audio. Intenta regenerar el audio.',
      userFriendly: true
    };
  }

  // Error de rate limit
  if (error.httpStatus === 429) {
    return {
      code: 'RATE_LIMIT',
      message: 'Demasiados mensajes enviados. Espera unos minutos e intenta de nuevo.',
      userFriendly: true
    };
  }

  // Error genérico
  return {
    code: 'UNKNOWN',
    message: 'Error al enviar por WhatsApp. Intenta de nuevo más tarde.',
    userFriendly: false
  };
};

/* ========================================
   ENVIAR SOLO AUDIO POR WHATSAPP
======================================== */
export const sendAudio = async (req, res) => {
  try {
    const userId = req.user.id;
    const { text_id, to_phone, to_self } = req.body;

    if (!text_id) {
      return res.status(400).json({ error: 'text_id es requerido' });
    }

    // Obtener texto y audio
    const { data: text, error: textError } = await supabase
      .from('texts')
      .select('id, title, audio_url')
      .eq('id', text_id)
      .single();

    if (textError || !text || !text.audio_url) {
      return res.status(404).json({ error: 'Texto o audio no encontrado' });
    }

    let targetPhone;

    if (to_self) {
      const { data: userData } = await supabase
        .from('users')
        .select('phone_number, whatsapp_verified')
        .eq('id', userId)
        .single();

      if (!userData || !userData.whatsapp_verified) {
        return res.status(400).json({ 
          error: 'Primero verifica tu número de WhatsApp en tu perfil' 
        });
      }

      targetPhone = userData.phone_number;
    } else {
      if (!to_phone) {
        return res.status(400).json({ error: 'to_phone es requerido' });
      }
      targetPhone = to_phone;
    }

    const baseUrl = process.env.BASE_URL || process.env.API_URL;
    const audioUrl = `${baseUrl}${text.audio_url}`;

    console.log('📱 Audio URL para WhatsApp:', audioUrl);

    const isDevelopment = process.env.NODE_ENV === 'development';
    
    try {
      if (!isDevelopment) {
        await kapso.messages.sendAudio({
          phoneNumberId: process.env.KAPSO_PHONE_SANDBOX,
          to: targetPhone,
          audio: {
            link: audioUrl
          }
        });
      } else {
        console.log(`[DEV] Enviando audio a ${targetPhone}: ${text.title}`);
        console.log(`[DEV] URL: ${audioUrl}`);
      }
    } catch (kapsoError) {
      const errorInfo = handleKapsoError(kapsoError);
      return res.status(422).json({ 
        error: errorInfo.message,
        code: errorInfo.code
      });
    }

    await supabase
      .from('whatsapp_notifications')
      .insert({
        from_user_id: userId,
        to_phone: targetPhone,
        text_id: text_id,
        message_type: 'audio',
        message_content: `Audio: ${text.title}`,
        status: 'sent'
      });

    return res.json({
      success: true,
      message: 'Audio enviado por WhatsApp',
      to: targetPhone
    });

  } catch (err) {
    console.error('sendAudio error:', err);
    return res.status(500).json({ error: err.message || 'Error al enviar audio' });
  }
};

/* ========================================
   ENVIAR SOLO TEXTO POR WHATSAPP
======================================== */
export const sendText = async (req, res) => {
  try {
    const userId = req.user.id;
    const { text_id, to_phone, to_self } = req.body;

    if (!text_id) {
      return res.status(400).json({ error: 'text_id es requerido' });
    }

    const { data: text, error: textError } = await supabase
      .from('texts')
      .select('id, title, content, category')
      .eq('id', text_id)
      .single();

    if (textError || !text) {
      return res.status(404).json({ error: 'Texto no encontrado' });
    }

    let targetPhone;

    if (to_self) {
      const { data: userData } = await supabase
        .from('users')
        .select('phone_number, whatsapp_verified')
        .eq('id', userId)
        .single();

      if (!userData || !userData.whatsapp_verified) {
        return res.status(400).json({ 
          error: 'Primero verifica tu número de WhatsApp en tu perfil' 
        });
      }

      targetPhone = userData.phone_number;
    } else {
      if (!to_phone) {
        return res.status(400).json({ error: 'to_phone es requerido' });
      }
      targetPhone = to_phone;
    }

    let message = `📝 *${text.title}*\n\n`;
    if (text.category) {
      message += `_Categoría: ${text.category}_\n\n`;
    }
    message += text.content;

    const isDevelopment = process.env.NODE_ENV === 'development';
    
    try {
      if (!isDevelopment) {
        await kapso.messages.sendText({
          phoneNumberId: process.env.KAPSO_PHONE_SANDBOX,
          to: targetPhone,
          body: message
        });
      } else {
        console.log(`[DEV] Enviando texto a ${targetPhone}:\n${message}`);
      }
    } catch (kapsoError) {
      const errorInfo = handleKapsoError(kapsoError);
      return res.status(422).json({ 
        error: errorInfo.message,
        code: errorInfo.code
      });
    }

    await supabase
      .from('whatsapp_notifications')
      .insert({
        from_user_id: userId,
        to_phone: targetPhone,
        text_id: text_id,
        message_type: 'text',
        message_content: message,
        status: 'sent'
      });

    return res.json({
      success: true,
      message: 'Texto enviado por WhatsApp',
      to: targetPhone
    });

  } catch (err) {
    console.error('sendText error:', err);
    return res.status(500).json({ error: err.message || 'Error al enviar texto' });
  }
};

/* ========================================
   ENVIAR TEXTO + AUDIO POR WHATSAPP
======================================== */
export const sendTextAndAudio = async (req, res) => {
  try {
    const userId = req.user.id;
    const { text_id, to_phone, to_self } = req.body;

    if (!text_id) {
      return res.status(400).json({ error: 'text_id es requerido' });
    }

    const { data: text, error: textError } = await supabase
      .from('texts')
      .select('id, title, content, audio_url, category')
      .eq('id', text_id)
      .single();

    if (textError || !text) {
      return res.status(404).json({ error: 'Texto no encontrado' });
    }

    if (!text.audio_url) {
      return res.status(400).json({ error: 'Este texto no tiene audio generado' });
    }

    let targetPhone;

    if (to_self) {
      const { data: userData } = await supabase
        .from('users')
        .select('phone_number, whatsapp_verified')
        .eq('id', userId)
        .single();

      if (!userData || !userData.whatsapp_verified) {
        return res.status(400).json({ 
          error: 'Primero verifica tu número de WhatsApp en tu perfil' 
        });
      }

      targetPhone = userData.phone_number;
    } else {
      if (!to_phone) {
        return res.status(400).json({ error: 'to_phone es requerido' });
      }
      targetPhone = to_phone;
    }

    const baseUrl = process.env.BASE_URL || process.env.API_URL?.replace('/api', '') || 'http://localhost:3000';
    const audioUrl = `${baseUrl}${text.audio_url}`;

    console.log('📱 Audio URL para WhatsApp:', audioUrl);

    let textMessage = `📝 *${text.title}*\n\n`;
    if (text.category) {
      textMessage += `_Categoría: ${text.category}_\n\n`;
    }
    textMessage += text.content;

    const isDevelopment = process.env.NODE_ENV === 'development';
    
    try {
      if (!isDevelopment) {
        await kapso.messages.sendText({
          phoneNumberId: process.env.KAPSO_PHONE_SANDBOX,
          to: targetPhone,
          body: textMessage
        });

        await kapso.messages.sendAudio({
          phoneNumberId: process.env.KAPSO_PHONE_SANDBOX,
          to: targetPhone,
          audio: {
            link: audioUrl
          }
        });
      } else {
        console.log(`[DEV] Enviando texto + audio a ${targetPhone}:`);
        console.log(`Texto:\n${textMessage}`);
        console.log(`Audio: ${audioUrl}`);
      }
    } catch (kapsoError) {
      const errorInfo = handleKapsoError(kapsoError);
      return res.status(422).json({ 
        error: errorInfo.message,
        code: errorInfo.code
      });
    }

    await supabase
      .from('whatsapp_notifications')
      .insert({
        from_user_id: userId,
        to_phone: targetPhone,
        text_id: text_id,
        message_type: 'text_and_audio',
        message_content: `Texto y audio: ${text.title}`,
        status: 'sent'
      });

    return res.json({
      success: true,
      message: 'Texto y audio enviados por WhatsApp',
      to: targetPhone
    });

  } catch (err) {
    console.error('sendTextAndAudio error:', err);
    return res.status(500).json({ error: err.message || 'Error al enviar texto y audio' });
  }
};

/* ========================================
   OBTENER CONFIGURACIÓN DE WHATSAPP
======================================== */
export const getWhatsAppConfig = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: userData } = await supabase
      .from('users')
      .select('phone_number, whatsapp_verified, whatsapp_notifications_enabled')
      .eq('id', userId)
      .single();

    return res.json({
      phone_number: userData?.phone_number || null,
      is_verified: userData?.whatsapp_verified || false,
      notifications_enabled: userData?.whatsapp_notifications_enabled || false
    });

  } catch (err) {
    console.error('getWhatsAppConfig error:', err);
    return res.status(500).json({ error: 'Error al obtener configuración' });
  }
};