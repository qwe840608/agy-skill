# Antigravity Customization System & Cross-Agent Compatibility

This guide covers how Antigravity discovers, prioritizes, and loads customizations (**Rules**, **Skills**, **Plugins**, **Hooks**, **MCP Servers**), how `skills.json` and `plugins.json` work, how to integrate with `@rmyndharis/antigravity-skills`, and how to share skills across **Antigravity**, **Claude Code**, **Codex**, and **OpenCode**.

---

## 1. The 5 Customization Pillars

| Type | Config File / Folder | Scope | Purpose |
| :--- | :--- | :--- | :--- |
| **Rules** | `GEMINI.md`, `AGENTS.md`, `.agents/rules/*.md` | Contextual / Hierarchical | Enforce coding styles, architectural boundaries, and local guidelines. |
| **Skills** | `skills/<name>/SKILL.md` | On-Demand (Progressive) | Multi-step procedures, runbooks, scripts, and domain playbooks. Also invokable as `/<skill-name>`. |
| **Plugins** | `plugins/<name>/plugin.json` | Namespaced Bundle | Package skills, agents, rules, hooks, sidecars, and MCP servers into a single toggleable unit. |
| **Hooks** | `hooks.json` | Lifecycle Event | Run shell commands/scripts at 6 agent lifecycle points (`SessionStart`, `PreToolUse`, `PostToolUse`, `PreInvocation`, `PostInvocation`, `Stop`). |
| **MCP Servers** | `mcp_config.json` | Tool Integration | Connect external tools and resources via Stdio or Streamable HTTP. |

---

## 2. Discovery Locations & Loading Priority

### Discovery Roots
1. **Workspace Customizations (Project-Specific)**:
   - Canonical path: `<project-root>/.agents/` (also supports `.agent/`, `_agents/`, `_agent/` for backward compatibility).
   - Antigravity walks up from the current working directory (CWD) to the repository root (the directory containing `.git`).
2. **Directory & Project Rules (Hierarchical)**:
   - `GEMINI.md`, `AGENTS.md`, and `.agents/rules/*.md` in any directory between the edited/opened file and the repository root.
3. **Global Configuration (Machine-Local)**:
   - `~/.gemini/config/` (read by Antigravity 2.0 App, `agy` CLI, and Antigravity IDE).
   - Legacy IDE-only global skills path: `~/.gemini/antigravity/skills/` (only read by standalone IDE; prefer `~/.gemini/config/skills/`).

### 5-Tier Loading Precedence (Highest to Lowest)
When two customizations share the same name, the higher-priority one wins:
1. **Workspace Project**: Hierarchical discovery walking up from CWD to repository root (`.agents/`).
2. **Workspace Declared Configurations**: Explicitly listed in `.agents/skills.json` or `.agents/plugins.json`.
3. **Global Discovery**: `~/.gemini/config/`.
4. **Built-in Customizations**: Bundled skills/plugins in `~/.gemini/antigravity/builtin/` mounted by name.
5. **Global Declared Configurations**: Listed in `~/.gemini/config/skills.json` or `~/.gemini/config/plugins.json`.

---

## 3. Progressive Disclosure, Deduplication & Context Budgets

- **Progressive Disclosure**:
  - For **Skills**, only YAML frontmatter (`name` and `description`) is injected at session start. The body of `SKILL.md` and files in `references/` are loaded on demand only when activated.
  - Keep `SKILL.md` concise and place bulky documentation in `references/`, helper scripts in `scripts/`, templates in `resources/`, and examples in `examples/`.
- **Deduplication**:
  - Rules and skills are deduplicated by resolved real file path; a file is never injected twice in the same turn.
- **Rules Size Limits & Token Budget**:
  - **Per-File Cap (`24 KB` / `24,000` bytes)**: Each `GEMINI.md` / `AGENTS.md` file is capped at 24,000 bytes (after expanding `@[label](path)` includes) and truncated on line boundaries if exceeded.
  - **Aggregate Rules Budget (`20,000` tokens)**: Always-on and global rules share a 20,000-token budget (`defaultRulesBudget`). Over-budget rules are automatically demoted from inline text to file path pointers so the agent can read them on demand. (Rules inside built-in plugins are exempt).

---

## 4. Authoring Skills (`SKILL.md`)

### Required Format
```markdown
---
name: my-skill-name
description: >-
  Concise third-person description of what the skill does and when to use it.
  Include "Use when..." and "Do not use when..." triggers to prevent over-activation.
---

# Skill Title

## Use this skill when
- ...

## Do not use this skill when
- ...

## Instructions
1. Step-by-step instructions...
```

- **Optional Frontmatter Fields**:
  - `disable-slash-command: true`: Prevents the skill from appearing as a user-invokable `/<name>` slash command while keeping it available to the agent.
  - `metadata: { icon: "..." }`: UI icon metadata (e.g., `icon: schedule`).
- **Authoring Best Practices** (incorporating `@rmyndharis/antigravity-skills` strict validation standards):
  - Never start `description` with `"You are..."` or `"PROACTIVELY..."`. State clear activation triggers.
  - Avoid single-vendor syntax that breaks in other harnesses (such as hardcoded `$ARGUMENTS` macros) when writing portable skills.
  - Include a **Safety** section when a skill runs destructive terminal or infrastructure commands.
  - Use relative links (`[cli-and-headless.md](references/cli-and-headless.md)`) for all helper files.

---

## 5. Advanced Management: `skills.json` & `plugins.json`

Use `.agents/skills.json` or `.agents/plugins.json` (or in `~/.gemini/config/`) to load customizations from custom team directories or shared manifests. Each entry directory is scanned **one level deep**.

```json
{
  "inherits": [
    {
      "path": "/path/to/shared/skills.json",
      "include_only": ["linter-skill"],
      "exclude": ["deprecated-skill"]
    }
  ],
  "entries": [
    {
      "path": "tools/agents/skills",
      "exclude": ["experimental-.*"]
    },
    {
      "path": "~/personal-skills"
    }
  ]
}
```

- **Path Resolution**:
  - `/...` ( or `C:\...` on Windows): Absolute path.
  - `~/...`: User home directory.
  - Relative path (`tools/agents/skills`): Resolved against the directory containing `.agents/`, falling back to the repository root.

---

## 6. Integrating with `@rmyndharis/antigravity-skills` Vault

The community repository [`rmyndharis/antigravity-skills`](https://github.com/rmyndharis/antigravity-skills) provides 300+ domain-specific workflows via an npm CLI.

- **Recommended Commands for `@rmyndharis/antigravity-skills`**:
  ```bash
  # Search catalog first (do NOT use --all, which bloats token metadata)
  npx @rmyndharis/antigravity-skills search <query>

  # Install into current workspace's canonical .agents/skills directory
  AG_SKILLS_DIR=.agents/skills npx @rmyndharis/antigravity-skills install <skill-name>

  # Install into global Antigravity config directory (~/.gemini/config/skills)
  npx @rmyndharis/antigravity-skills install <skill-name> --global

  # Install curated bundle (core-dev, security-core, k8s-core, data-core, ai-core, ops-core)
  AG_SKILLS_DIR=.agents/skills npx @rmyndharis/antigravity-skills install --bundle core-dev

  # Check health and installed skills
  npx @rmyndharis/antigravity-skills doctor
  npx @rmyndharis/antigravity-skills installed --global
  ```

---

## 7. Migrating Legacy Workflows (`migrate-workflows`)

Legacy workflow files (`.agents/workflows/*.md`, `_agents/workflows/*.md`, `~/.gemini/config/global_workflows/*.md`, and `workflows.json`) are **deprecated** in favor of Skills (`.agents/skills/<name>/SKILL.md`).
- To migrate: convert each `<name>.md` into `<target_skills_dir>/<name>/SKILL.md` with YAML frontmatter (`name`, `description`), preserve existing `SKILL.md` files without overwriting, and archive old workflow files as `<name>.md.bak`.

---

## 8. Cross-Agent Global Skill Locations (Claude, Codex, OpenCode, Antigravity)

To make a skill universally available across all major AI coding agents on a machine, install or symlink the skill folder into each agent's global skill discovery directory:

| Agent / Platform | Global Skill Directory Path | Project-Scoped Path |
| :--- | :--- | :--- |
| **Antigravity (App 2.0, `agy` CLI, IDE)** | `~/.gemini/config/skills/<skill-name>/SKILL.md` | `<repo>/.agents/skills/<skill-name>/SKILL.md` |
| **Antigravity IDE (Legacy Fallback)** | `~/.gemini/antigravity/skills/<skill-name>/SKILL.md` | `<repo>/.agent/skills/<skill-name>/SKILL.md` |
| **Claude Code** | `~/.claude/skills/<skill-name>/SKILL.md` | `<repo>/.claude/skills/<skill-name>/SKILL.md` |
| **OpenAI Codex CLI** | `~/.codex/skills/<skill-name>/SKILL.md` | `<repo>/.agents/skills/<skill-name>/SKILL.md` |
| **OpenCode** | `~/.config/opencode/skills/<skill-name>/SKILL.md` | `<repo>/.opencode/skills/<skill-name>/SKILL.md` |

*(Run `node scripts/update-and-sync.mjs` from the `agy-skill` directory to automatically synchronize `agy-skill` across all of these directories on your machine.)*
