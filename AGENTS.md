# Agent Instructions for `agy-skill`

This repository (`https://github.com/qwe840608/agy-skill`) contains **`agy-skill`**: a skill that teaches AI coding agents (Claude Code, OpenAI Codex, OpenCode, Antigravity itself, and others) how to delegate work safely to the Google Antigravity CLI (`agy`) in headless print mode. Antigravity reads this file as a rules file; other agents read it as repository instructions.

## Mandatory Rules for All Agents

1. **Scope: the `agy` CLI only**
   - `SKILL.md` is about running `agy -p` from another agent. Keep the Antigravity desktop app, IDE, Python SDK, sidecars, and generative UI out of scope unless the owner asks to add them back. `references/customizations.md` and `references/hooks-plugins-mcp.md` stay as optional deep dives for configuring `agy` itself.
2. **Keep documentation English (locale-aware installer description), separate English & Traditional Chinese READMEs**
   - The canonical `SKILL.md` and all files under `references/` must be written in clear, token-efficient **English** aligned with official Antigravity terminology. `bin/cli.mjs` localizes only the `description` field (Traditional Chinese or English) at install time; keep `DESCRIPTIONS` in `bin/cli.mjs` identical in meaning to the `description` in `SKILL.md`.
   - `README.md` is the primary **English** README; `README_tw.md` is the **Traditional Chinese (繁體中文)** README. Update both whenever documentation changes.
   - Every factual claim about `agy` behaviour must be backed by something checkable: `agy --help`, `agy changelog`, the official docs, or a dated local test noted in the text. Do not add benchmark numbers or version claims without a source.
3. **Update on Antigravity releases**
   - Whenever the user upgrades Antigravity or asks to update the skill, run `npm run sync` (this does **not** touch git). Inspect the diff in `references/version-snapshot.md` and `~/.gemini/antigravity/builtin/skills/`; if flags, subcommands, permission rules, or hook contracts changed, update `SKILL.md` and `references/*.md` to match, then run `npm run sync` again.
4. **Sync every modification to local agents; publish only with approval**
   - After **any** edit to this repository, run `npm run sync` (equivalent to `node bin/cli.mjs sync --no-git`) so the change is copied to the global skill directories for Antigravity, Claude Code, Codex, and OpenCode.
   - Commit and push to `origin main` only after the repository owner approves. `npm run sync:push` does the commit and push; the `post-commit` hook never pushes.
