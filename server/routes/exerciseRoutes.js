import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  getExercise,
  getExercises,
  getExercisesByMuscleGroup,
} from '../controllers/exerciseController.js';

const router = Router();

router.use(protect);
router.get('/', getExercises);
router.get('/muscle/:muscle', getExercisesByMuscleGroup);
router.get('/:id', getExercise);

export default router;
