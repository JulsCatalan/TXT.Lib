// controllers/usersController.js
import { supabase } from '../config/supabase.js';
import { kapso } from '../config/kapso.js';

export const searchUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.json([]);
    }

    // Buscar usuarios que coincidan con el query (excluyendo al usuario actual)
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email')
      .ilike('username', `%${q}%`)
      .neq('id', userId)
      .limit(5);

    if (error) throw error;

    return res.json(data);
  } catch (err) {
    console.error('searchUsers error:', err);
    return res.status(500).json({ error: 'Error al buscar usuarios' });
  }
};

/* ========================================
   OBTENER PERFIL DEL USUARIO
======================================== */
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Obtener datos del usuario
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, email, phone_number, whatsapp_number, whatsapp_verified, whatsapp_notifications_enabled, created_at')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Obtener estadísticas básicas del usuario
    const [
      { count: textsCount },
      { count: favoritesCount },
      { count: sharedCount }
    ] = await Promise.all([
      supabase.from('texts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('shared_texts').select('id', { count: 'exact', head: true }).eq('shared_by_user_id', userId)
    ]);

    return res.json({
      user: userData,
      stats: {
        texts_created: textsCount || 0,
        favorites: favoritesCount || 0,
        texts_shared: sharedCount || 0
      }
    });

  } catch (err) {
    console.error('Get user profile error:', err);
    return res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

/* ========================================
   ACTUALIZAR NÚMERO DE TELÉFONO
======================================== */
export const updatePhoneNumber = async (req, res) => {
  try {
    const userId = req.user.id;
    const { phone_number } = req.body;

    if (!phone_number) {
      return res.status(400).json({ error: 'Número de teléfono es requerido' });
    }

    // Validar formato básico (solo números, +, -, espacios)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(phone_number)) {
      return res.status(400).json({ error: 'Formato de teléfono inválido' });
    }

    // Limpiar el número (quitar espacios y guiones)
    const cleanPhone = phone_number.replace(/[\s\-\(\)]/g, '');

    // Verificar si el número ya está en uso por otro usuario
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('phone_number', cleanPhone)
      .neq('id', userId)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'Este número ya está registrado' });
    }

    // Actualizar el número de teléfono y WhatsApp
    // Si cambia el número, resetear verificación
    const { data: currentUser } = await supabase
      .from('users')
      .select('phone_number')
      .eq('id', userId)
      .single();

    const phoneChanged = currentUser?.phone_number !== cleanPhone;

    const { error: updateError } = await supabase
      .from('users')
      .update({
        phone_number: cleanPhone,
        whatsapp_number: cleanPhone,
        ...(phoneChanged && {
          whatsapp_verified: false,
          whatsapp_notifications_enabled: false
        })
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    return res.json({ 
      success: true, 
      message: 'Número actualizado correctamente',
      phone_changed: phoneChanged
    });

  } catch (err) {
    console.error('Update phone error:', err);
    return res.status(500).json({ error: 'Error al actualizar número' });
  }
};

/* ========================================
   SOLICITAR CÓDIGO DE VERIFICACIÓN
======================================== */
export const requestVerificationCode = async (req, res) => {
  try {
    const userId = req.user.id;

    // Obtener número de teléfono del usuario
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('phone_number, whatsapp_number, whatsapp_verified')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (!userData.phone_number && !userData.whatsapp_number) {
      return res.status(400).json({ error: 'Primero debes agregar un número de teléfono' });
    }

    if (userData.whatsapp_verified) {
      return res.status(400).json({ error: 'Tu número ya está verificado' });
    }

    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    const phoneToVerify = userData.whatsapp_number || userData.phone_number;

    // Guardar en whatsapp_config
    const { error: configError } = await supabase
      .from('whatsapp_config')
      .upsert({
        user_id: userId,
        phone_number: phoneToVerify,
        verification_code: code,
        code_expires_at: expiresAt.toISOString(),
        is_verified: false
      }, {
        onConflict: 'user_id'
      });

    if (configError) throw configError;
    
    try {
        await kapso.messages.sendText({
          phoneNumberId: process.env.KAPSO_PHONE_SANDBOX,
          to: phoneToVerify,
          body: `Tu código de verificación para TXT.Lib es: ${code}\n\nEste código expira en 10 minutos.`
        });
    } catch (kapsoError) {
      console.error('Error enviando WhatsApp:', kapsoError);
      // No falla la petición si Kapso falla, pero lo registramos
    }

    return res.json({ 
      success: true, 
      message: 'Código de verificación enviado',
      phone: phoneToVerify,
    });

  } catch (err) {
    console.error('Request verification code error:', err);
    return res.status(500).json({ error: 'Error al enviar código de verificación' });
  }
};

/* ========================================
   VERIFICAR CÓDIGO
======================================== */
export const verifyCode = async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Código es requerido' });
    }

    // Obtener código guardado
    const { data: configData, error: configError } = await supabase
      .from('whatsapp_config')
      .select('verification_code, code_expires_at, phone_number')
      .eq('user_id', userId)
      .single();

    if (configError || !configData) {
      return res.status(404).json({ error: 'No se encontró código de verificación' });
    }

    // Verificar si el código expiró
    if (new Date() > new Date(configData.code_expires_at)) {
      return res.status(400).json({ error: 'El código ha expirado. Solicita uno nuevo' });
    }

    // Verificar código
    if (configData.verification_code !== code) {
      return res.status(400).json({ error: 'Código incorrecto' });
    }

    // Actualizar como verificado
    await Promise.all([
      supabase
        .from('whatsapp_config')
        .update({
          is_verified: true,
          verification_code: null,
          code_expires_at: null
        })
        .eq('user_id', userId),
      
      supabase
        .from('users')
        .update({
          whatsapp_verified: true,
          whatsapp_notifications_enabled: true
        })
        .eq('id', userId)
    ]);

    return res.json({ 
      success: true, 
      message: 'Número verificado correctamente' 
    });

  } catch (err) {
    console.error('Verify code error:', err);
    return res.status(500).json({ error: 'Error al verificar código' });
  }
};

/* ========================================
   TOGGLE NOTIFICACIONES DE WHATSAPP
======================================== */
export const toggleWhatsAppNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'El campo enabled debe ser booleano' });
    }

    // Verificar que el usuario tenga el número verificado
    const { data: userData } = await supabase
      .from('users')
      .select('whatsapp_verified')
      .eq('id', userId)
      .single();

    if (!userData?.whatsapp_verified && enabled) {
      return res.status(400).json({ 
        error: 'Primero debes verificar tu número de WhatsApp' 
      });
    }

    // Actualizar preferencia
    const { error: updateError } = await supabase
      .from('users')
      .update({ whatsapp_notifications_enabled: enabled })
      .eq('id', userId);

    if (updateError) throw updateError;

    // También actualizar en whatsapp_config
    await supabase
      .from('whatsapp_config')
      .update({ notifications_enabled: enabled })
      .eq('user_id', userId);

    return res.json({ 
      success: true, 
      message: enabled 
        ? 'Notificaciones activadas' 
        : 'Notificaciones desactivadas' 
    });

  } catch (err) {
    console.error('Toggle notifications error:', err);
    return res.status(500).json({ error: 'Error al actualizar notificaciones' });
  }
};

/* ========================================
   ELIMINAR NÚMERO DE TELÉFONO
======================================== */
export const removePhoneNumber = async (req, res) => {
  try {
    const userId = req.user.id;

    // Actualizar usuario
    const { error: updateError } = await supabase
      .from('users')
      .update({
        phone_number: null,
        whatsapp_number: null,
        whatsapp_verified: false,
        whatsapp_notifications_enabled: false
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Eliminar configuración de WhatsApp
    await supabase
      .from('whatsapp_config')
      .delete()
      .eq('user_id', userId);

    return res.json({ 
      success: true, 
      message: 'Número eliminado correctamente' 
    });

  } catch (err) {
    console.error('Remove phone error:', err);
    return res.status(500).json({ error: 'Error al eliminar número' });
  }
};