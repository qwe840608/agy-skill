# agy-skill — 讓任何 AI Agent 都會用 Google Antigravity CLI

[English](README.md) | 繁體中文

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/qwe840608/agy-skill/actions/workflows/ci.yml/badge.svg)](https://github.com/qwe840608/agy-skill/actions/workflows/ci.yml)

**`agy-skill`** 教 AI 程式代理（**Claude Code**、**OpenAI Codex**、**OpenCode**，以及 **Antigravity** 本身）如何用無頭模式（headless print mode）把工作安全地派給 **Google Antigravity CLI（`agy`）**，而且不會卡死。一行 `npx` 指令就能把同一份 skill 裝進每個 agent 的技能目錄，支援 **Windows、macOS、Linux**。

這個 skill 給 agent 的東西：

- **一條安全的標準指令**：`agy -p` 的唯讀版與可寫檔版，用 `--settings` 權限允許清單取代 `--dangerously-skip-permissions`，關閉 stdin、掛載工作資料夾、設定逾時。
- **常見任務**：看圖片、影片、音訊；生圖（`generate_image`）；寫草稿；請 Gemini 做第二模型的研究或審查。
- **瀏覽器任務**：用 `/browser` 操作使用者正在執行的 Google Chrome，附最小權限的 `chrome_devtools` 允許清單、使用者端的前置設定，以及「絕不登入、付款、發文、刪除」的硬規則。
- **五條防呆規則**：關 stdin、一定加 `--add-dir`、不跳過權限、沒允許就禁止跑指令、自己驗證輸出。
- **可直接複製的範例**（[EXAMPLES_tw.md](EXAMPLES_tw.md)）：影片／圖片摘要、第二意見審查、產生草稿或圖片、Chrome 任務。
- **參考資料**：所有 flag 與子命令、JSON／NDJSON 輸出、怎麼寫任務簡報、疑難排解，以及（選用）如何設定 `agy` 自己的 skills、rules、plugins、hooks、MCP。
- **即時快照**：安裝機器上的 `agy --help`、`agy help <子命令>`、`agy models` 與最新 changelog。

---

## 安裝（Windows / macOS / Linux）

**需求**：Node.js `>=18`（CI 測 18、20、22），以及已安裝並互動式登入過一次的 `agy` CLI（見 https://antigravity.google/docs/cli/install）。安裝器只會對 `agy` 執行 `--version`、`--help`、`models`、`changelog`，不會替你跑任何任務。

**建議方式：直接從 GitHub 用 `npx`。** 套件目前還沒上 npm registry（`agy-skill` 這個名稱在 2026-11-09 確認尚未被使用；發布有規劃，但要先通過發版檢查，見〈維護者說明〉）。在那之前，下面的 GitHub 形式是唯一支援的安裝方式。

> **npm v12+（Node.js v25/v26+）**：新版 `npm` 預設禁止抓取 git 類型套件（會出現 `npm error code EALLOWGIT`）。透過 `npx github:...` 執行時請加上 `--allow-git=all`。

```bash
# 安裝（全域、所有支援的 agent；描述語言依系統語系）
npx --yes --allow-git=all github:qwe840608/agy-skill

# 手動指定技能描述語言（en | zh | both）
npx --yes --allow-git=all github:qwe840608/agy-skill install --lang zh

# 只裝到目前專案（.agents/skills/agy-skill）
npx --yes --allow-git=all github:qwe840608/agy-skill install --workspace

# 只裝給指定的 agent（antigravity,claude,codex,opencode）
npx --yes --allow-git=all github:qwe840608/agy-skill install --agent antigravity,claude

# 檢查 agy CLI 版本、系統語系與各 agent 的安裝狀態
npx --yes --allow-git=all github:qwe840608/agy-skill doctor

# 更新：再跑一次安裝指令即可（原地覆寫）
npx --yes --allow-git=all github:qwe840608/agy-skill

# 移除（只刪 agy-skill 資料夾，不碰其他東西）
npx --yes --allow-git=all github:qwe840608/agy-skill uninstall
```

**給 AI agent**，把下面這段貼給 Claude Code、Codex、OpenCode 或 Antigravity：

```text
請執行 `npx --yes --allow-git=all github:qwe840608/agy-skill` 把 agy-skill（教你如何派工給 Google Antigravity CLI 的 skill）安裝到本機所有 agent 的全域技能目錄，接著執行 `npx --yes --allow-git=all github:qwe840608/agy-skill doctor` 驗證安裝狀態。
```

預設安裝位置：

1. **Antigravity（App / `agy` CLI / IDE）**：`~/.gemini/config/skills/agy-skill`
2. **Claude Code**：`~/.claude/skills/agy-skill`
3. **OpenAI Codex CLI**：`~/.codex/skills/agy-skill`
4. **OpenCode**：`~/.config/opencode/skills/agy-skill`

只有 `SKILL.md` 的 `description` 欄位會在地化（繁體中文或英文）；正文與 `references/` 一律英文，確保每個 agent 讀到的是同一份指令。

---

## 安全模型一覽

用白話整理 `SKILL.md` 要 agent 遵守的規則。完整技術細節（確切 flag、允許清單語法）在 `SKILL.md` 第 1 到 4 節；兩邊若有出入，以 `SKILL.md` 為準。

| 任務類型 | `agy` 模式 | `agy` 可以碰什麼 | **不可以**做什麼 | agent 必須停下來問使用者 | agent 怎麼驗證 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **唯讀**（摘要影片／圖片／音訊、審查程式碼或計畫） | `--mode plan --sandbox` | 只能讀工作資料夾內的檔案（`read_file($DIR)`） | 寫任何東西；跑 shell 指令；讀 `$DIR` 以外的檔（包括存 OAuth token 的 `~/.gemini`） | 任務本身不需要 | 讀 `agy-err.txt`，再把 Gemini 的說法對照原始素材 |
| **寫檔**（草稿、生成圖片） | `--mode accept-edits --sandbox` | 只能讀寫 `$DIR` 內（`read_file`、`write_file`） | 寫到 `$DIR` 以外；跑 shell 指令 | 產出要送到使用者電腦以外的地方之前 | 打開產出的檔案，對照輸入檢查事實 |
| **瀏覽器**（在使用者的 Chrome 裡用 `/browser`） | `--mode accept-edits --sandbox` | 列出的 `chrome_devtools` 工具、任務指定的網域、`$DIR` | `evaluate_script`；萬用字元的工具或網域規則；其他網站上的任何動作 | **一律**先問：登入、輸入密碼或付款資料、送出表單、發文、購買、刪除 | 截圖逐步對照任務清單，再把讀回的文字對照截圖 |

三種任務共通：

- 永遠不用 `--dangerously-skip-permissions`。權限來自 `--settings` 明確給的允許清單；print 模式下不在清單上的工具會被自動拒絕。
- 提示詞一律寫「Do not run any terminal commands」，除非有特別給 `command(<prefix>)` 規則。
- exit code 0 不代表成功。agent 回報前要自己讀 `agy-err.txt` 和產出檔。

這些是 skill 指示 agent 遵守、而且在下方列出的實測中跑過的規則。它們不代表 `agy`、Gemini 或 Chrome 在其他意義上是安全的：允許清單由 `agy` 執行，「停下來問」這條線則靠 host agent 照指示做。

---

## 相容性矩陣

只有實際跑過的組合才標已驗證。其他都算未測，即使預期同一條指令應該能用。

| Agent / 作業系統 | 安裝、`doctor`、移除 | `agy -p` 唯讀 | `agy -p` 寫檔 | `/browser`（Chrome） |
| :--- | :--- | :--- | :--- | :--- |
| **Claude Code / Windows 11** | ✅ 2026-11-09 驗證，agy 1.5.3 | ✅ 2026-11-09 驗證，agy 1.5.3（auto mode 未被攔） | ✅ 2026-11-09 驗證，agy 1.5.3 | ✅ 2026-11-09 驗證，agy 1.5.3 + Chrome 157 |
| **Antigravity / Windows 11** | ✅ 安裝 2026-11-09 驗證（`doctor` 看得到 skill） | ⏳ 未測 | ⏳ 未測 | ⏳ 未測 |
| **OpenAI Codex / Windows 11** | ✅ 安裝 2026-11-09 驗證（`doctor` 看得到 skill） | ⏳ 未測 | ⏳ 未測 | ⏳ 未測 |
| **OpenCode / Windows 11** | ✅ 安裝 2026-11-09 驗證（`doctor` 看得到 skill） | ⏳ 未測 | ⏳ 未測 | ⏳ 未測 |
| **任何 agent / macOS** | 🤖 僅 CI（`macos-latest` 上的安裝器測試，無真實 `agy`） | ⏳ 未測 | ⏳ 未測 | ⏳ 未測 |
| **任何 agent / Linux** | 🤖 僅 CI（`ubuntu-latest` 上的安裝器測試，無真實 `agy`） | ⏳ 未測 | ⏳ 未測 | ⏳ 未測 |

圖例：✅ 由人用所列版本實跑過；🤖 由自動化測試在暫存 home 目錄中覆蓋（只有安裝器的程式路徑）；⏳ 尚未跑過。

已知平台差異（都寫在 `SKILL.md` 第 0 節與第 2 節）：

- **執行檔路徑**：`PATH` 上的 `agy`，否則 Windows 是 `%LOCALAPPDATA%\agy\bin\agy.exe`，macOS／Linux 是 `~/.local/bin/agy`。可用 `AGY_BIN` 覆寫。
- **關閉 stdin**：POSIX shell（含 Git Bash）用 `</dev/null`；PowerShell 用 `cmd /c "agy ... < NUL"`。
- **Chrome 的 user-data 資料夾**（檢查 `DevToolsActivePort` 用）每個作業系統不同。
- Codex 預設在自己的沙盒裡跑指令；`agy` 需要在主機端不加沙盒執行（它要讀 `~/.gemini` 並綁定本機 port）。見 `references/cli-and-headless.md` 第 5.2 節。

回報問題時請附上：作業系統與版本、agent 名稱與版本、`agy --version`、確切指令（路徑可遮蔽），以及 `agy-err.txt` 的內容。

---

## Agent 拿到之後怎麼用

1. 把輸入檔放進同一個工作資料夾，寫一份簡短的任務簡報。
2. 執行 `SKILL.md` 第 1 節的標準指令（Chrome 任務用第 2 節），`--settings` 只允許該資料夾的 `read_file`／`write_file`；瀏覽器任務再加上必要的 `chrome_devtools` 工具與網域。
3. 自己讀 `agy-err.txt` 與產出的檔案、驗證內容，確認無誤才回報使用者。

附簡報、權限與驗證步驤的完整範例：[EXAMPLES_tw.md](EXAMPLES_tw.md)（繁體中文）與 [references/examples.md](references/examples.md)（英文，隨 skill 一起安裝）。

---

## 目錄結構

```text
agy-skill/
├── package.json                       # npm 設定；scripts：test、pack:check、sync（不碰 git）、sync:push
├── bin/
│   └── cli.mjs                        # 安裝器、doctor、快照產生器、多 agent 同步
├── test/
│   ├── cli.test.mjs                   # node:test 測試：install / uninstall / doctor / sync（暫存 home，無 agy）
│   └── pack-check.mjs                 # 確認 `npm pack` 會打包正確的檔案
├── .github/workflows/ci.yml           # 在 Ubuntu、Windows、macOS × Node 18/20/22 跑上述檢查
├── SKILL.md                           # skill 本體：安全指令、瀏覽器任務、五條規則、允許清單格式
├── EXAMPLES_tw.md                     # references/examples.md 的繁體中文版
├── AGENTS.md                          # agent 修改本倉庫時的維護規則
├── README.md                          # 英文說明
├── README_tw.md                       # 本檔（繁體中文）
├── LICENSE                            # MIT
├── version-state.json                 # 上次 sync 記錄的 agy 版本、help 雜湊、內建 skill 雜湊
└── references/
    ├── examples.md                    # 四個可複製的簡報範例，附權限與驗證步驟
    ├── cli-and-headless.md            # 全部 flag 與子命令、主機與 agy 的分工、簡報寫法、疑難排解
    ├── customizations.md              # agy 自己的 skills/rules/plugins 載入位置、優先順序、skills.json
    ├── hooks-plugins-mcp.md           # hooks.json 合約、plugin.json、mcp_config.json
    └── version-snapshot.md            # 自動產生：agy --help、help <子命令>、models、changelog、內建雜湊
```

---

## 維護者說明

**測試**：`npm test` 會在暫存 home 目錄（`AGY_SKILL_HOME`）裡跑安裝、移除、`doctor` 與 `sync --no-git`，`AGY_BIN` 指向不存在的檔案，所以不需要真的 `agy` 或登入。`npm run pack:check` 確認套件會包含所有必要檔案、不包含測試與 CI 檔。CI 在每次 push 與 pull request 都會跑這兩項。

**`agy` 更新後同步**（在倉庫目錄下執行，或對 agent 說「更新 agy-skill」）：

```bash
npm run sync
```

這會查詢本機 `agy`（`--version`、`--help`、`help <子命令>`、`models`、`changelog`、內建 skill 雜湊），重寫 `references/version-snapshot.md` 與 `version-state.json`，再把 skill 複製到每個本機 agent 目錄。**不會** commit 或 push。看過 diff、必要時更新說明文件後，再用下面這個發佈：

```bash
npm run sync:push
```

**npm 發布（尚未進行）**：`prepublishOnly` 會先跑測試與打包檢查，`npm publish` 不可能送出壞掉的套件。第一次發布前還剩這幾步：用維護者的 npm 帳號登記 `agy-skill` 名稱；決定一套和 `agy` 版本脫鉤的版號（目前 `package.json` 跟著 agy 寫 `1.5.3`，會誤導）；在乾淨機器上用發布出去的 tarball 跑一次安裝與 `doctor`。沒有任何東西會自動發布。

---

## 授權條款

本專案採用 [MIT License](LICENSE) 授權。
