import mongoose from 'mongoose';

const personalRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
    exerciseName: { type: String, required: true, trim: true },
    maxWeight: { type: Number, default: 0 },
    maxWeightReps: { type: Number, default: 0 },
    maxWeightDate: { type: Date },
    maxReps: { type: Number, default: 0 },
    maxRepsWeight: { type: Number, default: 0 },
    maxRepsDate: { type: Date },
    maxVolume: { type: Number, default: 0 },
    maxVolumeDate: { type: Date },
    workoutId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workout' },
  },
  { timestamps: true }
);

personalRecordSchema.index({ userId: 1, exerciseName: 1 }, { unique: true });

export default mongoose.model('PersonalRecord', personalRecordSchema);
