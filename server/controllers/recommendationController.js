import { MUSCLE_GROUPS } from '../data/exercises.js';
import { AppError } from '../middleware/errorHandler.js';
import { getRecommendedExercises } from '../services/recommendationService.js';

export const getRecommendations = async (req, res, next) => {
  try {
    const muscle = req.params.muscle;
    if (!muscle?.trim()) throw new AppError('Muscle group is required', 400);

    const limit = Math.min(20, Math.max(3, Number(req.query.limit) || 8));
    const result = await getRecommendedExercises(req.user, muscle, { limit });

    res.json({
      ...result,
      muscleGroups: MUSCLE_GROUPS,
    });
  } catch (err) {
    next(err);
  }
};

export const listRecommendationMuscles = async (_req, res, next) => {
  try {
    res.json({ muscleGroups: MUSCLE_GROUPS });
  } catch (err) {
    next(err);
  }
};
