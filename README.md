# SIREN — Situational Intelligence & Response Enablement Network

> AI-powered 911 emergency response platform. Hackathon demo.

**"Ali's grandfather had a medical emergency. The call was placed on hold. SIREN fixes that."**

SIREN is an end-to-end emergency response platform built in ~12 hours by two autonomous AI agents. When a 911 call is placed on hold, SIREN's AI picks up — confirming location, asking the right questions, and filing a live incident ticket before a dispatcher ever answers.

---

## Quick Start

### Prerequisites

- Node.js 20+ and pnpm (`npm install -g pnpm` or via install script)
- Python 3.11+ with pip
- An Anthropic API key

### Web App

```bash
cd apps/web
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

pnpm install
DATABASE_URL="file:./dev.db" pnpm db:seed   # seeds units, incidents, cameras

pnpm dev  # http://localhost:3000
```

### ML Heatmap Service

```bash
# Generate historical data (one-time)
python3 scripts/gen_fake_history.py

# Start service
cd services/ml
pip install -r requirements.txt
uvicorn main:app --port 8001
```

---

## Feature Overview

| Feature | URL | Description |
|---|---|---|
| Dispatcher Board | `/dashboard` | Dark command center with map, incident queue, dispatch |
| Caller Intake | `/call` | AI holds your place in queue, files a live ticket |
| Scan Mode | `/scan` | Point camera at scene → 3 immediate actions |
| Landing | `/` | Navigation hub |

## Architecture

```
apps/web/          Next.js 16 (App Router) + Tailwind + shadcn/ui
  lib/austin.ts    Austin traffic camera feed (Socrata + fallback)
  lib/osrm.ts      Route computation via OSRM public server
  lib/congestion.ts Claude vision congestion scoring (cached 60s)
  lib/claude.ts    Anthropic SDK wrapper (JSON + text)
  lib/db.ts        Prisma 7 + better-sqlite3
services/ml/       Python FastAPI heatmap service
  main.py          Gaussian KDE over historical incidents
```

## Environment Variables

```env
ANTHROPIC_API_KEY=        # required for AI features
DATABASE_URL=file:./dev.db
ML_SERVICE_URL=http://localhost:8001
NEXT_PUBLIC_MAPTILER_KEY= # optional, for prettier tiles
```

## Demo

See `docs/DEMO_SCRIPT.md` for the full walkthrough.

---

*Every second matters.*
