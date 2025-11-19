import { supabase } from '../config/supabase.js';

/**
 * Generar código de verificación aleatorio
 */
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Configurar número de WhatsApp
 * POST /api/whatsapp/config
 */
export const configureWhatsApp = async (req, res) => {
  try {
    const userId = req.user.id;
    const { phone_number } = req.body;

    if (!phone_number) {
      return res.status(400).json({ error: 'phone_number es requerido' });
    }

    // Validar formato (debe empezar con +)
    if (!phone_number.startsWith('+')) {
      return res.status(400).json({ 
        error: 'Formato inválido. Debe incluir código de país (ej: +521234567890)' 
      });
    }

    // Verificar si ya existe configuración
    const { data: existing } = await supabase
      .from('whatsapp_config')
      .select('id')
      .eq('user_id', userId)
      .single();

    let data, error;

    if (existing) {
      // Actualizar
      ({ data, error } = await supabase
        .from('whatsapp_config')
        .update({
          phone_number,
          is_verified: false, // Resetear verificación
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single());
    } else {
      // Crear nuevo
      ({ data, error } = await supabase
        .from('whatsapp_config')
        .insert({
          user_id: userId,
          phone_number,
          is_verified: false
        })
        .select()
        .single());
    }

    if (error) throw error;

    return res.json({
      message: 'Configuración guardada',
      config: {
        phone_number: data.phone_number,
        is_verified: data.is_verified,
        notifications_enabled: data.notifications_enabled
      }
    });

  } catch (err) {
    console.error('configureWhatsApp error:', err);
    return res.status(500).json({ error: 'Error al configurar WhatsApp' });
  }
};

/**
 * Solicitar código de verificación
 * POST /api/whatsapp/request-verification
 */
export const requestVerification = async (req, res) => {
  try {
    const userId = req.user.id;

    // Obtener configuración
    const { data: config, error: configError } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (configError || !config) {
      return res.status(404).json({ 
        error: 'Primero configura tu número de WhatsApp' 
      });
    }

    // Generar código
    const code = generateVerificationCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Expira en 10 minutos

    // Guardar código
    const { error: updateError } = await supabase
      .from('whatsapp_config')
      .update({
        verification_code: code,
        code_expires_at: expiresAt.toISOString()
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // TODO: Aquí integrarías con la API de WhatsApp (Twilio, etc)
    // Por ahora, simulamos el envío
    console.log(`Código de verificación para ${config.phone_number}: ${code}`);

    // Registrar notificación
    await supabase
      .from('whatsapp_notifications')
      .insert({
        from_user_id: userId,
        to_phone: config.phone_number,
        message_type: 'verification',
        message_content: `Tu código de verificación es: ${code}`,
        status: 'sent' // En producción, esperarías respuesta de la API
      });

    return res.json({
      message: 'Código enviado',
      // En desarrollo, devolver código para pruebas
      debug_code: process.env.NODE_ENV === 'development' ? code : undefined
    });

  } catch (err) {
    console.error('requestVerification error:', err);
    return res.status(500).json({ error: 'Error al enviar código' });
  }
};

/**
 * Verificar código
 * POST /api/whatsapp/verify
 */
export const verifyCode = async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Código es requerido' });
    }

    // Obtener configuración
    const { data: config, error: configError } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (configError || !config) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }

    // Verificar código
    if (config.verification_code !== code) {
      return res.status(400).json({ error: 'Código incorrecto' });
    }

    // Verificar expiración
    if (new Date() > new Date(config.code_expires_at)) {
      return res.status(400).json({ error: 'Código expirado' });
    }

    // Marcar como verificado
    const { error: updateError } = await supabase
      .from('whatsapp_config')
      .update({
        is_verified: true,
        verification_code: null,
        code_expires_at: null
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    return res.json({
      message: 'Número verificado exitosamente',
      verified: true
    });

  } catch (err) {
    console.error('verifyCode error:', err);
    return res.status(500).json({ error: 'Error al verificar código' });
  }
};

/**
 * Toggle notificaciones
 * PUT /api/whatsapp/notifications
 */
export const toggleNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { enabled } = req.body;

    const { data, error } = await supabase
      .from('whatsapp_config')
      .update({
        notifications_enabled: enabled
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return res.json({
      message: 'Configuración actualizada',
      notifications_enabled: data.notifications_enabled
    });

  } catch (err) {
    console.error('toggleNotifications error:', err);
    return res.status(500).json({ error: 'Error al actualizar notificaciones' });
  }
};

/**
 * Obtener configuración de WhatsApp
 * GET /api/whatsapp/config
 */
export const getWhatsAppConfig = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('whatsapp_config')
      .select('phone_number, is_verified, notifications_enabled')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return res.json(data || {
      phone_number: null,
      is_verified: false,
      notifications_enabled: false
    });

  } catch (err) {
    console.error('getWhatsAppConfig error:', err);
    return res.status(500).json({ error: 'Error al obtener configuración' });
  }
};

/**
 * Enviar audio por WhatsApp
 * POST /api/whatsapp/send-audio
 */
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
      // Enviar a mí mismo
      const { data: myConfig } = await supabase
        .from('whatsapp_config')
        .select('phone_number, is_verified')
        .eq('user_id', userId)
        .single();

      if (!myConfig || !myConfig.is_verified) {
        return res.status(400).json({ 
          error: 'Primero verifica tu número de WhatsApp' 
        });
      }

      targetPhone = myConfig.phone_number;
    } else {
      if (!to_phone) {
        return res.status(400).json({ error: 'to_phone es requerido' });
      }
      targetPhone = to_phone;
    }

    // Construir URL completa del audio
    const baseUrl = process.env.API_URL?.replace('/api', '') || 'http://localhost:3000';
    const audioUrl = `${baseUrl}${text.audio_url}`;

    // TODO: Integrar con API de WhatsApp real
    // Por ahora, simulamos
    const message = `🎧 Audio: "${text.title}"\n\nEscucha aquí: ${audioUrl}`;
    
    console.log(`Enviando a ${targetPhone}: ${message}`);

    // Registrar notificación
    await supabase
      .from('whatsapp_notifications')
      .insert({
        from_user_id: userId,
        to_phone: targetPhone,
        text_id: text_id,
        message_type: 'audio',
        message_content: message,
        status: 'sent'
      });

    return res.json({
      message: 'Audio enviado por WhatsApp',
      to: targetPhone
    });

  } catch (err) {
    console.error('sendAudio error:', err);
    return res.status(500).json({ error: 'Error al enviar audio' });
  }
};