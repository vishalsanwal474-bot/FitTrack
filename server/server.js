import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './utils/db.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { ensureExercisesSeeded } from './services/exerciseProvider.js';
import authRoutes from './routes/authRoutes.js';
import exerciseRoutes from './routes/exerciseRoutes.js';
import workoutRoutes from './routes/workoutRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import weightRoutes from './routes/weightRoutes.js';
import nutritionRoutes from './routes/nutritionRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import quoteRoutes from './routes/quoteRoutes.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';
const clientDist = path.join(__dirname, 'public');
const serveClient = isProd && fs.existsSync(path.join(clientDist, 'index.html'));

app.use(
  cors({
    origin: process.env.CLIENT_URL || (isProd ? true : 'http://localhost:5173'),
    credentials: true,
  })
);
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', serveClient });
});

app.use('/api/auth', authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/weight', weightRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/quotes', quoteRoutes);

app.use('/api', notFound);

if (serveClient) {
  app.use(express.static(clientDist, { maxAge: '1d', index: false }));
  app.get('*', (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
      if (err) next(err);
    });
  });
} else {
  app.use(notFound);
}

app.use(errorHandler);

const start = async () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change_this_to_a_long_random_secret') {
    if (isProd) {
      throw new Error('JWT_SECRET must be set to a strong secret in production');
    }
    console.warn('Warning: set a strong JWT_SECRET in server/.env before deploying');
  }
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required');
  }

  await connectDB();
  const seed = await ensureExercisesSeeded();
  if (seed.seeded) {
    console.log(`Seeded ${seed.count} exercises`);
  }
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}${serveClient ? ' (serving client)' : ''}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
