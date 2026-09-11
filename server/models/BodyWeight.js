import mongoose from 'mongoose';

const bodyWeightSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    weight: { type: Number, required: true, min: 20, max: 500 },
    date: { type: Date, required: true, index: true },
    notes: { type: String, default: '', maxlength: 300 },
  },
  { timestamps: true }
);

bodyWeightSchema.index({ userId: 1, date: -1 });

export default mongoose.model('BodyWeight', bodyWeightSchema);
