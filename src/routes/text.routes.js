// routes/textsRoutes.js
import express from 'express';
import { validateToken } from '../middlewares/jwt.js';
import { listTexts, getText, createText, updateText, deleteText, generateAudio } from '../controllers/texts.controller.js';

const router = express.Router();

router.get('/get-all-texts', validateToken, listTexts);

router.get('/get-text/:id', validateToken, getText);

router.post('/create-text', validateToken, createText);

router.put('/update/:id', validateToken, updateText);

router.delete('/delete/:id', validateToken, deleteText);

router.post('/generate-audio-from-text', validateToken, generateAudio);

export default router;