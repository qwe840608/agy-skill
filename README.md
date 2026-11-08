# agy-skill

English | [繁體中文](README_tw.md)

[![npm](https://img.shields.io/npm/v/agy-skill.svg)](https://www.npmjs.com/package/agy-skill)
[![CI](https://github.com/qwe840608/agy-skill/actions/workflows/ci.yml/badge.svg)](https://github.com/qwe840608/agy-skill/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**A skill that teaches your AI coding agent how to use the Google Antigravity CLI (`agy`).**

Install it once, and Claude Code, OpenAI Codex, OpenCode, or Antigravity itself knows how to hand a job to Gemini through `agy` without hanging and without over-granting permissions. Typical jobs: look at a video, image, or audio file; generate an image; write a draft; get a second opinion on code or a plan; drive your Google Chrome.

---

## Install in three steps

**1. Check the requirements**

- Node.js 18 or newer (`node --version`).
- The `agy` CLI installed and signed in once by running `agy` in a terminal ([install guide](https://antigravity.google/docs/cli/install)).

**2. Run one command**

```bash
npx --yes agy-skill
```

This copies the skill into the skill folders of every supported agent on your machine (Antigravity, Claude Code, Codex, OpenCode). Nothing else is changed.

**3. Check it worked**

```bash
npx --yes agy-skill doctor
```

You should see your `agy` version and four lines marked `Installed`. Restart your agent and you are done.

<details>
<summary>More install options (update, uninstall, one agent only, project only, GitHub instead of npm)</summary>

```bash
# Update to the newest version
npx --yes agy-skill@latest

# Uninstall (removes only the agy-skill folders)
npx --yes agy-skill uninstall

# Only some agents: antigravity, claude, codex, opencode
npx --yes agy-skill install --agent claude,codex

# Only the current project (.agents/skills/agy-skill)
npx --yes agy-skill install --workspace

# Force the one-line description to English or Traditional Chinese
npx --yes agy-skill install --lang en

# Install straight from GitHub (current main) instead of npm
npx --yes --allow-git=all github:qwe840608/agy-skill
```

Or paste this to your agent: *"Run `npx --yes agy-skill`, then `npx --yes agy-skill doctor`, and show me the result."*

</details>

---

## What happens next

You do not call `agy` yourself. You ask your agent as usual, for example *"Have Gemini summarize this video"* or *"Ask Gemini for a second opinion on this plan"*, and the agent:

1. Puts the input files in one working folder and writes a short brief.
2. Runs `agy` with permissions limited to that folder (and, for Chrome tasks, only the named browser tools and websites).
3. Reads `agy`'s error output and the produced files itself, checks the facts, and only then reports back to you.

Four ready-made examples with the exact prompts: [references/examples.md](references/examples.md).

---

## Safety rules the agent follows

| Task | `agy` may… | `agy` may **not**… | Agent must ask you first before… |
| :--- | :--- | :--- | :--- |
| Read-only (summaries, reviews) | read files in the working folder | write anything, run shell commands, read outside that folder | — |
| Writes files (drafts, images) | read and write in the working folder | write anywhere else, run shell commands | sending the result anywhere outside your machine |
| Browser (`/browser` in your Chrome) | use the listed browser tools on the named websites | run page scripts, use wildcards, touch other sites | signing in, entering passwords or payment details, submitting forms, posting, buying, deleting |

In every case: no `--dangerously-skip-permissions`, permissions come from an explicit allowlist, and exit code 0 is never taken as proof of success. The allowlist is enforced by `agy`; the "ask you first" line is enforced by your agent following these instructions. Full technical detail is in [SKILL.md](SKILL.md).

---

## Tested on

| | Install / doctor / uninstall | Read-only task | Writes files | Chrome task |
| :--- | :--- | :--- | :--- | :--- |
| **Claude Code, Windows 11** | ✅ 2026-11-09, agy 1.5.3 | ✅ 2026-11-09, agy 1.5.3 | ✅ 2026-11-09, agy 1.5.3 | ✅ 2026-11-09, agy 1.5.3, Chrome 157 |
| **Antigravity / Codex / OpenCode, Windows 11** | ✅ install only, 2026-11-09 | untested | untested | untested |
| **macOS, Linux (any agent)** | 🤖 CI installer tests only | untested | untested | untested |

Untested cells use the same commands and are expected to work, but nobody has run them yet. If something fails, open an issue with your OS, agent, `agy --version`, the command, and the contents of `agy-err.txt`.

---

## More

- [SKILL.md](SKILL.md): the skill itself, as the agent reads it.
- [references/examples.md](references/examples.md) / [EXAMPLES_tw.md](EXAMPLES_tw.md): worked examples.
- [MAINTAINING.md](MAINTAINING.md): tests, CI, syncing after an `agy` update, releasing to npm.
- [LICENSE](LICENSE): MIT.
