import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  createWeight,
  deleteWeight,
  listWeights,
  updateWeight,
} from '../controllers/weightController.js';

const router = Router();

router.use(protect);
router.get('/', listWeights);
router.post('/', createWeight);
router.put('/:id', updateWeight);
router.delete('/:id', deleteWeight);

export default router;
