import { supabase } from '../config/supabase.js';

export const addFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { text_id } = req.body;

    if (!text_id) {
      return res.status(400).json({ error: 'text_id es requerido' });
    }

    // Verificar que el texto existe
    const { data: text, error: textError } = await supabase
      .from('texts')
      .select('id, title')
      .eq('id', text_id)
      .single();

    if (textError || !text) {
      return res.status(404).json({ error: 'Texto no encontrado' });
    }

    // Agregar a favoritos (unique constraint evita duplicados)
    const { data, error } = await supabase
      .from('favorites')
      .insert({
        text_id,
        user_id: userId
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Ya está en favoritos' });
      }
      throw error;
    }

    return res.status(201).json({
      message: 'Agregado a favoritos',
      favorite: data
    });

  } catch (err) {
    console.error('addFavorite error:', err);
    return res.status(500).json({ error: 'Error al agregar favorito' });
  }
};

export const removeFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { textId } = req.params;

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('text_id', textId)
      .eq('user_id', userId);

    if (error) throw error;

    return res.json({
      message: 'Removido de favoritos'
    });

  } catch (err) {
    console.error('removeFavorite error:', err);
    return res.status(500).json({ error: 'Error al remover favorito' });
  }
};

export const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('favorites')
      .select(`
        id,
        created_at,
        texts (
          id,
          title,
          content,
          category,
          audio_url,
          audio_generated,
          word_count,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Formatear respuesta
    const formatted = data.map(item => ({
      favorite_id: item.id,
      favorited_at: item.created_at,
      text: item.texts
    }));

    return res.json(formatted);

  } catch (err) {
    console.error('getFavorites error:', err);
    return res.status(500).json({ error: 'Error al obtener favoritos' });
  }
};

export const checkFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { textId } = req.params;

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('text_id', textId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return res.json({
      is_favorite: !!data
    });

  } catch (err) {
    console.error('checkFavorite error:', err);
    return res.status(500).json({ error: 'Error al verificar favorito' });
  }
};