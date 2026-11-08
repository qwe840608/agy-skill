# Antigravity CLI (`agy`) & Headless Agent Orchestration

This reference covers the full capabilities of the Antigravity CLI (`agy` v1.5.3+), including interactive TUI usage, battle-tested headless orchestration for external agents (Claude Code, OpenAI Codex, OpenCode, Pi, CI/CD pipelines), `Lead` vs. `Brain` orchestration architectures, structured JSON/NDJSON streaming, the Agent Client Protocol (`agy acp`), and production troubleshooting.

---

## 1. Installing & Resolving the `agy` Binary

### One-Line Official CLI Install
- **macOS / Linux**:
  ```bash
  curl -fsSL https://antigravity.google/cli/install.sh | bash
  ```
- **Windows (PowerShell)**:
  ```powershell
  irm https://antigravity.google/cli/install.ps1 | iex
  ```
- **First-Time Sign-In**: Run `agy` interactively once in a user terminal to complete the browser-based Google OAuth sign-in.

### Binary Fallback Resolution
If a tool-spawned subshell does not inherit an updated `PATH`:
- **Windows**: `%LOCALAPPDATA%\agy\bin\agy.exe` (or `"$LOCALAPPDATA/agy/bin/agy.exe"` in Git Bash)
- **macOS / Linux**: `~/.local/bin/agy` or `which agy`

---

## 2. Command-Line Flags Reference

Run `agy [flags]` to start an interactive session or execute a non-interactive turn.

### Core Execution & Print Mode Flags

| Flag | Short | Description |
| :--- | :--- | :--- |
| `--print <prompt>` | `-p` | Run a single prompt non-interactively and print the response to stdout. Alias: `--prompt`. |
| `--prompt-interactive <prompt>` | `-i` | Run an initial prompt interactively and remain in the TUI session. |
| `--print-timeout <duration>` | | Time limit for print mode (e.g., `60s`, `10m`, `60m`); `0s` (default) waits until the turn completes. |
| `--input-format <fmt>` | | Input format for print mode: `text` (default) or `stream-json`. `stream-json` reads one NDJSON message per line from stdin and runs a turn for each; requires `--output-format stream-json`. |
| `--output-format <fmt>` | | Output format for print mode: `text` (default), `json`, or `stream-json`. |
| `--json-schema <schema>` | | Optional inline JSON Schema string or file path to enforce structured output (for `stream-json`, applies to the final result). |
| `--disable-slash-commands` | | Disable slash command and skill expansion in print mode (`-p`). |

### Model, Reasoning Effort & Execution Mode Flags

| Flag | Values / Syntax | Description |
| :--- | :--- | :--- |
| `--model <model-id>` | e.g., `gemini-4-argon-high` | Override the model for the current CLI session. Run `agy models` to list valid IDs. |
| `--effort <level>` | `low` \| `medium` \| `high` \| `xhigh` \| `max` | Set the reasoning/thinking effort for the current session. |
| `--mode <mode>` | `accept-edits` \| `auto` \| `plan` | Set the agent execution mode:<br>- `plan`: Read-only analysis and step-by-step planning.<br>- `accept-edits`: Auto-accept file edits, prompt for terminal commands.<br>- `auto`: Autonomous execution across edits and approved tools. |
| `--agent <agent-name>` | string | Specify a custom or plugin-provided agent persona for the session. |

### Conversation, Workspace & Project Flags

| Flag | Short | Description |
| :--- | :--- | :--- |
| `--continue` | `-c` | Continue the most recent conversation in the workspace/project. |
| `--conversation <id>` | | Resume a specific previous conversation by its UUID. |
| `--add-dir <path>` | | Add an extra directory to the workspace context (repeatable). **Always pass `--add-dir <repoRoot>` in headless `-p` mode.** |
| `--project <id-or-name>` | | Project ID or project name for the current CLI session. |
| `--new-project` | | Create a new project for this session. |
| `--remote-agent` | | Run conversations using remote cloud agents (`--project` names a remote project). |
| `--remote-control` | | Create a remote connection for the CLI session on startup. |

### Security, Sandbox & Ephemeral Settings Flags

| Flag | Description |
| :--- | :--- |
| `--sandbox` | Run in a sandbox with terminal restrictions enabled. |
| `--dangerously-skip-permissions` | Auto-approve all tool permission requests without prompting. Required in `-p` mode when tools are used unless global allowlists are pre-configured. |
| `--settings <json-or-path>` | Ephemeral settings for this session only (never saved to disk): pass an inline JSON object of `settings.json` keys or a file path. |
| `--log-file <path>` | Override the CLI log file path. |

---

## 3. Subcommands Reference

### `agy models` & `agy agents`
- `agy models`: Lists all available model IDs and human-readable names (e.g., `gemini-4-argon-high`, `gemini-4-argon-medium`, `gemini-3.8-flash-high`, `gemini-3.8-flash-medium`, `gemini-3.8-flash-low`, `claude-opus-5-5-high`, `claude-sonnet-5-5-high`, `gpt-oss-120b-medium`).
- `agy agent` / `agy agents`: Lists available specialized agents discovered from workspace/global configs and enabled plugins.

### `agy mcp <subcommand>`
Manage Model Context Protocol (MCP) servers from the terminal:
- `agy mcp list`: List all configured MCP servers.
- `agy mcp add <name> ...`: Add or update an MCP server configuration (run `agy mcp add --help` for stdio vs HTTP flags).
- `agy mcp remove <name>`: Remove an MCP server configuration.
- `agy mcp enable <name>` / `agy mcp disable <name>`: Toggle an MCP server on or off.

### `agy plugin <subcommand>` (Alias: `agy plugins`)
Manage Antigravity plugins from the CLI:
- `agy plugin list [--json]`: List installed plugins (including symlinked plugins as of v1.5.3).
- `agy plugin validate [path] [--strict] [--json]`: Validate a plugin's `plugin.json` manifest (supports `category` field as of v1.5.3) and directory structure.
- `agy plugin install <target>`: Install a plugin from a local directory path or `plugin[@marketplace]`.
- `agy plugin import [source]`: Import plugins/extensions from `gemini` (`gemini-extension.json`) or `claude` (`.claude-plugin/plugin.json`), automatically staging `hooks/hooks.json` to root `hooks.json`.
- `agy plugin enable <name>` / `agy plugin disable <name>`: Enable or disable an installed plugin (updates `~/.gemini/config/config.json`).
- `agy plugin uninstall <name>`: Uninstall a user/marketplace plugin.
- `agy plugin link <mp> <target>`: Generate a link to a marketplace.

### `agy acp [flags]` (Agent Client Protocol Server)
Starts the **Agent Client Protocol (ACP)** server over stdio (`--stdio`, default) so external IDEs, editors, or multi-agent orchestrators can drive Antigravity over JSON-RPC:
- **Key CLI Flags**:
  - `--stdio`: Use stdio JSON-RPC transport (default).
  - `--process-per-session`: Serve each session from an isolated worker process.
  - `--ide-mcp-port <port>`: Port for host IDE tools MCP server (requires `nc` in `$PATH`).
  - `--add-dir <dir>`, `--agent <name>`, `--sandbox`, `--dangerously-skip-permissions`.
  - `--login`: Log in with Google interactively, then exit (ACP terminal auth).
  - `--include-default-customizations`: Include default customizations (default `true`).
- **ACP Protocol Lifecycle**:
  - `initialize`: Advertises capabilities (`loadSession`, `additionalDirectories`, `list`/`delete`/`resume`/`close`, `embeddedContext`).
  - `session/new`: Accepts `cwd` and `additionalDirectories`; returns session config options (modes & models).
  - `session/set_config_option`: Persists model and mode selection per session.
  - `session/load` & `session/resume`: Replays full conversation history from `agy`'s append-only SQLite DB / transcript and emits `available_commands_update` → `config_option_update`.
- **Terms of Service & Auth Note**: When integrating third-party editors or non-Google harnesses, review Google's Antigravity Terms of Service regarding third-party OAuth usage; for commercial/automated third-party bridges, authenticate via Vertex AI or Google AI Studio API keys where applicable.

### `agy remote-control <subcommand>` & `agy mic-serve`
- `agy remote-control start | status | stop`: Register, inspect, or stop the background remote-control daemon.
- `agy mic-serve [--addr 127.0.0.1:4713]`: Serve the local machine's microphone to an `agy` CLI session on another host over loopback/SSH port-forwarding.

### Maintenance Subcommands
- `agy changelog`: Print full release notes and version history directly in the terminal.
- `agy update`: Self-update the `agy` CLI binary to the latest release.
- `agy install [--dir <path>] [--skip-aliases] [--skip-path]`: Configure environment `PATH` and shell profile settings.

---

## 4. Cross-Agent Orchestration Playbook (Claude Code, Codex, OpenCode)

When a host agent (Claude Code, OpenAI Codex, OpenCode, Pi) delegates work to `agy`, treat `agy` as an external contractor: **it only sees the brief you pass and the workspace directory you attach, not your intervening conversation.**

### A. Two Orchestration Modes (`Lead` vs. `Brain`)

1. **`Lead` Mode (Host Directs, `agy` Executes)**:
   - The host agent frames the assignment, delegates noisy exploration, reviews, or scoped implementation to fast `gemini-3.8-flash-medium` / `gemini-3.8-flash-high` workers, waits for completion, and verifies the result before integrating.
   - **Benchmark Insight**: Delegating deep codebase/web research (`DeepSearch`) reduces host token spend by **39% on Claude Code** and **16% on Codex**.
2. **`Brain` Mode (`agy` Argon Proposes, Host Challenges & Verifies)**:
   - Hand the original goal, verbatim constraints, settled decisions, and known facts to **`gemini-4-argon-medium` or `gemini-4-argon-high`** without pre-biasing the solution.
   - Argon acts as an independent second-model reasoning lead and proposes the architectural route.
   - The host checks consequential assumptions against workspace evidence. If a premise fails, continue the conversation (`--conversation <id>`) with the counterexample and its source.

### B. The 5 Specialist Personas & Contracts

When crafting a prompt for `agy -p`, shape the brief around one of these five proven contracts:

| Persona | Default Model | Contract & Prompt Guardrails |
| :--- | :--- | :--- |
| **`ask`** | `gemini-3.8-flash-low` | **Zero-tool synchronous Q&A & smoke test.** Answers in one call without running tools; says "not sure" rather than guessing. |
| **`staffer`** | `gemini-3.8-flash-medium` | **General-purpose worker & native tool router.** Minimal framing; also used to invoke Antigravity-native tools like **`generate_image`** (e.g., `"Generate a 1024x1024 pixel-art mascot and save it as assets/mascot.png"`). |
| **`researcher`** | `gemini-3.8-flash-high` | **Evidence-backed survey.** Every non-obvious claim must cite `file:line` or URL sources; observation is strictly separated from inference; ends with an explicit "Unverified / Remaining Uncertainties" section. Tracked files stay untouched. |
| **`reviewer`** | `gemini-3.8-flash-medium` | **Independent verifier (2 flavors)**:<br>1. *Code Review*: Gather evidence via `git diff` / `gh pr view`; report severity-ranked findings with exact `file:line`, failure mode, and fix.<br>2. *Plan/Design Review*: Multi-angle challenge of assumptions, edge cases, and failure modes. Tracked files stay untouched. |
| **`implementer`** | `gemini-3.8-flash-high` | **Scoped code change + verification.** Produces a minimal diff matching codebase conventions and runs tests/typecheck before finishing. Leaves changes uncommitted in the working tree unless Git delivery is explicitly requested. |

### C. Writing High-Signal Briefs & Avoiding the 200KB Arg Limit

- **Pass Large Inputs by Reference**: Command-line prompt arguments have a ~200KB OS/CLI limit. Never inline huge diffs or entire files into `-p "..."`. Instead, tell `agy` which PR (`Review PR #730`), branch (`git diff main...HEAD`), patch file (`/tmp/change.patch`), or file paths to read with its own tools.
- **Pass User Constraints Verbatim**: Copy user prohibitions word-for-word into the brief. Default-deny irreversible or costly actions (commits, pushes, history rewrites, deleting untracked user files, paid external API calls) unless the user explicitly requested them.
- **Dirty Workspace Awareness**: If dispatching an `implementer` job into a repository that already has uncommitted user changes, capture `git status --porcelain` first and list those pre-existing modified paths in the prompt so `agy` treats them as user-owned work and never overwrites or resets them.
- **Prefer Fan-Out Over Monoliths**: Instead of one giant multi-part audit that runs for 25 minutes, launch 2–4 narrow read-only jobs in parallel (e.g., one for security, one for performance, one for dependency drift) and synthesize their reports.

---

## 5. Production Troubleshooting & Edge Cases

### 1. Job Hangs Forever with 0% CPU and Empty Log
- **Cause A (Open `stdin` Pipe)**: `agy` waits indefinitely on open `stdin` pipes in non-interactive shells.
  - **Fix**: Always append `</dev/null` (POSIX) or run via `cmd /c '... < NUL'` (Windows PowerShell).
- **Cause B (Permission Prompt Freeze)**: Without `--dangerously-skip-permissions`, `agy`'s default `request-review` policy pauses on the first tool call waiting for interactive approval.
  - **Fix**: Pass `--dangerously-skip-permissions` (with `--sandbox` for read-only jobs), or configure allow/deny rules in `~/.gemini/antigravity-cli/settings.json`.
- **Note on Output Buffering**: In plain `text` print mode (`-p`), `agy` buffers most output until the turn finishes. A silent log for 5–10 minutes while CPU/child processes are active is normal. Use `--output-format stream-json` if you need live step-by-step event streaming.

### 2. `operation not permitted` on `~/.gemini/...` or `bind: operation not permitted`
- **Cause**: The host agent (e.g., Codex or a sandboxed runner) launched `agy` inside the host's own restrictive command sandbox. `agy` requires read/write access to `~/.gemini/` (for OAuth tokens and state) and must bind a local loopback port for its Language Server.
- **Fix**: Run `agy` **unsandboxed on the host side** (e.g., request escalated permissions in Codex), and collect job status from the same unsandboxed context so PIDs remain visible. Let `agy --sandbox` handle inner terminal sandboxing.

### 3. `agy -p` Runs in `~/.gemini/antigravity-cli/scratch` Instead of the Repo
- **Cause**: In headless print mode, inherited shell `cwd` alone does not always attach the workspace.
- **Fix**: Always pass `--add-dir "<absolute-repo-path>"` on every invocation, including `--continue` / `--conversation` follow-ups.

### 4. Restricted Mode Hardening (`~/.gemini/antigravity-cli/settings.json`)
- If you cannot use `--dangerously-skip-permissions`, `agy` evaluates permissions in order: **`deny` → `ask` → `allow`**.
- For restricted read-only evidence gathering, configure global allow rules in `~/.gemini/antigravity-cli/settings.json` for `command(git)`, `command(gh)`, and read utilities (`cat`, `head`, `ls`, `grep`, `find`, `rg`, `wc`), paired with targeted `deny` rules for `command(git push)`, `command(git reset --hard)`, `command(git clean)`, `command(gh pr merge)`, and `command(gh release delete)`. (Note: `search_web` works headlessly without an explicit allow rule.)

### 5. Native Stream-JSON Diagnostics (`finished_reason` & `AGY_ERROR`)
- When using `--output-format stream-json` or `json`:
  - `agy` v1.4.11+ emits `finished_reason` (`print_timeout`, `interrupted`, `error`).
  - `agy` v1.2.6+ emits structured `AGY_ERROR` records containing `status`, `error_code`, `code_kind`, `retryable`, and `error_id`.
  - If `agy` outputs partial response text before hitting `print_timeout`, preserve the partial response and resume the conversation via `--conversation <id>` with a higher `--print-timeout`.

### 6. Wait vs. Poll (Preventing Host Context Explosion)
- Never poll a background `agy` process in a tight sleep loop from Codex or Claude Code—every poll wake-up replays the entire host conversation context and inflates token costs (up to +86% on SWE-bench in Codex).
- Instead, use background completion notifications or a single long blocking wait (`10m`–`15m`).

---

## 6. Interactive TUI Slash Commands & Environment Variables

### TUI Slash Commands
- **Exit**: `Ctrl+D Ctrl+D`, `/exit`, or `/quit`.
- **Commands**: `/help`, `/model`, `/agents` (shows subagent models/efforts), `/skills` & `/skills reload`, `/plugin`, `/context`, `/resume` (`Ctrl+Delete` to delete session), `/diff`, `/usage`, `/quota`, `/statusline`, `/settings`, `/compact`.

### Environment Variables
- `AGY_ACCOUNT=<account-name>`: Select a specific connected account for multi-account plugins.
- `AGY_CLI_MAC_OPTION_AS_ALT=0`: Revert macOS Option-key shortcut behavior if needed.
- `AGY_CLI_HIDE_ACCOUNT_INFO=1`: Hide email and plan tier from the CLI header.
- `AG_SKILLS_DIR=<path>`: Override target skills directory for skill installers.
- `PLUGIN_ROOT` & `PLUGIN_DATA`: Injected into plugin hook commands (v1.5.3+).
