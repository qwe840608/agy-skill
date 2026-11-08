# Lifecycle Hooks, Plugins & MCP Servers Reference

This reference provides the exact schemas, contracts, and guardrails for authoring and managing **Lifecycle Hooks (`hooks.json`)**, **Plugins (`plugin.json`)**, and **MCP Servers (`mcp_config.json`)** in Antigravity (updated for `agy` v1.5.3).

---

## 1. Lifecycle Hooks (`hooks.json`)

Hooks execute synchronous shell commands (`sh -c` on Unix, `cmd /c` on Windows) at specific points in the agent loop.
- **Locations**: `.agents/hooks.json` (workspace), `~/.gemini/config/hooks.json` (global), or `plugins/<plugin-name>/hooks.json` (plugin root).
- **Important Plugin Note**: Native plugins (`plugin.json`) **must** place `hooks.json` at the plugin root (`<plugin_dir>/hooks.json`). Only `agy plugin import`/`install` from Claude Code (`.claude-plugin/plugin.json`) or Gemini CLI (`gemini-extension.json`) stages `hooks/hooks.json` into the plugin root.
- **Plugin Hook Environment Variables (v1.5.3+)**: Hooks originating from a plugin automatically receive:
  - `PLUGIN_ROOT`: Path to the plugin's installation directory.
  - `PLUGIN_DATA`: Path to the plugin's persistent data directory across runs.

### A. `hooks.json` Structure & 6 Event Types

```json
{
  "lint-on-command": {
    "enabled": true,
    "PostToolUse": [
      {
        "matcher": "run_command",
        "hooks": [
          {
            "type": "command",
            "command": "./scripts/lint.sh",
            "timeout": 15
          }
        ]
      }
    ]
  },
  "session-banner": {
    "SessionStart": [
      {
        "type": "command",
        "command": "./scripts/startup.sh",
        "timeout": 10
      }
    ]
  }
}
```

| Event | When It Fires | Structure | Matcher Target |
| :--- | :--- | :--- | :--- |
| `SessionStart` | Once when a new conversation session starts | **Flat** (array of handler objects) | N/A |
| `PreToolUse` | Before a tool executes | **Grouped** (`matcher` + `hooks` array) | Tool name regex (e.g., `"*"`, `"run_command"`, `"run_command\|view_file"`, `"browser_.*"`) |
| `PostToolUse` | After a tool completes | **Grouped** (`matcher` + `hooks` array) | Tool name regex |
| `PreInvocation` | Before the model is called | **Flat** (array of handler objects) | N/A |
| `PostInvocation` | After tool calls finish in a turn | **Flat** (array of handler objects) | N/A |
| `Stop` | When the execution loop is about to terminate | **Flat** (array of handler objects) | N/A |

### B. Hook Input/Output Contracts (stdin & stdout JSON)

All JSON keys use **camelCase** (protojson). Every hook receives these common fields on `stdin`:
```json
{
  "conversationId": "ec33ebf9-0cba-4100-8142-c61503f6c587",
  "workspacePaths": ["/path/to/workspace"],
  "transcriptPath": "/path/to/.gemini/antigravity/transcript.jsonl",
  "artifactDirectoryPath": "/path/to/.gemini/antigravity/artifacts",
  "modelName": "gemini-4-argon-high",
  "lastUserInput": "Fix the failing unit test"
}
```

#### 1. `PreToolUse`
- **stdin adds**: `"toolCall": { "name": "run_command", "args": { "CommandLine": "npm test" } }, "stepIdx": 19`
- **stdout**:
  ```json
  {
    "decision": "allow",
    "reason": "Optional explanation",
    "permissionOverrides": ["command(npm test)"],
    "overwrite": {
      "CommandLine": "npm test -- --watch=false"
    }
  }
  ```
  - `decision` (required): `"allow"` | `"deny"` | `"ask"` | `"force_ask"`.
  - `overwrite` (optional): Shallow top-level key replacement merged into `toolCall.args` before execution.

#### 2. `PostToolUse`
- **stdin adds**: `"toolCall": {...}, "stepIdx": 5, "error": "exit status 1"` (if failed).
- **stdout**: `{}` (empty JSON object).

#### 3. `SessionStart`, `PreInvocation`, and `PostInvocation`
- **stdin adds** (for `PreInvocation`/`PostInvocation`): `"invocationNum": 3, "initialNumSteps": 10`.
- **stdout**:
  ```json
  {
    "injectSteps": [
      { "ephemeralMessage": "Transient reminder for this turn only." },
      { "userMessage": "Injected user message." },
      {
        "systemMessage": {
          "systemMessage": "Persistent system instruction for the model.",
          "metadata": { "user_markdown": "Optional markdown shown inline to user" }
        }
      },
      { "errorMessage": { "userMessage": "Error shown to user" } }
    ],
    "terminationBehavior": ""
  }
  ```
  - `terminationBehavior`:
    - In `PreInvocation`: `""` (proceed) or `"terminate"` (stop before calling model).
    - In `PostInvocation`: `""`, `"force_continue"` (force another agent loop), or `"terminate"`.

#### 4. `Stop`
- **stdin adds**: `"executionNum": 1, "terminationReason": "NO_TOOL_CALL", "error": "", "fullyIdle": true`.
  - `terminationReason` values: `"NO_TOOL_CALL"`, `"MAX_INVOCATIONS"`, `"MAX_FORCED_INVOCATIONS"`, `"MAX_TOKEN_BUDGET_EXCEEDED"`, `"ERROR"`, `"USER_CANCELED"`, `"TERMINAL_STEP_TYPE"`, `"TERMINAL_CUSTOM_HOOK"`, `"INJECTED_RESPONSE"`.
- **stdout**:
  ```json
  {
    "decision": "continue",
    "reason": "Background tasks are still running; verify output before stopping."
  }
  ```
  - Set `"decision": "continue"` to prevent stopping and re-enter the agent loop; any other value allows termination.

---

## 2. Plugins (`plugin.json`)

A plugin bundles skills, agents, rules, MCP servers, hooks, and sidecars into a single unit:
```text
plugins/<plugin-dir>/
├── plugin.json          # Required manifest (JSONC supported)
├── README.md            # Optional user-facing docs (not read into agent context)
├── mcp_config.json      # Optional MCP servers (prefix names with plugin name!)
├── hooks.json           # Optional lifecycle hooks (must be at plugin root)
├── assets/logo.svg      # Optional square logo (>=128x128, ~10% margin)
├── skills/<skill>/SKILL.md
├── agents/<agent>.md
├── sidecars/<id>/sidecar.json
└── rules/AGENTS.md      # Plain markdown without frontmatter
```

### A. `plugin.json` Schema (v1.5.3+)
```json
{
  "name": "my-team-plugin",
  "displayName": "My Team Plugin",
  "description": "Concise 1-2 sentence description matched by Marketplace search.",
  "category": "Developer Tools",
  "version": "1.0.0",
  "logo": "assets/logo.svg",
  "suggestedPrompts": [
    "Audit the current service configuration",
    "Generate deployment readiness checklist",
    "Run integration verification suite"
  ],
  "author": { "name": "Team Name", "url": "https://example.com" },
  "homepage": "https://example.com/docs",
  "repository": { "type": "git", "url": "https://github.com/org/repo" },
  "disabled": false
}
```
> **Note**: Unknown top-level fields are silently discarded. `category` must be a non-empty string if present (validated by `agy plugin validate` in v1.5.3+).

### B. Language Server RPC Inventory & Critical Guardrails (Inside Antigravity App)
When running inside Antigravity and inspecting installed plugins via the local Language Server Connect RPC:
1. **Always filter `GetAllPlugins` through `jq`**:
   ```bash
   : "${ANTIGRAVITY_LS_ADDRESS:=localhost:5387}"
   curl -sS -X POST "http://${ANTIGRAVITY_LS_ADDRESS}/exa.language_server_pb.LanguageServerService/GetAllPlugins" \
     -H "Content-Type: application/json" \
     -H "x-codeium-csrf-token: ${ANTIGRAVITY_CSRF_TOKEN}" \
     -d '{"workspaceUris":["file:///path/to/workspace"]}' | jq '[.plugins[] | {
       name,
       dir: (.path | split("/") | last),
       disabled: (.disabled // false),
       isGlobal,
       skills: [.skills[]?.name],
       agents: [.agents[]?.agent.name],
       rules: [.rules[]?.absolutePath],
       hooks: ((.hooksJson // "") | length > 0),
       mcp: [.mcpServers[]?.name]
     }]'
   ```
   **Never read `GetAllPlugins` unfiltered** because it inlines the full text of every bundled `SKILL.md`.
2. **Use `dir` (install directory name), never `name`, in UI links**:
   - Format links as `[<name>](customization://<dir>)` (never `plugin://`). Marketplace plugins often install into signed 64-bit hash directory names (e.g., `-1870732469773246571`).
3. **Never call state-mutation RPCs or hand-edit `~/.gemini/config/config.json` from `run_command`**:
   - `JetboxWriteState`, `DeletePlugin`, and `InstallCustomization` are restricted in `run_command`.
   - For Marketplace installs inside Antigravity Chat, look up the ID with `search_marketplace` and emit `<plugin-card catalog-id="<id>"></plugin-card>` on its own line.
   - From an external terminal or CLI user session, use `agy plugin enable <name>`, `agy plugin disable <name>`, `agy plugin install <path>`, or `agy plugin validate <path>`.

---

## 3. MCP Servers (`mcp_config.json`)

Configured globally in `~/.gemini/config/mcp_config.json` or per-plugin in `plugins/<name>/mcp_config.json`, or managed via `agy mcp <add|remove|list|enable|disable>`.

```json
{
  "mcpServers": {
    "local-sqlite": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sqlite", "/path/to/db.sqlite"],
      "env": {
        "DB_READONLY": "true"
      }
    },
    "remote-http-mcp": {
      "url": "https://mcp.example.com/mcp"
    }
  }
}
```

- **Supported Transports**:
  1. **Stdio (`command`, `args`, `env`)**: Spawns a local process and communicates over stdin/stdout.
  2. **Streamable HTTP (`url`)**: Connects to a remote MCP endpoint using the MCP 2025-03-26 Streamable HTTP specification.
- **Legacy SSE Deprecation**: The legacy HTTP+SSE transport (MCP 2024-11-05, typically `/sse`) is **not supported** directly. Point `url` to `/mcp` (Streamable HTTP) or wrap a legacy SSE endpoint using `mcp-remote` over Stdio.
- **Lazy vs. Eager MCP Tools in Antigravity**:
  - Eager tools are exposed directly as `mcp_<serverName>_<toolName>`.
  - Lazy tools have their JSON schemas stored in `<appDataDir>/mcp/<serverName>/<toolName>.json`; read the schema file first, then invoke via `call_mcp_tool`.
