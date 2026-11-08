# agy-skill — 讓任何 AI Agent 都會用 Google Antigravity CLI

[English](README.md) | 繁體中文

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**`agy-skill`** 教 AI 程式代理（**Claude Code**、**OpenAI Codex**、**OpenCode**，以及 **Antigravity** 本身）如何用無頭模式（headless print mode）把工作安全地派給 **Google Antigravity CLI（`agy`）**，而且不會卡死。一行 `npx` 指令就能把同一份 skill 裝進每個 agent 的技能目錄，支援 **Windows、macOS、Linux**。

這個 skill 給 agent 的東西：

- **一條安全的標準指令**：`agy -p` 的唯讀版與可寫檔版，用 `--settings` 權限允許清單取代 `--dangerously-skip-permissions`，關閉 stdin、掛載工作資料夾、設定逾時。
- **常見任務**：看圖片、影片、音訊；生圖（`generate_image`）；寫草稿；請 Gemini 做第二模型的研究或審查。
- **瀏覽器任務**：用 `/browser` 操作使用者正在執行的 Google Chrome，附最小權限的 `chrome_devtools` 允許清單、使用者端的前置設定，以及「絕不登入、付款、發文、刪除」的硬規則。
- **五條防呆規則**：關 stdin、一定加 `--add-dir`、不跳過權限、沒允許就禁止跑指令、自己驗證輸出。
- **參考資料**：所有 flag 與子命令、JSON／NDJSON 輸出、怎麼寫任務簡報、疑難排解，以及（選用）如何設定 `agy` 自己的 skills、rules、plugins、hooks、MCP。
- **即時快照**：安裝機器上的 `agy --help`、`agy help <子命令>`、`agy models` 與最新 changelog。

---

## 跨平台一鍵安裝（Windows / macOS / Linux）

### 方式 A：終端機 `npx` 一鍵安裝（給人用）

需要 Node.js `>=18`。`agy` CLI 本身要先裝好，並且互動式執行過一次完成 Google 登入（見 https://antigravity.google/docs/cli/install）。

> **npm v12+（Node.js v25/v26+）注意**：新版 `npm` 預設禁止抓取 git 類型套件（會出現 `npm error code EALLOWGIT`）。透過 `npx github:...` 執行時請加上 `--allow-git=all`。

```bash
# 1. 全域安裝到所有支援的 agent（描述語言依系統語系自動選擇）
npx --yes --allow-git=all github:qwe840608/agy-skill

# 2. 手動指定技能描述語言（en | zh | both）
npx --yes --allow-git=all github:qwe840608/agy-skill install --lang zh
npx --yes --allow-git=all github:qwe840608/agy-skill install --lang en

# 3. 只裝到目前專案（.agents/skills/agy-skill）
npx --yes --allow-git=all github:qwe840608/agy-skill install --workspace

# 4. 只裝給指定的 agent（antigravity,claude,codex,opencode）
npx --yes --allow-git=all github:qwe840608/agy-skill install --agent antigravity,claude

# 5. 檢查 agy CLI 版本、系統語系與各 agent 的安裝狀態
npx --yes --allow-git=all github:qwe840608/agy-skill doctor

# 6. 移除
npx --yes --allow-git=all github:qwe840608/agy-skill uninstall
```

### 方式 B：直接貼給 AI Agent（給 agent 用）

把下面這段貼給 **Claude Code**、**Codex**、**OpenCode** 或 **Antigravity**：

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

## Agent 拿到之後怎麼用

1. 把輸入檔放進同一個工作資料夾，寫一份簡短的任務簡報。
2. 執行 `SKILL.md` 第 1 節的標準指令（Chrome 任務用第 2 節），`--settings` 只允許該資料夾的 `read_file`／`write_file`；瀏覽器任務再加上必要的 `chrome_devtools` 工具與網域。
3. 自己讀 `agy-err.txt` 與產出的檔案、驗證內容，確認無誤才回報使用者。

此 skill 已在 `agy` v1.5.3、Windows 11、Claude Code auto mode 驗證（2026-11-09）。其他平台 flag 相同，只差執行檔路徑與關閉 stdin 的方式，都寫在 `SKILL.md` 第 0 節。

---

## 目錄結構

```text
agy-skill/
├── package.json                       # npm 設定；`npm run sync`（不碰 git）與 `npm run sync:push`
├── bin/
│   └── cli.mjs                        # 安裝器、doctor、快照產生器、多 agent 同步
├── SKILL.md                           # skill 本體：安全指令、瀏覽器任務、五條規則、允許清單格式
├── AGENTS.md                          # agent 修改本倉庫時的維護規則
├── README.md                          # 英文說明
├── README_tw.md                       # 本檔（繁體中文）
├── LICENSE                            # MIT
├── version-state.json                 # 上次 sync 記錄的 agy 版本、help 雜湊、內建 skill 雜湊
└── references/
    ├── cli-and-headless.md            # 全部 flag 與子命令、主機與 agy 的分工、簡報寫法、疑難排解
    ├── customizations.md              # agy 自己的 skills/rules/plugins 載入位置、優先順序、skills.json
    ├── hooks-plugins-mcp.md           # hooks.json 合約、plugin.json、mcp_config.json
    └── version-snapshot.md            # 自動產生：agy --help、help <子命令>、models、changelog、內建雜湊
```

---

## 維護者同步

`agy` 更新時，在倉庫目錄下執行（或對 agent 說「更新 agy-skill」）：

```bash
npm run sync
```

這會查詢本機 `agy`（`--version`、`--help`、`help <子命令>`、`models`、`changelog`、內建 skill 雜湊），重寫 `references/version-snapshot.md` 與 `version-state.json`，再把 skill 複製到每個本機 agent 目錄。**不會** commit 或 push。看過 diff、必要時更新說明文件後，再用下面這個發佈：

```bash
npm run sync:push
```

---

## 授權條款

本專案採用 [MIT License](LICENSE) 授權。
