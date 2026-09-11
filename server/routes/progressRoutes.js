import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  getDaily,
  getMonthly,
  getPRs,
  getReport,
  getWeekly,
  getYearly,
} from '../controllers/progressController.js';

const router = Router();

router.use(protect);
router.get('/prs', getPRs);
router.get('/report', getReport);
router.get('/daily', getDaily);
router.get('/weekly', getWeekly);
router.get('/monthly', getMonthly);
router.get('/yearly', getYearly);

export default router;
