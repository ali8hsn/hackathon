# SIREN — Situational Intelligence & Response Enablement Network

> Hackathon project. Monorepo. Target: a judge-blowing demo after ~12 hours of autonomous agent work.
> Users: 911 callers on hold, dispatchers, EMS/fire/police responders, and bystanders at a scene.
> North star metric: **"seconds saved per emergency."** Every feature we build must map back to this.

---

## 0. TL;DR for the agents reading this

You (Claude Code / Cursor Agent) are about to build **SIREN**, an end-to-end emergency response platform. Humans are asleep. You are NOT being babysat. Read this entire document before writing code. Then open `AGENT_ASSIGNMENTS.md` to find your workstream. Commit in small logical chunks on your assigned branch. When blocked, append to `BLOCKERS.md` with a timestamp and KEEP GOING on other tasks. Do not delete other agents' work. Prefer additive changes over refactors.

When in doubt: **ship something demo-able over something perfect.**

---

## 1. The Pitch (use this verbatim in the demo)

> "Ali's grandfather had a medical emergency. The 911 call was placed on hold. Less than a minute felt like an eternity — and in a cardiac emergency, every minute on hold reduces survival odds by 7-10%. SIREN fixes that.
>
> When a 911 call is placed on hold, SIREN's AI picks up. It doesn't play music — it talks. It confirms your location, asks what's happening, identifies severity, and files a live incident ticket that appears on the dispatcher's screen before they ever pick up. By the time a human takes the call, they already know what they're walking into.
>
> SIREN doesn't stop there. It fuses Austin's hundreds of live public traffic cameras with real-time routing so fire trucks and ambulances dodge congestion before it hits them. And for anyone at the scene, SIREN's mobile scan mode turns a phone camera into a first-response coach — CPR prompts, fire triage, hazard identification — before help arrives.
>
> One story. One system. Every second matters."

---

## 2. Feature Set — what we're actually building

Five flagship features. Not four. Not six. Five. If a workstream finishes early, **polish existing features. Do NOT add new ones.**

### F1 — AI Hold-Time Intake (FLAGSHIP)
The heart of the pitch. A caller on hold talks to an AI that captures structured incident data in real time.

- Caller-facing page: `/call` (simulates the "on hold" experience).
- Browser mic captures audio. Web Speech API transcribes in real time. For better quality we can also POST audio chunks to Anthropic or OpenAI Whisper — both acceptable.
- Every ~1 second of new transcript, the backend re-runs a Claude prompt that updates a structured incident ticket:
  ```
  {
    status: "intake" | "ready_for_dispatcher",
    type, severity_1_to_5, location_guess,
    summary, key_observations[],
    follow_up_questions[],    // the AI's next questions for the caller
    life_safety_flags[],      // e.g. "not breathing", "active fire", "weapon", "child"
    confidence_0_to_1
  }
  ```
- The AI speaks follow-up questions back to the caller via browser `speechSynthesis`. Voice is calm, slow, clear. Never interrupts. Never says "I'm an AI."
- Location is GPS-acquired from the browser when the user grants permission; fall back to the AI asking.
- The ticket streams live to `/dashboard` (dispatcher view). Severity >= 4 triggers a **pre-dispatch** suggestion on the dispatcher side.
- Post-call: auto-generated incident summary + audit log of what the AI captured vs. what the dispatcher confirmed.

**Demo trick:** seed three "incoming calls" at demo time so the dashboard visibly fills up with live-streaming tickets while the demo-er talks through one of them.

### F2 — Dispatcher Command Board
Where every ticket lands. The dispatcher's single source of truth.

- Dark command-center UI. Split pane: map (left, ~65% width) + incident queue (right).
- Incident queue shows live-updating cards. Severity-colored left border. New incidents slide in with a subtle animation.
- Click a card: a detail drawer opens with full ticket, live transcript (if from intake), nearest units, nearest cameras, and "Dispatch" button.
- Real-time updates via polling every 1s (simple, reliable). Supabase realtime is optional if it's working.
- Dispatcher can: accept a ticket, reassign units, change severity, mark on-scene, close.

### F3 — Camera-Aware Routing (the "Austin traffic cameras" idea)
Routes that actually know what's happening on the road.

- Pulls live Austin public camera feed: `https://data.mobility.austin.gov/traffic-cameras` (underlying open data on Socrata; confirm the JSON endpoint at build time and fall back to a seeded list of ~50 cameras if unreachable).
- When a unit is dispatched, system computes the optimal route using OSRM public server (`https://router.project-osrm.org`).
- For each camera within 200m of the route, periodically fetch its still image and ask Claude (vision) to rate congestion 0-1 ("how blocked is this roadway on a 0-1 scale; answer with a single number"). Cache 60s.
- Bias route cost with camera congestion. Show an alternate route toggle.
- Dispatcher can click any camera-along-route pin and see the live still.

### F4 — AI Scan Mode (the "point the phone" idea)
For bystanders at the scene.

- Mobile-first page at `/scan`.
- Camera permission → sends a frame every ~2s to `/api/scan`.
- Claude vision returns `{ summary, actions: [3 ordered imperatives] }`.
- Three large glanceable action cards; voice read-out via `speechSynthesis`.
- Mode picker: `medical | fire | accident | general`.

### F5 — Predictive Heatmap
Shows where the next hour's incidents are likely to happen. It's a demo feature — it just needs to look convincing.

- Python FastAPI service at `/services/ml`, endpoint `/heatmap?at=ISO8601`.
- Historical "incidents" CSV (10k rows) generated by `scripts/gen_fake_history.py`; plausible Austin-centric distribution, weighted by time of day.
- `scipy.stats.gaussian_kde` over lat/lng weighted by recency + hour-of-day.
- Returns GeoJSON. The web app renders it as a MapLibre heatmap layer toggleable from the dashboard.

---

## 3. Non-Goals (do NOT build these)

- Real integration with Austin 911 CAD systems. This is a demo.
- Real Twilio phone routing. *(Optional stretch goal only; web-based simulation is canonical.)*
- Realtime full video streaming from phones. Still frames and short clips only.
- User accounts / auth. Hard-code "dispatcher" role. Citizens are anonymous.
- Native iOS / Android apps. Mobile web only.
- Pixel-perfect responsive on every breakpoint. Optimize for (a) laptop-sized dispatcher, (b) phone-sized scan / call / report.
- Payments, settings pages, admin panels, profile pages.
- Multi-language support (mention it verbally in the demo; don't implement it).

---

## 4. Tech Stack (locked — do not change)

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 14 (App Router)** + TypeScript | one deploy, API routes included |
| Styling | **Tailwind** + **shadcn/ui** | fast, judge-friendly |
| Map | **MapLibre GL JS** + OpenStreetMap tiles | free, no key required |
| Routing engine | **OSRM public server** | free, no key |
| Database | **SQLite via Prisma** | zero setup, file-based |
| Realtime | **polling every 1s** | simple, reliable |
| AI (vision + text + structured JSON) | **Anthropic Claude API** (`claude-sonnet-4-6`) | already have keys |
| Speech-to-text | **Web Speech API** (primary) + Whisper fallback | |
| Text-to-speech | **Web speechSynthesis API** | free, good enough |
| ML microservice | **Python FastAPI** in `/services/ml` | F5 only |
| Deploy | **Vercel** (web) + **Render free tier** (ML) | free |
| Package manager | **pnpm** | required |
| Linting | ESLint + Prettier; `pnpm lint` must pass |

### `.env.example`

```
ANTHROPIC_API_KEY=
NEXT_PUBLIC_MAPTILER_KEY=            # optional, for prettier tiles
ML_SERVICE_URL=http://localhost:8001
DATABASE_URL=file:./dev.db
```

---

## 5. Repo Layout

```
siren/
  apps/web/                       # Next.js app
    app/
      (dispatcher)/
        dashboard/page.tsx        # F2
        incidents/[id]/page.tsx
      (public)/
        call/page.tsx             # F1 caller-facing
        scan/page.tsx             # F4
        report/page.tsx           # supplementary non-urgent reports
      api/
        intake/start/route.ts     # F1 — begin a call session
        intake/chunk/route.ts     # F1 — append transcript, returns updated ticket
        intake/finish/route.ts    # F1 — close session, hand to dispatcher queue
        incidents/route.ts
        incidents/[id]/route.ts
        incidents/[id]/dispatch/route.ts
        cameras/route.ts
        cameras/[id]/still/route.ts
        route/route.ts            # F3
        scan/route.ts             # F4
        report/route.ts
        heatmap/route.ts          # proxies to ML service
      layout.tsx
      globals.css
    components/
      map/IncidentMap.tsx
      map/RouteLayer.tsx
      map/CameraMarkers.tsx
      map/HeatmapOverlay.tsx
      intake/CallScreen.tsx       # F1 caller UI
      intake/LiveTicket.tsx       # F1 dashboard mini-widget
      incidents/IncidentCard.tsx
      incidents/IncidentQueue.tsx
      incidents/IncidentDetailDrawer.tsx
      scan/ScanCamera.tsx
      scan/ActionCards.tsx
      report/ReportForm.tsx
      ui/ (shadcn auto-generated)
    lib/
      austin.ts                   # Austin camera feed + fallback seed
      osrm.ts                     # OSRM wrapper
      claude.ts                   # Anthropic SDK wrapper, prompt builders
      intake.ts                   # F1 prompt builder + schema
      congestion.ts               # camera-image-to-congestion-score
      db.ts
      types.ts
    prisma/
      schema.prisma
      seed.ts
    public/
    tailwind.config.ts
    next.config.mjs
    package.json
  services/ml/
    main.py                       # FastAPI heatmap
    requirements.txt
    Dockerfile
    data/historical_incidents.csv
  scripts/
    gen_fake_history.py
    seed_cameras.ts
    demo_tick.ts                  # nudges units + spawns incidents live
    demo_seed_calls.ts            # seeds three in-flight intake sessions
  docs/
    DEMO_SCRIPT.md
    JUDGING_RUBRIC_NOTES.md
    screenshots/
  .env.example
  README.md
  PROJECT_BRIEF.md
  AGENT_ASSIGNMENTS.md
  CLAUDE_CODE_PROMPT.md
  CURSOR_PROMPT.md
  AUTONOMOUS_SETUP.md
  BLOCKERS.md
  PROPOSALS.md                    # append-only; agents propose schema changes here
  pnpm-workspace.yaml
  package.json
```

---

## 6. Data Model (Prisma schema — this is the contract)

```prisma
datasource db { provider = "sqlite"; url = env("DATABASE_URL") }
generator client { provider = "prisma-client-js" }

model IntakeSession {
  id            String   @id @default(cuid())
  startedAt     DateTime @default(now())
  endedAt       DateTime?
  transcript    String   @default("")          // running transcript
  lat           Float?
  lng           Float?
  ticket        String   @default("{}")        // JSON: current AI-built ticket
  status        String   @default("intake")    // intake | ready | handed_off | closed
  incident      Incident?
  incidentId    String?  @unique
}

model Incident {
  id              String   @id @default(cuid())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  type            String   // medical | fire | accident | hazmat | other
  severity        Int      // 1-5
  lat             Float
  lng             Float
  address         String?
  description     String?
  status          String   @default("open")    // open | dispatched | enroute | onscene | closed
  reporterKind    String   @default("dispatcher") // dispatcher | citizen | intake | report
  mediaUrl        String?
  assignedUnitId  String?
  eta             Int?                          // seconds
  assignedUnit    Unit?    @relation(fields: [assignedUnitId], references: [id])
  intakeSession   IntakeSession? @relation(fields: [intakeSessionId], references: [id])
  intakeSessionId String? @unique
}

model Unit {
  id         String     @id @default(cuid())
  callsign   String     @unique                 // E14, M22, P8
  kind       String                             // engine | medic | police
  lat        Float
  lng        Float
  status     String     @default("available")   // available | dispatched | enroute | onscene | outofservice
  incidents  Incident[]
}

model Camera {
  id             String    @id                   // Austin feed id
  name           String
  lat            Float
  lng            Float
  stillUrl       String
  lastCongestion Float?                          // 0..1
  lastSampledAt  DateTime?
}

model ScanEvent {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  mode      String
  summary   String
  actions   String   // JSON array
}
```

---

## 7. API Contract (FREEZE)

```
# Intake (F1)
POST   /api/intake/start            body: { lat?, lng? }            -> { sessionId }
POST   /api/intake/chunk            body: { sessionId, transcriptDelta }
                                                                     -> { ticket, aiFollowUp?: string }
POST   /api/intake/finish           body: { sessionId }              -> { incidentId }

# Dispatcher (F2)
GET    /api/incidents                                               -> Incident[]
POST   /api/incidents                                               -> Incident
PATCH  /api/incidents/:id                                            -> Incident
POST   /api/incidents/:id/dispatch                                  -> { unit, route, eta }

# Routing + cameras (F3)
GET    /api/cameras                                                 -> Camera[]
GET    /api/cameras/:id/still                                        -> image/jpeg (proxied, cached 15s)
GET    /api/route?from=lat,lng&to=lat,lng                           -> { geometry, durationSec, distanceM, cameraIdsAlongRoute[] }

# Scan (F4)
POST   /api/scan                    body: { imageBase64, mode }      -> { summary, actions[] }

# Supplementary report
POST   /api/report                   body: { lat, lng, description, mediaBase64? } -> Incident

# Heatmap (F5)
GET    /api/heatmap?at=ISO8601                                       -> GeoJSON FeatureCollection
```

All responses JSON unless noted. All errors: `{ error: string, code: string }` with appropriate HTTP status.

---

## 8. Austin Data Source Notes

- Web page: `https://data.mobility.austin.gov/traffic-cameras`
- Underlying dataset (Socrata, confirm at build): `https://data.austintexas.gov/resource/b4k4-adkb.json`
- Each camera exposes a still JPEG. `/api/cameras/:id/still` proxies it (5s fetch timeout, placeholder fallback, `Cache-Control: public, max-age=15`).
- **Fallback:** if the Austin endpoint is unreachable, use seeded cameras from `scripts/seed_cameras.ts` (list of ~50 hand-coded lat/lng across Austin). Do NOT block the rest of the app.

---

## 9. Claude Prompt Library (single source of truth)

### 9a. Intake ticket builder (F1) — runs every ~1s while caller speaks

System:
```
You are SIREN Intake, an AI that triages 911 calls while the caller is on hold.
You will receive the running transcript of what the caller has said so far, plus
optional GPS coordinates. Your job is to maintain a structured incident ticket
that a dispatcher will see in real time.

Respond ONLY with JSON, no prose, matching this schema exactly:
{
  "status": "intake" | "ready_for_dispatcher",
  "type": "medical" | "fire" | "accident" | "hazmat" | "other" | "unknown",
  "severity": 1 | 2 | 3 | 4 | 5 | null,
  "location_guess": "short human-readable guess or null",
  "summary": "<=30 words, neutral, present tense",
  "key_observations": ["short bullets, imperative-free, facts only"],
  "life_safety_flags": ["e.g. not_breathing, active_fire, weapon_present, child_involved, unconscious"],
  "follow_up_questions": ["at most 1 short question the caller should answer next"],
  "confidence": 0.0 to 1.0
}

Rules:
- Update the ticket as more information arrives. Keep previously confirmed facts.
- "ready_for_dispatcher" means you have type + severity + location with confidence >= 0.7.
- Severity 5 = immediate life threat (cardiac, stopped breathing, active shooter, fire trapping people).
- Severity 1 = non-urgent.
- Ask at most one follow-up question at a time. Prefer yes/no or one-word answers.
- NEVER ask about insurance, identity, or politics.
- NEVER say you are an AI, never apologize, never add disclaimers.
- If the caller seems panicked, the follow-up question should be calming and concrete
  ("Is the person breathing? Yes or no.")
```

User (built each tick):
```
GPS: {lat}, {lng}   (or "unknown")
Transcript so far:
"""
{full_transcript}
"""
```

### 9b. Intake voice line (F1) — what the AI SAYS to the caller

After each ticket update, if `follow_up_questions[0]` exists and it's been >=3 seconds since the AI last spoke, call this prompt:

System:
```
You are SIREN Intake speaking to a 911 caller on hold. You just decided your
next question. Say it out loud in a calm, slow, reassuring tone. Output ONLY
the spoken words. No stage directions. No greetings if you've already greeted.
Max 20 words. Prefer "Stay with me." / "You're doing great." phrasing when
appropriate before the question.
```

### 9c. Scan mode (F4)

```
You are SIREN, an on-scene emergency assistant. The user is pointing their
phone at the scene. You will receive one image and a mode hint
(medical | fire | accident | general).

Respond ONLY with JSON:
{
  "summary": "one sentence, <= 20 words, what you see",
  "actions": ["imperative, <= 10 words", "...", "..."]   // exactly 3
}

Rules:
- Order actions by urgency.
- If unconscious person: first action mentions checking breathing / 911.
- If indoor fire: first action is "Get out, close doors behind you."
- Never ask questions. No disclaimers. Never say you are an AI.
- If the scene is unclear, still return 3 useful general actions.
```

### 9d. Citizen report triage (supplementary /report)

```
You are a 911 triage assistant classifying a non-urgent citizen report
(description + optional image). Respond ONLY with JSON:
{
  "type": "medical" | "fire" | "accident" | "hazmat" | "other",
  "severity": 1-5,
  "suggested_units": ["medic" | "engine" | "police"],
  "summary": "<=20 words, neutral"
}
```

### 9e. Camera congestion (F3)

```
You will receive one roadway still image. Rate how congested the roadway
appears on a scale from 0.0 (empty road) to 1.0 (fully blocked / standstill
traffic). Respond with ONLY a single decimal number. No prose.
```

---

## 10. UI / Design Direction

- **Dispatcher dashboard:** dark command-center. `bg-zinc-950`, `text-zinc-100`. Accents: `red-500` for open/severe, `amber-400` for enroute, `emerald-400` for available, `indigo-400` for intake-in-progress.
- **Citizen /call, /scan, /report:** bright, calming, accessible. Large tap targets. Huge single-action buttons.
- shadcn components: `Card`, `Button`, `Badge`, `Dialog`, `Sheet`, `Toast`, `Separator`, `Progress`, `Tabs`.
- Icons: `lucide-react` only.
- Animations: `framer-motion`. Subtle. Incident cards fade/slide in. Don't overdo.
- Typography: Inter. Dispatcher view uses `tabular-nums` for times/IDs.
- No emojis in UI. No cute copy. This is a life-safety tool. Neutral, competent tone.
- Every interactive element: hover state + focus ring. Keyboard navigable.
- Dispatcher viewport split: map ~65% left, queue ~35% right. Mobile not required for dispatcher.
- Caller /call screen: a giant pulsing circle indicating "listening," transcript appearing below, AI's most recent question in a top banner.

---

## 11. Seeding

`prisma db seed`:
- ~50 Austin traffic cameras (live fetch OR hardcoded fallback in `scripts/seed_cameras.ts`).
- 12 response units plausibly placed: E1..E5 (engines), M1..M4 (medics), P1..P3 (police).
- 3 initial open incidents of varying types across Austin.

Scripts for demo liveness:
- `scripts/demo_tick.ts` — every 10s, nudge assigned units toward their incidents; 5% chance of spawning a random incident.
- `scripts/demo_seed_calls.ts` — seeds three in-progress intake sessions with partial transcripts so the dashboard visibly has activity when the demo starts.

---

## 12. Workstreams (parallelizable tracks)

- **WS-A: Scaffold + shared plumbing** — MUST finish before any other workstream can meaningfully progress. One agent only.
- **WS-B: F1 Intake** (AI hold-time caller experience + dispatcher live ticket stream)
- **WS-C: F2 Dispatcher Board** (map + queue + dispatch flow)
- **WS-D: F3 Camera-aware routing** (Austin cameras, OSRM, congestion scoring)
- **WS-E: F4 Scan mode**
- **WS-F: F5 Heatmap ML service**
- **WS-G: Polish** (demo script, README, seed data, screenshots)

Detailed per-workstream TODOs live in `AGENT_ASSIGNMENTS.md`.

---

## 13. Definition of Done (per workstream)

A workstream is DONE when:
1. Its feature works end-to-end locally with `pnpm dev` + (if applicable) `uvicorn` running.
2. `pnpm lint` passes for touched packages.
3. There's a ~30-second "happy path" a judge can click through without a crash.
4. The workstream's section of `docs/DEMO_SCRIPT.md` is written.
5. At least one screenshot or gif in `docs/screenshots/`.

---

## 14. Demo Script Skeleton (WS-G fills this in)

Target total: **under 3 minutes.**

1. **Hook (20s):** Ali's grandfather story. "Hold music kills. SIREN replaces it."
2. **Intake (40s):** Open `/call` on a phone. Ali says: *"My grandfather collapsed in the kitchen. I don't know if he's breathing."* Watch the dispatcher dashboard populate a live ticket with severity 5 and a red flag in <5s. The AI asks "Is he breathing? Yes or no."
3. **Dispatch (30s):** Dispatcher clicks the ticket. SIREN auto-dispatches nearest medic. Route shown on map. Click a camera along the route — it's clear. Toggle heatmap — the neighborhood is a warm zone.
4. **Scan (30s):** Flip to another phone at "the scene." Point camera at a picture of a person slumped over. Three actions appear: "Check breathing. Start CPR if none. Keep talking to them."
5. **Close (20s):** "One story. One system. Every second matters."

---

## 15. Guardrails for overnight agents — READ TWICE

1. **Never rewrite `schema.prisma`, `PROJECT_BRIEF.md`, or the API contract without first appending a proposal to `PROPOSALS.md`.** If humans are asleep, assume the answer is no.
2. **TypeScript strict mode.** No `any` unless justified with a `// reason:` comment.
3. **No new top-level dependencies** beyond what's in `package.json` after scaffold without adding a one-line note to `docs/DEPENDENCIES_ADDED.md`.
4. **Secrets never in code.** Only `.env`. Only `.env.example` is committed.
5. **Every commit compiles.** If your change breaks the build, fix it before moving on.
6. **Commit messages imperative + scoped:** `feat(intake): stream tickets to dashboard`, `fix(map): handle empty camera list`.
7. **Don't touch another workstream's files** unless necessary. If you must, note it in the commit body.
8. **Finished early? Polish. Loading states. Empty states. Error boundaries. A nicer 404. Do NOT start a new feature.**
9. **Third-party down** (OSRM, Austin data, Anthropic): fall back to mock / stub. Note it in `BLOCKERS.md`. KEEP GOING.
10. **Stop conditions:** after 3 consecutive failed attempts at the same problem, or >30 minutes on a single subtask with no progress, write it up in `BLOCKERS.md` and move to the next TODO.
11. **Never add computer-use or browser automation.** This runs in a sandbox with no GUI.
12. **No telemetry, analytics, or external network calls** beyond the ones listed in Section 4.
13. **Do not `git push --force`. Do not `git reset --hard` unless you made the last commit yourself.**
14. **When in doubt, commit a WIP and write to `BLOCKERS.md`.** Progress is preserved; context is not.

---

## 16. Success Criteria (what Ali sees on wake-up)

- [ ] `pnpm install && pnpm dev` boots the web app cleanly.
- [ ] `cd services/ml && uvicorn main:app --port 8001` boots the ML service.
- [ ] `/dashboard` shows Austin map with cameras, units, and seeded incidents.
- [ ] `/call` opens a caller view, captures speech, produces a live ticket on the dashboard in <5s.
- [ ] Dispatcher can auto-dispatch an incident; route renders; clicking a camera along the route shows its still image.
- [ ] `/scan` opens the camera, returns 3 actions within ~5s.
- [ ] Heatmap toggle changes the overlay visibly.
- [ ] `docs/DEMO_SCRIPT.md` exists and is accurate.
- [ ] `README.md` has setup + run instructions and a short "what is this" blurb.
- [ ] `BLOCKERS.md` clearly lists anything that failed + what was tried.
