# Agent Instructions for `agy-skill` (`AGENTS.md` / `GEMINI.md`)

This repository (`https://github.com/qwe840608/agy-skill`) contains the universal **Google Antigravity (`agy-skill`)** skill package for Antigravity, Claude Code, OpenAI Codex, OpenCode, and other AI coding agents.

## Mandatory Rules for All Agents

1. **Keep Documentation English (with Locale-Aware Installer Description), Separate English & Traditional Chinese READMEs**:
   - The canonical `SKILL.md` in the repository and all files under `references/` must be written in clear, token-efficient **English** aligned with official Antigravity terminology and schemas (`bin/cli.mjs` automatically localizes the `description` field to Traditional Chinese or English based on the user's OS locale during installation).
   - `README.md` is the primary **English** README, and `README_tw.md` is the **Traditional Chinese (繁體中文)** README. Keep both files synchronized whenever documentation changes.
2. **Always Update on Antigravity Releases**:
   - Whenever the user upgrades Antigravity (`agy` CLI or Desktop App) or asks to update the skill, run:
     ```bash
     npm run sync
     ```
   - Inspect any diffs in `references/version-snapshot.md` and `~/.gemini/antigravity/builtin/skills/`. If new CLI flags, subcommands, hook contracts, plugin fields, or app features were added, update the corresponding guide in `references/*.md` and `SKILL.md`.
3. **Always Sync Every Modification to Local Agents & GitHub**:
   - After **any** edit to this repository, you **MUST** run `npm run sync` (or `node bin/cli.mjs sync`) so changes are automatically copied to the global skill directories for Antigravity, Claude Code, Codex, and OpenCode, and committed and pushed to `origin main` on GitHub (`https://github.com/qwe840608/agy-skill`).
