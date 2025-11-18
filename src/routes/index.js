import { Router } from 'express';
import authRoutes from './auth.routes.js'
import textsRoutes from './text.routes.js'
import sharedRoutes from './shared.routes.js'
import usersRoutes from './user.routes.js'

const router = Router();

// Rutas de autenticación
router.use('/auth', authRoutes);

// Rutas de CRUD de textos
router.use('/texts', textsRoutes);

//Rutas para compartir
router.use('/shared', sharedRoutes);

//Rutas para usuarios
router.use('/users', usersRoutes);

export default router;