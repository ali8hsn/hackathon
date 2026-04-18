# Prompt to hand to Cursor (Agent / Composer mode)

> Ali — wait until Claude Code has finished **WS-A (scaffold)** and pushed it to `main` before starting Cursor. Otherwise Cursor will scaffold a parallel (conflicting) app.
>
> Open Cursor, switch to **Agent mode** (not Chat, not Edit). Enable YOLO mode in Settings (see `AUTONOMOUS_SETUP.md`). Then paste the block between the `=====` lines as the initial message.

---

## Which workstreams to give Cursor

- **WS-D: Camera-aware routing** (needs Austin data + OSRM)
- **WS-E: Scan mode** (vision, camera UI)
- **WS-F: Heatmap ML service** (Python FastAPI)
- **WS-G: Polish** (after D/E/F are done)

If Cursor supports multiple concurrent agent sessions (Composer tabs), run one per workstream. Otherwise chain them — tell Cursor to do D first, then E, then F, then G.

---

## The prompt (copy everything between the two `=====` lines)

```
=====
You are an autonomous engineering agent working overnight with no human
review. You are contributing to SIREN, a 911 emergency response platform,
alongside another agent (Claude Code) which owns different workstreams.
The full spec is in PROJECT_BRIEF.md at the repo root.

READ FIRST, IN THIS ORDER, BEFORE ANY CODE:
1. PROJECT_BRIEF.md                 — the spec
2. AGENT_ASSIGNMENTS.md             — find your workstreams
3. AUTONOMOUS_SETUP.md (skim)       — the rules you're running under
4. BLOCKERS.md                      — notes from prior attempts
5. docs/CLAUDE_CODE_REPORT.md (if it exists) — what the other agent did

YOUR WORKSTREAMS, IN ORDER:
  1) WS-D: F3 camera-aware routing (Austin traffic cameras + OSRM + congestion)
  2) WS-E: F4 scan mode (mobile vision)
  3) WS-F: F5 predictive heatmap (Python FastAPI service)
  4) WS-G: polish — only after D/E/F are all merged

DO NOT TOUCH WS-A, WS-B, or WS-C files. Those are Claude Code's. If you need
a shared utility that only exists in one of those workstreams, either (a)
wait until it lands on main, or (b) add a narrow, additive helper in your
own workstream's files rather than editing theirs.

WORKING RULES:
- Obey every guardrail in PROJECT_BRIEF §15.
- Tech stack in §4 is FROZEN. No substitutions.
- Do not change schema.prisma or the API contract (§7) without appending
  a proposal to PROPOSALS.md. Then interpret the original contract
  minimally and keep going.
- Commit often, small logical commits, on your workstream branch. Branch
  names in AGENT_ASSIGNMENTS.md. Merge to main when your Definition of Done
  is met.
- Every commit must compile. `pnpm lint` must pass for TS changes. For
  the Python service, `python -m py_compile services/ml/main.py` must pass.
- Never force-push. Never reset commits that aren't yours. Additive > destructive.
- Never commit .env or secrets.

WHEN STUCK:
- After 3 failed attempts at the same problem or >30 minutes on one subtask,
  STOP. Append to BLOCKERS.md:

    ## [ISO timestamp] WS-<letter>: <one-line title>
    **Context:** what you were doing
    **What failed:** errors / unexpected behavior
    **Attempts:** numbered list
    **Current state:** what works vs. what doesn't
    **Proposed next step:** what to try next

  Then skip the subtask and continue with the next TODO. No infinite loops.

- Never fake test results. Never claim a thing works if you didn't run it.
- Third-party down (Austin camera feed, OSRM, Anthropic): implement a
  graceful fallback (stubbed data / placeholder) and note it in
  BLOCKERS.md. Keep going.

DEMO ORIENTATION:
- Judges see 3 minutes. Prioritize (in order):
  1. End-to-end happy path without crashes.
  2. Visual competence (dark dispatcher, calm citizen).
  3. Latency: scan returns in <5s, route renders instantly.
  4. Graceful fallbacks for missing keys / down services.
- Do NOT spend time on tests, auth, responsive polish below iPhone widths,
  admin panels, settings, i18n, analytics, or anything in §3.

START NOW.

Step 1: Read PROJECT_BRIEF.md fully.
Step 2: Read AGENT_ASSIGNMENTS.md. Confirm your workstreams in your first
        commit message on ws-d/camera-routing.
Step 3: Execute WS-D. Merge to main when DoD is met.
Step 4: Execute WS-E. Merge to main when DoD is met.
Step 5: Execute WS-F. Merge to main when DoD is met.
Step 6: If time remains, help WS-G polish.
Step 7: Write your final status to docs/CURSOR_REPORT.md with: what's done,
        what's blocked, what a human should do first when they wake up,
        and any decisions you made that violated the spec (with reasons).
=====
```

---

## Optional kick-off one-liner

```
Begin with Step 1: read PROJECT_BRIEF.md in full, then AGENT_ASSIGNMENTS.md. Then start WS-D on branch ws-d/camera-routing. Do not ask me anything; I am asleep.
```

---

## Notes for running Cursor overnight

- Put your Anthropic key in `~/.cursor/mcp.json` or Settings → AI so it's available to the agent.
- In **Cursor Settings → Features → Agent**, enable:
  - **"Allow Agent to run commands"** (YOLO)
  - **"Auto-apply file edits"**
  - **"Allow delete file"** — set to **OFF** (safer)
- In **Chat → Agent settings** (the gear near the message box), set:
  - Command allowlist: `pnpm, npm, git, node, tsc, eslint, prisma, python, uvicorn, pip, curl, ls, cat, mkdir`
  - Command denylist: `rm -rf /, sudo, chmod 777, curl | sh, dd, git push -f, git reset --hard`
- Give it one workstream at a time if you're nervous; give it all four if you're bold.
