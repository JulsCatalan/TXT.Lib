import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

// Validación fuerte
if (!supabaseUrl) {
  throw new Error("❌ FALTA: SUPABASE_URL en tu archivo .env");
}

if (!supabaseKey) {
  throw new Error("❌ FALTA: SUPABASE_SECRET_KEY en tu archivo .env");
}

// Cliente de Supabase para backend
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,  // recomendado para servidores
    autoRefreshToken: false // también importante evitar en backend
  }
});
