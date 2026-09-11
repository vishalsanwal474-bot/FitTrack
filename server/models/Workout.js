import mongoose from 'mongoose';

const setSchema = new mongoose.Schema(
  {
    reps: { type: Number, min: 0, default: 0 },
    weight: { type: Number, min: 0, default: 0 },
    duration: { type: Number, min: 0, default: 0 },
    rest: { type: Number, min: 0, default: 0 },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const workoutExerciseSchema = new mongoose.Schema(
  {
    exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
    exerciseName: { type: String, required: true, trim: true },
    notes: { type: String, default: '', maxlength: 500 },
    sets: { type: [setSchema], default: [] },
  },
  { _id: true }
);

const workoutSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true },
    bodyParts: [{ type: String }],
    workoutType: {
      type: String,
      enum: ['strength', 'hypertrophy', 'endurance', 'mixed', ''],
      default: 'strength',
    },
    duration: { type: Number, min: 0, default: 0 },
    caloriesBurned: { type: Number, min: 0, default: 0 },
    notes: { type: String, default: '', maxlength: 1000 },
    status: {
      type: String,
      enum: ['in_progress', 'completed'],
      default: 'in_progress',
      index: true,
    },
    exercises: { type: [workoutExerciseSchema], default: [] },
  },
  { timestamps: true }
);

workoutSchema.index({ userId: 1, date: -1 });

export default mongoose.model('Workout', workoutSchema);
