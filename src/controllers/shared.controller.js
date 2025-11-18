import { supabase } from '../config/supabase.js';

/**
 * Obtener textos compartidos conmigo
 * GET /api/shared/received
 */
export const getSharedWithMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('shared_texts')
      .select(`
        id,
        can_edit,
        shared_at,
        text_id,
        shared_by_user_id,
        texts (
          id,
          title,
          content,
          audio_url,
          audio_generated,
          category,
          word_count,
          created_at
        ),
        shared_by:users!shared_by_user_id (
          id,
          username,
          email
        )
      `)
      .eq('shared_with_user_id', userId)
      .order('shared_at', { ascending: false });

    if (error) throw error;

    // Formatear respuesta
    const formattedData = data.map(item => ({
      share_id: item.id,
      can_edit: item.can_edit,
      shared_at: item.shared_at,
      shared_by: {
        id: item.shared_by.id,
        username: item.shared_by.username,
        email: item.shared_by.email
      },
      text: {
        id: item.texts.id,
        title: item.texts.title,
        content: item.texts.content,
        audio_url: item.texts.audio_url,
        audio_generated: item.texts.audio_generated,
        category: item.texts.category,
        word_count: item.texts.word_count,
        created_at: item.texts.created_at
      }
    }));

    return res.json(formattedData);

  } catch (err) {
    console.error('getSharedWithMe error:', err);
    return res.status(500).json({ error: 'Error al obtener textos compartidos' });
  }
};

/**
 * Obtener textos que yo he compartido
 * GET /api/shared/sent
 */
export const getSharedByMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('shared_texts')
      .select(`
        id,
        can_edit,
        shared_at,
        text_id,
        shared_with_user_id,
        texts (
          id,
          title,
          content,
          category,
          word_count
        ),
        shared_with:users!shared_with_user_id (
          id,
          username,
          email
        )
      `)
      .eq('shared_by_user_id', userId)
      .order('shared_at', { ascending: false });

    if (error) throw error;

    // Formatear respuesta
    const formattedData = data.map(item => ({
      share_id: item.id,
      can_edit: item.can_edit,
      shared_at: item.shared_at,
      shared_with: {
        id: item.shared_with.id,
        username: item.shared_with.username,
        email: item.shared_with.email
      },
      text: {
        id: item.texts.id,
        title: item.texts.title,
        content: item.texts.content,
        category: item.texts.category,
        word_count: item.texts.word_count
      }
    }));

    return res.json(formattedData);

  } catch (err) {
    console.error('getSharedByMe error:', err);
    return res.status(500).json({ error: 'Error al obtener textos compartidos' });
  }
};


export const shareText = async (req, res) => {
  try {
    const userId = req.user.id;
    const { text_id, shared_with_user_id } = req.body;

    // Validaciones
    if (!text_id || !shared_with_user_id) {
      return res.status(400).json({ 
        error: 'text_id y shared_with_user_id son requeridos' 
      });
    }

    // Verificar que el texto existe y pertenece al usuario
    const { data: text, error: textError } = await supabase
      .from('texts')
      .select('id, user_id, title')
      .eq('id', text_id)
      .eq('user_id', userId)
      .single();

    if (textError || !text) {
      return res.status(404).json({ 
        error: 'Texto no encontrado o no tienes permisos' 
      });
    }

    // Verificar que el usuario con quien se va a compartir existe
    const { data: sharedWithUser, error: userError } = await supabase
      .from('users')
      .select('id, username, email')
      .eq('id', shared_with_user_id)
      .single();

    if (userError || !sharedWithUser) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado' 
      });
    }

    // No puedes compartir contigo mismo
    if (sharedWithUser.id === userId) {
      return res.status(400).json({ 
        error: 'No puedes compartir un texto contigo mismo' 
      });
    }

    // Verificar si ya está compartido
    const { data: existing } = await supabase
      .from('shared_texts')
      .select('id')
      .eq('text_id', text_id)
      .eq('shared_with_user_id', sharedWithUser.id)
      .single();

    if (existing) {
      return res.status(400).json({ 
        error: 'Este texto ya está compartido con este usuario' 
      });
    }

    // Crear registro de compartido
    const { data: shared, error: shareError } = await supabase
      .from('shared_texts')
      .insert([{
        text_id,
        shared_with_user_id: sharedWithUser.id,
        shared_by_user_id: userId,
      }])
      .select()
      .single();

    if (shareError) throw shareError;

    return res.status(201).json({
      message: 'Texto compartido exitosamente',
      share: {
        id: shared.id,
        text_id: text_id,
        text_title: text.title,
        shared_with: {
          id: sharedWithUser.id,
          username: sharedWithUser.username,
          email: sharedWithUser.email
        },
        shared_at: shared.shared_at
      }
    });

  } catch (err) {
    console.error('shareText error:', err);
    return res.status(500).json({ error: 'Error al compartir texto' });
  }
};

export const shareWithMultiple = async (req, res) => {
  try {
    const userId = req.user.id;
    const { text_id, usernames } = req.body;

    console.log(req.body);

    if (!text_id || !Array.isArray(usernames) || usernames.length === 0) {
      return res.status(400).json({ 
        error: 'text_id y usernames (array) son requeridos' 
      });
    }

    // Verificar que el texto existe
    const { data: text, error: textError } = await supabase
      .from('texts')
      .select('id, title')
      .eq('id', text_id)
      .eq('user_id', userId)
      .single();

    if (textError || !text) {
      return res.status(404).json({ 
        error: 'Texto no encontrado o no tienes permisos' 
      });
    }

    // Buscar usuarios por username
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username')
      .in('username', usernames);

    if (usersError) throw usersError;

    if (!users.length) {
      return res.status(404).json({ 
        error: 'No se encontraron usuarios válidos' 
      });
    }

    // Filtrar el usuario actual
    const validUsers = users.filter(u => u.id !== userId);

    let created = 0;
    let duplicates = 0;

    for (const user of validUsers) {
      const { error } = await supabase
        .from('shared_texts')
        .insert({
          text_id,
          shared_with_user_id: user.id,
          shared_by_user_id: userId,
        });

      if (error) {
        if (error.code === "23505") {
          duplicates++;
          continue;
        }
        console.error("Insert error:", error);
        continue;
      }

      created++;
    }

    return res.status(201).json({
      message: `Compartido con ${created} usuarios. ${duplicates} ya tenían acceso.`,
      shares_created: created,
      duplicates,
      total_requested: validUsers.length,
      usernames_attempted: usernames
    });

  } catch (err) {
    console.error('shareWithMultiple error:', err);
    return res.status(500).json({ error: 'Error al compartir texto' });
  }
};

export const unshareText = async (req, res) => {
  try {
    const userId = req.user.id;
    const shareId = req.params.shareId;

    if (!shareId || typeof shareId !== "string") {
      return res.status(400).json({ error: "shareId inválido" });
    }

    // Buscar el registro y validar permisos
    const { data: share, error: getError } = await supabase
      .from('shared_texts')
      .select('id')
      .eq('id', shareId)
      .eq('shared_by_user_id', userId)
      .single();

    if (getError || !share) {
      return res.status(404).json({
        error: 'No encontrado o no tienes permisos'
      });
    }

    // Eliminar
    const { error: deleteError } = await supabase
      .from('shared_texts')
      .delete()
      .eq('id', shareId);

    if (deleteError) throw deleteError;

    return res.json({
      message: 'Acceso revocado exitosamente',
      share_id: shareId
    });

  } catch (err) {
    console.error('unshareText error:', err);
    return res.status(500).json({ error: 'Error al revocar acceso' });
  }
};

/**
 * Obtener usuarios con quienes he compartido un texto específico
 * GET /api/shared/text/:textId/users
 */
export const getTextSharedUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { textId } = req.params;

    // Verificar que el texto pertenece al usuario
    const { data: text, error: textError } = await supabase
      .from('texts')
      .select('id, title')
      .eq('id', textId)
      .eq('user_id', userId)
      .single();

    if (textError || !text) {
      return res.status(404).json({ 
        error: 'Texto no encontrado o no tienes permisos' 
      });
    }

    // Obtener usuarios con quienes está compartido
    const { data, error } = await supabase
      .from('shared_texts')
      .select(`
        id,
        can_edit,
        shared_at,
        users!shared_with_user_id (
          id,
          username,
          email
        )
      `)
      .eq('text_id', textId)
      .eq('shared_by_user_id', userId);

    if (error) throw error;

    return res.json({
      text: {
        id: text.id,
        title: text.title
      },
      shared_with: data.map(item => ({
        share_id: item.id,
        can_edit: item.can_edit,
        shared_at: item.shared_at,
        user: {
          id: item.users.id,
          username: item.users.username,
          email: item.users.email
        }
      }))
    });

  } catch (err) {
    console.error('getTextSharedUsers error:', err);
    return res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};