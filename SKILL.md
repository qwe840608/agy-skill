---
name: agy-skill
description: >-
  Comprehensive guide and operational playbook for Google Antigravity (App 2.0,
  agy CLI, IDE, Python SDK, and Customizations: Skills, Rules, Plugins, Hooks,
  MCP, Sidecars, Generative UI). Enables Claude Code, Codex, OpenCode, and
  Antigravity agents to orchestrate agy CLI headlessly, configure Antigravity,
  and auto-update this skill when Antigravity updates. Use whenever the user
  mentions Antigravity, agy, .agents/, GEMINI.md, sidecars, plugins, or asks to
  update/sync agy-skill.
---

# Google Antigravity (`agy`) Universal Agent Skill

This skill equips **any AI coding agent** (Claude Code, OpenAI Codex, OpenCode, Cursor, or Antigravity itself) with complete operational mastery over **Google Antigravity**—covering **Antigravity CLI (`agy`)**, **Antigravity 2.0 Desktop App**, **Antigravity IDE**, **Customizations**, and the **Python SDK**.

---

## Use This Skill When

- Calling, scripting, or orchestrating the **`agy` CLI** from another agent or terminal (headless `-p` / `--print` mode, `--output-format json|stream-json`, `--json-schema`, `--mode`, `--effort`, `--model`, `--sandbox`, or `agy acp`).
- Creating, debugging, or managing **Antigravity Customizations**:
  - **Skills** (`SKILL.md`, `skills.json`, and `@rmyndharis/antigravity-skills` vault integration)
  - **Rules** (`GEMINI.md`, `AGENTS.md`, `.agents/rules/*.md`)
  - **Plugins** (`plugin.json`, `plugins.json`, `agy plugin`, Marketplace cards)
  - **Lifecycle Hooks** (`hooks.json`, `PreToolUse`, `PostToolUse`, `SessionStart`, `PreInvocation`, `PostInvocation`, `Stop`)
  - **MCP Servers** (`mcp_config.json`, `agy mcp`, Stdio & Streamable HTTP)
  - **Sidecars & Scheduled Automations** (`sidecar.json`, cron schedules, UI plugin panes)
  - **Generative UI** (`<agent-embed>`, HTML artifacts, theme tokens)
- Answering questions about **Antigravity 2.0 App**, **Antigravity IDE**, or the **Python SDK (`google-antigravity`)**.
- **Updating or synchronizing `agy-skill`** after an Antigravity (`agy` / App) version update or skill modification.

## Do Not Use This Skill When

- Performing unrelated general programming tasks that do not involve Antigravity CLI, App, IDE, SDK, or `.agents/` / `~/.gemini/` configurations.

---

## 1. Progressive Disclosure Map (`references/`)

To keep context usage minimal, detailed specifications are modularized in `references/`. **Read the relevant reference file before executing tasks in that domain:**

1. **[references/cli-and-headless.md](references/cli-and-headless.md)**
   - **Read when**: Running `agy` commands, delegating tasks from Claude/Codex/OpenCode to `agy -p`, enforcing JSON schemas (`--json-schema`), streaming NDJSON (`stream-json`), starting the ACP server (`agy acp`), managing sessions (`-c`, `--conversation`), or configuring `~/.gemini/antigravity-cli/settings.json`.
2. **[references/app-and-ide.md](references/app-and-ide.md)**
   - **Read when**: Working with Antigravity 2.0 Desktop App (Sidebar, Chat Canvas, Slash Commands, `@` Mentions, Auxiliary Pane, Global/Project Permissions & Sandbox policies) or Antigravity IDE (Tab/Supercomplete, Inline `Ctrl+I`/`Cmd+I`, Code Lenses, Diff Overlays).
3. **[references/customizations.md](references/customizations.md)**
   - **Read when**: Configuring `.agents/` vs `~/.gemini/config/`, understanding the 5-tier loading priority, authoring `GEMINI.md`/`AGENTS.md` (24KB file cap & 20,000-token budget), configuring `skills.json`/`plugins.json`, migrating legacy workflows, or using `@rmyndharis/antigravity-skills`.
4. **[references/hooks-plugins-mcp.md](references/hooks-plugins-mcp.md)**
   - **Read when**: Writing `hooks.json` (all 6 events & camelCase stdin/stdout JSON contracts, `PLUGIN_ROOT`/`PLUGIN_DATA`), building or managing plugins (`plugin.json`, `agy plugin`, Language Server `GetAllPlugins` RPC, `customization://<dir>` links), or configuring MCP servers (`mcp_config.json`, `agy mcp`).
5. **[references/sidecars-ui-sdk.md](references/sidecars-ui-sdk.md)**
   - **Read when**: Creating Scheduled Automations (`sidecar.json` with `builtin: "schedule"`, `CRON_TZ`, `agentapi new-conversation`), surfacing UI Plugin Panes (`sidecar://`), building inline Generative UI widgets (`<agent-embed>`), or writing Python code with `google-antigravity` SDK.
6. **[references/version-snapshot.md](references/version-snapshot.md)**
   - **Read when**: Checking the exact installed `agy` version, exact CLI flags, currently supported model IDs, builtin skill hashes, and latest release notes on this machine.

---

## 2. Quick Reference for External Agents (Claude Code, Codex, OpenCode)

When you are running inside **Claude Code**, **Codex**, **OpenCode**, or another harness and want to invoke Antigravity (`agy`) as a subagent or tool:

```bash
# 1. Non-interactive single turn (plain text output)
agy -p "Analyze the repository architecture and summarize entrypoints"

# 2. Non-interactive with structured JSON output & schema validation
agy -p "List all REST endpoints in this repo" \
  --output-format json \
  --json-schema '{"type":"object","properties":{"endpoints":{"type":"array","items":{"type":"string"}}},"required":["endpoints"]}'

# 3. Autonomous edit/execution mode with specific model and reasoning effort
agy -p "Fix the failing tests in src/auth" \
  --mode auto \
  --model gemini-4-argon-high \
  --effort high \
  --sandbox

# 4. Resume the most recent conversation or a specific conversation ID
agy -c -p "Now add unit tests for the edge cases we discussed"
agy --conversation <conversation-id> -p "Continue implementation"

# 5. Inspect available models, agents, MCP servers, and plugins
agy models
agy agents
agy mcp list
agy plugin list --json
```

> **Tip for External Agents**: Always prefer `--mode plan` or `--sandbox` when delegating untrusted or exploratory tasks to `agy -p`, and use `--mode accept-edits` or `--mode auto` when you want `agy` to apply code changes autonomously.

---

## 3. Mandatory Update & GitHub Sync Protocol

**CRITICAL RULE**: Whenever Antigravity (`agy` CLI or Desktop App) updates, or whenever any file in the `agy-skill` repository is modified:

1. **Run the Auto-Introspection & Sync CLI**:
   ```bash
   # Inside the agy-skill repository checkout:
   npm run sync

   # Or from anywhere via npx:
   npx github:qwe840608/agy-skill sync
   ```
2. **What the CLI does automatically**:
   - Queries `agy --version`, `agy --help`, all `agy help <subcommand>` outputs, `agy models`, and `agy changelog`.
   - Scans `~/.gemini/antigravity/builtin/skills/` for any newly added or updated built-in Antigravity documentation.
   - Regenerates `references/version-snapshot.md` and updates `version-state.json`.
   - Synchronizes the updated skill across all local agent directories (`~/.gemini/config/skills/agy-skill`, `~/.claude/skills/agy-skill`, `~/.codex/skills/agy-skill`, `~/.config/opencode/skills/agy-skill`).
   - Commits and pushes all changes directly to the public GitHub repository (`https://github.com/qwe840608/agy-skill`).
3. **Semantic Documentation Review**:
   - If `npm run sync` reports a version bump or changed builtin skill hashes, inspect the diff in `references/version-snapshot.md` and update the corresponding guide in `references/*.md` or `SKILL.md` so behavioral guides stay 100% aligned with the new release, then re-run `npm run sync`.

---

## 4. Official Live Documentation Sitemap

If the user asks about cloud-only features or newly announced capabilities not covered in `references/`, fetch from the authoritative docs:

- **Docs Home**: `https://antigravity.google/docs`
- **CLI Features / Best Practices / Reference**:
  - `https://antigravity.google/docs/cli/features`
  - `https://antigravity.google/docs/cli/best-practices`
  - `https://antigravity.google/docs/cli/reference`
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
