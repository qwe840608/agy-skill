# 可直接複製修改的 `agy -p` 範例

> 英文版（安裝給 agent 的版本）在 [references/examples.md](references/examples.md)，兩份內容對應。

四個端到端範例，host agent 貼上後改佔位路徑就能用。全部沿用 `SKILL.md` 第 0 節的前置（已解析 `$AGY`、POSIX shell），路徑用佔位符：把 `/absolute/path/to/workdir` 換成真實的絕對路徑（Windows 用正斜線，例如 `C:/work/job1`）。沒有任何範例需要 `--dangerously-skip-permissions`。

每個範例共同的流程：

1. 建立 `$DIR`，把輸入檔複製進去，寫好任務簡報。
2. 執行 `agy`，允許清單只涵蓋 `$DIR`（瀏覽器任務再加上指定的 Chrome 工具與網域）。
3. 自己先讀 `$DIR/agy-err.txt` 和產出的檔案，確認無誤才回報使用者。

---

## 範例 1：摘要影片或描述圖片（唯讀）

**適用**：host agent 自己看不了影片、聽不了音訊；或使用者想要 Gemini 對一張圖的解讀。

**權限**：只有 `read_file($DIR)`。用 `--mode plan --sandbox`，不會寫任何檔。

```bash
DIR="/absolute/path/to/workdir"          # 內含 clip.mp4（或 photo.jpg、voice.m4a）
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

**預期產出**：答案在 `$DIR/agy-out.txt`；`$DIR/agy-err.txt` 應為空。

**驗證**：`agy-out.txt` 若是空的，先看 `agy-err.txt` 有沒有工具被拒的訊息。host 若自己能開檔，抽查一兩個時間點；不能的話，要告訴使用者哪些內容是 Gemini 說的、尚未驗證。

---

## 範例 2：請 Gemini 給程式碼或計畫的第二意見（唯讀，host 負責驗證）

**適用**：使用者想要另一個模型審一份 diff、設計文件或計畫。

**權限**：只有 `read_file($DIR)`。先把要審的材料（patch 檔、文件、相關原始碼）放進 `$DIR`；除非使用者要求，不要把整個 repo 掛給 `agy`。

```bash
DIR="/absolute/path/to/workdir"          # 內含 change.patch 或 plan.md
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

審計畫時換簡報：「Challenge the assumptions in plan.md: list each assumption, why it might be false, and what evidence would settle it.」

**預期產出**：審查結果在 `$DIR/agy-out.txt`。

**驗證**：host agent 把每一條發現對照實際程式碼確認過才轉述。重現不了的就刪掉，並告訴使用者哪幾條是你確認過的。

---

## 範例 3：產生草稿或圖片（只寫入一個資料夾）

**適用**：使用者要一份文字草稿（貼文、大綱）或一張生成圖，而且要存成檔案。

**權限**：`read_file($DIR)` 加 `write_file($DIR)`；用 `--mode accept-edits` 讓 `$DIR` 內的寫檔自動通過。`$DIR` 以外都不可寫。

```bash
DIR="/absolute/path/to/workdir"          # 內含 notes.md（素材）
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

生圖版本（flag 相同）：`"Use generate_image to create a 1024x1024 flat-style illustration of <subject>. Save it as $DIR/cover.png. Then reply with the exact path written."` 每張約 30 秒。

**預期產出**：`$DIR/draft.txt` 或 `$DIR/cover.png`，加上 `$DIR/agy-out.txt` 的回覆。

**驗證**：確認檔案存在且能開；逐條對照 `notes.md` 檢查草稿內容；圖片要自己看過再往下送。檔案沒出現時，`agy-err.txt` 通常會寫出被拒的規則名稱。

---

## 範例 4：在使用者的 Chrome 裡做瀏覽器任務（讀取、點擊、截圖；不碰敏感操作）

**適用**：使用者要在已登入的網站上查或讀某些東西，而 host agent 沒有自己的瀏覽器。

**執行前**：使用者（不是 agent）已在 `chrome://inspect/#remote-debugging` 開過一次遠端偵錯、Chrome 正在執行、而且使用者已同意這個具體任務。

**權限**：只開列出的 `chrome_devtools` 工具、只開任務的網域，加上 `$DIR` 的 `read_file`／`write_file`。不開 `evaluate_script`，不用萬用字元。

`$DIR/settings.json`：

```json
{"toolPermission":"request-review","permissions":{"allow":[
"mcp(chrome_devtools/list_pages)","mcp(chrome_devtools/new_page)","mcp(chrome_devtools/select_page)",
"mcp(chrome_devtools/navigate_page)","mcp(chrome_devtools/take_snapshot)","mcp(chrome_devtools/take_screenshot)",
"mcp(chrome_devtools/click)","mcp(chrome_devtools/fill)","mcp(chrome_devtools/type_text)",
"mcp(chrome_devtools/press_key)","mcp(chrome_devtools/wait_for)",
"execute_url(www.example.com)","read_url(www.example.com)",
"read_file(/absolute/path/to/workdir)","write_file(/absolute/path/to/workdir)"]}}
```

`$DIR/brief.md`（由 host agent 撰寫，每一步都明確）：

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

**預期產出**：`$DIR/result.png` 與 `$DIR/agy-out.txt` 裡的清單。

**驗證**：打開截圖，逐步對照簡報；把讀回的清單和截圖比對。只回報截圖能證實的內容。

**遇到以下任何一步，先停下來問使用者**：登入、輸入密碼或付款資料、送出表單、發文、購買、刪除。這些永遠不派給 agy。
