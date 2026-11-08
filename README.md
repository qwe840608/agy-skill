# agy-skill — Universal Google Antigravity Skill for AI Agents

English | [繁體中文](README_tw.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**`agy-skill`** is a comprehensive, universal AI Agent Skill package for **Google Antigravity**—covering **Antigravity 2.0 Desktop App**, **`agy` CLI**, **Antigravity IDE**, **Python SDK**, and the **Customization System**. It is designed to be understood and used seamlessly by **Claude Code**, **OpenAI Codex**, **OpenCode**, **Cursor**, and **Antigravity** itself across **Windows, macOS, and Linux**.

---

## One-Click Installation via `npx` (Windows / macOS / Linux)

No manual cloning required. Run a single command on any OS with Node.js (`>=18`) to install `agy-skill` across your AI coding agents:

```bash
# 1. One-click Global Install (Antigravity, Claude Code, OpenAI Codex, OpenCode)
npx github:qwe840608/agy-skill

# 2. Install into the current project workspace (.agents/skills/agy-skill)
npx github:qwe840608/agy-skill install --workspace

# 3. Install only for specific agents (comma-separated: antigravity,claude,codex,opencode)
npx github:qwe840608/agy-skill install --agent antigravity,claude

# 4. Check local agy CLI version & skill installation status across all agents
npx github:qwe840608/agy-skill doctor

# 5. Uninstall agy-skill
npx github:qwe840608/agy-skill uninstall
```

By default, `npx github:qwe840608/agy-skill` installs the skill into:
1. **Antigravity (App 2.0 / `agy` CLI / IDE)**: `~/.gemini/config/skills/agy-skill`
2. **Claude Code**: `~/.claude/skills/agy-skill`
3. **OpenAI Codex CLI**: `~/.codex/skills/agy-skill`
4. **OpenCode**: `~/.config/opencode/skills/agy-skill`

---

## Key Capabilities

| Domain | Capabilities Provided by `agy-skill` |
| :--- | :--- |
| **Cross-Agent `agy` CLI Orchestration** | Full coverage of `agy -p` (`--print`), `--output-format json\|stream-json`, `--json-schema` structured output, `--mode (plan\|accept-edits\|auto)`, `--effort (low..max)`, `--sandbox`, and `-c` / `--conversation`, allowing Claude/Codex/OpenCode to delegate tasks to `agy` as a subagent. |
| **CLI Subcommands & ACP Server** | Complete reference for `agy acp` (Agent Client Protocol stdio JSON-RPC server), `agy mcp`, `agy plugin` (including `import [claude\|gemini]`, `category` validation, symlink support), `agy models`, `agy agents`, `agy remote-control`, and `agy mic-serve`. |
| **Antigravity 2.0 App & IDE** | Covers Antigravity 2.0 Desktop App (Sidebar, Chat Canvas `/` slash commands & `@` mentions, HTML Auxiliary Pane, global & project-level sandbox/permission policies) and Antigravity IDE (Tab/Supercomplete, `Ctrl+I`/`Cmd+I`, Code Lenses). |
| **5 Customization Pillars** | Full specification of `.agents/` & `~/.gemini/config/` 5-tier loading precedence, **Rules** (24KB per-file cap / 20,000-token budget demotion), **Skills** (`skills.json`), **Plugins** (`plugin.json`, Language Server `GetAllPlugins` RPC & `customization://<dir>` links), **Hooks** (`hooks.json` 6 lifecycle events, camelCase stdin/stdout contracts, `PLUGIN_ROOT`/`PLUGIN_DATA`), and **MCP** (Stdio & Streamable HTTP). |
| **Sidecars, Scheduled Automations & Generative UI** | Complete guide for `~/.gemini/config/sidecars/<id>/sidecar.json` (`builtin: "schedule"`, `CRON_TZ`, `agentapi new-conversation`, least-privilege `access_grants`), UI Plugin Panes (`sidecar://`), and inline Generative UI (`<agent-embed>` & gstatic Tailwind rules). |
| **Python SDK (`google-antigravity`)** | Covers `Agent`, `LocalAgentConfig`, `CapabilitiesConfig`, and async streaming for `thoughts` and `tool_calls`. |
| **Auto-Introspection & Multi-Agent Sync** | Built-in `bin/cli.mjs` (`npm run sync`) introspects local `agy` version, flags, models, changelog, and builtin skill SHA-256 hashes, updates the snapshot, installs across 4 major agent skill directories, and auto-commits & pushes to GitHub. |

---

## Repository Structure

```text
agy-skill/
├── package.json                       # Cross-platform npm package manifest & CLI bin registration
├── bin/
│   └── cli.mjs                        # Cross-platform one-click installer, doctor & auto-sync CLI
├── SKILL.md                           # Core skill entrypoint (Progressive Disclosure router & quick commands)
├── AGENTS.md                          # Mandatory maintenance rules for AI agents (auto-update & GitHub sync)
├── README.md                          # Primary English documentation
├── README_tw.md                       # Traditional Chinese (繁體中文) documentation
├── LICENSE                            # MIT License
├── version-state.json                 # Auto-tracked agy version, CLI help hashes, and builtin skills SHA-256 state
└── references/
    ├── cli-and-headless.md            # agy CLI flags, headless JSON/NDJSON streaming, ACP Server guide
    ├── app-and-ide.md                 # Antigravity 2.0 Desktop App & Antigravity IDE operations and permissions
    ├── customizations.md              # 5 Customization pillars, priority order, Rules budgets, skills.json
    ├── hooks-plugins-mcp.md           # hooks.json 6 event contracts, plugin.json, LS RPC, mcp_config.json
    ├── sidecars-ui-sdk.md             # Scheduled Automations (sidecar.json), UI Panes, Generative UI, Python SDK
    └── version-snapshot.md            # Auto-generated local agy CLI / Models / Changelog / Builtin skills snapshot
```

---

## Maintainer Sync & Auto-Update

Whenever Antigravity (`agy` CLI or Desktop App) updates, run the sync command inside a repository checkout (or ask your AI agent to *"Update agy-skill"*):

```bash
npm run sync
```

This automatically introspects the new `agy` release, updates `references/version-snapshot.md` and `version-state.json`, syncs the updated skill across all local agents, and commits & pushes to GitHub.

---

## License

Released under the [MIT License](LICENSE).
