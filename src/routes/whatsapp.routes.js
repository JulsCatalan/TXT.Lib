import express from 'express';
import { validateToken } from '../middlewares/jwt.js';
import {
  sendAudio,
  sendText,
  sendTextAndAudio,
  getWhatsAppConfig
} from '../controllers/whatsapp.controller.js';

const router = express.Router();

// POST /api/whatsapp/send-audio - Enviar solo audio
router.post('/send-audio', validateToken, sendAudio);

// POST /api/whatsapp/send-text - Enviar solo texto
router.post('/send-text', validateToken, sendText);

// POST /api/whatsapp/send-text-and-audio - Enviar texto + audio
router.post('/send-text-and-audio', validateToken, sendTextAndAudio);

// GET /api/whatsapp/config - Obtener configuración de WhatsApp
router.get('/config', validateToken, getWhatsAppConfig);

export default router;