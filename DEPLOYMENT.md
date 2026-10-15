# Deployment Guide: Office EMS (React + Node.js + MongoDB)

This guide explains how to deploy the existing **client** (Vite/React) to **Vercel** and the **server** (Express/Mongoose) to **Render** using **MongoDB Atlas**. Do **not** create a new project—this is a drop-in configuration for the current codebase.

## 1) What changed / is configured

- **Backend binds to 0.0.0.0** and uses `process.env.PORT` (defaults 5000).
- **Env handling** accepts `MONGODB_URI` (preferred for Atlas) with `MONGO_URI` as fallback; keeps local `.env` compatible.
- **CORS** parses `CLIENT_URL` as a comma-separated list and allows the deployed frontend origin.
- **Cookies** are `SameSite`/`Secure` set adaptively: `sameSite='lax'` + `secure=false` in dev; `sameSite='none'` + `secure=true` in production (required for Vercel↔Render cross-site).
- **Health checks**: `GET /api/health` and `GET /health` return uptime/timestamp.
- **Uploads**: multer auto-creates `uploads/*` directories. Files are stored on disk (ephemeral on Render restarts). If uploads must survive redeploys, use external object storage (S3, Cloudinary, etc.).
- **Seed scripts**: destructive on data (`seed`, `dev:memory`, `attendance:reset-today`) — do **not** run against an Atlas DB with real data.

## 2) MongoDB Atlas setup (do not invent credentials)

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user (with IP allowlist or 0.0.0.0/0 for Render; prefer IP ranges for production).
3. Get the connection string (SRV) for Node.js. It should look like: `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/office_management?retryWrites=true&w=majority`
4. **Do not** commit this string. Set it as `MONGODB_URI` in Render.

## 3) Deploy backend to Render

### Root Directory
```
server
```

### Build Command
```bash
npm install
```
(You may use `npm ci` if you keep lockfiles. On Render, `npm install` is fine.)

### Start Command
```bash
npm start
```
`npm start` runs `node src/server.js`.

### Environment Variables (Render → Environment)

Set these:

| Variable | Value (example) | Notes |
|---|---|---|
| `NODE_ENV` | `production` | Required. |
| `PORT` | `10000` | Render may inject PORT; the app respects `process.env.PORT` and binds to `0.0.0.0`. |
| `HOST` | `0.0.0.0` | Usually `0.0.0.0` (set explicitly if needed). |
| `MONGODB_URI` | `mongodb+srv://...` | Use your Atlas SRV string. Do not share. |
| `JWT_ACCESS_SECRET` | (≥32 chars) | Generate securely (e.g. `openssl rand -base64 32`). |
| `JWT_REFRESH_SECRET` | (≥32 chars) | Generate separately. |
| `ACCESS_TOKEN_TTL` | `15m` | Existing default preserved. |
| `REFRESH_TOKEN_TTL` | `7d` | Existing default preserved. |
| `COOKIE_SECURE` | `true` | Render serves over HTTPS. |
| `COOKIE_SAMESITE` | `none` | For cross-site cookies with Vercel frontend. |
| `CLIENT_URL` | `https://your-app.vercel.app` | Comma-separated: e.g. `https://your-app.vercel.app,https://preview.vercel.app` if using previews. |
| `SERVER_URL` | `https://your-backend.onrender.com` | Used for building absolute asset URLs (avatars/docs). Include scheme, no trailing `/`. |
| `SEED_SUPER_ADMIN_EMAIL` | `superadmin@office.com` | Used only if you run seed scripts manually. |
| `SEED_SUPER_ADMIN_PASSWORD` | `Super@1234` | Change in production before seeding. |
| `MAIL_FROM` | `Office EMS <no-reply@office.com>` | Optional. SMTP_* optional. |
| `COMPANY_*` | as needed | Optional branding. |

### Health check (Render)
Set **Health Check Path** to `/health` or `/api/health`. Both respond with `200 {"success": true, "status":"ok", ...}`.

### Initial data (optional)
If you need demo data in Atlas, you can run a one-off script: `npm run seed`. **Never** run this against a DB that already contains real data. It will overwrite demo users and may delete/recreate some collections (see section 4).

## 4) Important notes about data "resetting/disappearing/duplicating"

Causes in this codebase (explain before running any seed):

1. **`npm run dev:memory` (scripts/dev-db.js)** — uses an in-memory MongoDB (`mongodb-memory-server`). Data is wiped on every restart and the app is re-seeded with demo data. Connection URI is overridden at runtime. This explains loss on restart.
2. **`npm run seed` (server/src/seed.js)** — upserts/overwrites demo users (`seedUsers` overwrites most fields and resets `isActive`) and **deletes many collections** then regenerates demo data: `seedEmployeeModules` does `deleteMany({})` on `Attendance`, `LeaveRequest`, `Payroll`, `SalaryStructure`, `PerformanceReview`, `Goal`, `Asset`, `EmployeeDocument`, `EmployeeNote`, `ActivityLog`. `seedOrganization` deletes `Department`, `Designation`, `Team`, `Location`.
3. **`npm run attendance:reset-today`** — deletes today's attendance + corrections.
4. **Re-seeding after deletions** — deleting seeded records (e.g. a demo employee) and re-running `seed` will recreate them.

So for a real production DB: avoid running these scripts. Use `seed` only on a completely empty/throwaway DB. `dev:memory` is for local dev/testing only.

## 5) Deploy frontend to Vercel

1. Connect this repo to [Vercel](https://vercel.com/).
2. **Framework Preset**: Vite (Vercel auto-detects).
3. **Root Directory**: `client` (since the React app lives in `client/`).
4. **Build Command**: `npm run build` (default).
5. **Output Directory**: `dist` (default).
6. **Install Command**: `npm install` (default).

### Environment Variables (Vercel → Project Settings)

| Variable | Value | Notes |
|---|---|---|
| `VITE_API_URL` | `https://your-backend.onrender.com/api` | Points to Render backend. Must include `/api` and HTTPS. |
| `VITE_SHOW_DEMO_LOGIN` | `true` or `false` | Optional. Set to `false` in production if you don't want demo buttons. |

### SPA rewrites
A `client/vercel.json` is included with:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```
This ensures deep links (e.g. `/employees/123`) don't 404 on refresh.

## 6) End-to-end verification

1. Render backend: after deploy, open `https://your-backend.onrender.com/health` or `/api/health` → `status: "ok"`.
2. Vercel frontend: open the deployed URL; login with seeded user if you ran seed.
3. Test cross-site: API calls succeed (credentials), auth flows work. If cookies aren't sent in some browsers (Safari ITP), consider using a custom domain for both or a backend proxy.
4. If uploads don't load, check `SERVER_URL` is correct and Render's ephemeral disk (files lost on restart/redeploy). Switch to object storage for persistence.

## 7) Security notes

- Never commit `.env` files or secrets to GitHub. `.gitignore` already excludes `.env*` (except `.env.example`).
- Do not expose JWT secrets/MongoDB credentials to the frontend. They belong only to Render.
- `withCredentials: true` requires exact CORS origins; `SameSite=None; Secure` requires HTTPS.
- Rotate secrets if previously exposed.
- Uploaded files are public if you serve `/uploads` as-is. Add auth/checks if you need private documents.
