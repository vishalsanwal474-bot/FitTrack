import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { getNutrition } from '../controllers/nutritionController.js';

const router = Router();

router.get('/', protect, getNutrition);

export default router;
