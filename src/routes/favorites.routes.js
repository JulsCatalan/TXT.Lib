// routes/favorites.js
import express from 'express';
import { validateToken } from '../middlewares/jwt.js';
import {
  addFavorite,
  removeFavorite,
  getFavorites,
  checkFavorite
} from '../controllers/favorites.controller.js';

const router = express.Router();

// POST /api/favorites - Agregar favorito
router.post('/add-favorite',  validateToken, addFavorite);

// GET /api/favorites/get-all - Obtener favoritos
router.get('/get-all',  validateToken, getFavorites);

// GET /api/favorites/check/:textId - Verificar si está en favoritos
router.get('/check/:textId', validateToken,  checkFavorite);

// DELETE /api/favorites/:textId - Remover favorito
router.delete('/:textId',validateToken, removeFavorite);

export default router;
