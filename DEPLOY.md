# Deploy FitTrack

Two supported options:

1. **Single service (recommended)** — one Docker/Render app serves API + React
2. **Split** — API on Render, frontend on Vercel

Both need **MongoDB Atlas**.

---

## 1. MongoDB Atlas (required)

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Database Access → add a user + password
3. Network Access → allow `0.0.0.0/0` (or your host IPs)
4. Connect → Drivers → copy the URI, e.g.  
   `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/workout-tracker?retryWrites=true&w=majority`

---

## 2. Single service on Render (Docker)

### A. Push the repo to GitHub

### B. Create a Web Service

- New → Web Service → connect the repo  
  **or** use Blueprint: New → Blueprint → select repo (`render.yaml`)

### C. Environment variables

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `MONGO_URI` | your Atlas URI |
| `JWT_SECRET` | long random string (or use Render “generate”) |
| `CLIENT_URL` | `https://YOUR-SERVICE.onrender.com` |
| `PORT` | `5000` (Render may override) |

Docker build already sets `VITE_API_URL=/api` so the UI calls the same host.

### D. After first deploy

1. Open `https://YOUR-SERVICE.onrender.com/api/health` → `{ "status": "ok", "serveClient": true }`
2. Open the site root → register a user
3. Free Render dynos sleep when idle; first request can take ~30–60s

---

## 3. Local production-like run (Docker Compose)

```bash
docker compose up --build
```

- App: http://localhost:5000  
- Mongo: localhost:27017  

Stop with `Ctrl+C`, or `docker compose down`.

---

## 4. Build & run without Docker

```bash
# from repo root
npm install --prefix client
npm install --prefix server
npm run build
# copies client/dist → server/public

cd server
# set production env in .env:
# NODE_ENV=production
# MONGO_URI=...
# JWT_SECRET=...
# CLIENT_URL=https://your-domain.com
npm start
```

---

## 5. Split deploy (API + Vercel)

### API (Render — Node, not Docker)

- Root directory: `server`
- Build: `npm install`
- Start: `npm start`
- Env: `NODE_ENV`, `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL=https://your-app.vercel.app`

### Frontend (Vercel)

- Root directory: `client`
- Build: `npm run build`
- Output: `dist`
- Env: `VITE_API_URL=https://YOUR-API.onrender.com/api`

`client/vercel.json` already rewrites SPA routes to `index.html`.

---

## Checklist before going live

- [ ] Atlas URI works from the host (Network Access open)
- [ ] `JWT_SECRET` is unique and strong
- [ ] `CLIENT_URL` matches the real frontend origin (CORS)
- [ ] `/api/health` returns ok
- [ ] Register → login → create a workout on the live URL
- [ ] PNG/PDF export tested on mobile Safari/Chrome

## Common issues

| Symptom | Fix |
|---------|-----|
| CORS errors | Set `CLIENT_URL` to the exact frontend origin (https, no trailing slash) |
| Blank UI / API 404 | Single-service: confirm Docker build copied `public/`; health should show `serveClient: true` |
| Mongo connection failed | Check Atlas user/password URL-encoding and Network Access |
| App sleeps / slow first load | Free Render plan cold start — upgrade or ping `/api/health` |
