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

Put every input file in one working folder `$DIR` (absolute path; on Windows use forward slashes, e.g. `C:/work/job1`). Default model for every task: `gemini-4-hydrogen-medium`. Use another model only when the user names one (swap it into the `--model` flag of the examples below). Run `"$AGY" models` for the current list.

**Read-only** (look at files, answer in stdout):

```bash
DIR="/absolute/path/to/workdir"
cd "$DIR" && "$AGY" -p "Do not run any terminal commands; only use your file-viewing tools. <task>" \
  --model gemini-4-hydrogen-medium \
  --mode plan --sandbox \
  --add-dir "$DIR" \
  --settings "{\"toolPermission\":\"request-review\",\"permissions\":{\"allow\":[\"read_file($DIR)\"]}}" \
  --print-timeout 10m </dev/null > "$DIR/agy-out.txt" 2> "$DIR/agy-err.txt"
```

**Writes files** (drafts, generated images): change `--mode plan` to `--mode accept-edits` and allow both `read_file($DIR)` and `write_file($DIR)`. Tell agy the exact output file path.

**Structured output**: add `--output-format json` (optionally `--json-schema '<schema or path>'`) when the host agent needs to parse the answer.

Verified on agy v1.5.9, Windows 11, Claude Code auto mode (2026-11-16): both forms ran without being blocked by the host.

## 2. Browser Tasks (Google Chrome Only)

`/browser` makes agy drive the user's **running Google Chrome** through the `chrome_devtools` MCP. It attaches to Chrome's default profile, so **it acts inside the user's signed-in accounts**.

One-time setup by the user (not the agent): open Chrome, go to `chrome://inspect/#remote-debugging`, turn on remote debugging. Check it is on: a `DevToolsActivePort` file exists in Chrome's user-data folder (Windows: `$LOCALAPPDATA/Google/Chrome/User Data/`; macOS: `~/Library/Application Support/Google/Chrome/`; Linux: `~/.config/google-chrome/`).

The user must be at the computer: Chrome shows an `Allow remote debugging?` dialog every time agy connects (every run on agy 1.5.9 + Chrome 157, 2026-11-16), and only the user clicks it. In two runs where nobody did, agy gave up after 3 to 4.5 minutes with exit code 0 and an empty stderr.

Workflow: the host agent writes a step list (URL, what to click/type, what to read back, where to stop) into `$DIR/brief.md`, runs agy, then verifies the screenshot and report itself before telling the user.

```bash
DIR="/absolute/path/to/workdir"   # contains brief.md and settings.json
cd "$DIR" && "$AGY" -p "/browser Do not run any terminal commands. Read page content with take_snapshot only; never call evaluate_script. Save screenshots under $DIR.

$(cat "$DIR/brief.md")" \
  --model gemini-4-hydrogen-medium \
  --mode accept-edits --sandbox \
  --add-dir "$DIR" \
  --settings "$DIR/settings.json" \
  --print-timeout 9m </dev/null > "$DIR/agy-out.txt" 2> "$DIR/agy-err.txt"
```

`settings.json`: block every browser tool the task does not need with `permissions.deny`. On agy 1.5.9 the allow list alone does **not** confine the browser (tested 2026-11-16): `take_screenshot` and `click` ran without being listed. `deny` does work: each of the five tools denied below was refused when the browser subagent called it. The sample is for a read-only task; for a task that must click or type, remove only those tools from `deny`. Replace the placeholder path:

```json
{"toolPermission":"request-review","permissions":{"allow":[
"mcp(chrome_devtools/list_pages)","mcp(chrome_devtools/new_page)","mcp(chrome_devtools/select_page)",
"mcp(chrome_devtools/navigate_page)","mcp(chrome_devtools/take_snapshot)","mcp(chrome_devtools/take_screenshot)",
"mcp(chrome_devtools/wait_for)",
"read_file(/absolute/path/to/workdir)","write_file(/absolute/path/to/workdir)"],
"deny":[
"mcp(chrome_devtools/evaluate_script)","mcp(chrome_devtools/click)","mcp(chrome_devtools/fill)",
"mcp(chrome_devtools/type_text)","mcp(chrome_devtools/press_key)"]}}
```

Three limits to plan around (agy 1.5.9, tested 2026-11-16):

- **agy does not limit which sites the browser opens.** `execute_url(...)` and `read_url(...)` rules, allow or deny, did not stop it from opening another site. Name the sites in the brief, end it with "do not open any other site", and check the screenshot.
- **A tool with no rule can end the run with no error.** With `evaluate_script` neither allowed nor denied, the browser subagent's call stopped the whole run: exit code 0, an empty stderr, and a stdout that only said it was waiting for the subagent. With it in `deny`, as above, the call came back as `Permission denied ... Matches user-configured deny rule` and the run carried on. So keep it in `deny` and keep the `take_snapshot` instruction in the prompt. If stdout has no result, re-run with `--output-format json` and read `denied_actions`.
- **The session is recorded.** agy saves a `recording.mp4` of the browser under `~/.gemini/antigravity-cli/brain/<id>/`.

Never let agy sign in, enter passwords or payment data, submit forms, post, buy, or delete. Ask the user first.

Verified on agy v1.5.9 + Chrome 157, Windows 11 (2026-11-16): with the command and settings above, agy opened a public page, saved the screenshot in `$DIR` and read the text back. With `fill`, `type_text` and `press_key` taken out of `deny` (the settings of example 4 in [references/examples.md](references/examples.md)), it also typed a query and pressed Enter on Wikipedia, Google Search and YouTube; each screenshot showed the query in the search box and the results page. Facebook and Instagram were not tested: Chrome was signed out of both, and agy stopped at the login page as the brief told it to.

## 3. Five Rules That Prevent Silent Failures

1. **Close stdin**: always end with `</dev/null` (PowerShell: `< NUL` via `cmd /c`). An open stdin pipe has made `agy -p` hang forever at 0% CPU. Not reproduced on agy 1.5.9 (2026-11-16: with a pipe held open for 60 s the run finished in 6 s), but closing stdin costs nothing.
2. **Always `--add-dir "$DIR"`**: otherwise agy may run in `~/.gemini/antigravity-cli/scratch` and not see your files. **Start agy from inside `$DIR`** (the `cd "$DIR" &&` in the commands above): agy also treats the directory it is started from as a workspace. On agy 1.5.9 (tested 2026-11-16) files there were readable in `plan` mode and writable in `accept-edits` mode with no allow rule, so never start it from a repo or home folder you do not mean to expose.
3. **Never use `--dangerously-skip-permissions`**: Claude Code's auto mode blocks it as an unsafe agent, and it is not needed. Use the `--settings` allowlist above. In `-p` mode a tool call that needs approval and is not on the allowlist is auto-denied, and stderr names the rule you would need (e.g. `command(<target>)`). The same notice suggests re-running with `--dangerously-skip-permissions`; ignore that and add the narrow rule. One gap: files under the OS temp folder (tested with Windows `%TEMP%` on agy 1.5.9, 2026-11-16) were readable and writable with no rule, so do not count on the allowlist to protect anything stored there.
4. **Say "Do not run any terminal commands"** in the prompt unless you allowed a specific `command(...)` rule (Section 4); otherwise Gemini may try a shell command and the run ends with no output.
5. **Check, don't trust**: exit code 0 can still mean "no output produced". Read `agy-err.txt`, open the produced files yourself, and verify facts before passing results to the user.

## 4. Allowlist Rule Format

`permissions.allow` / `permissions.deny` entries must match `command(...)`, `read_file(...)`, `write_file(...)`, `read_url(...)`, `execute_url(...)`, `download_url(...)`, `mcp(...)`, or `unsandboxed(...)`. Grant the narrowest path or domain that works. Never allow `read_file` on `~/.gemini` (it holds OAuth tokens).

On Windows a `command(...)` rule must equal the whole command (agy 1.5.8 changelog: PowerShell and cmd need an exact match). Tested on agy 1.5.9 (2026-11-16): `command(git --version)` allowed `git --version`; `command(git)` did not, and `command(git --version)` did not allow `git --version --build-options`.

## 5. More Detail

- [references/examples.md](references/examples.md): four copy-and-adapt briefs (video/image summary, second-opinion review, draft or image generation, Chrome task) with the permissions and verification steps for each.
- [references/cli-and-headless.md](references/cli-and-headless.md): all flags, subcommands, JSON output, brief-writing, troubleshooting.
- [references/version-snapshot.md](references/version-snapshot.md): installed version, exact `--help` output, model IDs (auto-generated).
- [references/customizations.md](references/customizations.md) and [references/hooks-plugins-mcp.md](references/hooks-plugins-mcp.md): only when asked to configure agy's own skills, rules, plugins, hooks, or MCP servers.

## 6. Updating This Skill

After an `agy` update or any edit here, run `npm run sync` in the repo (no git side effects) to refresh the snapshot and copy the skill to local agents. Commit and push only after the user approves.
