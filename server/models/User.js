import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    age: { type: Number, min: 10, max: 120 },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', ''],
      default: '',
    },
    height: { type: Number, min: 50, max: 300 },
    weight: { type: Number, min: 20, max: 500 },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'active', 'very_active', ''],
      default: '',
    },
    fitnessGoal: {
      type: String,
      enum: ['maintain', 'lose', 'gain', ''],
      default: '',
    },
    targetWeight: { type: Number, min: 20, max: 500 },
    workoutFrequency: { type: Number, min: 0, max: 14, default: 3 },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function matchPassword(entered) {
  return bcrypt.compare(entered, this.password);
};

export default mongoose.model('User', userSchema);
