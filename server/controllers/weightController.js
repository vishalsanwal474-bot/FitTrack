import BodyWeight from '../models/BodyWeight.js';
import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
import { startOfLocalDay } from '../utils/workoutStats.js';

const sanitize = (entry) => {
  const doc = typeof entry.toObject === 'function' ? entry.toObject() : entry;
  return {
    id: doc._id,
    weight: doc.weight,
    date: doc.date,
    notes: doc.notes || '',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

async function syncProfileWeight(userId) {
  const latest = await BodyWeight.findOne({ userId }).sort({ date: -1, createdAt: -1 });
  if (latest) {
    await User.findByIdAndUpdate(userId, { weight: latest.weight });
    return latest.weight;
  }
  return null;
}

export const listWeights = async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const filter = { userId: req.user._id };
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = new Date(req.query.from);
      if (req.query.to) filter.date.$lte = new Date(req.query.to);
    }

    const entries = await BodyWeight.find(filter).sort({ date: -1, createdAt: -1 }).limit(limit);
    res.json({ weights: entries.map(sanitize) });
  } catch (err) {
    next(err);
  }
};

export const createWeight = async (req, res, next) => {
  try {
    const weight = Number(req.body.weight);
    if (!weight || weight < 20 || weight > 500) {
      throw new AppError('Weight must be between 20 and 500 kg', 400);
    }

    const day = startOfLocalDay(req.body.date ? new Date(req.body.date) : new Date());
    let entry = await BodyWeight.findOne({ userId: req.user._id, date: day });

    if (entry) {
      entry.weight = weight;
      entry.notes = req.body.notes || '';
      await entry.save();
    } else {
      entry = await BodyWeight.create({
        userId: req.user._id,
        weight,
        date: day,
        notes: req.body.notes || '',
      });
    }

    const currentWeight = await syncProfileWeight(req.user._id);
    res.status(201).json({
      weight: sanitize(entry),
      currentWeight: currentWeight ?? weight,
    });
  } catch (err) {
    next(err);
  }
};

export const updateWeight = async (req, res, next) => {
  try {
    const entry = await BodyWeight.findOne({ _id: req.params.id, userId: req.user._id });
    if (!entry) throw new AppError('Weight entry not found', 404);

    if (req.body.weight !== undefined) {
      const weight = Number(req.body.weight);
      if (!weight || weight < 20 || weight > 500) {
        throw new AppError('Weight must be between 20 and 500 kg', 400);
      }
      entry.weight = weight;
    }
    if (req.body.date !== undefined) entry.date = startOfLocalDay(new Date(req.body.date));
    if (req.body.notes !== undefined) entry.notes = req.body.notes;

    await entry.save();
    const currentWeight = await syncProfileWeight(req.user._id);
    res.json({ weight: sanitize(entry), currentWeight: currentWeight ?? entry.weight });
  } catch (err) {
    next(err);
  }
};

export const deleteWeight = async (req, res, next) => {
  try {
    const entry = await BodyWeight.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!entry) throw new AppError('Weight entry not found', 404);
    await syncProfileWeight(req.user._id);
    res.json({ message: 'Weight entry deleted' });
  } catch (err) {
    next(err);
  }
};
