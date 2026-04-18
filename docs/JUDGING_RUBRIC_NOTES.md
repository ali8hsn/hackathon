# Judging Rubric Notes

## What works

| Feature | Status |
|---|---|
| F1 AI Hold Intake — speech, live ticket, Claude triage | ✅ Working |
| F2 Dispatcher dashboard — map, queue, detail drawer | ✅ Working |
| F3 Camera-aware routing — OSRM route, camera scoring | ✅ Working |
| F4 Scan mode — camera capture, Claude vision, action cards | ✅ Working |
| F5 Predictive heatmap — Python KDE, toggle overlay | ✅ Working |
| Seeded data (12 units, 3 incidents, 50 cameras) | ✅ Working |
| Graceful fallbacks for down services | ✅ All have fallbacks |

## What's real vs. demo

| Component | Real | Demo/Stub |
|---|---|---|
| Claude AI (intake, scan, congestion) | Real API calls | Falls back to canned on error |
| Austin camera data | Attempts live Socrata fetch | Falls back to 50 hardcoded cameras |
| OSRM routing | Real public OSRM server | Straight-line fallback if down |
| Camera still images | Live proxied JPEGs | SVG placeholder if unavailable |
| GPS location on /call | Real browser geolocation | Graceful if denied |
| ML heatmap | Real gaussian_kde on 10k rows | In-memory stub if CSV missing |
| 911 integration | Not built | Demo only |
| Auth | Not built | Hard-coded dispatcher role |

## What we'd build next

1. **Real Twilio routing** — incoming calls routed to SIREN before hold
2. **Supabase realtime** — replace polling with websocket push
3. **MapTiler tiles** — prettier dark map (key ready in .env.example)
4. **Unit GPS tracking** — live positions from device GPS instead of seeded
5. **Post-call audit trail** — full transcript + dispatcher confirmation diff
