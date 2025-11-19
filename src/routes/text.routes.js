import express from 'express';
import { validateToken } from '../middlewares/jwt.js';

import {
  listTexts,
  getText,
  createText,
  updateText,
  deleteText,
  generateAudio
} from '../controllers/texts.controller.js';

const router = express.Router();


// GET /api/texts/get-all-texts - Listar todos los textos del usuario
router.get('/get-all-texts', validateToken, listTexts);

// GET /api/texts/get-text/:id - Obtener un texto específico
router.get('/get-text/:id', validateToken, getText);

// POST /api/texts/create-text - Crear un nuevo texto
router.post('/create-text', validateToken, createText);

// PUT /api/texts/update/:id - Actualizar texto existente
router.put('/update/:id', validateToken, updateText);

// DELETE /api/texts/delete/:id - Eliminar un texto
router.delete('/delete/:id', validateToken, deleteText);

// POST /api/texts/generate-audio-from-text - Convertir texto en audio
router.post('/generate-audio-from-text', validateToken, generateAudio);

export default router;
