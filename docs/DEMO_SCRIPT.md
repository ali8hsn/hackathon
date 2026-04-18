# SIREN Demo Script

**Target time: Under 3 minutes. Every line spoken here maps to a visible UI change.**

---

## Hook (20s)

> "Ali's grandfather had a medical emergency. The 911 call was placed on hold. Less than a minute felt like an eternity — and in a cardiac emergency, every minute on hold reduces survival odds by 7–10%. SIREN fixes that."

**Action:** Open browser to `http://localhost:3000` — the landing page shows: Dispatcher / Call Simulator / Scan Mode.

---

## Intake (40s)

**Action:** Click "Call Simulator" → opens `/call`. Hand phone to demo partner (or use laptop mic).

**Speak into the mic:**
> "My grandfather collapsed in the kitchen. I don't know if he's breathing."

**What should happen (within ~5s):**
1. The pulsing blue dot shows "Listening."
2. The AI banner at the top asks: *"Is he breathing? Yes or no."*
3. On the dashboard tab (pre-opened on laptop): a new ticket slides in. Severity **5**, type **medical**, life-safety flag: `not_breathing`.

**Narrate:** "Before the dispatcher even picks up, SIREN has filed a severity-5 medical ticket with GPS coordinates, flagged it as a breathing emergency, and is already asking the caller the right question."

---

## Dispatch (30s)

**Action:** On dispatcher view (`/dashboard`):
1. Click the severity-5 medical incident card in the queue (right panel).
2. The detail drawer opens — description, location, life-safety flags visible.
3. Click **"Dispatch Nearest Unit"**.

**What should happen:**
- A blue route line appears on the Austin map (left panel), connecting the nearest medic unit to the incident location.
- The drawer now shows the unit callsign (e.g., "M1") and ETA.
- Up to 4 camera thumbnails appear in the drawer showing roads along the route.

**Narrate:** "SIREN auto-dispatches the nearest medic, computes the route with OSRM, and scores the cameras along the way for congestion."

4. Click **"Predictive Heatmap"** toggle (top-right of map).

**What should happen:** A color gradient overlay appears showing where incidents are likely in the next hour — warm in downtown, east Austin.

**Narrate:** "The heatmap tells dispatchers where to pre-position units before the next wave hits."

---

## Scan Mode (30s)

**Action:** Open `/scan` on a phone (or second browser window).

1. Select mode: **Medical**.
2. Tap **Start Scan**.
3. Point camera at a person (or a picture of someone slumped over).

**What should happen (within ~5s):**
- Three action cards appear: "Check breathing. Start CPR if none. Keep talking to them."
- The first action is spoken aloud.

**Narrate:** "For anyone at the scene — a bystander, a family member — SIREN turns your phone into a first-response coach before help arrives."

---

## Close (20s)

> "One story. One system. Every second matters.
>
> SIREN fixes the silence between hold music and help — and it does it before the dispatcher picks up."

---

## Backup talking points (if something crashes)

- If OSRM is unreachable: route still renders (straight-line fallback). Mention: "In production, we'd use city CAD-integrated routing."
- If camera thumbnails show placeholder: "Cameras are proxied live from Austin's open data portal; the congestion scoring updates every 60 seconds."
- If AI scan returns generic response: "Claude vision analyzes the scene in real time; the demo is using a minimal test image."
