import { Router } from 'express';
import authRoutes from './auth.routes.js'
import textsRoutes from './text.routes.js'
import sharedRoutes from './shared.routes.js'
import usersRoutes from './users.routes.js'
import favoriteRoutes from './favorites.routes.js'
import analyticsRoutes from './analytics.routes.js'
import whatsappRoutes from './whatsapp.routes.js'
import recommendationsRoutes from'./recommendations.routes.js';

const router = Router();

// Rutas de autenticación
router.use('/auth', authRoutes);

// Rutas de CRUD de textos
router.use('/texts', textsRoutes);

//Rutas para compartir
router.use('/shared', sharedRoutes);

//Rutas para usuarios
router.use('/users', usersRoutes);

//Rutas para favoritos
router.use('/favorites', favoriteRoutes);

//Rutas para analitica
router.use('/analytics', analyticsRoutes);

//Rutas para whatsapp
router.use('/whatsapp', whatsappRoutes);

//Rutas para recomendaciones
router.use('/recommendations', recommendationsRoutes);

export default router;