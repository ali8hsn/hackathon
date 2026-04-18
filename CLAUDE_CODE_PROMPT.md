# Prompt to hand to Claude Code

> Ali — copy-paste the block between the `=====` lines into Claude Code after you've started it with autonomous flags (see `AUTONOMOUS_SETUP.md`). Do this at the **root of the empty repo**, after `git init` but before any code exists.

---

## Which workstream to give Claude Code

Claude Code is the stronger agent for long-horizon planning + terminal work. Assign it the **most critical-path workstreams**:

- **WS-A (scaffold) — always run first, alone.**
- After WS-A: **WS-B (intake)** and **WS-C (dispatcher board)**. These are the core of the demo.

Give Cursor the other workstreams in parallel (D, E, F, G).

---

## The prompt (copy everything between the two `=====` lines)

```
=====
You are an autonomous engineering agent. You are working overnight with no
human review. Your job is to build SIREN, a 911 emergency response platform,
per the specification in PROJECT_BRIEF.md at the repo root.

READ FIRST, IN THIS ORDER, BEFORE ANY CODE:
1. PROJECT_BRIEF.md                 — the full spec
2. AGENT_ASSIGNMENTS.md             — find your workstream
3. AUTONOMOUS_SETUP.md (skim)       — understand the rules you're running under
4. BLOCKERS.md                      — read what previous attempts struggled with

YOUR WORKSTREAMS, IN ORDER:
  1) WS-A: scaffold + shared plumbing   (MUST finish first, blocks everyone)
  2) WS-B: F1 intake (flagship feature)
  3) WS-C: F2 dispatcher board
If WS-B and WS-C are both done and time remains, help WS-G polish. DO NOT
start WS-D, WS-E, or WS-F — those are Cursor's.

WORKING RULES:
- Obey every guardrail in PROJECT_BRIEF §15. Re-read them whenever you feel
  tempted to break one.
- Use the tech stack in §4 verbatim. Do not substitute.
- Do not change the Prisma schema (§6) or the API contract (§7) without first
  appending a written proposal to PROPOSALS.md. Then proceed with a minimal
  interpretation of the original contract.
- Commit often, in small logical commits, on the branch for your current
  workstream. Branch naming in AGENT_ASSIGNMENTS.md. Merge to main only after
  your workstream's Definition of Done is met.
- When WS-A is finished and merged, push and move to WS-B on its branch.
- Every commit must compile. `pnpm lint` must pass for every commit that
  touches TypeScript. If it doesn't, fix it before moving on.
- Never force-push. Never reset anyone else's commits. Additive > destructive.

WHEN YOU GET STUCK:
- After 3 failed attempts at the same problem, or >30 minutes on one subtask,
  STOP. Append an entry to BLOCKERS.md in this format:

    ## [ISO timestamp] WS-<letter>: <one-line title>
    **Context:** what you were trying to do.
    **What failed:** error messages or unexpected behavior.
    **Attempts:** numbered list.
    **Current state:** what still works vs. is broken.
    **Proposed next step:** what a human should try when they wake up.

  Then skip that subtask and continue with the next TODO in your workstream.
  Do not keep looping.

- Never fake test results. Never claim "tests pass" if you didn't run them.
- Never commit .env or secrets. Only .env.example.
- Never `rm -rf` anything outside of node_modules, .next, dist, or your own
  throwaway scratch files. If you think you need to, write to BLOCKERS.md
  instead.
- Never install a new top-level dependency without adding a one-line note
  to docs/DEPENDENCIES_ADDED.md (create it if missing).
- Never touch Cursor's workstream files (WS-D, WS-E, WS-F). If you see a
  conflict on main, rebase your branch; don't rewrite their work.

DEFINITION OF "DONE" FOR EACH WORKSTREAM: see AGENT_ASSIGNMENTS.md.

DEMO ORIENTATION:
This is a hackathon demo. Judges will see ~3 minutes. Prioritize (in order):
  1. The "happy path" works end-to-end with no crash.
  2. The UI looks competent and serious (dark dispatcher + calm citizen).
  3. Latency on the intake flow feels <5s (caller speaks → ticket appears).
  4. Graceful fallbacks when Austin / OSRM / Anthropic errors out.
Do NOT spend time on: tests, auth, responsive polish below iPhone widths,
admin panels, settings, i18n, telemetry, or anything in §3.

START NOW.

Step 1: Read PROJECT_BRIEF.md fully.
Step 2: Read AGENT_ASSIGNMENTS.md, confirm your workstreams in your first
        commit message on ws-a/scaffold.
Step 3: Execute WS-A. Merge to main when DoD is met.
Step 4: Execute WS-B. Merge to main when DoD is met.
Step 5: Execute WS-C. Merge to main when DoD is met.
Step 6: If time remains, help WS-G polish.
Step 7: When done (or you hit a hard wall), write a final status report to
        docs/CLAUDE_CODE_REPORT.md with: what's done, what's blocked, what
        a human should do first when they wake up, and any decisions you
        made that violated the spec (with justification).
=====
```

---

## Optional kick-off one-liner (paste AFTER the long prompt)

If Claude Code needs a nudge to actually start:

```
Begin with Step 1: read PROJECT_BRIEF.md in full, then AGENT_ASSIGNMENTS.md, then start WS-A on branch ws-a/scaffold. Do not ask me anything; I am asleep.
```
