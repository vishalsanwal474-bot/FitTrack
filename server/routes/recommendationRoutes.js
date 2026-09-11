import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  getRecommendations,
  listRecommendationMuscles,
} from '../controllers/recommendationController.js';

const router = Router();

router.use(protect);
router.get('/', listRecommendationMuscles);
router.get('/:muscle', getRecommendations);

export default router;
