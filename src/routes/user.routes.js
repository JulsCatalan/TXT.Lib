// routes/usersRoutes.js
import express from 'express';
import { validateToken } from '../middlewares/jwt.js';
import { searchUsers } from '../controllers/users.controller.js';

const router = express.Router();

router.get('/search', validateToken, searchUsers);

export default router;