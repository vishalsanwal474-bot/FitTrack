import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    primaryMuscle: { type: String, required: true, index: true },
    secondaryMuscles: [{ type: String }],
    equipment: {
      type: String,
      enum: ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'other'],
      default: 'barbell',
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    instructions: { type: String, default: '' },
    recommendedSets: { type: Number, default: 3 },
    recommendedReps: { type: String, default: '8-12' },
    restTime: { type: Number, default: 90 },
    met: { type: Number, default: 5 },
  },
  { timestamps: true }
);

exerciseSchema.index({ name: 'text', primaryMuscle: 'text' });

export default mongoose.model('Exercise', exerciseSchema);
