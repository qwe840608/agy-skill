# Antigravity 2.0 Desktop App & Antigravity IDE Reference

Google Antigravity provides two graphical environments alongside the `agy` CLI:
1. **Antigravity 2.0 (`antigravity`)**: A standalone Electron desktop application built for parallel multi-agent orchestration, background tasks, artifacts, and scheduled automations.
2. **Antigravity IDE (`antigravity-ide`)**: An AI-first integrated development environment (built on VS Code) for inline coding, autocomplete, and editor-integrated agent workflows.

Both share the same underlying Language Server, customization roots (`.agents/` and `~/.gemini/config/`), and agent capabilities.

---

## 1. Antigravity 2.0 Desktop Application

### A. Left-Hand Sidebar
- **New Conversation**: Start a fresh agent thread.
- **Projects**: Switch between workspaces/repositories and configure project-scoped settings.
- **Scheduled Tasks (Automations)**: Create, enable/disable, and monitor recurring cron automations (`sidecar.json` with `"builtin": "schedule"`) and one-shot timers.
- **Skills & Customizations**: Inspect, toggle, or uninstall installed Plugins, Skills, Rules, Hooks, and MCP servers via the visual Customizations manager (`customization://<dir>`).
- **Settings**: Configure global and project-specific model selection, sandbox policies, and permission grants.

### B. Chat Canvas
- **Slash Commands (`/`)**: Trigger specialized workflows or built-in skills:
  - `/goal`: Run long-running, thorough autonomous tasks until the goal is fully verified.
  - `/plan`: Enter structured step-by-step planning before execution.
  - `/grill-me`: Interactive design interview to resolve ambiguities one decision at a time using `ask_question`.
  - `/boost`: Deep thinking, multi-perspective analysis, and rigorous verification for complex tasks.
  - `/teamwork`: Coordinate a team of autonomous subagents (`invoke_subagent`, `define_subagent`, `send_message`, `manage_subagents`) on large projects.
  - `/schedule` or `/automation`: Set one-time timers (`schedule` tool) or recurring background automations.
  - `/browser`: Web browsing, searching, and web app testing.
  - `/compact`: Compact and summarize long conversation context.
  - `/learn`: Persist newly learned setup or corrections into reusable rules/skills.
  - `/plugin`: Create, consolidate, or manage plugins.
- **`@` Mentions**: Attach context directly to prompts (files, folders, previous conversations `conversation://<id>`, terminal sessions, rules, and MCP servers/tools).
- **Media Uploads**: Drag-and-drop or paste images, PDFs, audio, or video directly into the chat canvas.

### C. HTML Auxiliary Pane (Right Side Pane)
Displays real-time workspace and agent telemetry:
- **Subagents**: Live status and transcripts of spawned subagents (`self`, `research`, `image-generator`, or custom agents defined via `define_subagent`).
- **Background Tasks**: Active daemon processes (`IsDaemon: true`), async shell commands, and active timers/cron jobs (`manage_task`).
- **Artifacts**: Rich Markdown reports, implementation plans (`RequestFeedback: true`), Mermaid diagrams, image carousels, and interactive HTML Generative UI widgets stored in `<appDataDir>/brain/<conversation-id>/`.
- **Files Changed**: Live worktree diff review.
- **Terminals**: Interactive and agent-managed shell sessions.
- **UI Plugin Panels**: Custom web views backed by sidecars (`sidecar://<sidecar-id>/<view-path>`).

### D. Global & Project-Level Settings / Permissions
Project-level settings override global settings when a project is active:
- **Model Selection**: Choose active model (e.g., Gemini 4 Argon High/Medium/Low, Gemini 3.8 Flash, Claude Opus/Sonnet 5.5, GPT-OSS 120B).
- **Tool Execution Policy (`Auto-Execution Policy`)**:
  - `always-proceed`: Execute commands without prompting.
  - `proceed-in-sandbox`: Auto-approve commands that run inside the terminal sandbox; prompt only when bypassing the sandbox.
  - `request-review`: Ask before running potentially mutating commands.
  - `strict`: Prompt for every command execution.
- **Terminal Sandbox**: Isolate terminal executions to prevent unintended host modifications.
- **Non-Workspace File Access (`File Access Policy`)**: `allow` | `ask` | `deny` access to files outside the workspace root.
- **Internet Access Policy**: `allow` | `ask` | `deny` outbound network requests.
- **Permission Grants**: Fine-grained allow/deny rules (`command(...)`, `read_file(...)`, `write_file(...)`, `mcp(...)`, `read_url(...)`).
- **Command Allowlist / Denylist & Browser Allowlist**: Always permit/block specific commands or browser domains.
- **Artifact Review Mode**: `always-proceed` | `agent-decides` | `asks-for-review`.

---

## 2. Antigravity IDE (VS Code-Based Editor)

### A. Three Core AI Modalities
1. **Passive — Antigravity Tab (Autocomplete & Supercomplete)**:
   - **Autocomplete**: Context-aware code completions at the cursor based on open tabs, terminal output, and surrounding code.
   - **Supercomplete**: Proposes multi-line diffs (including deletions) in floating previews.
   - **Tab to Jump**: Predicts your next edit location; press `Tab` to jump directly there.
   - **Tab to Import**: Automatically inserts missing imports at the top of the file.
   - **Shortcuts**: Accept with `Tab`, reject with `Esc`, accept word-by-word with `Ctrl+Right` (Windows/Linux) or `Cmd+Right` (macOS).
2. **Instructive — Inline Command (`Ctrl+I` / `Cmd+I`)**:
   - Highlight code and press `Ctrl+I` / `Cmd+I` for localized refactoring, explanation, or docstrings, or invoke without selection to generate new code at the cursor.
3. **Collaborative — Sidebar Chat & Agent Mode**:
   - Full multi-step agent pair programmer inside the IDE sidebar with Agent Mode and Planning Mode.

### B. Editor UI Integrations
- **Inline Code Lenses**: Action buttons above classes/functions (e.g., "Refactor", "Write Tests", "Explain Code").
- **Visual Diff Overlays**: Inline red/green diffs in the editor canvas to accept or reject changes hunk-by-hunk.
- **Diagnostic Auto-Fix**: One-click agent fixes triggered directly from compiler errors, lint warnings, or the Problems pane.

---

## 3. Product Data & Transcript Directories

Under `~/.gemini/` (or `%USERPROFILE%\.gemini\` on Windows), each surface maintains its own runtime directory while sharing `~/.gemini/config/`:

| Surface | App Data Subdirectory | Conversation Transcripts Location |
| :--- | :--- | :--- |
| **Antigravity 2.0 App** | `~/.gemini/antigravity/` | `~/.gemini/antigravity/brain/<conv-id>/.system_generated/logs/transcript.jsonl` |
| **Antigravity CLI (`agy`)** | `~/.gemini/antigravity-cli/` | `~/.gemini/antigravity-cli/...` |
| **Antigravity IDE** | `~/.gemini/antigravity-ide/` | `~/.gemini/antigravity-ide/...` |
| **Shared Global Config** | `~/.gemini/config/` | Contains shared `skills/`, `plugins/`, `sidecars/`, `hooks.json`, `mcp_config.json`, `config.json` |
