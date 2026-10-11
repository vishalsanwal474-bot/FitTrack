# FitTrack — Gym Workout & Fitness Progress Tracker

Lightweight personal fitness tracker for logging workouts, tracking progress, estimating calories, and exporting shareable reports.

## Stack

- **Client:** React, Vite, React Router, Tailwind CSS, Axios, Lucide React, Recharts, html-to-image, jsPDF
- **Server:** Node.js, Express, MongoDB, Mongoose, JWT, bcrypt

## Requirements

- Node.js 18+
- MongoDB running locally (or update `MONGO_URI`)

## Setup

```bash
# Server
cd server
cp .env.example .env
# set a strong JWT_SECRET before any real deployment
npm install
npm run dev

# Client (new terminal)
cd client
cp .env.example .env
npm install
npm run dev
```

- App: http://localhost:5173
- API: http://localhost:5000/api

## Features

- Auth: register, login, logout, JWT persistence, protected routes, profile editing
- Workouts: log sets/reps/weight, drafts + complete, history CRUD, Quick Start (empty / repeat last)
- Exercises: ~60 curated movements by muscle group
- Comparison: previous performance + progressive overload volume
- PRs, streak, in-session workout timer
- Nutrition: MET calorie burn, BMR / TDEE / daily target, body-weight log
- Progress: daily / weekly / monthly / yearly charts + muscle donut + weight trend
- Recommendations: rule-based suggestions by muscle (provider-swappable later)
- Daily motivational quote
- Share: PNG progress card + PDF report (week / month / year)

## API overview

| Area | Endpoints |
|------|-----------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/auth/profile` |
| Workouts | `GET/POST /api/workouts`, `GET/PUT/DELETE /api/workouts/:id`, `POST /api/workouts/quick-start`, `GET /api/workouts/last`, `GET /api/workouts/previous` |
| Exercises | `GET /api/exercises`, `GET /api/exercises/:id`, `GET /api/exercises/muscle/:muscle` |
| Dashboard | `GET /api/dashboard` |
| Progress | `GET /api/progress/daily\|weekly\|monthly\|yearly`, `GET /api/progress/prs`, `GET /api/progress/report` |
| Weight | `GET/POST /api/weight`, `PUT/DELETE /api/weight/:id` |
| Nutrition | `GET /api/nutrition` |
| Recommendations | `GET /api/recommendations`, `GET /api/recommendations/:muscle` |
| Quotes | `GET /api/quotes/today` |

## Testing

```bash
cd server
npm run test:smoke
```

Smoke coverage includes auth, workouts, calories, PRs, dashboard, nutrition, progress, recommendations, weight logging, and cross-user authorization denial.

```bash
# from repo root — production client build + copy into server/public
npm run build
cd client && npm run build
```

## Deploy

See **[DEPLOY.md](./DEPLOY.md)** for:

- MongoDB Atlas setup
- **Single-service Docker on Render** (API + UI together) — recommended
- Local `docker compose up --build`
- Split deploy (Render API + Vercel frontend)

Quick local production check:

```bash
npm install --prefix client
npm install --prefix server
npm run build
cd server
# set NODE_ENV=production, MONGO_URI, JWT_SECRET, CLIENT_URL in .env
npm start
```

## Security notes

- Passwords hashed with bcrypt; JWT required on private routes
- Users can only read/write their own workouts, weights, and PRs
- `JWT_SECRET` must be changed for production (`NODE_ENV=production` refuses the example secret)
- JSON body limit 100kb; production 500s do not expose stack traces
- Client clears the session and redirects to login on 401

## Design principles

LIGHTWEIGHT · FAST · USEFUL · FUTURE-READY

No AI coach, social network, or giant external exercise DB in v1 — architecture leaves room to add them later without rewriting the core.

## Offline-first support

FitTrack now supports offline use after the app has been opened online and the user has signed in once. The frontend caches the application shell and exercise catalog and stores user/workout/weight data in IndexedDB. Workout and profile changes made without a connection are queued and synchronized with the API when connectivity returns.

The first login/registration still requires internet access. Offline mode is tied to the device/browser that was previously authenticated; clearing site data removes its local offline data.
