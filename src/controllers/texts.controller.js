// controllers/textsController.js
import { supabase } from '../config/supabase.js';
import { elevenlabs_generateAudio } from '../utils/elevenlabs.js';

const validateTextFields = ({ title, content }, isUpdate = false) => {
  if (!isUpdate || title !== undefined) {
    if (!title || title.trim() === '') return 'El título no puede estar vacío';
  }
  if (!isUpdate || content !== undefined) {
    if (!content || content.trim().length < 10) return 'El contenido debe tener al menos 10 caracteres';
  }
  return null;
};

export const listTexts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabase
      .from('texts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error('listTexts error:', err);
    return res.status(500).json({ error: 'Error al obtener textos' });
  }
};

export const getText = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { data, error } = await supabase
      .from('texts')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Texto no encontrado' });
    return res.json(data);
  } catch (err) {
    console.error('getText error:', err);
    return res.status(500).json({ error: 'Error al obtener texto' });
  }
};

export const createText = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, content, category } = req.body;
    const validationError = validateTextFields({ title, content });
    if (validationError) return res.status(400).json({ error: validationError });

    const word_count = content.trim().split(' ').length;

    const { data, error } = await supabase
      .from('texts')
      .insert([{ user_id: userId, title, content, category, word_count }])
      .select()
      .single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (err) {
    console.error('createText error:', err);
    return res.status(500).json({ error: 'Error al crear texto' });
  }
};

export const updateText = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, content, category } = req.body;

    console.log(req.body);

    // Verificar que el texto existe
    const { data: existingText, error: fetchError } = await supabase
      .from('texts')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingText) {
      return res.status(404).json({ error: 'Texto no encontrado' });
    }

    // SOLO el propietario puede editar (sin importar permisos de compartido)
    if (existingText.user_id !== userId) {
      return res.status(403).json({ 
        error: 'Solo el propietario puede editar este texto' 
      });
    }

    // Calcular word_count si el contenido cambió
    let word_count = existingText.word_count;
    if (content && content !== existingText.content) {
      word_count = content.trim().split(/\s+/).length;
    }

    // Preparar objeto de actualización
    const updateData = {
      title: title || existingText.title,
      content: content || existingText.content,
      category: category || existingText.category,
      word_count
    };

    // Actualizar texto
    const { data, error } = await supabase
      .from('texts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.json(data);

  } catch (err) {
    console.error('updateText error:', err);
    return res.status(500).json({ error: 'Error al actualizar texto' });
  }
};

export const deleteText = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const { data: text } = await supabase
      .from('texts')
      .select('audio_url')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (text?.audio_url) {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(process.cwd(), text.audio_url);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Audio eliminado: ${filePath}`);
      }
    }

    const { error, data } = await supabase
      .from('texts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ error: 'Texto no encontrado' });

    return res.json({ message: 'Texto eliminado correctamente' });
  } catch (err) {
    console.error('deleteText error:', err);
    return res.status(500).json({ error: 'Error al eliminar texto' });
  }
};

export const generateAudio = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, gender } = req.body;

    // Validar género
    if (gender && !['male', 'female'].includes(gender)) {
      return res.status(400).json({ 
        error: 'Género inválido. Usa "male" o "female"' 
      });
    }

    // Obtener el texto
    const { data: text, error } = await supabase
      .from('texts')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !text) {
      return res.status(404).json({ error: 'Texto no encontrado' });
    }

    // Si ya tiene audio generado, devolverlo (o regenerar si cambió el género)
    if (text.audio_generated && text.audio_url && !gender) {
      return res.json({ 
        audio_url: text.audio_url, 
        cached: true 
      });
    }

    // Generar audio con ElevenLabs y guardar en servidor
    const audioUrl = await elevenlabs_generateAudio({ 
      text: text.content, 
      textId: text.id, 
      userId,
      gender: gender || 'female' // Por defecto femenino
    });

    if (!audioUrl) {
      return res.status(500).json({ error: 'Error generando audio' });
    }

    // Actualizar registro en la base de datos con la URL
    const { data: updated, error: updateError } = await supabase
      .from('texts')
      .update({ 
        audio_generated: true, 
        audio_url: audioUrl 
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.json({
      ...updated,
      gender: gender || 'female'
    });

  } catch (err) {
    console.error('generateAudio error:', err);
    return res.status(500).json({ error: 'Error interno en generación de audio' });
  }
};