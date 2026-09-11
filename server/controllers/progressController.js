import { listPRs } from '../services/prService.js';
import { buildProgressReport } from '../services/reportService.js';
import {
  getDailyProgress,
  getMonthlyProgress,
  getWeeklyProgress,
  getYearlyProgress,
} from '../services/progressService.js';

export const getPRs = async (req, res, next) => {
  try {
    const records = await listPRs(req.user._id);
    res.json({
      prs: records.map((pr) => ({
        id: pr._id,
        exerciseId: pr.exerciseId,
        exerciseName: pr.exerciseName,
        maxWeight: pr.maxWeight || 0,
        maxWeightReps: pr.maxWeightReps || 0,
        maxWeightDate: pr.maxWeightDate,
        maxReps: pr.maxReps || 0,
        maxRepsWeight: pr.maxRepsWeight || 0,
        maxRepsDate: pr.maxRepsDate,
        maxVolume: pr.maxVolume || 0,
        maxVolumeDate: pr.maxVolumeDate,
        updatedAt: pr.updatedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
};

export const getReport = async (req, res, next) => {
  try {
    const period = ['week', 'month', 'year'].includes(req.query.period)
      ? req.query.period
      : 'month';
    const report = await buildProgressReport(req.user, period);
    res.json({ report });
  } catch (err) {
    next(err);
  }
};

export const getDaily = async (req, res, next) => {
  try {
    const days = Math.min(90, Math.max(7, Number(req.query.days) || 14));
    const data = await getDailyProgress(req.user._id, days);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getWeekly = async (req, res, next) => {
  try {
    const weeks = Math.min(52, Math.max(4, Number(req.query.weeks) || 12));
    const data = await getWeeklyProgress(req.user._id, weeks);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getMonthly = async (req, res, next) => {
  try {
    const months = Math.min(36, Math.max(3, Number(req.query.months) || 12));
    const data = await getMonthlyProgress(req.user._id, months);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getYearly = async (req, res, next) => {
  try {
    const years = Math.min(10, Math.max(2, Number(req.query.years) || 5));
    const data = await getYearlyProgress(req.user._id, years);
    res.json(data);
  } catch (err) {
    next(err);
  }
};
