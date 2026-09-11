/**
 * End-to-end API smoke test for FitTrack.
 * Usage: node scripts/smokeTest.js
 * Requires MongoDB + server dependencies installed. Starts its own server process.
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.join(__dirname, '..');
dotenv.config({ path: path.join(serverRoot, '.env') });

const BASE = `http://127.0.0.1:${process.env.PORT || 5000}/api`;

async function req(method, urlPath, { token, body } = {}) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${method} ${urlPath} → ${res.status} ${data.message || res.statusText}`);
  }
  return data;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function waitHealth(ms = 15000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try {
      const res = await fetch(`${BASE}/health`);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error('Server health check timed out');
}

async function run() {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: serverRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
  });

  let stderr = '';
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await waitHealth();

    const email = `smoke_${Date.now()}@test.com`;
    const reg = await req('POST', '/auth/register', {
      body: {
        name: 'Smoke Tester',
        email,
        password: 'test1234',
        weight: 75,
        height: 175,
        age: 28,
        gender: 'male',
        activityLevel: 'moderate',
        fitnessGoal: 'maintain',
      },
    });
    assert(reg.token, 'register token missing');
    const token = reg.token;

    const me = await req('GET', '/auth/me', { token });
    assert(me.user?.email === email, 'me email mismatch');

    const exercises = await req('GET', '/exercises', { token });
    assert(exercises.exercises?.length > 20, 'exercise seed too small');
    const bench = exercises.exercises.find((e) => e.name === 'Barbell Bench Press');
    assert(bench, 'bench press missing');

    const workout = await req('POST', '/workouts', {
      token,
      body: {
        date: new Date().toISOString(),
        bodyParts: ['Chest'],
        duration: 40,
        status: 'completed',
        exercises: [
          {
            exerciseId: bench._id,
            exerciseName: bench.name,
            sets: [
              { reps: 10, weight: 50, completed: true },
              { reps: 8, weight: 50, completed: true },
            ],
          },
        ],
      },
    });
    assert(workout.workout?.id, 'workout id missing');
    assert(workout.workout.caloriesBurned > 0, 'calories not estimated');
    assert(workout.newPRs?.length >= 1, 'PR not detected');

    const dash = await req('GET', '/dashboard', { token });
    assert(dash.streak >= 1, 'streak missing');
    assert(dash.dailyQuote?.text, 'daily quote missing');

    const nutrition = await req('GET', '/nutrition', { token });
    assert(nutrition.bmr > 0 && nutrition.tdee > 0, 'BMR/TDEE missing');

    const progress = await req('GET', '/progress/weekly', { token });
    assert(progress.summary?.workouts >= 1, 'weekly progress empty');

    const report = await req('GET', '/progress/report?period=month', { token });
    assert(report.report?.stats?.workouts >= 1, 'report empty');

    const recs = await req('GET', '/recommendations/Chest', { token });
    assert(recs.exercises?.length > 0, 'recommendations empty');

    const weight = await req('POST', '/weight', {
      token,
      body: { weight: 74.8, date: new Date().toISOString().slice(0, 10) },
    });
    assert(weight.currentWeight === 74.8, 'weight sync failed');

    // Authorization: other user cannot read workout
    const other = await req('POST', '/auth/register', {
      body: { name: 'Other', email: `other_${Date.now()}@test.com`, password: 'test1234' },
    });
    let denied = false;
    try {
      await req('GET', `/workouts/${workout.workout.id}`, { token: other.token });
    } catch {
      denied = true;
    }
    assert(denied, 'cross-user workout access should fail');

    console.log('Smoke test passed.');
  } finally {
    child.kill('SIGTERM');
    if (stderr && process.env.SMOKE_DEBUG) console.error(stderr);
  }
}

run().catch((err) => {
  console.error('Smoke test failed:', err.message);
  process.exit(1);
});
