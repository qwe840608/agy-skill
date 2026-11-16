# Antigravity CLI (`agy`) & Headless Agent Orchestration

This reference covers the Antigravity CLI (`agy` v1.5.9: the flag and subcommand lists match `agy --help`, and Section 5 items 1, 3 and 4 were re-tested on Windows 11 on 2026-11-16; the other sections were last checked on v1.5.3) in more depth than `SKILL.md`: flags, subcommands, headless use from external agents (Claude Code, OpenAI Codex, OpenCode, CI pipelines), two ways to split work between host and `agy`, structured JSON/NDJSON output, the Agent Client Protocol (`agy acp`), and troubleshooting. Exact flag text comes from `agy --help`; see `version-snapshot.md` for the verbatim output on this machine.

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
| `--sandbox` | Run in a sandbox with terminal restrictions enabled. Where the OS sandbox is missing, the flag is accepted and the run continues without it; the only sign is a `Terminal sandbox unavailable` warning in the agy log under `~/.gemini/antigravity-cli/log/` (seen with agy 1.5.9 on Windows 11 build 26200, 2026-11-16), so do not treat it as the only guard. |
| `--dangerously-skip-permissions` | Auto-approve all tool permission requests without prompting (since v1.5.2, commands on the system denylist are still blocked). **Not recommended and not needed**: Claude Code's auto mode blocks commands containing it, and the `--settings` allowlist (Section 5.4) achieves the same without granting everything. |
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
   - The host agent frames the assignment, delegates noisy exploration, reviews, or scoped implementation to `agy` workers (`gemini-4-hydrogen-medium` unless the user names a model), waits for completion, and verifies the result before integrating.
   - Why it helps: the exploration tokens land in `agy`'s context instead of the host's, so the host conversation stays small. (No measured savings are claimed here; measure on your own workload.)
2. **`Brain` Mode (`agy` Proposes, Host Challenges & Verifies)**:
   - Hand the original goal, verbatim constraints, settled decisions, and known facts to **`gemini-4-hydrogen-medium`** (or the model the user names) without pre-biasing the solution.
   - `agy` acts as an independent second-model reasoning lead and proposes the architectural route.
   - The host checks consequential assumptions against workspace evidence. If a premise fails, continue the conversation (`--conversation <id>`) with the counterexample and its source.

### B. The 5 Specialist Personas & Contracts

These five "personas" are conventions of this skill, not `agy` features: they are prompt shapes that have worked well. Use `gemini-4-hydrogen-medium` for all of them unless the user names a model. Shape the brief around one of them:

| Persona | Contract & Prompt Guardrails |
| :--- | :--- |
| **`ask`** | **Zero-tool synchronous Q&A & smoke test.** Answers in one call without running tools; says "not sure" rather than guessing. |
| **`staffer`** | **General-purpose worker & native tool router.** Minimal framing; also used to invoke Antigravity-native tools like **`generate_image`** (e.g., `"Generate a 1024x1024 pixel-art mascot and save it as assets/mascot.png"`). |
| **`researcher`** | **Evidence-backed survey.** Every non-obvious claim must cite `file:line` or URL sources; observation is strictly separated from inference; ends with an explicit "Unverified / Remaining Uncertainties" section. Tracked files stay untouched. |
| **`reviewer`** | **Independent verifier (2 flavors)**:<br>1. *Code Review*: Gather evidence via `git diff` / `gh pr view`; report severity-ranked findings with exact `file:line`, failure mode, and fix.<br>2. *Plan/Design Review*: Multi-angle challenge of assumptions, edge cases, and failure modes. Tracked files stay untouched. |
| **`implementer`** | **Scoped code change + verification.** Produces a minimal diff matching codebase conventions and runs tests/typecheck before finishing. Leaves changes uncommitted in the working tree unless Git delivery is explicitly requested. |

### C. Writing High-Signal Briefs & Avoiding the 200KB Arg Limit

- **Pass Large Inputs by Reference**: Command-line prompt arguments have a ~200KB OS/CLI limit. Never inline huge diffs or entire files into `-p "..."`. Instead, tell `agy` which PR (`Review PR #730`), branch (`git diff main...HEAD`), patch file (`/tmp/change.patch`), or file paths to read with its own tools.
- **Pass User Constraints Verbatim**: Copy user prohibitions word-for-word into the brief. Default-deny irreversible or costly actions (commits, pushes, history rewrites, deleting untracked user files, paid external API calls) unless the user explicitly requested them.
- **Dirty Workspace Awareness**: If dispatching an `implementer` job into a repository that already has uncommitted user changes, capture `git status --porcelain` first and list those pre-existing modified paths in the prompt so `agy` treats them as user-owned work and never overwrites or resets them.
- **Prefer Fan-Out Over Monoliths**: Instead of one giant multi-part audit that runs for 25 minutes, launch 2–4 narrow read-only jobs in parallel (e.g., one for security, one for performance, one for dependency drift) and synthesize their reports.

---

## 5. Production Troubleshooting & Edge Cases

### 1. Job Hangs Forever with 0% CPU and Empty Log
- **Cause A (Open `stdin` Pipe)**: `agy` has waited indefinitely on open `stdin` pipes in non-interactive shells. Not reproduced on agy 1.5.9 (2026-11-16, Git Bash on Windows 11: with stdin held open by a pipe for 60 s the run finished in 6 s), so on newer versions check Cause B first.
  - **Fix**: Always append `</dev/null` (POSIX) or run via `cmd /c '... < NUL'` (Windows PowerShell).
- **Cause B (Permission Auto-Denial)**: In `-p` mode, a tool call that needs approval and is not covered by `permissions.allow` is auto-denied and the run ends with `no output produced` on stderr and an empty stdout (exit code may still be 0; it was 0 in every denied run on agy 1.5.9, 2026-11-16).
  - **Fix**: Pass `--settings` with `"toolPermission": "request-review"` and narrow allow rules (see Subsection 4), and tell agy not to run terminal commands unless a `command(...)` rule allows them. Avoid `--dangerously-skip-permissions`; Claude Code blocks it.
- **Note on Output Buffering**: In plain `text` print mode (`-p`), `agy` buffers most output until the turn finishes. A silent log for 5–10 minutes while CPU/child processes are active is normal. Use `--output-format stream-json` if you need live step-by-step event streaming.

### 2. `operation not permitted` on `~/.gemini/...` or `bind: operation not permitted`
- **Cause**: The host agent (e.g., Codex or a sandboxed runner) launched `agy` inside the host's own restrictive command sandbox. `agy` requires read/write access to `~/.gemini/` (for OAuth tokens and state) and must bind a local loopback port for its Language Server.
- **Fix**: Run `agy` **unsandboxed on the host side** (e.g., request escalated permissions in Codex), and collect job status from the same unsandboxed context so PIDs remain visible. Let `agy --sandbox` handle inner terminal sandboxing.

### 3. `agy -p` Runs in `~/.gemini/antigravity-cli/scratch` Instead of the Repo
- **Cause**: In headless print mode, inherited shell `cwd` alone does not always attach the workspace.
- **Fix**: Always pass `--add-dir "<absolute-repo-path>"` on every invocation, including `--continue` / `--conversation` follow-ups.
- **Start directory is a workspace too (agy 1.5.9, tested 2026-11-16)**: the directory `agy` was started from was attached as a workspace in every run (the agy log lists it first in `workspaceDirs`), and a run without `--add-dir` started inside the folder saw its files. That directory was then readable in `plan` mode and writable in `accept-edits` mode with no allow rule, so start `agy` from inside the working folder, not from a repo you do not mean to expose.

### 4. Least-Privilege Headless Mode Without `--dangerously-skip-permissions` (Safe for Claude Code Auto Mode)
- **Why**: Claude Code's auto mode safety classifier blocks commands containing `--dangerously-skip-permissions` (reported as creating an unsafe agent). Independently, in `-p` mode any tool call that would need interactive confirmation is **auto-denied** with a stderr notice naming the allow-rule you would need (observed on agy v1.5.3, 2026-11-09, and again on v1.5.9, 2026-11-16, for `command`, `read_file` and `write_file`; the `agy changelog` entry for 1.5.2 describes the same behaviour for enterprise-reviewed tools). The v1.5.9 notice reads: `jetski: no output produced — a tool required the "command" permission that headless mode cannot prompt for, so it was auto-denied. Add an allow-rule under permissions.allow in settings.json (e.g. command(<target>)). Alternatively, re-run with --dangerously-skip-permissions to auto-approve all tools.` Do not follow its last sentence; add the narrow allow rule instead.
- **Always pass `--mode`**: since agy 1.5.7 a run without `--mode` starts in `auto` where Auto mode is available (`agy changelog`). On the Windows 11 test machine (agy 1.5.9, 2026-11-16) the agy log showed `auto mode is unavailable because the terminal sandbox is unavailable, falling back to default`, and an unlisted command was still auto-denied; behaviour on a machine where Auto mode is available was not tested.
- **How `agy` Evaluates Permissions**:
  - `toolPermission` in `settings.json` / `--settings` accepts `"request-review"` (default, checks allow/deny rules and execution mode) or `"always-proceed"`.
  - Under `"toolPermission": "request-review"`, `agy` evaluates `permissions.deny` → `permissions.allow` using 8 validated rule prefixes (`^(command|read_file|write_file|read_url|mcp|execute_url|download_url|unsandboxed)\s*\(.*\)$`):
    - `command(<command>)` — e.g., `command(git status)`. On Windows (PowerShell/cmd) the rule must equal the whole command since agy 1.5.8 (`agy changelog`). Tested on agy 1.5.9 (2026-11-16): `command(git --version)` allowed `git --version`; `command(git)` did not, and `command(git --version)` did not allow `git --version --build-options`. Prefix matching on POSIX shells was not re-tested.
    - `read_file(<absolute_path>)` / `write_file(<absolute_path>)` — e.g., `write_file(C:/work/project)`
    - `mcp(<server>/<tool_or_*>)` — e.g., `mcp(chrome_devtools/*)` or `mcp(chrome_devtools/take_screenshot)`
    - `read_url(<domain>)` / `execute_url(<domain>)` / `download_url(<domain>)` — e.g., `execute_url(www.youtube.com)`
    - `unsandboxed(<command>)`
  - Passing `--mode accept-edits` with `--add-dir <dir>` automatically approves `write_file` and `edit_file` inside the workspace directory without needing `--dangerously-skip-permissions` (re-tested on agy 1.5.9, 2026-11-16: the write succeeded with no `write_file` rule).
  - **What the allowlist did not stop (agy 1.5.9, Windows 11, 2026-11-16)**: with only `read_file(<dir>)` / `write_file(<dir>)` allowed, reads and writes in a sibling folder and outside the home folder, and a read elsewhere under `AppData/Local`, were auto-denied, but two places were open with no rule: the directory `agy` was started from (see item 3) and the OS temp folder (`%TEMP%`; a folder under it was readable in `plan` mode and writable in `accept-edits` and default mode, even with `"allowNonWorkspaceAccess": false` in `--settings`). A `permissions.deny` entry `write_file(<folder>)` did block a write to that temp folder.

### 5. Browser Tasks (`agy -p "/browser ..."`, Google Chrome Only)
- `/browser` invokes the built-in `browser` subagent, which mounts the `chrome_devtools` MCP (`list_pages`, `new_page`, `navigate_page`, `take_snapshot`, `take_screenshot` with `filePath`, `click`, `fill`, `type_text`, `press_key`, `wait_for`, `evaluate_script`, ...).
- agy starts `chrome-devtools-mcp` with `--autoConnect`, which reads `DevToolsActivePort` from Chrome's default `User Data` folder, so it attaches to the user's running Chrome and its signed-in profile.
- Prerequisite (user action): enable remote debugging at `chrome://inspect/#remote-debugging`. Without it the run fails with a missing `DevToolsActivePort` error.
- Use the settings in SKILL.md Section 2. Do not allow `evaluate_script` or `mcp(chrome_devtools/*)` unless the task needs it.
- **`permissions.allow` does not confine the browser subagent (agy 1.5.9 + Chrome 157, Windows 11, tested 2026-11-16)**: with an allow list that left them out, `take_screenshot` and `click` still ran, and a page on a domain with no `execute_url`/`read_url` rule opened. This fits the agy 1.5.8 changelog, which says the browser tools now follow `mcp(server/tool)` deny or ask rules.
- **`permissions.deny` works for tools, not for sites**: with `mcp(chrome_devtools/click)` denied, the click was refused and the subagent reported it and stopped. `execute_url(...)` and `read_url(...)` deny rules for a domain did not stop the browser from opening it, so there is no tested way to limit which sites the browser opens. Only `click` was tested as a denied tool.
- **A refused `evaluate_script` ends the run silently**: with no rule for it, the subagent's call was refused and the whole run stopped with exit code 0, an empty stderr, and a stdout that only said it was waiting for the subagent (all three runs without the instruction below stopped this way). With `--output-format json`, used in one of them, the result has `"status":"SUCCESS"` and lists the tool under `denied_actions` (`McpChromeDevtoolsEvaluateScript`). Adding "Read page content with take_snapshot only; never call evaluate_script" to the prompt avoided the call.
- **Chrome may ask the user to approve the connection**: an `Allow remote debugging?` dialog. In two runs where nobody clicked it, agy gave up after 3 to 4.5 minutes with exit code 0 and an empty stderr; stdout carried agy's own explanation.
- **Recording**: agy 1.5.9 saves a `recording.mp4` of each browser session under `~/.gemini/antigravity-cli/brain/<session id>/`.
- These browser results come from one machine whose global agy permission preset was Turbo; each run set `toolPermission` to `request-review` through `--settings`. They were not repeated on a machine with stricter global settings.
- Edge and isolated profiles would need global `chrome-devtools-mcp` config changes; not supported by this skill.

### 6. Native Stream-JSON Diagnostics (`finished_reason` & `AGY_ERROR`)
- When using `--output-format stream-json` or `json`:
  - `agy` v1.4.11+ emits `finished_reason` (`print_timeout`, `interrupted`, `error`).
  - `agy` v1.2.6+ emits structured `AGY_ERROR` records containing `status`, `error_code`, `code_kind`, `retryable`, and `error_id`.
  - If `agy` outputs partial response text before hitting `print_timeout`, preserve the partial response and resume the conversation via `--conversation <id>` with a higher `--print-timeout`.

### 7. Wait vs. Poll (Preventing Host Context Explosion)
- Never poll a background `agy` process in a tight sleep loop from Codex or Claude Code: every poll wake-up is another model turn that re-reads the whole host conversation, so the cost grows with the number of polls.
- Instead, use the host's background-completion notification, or a single blocking run with `--print-timeout` set to the longest acceptable wait (`10m`–`15m`).

---

## 6. Interactive TUI Slash Commands & Environment Variables

### TUI Slash Commands
- **Exit**: `Ctrl+D Ctrl+D`, `/exit`, or `/quit`.
- **Commands**: `/help`, `/model`, `/agents` (shows subagent models/efforts), `/skills` & `/skills reload`, `/plugin`, `/context`, `/resume` (`Ctrl+Delete` to delete session), `/diff`, `/usage`, `/quota`, `/statusline`, `/settings`, `/compact`.

### Environment Variables
- `AGY_ACCOUNT=<account-name>`: Select a specific connected account for multi-account plugins.
- `AGY_CLI_MAC_OPTION_AS_ALT=0`: Revert macOS Option-key shortcut behavior if needed.
- `AGY_CLI_HIDE_ACCOUNT_INFO=1`: Hide email and plan tier from the CLI header.
- `PLUGIN_ROOT` & `PLUGIN_DATA`: Injected by `agy` into plugin hook commands (v1.5.3+).

Variables read by this skill's installer (`bin/cli.mjs`), not by `agy`:
- `AGY_BIN=<path>`: Explicit path to the `agy` binary when it is not on `PATH`.
- `AGY_SKILL_LANG=<zh|en|both>`: Force the installed description language.
- `AG_SKILLS_DIR=<path>`: Custom target skills directory (same as `--dir`).
