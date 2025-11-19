// routes/analytics.js
import express from 'express';
import { validateToken } from '../middlewares/jwt.js';
import { getFullAnalytics } from '../controllers/analytics.controller.js';

const router = express.Router();

router.get('/get-all', validateToken, getFullAnalytics);

export default router;