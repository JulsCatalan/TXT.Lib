// controllers/usersController.js
import { supabase } from '../config/supabase.js';

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