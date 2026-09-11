/** Local calorie math — no external APIs. */

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/**
 * Mifflin–St Jeor BMR (kcal/day).
 * Requires weight (kg), height (cm), age; gender improves accuracy.
 */
export function calculateBMR({ weight, height, age, gender }) {
  const w = Number(weight);
  const h = Number(height);
  const a = Number(age);
  if (!w || !h || !a) return null;

  const base = 10 * w + 6.25 * h - 5 * a;
  if (gender === 'male') return Math.round(base + 5);
  if (gender === 'female') return Math.round(base - 161);
  return Math.round(base - 78); // midpoint for unspecified/other
}

export function calculateTDEE(bmr, activityLevel) {
  if (!bmr) return null;
  const mult = ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.moderate;
  return Math.round(bmr * mult);
}

/** Daily intake target from goal. */
export function calculateCalorieTarget(tdee, fitnessGoal) {
  if (!tdee) return null;
  if (fitnessGoal === 'lose') return Math.max(1200, tdee - 500);
  if (fitnessGoal === 'gain') return tdee + 300;
  return tdee;
}

export function getNutritionProfile(user) {
  const bmr = calculateBMR({
    weight: user.weight,
    height: user.height,
    age: user.age,
    gender: user.gender,
  });
  const tdee = calculateTDEE(bmr, user.activityLevel);
  const calorieTarget = calculateCalorieTarget(tdee, user.fitnessGoal);

  return {
    bmr,
    tdee,
    calorieTarget,
    activityLevel: user.activityLevel || '',
    fitnessGoal: user.fitnessGoal || '',
    weight: user.weight ?? null,
    height: user.height ?? null,
    age: user.age ?? null,
    gender: user.gender || '',
    complete: Boolean(bmr && tdee && calorieTarget),
    missing: [
      !user.weight && 'weight',
      !user.height && 'height',
      !user.age && 'age',
    ].filter(Boolean),
  };
}

export { ACTIVITY_MULTIPLIERS };
