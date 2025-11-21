import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import fs from 'fs';
import path from 'path';

const ELEVENLABS_MODEL = "eleven_multilingual_v2";

// Voces disponibles
const VOICES = {
  female: '21m00Tcm4TlvDq8ikWAM', // Rachel - Voz femenina
  male: 'pNInz6obpgDQGcFmaJgB'    // Adam - Voz masculina
};

// Directorio base para guardar audios
const AUDIO_BASE_DIR = path.join(process.cwd(), 'audiofiles');

// Inicializar cliente (usa ELEVENLABS_API_KEY automáticamente del env)
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY
});

export const elevenlabs_generateAudio = async ({ text, textId, userId, gender = 'female' }) => {
  try {
    const voiceId = VOICES[gender] || VOICES.female;
    
    console.log(`🔊 Generando audio con ElevenLabs SDK (voz ${gender})...`);
    console.log(`🎤 Voice ID: ${voiceId}`);

    // Usar el SDK oficial
    const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
      text,
      modelId: ELEVENLABS_MODEL,
      outputFormat: 'mp3_44100_128',
    });

    // Convertir el stream a Buffer
    const chunks = [];
    const reader = audioStream.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    
    const audioBuffer = Buffer.concat(chunks);
    console.log(`✅ Audio generado: ${audioBuffer.length} bytes`);

    // Crear directorio del usuario si no existe
    const userDir = path.join(AUDIO_BASE_DIR, userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    // Guardar archivo
    const fileName = `${textId}.mp3`;
    const filePath = path.join(userDir, fileName);
    
    fs.writeFileSync(filePath, audioBuffer);
    console.log(`💾 Audio guardado en: ${filePath}`);

    const audioUrl = `/audiofiles/${userId}/${fileName}`;
    
    return audioUrl;

  } catch (error) {
    console.error("❌ Error en ElevenLabs:", error.message);
    throw error;
  }
};