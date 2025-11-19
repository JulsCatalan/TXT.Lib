// routes/usersRoutes.js
import express from 'express';
import { validateToken } from '../middlewares/jwt.js';

import {
  getUserProfile,
  updatePhoneNumber,
  requestVerificationCode,
  verifyCode,
  toggleWhatsAppNotifications,
  removePhoneNumber,
  searchUsers
} from '../controllers/users.controller.js';

const router = express.Router();

// GET /api/users/profile - Obtener perfil del usuario
router.get('/profile', validateToken, getUserProfile);

// PUT /api/users/phone - Actualizar número de teléfono
router.put('/phone', validateToken, updatePhoneNumber);

// POST /api/users/request-verification - Solicitar código de verificación
router.post('/request-verification', validateToken, requestVerificationCode);

// POST /api/users/verify - Verificar código de WhatsApp
router.post('/verify', validateToken, verifyCode);

// PUT /api/users/notifications - Toggle notificaciones de WhatsApp
router.put('/notifications', validateToken, toggleWhatsAppNotifications);

// DELETE /api/users/phone - Eliminar número de teléfono
router.delete('/phone', validateToken, removePhoneNumber);

// GET /api/users/search - Buscar usuarios para compartir
router.get('/search', validateToken, searchUsers);

export default router;