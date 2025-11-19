import { supabase } from '../config/supabase.js';

export const getFullAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    /* =============================
       1. TEXTOS: creados & compartidos
    ============================== */
    const [
      createdTexts,
      sharedByMe,
      sharedWithMe
    ] = await Promise.all([
      supabase.from('texts').select('id').eq('user_id', userId),
      supabase.from('shared_texts').select('id').eq('shared_by_user_id', userId),
      supabase.from('shared_texts').select('id').eq('shared_with_user_id', userId)
    ]);

    /* =============================
       2. AUDIO: total generados + tiempo
    ============================== */
    const { data: audioGenerated } = await supabase
      .from('texts')
      .select('word_count')
      .eq('user_id', userId)
      .eq('audio_generated', true);

    let totalSeconds = 0;
    if (audioGenerated?.length) {
      totalSeconds = audioGenerated.reduce((acc, t) => acc + ((t.word_count / 150) * 60), 0);
    }

    /* ============ Formato tiempo total ============ */
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    /* =============================
       3. TEXTOS POR MES (últimos 6)
    ============================== */
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: textsLast6 } = await supabase
      .from('texts')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: true });

    const monthCounts = {};
    (textsLast6 || []).forEach(t => {
      const d = new Date(t.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[key] = (monthCounts[key] || 0) + 1;
    });

    const textsByMonth = Object.entries(monthCounts).map(([month, count]) => ({ month, count }));

    /* =============================
       4. TOP 5 TEXTOS MÁS REPRODUCIDOS
    ============================== */
    // Usar audio_analytics para calcular los más reproducidos
    const { data: playCountsData } = await supabase
      .from('audio_analytics')
      .select('text_id')
      .eq('user_id', userId);

    // Contar reproducciones por texto
    const playCountsByText = {};
    (playCountsData || []).forEach(p => {
      playCountsByText[p.text_id] = (playCountsByText[p.text_id] || 0) + 1;
    });

    // Obtener los top 5 text_ids
    const topTextIds = Object.entries(playCountsByText)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([textId]) => textId);

    // Obtener detalles de esos textos
    let topTexts = [];
    if (topTextIds.length > 0) {
      const { data: textsData } = await supabase
        .from('texts')
        .select('id, title, category')
        .in('id', topTextIds);

      topTexts = textsData.map(t => ({
        id: t.id,
        title: t.title,
        category: t.category,
        play_count: playCountsByText[t.id]
      })).sort((a, b) => b.play_count - a.play_count);
    }

    /* =============================
       5. ACTIVIDAD RECIENTE
    ============================== */
    const { data: recentRaw } = await supabase
      .from('audio_analytics')
      .select(`
        id,
        played_at,
        duration_played,
        completed,
        text_id
      `)
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(10);

    // Obtener detalles de textos
    const textIds = [...new Set((recentRaw || []).map(r => r.text_id))];
    let textsMap = {};
    
    if (textIds.length > 0) {
      const { data: textsData } = await supabase
        .from('texts')
        .select('id, title, category')
        .in('id', textIds);
      
      textsData?.forEach(t => {
        textsMap[t.id] = t;
      });
    }

    const recentActivity = (recentRaw || []).map(item => ({
      id: item.id,
      played_at: item.played_at,
      duration_played: item.duration_played,
      completed: item.completed,
      text: {
        id: item.text_id,
        title: textsMap[item.text_id]?.title || 'Unknown',
        category: textsMap[item.text_id]?.category || null
      }
    }));

    /* =============================
       6. TOTAL REPRODUCCIONES
    ============================== */
    const { count: totalPlays } = await supabase
      .from('audio_analytics')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    /* =============================
       RESPUESTA FINAL (estructura frontend)
    ============================== */
    return res.json({
      overview: {
        total_plays: totalPlays || 0,
        total_texts_created: createdTexts?.data?.length || 0,
        total_texts_shared: sharedByMe?.data?.length || 0
      },
      totalAudio: {
        total_seconds: Math.round(totalSeconds),
        formatted: `${hours}h ${minutes}m`
      },
      textsByMonth,
      topTexts,
      recentActivity
    });

  } catch (err) {
    console.error("Full analytics error:", err);
    return res.status(500).json({ error: "Error en estadísticas globales" });
  }
};

/* ========================================
   TRACKEAR REPRODUCCIÓN DE AUDIO
======================================== */
export const trackAudioPlay = async (req, res) => {
  try {
    const userId = req.user.id;
    const { text_id, duration_played, completed } = req.body;

    if (!text_id) {
      return res.status(400).json({ error: 'text_id es requerido' });
    }

    // Verificar que el texto existe y el usuario tiene acceso
    const { data: textData, error: textError } = await supabase
      .from('texts')
      .select('id, user_id')
      .eq('id', text_id)
      .single();

    if (textError || !textData) {
      return res.status(404).json({ error: 'Texto no encontrado' });
    }

    // Verificar acceso (owner o shared)
    const isOwner = textData.user_id === userId;
    let hasAccess = isOwner;

    if (!isOwner) {
      const { data: sharedData } = await supabase
        .from('shared_texts')
        .select('id')
        .eq('text_id', text_id)
        .eq('shared_with_user_id', userId)
        .single();
      
      hasAccess = !!sharedData;
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'No tienes acceso a este texto' });
    }

    // Registrar la reproducción
    const { data, error } = await supabase
      .from('audio_analytics')
      .insert({
        text_id,
        user_id: userId,
        duration_played: duration_played || 0,
        completed: completed || false,
        played_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Actualizar play_count en texts (trigger lo hace automático, pero por si acaso)
    await supabase.rpc('increment_play_count', { text_uuid: text_id });

    return res.json({ 
      success: true, 
      analytics_id: data.id,
      message: 'Reproducción registrada' 
    });

  } catch (err) {
    console.error('Track audio play error:', err);
    return res.status(500).json({ error: 'Error al registrar reproducción' });
  }
};

/* ========================================
   TRACKEAR INICIO DE REPRODUCCIÓN
======================================== */
export const trackPlayStart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { text_id } = req.body;

    if (!text_id) {
      return res.status(400).json({ error: 'text_id es requerido' });
    }

    // Solo crear un registro simple de inicio
    const { data, error } = await supabase
      .from('audio_analytics')
      .insert({
        text_id,
        user_id: userId,
        duration_played: 0,
        completed: false,
        played_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return res.json({ 
      success: true, 
      session_id: data.id // Retornar ID para actualizar después
    });

  } catch (err) {
    console.error('Track play start error:', err);
    return res.status(500).json({ error: 'Error al registrar inicio de reproducción' });
  }
};

/* ========================================
   ACTUALIZAR SESIÓN DE REPRODUCCIÓN
======================================== */
export const updatePlaySession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { session_id, duration_played, completed } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id es requerido' });
    }

    // Actualizar el registro existente
    const { error } = await supabase
      .from('audio_analytics')
      .update({
        duration_played,
        completed: completed || false
      })
      .eq('id', session_id)
      .eq('user_id', userId); // Seguridad: solo el owner puede actualizar

    if (error) throw error;

    return res.json({ 
      success: true, 
      message: 'Sesión actualizada' 
    });

  } catch (err) {
    console.error('Update play session error:', err);
    return res.status(500).json({ error: 'Error al actualizar sesión' });
  }
};

/* ========================================
   TRACKEAR DESCARGA DE AUDIO
======================================== */
export const trackAudioDownload = async (req, res) => {
  try {
    const userId = req.user.id;
    const { text_id } = req.body;

    if (!text_id) {
      return res.status(400).json({ error: 'text_id es requerido' });
    }

    // Registrar como evento especial con duración -1
    const { error } = await supabase
      .from('audio_analytics')
      .insert({
        text_id,
        user_id: userId,
        duration_played: -1, // Marcador especial para descargas
        completed: false,
        played_at: new Date().toISOString()
      });

    if (error) throw error;

    return res.json({ 
      success: true, 
      message: 'Descarga registrada' 
    });

  } catch (err) {
    console.error('Track download error:', err);
    return res.status(500).json({ error: 'Error al registrar descarga' });
  }
};

/* ========================================
   OBTENER ESTADÍSTICAS DE UN TEXTO
======================================== */
export const getTextStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { textId } = req.params;

    // Verificar acceso al texto
    const { data: textData } = await supabase
      .from('texts')
      .select('id, user_id, title')
      .eq('id', textId)
      .single();

    if (!textData || textData.user_id !== userId) {
      return res.status(403).json({ error: 'No tienes acceso a estas estadísticas' });
    }

    // Obtener estadísticas
    const [
      { count: totalPlays },
      { count: completedPlays },
      { data: avgDuration },
      { data: lastPlayed }
    ] = await Promise.all([
      supabase
        .from('audio_analytics')
        .select('id', { count: 'exact', head: true })
        .eq('text_id', textId),
      
      supabase
        .from('audio_analytics')
        .select('id', { count: 'exact', head: true })
        .eq('text_id', textId)
        .eq('completed', true),
      
      supabase
        .from('audio_analytics')
        .select('duration_played')
        .eq('text_id', textId)
        .gt('duration_played', 0),
      
      supabase
        .from('audio_analytics')
        .select('played_at, user_id')
        .eq('text_id', textId)
        .order('played_at', { ascending: false })
        .limit(1)
        .single()
    ]);

    const avgSeconds = avgDuration && avgDuration.length > 0
      ? Math.round(avgDuration.reduce((acc, p) => acc + p.duration_played, 0) / avgDuration.length)
      : 0;

    return res.json({
      text_id: textId,
      title: textData.title,
      total_plays: totalPlays || 0,
      completed_plays: completedPlays || 0,
      completion_rate: totalPlays > 0 ? ((completedPlays / totalPlays) * 100).toFixed(1) : 0,
      avg_listen_duration: avgSeconds,
      last_played: lastPlayed?.played_at || null
    });

  } catch (err) {
    console.error('Get text stats error:', err);
    return res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};