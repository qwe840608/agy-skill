# agy-skill — Let Any AI Agent Use the Google Antigravity CLI

English | [繁體中文](README_tw.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**`agy-skill`** teaches AI coding agents (**Claude Code**, **OpenAI Codex**, **OpenCode**, and **Antigravity** itself) how to delegate work to the **Google Antigravity CLI (`agy`)** in headless print mode, safely and without hanging. One `npx` command installs the same skill into every agent's skill directory on **Windows, macOS, and Linux**.

What the skill gives an agent:

- **The one safe command** for `agy -p`: read-only and file-writing variants, `--settings` permission allowlists instead of `--dangerously-skip-permissions`, stdin closed, workspace attached, timeouts set.
- **Typical jobs**: understand images, video, or audio; generate images (`generate_image`); draft text; get a second-model research or review pass from Gemini.
- **Browser tasks**: drive the user's running Google Chrome via `/browser` with a least-privilege `chrome_devtools` allowlist, plus the user-side setup and the hard "never sign in, pay, post, or delete" rules.
- **Five rules against silent failures**: close stdin, always `--add-dir`, never skip permissions, forbid shell commands unless allowed, verify output yourself.
- **Reference material**: every flag and subcommand, JSON/NDJSON output, brief-writing tips, troubleshooting, and (optionally) how to configure `agy`'s own skills, rules, plugins, hooks, and MCP servers.
- **Live snapshot**: `agy --help`, `agy help <sub>`, `agy models`, and the latest changelog from the machine it was installed on.

---

## One-Click Installation (Windows / macOS / Linux)

### Option A: For Humans (`npx` One-Liner)

Requires Node.js `>=18`. The `agy` CLI itself must already be installed and signed in once interactively (see https://antigravity.google/docs/cli/install).

> **Note for npm v12+ (Node.js v25/v26+)**: modern `npm` disables Git-hosted packages by default (`npm error code EALLOWGIT`). Always include `--allow-git=all` when running via `npx github:...`.

```bash
# 1. Global install for all supported agents (description language follows your OS locale)
npx --yes --allow-git=all github:qwe840608/agy-skill

# 2. Force the skill description language (en | zh | both)
npx --yes --allow-git=all github:qwe840608/agy-skill install --lang en
npx --yes --allow-git=all github:qwe840608/agy-skill install --lang zh

# 3. Install into the current project only (.agents/skills/agy-skill)
npx --yes --allow-git=all github:qwe840608/agy-skill install --workspace

# 4. Install for specific agents only (antigravity,claude,codex,opencode)
npx --yes --allow-git=all github:qwe840608/agy-skill install --agent antigravity,claude

# 5. Check agy CLI version, OS locale, and where the skill is installed
npx --yes --allow-git=all github:qwe840608/agy-skill doctor

# 6. Uninstall
npx --yes --allow-git=all github:qwe840608/agy-skill uninstall
```

### Option B: For AI Agents (Paste-In Prompt)

Paste this into **Claude Code**, **Codex**, **OpenCode**, or **Antigravity**:

```text
Run `npx --yes --allow-git=all github:qwe840608/agy-skill` to install the agy-skill (how to delegate work to the Google Antigravity CLI) into all global agent skill directories, then run `npx --yes --allow-git=all github:qwe840608/agy-skill doctor` to verify the installation.
```

Default install locations:

1. **Antigravity (App / `agy` CLI / IDE)**: `~/.gemini/config/skills/agy-skill`
2. **Claude Code**: `~/.claude/skills/agy-skill`
3. **OpenAI Codex CLI**: `~/.codex/skills/agy-skill`
4. **OpenCode**: `~/.config/opencode/skills/agy-skill`

Only the `description` field of `SKILL.md` is localized (Traditional Chinese or English); the body and `references/` are always English so every agent reads the same instructions.

---

## What an Agent Does With It

1. Puts the input files in one working folder and writes a short brief.
2. Runs the standard command from `SKILL.md` Section 1 (or Section 2 for Chrome), with `--settings` granting only `read_file`/`write_file` on that folder and, for browser work, only the needed `chrome_devtools` tools and domains.
3. Reads `agy-err.txt` and the produced files itself, verifies the facts, and only then reports to the user.

The skill was verified on `agy` v1.5.3, Windows 11, Claude Code auto mode (2026-11-09). Other platforms use the same flags; the only differences are the binary path and how stdin is closed, both covered in `SKILL.md` Section 0.

---

## Repository Structure

```text
agy-skill/
├── package.json                       # npm manifest; `npm run sync` (no git) and `npm run sync:push`
├── bin/
│   └── cli.mjs                        # Installer, doctor, snapshot generator, multi-agent sync
├── SKILL.md                           # The skill: safe command, browser tasks, five rules, allowlist format
├── AGENTS.md                          # Maintenance rules for agents editing this repo
├── README.md                          # This file (English)
├── README_tw.md                       # Traditional Chinese README
├── LICENSE                            # MIT
├── version-state.json                 # agy version, help hashes, and builtin-skill hashes from the last sync
└── references/
    ├── cli-and-headless.md            # All flags & subcommands, host/agy work split, briefs, troubleshooting
    ├── customizations.md              # agy's own skills/rules/plugins discovery, precedence, skills.json
    ├── hooks-plugins-mcp.md           # hooks.json contracts, plugin.json, mcp_config.json
    └── version-snapshot.md            # Auto-generated: agy --help, help <sub>, models, changelog, builtin hashes
```

---

## Maintainer Sync

Whenever `agy` updates, run inside a repository checkout (or ask your agent to "update agy-skill"):

```bash
npm run sync
```

This queries the local `agy` (`--version`, `--help`, `help <sub>`, `models`, `changelog`, builtin skill hashes), rewrites `references/version-snapshot.md` and `version-state.json`, and copies the skill into every local agent directory. It does **not** commit or push. Review the diff, update the guides if behaviour changed, then publish with:

```bash
npm run sync:push
```

---

## License

Released under the [MIT License](LICENSE).
