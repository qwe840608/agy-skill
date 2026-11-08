# Maintaining agy-skill

For people (and agents) who change this repository. Users only need [README.md](README.md). Agents editing the repo must also follow [AGENTS.md](AGENTS.md).

## Repository layout

```text
agy-skill/
├── SKILL.md                     # The skill itself: safe command, Chrome tasks, five rules, allowlist format
├── references/
│   ├── examples.md              # Four copy-and-adapt briefs (installed with the skill)
│   ├── cli-and-headless.md      # All flags & subcommands, host/agy work split, troubleshooting
│   ├── customizations.md        # agy's own skills/rules/plugins discovery and precedence
│   ├── hooks-plugins-mcp.md     # hooks.json, plugin.json, mcp_config.json
│   └── version-snapshot.md      # Auto-generated from the local agy: --help, help <sub>, models, changelog
├── EXAMPLES_tw.md               # Traditional Chinese copy of references/examples.md
├── bin/cli.mjs                  # Installer, doctor, snapshot generator, multi-agent sync
├── test/cli.test.mjs            # node:test suite (scratch home, no real agy needed)
├── test/pack-check.mjs          # Asserts `npm pack` ships the right files
├── .github/workflows/ci.yml     # Ubuntu / Windows / macOS × Node 18 / 20 / 22
├── version-state.json           # agy version and hashes from the last sync
├── README.md, README_tw.md      # User docs (English primary, Traditional Chinese mirror)
├── AGENTS.md                    # Rules for agents editing this repo
└── MAINTAINING.md               # This file
```

Only `SKILL.md` and `references/` are installed into agent skill directories. The `description` in `SKILL.md` is localized at install time from `DESCRIPTIONS` in `bin/cli.mjs`; everything else stays English.

## Everyday commands

| Command | What it does |
| :--- | :--- |
| `npm test` | 14 tests covering install, uninstall, `doctor`, `sync --no-git`, and bad input. Uses a scratch home (`AGY_SKILL_HOME`) and a fake `AGY_BIN`, so no real `agy` or sign-in is needed. |
| `npm run pack:check` | `npm pack --dry-run` plus an assertion that every required file is included and no test/CI file leaks in. |
| `npm run sync` | Queries the local `agy` (`--version`, `--help`, `help <sub>`, `models`, `changelog`, builtin skill hashes), rewrites `references/version-snapshot.md` and `version-state.json`, and copies the skill into all four local agent directories. **Does not touch git.** |
| `npm run sync:push` | Same, then `git add -A`, commit, and push to `origin main`. Only after the owner approves. |
| `npm run doctor` | Shows the local `agy` version and where the skill is installed. |

The `post-commit` hook (`.githooks/`, enabled via `core.hooksPath`) re-installs the skill locally after each commit. It never pushes.

## After an `agy` update

1. `npm run sync` and read the diff in `references/version-snapshot.md`.
2. If flags, subcommands, permission rules, or hook contracts changed, update `SKILL.md` and `references/*.md`. Keep every factual claim checkable (help output, changelog, official docs, or a dated local test).
3. `npm test`, `npm run pack:check`, `npm run sync` again, commit, and ask the owner before pushing.

## Compatibility claims

The matrix in both READMEs lists only combinations that were actually run. When you verify a new one, add the date and `agy` version. Never upgrade "untested" to "verified" without a run. CI covers the installer code paths on three OSes but has no real `agy`.

## Releasing to npm

Nothing publishes automatically, and agents never run `npm publish`.

1. Bump `version` in `package.json` (semver, independent of the `agy` version) and commit.
2. From a terminal where you can complete npm's two-factor prompt in the browser:
   ```bash
   npm publish --access public
   ```
   `prepublishOnly` runs the tests and the pack check first.
3. Verify from a clean directory:
   ```bash
   AGY_SKILL_HOME=/tmp/agy-skill-check npx --yes agy-skill@<version> doctor
   ```
4. Push the version commit.

`npm publish --dry-run` is only useful before a version exists on the registry; npm rejects it for an already-published version, which is why CI runs `pack:check` instead.

Release log:

| Version | Date | Verified on |
| :--- | :--- | :--- |
| 0.1.0 | 2026-11-09 | Windows 11, Node 26, npm 12; `npx --yes agy-skill@0.1.0 install/doctor/uninstall` in a scratch home |

## Two-language documents

Keep these pairs in step: `README.md` ↔ `README_tw.md`, `references/examples.md` ↔ `EXAMPLES_tw.md`. `SKILL.md`, `references/`, and this file are English only.
