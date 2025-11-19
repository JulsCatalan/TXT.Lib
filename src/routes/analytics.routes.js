// routes/analytics.js
import express from 'express';
import { validateToken } from '../middlewares/jwt.js';
import { getFullAnalytics, trackAudioPlay, trackPlayStart, updatePlaySession,
    trackAudioDownload, getTextStats
 } from '../controllers/analytics.controller.js';

const router = express.Router();

router.get('/get-all', validateToken, getFullAnalytics);

// POST /api/analytics/track/play - Registrar reproducción completa
router.post('/track/play', validateToken, trackAudioPlay);

// POST /api/analytics/track/play-start - Iniciar sesión de reproducción
router.post('/track/play-start', validateToken, trackPlayStart);

// PUT /api/analytics/track/play-session - Actualizar sesión de reproducción
router.put('/track/play-session', validateToken, updatePlaySession);

// POST /api/analytics/track/download - Registrar descarga
router.post('/track/download', validateToken, trackAudioDownload);

// GET /api/analytics/text/:textId - Obtener estadísticas de un texto específico
router.get('/text/:textId', validateToken, getTextStats);

export default router;