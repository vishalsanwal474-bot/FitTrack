import dotenv from 'dotenv';
import { connectDB } from '../utils/db.js';
import Exercise from '../models/Exercise.js';
import { EXERCISE_SEED } from '../data/exercises.js';

dotenv.config();

const run = async () => {
  await connectDB();
  const existing = await Exercise.countDocuments();
  if (existing > 0) {
    console.log(`Exercises already present (${existing}). Skipping.`);
    process.exit(0);
  }
  await Exercise.insertMany(EXERCISE_SEED);
  console.log(`Seeded ${EXERCISE_SEED.length} exercises`);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
