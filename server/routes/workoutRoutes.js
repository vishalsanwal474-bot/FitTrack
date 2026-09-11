import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  createWorkout,
  deleteWorkout,
  getLastWorkout,
  getPreviousComparison,
  getWorkout,
  listWorkouts,
  quickStart,
  updateWorkout,
} from '../controllers/workoutController.js';

const router = Router();

router.use(protect);
router.get('/', listWorkouts);
router.post('/', createWorkout);
router.post('/quick-start', quickStart);
router.get('/last', getLastWorkout);
router.get('/previous', getPreviousComparison);
router.get('/:id', getWorkout);
router.put('/:id', updateWorkout);
router.delete('/:id', deleteWorkout);

export default router;
