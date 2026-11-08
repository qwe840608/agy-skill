---
name: agy-skill
description: >-
  Universal guide and operational playbook for Google Antigravity (App 2.0, agy CLI, IDE, Python SDK, and Customizations: Skills, Rules, Plugins, Hooks, MCP, Sidecars, Generative UI). Enables Claude Code, Codex, OpenCode, and Antigravity agents to orchestrate agy CLI headlessly, configure Antigravity, and auto-sync this skill on updates.
---

# Google Antigravity (`agy`) Universal Agent Skill

This skill equips **any AI coding agent** (Claude Code, OpenAI Codex, OpenCode, Cursor, Pi, or Antigravity itself) with complete operational mastery over **Google Antigravity**—covering **Antigravity CLI (`agy`)**, **Antigravity 2.0 Desktop App**, **Antigravity IDE**, **Customizations**, and the **Python SDK**.

---

## Use This Skill When

- Delegating coding, code/plan review, architecture brain-storming, research sweeps, or native image generation (`generate_image`) to **`agy` CLI** from another agent or terminal.
- Creating, debugging, or managing **Antigravity Customizations**:
  - **Skills** (`SKILL.md`, `skills.json`)
  - **Rules** (`GEMINI.md`, `AGENTS.md`, `.agents/rules/*.md`)
  - **Plugins** (`plugin.json`, `plugins.json`, `agy plugin`, Marketplace cards)
  - **Lifecycle Hooks** (`hooks.json`, `PreToolUse`, `PostToolUse`, `SessionStart`, `PreInvocation`, `PostInvocation`, `Stop`)
  - **MCP Servers** (`mcp_config.json`, `agy mcp`, Stdio & Streamable HTTP)
  - **Sidecars & Scheduled Automations** (`sidecar.json`, cron schedules, UI plugin panes)
  - **Generative UI** (`<agent-embed>`, HTML artifacts, theme tokens)
- Answering questions about **Antigravity 2.0 App**, **Antigravity IDE**, or the **Python SDK (`google-antigravity`)**.
- **Updating or synchronizing `agy-skill`** after an Antigravity (`agy` / App) version update or skill modification.

## Do Not Use This Skill When

- Performing trivial local edits that are faster to do directly than spawning a sub-agent.
- Handling tasks that require secrets/credentials pasted into prompts or irreversible production deployments without explicit human approval.

---

## 1. Progressive Disclosure Map (`references/`)

To keep context usage minimal, detailed specifications are modularized in `references/`. **Read the relevant reference file before executing tasks in that domain:**

1. **[references/cli-and-headless.md](references/cli-and-headless.md)**
   - **Read when**: Running `agy` commands, delegating tasks from Claude/Codex/OpenCode to `agy -p`, using **Lead vs. Brain** orchestration modes or the **5 Specialist Personas**, troubleshooting `stdin` hangs / permission freezes / sandbox conflicts, streaming `stream-json`, or running `agy acp`.
2. **[references/app-and-ide.md](references/app-and-ide.md)**
   - **Read when**: Working with Antigravity 2.0 Desktop App (Sidebar, Chat Canvas, Slash Commands, `@` Mentions, Auxiliary Pane, Global/Project Permissions & Sandbox policies) or Antigravity IDE (Tab/Supercomplete, Inline `Ctrl+I`/`Cmd+I`, Code Lenses, Diff Overlays).
3. **[references/customizations.md](references/customizations.md)**
   - **Read when**: Configuring `.agents/` vs `~/.gemini/config/`, understanding the 5-tier loading priority, authoring `GEMINI.md`/`AGENTS.md` (24KB file cap & 20,000-token budget), configuring `skills.json`/`plugins.json`, migrating legacy workflows, or installing community skill collections.
4. **[references/hooks-plugins-mcp.md](references/hooks-plugins-mcp.md)**
   - **Read when**: Writing `hooks.json` (all 6 events & camelCase stdin/stdout JSON contracts, `PLUGIN_ROOT`/`PLUGIN_DATA`), building or managing plugins (`plugin.json`, `agy plugin`, Language Server `GetAllPlugins` RPC, `customization://<dir>` links), or configuring MCP servers (`mcp_config.json`, `agy mcp`).
5. **[references/sidecars-ui-sdk.md](references/sidecars-ui-sdk.md)**
   - **Read when**: Creating Scheduled Automations (`sidecar.json` with `builtin: "schedule"`, `CRON_TZ`, `agentapi new-conversation`), surfacing UI Plugin Panes (`sidecar://`), building inline Generative UI widgets (`<agent-embed>`), or writing Python code with `google-antigravity` SDK.
6. **[references/version-snapshot.md](references/version-snapshot.md)**
   - **Read when**: Checking the exact installed `agy` version, exact CLI flags, currently supported model IDs, builtin skill hashes, and latest release notes.

---

## 2. Delegation Decision Tree & The 5 Golden Rules (For External Agents)

### A. When & How to Delegate to `agy`

| Task Type | Recommended Model (`--model`) | Isolation & Flags | Why Delegate? |
| :--- | :--- | :--- | :--- |
| **Deep Research / Repo Survey** | `gemini-3.8-flash-high` | `--dangerously-skip-permissions --sandbox --add-dir <repo>` (Read-only prompt) | Cuts host token spend by 16%–39% on large codebase/web investigations. |
| **Independent Code / Plan Review** | `gemini-3.8-flash-medium` or `high` | `--dangerously-skip-permissions --sandbox --add-dir <repo>` (Read-only prompt) | Provides a genuine second-model critique (`file:line` findings or assumption challenges). |
| **Second Brain Architecture (`Brain` Mode)** | `gemini-4-argon-medium` or `high` | `--dangerously-skip-permissions --sandbox --add-dir <repo>` | Argon proposes the architectural route; host agent verifies assumptions with evidence. |
| **Scoped Implementation / Fix** | `gemini-3.8-flash-high` | `--dangerously-skip-permissions --add-dir <worktree>` | Offloads well-bounded coding/testing into a separate `git worktree` (or sequential run). |
| **Native Capabilities (Image Gen)** | `gemini-3.8-flash-medium` | `--dangerously-skip-permissions --add-dir <repo>` | Gives Claude/Codex access to Antigravity's built-in `generate_image` tool (~30s per PNG). |

### B. The 5 Critical Guardrails for `agy -p` (Avoid Silent Stalls!)

1. **Always Close `stdin` (`</dev/null` or `< NUL`)**:
   - `agy -p` **blocks forever (0% CPU, zero output)** if `stdin` is an open pipe (which non-interactive agent tool shells provide by default). Always append `</dev/null` on POSIX shells or run via `cmd /c '... < NUL'` on Windows PowerShell (unless piping NDJSON to `--input-format stream-json`).
2. **Always Attach the Workspace Explicitly (`--add-dir <repoRoot>`)**:
   - Without `--add-dir`, headless `agy -p` sessions can start inside `~/.gemini/antigravity-cli/scratch` instead of the inherited shell CWD.
3. **Prevent Permission Prompts from Freezing Headless Runs**:
   - `agy`'s default `request-review` mode pauses on the first command/tool call waiting for human approval that never comes in `-p` mode. Pass `--dangerously-skip-permissions` (paired with `--sandbox` and `"Do not modify any files"` for read-only tasks), or pre-configure allow/deny rules in `~/.gemini/antigravity-cli/settings.json`.
4. **Run `agy` Outside the Host Agent's Command Sandbox**:
   - Host sandboxes (e.g., Codex sandbox) block `agy` from reading `~/.gemini/` OAuth credentials and binding a localhost port for its internal Language Server (`bind: operation not permitted`). Always invoke `agy` unsandboxed on the host (request escalated execution in Codex) and let `agy --sandbox` enforce sandboxing instead.
5. **Never Write to the Same Working Tree Concurrently**:
   - Fan out 2–4 *read-only* jobs in parallel freely, but never let `agy` edit files you are simultaneously editing. Use a separate `git worktree` or run sequentially, snapshot `git status --porcelain` before the run, and verify `git diff` + build/typecheck afterward.

### C. Canonical Headless Invocations

```bash
# 0. One-time session preflight probe (verify OAuth login in ~5s)
agy -p "Reply with exactly: OK" --print-timeout 60s </dev/null

# 1. Read-only Code Review or Research (POSIX shell)
agy -p "Review the current branch diff against main. Do not modify any files." \
  --model gemini-3.8-flash-high \
  --add-dir "$PWD" \
  --dangerously-skip-permissions \
  --sandbox \
  --print-timeout 15m </dev/null

# 2. Structured JSON output with JSON Schema validation
agy -p "List all REST endpoints in this repo" \
  --add-dir "$PWD" \
  --dangerously-skip-permissions \
  --sandbox \
  --output-format json \
  --json-schema '{"type":"object","properties":{"endpoints":{"type":"array","items":{"type":"string"}}},"required":["endpoints"]}' </dev/null
```

---

## 3. Mandatory Update & GitHub Sync Protocol

**CRITICAL RULE**: Whenever Antigravity (`agy` CLI or Desktop App) updates, or whenever any file in the `agy-skill` repository is modified:

1. **Run the Auto-Introspection & Sync CLI** (treat the CLI as a black box—do not read `bin/cli.mjs` source unless debugging it):
   ```bash
   # Inside the agy-skill repository checkout:
   npm run sync

   # Or from anywhere via npx (include --allow-git=all for npm v12+):
   npx --yes --allow-git=all github:qwe840608/agy-skill sync
   ```
2. **What the CLI does automatically**:
   - Queries `agy --version`, `agy --help`, all `agy help <subcommand>` outputs, `agy models`, and `agy changelog`.
   - Scans `~/.gemini/antigravity/builtin/skills/` for any newly added or updated built-in Antigravity documentation.
   - Regenerates `references/version-snapshot.md` and updates `version-state.json`.
   - Synchronizes the updated skill across all local agent directories (`~/.gemini/config/skills/agy-skill`, `~/.claude/skills/agy-skill`, `~/.codex/skills/agy-skill`, `~/.config/opencode/skills/agy-skill`).
   - Commits and pushes all changes directly to the public GitHub repository (`https://github.com/qwe840608/agy-skill`) unless `--no-git` is passed.
3. **Semantic Documentation Review**:
   - If `npm run sync` reports a version bump or changed builtin skill hashes, inspect the diff in `references/version-snapshot.md` and update the corresponding guide in `references/*.md` or `SKILL.md` so behavioral guides stay 100% aligned with the new release, then re-run `npm run sync`.

---

## 4. Official Live Documentation Sitemap

If the user asks about cloud-only features or newly announced capabilities not covered in `references/`, fetch from the authoritative docs:

- **Docs Home**: `https://antigravity.google/docs`
- **CLI Install / Features / Best Practices / Reference**:
  - `https://antigravity.google/docs/cli/install`
  - `https://antigravity.google/docs/cli/features`
  - `https://antigravity.google/docs/cli/best-practices`
  - `https://antigravity.google/docs/cli/reference`
  - `https://antigravity.google/docs/cli/permissions`
- **Customizations**:
  - Skills: `https://antigravity.google/docs/skills`
  - Rules: `https://antigravity.google/docs/rules-workflows`
  - Hooks: `https://antigravity.google/docs/hooks`
  - Plugins: `https://antigravity.google/docs/plugins`
  - Sidecars: `https://antigravity.google/docs/sidecars`
  - MCP: `https://antigravity.google/docs/mcp`
- **Security & Sandbox**:
  - Permissions: `https://antigravity.google/docs/permissions`
  - Sandbox: `https://antigravity.google/docs/sandbox`
  - Browser Automation: `https://antigravity.google/docs/ide/browser`
- **Changelog**: `https://antigravity.google/changelog`
