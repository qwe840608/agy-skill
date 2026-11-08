# agy-skill — AI Agent 專用的 Google Antigravity 全方位技能包

[English](README.md) | 繁體中文

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**`agy-skill`** 是一套專為 **Claude Code**、**OpenAI Codex**、**OpenCode**、**Cursor**、**Pi** 以及 **Google Antigravity** 本身所設計的「全方位 Antigravity 操作與開發技能包（Universal Agent Skill）」，完整涵蓋 **Antigravity 2.0 桌面版**、**`agy` CLI**、**Antigravity IDE**、**Python SDK** 與 **客製化系統（Customizations）**，全面支援 **Windows、macOS 與 Linux**。

---

## 跨平台一鍵安裝（Windows / macOS / Linux）

### 方式 A：終端機 `npx` 一鍵安裝（給開發者）

無須手動下載儲存庫，只要系統已安裝 Node.js (`>=18`)，在任何作業系統（CMD / PowerShell / Bash / Zsh）皆可透過一行指令一鍵安裝。

> **npm v12+ (Node.js v25/v26+) 注意事項**：新版 `npm` 預設禁止抓取 `git` 類型套件（會出現 `npm error code EALLOWGIT`）。透過 `npx github:...` 執行時請加上 `--allow-git=all`：

```bash
# 1. 一鍵全域安裝（自動部署至 Antigravity、Claude Code、OpenAI Codex、OpenCode）
npx --yes --allow-git=all github:qwe840608/agy-skill

# 2. 僅安裝至當前專案的工作區目錄 (.agents/skills/agy-skill)
npx --yes --allow-git=all github:qwe840608/agy-skill install --workspace

# 3. 僅安裝給指定的 Agent（以逗號分隔：antigravity,claude,codex,opencode）
npx --yes --allow-git=all github:qwe840608/agy-skill install --agent antigravity,claude

# 4. 檢查本機 agy CLI 版本與各 Agent 的技能安裝狀態
npx --yes --allow-git=all github:qwe840608/agy-skill doctor

# 5. 移除已安裝的 agy-skill
npx --yes --allow-git=all github:qwe840608/agy-skill uninstall
```

### 方式 B：直接貼給 AI Agent 自動安裝（For Agents）

直接將以下這段話貼給 **Claude Code**、**Codex**、**OpenCode** 或 **Antigravity**：

```text
請執行 `npx --yes --allow-git=all github:qwe840608/agy-skill` 將 Google Antigravity 通用技能包 (`agy-skill`) 安裝至本機所有 Agent 全域技能目錄，接著執行 `npx --yes --allow-git=all github:qwe840608/agy-skill doctor` 驗證安裝狀態。
```

預設情況下，`agy-skill` 會自動部署至：
1. **Antigravity (App 2.0 / `agy` CLI / IDE)**：`~/.gemini/config/skills/agy-skill`
2. **Claude Code**：`~/.claude/skills/agy-skill`
3. **OpenAI Codex CLI**：`~/.codex/skills/agy-skill`
4. **OpenCode**：`~/.config/opencode/skills/agy-skill`

---

## 核心功能與涵蓋領域

| 領域 | `agy-skill` 提供的能力 |
| :--- | :--- |
| **跨 Agent 調度 `agy` CLI** | 完整涵蓋 `agy -p` (`--print`)、**Lead vs. Brain** 雙協作模式、**5 大專家角色 (Personas)**（`ask`、`staffer`、`researcher`、`reviewer`、`implementer`）、原生工具調用（`generate_image` 生圖）、`--output-format json\|stream-json`、`--json-schema` 結構化輸出，以及 **5 大防卡死黃金鐵則**（`</dev/null` 關閉 stdin、`--add-dir` 顯式掛載工作區、防權限提示凍結、繞開宿主沙盒衝突、Git worktree 隔離）。 |
| **CLI 完整子命令與 ACP** | 完整收錄 `agy acp` (Agent Client Protocol stdio JSON-RPC server 與會話生命週期)、`agy mcp`、`agy plugin` (含 `import [claude\|gemini]`、`category` 驗證、symlink 支援)、`agy models`、`agy agents`、`agy remote-control`、`agy mic-serve`。 |
| **Antigravity 2.0 App & IDE** | 涵蓋 Antigravity 2.0 桌面版（Sidebar、Chat Canvas `/` 斜線指令與 `@` 提及、HTML Auxiliary Pane、全域與專案級 Sandbox/權限策略）與 Antigravity IDE（Tab/Supercomplete、`Ctrl+I`、Code Lenses）。 |
| **5 大客製化體系深度規範** | 完整規範 `.agents/` 與 `~/.gemini/config/` 5 層載入優先順序、**Rules** (24KB 單檔上限 / 20,000 tokens 預算降級)、**Skills** (`skills.json`)、**Plugins** (`plugin.json`、Language Server `GetAllPlugins` RPC 與 `customization://<dir>` 規範)、**Hooks** (`hooks.json` 6 大事件與 camelCase stdin/stdout 合約、`PLUGIN_ROOT`/`PLUGIN_DATA`)、**MCP** (Stdio 與 Streamable HTTP，棄用舊版 SSE)。 |
| **Sidecars、排程自動化與 Generative UI** | 完整涵蓋 `~/.gemini/config/sidecars/<id>/sidecar.json` (`builtin: "schedule"`, `CRON_TZ`, `agentapi new-conversation`, 最小權限 `access_grants`)、UI Plugin Panes (`sidecar://`)、以及內嵌式 Generative UI (`<agent-embed>` 與 gstatic Tailwind 規範)。 |
| **Python SDK (`google-antigravity`)** | 涵蓋 `Agent`、`LocalAgentConfig`、`CapabilitiesConfig`、非同步串流 `thoughts` 與 `tool_calls`。 |
| **版本自動追蹤與多 Agent 同步** | 內建 `bin/cli.mjs` (`npm run sync`)，一鍵自省本機 `agy` 版本、flags、models、changelog 與內建 skills 雜湊值，自動更新快照、同步至四大 Agent 全域目錄，並自動 Commit & Push 至 GitHub。 |

---

## 目錄結構

```text
agy-skill/
├── package.json                       # 跨平台 npm 套件設定與 CLI 執行檔註冊
├── bin/
│   └── cli.mjs                        # 跨平台一鍵安裝、狀態檢測 (doctor) 與自動更新同步 CLI
├── SKILL.md                           # 核心技能入口（委派決策樹、5 大防卡死黃金鐵則與漸進式導覽）
├── AGENTS.md                          # Agent 維護守則（強制更新與 GitHub 同步規範）
├── README.md                          # 英文主要說明文檔 (Primary English README)
├── README_tw.md                       # 繁體中文說明文檔
├── LICENSE                            # MIT 授權條款協議書
├── version-state.json                 # 自動記錄當前 agy 版本、CLI flags 與內建 skills SHA-256 指紋
└── references/
    ├── cli-and-headless.md            # agy CLI 完整參數、Lead/Brain 協作、5 大角色、ACP Server 與實戰除錯指南
    ├── app-and-ide.md                 # Antigravity 2.0 桌面版與 Antigravity IDE 完整操作與權限設定
    ├── customizations.md              # 5 大客製化體系、優先權、Rules 預算、skills.json 與第三方路徑避坑
    ├── hooks-plugins-mcp.md           # hooks.json 6 大事件合約、plugin.json、LS RPC、mcp_config.json
    ├── sidecars-ui-sdk.md             # Scheduled Automations (sidecar.json)、UI Panes、Generative UI、Python SDK
    └── version-snapshot.md            # 由 CLI 自動從本機 agy 擷取的最新 CLI / Models / Changelog 快照
```

---

## 維護者更新與自動同步

每當 Antigravity（`agy` CLI 或桌面版）更新時，只需對任何 Agent 說「**更新 agy-skill**」，或在儲存庫目錄下執行：

```bash
npm run sync
```

即可一鍵自動比對新版 CLI flags、Models、Changelog 與內建文件差異，更新 `references/version-snapshot.md`、同步至本機四大 Agent 全域目錄，並自動 Commit & Push 至 GitHub！

---

## 授權條款 (License)

本專案採用 [MIT License](LICENSE) 授權。
