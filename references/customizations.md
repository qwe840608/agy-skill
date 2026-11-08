# Antigravity Customization System & Cross-Agent Compatibility

This guide covers how Antigravity discovers, prioritizes, and loads customizations (**Rules**, **Skills**, **Plugins**, **Hooks**, **MCP Servers**), how `skills.json` and `plugins.json` work, how to integrate with community skill vaults, and how to share skills across **Antigravity**, **Claude Code**, **Codex**, and **OpenCode**.

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
   - **Common Third-Party Installer Pitfall (`~/.gemini/antigravity/skills/`)**: Some third-party installers (such as `npx antigravity-awesome-skills`) default to `~/.gemini/antigravity/skills/`, which is a legacy path read **only** by the standalone Antigravity IDE—neither Antigravity 2.0 App nor `agy` CLI reads it! Always point installers to `~/.gemini/config/skills/` (global) or `.agents/skills/` (workspace).

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
  - Keep `SKILL.md` concise and place bulky documentation in `references/`, helper scripts in `scripts/` or `bin/`, templates in `resources/`, and examples in `examples/`.
- **Deduplication**:
  - Rules and skills are deduplicated by resolved real file path; a file is never injected twice in the same turn.
- **Rules Size Limits & Token Budget**:
  - **Per-File Cap (`24 KB` / `24,000` bytes)**: Each `GEMINI.md` / `AGENTS.md` file is capped at 24,000 bytes (after expanding `@[label](path)` includes) and truncated on line boundaries if exceeded.
  - **Aggregate Rules Budget (`20,000` tokens)**: Always-on and global rules share a 20,000-token budget (`defaultRulesBudget`). Over-budget rules are automatically demoted from inline text to file path pointers so the agent can read them on demand. (Rules inside built-in plugins are exempt).

---

## 4. Authoring Skills (`SKILL.md`) Best Practices

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
- **Golden Authoring Rules**:
  1. **Focused Scope & Clear Triggers**: Never start `description` with `"You are..."` or `"PROACTIVELY..."`. Write third-person descriptions with exact domain keywords and explicit `"Use this skill when"` / `"Do not use this skill when"` boundaries.
  2. **Include Decision Trees**: For complex workflows, include a markdown table or decision tree at the top of `SKILL.md` so the agent routes to the right command or reference file immediately.
  3. **Treat Helper Scripts as Black Boxes**: Instruct the agent to invoke helper CLIs/scripts directly (or run `--help`) rather than reading the script's source code into the context window.
  4. **Local State Hygiene (`.git/info/exclude`)**: If a skill or companion tool creates local scratch/state directories inside a user repository, exclude them via `.git/info/exclude` rather than modifying the project's tracked `.gitignore`.
  5. **Portable Syntax**: Avoid single-vendor macros (such as hardcoded `$ARGUMENTS` or harness-locked tool names without fallback instructions) so the skill works identically across Antigravity, Claude Code, Codex, and OpenCode.

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
  - `/...` (or `C:\...` on Windows): Absolute path.
  - `~/...`: User home directory.
  - Relative path (`tools/agents/skills`): Resolved against the directory containing `.agents/`, falling back to the repository root.

---

## 6. Using Community Skill Vaults Safely

When installing domain skills from community collections (such as `@rmyndharis/antigravity-skills` or `antigravity-awesome-skills`), always install **strategically** (`install <skill>` or `--bundle <bundle>`, never `--all`) to avoid bloating session-start metadata tokens:

```bash
# Search @rmyndharis/antigravity-skills catalog first
npx @rmyndharis/antigravity-skills search <query>

# Install into current workspace's canonical .agents/skills directory
AG_SKILLS_DIR=.agents/skills npx @rmyndharis/antigravity-skills install <skill-name>

# Install into global Antigravity config directory (~/.gemini/config/skills)
npx @rmyndharis/antigravity-skills install <skill-name> --global

# If using antigravity-awesome-skills, override its legacy default path with --path:
npx antigravity-awesome-skills --path ~/.gemini/config/skills
```

---

## 7. Migrating Legacy Workflows (`migrate-workflows`)

Legacy workflow files (`.agents/workflows/*.md`, `_agents/workflows/*.md`, `~/.gemini/config/global_workflows/*.md`, and `workflows.json`) are **deprecated** in favor of Skills (`.agents/skills/<name>/SKILL.md`).
- To migrate: convert each `<name>.md` into `<target_skills_dir>/<name>/SKILL.md` with YAML frontmatter (`name`, `description`), preserve existing `SKILL.md` files without overwriting, and archive old workflow files as `<name>.md.bak`.

---

## 8. Cross-Agent Global Skill Locations & Plugin Caching

To make a skill universally available across all major AI coding agents on a machine, install the skill folder into each agent's global skill discovery directory:

| Agent / Platform | Global Skill Directory Path | Project-Scoped Path |
| :--- | :--- | :--- |
| **Antigravity (App 2.0, `agy` CLI, IDE)** | `~/.gemini/config/skills/<skill-name>/SKILL.md` | `<repo>/.agents/skills/<skill-name>/SKILL.md` |
| **Antigravity IDE (Legacy Fallback)** | `~/.gemini/antigravity/skills/<skill-name>/SKILL.md` | `<repo>/.agent/skills/<skill-name>/SKILL.md` |
| **Claude Code** | `~/.claude/skills/<skill-name>/SKILL.md` | `<repo>/.claude/skills/<skill-name>/SKILL.md` |
| **OpenAI Codex CLI** | `~/.codex/skills/<skill-name>/SKILL.md` | `<repo>/.agents/skills/<skill-name>/SKILL.md` |
| **OpenCode** | `~/.config/opencode/skills/<skill-name>/SKILL.md` | `<repo>/.opencode/skills/<skill-name>/SKILL.md` |

- **Upgrading Cached Plugins Across Harnesses**:
  - Direct directory installations (`~/.gemini/config/skills/`, `~/.claude/skills/`, `~/.codex/skills/`) update immediately on the next session start when files are replaced via `npx --yes --allow-git=all github:qwe840608/agy-skill`.
  - Marketplace/plugin-cached installations in Claude Code (`claude plugin update`) and Codex (`codex plugin marketplace upgrade`) key their cache by the version string in `package.json` / `plugin.json`; bump the version when publishing plugin updates.
