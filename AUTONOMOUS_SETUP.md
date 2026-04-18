# Running Claude Code & Cursor overnight without babysitting

> This doc is what you follow when you actually start the agents. Do NOT skip the pre-flight checklist.

---

## 0. Why this matters

The default settings in Claude Code and Cursor ask you to approve every edit and every shell command. That's fine while you're watching. Overnight, it means the agents sit idle for 8 hours waiting for a thumbs-up.

We solve it three ways:

1. **Permission flags / YOLO mode** so the agents can act without pinging you.
2. **Sandbox-style isolation** (git branch per agent + strong guardrails in the prompt) so they can't wreck `main` or your machine.
3. **Clear stop conditions** in the prompts so they don't burn API credits looping forever.

---

## 1. Pre-flight checklist — do these BEFORE starting the agents

### 1a. Create a fresh folder and git repo

```bash
mkdir -p ~/code/siren && cd ~/code/siren
git init
git commit --allow-empty -m "chore: initial empty commit"
```

### 1b. Drop in the briefing docs

Copy the four MD files from this workspace into the new repo root:

- `PROJECT_BRIEF.md`
- `AGENT_ASSIGNMENTS.md`
- `CLAUDE_CODE_PROMPT.md`
- `CURSOR_PROMPT.md`
- `AUTONOMOUS_SETUP.md` (this file)
- `BLOCKERS.md` (empty to start)
- `PROPOSALS.md` (empty to start)

Commit them:

```bash
git add PROJECT_BRIEF.md AGENT_ASSIGNMENTS.md CLAUDE_CODE_PROMPT.md CURSOR_PROMPT.md AUTONOMOUS_SETUP.md BLOCKERS.md PROPOSALS.md
git commit -m "docs: project brief and agent assignments"
```

### 1c. Put your API key somewhere the agents can reach

Create `~/.siren.env` (NOT in the repo) with:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Then before each agent session:

```bash
set -a && source ~/.siren.env && set +a
```

### 1d. Snapshot — so you can recover if something goes sideways

```bash
git remote add origin git@github.com:<you>/siren.git   # create an empty GitHub repo first
git push -u origin main
```

This means your entire worst-case recovery is `rm -rf ~/code/siren && git clone ...`.

### 1e. Create a system-level "brake pedal"

Set a max monthly Anthropic spend on the [API console](https://console.anthropic.com/settings/limits) BEFORE starting. Something like $30-50 for the night. If an agent goes into a loop, the API key stops paying and the agent errors out instead of bankrupting you.

---

## 2. Starting Claude Code autonomously

### 2a. Install / update

```bash
npm i -g @anthropic-ai/claude-code
claude --version
```

### 2b. The command

From inside the repo:

```bash
cd ~/code/siren
claude --dangerously-skip-permissions
```

- `--dangerously-skip-permissions` lets Claude Code run shell commands and write files without prompting. This flag is deliberately scary-named because it is.
- The project-level guardrails in `CLAUDE_CODE_PROMPT.md` are what keep this safe-ish — the agent is told what NOT to touch.

**Alternative (safer, still mostly autonomous):** run without the flag but pre-accept known-safe commands via a `.claude/settings.json` allowlist. Example:

```jsonc
// ~/code/siren/.claude/settings.json
{
  "permissions": {
    "allow": [
      "Bash(pnpm *)",
      "Bash(npm *)",
      "Bash(git *)",
      "Bash(prisma *)",
      "Bash(node *)",
      "Bash(tsc *)",
      "Bash(eslint *)",
      "Bash(python *)",
      "Bash(uvicorn *)",
      "Bash(pip *)",
      "Bash(ls *)",
      "Bash(cat *)",
      "Bash(mkdir *)",
      "Edit(*)",
      "Write(*)",
      "Read(*)"
    ],
    "deny": [
      "Bash(rm -rf /*)",
      "Bash(sudo *)",
      "Bash(git push --force*)",
      "Bash(git reset --hard*)",
      "Bash(curl * | sh)",
      "Bash(chmod 777 *)"
    ]
  }
}
```

With that file present, you can run plain `claude` (no flag) and the agent will auto-approve anything matching the allowlist, ask for anything else, and refuse anything denied. Trade-off: it may block on a legitimate edge-case command.

### 2c. Paste the prompt

Open `CLAUDE_CODE_PROMPT.md`, copy the long block between the `=====` lines, paste into the Claude Code prompt. Then paste the one-liner kick-off. Walk away.

---

## 3. Starting Cursor autonomously

### 3a. Open Cursor in the repo

```bash
cursor ~/code/siren
```

### 3b. Enable YOLO mode

Cursor Settings → **Features → Agent / Composer**:

- **"Enable Auto-Run Mode (YOLO)"** — ON
- **"Auto-apply file edits"** — ON
- **"Auto-accept terminal commands"** — ON *(this is the big one)*
- **"Allow file deletion"** — OFF *(safer — agents can still `mv` to trash)*

Under **Auto-Run Allowlist**, add:

```
pnpm, npm, git, node, tsc, eslint, prisma, python, uvicorn, pip, curl, ls, cat, mkdir, echo
```

Under **Auto-Run Denylist**, add:

```
rm -rf /, sudo, chmod 777, curl | sh, dd, git push -f, git push --force, git reset --hard, chown
```

### 3c. Switch to Agent mode

In the chat panel, flip the selector from **Ask / Edit** to **Agent** (also called "Composer" in some builds).

### 3d. Make sure the right model is selected

Use **claude-sonnet-4-6** (best balance of smart + fast for long-horizon coding). For especially tricky parts (WS-F ML service), you can bump to **claude-opus-4-6** if you're comfortable with the cost.

### 3e. Paste the prompt

Open `CURSOR_PROMPT.md`, copy the block between `=====`, paste into the Cursor Agent message box. Paste the kick-off one-liner. Walk away.

---

## 4. Running them in parallel without collisions

Both agents run from the SAME repo but on DIFFERENT branches. The `AGENT_ASSIGNMENTS.md` map is:

- Claude Code: `ws-a/scaffold`, then `ws-b/intake`, then `ws-c/dispatcher-board`.
- Cursor: `ws-d/camera-routing`, then `ws-e/scan-mode`, then `ws-f/heatmap-ml`.

Cursor must NOT start until Claude Code merges `ws-a/scaffold` into `main`. The simplest way to enforce this:

1. Start Claude Code first. Give it **only** the WS-A prompt for the first pass, or use the full prompt and trust it to do WS-A first (as the prompt instructs).
2. Watch long enough to see the first commit on `main`. Then walk away for Claude Code.
3. Spot-check: in the terminal, `git log --oneline -5`. If you see `chore(scaffold): ...`, WS-A is done.
4. NOW start Cursor. It begins on WS-D immediately.

Both agents read/write the same filesystem but different files. The guardrails in the prompts + the branch-per-workstream rule minimize merge pain.

If they both try to edit `package.json` at the same time, the second one will rebase and win; you may see a small merge conflict in `BLOCKERS.md` in the morning.

---

## 5. What to check in the morning

In order:

1. **`git log --all --oneline --graph -40`** — did both agents make progress?
2. **`cat BLOCKERS.md`** — what hit walls?
3. **`docs/CLAUDE_CODE_REPORT.md`** and **`docs/CURSOR_REPORT.md`** — the final status reports you asked for.
4. **`pnpm install && pnpm dev`** — does it actually run?
5. **The happy path** — can you walk through the demo script in `docs/DEMO_SCRIPT.md`?

---

## 6. Emergency stop

If you wake up at 3am and see something scary:

```bash
# 1. Kill the agent processes
pkill -f "claude" ; pkill -f "cursor"

# 2. Freeze the repo state
cd ~/code/siren && git branch backup-$(date +%s) main

# 3. If main is corrupted, restore from your GitHub remote:
git fetch origin && git reset --hard origin/main
```

---

## 7. Credit-burn safeguards

- **Spend cap** on Anthropic console (see §1e).
- **Wall clock cap:** before leaving, run this so both agents die after 6 hours regardless:
  ```bash
  (sleep 21600 && pkill -f "claude" && pkill -f "cursor") &
  disown
  ```
  Adjust `21600` (seconds) as needed. 6h = 21600, 8h = 28800.
- **Stop conditions in prompts**: both agent prompts tell them to STOP after 3 failed attempts or 30 minutes on one subtask. This is belt + suspenders with the wall-clock cap.

---

## 8. Things that WILL go wrong (and what to do)

| Symptom | Cause | Fix in the morning |
|---|---|---|
| `pnpm dev` errors on Prisma client | `prisma generate` wasn't run after a schema change | `cd apps/web && pnpm prisma generate && pnpm prisma migrate dev` |
| `/api/cameras` returns empty array | Austin endpoint 404'd overnight | Run `pnpm tsx scripts/seed_cameras.ts` |
| OSRM 429 rate-limited | Too many demo ticks | Reduce tick rate in `scripts/demo_tick.ts` |
| Scan mode 500s | Anthropic key not set or key out of credits | Check `.env`, check dashboard |
| Agent stopped halfway | Rate limit, crash, or hit its stop condition | Read its report file; re-run with the same prompt to resume |
| Merge conflicts on `main` | Both agents touched the same file | Manual rebase; the later commit usually wins |

---

## 9. The one thing to remember

The agents are smart but not wise. The prompts and guardrails are what make this safe. Do NOT skip the pre-flight. Do NOT skip the spend cap. Do NOT skip the wall-clock kill switch.

Sleep well. The robots are working.
