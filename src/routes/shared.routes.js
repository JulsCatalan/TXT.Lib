// routes/sharedRoutes.js
import express from 'express';
import { validateToken } from '../middlewares/jwt.js';
import {
  getSharedWithMe,
  getSharedByMe,
  shareText,
  shareWithMultiple,
  unshareText,
  getTextSharedUsers
} from '../controllers/shared.controller.js'

const router = express.Router();

// Obtener textos compartidos conmigo
router.get('/received', validateToken, getSharedWithMe);

// Obtener textos que yo he compartido
router.get('/sent', validateToken, getSharedByMe);

// Compartir un texto con un usuario
router.post('/share', validateToken, shareText);

// Compartir con múltiples usuarios
router.post('/share-multiple', validateToken, shareWithMultiple);

// Ver con quién está compartido un texto específico
router.get('/text/:textId/users', validateToken, getTextSharedUsers);

// Dejar de compartir (revocar acceso)
router.delete('/:shareId', validateToken, unshareText);

export default router;