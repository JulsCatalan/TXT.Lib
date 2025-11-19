import { supabase } from '../config/supabase.js';

/**
 * Obtener textos recomendados para el usuario
 * Basado en categorías de textos que ha leído/reproducido
 * GET /api/recommendations
 */
export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    // Obtener categorías de textos que el usuario ha reproducido
    const { data: playedTexts, error: playError } = await supabase
      .from('audio_analytics')
      .select(`
        texts (
          category
        )
      `)
      .eq('user_id', userId);

    if (playError) throw playError;

    // Extraer categorías únicas
    const categories = [...new Set(
      playedTexts
        .map(item => item.texts?.category)
        .filter(Boolean)
    )];

    if (categories.length === 0) {
      // Si no ha reproducido nada, recomendar textos populares
      const { data, error } = await supabase
        .from('text_stats')
        .select(`
          id,
          title,
          texts!inner (
            id,
            title,
            content,
            category,
            audio_url,
            audio_generated,
            word_count,
            created_at,
            user_id,
            users (
              username
            )
          ),
          play_count,
          favorite_count
        `)
        .neq('texts.user_id', userId) // No recomendar sus propios textos
        .eq('texts.audio_generated', true)
        .order('play_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return res.json(data || []);
    }

    // Recomendar textos de las mismas categorías
    const { data, error } = await supabase
      .from('texts')
      .select(`
        id,
        title,
        content,
        category,
        audio_url,
        audio_generated,
        word_count,
        created_at,
        users (
          username
        )
      `)
      .in('category', categories)
      .neq('user_id', userId) // No recomendar sus propios textos
      .eq('audio_generated', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return res.json(data || []);

  } catch (err) {
    console.error('getRecommendations error:', err);
    return res.status(500).json({ error: 'Error al obtener recomendaciones' });
  }
};

/**
 * Obtener textos similares a uno específico
 * GET /api/recommendations/similar/:textId
 */
export const getSimilarTexts = async (req, res) => {
  try {
    const { textId } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    // Usar la función SQL que creamos
    const { data, error } = await supabase
      .rpc('get_similar_texts', {
        p_text_id: textId,
        p_limit: limit
      });

    if (error) throw error;

    // Enriquecer con información del autor
    const textIds = data.map(t => t.id);
    
    const { data: enriched, error: enrichError } = await supabase
      .from('texts')
      .select(`
        id,
        title,
        content,
        category,
        audio_url,
        word_count,
        users (
          username
        )
      `)
      .in('id', textIds);

    if (enrichError) throw enrichError;

    return res.json(enriched || []);

  } catch (err) {
    console.error('getSimilarTexts error:', err);
    return res.status(500).json({ error: 'Error al obtener textos similares' });
  }
};

/**
 * Obtener textos compartidos no reproducidos (con badge "Nuevo")
 * GET /api/recommendations/unplayed-shared
 */
export const getUnplayedShared = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('shared_texts')
      .select(`
        id,
        shared_at,
        has_been_played,
        texts (
          id,
          title,
          content,
          category,
          audio_url,
          audio_generated,
          word_count
        ),
        shared_by:users!shared_by_user_id (
          username
        )
      `)
      .eq('shared_with_user_id', userId)
      .eq('has_been_played', false)
      .order('shared_at', { ascending: false });

    if (error) throw error;

    const formatted = data.map(item => ({
      share_id: item.id,
      shared_at: item.shared_at,
      is_new: true,
      shared_by: item.shared_by.username,
      text: item.texts
    }));

    return res.json(formatted);

  } catch (err) {
    console.error('getUnplayedShared error:', err);
    return res.status(500).json({ error: 'Error al obtener compartidos no reproducidos' });
  }
};