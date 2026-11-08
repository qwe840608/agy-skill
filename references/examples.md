# Copy-and-Adapt Examples for `agy -p`

Four end-to-end examples a host agent can paste and adapt. All of them assume the setup from `SKILL.md` Section 0 (`$AGY` resolved, POSIX shell) and use placeholder paths: replace `/absolute/path/to/workdir` with a real absolute folder (forward slashes on Windows, e.g. `C:/work/job1`). No example needs `--dangerously-skip-permissions`.

Common pattern for every example:

1. Create `$DIR`, copy the inputs into it, and write the brief.
2. Run `agy` with an allowlist that covers only `$DIR` (plus, for browser work, the named Chrome tools and domains).
3. Read `$DIR/agy-err.txt` and the produced files yourself before telling the user anything.

---

## Example 1: Summarize a Video or Describe an Image (Read-Only)

**When**: the host agent cannot watch video or listen to audio itself; or the user wants Gemini's read of an image.

**Permissions**: `read_file($DIR)` only. `--mode plan --sandbox` so nothing is written.

```bash
DIR="/absolute/path/to/workdir"          # contains clip.mp4 (or photo.jpg, voice.m4a)
"$AGY" -p "Do not run any terminal commands; only use your file-viewing tools.
Watch clip.mp4 in the workspace. Reply in this order:
1. One-paragraph summary.
2. Timestamped list of scene changes (mm:ss - what happens).
3. Any on-screen text, quoted exactly.
If you cannot open the file, say so and stop." \
  --model gemini-3.8-flash-medium \
  --mode plan --sandbox \
  --add-dir "$DIR" \
  --settings "{\"toolPermission\":\"request-review\",\"permissions\":{\"allow\":[\"read_file($DIR)\"]}}" \
  --print-timeout 10m </dev/null > "$DIR/agy-out.txt" 2> "$DIR/agy-err.txt"
```

**Expected output**: the answer in `$DIR/agy-out.txt`; `$DIR/agy-err.txt` empty.

**Verify**: if `agy-out.txt` is empty, read `agy-err.txt` for a denied-tool notice. Spot-check one or two timestamps against the media yourself if the host can open it; otherwise tell the user which facts come from Gemini unverified.

---

## Example 2: Second Opinion on Code or a Plan (Read-Only, Host Verifies)

**When**: the user wants a second model's review of a diff, a design doc, or a plan.

**Permissions**: `read_file($DIR)` only. Put the material into `$DIR` first (a patch file, the doc, the relevant source files); do not point `agy` at the whole repository unless the user asked.

```bash
DIR="/absolute/path/to/workdir"          # contains change.patch and/or plan.md
"$AGY" -p "Do not run any terminal commands; only use your file-viewing tools.
Review change.patch in the workspace as an independent reviewer.
Report findings ranked by severity. For each: file and line, what breaks, how to fix.
Separate 'observed in the diff' from 'inferred'. End with an 'Unverified' section.
Do not propose rewrites of code you have not seen." \
  --model gemini-3.8-flash-high \
  --mode plan --sandbox \
  --add-dir "$DIR" \
  --settings "{\"toolPermission\":\"request-review\",\"permissions\":{\"allow\":[\"read_file($DIR)\"]}}" \
  --print-timeout 10m </dev/null > "$DIR/agy-out.txt" 2> "$DIR/agy-err.txt"
```

For a plan review, swap the brief: "Challenge the assumptions in plan.md: list each assumption, why it might be false, and what evidence would settle it."

**Expected output**: the review in `$DIR/agy-out.txt`.

**Verify**: the host agent checks every finding against the actual code before repeating it. Drop findings that do not reproduce; tell the user which ones you confirmed.

---

## Example 3: Generate a Draft or an Image (Writes Into One Folder)

**When**: the user wants a text draft (post, outline) or a generated image, and wants the file on disk.

**Permissions**: `read_file($DIR)` and `write_file($DIR)`; `--mode accept-edits` so file writes inside `$DIR` are accepted. Nothing outside `$DIR` is writable.

```bash
DIR="/absolute/path/to/workdir"          # contains notes.md with the source material
"$AGY" -p "Do not run any terminal commands; use only file tools.
Read notes.md. Write a 150-200 word plain-text draft post in Traditional Chinese
to $DIR/draft.txt. Do not invent facts that are not in notes.md.
Then reply with the list of claims you were unsure about." \
  --model gemini-3.8-flash-medium \
  --mode accept-edits --sandbox \
  --add-dir "$DIR" \
  --settings "{\"toolPermission\":\"request-review\",\"permissions\":{\"allow\":[\"read_file($DIR)\",\"write_file($DIR)\"]}}" \
  --print-timeout 10m </dev/null > "$DIR/agy-out.txt" 2> "$DIR/agy-err.txt"
```

Image variant (same flags): `"Use generate_image to create a 1024x1024 flat-style illustration of <subject>. Save it as $DIR/cover.png. Then reply with the exact path written."` Allow about 30 seconds per image.

**Expected output**: `$DIR/draft.txt` or `$DIR/cover.png`, plus the reply in `$DIR/agy-out.txt`.

**Verify**: confirm the file exists and opens; read the draft and check each claim against `notes.md`; for images, look at the result yourself before sending it on. If a file is missing, `agy-err.txt` usually names the denied rule.

---

## Example 4: Browser Task in the User's Chrome (Read, Click, Screenshot; No Sensitive Actions)

**When**: the user wants something looked up or read on a site they are already signed in to, and the host agent has no browser of its own.

**Before running**: the user (not the agent) has enabled remote debugging once at `chrome://inspect/#remote-debugging`, Chrome is open, and the user has approved this specific task.

**Permissions**: only the `chrome_devtools` tools listed, only the task's domains, and `read_file`/`write_file` on `$DIR`. No `evaluate_script`, no wildcards.

`$DIR/settings.json`:

```json
{"toolPermission":"request-review","permissions":{"allow":[
"mcp(chrome_devtools/list_pages)","mcp(chrome_devtools/new_page)","mcp(chrome_devtools/select_page)",
"mcp(chrome_devtools/navigate_page)","mcp(chrome_devtools/take_snapshot)","mcp(chrome_devtools/take_screenshot)",
"mcp(chrome_devtools/click)","mcp(chrome_devtools/fill)","mcp(chrome_devtools/type_text)",
"mcp(chrome_devtools/press_key)","mcp(chrome_devtools/wait_for)",
"execute_url(www.example.com)","read_url(www.example.com)",
"read_file(/absolute/path/to/workdir)","write_file(/absolute/path/to/workdir)"]}}
```

`$DIR/brief.md` (written by the host agent; every step is explicit):

```markdown
1. Open https://www.example.com/ in a new tab.
2. Type "<search term>" into the search box and press Enter.
3. Wait for results. Take a screenshot and save it as /absolute/path/to/workdir/result.png.
4. Read back the titles of the first five results as a numbered list.
5. Stop. Do not click any result, do not sign in, do not fill any other form.
```

```bash
DIR="/absolute/path/to/workdir"
"$AGY" -p "/browser Do not run any terminal commands. Save screenshots under $DIR.

$(cat "$DIR/brief.md")" \
  --model gemini-3.8-flash-medium \
  --mode accept-edits --sandbox \
  --add-dir "$DIR" \
  --settings "$DIR/settings.json" \
  --print-timeout 9m </dev/null > "$DIR/agy-out.txt" 2> "$DIR/agy-err.txt"
```

**Expected output**: `$DIR/result.png` and the list in `$DIR/agy-out.txt`.

**Verify**: open the screenshot and compare it with the brief step by step; check the read-back list against the screenshot. Report to the user only what the screenshot confirms.

**Stop and ask the user** before any step that would sign in, enter a password or payment detail, submit a form, post, buy, or delete. These are never delegated.
