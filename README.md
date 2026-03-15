# IntraLink

IntraLink is a controlled internal messaging platform (self-hosted, Slack-like) built as a monorepo with:

- **Backend:** FastAPI + Socket.IO + MongoDB
- **Frontend:** React + Vite + Redux Toolkit + React Query

It supports real-time messaging, threads, reactions, polls, temporary rooms, role-based moderation, and admin controls.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [Testing](#testing)
- [Deployment (Render + Vercel)](#deployment-render--vercel)
- [Troubleshooting](#troubleshooting)

---

## Features

- JWT authentication (REST + Socket.IO)
- Organization setup and whitelist onboarding
- Role-based access:
	- user
	- room supervisor/manager
	- admin
- Real-time room messaging
- Threads and emoji reactions
- Polls and live voting
- Temporary rooms with expiry
- Presence + typing indicators
- Slash commands
- Admin moderation and audit support

---

## Architecture

### Backend

- Single ASGI app combining FastAPI REST and Socket.IO:
	- `socket_app = socketio.ASGIApp(sio, other_asgi_app=app)`
- REST routes mounted under `/api`
- Socket.IO and REST share the same port
- MongoDB via Motor
- Background scheduler for temp-room expiry

### Frontend

- React SPA (Vite)
- Redux Toolkit for app state
- React Query for server data
- Axios API client + Socket.IO client singletons
- Route guards for protected/admin routes

---

## Tech Stack

### Backend

- Python 3.11+
- FastAPI
- python-socketio
- Motor / PyMongo
- APScheduler
- pytest + pytest-asyncio

### Frontend

- React 19
- Vite
- Tailwind CSS
- Redux Toolkit
- React Query
- socket.io-client

---

## Repository Structure

```text
IntraLink/
├─ backend/
│  ├─ main.py
│  ├─ requirements.txt
│  ├─ app/
│  │  ├─ routers/
│  │  ├─ websockets/
│  │  ├─ core/
│  │  ├─ db/
│  │  ├─ middleware/
│  │  ├─ services/
│  │  └─ background/
│  └─ tests/
├─ frontend/
│  ├─ package.json
│  ├─ public/
│  └─ src/
├─ docs/
├─ render.yaml
└─ README.md
```

---

## Local Development Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm
- MongoDB (local or Atlas)

### 1) Clone

```bash
git clone <your-repo-url>
cd IntraLink
```

### 2) Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env` (example below in Environment Variables).

### 3) Frontend setup

```bash
cd ../frontend
npm install
```

Create `frontend/.env` if needed.

---

## Environment Variables

### Backend (`backend/.env`)

```dotenv
MONGO_URL=mongodb://localhost:27017
MONGO_DB=intralink
SECRET_KEY=replace-with-a-long-random-secret
USE_MOCK_DB=false
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (`frontend/.env`)

```dotenv
VITE_API_URL=http://localhost:8000/api
VITE_SOCKET_URL=http://localhost:8000
```

---

## Running the App

### Start backend

From `backend/`:

```bash
source venv/bin/activate
uvicorn main:socket_app --reload --host 0.0.0.0 --port 8000
```

### Start frontend

From `frontend/`:

```bash
npm run dev
```

Frontend runs on Vite dev server (typically `http://localhost:5173`) and proxies API/socket traffic to `http://localhost:8000`.

---

## Testing

From `backend/`:

```bash
source venv/bin/activate
pytest
```

Run specific tests:

```bash
pytest tests/test_auth.py
pytest tests/test_auth.py::test_register
```

---

## Deployment (Render + Vercel)

This repo supports:

- **Render** for backend
- **Vercel** for frontend

Resources:

- `render.yaml`
- `frontend/vercel.json`
- `docs/DEPLOYMENT_RENDER_VERCEL.md`

### Render (backend)

- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:socket_app --host 0.0.0.0 --port $PORT`
- Health: `/health`

Set environment variables in Render:

- `MONGO_URL`
- `MONGO_DB`
- `SECRET_KEY`
- `USE_MOCK_DB=false`
- `CORS_ORIGINS` (must include your Vercel domain)

### Vercel (frontend)

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`

Set environment variables in Vercel:

- `VITE_API_URL=https://<your-render-service>.onrender.com/api`
- `VITE_SOCKET_URL=https://<your-render-service>.onrender.com`

---

## Troubleshooting

### CORS blocked in browser

- Ensure Render `CORS_ORIGINS` includes exact Vercel origin(s), comma-separated, no trailing slash.

### Socket not connecting

- Verify `VITE_SOCKET_URL`
- Confirm backend is reachable and not sleeping

### Frontend build fails on Vercel

- Ensure Vercel root directory is set to `frontend`
- Ensure env vars are set in Vercel project settings

### Logo/assets not loading in production

- Check filename case (Linux deployments are case-sensitive)

---

## Notes

- Do not commit production secrets.
- Prefer using managed MongoDB (Atlas) for production.
- Use HTTPS endpoints in production for both API and sockets.
