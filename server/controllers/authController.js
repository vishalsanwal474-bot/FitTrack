import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  age: user.age,
  gender: user.gender,
  height: user.height,
  weight: user.weight,
  activityLevel: user.activityLevel,
  fitnessGoal: user.fitnessGoal,
  targetWeight: user.targetWeight,
  workoutFrequency: user.workoutFrequency,
  createdAt: user.createdAt,
});

export const register = async (req, res, next) => {
  try {
    const { name, email, password, age, gender, height, weight, activityLevel, fitnessGoal, targetWeight, workoutFrequency } =
      req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      throw new AppError('Name, email, and password are required', 400);
    }

    if (password.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      throw new AppError('Email already registered', 400);
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      age,
      gender,
      height,
      weight,
      activityLevel,
      fitnessGoal,
      targetWeight,
      workoutFrequency,
    });

    const token = signToken(user._id);
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = signToken(user._id);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    res.json({ user: sanitizeUser(req.user) });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const allowed = [
      'name',
      'age',
      'gender',
      'height',
      'weight',
      'activityLevel',
      'fitnessGoal',
      'targetWeight',
      'workoutFrequency',
    ];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (updates.name !== undefined && !String(updates.name).trim()) {
      throw new AppError('Name cannot be empty', 400);
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
};
