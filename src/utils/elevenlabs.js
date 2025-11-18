// utils/elevenlabs.js
import axios from "axios";
import fs from 'fs';
import path from 'path';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_MODEL = "eleven_multilingual_v2";

// Voces disponibles
const VOICES = {
  female: '21m00Tcm4TlvDq8ikWAM', // Rachel - Voz femenina
  male: 'pNInz6obpgDQGcFmaJgB'    // Adam - Voz masculina
};

// Directorio base para guardar audios
const AUDIO_BASE_DIR = path.join(process.cwd(), 'audiofiles');

export const elevenlabs_generateAudio = async ({ text, textId, userId, gender = 'female' }) => {
  try {
    // Validar género
    const voiceId = VOICES[gender] || VOICES.female;
    
    console.log(`🔊 Generando audio con ElevenLabs (voz ${gender})...`);
    console.log(`🎤 Voice ID: ${voiceId}`);

    // Llamada a la API de ElevenLabs
    const response = await axios({
      method: "POST",
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
      },
      responseType: "arraybuffer",
      data: {
        text,
        model_id: ELEVENLABS_MODEL,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      }
    });

    const audioBuffer = Buffer.from(response.data);
    console.log(`✅ Audio generado: ${audioBuffer.length} bytes`);

    // Crear directorio del usuario si no existe
    const userDir = path.join(AUDIO_BASE_DIR, userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    // Guardar archivo en el servidor
    const fileName = `${textId}.mp3`;
    const filePath = path.join(userDir, fileName);
    
    fs.writeFileSync(filePath, audioBuffer);
    console.log(`💾 Audio guardado en: ${filePath}`);

    // Generar URL relativa para acceder al archivo
    const audioUrl = `/audiofiles/${userId}/${fileName}`;
    
    return audioUrl;

  } catch (error) {
    console.error("❌ Error en ElevenLabs:", error.response?.data || error.message);
    throw error;
  }
};