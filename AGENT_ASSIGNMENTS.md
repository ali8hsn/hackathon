# Agent Assignments — SIREN

> Each workstream is a branch. Work on your assigned branch. Merge into `main` via PR when your Definition of Done is met. If you are the only agent awake, you may commit directly to `main` at the end of your workstream after your own checks pass.

**Branching:**
```
main
├── ws-a/scaffold            (WS-A)
├── ws-b/intake              (WS-B)
├── ws-c/dispatcher-board    (WS-C)
├── ws-d/camera-routing      (WS-D)
├── ws-e/scan-mode           (WS-E)
├── ws-f/heatmap-ml          (WS-F)
└── ws-g/polish              (WS-G)
```

---

## WS-A — Scaffold + shared plumbing (MUST RUN FIRST, SINGLE AGENT)

**Blocks:** everything else.

**Tasks:**
1. `pnpm init -y` at repo root, set up `pnpm-workspace.yaml` with `apps/*` and `services/*`.
2. `cd apps && pnpm create next-app@latest web --ts --tailwind --eslint --app --src-dir false --import-alias "@/*"`.
3. Install shadcn/ui, initialize, add: `button card badge dialog sheet toast separator progress tabs input textarea select`.
4. Install: `@anthropic-ai/sdk`, `@prisma/client`, `prisma`, `maplibre-gl`, `framer-motion`, `lucide-react`, `zod`, `date-fns`.
5. Create `prisma/schema.prisma` per PROJECT_BRIEF §6. Run `prisma generate`.
6. Create `lib/db.ts`, `lib/claude.ts`, `lib/types.ts`, `lib/austin.ts` (with fallback seed), `lib/osrm.ts`, `lib/intake.ts` (prompt builder), `lib/congestion.ts` (stub is fine if Claude key missing).
7. Create EMPTY route handlers for every endpoint in §7 returning `501 Not Implemented` JSON — workstreams fill these in.
8. Create empty page shells for `/dashboard`, `/call`, `/scan`, `/report` with a minimal layout + nav.
9. Add `.env.example`. Add `.gitignore`.
10. Write a top-level `README.md` with "how to run" (will be fleshed out by WS-G).
11. Commit: `chore(scaffold): initial monorepo + schema + stubs`.
12. Merge to `main`.

**Definition of Done:** `pnpm dev` runs, all four pages render a placeholder, all API routes return JSON 501, `prisma migrate dev --name init` succeeds.

---

## WS-B — F1 Intake (the flagship)

**Depends on:** WS-A merged.

**Tasks:**
1. `components/intake/CallScreen.tsx`:
   - Big pulsing blue dot, banner for AI's most recent question, streaming transcript below.
   - Uses `window.SpeechRecognition` (continuous, interim results) for STT.
   - Sends transcript deltas to `POST /api/intake/chunk` every 1s (debounced).
   - Plays back AI follow-up via `speechSynthesis` when a new `aiFollowUp` returns.
   - Requests GPS on mount; passes to `/api/intake/start`.
2. `app/api/intake/start/route.ts`: create an `IntakeSession` row, return `{ sessionId }`.
3. `app/api/intake/chunk/route.ts`: append transcript delta; run intake prompt (lib/intake.ts); persist ticket JSON; return `{ ticket, aiFollowUp? }`. Only emit `aiFollowUp` if >=3s since last AI voice line.
4. `app/api/intake/finish/route.ts`: create `Incident` from ticket; link to session; set `reporterKind: "intake"`.
5. `components/intake/LiveTicket.tsx`: small dashboard widget showing top 3 in-flight intake sessions, auto-refreshing.
6. Wire it into `/dashboard` in a "Live Calls" strip above the incident queue.
7. `scripts/demo_seed_calls.ts`: seeds three partial intake sessions with varying severity.
8. Tests? Skip. Manual demo only.

**Definition of Done:** speaking into `/call` produces a live-updating ticket visible on `/dashboard` within 5s, AI asks at most one follow-up question, "Finish" button promotes the ticket into a full incident.

---

## WS-C — F2 Dispatcher Board

**Depends on:** WS-A merged.

**Tasks:**
1. `components/map/IncidentMap.tsx`: MapLibre map centered on Austin (`30.2672, -97.7431`, zoom 12), dark basemap.
2. Renders: incidents (severity-colored pins), units (callsign labels), cameras (small icon).
3. `components/incidents/IncidentQueue.tsx`: right-side scrollable list, polls `GET /api/incidents` every 1s. Sorted by severity desc, then createdAt desc.
4. `components/incidents/IncidentCard.tsx`: severity left border, type icon, age, click to open drawer.
5. `components/incidents/IncidentDetailDrawer.tsx`: full ticket, transcript (if intake), nearest units, "Dispatch" button.
6. `app/api/incidents` GET, POST, PATCH — implement fully.
7. `app/api/incidents/:id/dispatch` — pick nearest appropriate unit (matching `kind` to type), call `/api/route` for geometry, update Incident + Unit rows, return `{ unit, route, eta }`.
8. Map renders the dispatch route as a prominent polyline; cameras along the route get a ring.
9. `scripts/demo_tick.ts` — every 10s: nudge assigned units 1-2% of distance toward their incident; 5% chance spawn a random incident.

**Definition of Done:** can create an incident from the dashboard, see it in the queue, click dispatch, see unit + route render on map.

---

## WS-D — F3 Camera-Aware Routing

**Depends on:** WS-A merged. Cooperates with WS-C.

**Tasks:**
1. `lib/austin.ts`:
   - `fetchCameras()` hits the Austin Socrata endpoint, normalizes to `{id,name,lat,lng,stillUrl}[]`.
   - On any error, returns the hardcoded fallback list (seeded in `scripts/seed_cameras.ts`).
2. `app/api/cameras/route.ts`: returns cameras from DB; if empty, triggers a `fetchCameras()` populate, then returns.
3. `app/api/cameras/:id/still/route.ts`: proxies the still JPEG with 5s timeout + `Cache-Control: public, max-age=15`. On failure return a 200 tiny placeholder SVG as JPEG via sharp or a static placeholder from `/public`.
4. `lib/osrm.ts`: `getRoute({from, to, alternatives?})` → hits `https://router.project-osrm.org/route/v1/driving/{from};{to}?overview=full&geometries=geojson&alternatives=true`. Returns geometry + durationSec + distanceM.
5. `lib/congestion.ts`:
   - `scoreCamera(cameraId): Promise<number>` — fetches still, sends to Claude with prompt 9e, parses a decimal. Cache per camera 60s.
   - If Claude key missing, return a deterministic pseudo-random value based on camera id + current minute — enough to visually vary.
6. `app/api/route/route.ts`:
   - Calls OSRM, fetches cameras within 200m of the route's midpoints (sample 10 points along the geometry), `scoreCamera` each in parallel with `Promise.allSettled`.
   - Computes a "congestion penalty" = mean(scores) * 0.3 * durationSec. Returns `{ geometry, durationSec, distanceM, congestionAdjustedSec, cameraIdsAlongRoute }`.
7. `components/map/CameraMarkers.tsx`: camera pins with color based on `lastCongestion`. Click → shows still image in a popover.
8. Dispatcher drawer "Dispatch" action uses this route and visualizes the polyline.

**Definition of Done:** dispatching an incident visibly routes around cameras that are marked congested; clicking a camera-along-route shows its still image.

---

## WS-E — F4 Scan Mode

**Depends on:** WS-A merged.

**Tasks:**
1. `components/scan/ScanCamera.tsx`: `navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}})`. Captures a 512x512 JPEG from a hidden canvas every 2s while active. Button to start/stop.
2. Mode selector at top: medical / fire / accident / general (shadcn Tabs).
3. `components/scan/ActionCards.tsx`: three stacked large cards with the action text + speaker icon. On each update, `speechSynthesis.speak(actions[0])` (only the first action, and only if >=5s since last speak).
4. `app/api/scan/route.ts`: accepts `{imageBase64, mode}`. Posts to Claude (vision) with prompt 9c. Parses JSON. Persists a `ScanEvent`. Returns `{summary, actions}`.
5. Graceful fallback: if Anthropic errors, return a generic per-mode canned response so the demo never silently dies.

**Definition of Done:** on a phone or laptop, opening `/scan` → granting camera → within 5s three action cards appear and the first is spoken.

---

## WS-F — F5 Heatmap ML Service

**Depends on:** WS-A merged.

**Tasks:**
1. `services/ml/main.py` — FastAPI app.
2. `scripts/gen_fake_history.py` — generates `services/ml/data/historical_incidents.csv`:
   - 10,000 rows across 12 months.
   - Weighted lat/lng distribution with 3 hotspots (downtown, north Austin, east Austin).
   - Type + time-of-day weights (medical 24/7, accidents peak rush hour, fires random but skew nighttime).
3. `/heatmap?at=ISO8601` endpoint:
   - Loads CSV once into memory.
   - Weights rows by time-of-day similarity to `at` + recency decay.
   - Runs `scipy.stats.gaussian_kde`, samples onto a 60x60 lat/lng grid covering Austin.
   - Returns a GeoJSON FeatureCollection of Points with `intensity` property (0..1).
4. `requirements.txt`: `fastapi uvicorn scipy numpy pandas`.
5. `Dockerfile` for Render deploy.
6. `apps/web/app/api/heatmap/route.ts`: proxies to `ML_SERVICE_URL`.
7. `components/map/HeatmapOverlay.tsx`: MapLibre heatmap layer from the GeoJSON; toggleable.

**Definition of Done:** dashboard has a "Predictive Heatmap" toggle that visibly changes the map overlay; changing the time-of-day selector visibly shifts the heatmap.

---

## WS-G — Polish

**Depends on:** everything else merging.

**Tasks:**
1. `README.md`: "what is this" blurb + setup + run instructions. Quick-start commands. Screenshot.
2. `docs/DEMO_SCRIPT.md`: fill the skeleton in PROJECT_BRIEF §14 with specific clicks, lines, expected screens. Rehearsable.
3. `docs/JUDGING_RUBRIC_NOTES.md`: short, honest list of what works / what's faked for demo / what we'd build next.
4. Screenshots: open each feature, take a screenshot, put in `docs/screenshots/` with descriptive names.
5. Add a landing page at `/` with a big SIREN logo, one-paragraph pitch, and three buttons: "Dispatcher" / "Call Simulator" / "Scan Mode".
6. Empty states: every list/queue renders gracefully when empty.
7. Loading states: shadcn `Skeleton` on slow networks.
8. Error boundaries: one at the root, one around the map, one around the call screen.
9. `BLOCKERS.md` audit: for any item still open, either fix or document clearly.
10. A favicon. A meta title. A nicer 404.

**Definition of Done:** a cold human can clone, run, and demo from `README.md` alone.
