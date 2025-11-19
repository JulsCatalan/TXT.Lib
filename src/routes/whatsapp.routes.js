import express from 'express';
import { validateToken } from '../middlewares/jwt.js';
import {
  configureWhatsApp,
  requestVerification,
  verifyCode,
  toggleNotifications,
  getWhatsAppConfig,
  sendAudio
} from '../controllers/whatsapp.controller.js';

const router = express.Router();

// GET /api/whatsapp/config - Obtener configuración
router.get('/config',validateToken, getWhatsAppConfig);

// POST /api/whatsapp/config - Configurar número
router.post('/config',validateToken, configureWhatsApp);

// POST /api/whatsapp/request-verification - Solicitar código
router.post('/request-verification', validateToken, requestVerification);

// POST /api/whatsapp/verify - Verificar código
router.post('/verify', validateToken,verifyCode);

// PUT /api/whatsapp/notifications - Toggle notificaciones
router.put('/notifications',validateToken, toggleNotifications);

// POST /api/whatsapp/send-audio - Enviar audio
router.post('/send-audio',validateToken, sendAudio);

export default router;