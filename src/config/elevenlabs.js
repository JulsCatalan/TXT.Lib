import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { supabase } from './supabase.js';

const ELEVENLABS_MODEL = "eleven_multilingual_v2";

const VOICES = {
  female: '21m00Tcm4TlvDq8ikWAM',
  male: 'pNInz6obpgDQGcFmaJgB'
};

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY
});

export const elevenlabs_generateAudio = async ({ text, textId, userId, gender = 'female' }) => {
  try {
    const voiceId = VOICES[gender] || VOICES.female;
    
    console.log(`🔊 Generando audio con ElevenLabs SDK (voz ${gender})...`);
    console.log(`🎤 Voice ID: ${voiceId}`);

    // Generar audio con ElevenLabs
    const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
      text,
      modelId: ELEVENLABS_MODEL,
      outputFormat: 'mp3_44100_128',
    });

    // Convertir stream a Buffer
    const chunks = [];
    const reader = audioStream.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    
    const audioBuffer = Buffer.concat(chunks);
    console.log(`✅ Audio generado: ${audioBuffer.length} bytes`);

    // Subir a Supabase Storage
    const fileName = `${userId}/${textId}.mp3`;
    
    const { data, error } = await supabase.storage
      .from('audiofiles')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true // Sobrescribir si existe
      });

    if (error) {
      console.error('❌ Error subiendo a Supabase Storage:', error);
      throw error;
    }

    console.log(`💾 Audio subido a Supabase Storage: ${fileName}`);

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('audiofiles')
      .getPublicUrl(fileName);

    console.log(`🔗 URL pública: ${urlData.publicUrl}`);

    return urlData.publicUrl;

  } catch (error) {
    console.error("❌ Error en ElevenLabs:", error.message);
    throw error;
  }
};