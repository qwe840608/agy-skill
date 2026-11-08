# Antigravity CLI (`agy`) & Headless Agent Orchestration

This reference covers the full capabilities of the Antigravity CLI (`agy` v1.5.3+), including interactive TUI usage, headless execution for external agents (Claude Code, Codex, OpenCode, CI/CD pipelines), structured JSON/NDJSON streaming, the Agent Client Protocol (`agy acp`), and CLI configuration.

---

## 1. Command-Line Flags Reference

Run `agy [flags]` to start an interactive session or execute a non-interactive turn.

### Core Execution & Print Mode Flags

| Flag | Short | Description |
| :--- | :--- | :--- |
| `--print <prompt>` | `-p` | Run a single prompt non-interactively and print the response to stdout. Alias: `--prompt`. |
| `--prompt-interactive <prompt>` | `-i` | Run an initial prompt interactively and remain in the TUI session. |
| `--print-timeout <duration>` | | Optional time limit for print mode (e.g., `5m`, `120s`); `0s` (default) waits until the turn completes. |
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
| `--add-dir <path>` | | Add an extra directory to the workspace context (repeatable). |
| `--project <id-or-name>` | | Project ID or project name for the current CLI session. |
| `--new-project` | | Create a new project for this session. |
| `--remote-agent` | | Run conversations using remote cloud agents (`--project` names a remote project). |
| `--remote-control` | | Create a remote connection for the CLI session on startup. |

### Security, Sandbox & Ephemeral Settings Flags

| Flag | Description |
| :--- | :--- |
| `--sandbox` | Run in a sandbox with terminal restrictions enabled. |
| `--dangerously-skip-permissions` | Auto-approve all tool permission requests without prompting. Use with caution (preferably inside containers/VMs or with `--sandbox`). |
| `--settings <json-or-path>` | Ephemeral settings for this session only (never saved to disk): pass an inline JSON object of `settings.json` keys or a file path. |
| `--log-file <path>` | Override the CLI log file path. |

---

## 2. Subcommands Reference

### `agy models` & `agy agents`
- `agy models`: Lists all available model IDs and human-readable names (e.g., `gemini-4-argon-high`, `gemini-3.8-flash-high`, `claude-opus-5-5-high`, `claude-sonnet-5-5-high`, `gpt-oss-120b-medium`).
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
- Key flags:
  - `--stdio`: Use stdio JSON-RPC transport (default).
  - `--process-per-session`: Serve each session from an isolated worker process.
  - `--ide-mcp-port <port>`: Port for host IDE tools MCP server (requires `nc` in `$PATH`).
  - `--add-dir <dir>`, `--agent <name>`, `--sandbox`, `--dangerously-skip-permissions`.
  - `--login`: Log in with Google interactively, then exit (ACP terminal auth).
  - `--include-default-customizations`: Include default customizations (default `true`).

### `agy remote-control <subcommand>` & `agy mic-serve`
- `agy remote-control start | status | stop`: Register, inspect, or stop the background remote-control daemon.
- `agy mic-serve [--addr 127.0.0.1:4713]`: Serve the local machine's microphone to an `agy` CLI session on another host over loopback/SSH port-forwarding.

### Maintenance Subcommands
- `agy changelog`: Print full release notes and version history directly in the terminal.
- `agy update`: Self-update the `agy` CLI binary to the latest release.
- `agy install [--dir <path>] [--skip-aliases] [--skip-path]`: Configure environment `PATH` and shell profile settings.

---

## 3. Interactive TUI Slash Commands & Shortcuts

When running `agy` interactively:
- **Exit**: Press `Ctrl+D` twice (`Ctrl+D Ctrl+D`), or type `/exit` or `/quit`.
- **Core TUI Slash Commands**:
  - `/help`: View all slash commands and keyboard shortcuts (supports `PageUp`/`PageDown` scrolling across Commands and Shortcuts tabs).
  - `/model`: Switch the active model and reasoning effort.
  - `/agents`: View active and available subagents (shows each subagent's model and effort; press `Enter` on a subagent to view details).
  - `/skills` & `/skills reload`: List loaded workspace, global, and remote-agent plugin skills, or reload skill discovery.
  - `/plugin`: Open the interactive plugin manager and sign-in screen.
  - `/context`: Inspect files and context budget currently loaded in the session.
  - `/resume`: Browse, search, resume, or delete (`Ctrl+Delete`) previous sessions.
  - `/diff`: Inspect Git diffs and commit trees cleanly.
  - `/usage` & `/quota`: Force a real-time reload of model configuration and remaining token/request quotas.
  - `/statusline [help|enable|disable|reset|delete]`: Manage custom terminal statusline integrations.
  - `/settings`: Configure theme (`terminal` default), queued-messages mode (`Send Immediately` vs queue), and CLI preferences.
  - `/compact`: Summarize and compact conversation history to free context window space.

---

## 4. Orchestrating `agy` from Claude Code, Codex, or OpenCode

External agents can use `agy` as a high-powered specialized subagent (e.g., to leverage Gemini 4 Argon's large context window or Antigravity's built-in skills/plugins):

### Pattern A: One-Shot Structured Query (`--output-format json` + `--json-schema`)
```bash
agy -p "Audit package.json dependencies and identify outdated or risky packages" \
  --mode plan \
  --output-format json \
  --json-schema '{"type":"object","properties":{"issues":{"type":"array","items":{"type":"object","properties":{"pkg":{"type":"string"},"reason":{"type":"string"}},"required":["pkg","reason"]}}},"required":["issues"]}'
```

### Pattern B: Multi-Turn Streaming via NDJSON (`stream-json`)
For persistent multi-turn orchestration without respawning processes, pipe NDJSON lines into `agy -p --input-format stream-json --output-format stream-json`. Each line sent to `stdin` triggers a turn and streams structured event objects on `stdout`.

### Pattern C: Sandboxed Code Modification
```bash
agy -p "Refactor the database connection pool in src/db.ts to support retries" \
  --mode accept-edits \
  --sandbox \
  --effort high
```

---

## 5. CLI Configuration & Environment Variables

- **Settings File**: `~/.gemini/antigravity-cli/settings.json`
  - Can be overridden per-session without touching disk using `agy --settings '{"key":"value"}'`.
- **Important Environment Variables**:
  - `AGY_ACCOUNT=<account-name>`: Select a specific connected account when a plugin auth provider has multiple accounts connected.
  - `AGY_CLI_MAC_OPTION_AS_ALT=0`: Revert macOS Option-key shortcut behavior if needed (since v1.5.2, Option-key shortcuts like `alt+m` work out of the box).
  - `AGY_CLI_HIDE_ACCOUNT_INFO=1`: Hide email and plan tier from the CLI header.
  - `AG_SKILLS_DIR=<path>`: Used by `@rmyndharis/antigravity-skills` CLI to target `.agents/skills` or `~/.gemini/config/skills`.
  - `PLUGIN_ROOT` & `PLUGIN_DATA`: Automatically injected into hook commands originating from a plugin (added in v1.5.3), pointing to the plugin's installation folder and its persistent data directory.
