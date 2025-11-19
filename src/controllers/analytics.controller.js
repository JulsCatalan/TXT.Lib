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
    const { data: topTexts } = await supabase
      .from('text_stats')
      .select('id, title, play_count, favorite_count, share_count')
      .eq('user_id', userId)
      .order('play_count', { ascending: false })
      .limit(5);


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
        texts ( id, title, category )
      `)
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(10);

    const recentActivity = (recentRaw || []).map(item => ({
      id: item.id,
      played_at: item.played_at,
      duration_played: item.duration_played,
      completed: item.completed,
      text: {
        id: item.texts?.id,
        title: item.texts?.title,
        category: item.texts?.category
      }
    }));


    /* =============================
       RESPUESTA FINAL
    ============================== */
    return res.json({
      totals: {
        created: createdTexts?.data?.length || 0,
        shared_by_me: sharedByMe?.data?.length || 0,
        shared_with_me: sharedWithMe?.data?.length || 0
      },
      audio: {
        total_seconds: Math.round(totalSeconds),
        formatted: `${hours}h ${minutes}m`
      },
      charts: {
        textsByMonth
      },
      topTexts: topTexts || [],
      recentActivity
    });

  } catch (err) {
    console.error("Full analytics error:", err);
    return res.status(500).json({ error: "Error en estadísticas globales" });
  }
};
