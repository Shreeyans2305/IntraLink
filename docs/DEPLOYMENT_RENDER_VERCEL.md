# Deploy IntraLink (Render + Vercel)

This setup deploys:
- Backend (FastAPI + Socket.IO) on **Render**
- Frontend (React/Vite) on **Vercel**

## 1) Prerequisites

- GitHub repo connected to both platforms
- MongoDB Atlas connection string (recommended for production)

---

## 2) Deploy Backend on Render

A Render Blueprint file already exists at [render.yaml](../render.yaml).

### Option A: Blueprint (recommended)
1. In Render, click **New +** → **Blueprint**.
2. Select this repository.
3. Render reads [render.yaml](../render.yaml) and creates the `intralink-api` web service.
4. Fill required env vars in Render dashboard:
   - `MONGO_URL` = your Atlas URI
   - `CORS_ORIGINS` = your Vercel URL(s), comma-separated
     - Example: `https://intralink.vercel.app,https://intralink-git-main-<team>.vercel.app`

### Option B: Manual service creation
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:socket_app --host 0.0.0.0 --port $PORT`
- Health Check Path: `/health`

### Backend env vars to set
- `MONGO_URL` (required)
- `MONGO_DB` = `intralink` (or custom)
- `SECRET_KEY` (required, long random)
- `USE_MOCK_DB` = `false`
- `CORS_ORIGINS` = comma-separated frontend origins

After deploy, note your backend URL:
- `https://<your-render-service>.onrender.com`

---

## 3) Deploy Frontend on Vercel

Vercel config is at [frontend/vercel.json](../frontend/vercel.json).

1. In Vercel, **Add New Project** and import this repo.
2. Configure project:
   - **Root Directory**: `frontend`
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Add environment variables:
   - `VITE_API_URL` = `https://<your-render-service>.onrender.com/api`
   - `VITE_SOCKET_URL` = `https://<your-render-service>.onrender.com`
4. Deploy.

Reference env template: [frontend/.env.production.example](../frontend/.env.production.example)

---

## 4) Final CORS sync

After Vercel gives you production URL(s), update Render `CORS_ORIGINS` to include:
- main production domain
- preview domain(s) if you want preview deployments to work

Then redeploy/restart the Render service.

---

## 5) Validation checklist

- Backend health: `GET https://<render-url>/health` returns `{ "status": "ok" }`
- Frontend loads at Vercel URL
- Login/register works
- Chat connects via Socket.IO (messages/realtime updates work)

---

## 6) Common issues

- **CORS errors**: Missing Vercel domain in `CORS_ORIGINS`
- **Socket not connecting**: Wrong `VITE_SOCKET_URL` or Render service sleeping/cold-start
- **API 401/500**: Check `SECRET_KEY`, `MONGO_URL`, and backend logs on Render
- **Client-side routes 404**: Ensure [frontend/vercel.json](../frontend/vercel.json) rewrite exists
