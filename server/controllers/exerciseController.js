import { AppError } from '../middleware/errorHandler.js';
import {
  getExerciseById,
  getExercisesByMuscle,
  listExercises,
} from '../services/exerciseProvider.js';
import { MUSCLE_GROUPS } from '../data/exercises.js';

export const getExercises = async (req, res, next) => {
  try {
    const { muscle, q, equipment, difficulty } = req.query;
    const exercises = await listExercises({ muscle, q, equipment, difficulty });
    res.json({ exercises, muscleGroups: MUSCLE_GROUPS });
  } catch (err) {
    next(err);
  }
};

export const getExercise = async (req, res, next) => {
  try {
    const exercise = await getExerciseById(req.params.id);
    if (!exercise) throw new AppError('Exercise not found', 404);
    res.json({ exercise });
  } catch (err) {
    next(err);
  }
};

export const getExercisesByMuscleGroup = async (req, res, next) => {
  try {
    const exercises = await getExercisesByMuscle(req.params.muscle);
    res.json({ exercises, muscle: req.params.muscle });
  } catch (err) {
    next(err);
  }
};
