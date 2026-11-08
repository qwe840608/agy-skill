# agy-skill — Let Any AI Agent Use the Google Antigravity CLI

English | [繁體中文](README_tw.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/qwe840608/agy-skill/actions/workflows/ci.yml/badge.svg)](https://github.com/qwe840608/agy-skill/actions/workflows/ci.yml)

**`agy-skill`** teaches AI coding agents (**Claude Code**, **OpenAI Codex**, **OpenCode**, and **Antigravity** itself) how to delegate work to the **Google Antigravity CLI (`agy`)** in headless print mode, safely and without hanging. One `npx` command installs the same skill into every agent's skill directory on **Windows, macOS, and Linux**.

What the skill gives an agent:

- **The one safe command** for `agy -p`: read-only and file-writing variants, `--settings` permission allowlists instead of `--dangerously-skip-permissions`, stdin closed, workspace attached, timeouts set.
- **Typical jobs**: understand images, video, or audio; generate images (`generate_image`); draft text; get a second-model research or review pass from Gemini.
- **Browser tasks**: drive the user's running Google Chrome via `/browser` with a least-privilege `chrome_devtools` allowlist, plus the user-side setup and the hard "never sign in, pay, post, or delete" rules.
- **Five rules against silent failures**: close stdin, always `--add-dir`, never skip permissions, forbid shell commands unless allowed, verify output yourself.
- **Copy-and-adapt examples** ([references/examples.md](references/examples.md)): video/image summary, second-opinion review, draft or image generation, Chrome task.
- **Reference material**: every flag and subcommand, JSON/NDJSON output, brief-writing tips, troubleshooting, and (optionally) how to configure `agy`'s own skills, rules, plugins, hooks, and MCP servers.
- **Live snapshot**: `agy --help`, `agy help <sub>`, `agy models`, and the latest changelog from the machine it was installed on.

---

## Installation (Windows / macOS / Linux)

**Requirements**: Node.js `>=18` (CI tests 18, 20, 22) and the `agy` CLI already installed and signed in once interactively (see https://antigravity.google/docs/cli/install). The installer never runs `agy` on your behalf beyond `--version`, `--help`, `models`, and `changelog`.

**Recommended way: `npx` from the npm registry.** The package is published as [`agy-skill`](https://www.npmjs.com/package/agy-skill) (first release 0.1.0, 2026-11-09). The package version is independent of the `agy` CLI version; the `agy` version a release was verified against is recorded in `version-state.json`.

```bash
# Install (global, all supported agents; description language follows your OS locale)
npx --yes agy-skill

# Force the skill description language (en | zh | both)
npx --yes agy-skill install --lang en

# Install into the current project only (.agents/skills/agy-skill)
npx --yes agy-skill install --workspace

# Install for specific agents only (antigravity,claude,codex,opencode)
npx --yes agy-skill install --agent antigravity,claude

# Check agy CLI version, OS locale, and where the skill is installed
npx --yes agy-skill doctor

# Update: re-run the install command with @latest (files are overwritten in place)
npx --yes agy-skill@latest

# Uninstall (removes only the agy-skill folders, nothing else)
npx --yes agy-skill uninstall
```

**Alternative: straight from GitHub** (always the current `main`, no registry needed). Modern `npm` (v12+, Node.js v25/v26+) disables Git-hosted packages by default (`npm error code EALLOWGIT`), so include `--allow-git=all`:

```bash
npx --yes --allow-git=all github:qwe840608/agy-skill
```

**For AI agents**, paste this into Claude Code, Codex, OpenCode, or Antigravity:

```text
Run `npx --yes agy-skill` to install the agy-skill (how to delegate work to the Google Antigravity CLI) into all global agent skill directories, then run `npx --yes agy-skill doctor` to verify the installation.
```

Default install locations:

1. **Antigravity (App / `agy` CLI / IDE)**: `~/.gemini/config/skills/agy-skill`
2. **Claude Code**: `~/.claude/skills/agy-skill`
3. **OpenAI Codex CLI**: `~/.codex/skills/agy-skill`
4. **OpenCode**: `~/.config/opencode/skills/agy-skill`

Only the `description` field of `SKILL.md` is localized (Traditional Chinese or English); the body and `references/` are always English so every agent reads the same instructions.

---

## Security Model at a Glance

Plain-language summary of what `SKILL.md` makes an agent do. The full technical detail (exact flags, allowlist syntax) lives in `SKILL.md` Sections 1 to 4; if the two ever disagree, `SKILL.md` wins.

| Task type | `agy` mode | What `agy` may touch | What it may **not** do | Agent must stop and ask the user | Agent verifies by |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Read-only** (summarize video/image/audio, review code or a plan) | `--mode plan --sandbox` | Read files inside the one working folder (`read_file($DIR)`) | Write anything; run shell commands; read outside `$DIR` (incl. `~/.gemini`, which holds OAuth tokens) | Never needed for the task itself | Reading `agy-err.txt`, then checking Gemini's claims against the source material |
| **Writes files** (drafts, generated images) | `--mode accept-edits --sandbox` | Read and write inside `$DIR` only (`read_file`, `write_file`) | Write outside `$DIR`; run shell commands | Before the output is sent anywhere outside the user's machine | Opening the produced file, checking facts against the inputs |
| **Browser** (`/browser` in the user's Chrome) | `--mode accept-edits --sandbox` | The listed `chrome_devtools` tools, the task's named domains, and `$DIR` | `evaluate_script`; wildcard tool or domain rules; anything on other sites | **Always** before: sign in, enter a password or payment detail, submit a form, post, buy, delete | Comparing the screenshot with the step list, then the read-back text with the screenshot |

Across all three:

- `--dangerously-skip-permissions` is never used. Permissions come from an explicit allowlist passed with `--settings`; any tool not on it is denied automatically in print mode.
- The prompt always says "Do not run any terminal commands" unless a specific `command(<prefix>)` rule was granted.
- Exit code 0 does not mean success. The agent reads `agy-err.txt` and the output files itself before reporting.

These are the rules the skill instructs agents to follow and that were exercised in the verified runs listed below. They do not make `agy`, Gemini, or Chrome safe in any other sense: the allowlist is enforced by `agy`, and the "stop and ask" line is enforced by the host agent following the instructions.

---

## Compatibility Matrix

Only combinations that were actually run are marked verified. Everything else is untested, even where the same command is expected to work.

| Agent / OS | Install, `doctor`, uninstall | `agy -p` read-only | `agy -p` writes files | `/browser` (Chrome) |
| :--- | :--- | :--- | :--- | :--- |
| **Claude Code / Windows 11** | ✅ Verified 2026-11-09, agy 1.5.3 | ✅ Verified 2026-11-09, agy 1.5.3 (auto mode, not blocked) | ✅ Verified 2026-11-09, agy 1.5.3 | ✅ Verified 2026-11-09, agy 1.5.3 + Chrome 157 |
| **Antigravity / Windows 11** | ✅ Install verified 2026-11-09 (`doctor` shows the skill) | ⏳ Untested | ⏳ Untested | ⏳ Untested |
| **OpenAI Codex / Windows 11** | ✅ Install verified 2026-11-09 (`doctor` shows the skill) | ⏳ Untested | ⏳ Untested | ⏳ Untested |
| **OpenCode / Windows 11** | ✅ Install verified 2026-11-09 (`doctor` shows the skill) | ⏳ Untested | ⏳ Untested | ⏳ Untested |
| **Any agent / macOS** | 🤖 CI only (installer tests on `macos-latest`, no real `agy`) | ⏳ Untested | ⏳ Untested | ⏳ Untested |
| **Any agent / Linux** | 🤖 CI only (installer tests on `ubuntu-latest`, no real `agy`) | ⏳ Untested | ⏳ Untested | ⏳ Untested |

Legend: ✅ run by a person with the listed version; 🤖 covered by the automated test suite in a scratch home directory (installer code paths only); ⏳ not yet run.

Known platform differences (all handled in `SKILL.md` Section 0 and 2):

- **Binary path**: `agy` on `PATH`, else `%LOCALAPPDATA%\agy\bin\agy.exe` (Windows) or `~/.local/bin/agy` (macOS/Linux). `AGY_BIN` overrides.
- **Closing stdin**: `</dev/null` in POSIX shells (incl. Git Bash); `cmd /c "agy ... < NUL"` in PowerShell.
- **Chrome user-data folder** for the `DevToolsActivePort` check differs per OS.
- Codex runs commands in its own sandbox by default; `agy` needs to run unsandboxed on the host (it reads `~/.gemini` and binds a local port). See `references/cli-and-headless.md` Section 5.2.

When reporting a problem, include: OS and version, agent name and version, `agy --version`, the exact command (with paths redacted), and the contents of `agy-err.txt`.

---

## What an Agent Does With It

1. Puts the input files in one working folder and writes a short brief.
2. Runs the standard command from `SKILL.md` Section 1 (or Section 2 for Chrome), with `--settings` granting only `read_file`/`write_file` on that folder and, for browser work, only the needed `chrome_devtools` tools and domains.
3. Reads `agy-err.txt` and the produced files itself, verifies the facts, and only then reports to the user.

Worked examples with briefs, permissions, and verification steps: [references/examples.md](references/examples.md) (English, installed with the skill) and [EXAMPLES_tw.md](EXAMPLES_tw.md) (Traditional Chinese).

---

## Repository Structure

```text
agy-skill/
├── package.json                       # npm manifest; scripts: test, pack:check, sync (no git), sync:push
├── bin/
│   └── cli.mjs                        # Installer, doctor, snapshot generator, multi-agent sync
├── test/
│   ├── cli.test.mjs                   # node:test suite for install / uninstall / doctor / sync (scratch home, no agy)
│   └── pack-check.mjs                 # Verifies `npm pack` ships the right files
├── .github/workflows/ci.yml           # Runs the above on Ubuntu, Windows, macOS × Node 18/20/22
├── SKILL.md                           # The skill: safe command, browser tasks, five rules, allowlist format
├── EXAMPLES_tw.md                     # Traditional Chinese copy of references/examples.md
├── AGENTS.md                          # Maintenance rules for agents editing this repo
├── README.md                          # This file (English)
├── README_tw.md                       # Traditional Chinese README
├── LICENSE                            # MIT
├── version-state.json                 # agy version, help hashes, and builtin-skill hashes from the last sync
└── references/
    ├── examples.md                    # Four copy-and-adapt briefs with permissions and verification
    ├── cli-and-headless.md            # All flags & subcommands, host/agy work split, briefs, troubleshooting
    ├── customizations.md              # agy's own skills/rules/plugins discovery, precedence, skills.json
    ├── hooks-plugins-mcp.md           # hooks.json contracts, plugin.json, mcp_config.json
    └── version-snapshot.md            # Auto-generated: agy --help, help <sub>, models, changelog, builtin hashes
```

---

## Maintainer Notes

**Tests**: `npm test` runs the installer, uninstaller, `doctor`, and `sync --no-git` against a scratch home directory (`AGY_SKILL_HOME`) with `AGY_BIN` pointing at a non-existent file, so no real `agy` or sign-in is needed. `npm run pack:check` confirms the package would ship every required file and none of the test/CI files. CI runs both on every push and pull request.

**Sync after an `agy` update** (inside a checkout, or ask your agent to "update agy-skill"):

```bash
npm run sync
```

This queries the local `agy` (`--version`, `--help`, `help <sub>`, `models`, `changelog`, builtin skill hashes), rewrites `references/version-snapshot.md` and `version-state.json`, and copies the skill into every local agent directory. It does **not** commit or push. Review the diff, update the guides if behaviour changed, then publish with:

```bash
npm run sync:push
```

**Releasing to npm**: nothing publishes automatically. To cut a release, bump `version` in `package.json` (semver, independent of the `agy` version), commit, then run `npm publish --access public` from a terminal where you can complete npm's two-factor prompt in the browser. `prepublishOnly` runs the tests and the pack check first, so a broken package cannot ship. After publishing, verify from a clean directory with `AGY_SKILL_HOME=<scratch> npx --yes agy-skill@<version> doctor`. CI runs `npm publish --dry-run` on every push so packaging problems surface before release day. The 0.1.0 release was verified this way on Windows 11, Node 26, npm 12 (2026-11-09).

---

## License

Released under the [MIT License](LICENSE).
