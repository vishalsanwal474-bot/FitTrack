import Workout from '../models/Workout.js';
import {
  endOfLocalDay,
  startOfLocalDay,
  startOfWeek,
  workoutTotals,
} from '../utils/workoutStats.js';
import { computeStreak, getLastCompletedWorkout } from '../services/streakService.js';
import { getRecentPR } from '../services/prService.js';
import { getNutritionProfile } from '../services/nutritionService.js';
import { getDailyQuote } from '../services/quoteService.js';
import { sanitizeWorkout } from './workoutController.js';

export const getDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = startOfLocalDay(now);
    const todayEnd = endOfLocalDay(now);
    const weekStart = startOfWeek(now);
    const nutrition = getNutritionProfile(req.user);
    const dailyQuote = getDailyQuote(now);

    const [todayWorkouts, weekCount, recent, streak, lastCompleted, recentPR] = await Promise.all([
      Workout.find({
        userId: req.user._id,
        date: { $gte: todayStart, $lte: todayEnd },
      }).sort({ updatedAt: -1 }),
      Workout.countDocuments({
        userId: req.user._id,
        date: { $gte: weekStart, $lte: todayEnd },
        status: 'completed',
      }),
      Workout.find({ userId: req.user._id }).sort({ date: -1, updatedAt: -1 }).limit(5),
      computeStreak(req.user._id, now),
      getLastCompletedWorkout(req.user._id),
      getRecentPR(req.user._id),
    ]);

    const active =
      todayWorkouts.find((w) => w.status === 'in_progress') || todayWorkouts[0] || null;

    const totals = active
      ? workoutTotals(active)
      : {
          exerciseCount: 0,
          sets: 0,
          completedSets: 0,
          reps: 0,
          volume: 0,
          duration: 0,
          caloriesBurned: 0,
        };

    const caloriesToday = todayWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);

    const weekWorkouts = await Workout.find({
      userId: req.user._id,
      date: { $gte: weekStart, $lte: todayEnd },
      status: 'completed',
    }).select('exercises duration caloriesBurned');

    const weeklyVolume = weekWorkouts.reduce((sum, w) => sum + workoutTotals(w).volume, 0);

    res.json({
      today: active
        ? {
            id: active._id,
            date: active.date,
            bodyParts: active.bodyParts || [],
            workoutType: active.workoutType,
            status: active.status,
            notes: active.notes || '',
            exercises: (active.exercises || []).map((ex) => ({
              id: ex._id,
              exerciseName: ex.exerciseName,
              sets: ex.sets || [],
            })),
            totals: {
              ...totals,
              caloriesBurned: active.caloriesBurned || totals.caloriesBurned || 0,
            },
          }
        : null,
      weeklyCompletedCount: weekCount,
      weeklyVolume: Math.round(weeklyVolume),
      streak,
      caloriesBurnedToday: Math.round(caloriesToday),
      calorieTarget: nutrition.calorieTarget,
      bmr: nutrition.bmr,
      tdee: nutrition.tdee,
      currentWeight: req.user.weight ?? null,
      lastWorkout: lastCompleted ? sanitizeWorkout(lastCompleted) : null,
      recentPR: recentPR
        ? {
            exerciseName: recentPR.exerciseName,
            maxWeight: recentPR.maxWeight,
            maxWeightReps: recentPR.maxWeightReps,
            maxVolume: recentPR.maxVolume,
            updatedAt: recentPR.updatedAt,
          }
        : null,
      recentWorkouts: recent.map((w) => ({
        id: w._id,
        date: w.date,
        bodyParts: w.bodyParts || [],
        status: w.status,
        duration: w.duration || 0,
        caloriesBurned: w.caloriesBurned || 0,
        totals: workoutTotals(w),
      })),
      dailyQuote,
    });
  } catch (err) {
    next(err);
  }
};
