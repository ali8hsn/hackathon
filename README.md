# SIREN — Situational Intelligence & Response Enablement Network

AI-powered 911 emergency response platform. Built for a hackathon demo.

## What it does

- **F1 AI Hold-Time Intake** — Callers on hold talk to an AI that captures structured incident data in real time and streams it to the dispatcher dashboard.
- **F2 Dispatcher Command Board** — Dark command-center UI with live incident queue, map, and dispatch flow.
- **F3 Camera-Aware Routing** — Routes that factor in Austin public traffic cameras and real-time congestion scoring.
- **F4 AI Scan Mode** — Point your phone camera at an emergency scene, get 3 immediate action steps.
- **F5 Predictive Heatmap** — ML-powered heatmap showing where incidents are likely in the next hour.

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm (`npm i -g pnpm`)
- Python 3.11+ (for ML service, optional)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example apps/web/.env
# Edit apps/web/.env and add your ANTHROPIC_API_KEY
```

### 3. Initialize the database

```bash
cd apps/web
DATABASE_URL="file:./dev.db" pnpm prisma migrate dev --config prisma/prisma.config.ts
DATABASE_URL="file:./dev.db" pnpm prisma db seed
```

### 4. Run the web app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Run the ML service (optional, for heatmap)

```bash
cd services/ml
pip install -r requirements.txt
python scripts/gen_fake_history.py  # generate seed data
uvicorn main:app --port 8001
```

## Demo URLs

| URL | Description |
|-----|-------------|
| `/` | Landing page |
| `/dashboard` | Dispatcher command center |
| `/call` | Caller intake simulator |
| `/scan` | AI scene guidance (mobile) |
| `/report` | Citizen non-urgent report |

## Architecture

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Database:** SQLite via Prisma 7
- **AI:** Anthropic Claude claude-sonnet-4-6 (text + vision)
- **Map:** MapLibre GL JS + OpenStreetMap
- **ML:** Python FastAPI + scipy gaussian_kde

## Seeding demo data

```bash
cd apps/web
# Seed units, cameras, and incidents
DATABASE_URL="file:./dev.db" pnpm db:seed

# Start demo tick (nudges units, spawns incidents)
DATABASE_URL="file:./dev.db" pnpm tsx scripts/demo_tick.ts

# Seed in-flight intake calls
DATABASE_URL="file:./dev.db" pnpm tsx scripts/demo_seed_calls.ts
```
