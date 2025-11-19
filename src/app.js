import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from "url";
import cookieParser from 'cookie-parser';
import dotenv from "dotenv";
import { supabase } from './config/supabase.js';

// Importar rutas
import routes from './routes/index.js';

dotenv.config();

const app = express();

// Middleware para parsear JSON
app.use(express.json());

app.use(cookieParser());

// Servir los audios para url publicas
app.use('/audiofiles', express.static(path.join(process.cwd(), 'audiofiles')));

// Configura __dirname correctamente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const buildpath = path.join(__dirname, "../client/out");
app.use(express.static(buildpath));

// CORS configuración
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000'
];

if (process.env.NODE_ENV !== 'development') {
  allowedOrigins.push('https://txt-lib.onrender.com');
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(morgan("dev"));

// Función para verificar conexión con Supabase
const checkDatabaseConnection = async () => {
  try {
    const { error } = await supabase.from('health_check').select('*').limit(1);
    if (!error) {
      console.log('✅ Conexión con Supabase establecida');
      return true;
    } else {
      console.log('⚠️ Warning:', error.message);
      return false;
    }
  } catch (err) {
    console.log('❌ Error al verificar conexión con Supabase:', err.message);
    return false;
  }
};

// Todas las rutas de la API
app.use('/api', routes);

// Catch-all route para SPA
app.get("/*splat", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/out/index.html"));
});

// Verificar conexión con DB antes de iniciar el servidor
checkDatabaseConnection();

// Iniciar servidor
app.listen(process.env.PORT, () => {
  console.log(`Servidor corriendo en puerto ${process.env.PORT}`);
});
