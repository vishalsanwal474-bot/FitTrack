import Workout from '../models/Workout.js';
import { getNutritionProfile } from '../services/nutritionService.js';
import { endOfLocalDay, startOfLocalDay, startOfWeek } from '../utils/workoutStats.js';

export const getNutrition = async (req, res, next) => {
  try {
    const profile = getNutritionProfile(req.user);
    const now = new Date();
    const todayStart = startOfLocalDay(now);
    const todayEnd = endOfLocalDay(now);
    const weekStart = startOfWeek(now);

    const [todayWorkouts, weekWorkouts] = await Promise.all([
      Workout.find({
        userId: req.user._id,
        date: { $gte: todayStart, $lte: todayEnd },
      }).select('caloriesBurned duration status'),
      Workout.find({
        userId: req.user._id,
        date: { $gte: weekStart, $lte: todayEnd },
        status: 'completed',
      }).select('caloriesBurned'),
    ]);

    const caloriesToday = todayWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
    const caloriesWeek = weekWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);

    res.json({
      ...profile,
      caloriesBurnedToday: Math.round(caloriesToday),
      caloriesBurnedWeek: Math.round(caloriesWeek),
      remainingToday:
        profile.calorieTarget != null
          ? Math.round(profile.calorieTarget - caloriesToday)
          : null,
    });
  } catch (err) {
    next(err);
  }
};
