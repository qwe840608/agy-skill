# Sidecars, Scheduled Automations, Generative UI & Python SDK

This reference covers Antigravity's background **Sidecars & Scheduled Automations (`sidecar.json`)**, **UI Plugin Panes (`sidecar://`)**, **Generative UI (`<agent-embed>`)**, and the **Antigravity Python SDK (`google-antigravity`)**.

---

## 1. Scheduled Automations (`sidecar.json`)

A **Scheduled Automation** is a background sidecar (`"builtin": "schedule"`) that runs on a cron schedule and starts a fresh, unattended agent conversation (`agentapi new-conversation`) on each trigger.

### A. File Location & Schema
Create at `~/.gemini/config/sidecars/<sidecar-id>/sidecar.json`:

```json
{
  "builtin": "schedule",
  "args": [
    "CRON_TZ=Asia/Taipei 0 9 * * 1-5",
    "agentapi",
    "new-conversation",
    "--",
    "Check open pull requests in the repository and summarize any with failing CI checks or pending review comments."
  ],
  "restart_policy": "always",
  "display_name": "Daily PR Status Check",
  "description": "Every weekday at 9:00 AM (Asia/Taipei), checks open pull requests and summarizes failing checks.",
  "agent_permissions": {
    "workspace_uris": [
      "file:///path/to/my-repo"
    ],
    "access_grants": [
      "command(gh pr list)",
      "command(gh pr view)",
      "read_url(github.com)"
    ]
  }
}
```

### B. Strict Authoring Rules for `sidecar.json`
1. **Snake_case fields only**: `restart_policy`, `display_name`, `agent_permissions`, `access_grants`, `workspace_uris`.
2. **`restart_policy`**: Must be `"always"` for `"builtin": "schedule"` and continuous daemons (`"on-failure"` or `"never"` apply only to one-shot `"command"` sidecars). Never use proto enum strings like `"SIDECAR_RESTART_POLICY_ALWAYS"`.
3. **Cron Timezone Prefix (`args[0]`)**: Always prefix the 5-field cron expression in `args[0]` with `CRON_TZ=<IANA_Timezone> ` (e.g., `CRON_TZ=Asia/Taipei 0 9 * * *`), using a valid IANA zone name (never `CST` or `+08:00`).
4. **Prompt Separator (`"--"`)**: Always place `"--"` immediately before the self-contained prompt string in `args`.
5. **Least-Privilege Permissions (`agent_permissions`)**:
   - Scheduled runs execute unattended and auto-deny any non-approved tool calls.
   - Never use wildcards like `command(*)`, `read_file(*)`, `read_file(/)`, `write_file(*)`, `mcp(*)`, or `read_url(*)`.
   - Use exact verified prefixes:
     - `command(<binary_and_subcommand>)` — e.g., `command(gh pr list)`
     - `read_file(<absolute_path>)` / `write_file(<absolute_path>)`
     - `mcp(<server_name>/<tool_name>)`
     - `read_url(<domain>)` / `execute_url(<domain>)`
6. **Never Enable Programmatically**: Do **not** edit `user_config.json` to set `"enabled": true`. Instead, instruct the user to enable `<display_name>` in the Automations Dashboard via `[Open Automations Dashboard](sidecar://dashboard)`.

---

## 2. UI Plugin Panes (`sidecar://` Pills)

Sidecars can also expose interactive web panels in the right-hand Auxiliary Pane.
- **Discovery Locations**:
  - `~/.gemini/config/sidecars/<sidecar-id>/sidecar.json`
  - `~/.gemini/config/plugins/<plugin>/sidecars/<sidecar-id>/sidecar.json` (namespaced ID: `<plugin>/<sidecar-id>`)
  - Builtin sidecar directories under `~/.gemini/<app-name>/builtin/`.
- **Detection**: A sidecar has an Aux Pane UI if `sidecar.json` has `"has_web_ui": true` and a `ui_config.views[]` entry with `"entrypoint": "SIDECAR_UI_ENTRYPOINT_AUX_PANE"`.
- **Rendering a One-Click Pill in Chat**:
  ```markdown
  [<View Title or Display Name>](sidecar://<sidecar-id>/<view-path>)
  ```
  *(Only emit pills for plugins/sidecars that are currently enabled and running.)*

---

## 3. Generative UI (`<agent-embed>`)

In Antigravity 2.0, agents can build rich, interactive HTML/JS widgets (charts, simulators, interactive walkthroughs, dashboards) saved as artifacts (`UserFacing: true` in `ArtifactMetadata`).

### A. Standalone vs. Inline (`<agent-embed>`)
- **Standalone Artifact (Default)**: Save `.html` to `<artifactDir>/widget.html` and link to it for full-height viewing in the side pane. Use solid background `bg-[var(--background)]`.
- **Inline Widget (`<agent-embed>`)**: For compact widgets (**under 500px height**), embed directly in the chat response:
  ```markdown
  <agent-embed src="file:///<artifact_path>/widget.html"></agent-embed>
  ```

### B. Boilerplate & Strict CSP / Styling Rules
All external CDNs are blocked by CSP **except** the allowlisted Antigravity Tailwind script:

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
</head>
<body class="bg-transparent text-[var(--foreground)] antialiased p-5">
  <div class="bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] rounded-xl p-5 shadow-sm">
    <h2 class="text-[var(--foreground)] font-semibold text-lg">Widget Title</h2>
    <p class="text-[var(--muted-foreground)] text-sm">Interactive description</p>
    <!-- Interactive controls / canvas / SVG -->
  </div>
</body>
</html>
```

- **Guardrails**:
  - **Use Host Theme CSS Variables**: `--background`, `--content`, `--card`, `--sidebar`, `--border`, `--foreground`, `--muted-foreground`, `--placeholder`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--accent`.
  - **Never define `:root` color fallbacks** in `<style>`.
  - **No sub-12px micro-text**: Keep `text-xs` (`12px`) as the minimum font size.
  - **Never use viewport-relative heights** (`h-screen`, `min-h-screen`, `100vh`, `height: 100%`) on inline embeds, and do not pass a `height` attribute to `<agent-embed>`.

---

## 4. Antigravity Python SDK (`google-antigravity`)

Programmatically spawn, configure, and stream Antigravity agents in Python scripts or test harnesses.
- **Repository**: `https://github.com/google-antigravity/antigravity-sdk-python`
- **Installation**:
  ```bash
  pip install google-antigravity
  ```
  *(Always install via `pip` to obtain the platform-specific compiled runtime wheel.)*

### Quickstart & Streaming Thoughts / Tool Calls
```python
import asyncio
import sys
from google.antigravity import Agent, LocalAgentConfig, CapabilitiesConfig

async def main():
    # Default is read-only. Pass CapabilitiesConfig() to enable write tools (run_command, edit_file).
    config = LocalAgentConfig(
        system_instructions="You are an expert assistant for codebase navigation.",
        capabilities=CapabilitiesConfig(),
    )

    async with Agent(config) as agent:
        response = await agent.chat("Analyze the project structure and list key modules.")

        # Optional: stream internal reasoning deltas
        async for thought in response.thoughts:
            print(f"[Thinking] {thought}")

        # Optional: stream strongly-typed ToolCall events
        async for call in response.tool_calls:
            print(f"[Tool] {call.name}({call.args})")

        # Stream final response tokens
        async for token in response:
            sys.stdout.write(token)
            sys.stdout.flush()
        print()

if __name__ == "__main__":
    asyncio.run(main())
```

### Interactive Terminal Loop via SDK
```python
from google.antigravity import Agent, LocalAgentConfig, CapabilitiesConfig
from google.antigravity.utils.interactive import run_interactive_loop

async def run():
    async with Agent(LocalAgentConfig(capabilities=CapabilitiesConfig())) as agent:
        await run_interactive_loop(agent)
```
