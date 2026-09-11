/** Curated starter exercise catalog (~60). Extend via seed / import later. */

const ex = (name, primaryMuscle, opts = {}) => ({
  name,
  primaryMuscle,
  secondaryMuscles: opts.secondaryMuscles || [],
  equipment: opts.equipment || 'barbell',
  difficulty: opts.difficulty || 'intermediate',
  instructions: opts.instructions || `Perform ${name} with controlled form.`,
  recommendedSets: opts.recommendedSets ?? 3,
  recommendedReps: opts.recommendedReps || '8-12',
  restTime: opts.restTime ?? 90,
  met: opts.met ?? 5,
});

export const EXERCISE_SEED = [
  // Chest
  ex('Barbell Bench Press', 'Chest', { secondaryMuscles: ['Triceps', 'Shoulders'], met: 6 }),
  ex('Incline Dumbbell Press', 'Chest', { equipment: 'dumbbell', secondaryMuscles: ['Shoulders', 'Triceps'], met: 5.5 }),
  ex('Decline Bench Press', 'Chest', { secondaryMuscles: ['Triceps'], met: 5.5 }),
  ex('Dumbbell Fly', 'Chest', { equipment: 'dumbbell', recommendedReps: '10-15', met: 4.5 }),
  ex('Cable Fly', 'Chest', { equipment: 'cable', recommendedReps: '12-15', restTime: 60, met: 4.5 }),
  ex('Push-Up', 'Chest', { equipment: 'bodyweight', secondaryMuscles: ['Triceps', 'Shoulders', 'Core'], difficulty: 'beginner', met: 4 }),
  ex('Chest Dip', 'Chest', { equipment: 'bodyweight', secondaryMuscles: ['Triceps'], difficulty: 'advanced', met: 6 }),

  // Back
  ex('Conventional Deadlift', 'Back', { secondaryMuscles: ['Glutes', 'Hamstrings', 'Core'], difficulty: 'advanced', recommendedReps: '3-6', restTime: 180, met: 7 }),
  ex('Barbell Bent-Over Row', 'Back', { secondaryMuscles: ['Biceps'], met: 6 }),
  ex('Pull-Up', 'Back', { equipment: 'bodyweight', secondaryMuscles: ['Biceps'], difficulty: 'advanced', met: 6.5 }),
  ex('Lat Pulldown', 'Back', { equipment: 'cable', secondaryMuscles: ['Biceps'], difficulty: 'beginner', met: 5 }),
  ex('Seated Cable Row', 'Back', { equipment: 'cable', secondaryMuscles: ['Biceps'], met: 5 }),
  ex('Single-Arm Dumbbell Row', 'Back', { equipment: 'dumbbell', secondaryMuscles: ['Biceps'], met: 5 }),
  ex('Face Pull', 'Back', { equipment: 'cable', secondaryMuscles: ['Shoulders'], recommendedReps: '12-20', restTime: 60, met: 4 }),
  ex('T-Bar Row', 'Back', { secondaryMuscles: ['Biceps'], met: 6 }),

  // Shoulders
  ex('Overhead Press', 'Shoulders', { secondaryMuscles: ['Triceps'], met: 6 }),
  ex('Dumbbell Shoulder Press', 'Shoulders', { equipment: 'dumbbell', secondaryMuscles: ['Triceps'], met: 5.5 }),
  ex('Lateral Raise', 'Shoulders', { equipment: 'dumbbell', recommendedReps: '12-15', restTime: 60, met: 4 }),
  ex('Front Raise', 'Shoulders', { equipment: 'dumbbell', recommendedReps: '10-15', restTime: 60, met: 4 }),
  ex('Rear Delt Fly', 'Shoulders', { equipment: 'dumbbell', recommendedReps: '12-15', restTime: 60, met: 4 }),
  ex('Arnold Press', 'Shoulders', { equipment: 'dumbbell', secondaryMuscles: ['Triceps'], met: 5.5 }),
  ex('Barbell Shrug', 'Shoulders', { secondaryMuscles: ['Back'], recommendedReps: '10-15', met: 4 }),

  // Biceps
  ex('Barbell Curl', 'Biceps', { difficulty: 'beginner', recommendedReps: '8-12', restTime: 60, met: 4 }),
  ex('Dumbbell Curl', 'Biceps', { equipment: 'dumbbell', difficulty: 'beginner', restTime: 60, met: 4 }),
  ex('Hammer Curl', 'Biceps', { equipment: 'dumbbell', restTime: 60, met: 4 }),
  ex('Incline Dumbbell Curl', 'Biceps', { equipment: 'dumbbell', restTime: 60, met: 4 }),
  ex('Cable Curl', 'Biceps', { equipment: 'cable', restTime: 60, met: 4 }),
  ex('Concentration Curl', 'Biceps', { equipment: 'dumbbell', recommendedReps: '10-15', restTime: 45, met: 3.5 }),

  // Triceps
  ex('Close-Grip Bench Press', 'Triceps', { secondaryMuscles: ['Chest'], met: 5.5 }),
  ex('Triceps Pushdown', 'Triceps', { equipment: 'cable', difficulty: 'beginner', restTime: 60, met: 4 }),
  ex('Overhead Triceps Extension', 'Triceps', { equipment: 'dumbbell', restTime: 60, met: 4 }),
  ex('Skull Crusher', 'Triceps', { restTime: 75, met: 4.5 }),
  ex('Diamond Push-Up', 'Triceps', { equipment: 'bodyweight', secondaryMuscles: ['Chest'], difficulty: 'intermediate', met: 4.5 }),
  ex('Bench Dip', 'Triceps', { equipment: 'bodyweight', difficulty: 'beginner', restTime: 60, met: 4 }),

  // Legs
  ex('Back Squat', 'Legs', { secondaryMuscles: ['Glutes', 'Core'], difficulty: 'advanced', recommendedReps: '5-8', restTime: 150, met: 7 }),
  ex('Front Squat', 'Legs', { secondaryMuscles: ['Core', 'Glutes'], difficulty: 'advanced', recommendedReps: '5-8', restTime: 150, met: 7 }),
  ex('Leg Press', 'Legs', { equipment: 'machine', secondaryMuscles: ['Glutes'], difficulty: 'beginner', met: 5.5 }),
  ex('Walking Lunge', 'Legs', { equipment: 'dumbbell', secondaryMuscles: ['Glutes'], recommendedReps: '10-14', met: 5.5 }),
  ex('Romanian Deadlift', 'Legs', { secondaryMuscles: ['Glutes', 'Back'], recommendedReps: '6-10', restTime: 120, met: 6 }),
  ex('Leg Extension', 'Legs', { equipment: 'machine', difficulty: 'beginner', recommendedReps: '10-15', restTime: 60, met: 4 }),
  ex('Lying Leg Curl', 'Legs', { equipment: 'machine', difficulty: 'beginner', recommendedReps: '10-15', restTime: 60, met: 4 }),
  ex('Bulgarian Split Squat', 'Legs', { equipment: 'dumbbell', secondaryMuscles: ['Glutes'], difficulty: 'advanced', met: 6 }),
  ex('Goblet Squat', 'Legs', { equipment: 'dumbbell', secondaryMuscles: ['Glutes', 'Core'], difficulty: 'beginner', met: 5 }),

  // Glutes
  ex('Hip Thrust', 'Glutes', { secondaryMuscles: ['Hamstrings'], met: 5.5 }),
  ex('Glute Bridge', 'Glutes', { equipment: 'bodyweight', difficulty: 'beginner', recommendedReps: '12-20', restTime: 45, met: 4 }),
  ex('Cable Kickback', 'Glutes', { equipment: 'cable', recommendedReps: '12-15', restTime: 45, met: 4 }),
  ex('Sumo Deadlift', 'Glutes', { secondaryMuscles: ['Legs', 'Back'], difficulty: 'advanced', recommendedReps: '5-8', restTime: 150, met: 7 }),

  // Calves
  ex('Standing Calf Raise', 'Calves', { equipment: 'machine', difficulty: 'beginner', recommendedReps: '12-20', restTime: 45, met: 3.5 }),
  ex('Seated Calf Raise', 'Calves', { equipment: 'machine', difficulty: 'beginner', recommendedReps: '12-20', restTime: 45, met: 3.5 }),
  ex('Donkey Calf Raise', 'Calves', { equipment: 'machine', recommendedReps: '12-20', restTime: 45, met: 3.5 }),

  // Abs / Core
  ex('Plank', 'Abs', { equipment: 'bodyweight', difficulty: 'beginner', recommendedReps: '30-60s', restTime: 45, met: 3.5 }),
  ex('Hanging Leg Raise', 'Abs', { equipment: 'bodyweight', difficulty: 'advanced', recommendedReps: '8-15', restTime: 60, met: 4.5 }),
  ex('Cable Crunch', 'Abs', { equipment: 'cable', difficulty: 'beginner', recommendedReps: '12-20', restTime: 45, met: 4 }),
  ex('Ab Wheel Rollout', 'Abs', { equipment: 'other', difficulty: 'advanced', recommendedReps: '8-12', restTime: 60, met: 4.5 }),
  ex('Russian Twist', 'Abs', { equipment: 'bodyweight', difficulty: 'beginner', recommendedReps: '16-24', restTime: 45, met: 4 }),
  ex('Dead Bug', 'Abs', { equipment: 'bodyweight', difficulty: 'beginner', recommendedReps: '10-14', restTime: 45, met: 3 }),

  // Full Body
  ex('Burpee', 'Full Body', { equipment: 'bodyweight', difficulty: 'intermediate', recommendedReps: '8-15', restTime: 60, met: 8 }),
  ex('Kettlebell Swing', 'Full Body', { equipment: 'kettlebell', secondaryMuscles: ['Glutes', 'Back'], recommendedReps: '12-20', restTime: 60, met: 8 }),
  ex('Thruster', 'Full Body', { secondaryMuscles: ['Shoulders', 'Legs'], difficulty: 'advanced', recommendedReps: '8-12', restTime: 90, met: 8 }),
  ex('Clean and Press', 'Full Body', { secondaryMuscles: ['Shoulders', 'Legs'], difficulty: 'advanced', recommendedReps: '5-8', restTime: 120, met: 8 }),
  ex('Farmer Carry', 'Full Body', { equipment: 'dumbbell', secondaryMuscles: ['Core', 'Shoulders'], recommendedReps: '20-40m', restTime: 60, met: 6 }),
];

export const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Legs',
  'Glutes',
  'Calves',
  'Abs',
  'Full Body',
];
