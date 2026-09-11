import Workout from '../../models/Workout.js';
import { listExercises } from '../exerciseProvider.js';

/**
 * RuleBasedRecommendationProvider
 * Swap later for AIRecommendationProvider without changing the public API.
 */
export async function getRecommendations(user, muscle, { limit = 8 } = {}) {
  const bodyPart = String(muscle || '').trim();
  if (!bodyPart) return { muscle: '', exercises: [], provider: 'rule-based' };

  const candidates = await listExercises({ muscle: bodyPart });
  // Also include secondary-muscle matches if primary list is thin
  let pool = candidates;
  if (pool.length < 4) {
    const all = await listExercises({});
    const extras = all.filter(
      (ex) =>
        ex.primaryMuscle?.toLowerCase() === bodyPart.toLowerCase() ||
        (ex.secondaryMuscles || []).some((m) => m.toLowerCase() === bodyPart.toLowerCase())
    );
    const seen = new Set(pool.map((e) => String(e._id)));
    for (const ex of extras) {
      if (!seen.has(String(ex._id))) pool.push(ex);
    }
  }

  const history = await Workout.find({
    userId: user._id,
    status: 'completed',
  })
    .sort({ date: -1 })
    .limit(20)
    .select('exercises date bodyParts')
    .lean();

  const recentNames = new Map(); // name -> recency rank (0 = most recent workout containing it)
  history.forEach((w, wi) => {
    for (const ex of w.exercises || []) {
      const key = ex.exerciseName?.toLowerCase();
      if (key && !recentNames.has(key)) recentNames.set(key, wi);
    }
  });

  const preferredDifficulty = mapUserDifficulty(user);
  const scored = pool.map((ex) => {
    let score = 0;
    const reasons = [];

    if (ex.primaryMuscle?.toLowerCase() === bodyPart.toLowerCase()) {
      score += 40;
      reasons.push(`Targets ${ex.primaryMuscle}`);
    } else {
      score += 20;
      reasons.push(`Supports ${bodyPart}`);
    }

    if (ex.difficulty === preferredDifficulty) {
      score += 15;
      reasons.push(`Matches ${preferredDifficulty} level`);
    } else if (
      (preferredDifficulty === 'beginner' && ex.difficulty === 'intermediate') ||
      (preferredDifficulty === 'advanced' && ex.difficulty === 'intermediate')
    ) {
      score += 8;
    } else if (preferredDifficulty === 'beginner' && ex.difficulty === 'advanced') {
      score -= 10;
    }

    const recency = recentNames.get(ex.name.toLowerCase());
    if (recency == null) {
      score += 12;
      reasons.push('Fresh variation');
    } else if (recency <= 2) {
      score += 6;
      reasons.push('Recent — good for progressive overload');
    } else {
      score += 3;
    }

    // Mild equipment diversity preference for compound lifts
    if (['barbell', 'dumbbell'].includes(ex.equipment) && ['Chest', 'Back', 'Legs', 'Shoulders'].includes(bodyPart)) {
      score += 5;
    }
    if (ex.equipment === 'bodyweight' && preferredDifficulty === 'beginner') {
      score += 5;
      reasons.push('Beginner-friendly equipment');
    }

    score += Math.min(5, (ex.recommendedSets || 0) / 2);

    return {
      exercise: sanitizeExercise(ex),
      score,
      reasons: reasons.slice(0, 3),
    };
  });

  scored.sort((a, b) => b.score - a.score || a.exercise.name.localeCompare(b.exercise.name));

  // Prefer equipment variety in top results
  const picked = diversifyByEquipment(scored, limit);

  return {
    muscle: bodyPart,
    provider: 'rule-based',
    exercises: picked.map(({ exercise, score, reasons }) => ({
      ...exercise,
      score,
      reasons,
    })),
  };
}

function mapUserDifficulty(user) {
  if (user?.activityLevel === 'sedentary' || user?.activityLevel === 'light') return 'beginner';
  if (user?.activityLevel === 'very_active' || user?.activityLevel === 'active') return 'advanced';
  return 'intermediate';
}

function sanitizeExercise(ex) {
  return {
    id: ex._id,
    name: ex.name,
    primaryMuscle: ex.primaryMuscle,
    secondaryMuscles: ex.secondaryMuscles || [],
    equipment: ex.equipment,
    difficulty: ex.difficulty,
    instructions: ex.instructions,
    recommendedSets: ex.recommendedSets,
    recommendedReps: ex.recommendedReps,
    restTime: ex.restTime,
    met: ex.met,
  };
}

function diversifyByEquipment(scored, limit) {
  const result = [];
  const usedEquipment = new Set();
  const remaining = [...scored];

  while (result.length < limit && remaining.length) {
    let idx = remaining.findIndex((item) => !usedEquipment.has(item.exercise.equipment));
    if (idx === -1) idx = 0;
    const [item] = remaining.splice(idx, 1);
    result.push(item);
    usedEquipment.add(item.exercise.equipment);
    if (usedEquipment.size >= 4) usedEquipment.clear(); // allow repeats after variety pass
  }

  return result;
}
