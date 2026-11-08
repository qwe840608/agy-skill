---
name: agy-skill
description: >-
  How to delegate work to the Google Antigravity CLI (agy) in headless print mode from Claude Code, Codex, OpenCode, or any other agent: image/video/audio understanding, image generation, writing drafts, research and review passes with Gemini models, and driving Google Chrome via /browser. Gives the exact safe command (no --dangerously-skip-permissions), permission allowlists, and the causes of silent hangs.
---

# Antigravity CLI (`agy`) for Other Agents

Use `agy -p` to hand a task to Gemini when the host agent cannot do it (watch video, listen to audio, generate images), when a second model's opinion is wanted, or when the user asks for Gemini. Only the CLI is covered; the Antigravity desktop app and IDE are out of scope.

## When to Use

- Understanding images, video, or audio files.
- Generating images (`generate_image`, roughly 30 s per PNG).
- Drafting text (e.g., social posts) or getting a second-model research/review pass.
- Operating the user's Google Chrome via `/browser` (Section 2). Chrome only; never Edge or other browsers.

## When Not to Use

- Anything needing passwords, payments, posting, deleting, or pushing. Ask the user first.
- Small edits the host agent can do faster itself.

## 0. Locate the Binary and Pick a Shell

The examples use a POSIX shell (bash/zsh; Git Bash on Windows). Set `AGY` once:

```bash
AGY="${AGY_BIN:-agy}"
command -v "$AGY" >/dev/null 2>&1 || AGY="$LOCALAPPDATA/agy/bin/agy.exe"   # Windows fallback
command -v "$AGY" >/dev/null 2>&1 || AGY="$HOME/.local/bin/agy"            # macOS/Linux fallback
"$AGY" --version   # must print a version; if not, the user has to install and sign in once interactively
```

PowerShell: the same flags work, but close stdin with `cmd /c "agy ... < NUL"` instead of `</dev/null`, and pass the `--settings` JSON as a file path (quoting inline JSON in PowerShell is error-prone). The first `agy` run on a machine must be interactive so the user can finish Google sign-in.

## 1. The Standard Command

Put every input file in one working folder `$DIR` (absolute path; on Windows use forward slashes, e.g. `C:/work/job1`). Default model: `gemini-3.8-flash-medium`. Run `"$AGY" models` for the current list.

**Read-only** (look at files, answer in stdout):

```bash
DIR="/absolute/path/to/workdir"
"$AGY" -p "Do not run any terminal commands; only use your file-viewing tools. <task>" \
  --model gemini-3.8-flash-medium \
  --mode plan --sandbox \
  --add-dir "$DIR" \
  --settings "{\"toolPermission\":\"request-review\",\"permissions\":{\"allow\":[\"read_file($DIR)\"]}}" \
  --print-timeout 10m </dev/null > "$DIR/agy-out.txt" 2> "$DIR/agy-err.txt"
```

**Writes files** (drafts, generated images): change `--mode plan` to `--mode accept-edits` and allow both `read_file($DIR)` and `write_file($DIR)`. Tell agy the exact output file path.

**Structured output**: add `--output-format json` (optionally `--json-schema '<schema or path>'`) when the host agent needs to parse the answer.

Verified on agy v1.5.3, Windows 11, Claude Code auto mode (2026-11-09): both forms ran without being blocked by the host.

## 2. Browser Tasks (Google Chrome Only)

`/browser` makes agy drive the user's **running Google Chrome** through the `chrome_devtools` MCP. It attaches to Chrome's default profile, so **it acts inside the user's signed-in accounts**.

One-time setup by the user (not the agent): open Chrome, go to `chrome://inspect/#remote-debugging`, turn on remote debugging. Check it is on: a `DevToolsActivePort` file exists in Chrome's user-data folder (Windows: `$LOCALAPPDATA/Google/Chrome/User Data/`; macOS: `~/Library/Application Support/Google/Chrome/`; Linux: `~/.config/google-chrome/`).

Workflow: the host agent writes a step list (URL, what to click/type, what to read back, where to stop) into `$DIR/brief.md`, runs agy, then verifies the screenshot and report itself before telling the user.

```bash
DIR="/absolute/path/to/workdir"   # contains brief.md and settings.json
"$AGY" -p "/browser Do not run any terminal commands. Save screenshots under $DIR.

$(cat "$DIR/brief.md")" \
  --model gemini-3.8-flash-medium \
  --mode accept-edits --sandbox \
  --add-dir "$DIR" \
  --settings "$DIR/settings.json" \
  --print-timeout 9m </dev/null > "$DIR/agy-out.txt" 2> "$DIR/agy-err.txt"
```

`settings.json`: allow only the needed tools and the task's domains (no `evaluate_script`, no wildcards). Replace the placeholder domain and path:

```json
{"toolPermission":"request-review","permissions":{"allow":[
"mcp(chrome_devtools/list_pages)","mcp(chrome_devtools/new_page)","mcp(chrome_devtools/select_page)",
"mcp(chrome_devtools/navigate_page)","mcp(chrome_devtools/take_snapshot)","mcp(chrome_devtools/take_screenshot)",
"mcp(chrome_devtools/click)","mcp(chrome_devtools/fill)","mcp(chrome_devtools/type_text)",
"mcp(chrome_devtools/press_key)","mcp(chrome_devtools/wait_for)",
"execute_url(www.example.com)","read_url(www.example.com)",
"read_file(/absolute/path/to/workdir)","write_file(/absolute/path/to/workdir)"]}}
```

Never let agy sign in, enter passwords or payment data, submit forms, post, buy, or delete. Ask the user first.

Verified on agy v1.5.3 + Chrome 157, Windows 11 (2026-11-09): a YouTube search task completed, screenshot saved, not blocked by Claude Code auto mode.

## 3. Five Rules That Prevent Silent Failures

1. **Close stdin**: always end with `</dev/null` (PowerShell: `< NUL` via `cmd /c`). An open stdin pipe makes `agy -p` hang forever at 0% CPU.
2. **Always `--add-dir "$DIR"`**: otherwise agy may run in `~/.gemini/antigravity-cli/scratch` and not see your files.
3. **Never use `--dangerously-skip-permissions`**: Claude Code's auto mode blocks it as an unsafe agent, and it is not needed. Use the `--settings` allowlist above. In `-p` mode any tool not on the allowlist is auto-denied, and stderr names the rule you would need (e.g. `command(...)`).
4. **Say "Do not run any terminal commands"** in the prompt unless you allowed a specific `command(<prefix>)`; otherwise Gemini may try a shell command and the run ends with no output.
5. **Check, don't trust**: exit code 0 can still mean "no output produced". Read `agy-err.txt`, open the produced files yourself, and verify facts before passing results to the user.

## 4. Allowlist Rule Format

`permissions.allow` / `permissions.deny` entries must match `command(...)`, `read_file(...)`, `write_file(...)`, `read_url(...)`, `execute_url(...)`, `download_url(...)`, `mcp(...)`, or `unsandboxed(...)`. Grant the narrowest path or domain that works. Never allow `read_file` on `~/.gemini` (it holds OAuth tokens).

## 5. More Detail

- [references/examples.md](references/examples.md): four copy-and-adapt briefs (video/image summary, second-opinion review, draft or image generation, Chrome task) with the permissions and verification steps for each.
- [references/cli-and-headless.md](references/cli-and-headless.md): all flags, subcommands, JSON output, brief-writing, troubleshooting.
- [references/version-snapshot.md](references/version-snapshot.md): installed version, exact `--help` output, model IDs (auto-generated).
- [references/customizations.md](references/customizations.md) and [references/hooks-plugins-mcp.md](references/hooks-plugins-mcp.md): only when asked to configure agy's own skills, rules, plugins, hooks, or MCP servers.

## 6. Updating This Skill

After an `agy` update or any edit here, run `npm run sync` in the repo (no git side effects) to refresh the snapshot and copy the skill to local agents. Commit and push only after the user approves.
