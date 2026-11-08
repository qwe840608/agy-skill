# agy-skill — Universal Google Antigravity Skill for AI Agents

English | [繁體中文](README_tw.md)

**`agy-skill`** is a comprehensive, universal AI Agent Skill package for **Google Antigravity**—covering **Antigravity 2.0 Desktop App**, **`agy` CLI**, **Antigravity IDE**, **Python SDK**, and the **Customization System**. It is designed to be understood and used seamlessly by **Claude Code**, **OpenAI Codex**, **OpenCode**, **Cursor**, and **Antigravity** itself.

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
| **Auto-Introspection & Multi-Agent Sync** | Built-in `scripts/update-and-sync.mjs` introspects local `agy` version, flags, models, changelog, and builtin skill SHA-256 hashes, updates the snapshot, installs across 4 major agent skill directories, and auto-commits & pushes to GitHub. |

---

## Repository Structure

```text
agy-skill/
├── SKILL.md                           # Core skill entrypoint (Progressive Disclosure router & quick commands)
├── AGENTS.md                          # Mandatory maintenance rules for AI agents (auto-update & GitHub sync)
├── README.md                          # Primary English documentation
├── README_tw.md                       # Traditional Chinese (繁體中文) documentation
├── version-state.json                 # Auto-tracked agy version, CLI help hashes, and builtin skills SHA-256 state
├── references/
│   ├── cli-and-headless.md            # agy CLI flags, headless JSON/NDJSON streaming, ACP Server guide
│   ├── app-and-ide.md                 # Antigravity 2.0 Desktop App & Antigravity IDE operations and permissions
│   ├── customizations.md              # 5 Customization pillars, priority order, Rules budgets, skills.json
│   ├── hooks-plugins-mcp.md           # hooks.json 6 event contracts, plugin.json, LS RPC, mcp_config.json
│   ├── sidecars-ui-sdk.md             # Scheduled Automations (sidecar.json), UI Panes, Generative UI, Python SDK
│   └── version-snapshot.md            # Auto-generated local agy CLI / Models / Changelog / Builtin skills snapshot
└── scripts/
    ├── update-and-sync.mjs            # Cross-platform introspection, snapshot generator, multi-agent installer & GitHub sync
    ├── update-and-sync.ps1            # Windows PowerShell wrapper
    └── update-and-sync.sh             # macOS / Linux Bash wrapper
```

---

## One-Click Installation & Cross-Agent Synchronization

Clone this repository and run the synchronization script to introspect your local Antigravity installation and deploy `agy-skill` to all major AI coding agents on your machine:

```bash
git clone https://github.com/qwe840608/agy-skill.git
cd agy-skill

# Install to all local agents (Antigravity, Claude Code, Codex, OpenCode) without pushing to Git
node scripts/update-and-sync.mjs --no-git

# Maintainers: Introspect local Antigravity, sync to all agents, and commit & push to GitHub
node scripts/update-and-sync.mjs

# Windows PowerShell wrapper
pwsh -File scripts/update-and-sync.ps1
```

The script automatically installs and synchronizes `agy-skill` to:
1. **Antigravity (App 2.0 / `agy` CLI / IDE)**: `~/.gemini/config/skills/agy-skill`
2. **Claude Code**: `~/.claude/skills/agy-skill`
3. **OpenAI Codex CLI**: `~/.codex/skills/agy-skill`
4. **OpenCode**: `~/.config/opencode/skills/agy-skill`

> **Whenever Antigravity Updates**: Simply tell any agent *"Update agy-skill"* or run `node scripts/update-and-sync.mjs` to automatically detect new CLI flags, models, changelog entries, and built-in documentation diffs, update the skill, and push to GitHub.

---

## License

MIT
