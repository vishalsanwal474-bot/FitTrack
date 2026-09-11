import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { getTodayQuote } from '../controllers/quoteController.js';

const router = Router();

router.get('/today', protect, getTodayQuote);

export default router;
