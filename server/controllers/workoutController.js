import Workout from '../models/Workout.js';
import { AppError } from '../middleware/errorHandler.js';
import { workoutTotals } from '../utils/workoutStats.js';
import { updatePRsFromWorkout } from '../services/prService.js';
import { getPreviousPerformances } from '../services/comparisonService.js';
import { getLastCompletedWorkout } from '../services/streakService.js';
import { estimateWorkoutCalories } from '../services/calorieService.js';

export const sanitizeWorkout = (workout) => {
  const doc = typeof workout.toObject === 'function' ? workout.toObject() : workout;
  return {
    id: doc._id,
    userId: doc.userId,
    date: doc.date,
    bodyParts: doc.bodyParts || [],
    workoutType: doc.workoutType || '',
    duration: doc.duration || 0,
    caloriesBurned: doc.caloriesBurned || 0,
    notes: doc.notes || '',
    status: doc.status,
    exercises: (doc.exercises || []).map((ex) => ({
      id: ex._id,
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      notes: ex.notes || '',
      sets: ex.sets || [],
    })),
    totals: workoutTotals(doc),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const normalizeExercises = (exercises = []) =>
  exercises.map((ex) => ({
    exerciseId: ex.exerciseId || undefined,
    exerciseName: String(ex.exerciseName || '').trim(),
    notes: ex.notes || '',
    sets: (ex.sets || []).map((set) => ({
      reps: Number(set.reps) || 0,
      weight: Number(set.weight) || 0,
      duration: Number(set.duration) || 0,
      rest: Number(set.rest) || 0,
      completed: Boolean(set.completed),
    })),
  }));

const maybeUpdatePRs = async (workout) => {
  if (workout.status !== 'completed') return [];
  return updatePRsFromWorkout(workout.userId, workout);
};

const resolveCalories = async (req, { exercises, duration, caloriesBurned, autoEstimate = true }) => {
  const manual = Number(caloriesBurned);
  if (!autoEstimate && manual >= 0) return manual || 0;
  if (req.body.caloriesBurned !== undefined && manual > 0) return manual;

  return estimateWorkoutCalories({
    exercises,
    durationMinutes: duration,
    bodyWeightKg: req.user.weight,
  });
};

export const listWorkouts = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const filter = { userId: req.user._id };

    if (req.query.status) filter.status = req.query.status;
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = new Date(req.query.from);
      if (req.query.to) filter.date.$lte = new Date(req.query.to);
    }
    if (req.query.bodyPart) {
      filter.bodyParts = new RegExp(
        `^${String(req.query.bodyPart).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
        'i'
      );
    }

    const [items, total] = await Promise.all([
      Workout.find(filter).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit),
      Workout.countDocuments(filter),
    ]);

    res.json({
      workouts: items.map(sanitizeWorkout),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getLastWorkout = async (req, res, next) => {
  try {
    const workout = await getLastCompletedWorkout(req.user._id);
    res.json({ workout: workout ? sanitizeWorkout(workout) : null });
  } catch (err) {
    next(err);
  }
};

export const getPreviousComparison = async (req, res, next) => {
  try {
    const raw = req.query.names || req.query.exerciseName || '';
    const names = String(raw)
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean);
    const previous = await getPreviousPerformances(req.user._id, names, req.query.excludeId);
    res.json({ previous });
  } catch (err) {
    next(err);
  }
};

export const getWorkout = async (req, res, next) => {
  try {
    const workout = await Workout.findOne({ _id: req.params.id, userId: req.user._id });
    if (!workout) throw new AppError('Workout not found', 404);
    res.json({ workout: sanitizeWorkout(workout) });
  } catch (err) {
    next(err);
  }
};

export const createWorkout = async (req, res, next) => {
  try {
    const {
      date,
      bodyParts = [],
      workoutType = 'strength',
      duration = 0,
      caloriesBurned = 0,
      notes = '',
      status = 'in_progress',
      exercises = [],
    } = req.body;

    if (!date) throw new AppError('Date is required', 400);

    const normalized = normalizeExercises(exercises);
    if (normalized.some((ex) => !ex.exerciseName)) {
      throw new AppError('Each exercise needs a name', 400);
    }

    const durationNum = Number(duration) || 0;
    const calories = await resolveCalories(req, {
      exercises: normalized,
      duration: durationNum,
      caloriesBurned,
    });

    const workout = await Workout.create({
      userId: req.user._id,
      date: new Date(date),
      bodyParts: Array.isArray(bodyParts) ? bodyParts : [],
      workoutType,
      duration: durationNum,
      caloriesBurned: calories,
      notes,
      status: status === 'completed' ? 'completed' : 'in_progress',
      exercises: normalized,
    });

    const newPRs = await maybeUpdatePRs(workout);
    res.status(201).json({ workout: sanitizeWorkout(workout), newPRs });
  } catch (err) {
    next(err);
  }
};

export const quickStart = async (req, res, next) => {
  try {
    const mode = req.body.mode || 'empty';
    const now = new Date();

    if (mode === 'empty') {
      const workout = await Workout.create({
        userId: req.user._id,
        date: now,
        bodyParts: [],
        workoutType: 'strength',
        duration: 0,
        status: 'in_progress',
        exercises: [],
      });
      return res.status(201).json({ workout: sanitizeWorkout(workout) });
    }

    if (mode === 'repeat') {
      const sourceId = req.body.sourceId;
      const source = sourceId
        ? await Workout.findOne({ _id: sourceId, userId: req.user._id })
        : await getLastCompletedWorkout(req.user._id);

      if (!source) throw new AppError('No previous workout to repeat', 404);

      const exercises = (source.exercises || []).map((ex) => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        notes: '',
        sets: (ex.sets || []).map((set) => ({
          reps: set.reps || 0,
          weight: set.weight || 0,
          duration: set.duration || 0,
          rest: set.rest || 0,
          completed: false,
        })),
      }));

      const workout = await Workout.create({
        userId: req.user._id,
        date: now,
        bodyParts: source.bodyParts || [],
        workoutType: source.workoutType || 'strength',
        duration: 0,
        status: 'in_progress',
        notes: `Repeated from ${new Date(source.date).toLocaleDateString()}`,
        exercises,
      });

      return res.status(201).json({
        workout: sanitizeWorkout(workout),
        source: sanitizeWorkout(source),
      });
    }

    throw new AppError('Invalid quick start mode', 400);
  } catch (err) {
    next(err);
  }
};

export const updateWorkout = async (req, res, next) => {
  try {
    const workout = await Workout.findOne({ _id: req.params.id, userId: req.user._id });
    if (!workout) throw new AppError('Workout not found', 404);

    const allowed = [
      'date',
      'bodyParts',
      'workoutType',
      'duration',
      'caloriesBurned',
      'notes',
      'status',
      'exercises',
    ];

    for (const key of allowed) {
      if (req.body[key] === undefined) continue;
      if (key === 'date') {
        workout.date = new Date(req.body.date);
      } else if (key === 'exercises') {
        const normalized = normalizeExercises(req.body.exercises);
        if (normalized.some((ex) => !ex.exerciseName)) {
          throw new AppError('Each exercise needs a name', 400);
        }
        workout.exercises = normalized;
      } else if (key === 'status') {
        workout.status = req.body.status === 'completed' ? 'completed' : 'in_progress';
      } else if (key === 'duration') {
        workout.duration = Number(req.body.duration) || 0;
      } else if (key === 'caloriesBurned') {
        workout.caloriesBurned = Number(req.body.caloriesBurned) || 0;
      } else {
        workout[key] = req.body[key];
      }
    }

    // Re-estimate when duration/exercises change unless client sent an explicit positive calorie value
    const explicitCalories =
      req.body.caloriesBurned !== undefined && Number(req.body.caloriesBurned) > 0;
    if (!explicitCalories) {
      workout.caloriesBurned = await estimateWorkoutCalories({
        exercises: workout.exercises,
        durationMinutes: workout.duration,
        bodyWeightKg: req.user.weight,
      });
    }

    await workout.save();
    const newPRs = await maybeUpdatePRs(workout);
    res.json({ workout: sanitizeWorkout(workout), newPRs });
  } catch (err) {
    next(err);
  }
};

export const deleteWorkout = async (req, res, next) => {
  try {
    const workout = await Workout.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!workout) throw new AppError('Workout not found', 404);
    res.json({ message: 'Workout deleted' });
  } catch (err) {
    next(err);
  }
};
