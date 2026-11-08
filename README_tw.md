# agy-skill — AI Agent 專用的 Google Antigravity 全方位技能包

[English](README.md) | 繁體中文

**`agy-skill`** 是一套專為 **Claude Code**、**OpenAI Codex**、**OpenCode**、**Cursor** 以及 **Google Antigravity** 本身所設計的「全方位 Antigravity 操作與開發技能包（Universal Agent Skill）」，完整涵蓋 **Antigravity 2.0 桌面版**、**`agy` CLI**、**Antigravity IDE**、**Python SDK** 與 **客製化系統（Customizations）**。

---

## 核心功能與涵蓋領域

| 領域 | `agy-skill` 提供的能力 |
| :--- | :--- |
| **跨 Agent 調度 `agy` CLI** | 完整涵蓋 `agy -p` (`--print`)、`--output-format json\|stream-json`、`--json-schema` 結構化輸出、`--mode (plan\|accept-edits\|auto)`、`--effort (low..max)`、`--sandbox`、`-c` / `--conversation`，讓 Claude/Codex/OpenCode 能將 `agy` 當作強大子代理調用。 |
| **CLI 完整子命令與 ACP** | 完整收錄 `agy acp` (Agent Client Protocol stdio JSON-RPC server)、`agy mcp`、`agy plugin` (含 `import [claude\|gemini]`、`category` 驗證、symlink 支援)、`agy models`、`agy agents`、`agy remote-control`、`agy mic-serve`。 |
| **Antigravity 2.0 App & IDE** | 涵蓋 Antigravity 2.0 桌面版（Sidebar、Chat Canvas `/` 斜線指令與 `@` 提及、HTML Auxiliary Pane、全域與專案級 Sandbox/權限策略）與 Antigravity IDE（Tab/Supercomplete、`Ctrl+I`、Code Lenses）。 |
| **5 大客製化體系深度規範** | 完整規範 `.agents/` 與 `~/.gemini/config/` 5 層載入優先順序、**Rules** (24KB 單檔上限 / 20,000 tokens 預算降級)、**Skills** (`skills.json`)、**Plugins** (`plugin.json`、Language Server `GetAllPlugins` RPC 與 `customization://<dir>` 規範)、**Hooks** (`hooks.json` 6 大事件與 camelCase stdin/stdout 合約、`PLUGIN_ROOT`/`PLUGIN_DATA`)、**MCP** (Stdio 與 Streamable HTTP，棄用舊版 SSE)。 |
| **Sidecars、排程自動化與 Generative UI** | 完整涵蓋 `~/.gemini/config/sidecars/<id>/sidecar.json` (`builtin: "schedule"`, `CRON_TZ`, `agentapi new-conversation`, 最小權限 `access_grants`)、UI Plugin Panes (`sidecar://`)、以及內嵌式 Generative UI (`<agent-embed>` 與 gstatic Tailwind 規範)。 |
| **Python SDK (`google-antigravity`)** | 涵蓋 `Agent`、`LocalAgentConfig`、`CapabilitiesConfig`、非同步串流 `thoughts` 與 `tool_calls`。 |
| **版本自動追蹤與多 Agent 同步** | 內建 `scripts/update-and-sync.mjs`，一鍵自省本機 `agy` 版本、flags、models、changelog 與內建 skills 雜湊值，自動更新快照、同步至四大 Agent 全域目錄，並自動 Commit & Push 至 GitHub。 |

---

## 目錄結構

```text
agy-skill/
├── SKILL.md                           # 核心技能入口（Progressive Disclosure 導覽與跨 Agent 快速指令）
├── AGENTS.md                          # Agent 維護守則（強制更新與 GitHub 同步規範）
├── README.md                          # 英文主要說明文檔 (Primary English README)
├── README_tw.md                       # 繁體中文說明文檔
├── version-state.json                 # 自動記錄當前 agy 版本、CLI flags 與內建 skills SHA-256 指紋
├── references/
│   ├── cli-and-headless.md            # agy CLI 完整參數、Headless JSON/NDJSON 串流、ACP Server 指南
│   ├── app-and-ide.md                 # Antigravity 2.0 桌面版與 Antigravity IDE 完整操作與權限設定
│   ├── customizations.md              # 5 大客製化體系、優先權、Rules 預算、skills.json
│   ├── hooks-plugins-mcp.md           # hooks.json 6 大事件合約、plugin.json、LS RPC、mcp_config.json
│   ├── sidecars-ui-sdk.md             # Scheduled Automations (sidecar.json)、UI Panes、Generative UI、Python SDK
│   └── version-snapshot.md            # 由腳本自動從本機 agy 擷取的最新 CLI / Models / Changelog 快照
└── scripts/
    ├── update-and-sync.mjs            # 跨平台自動自省、更新快照、安裝至各 Agent 並同步 GitHub 的核心腳本
    ├── update-and-sync.ps1            # Windows PowerShell 啟動腳本
    └── update-and-sync.sh             # macOS / Linux Bash 啟動腳本
```

---

## 一鍵安裝與跨 Agent 自動同步（Claude Code / Codex / OpenCode / Antigravity）

Clone 本專案並執行同步腳本，即可自動擷取本機最新 Antigravity 狀態，並安裝（或更新）到本機所有主流 Agent 的全域技能目錄：

```bash
git clone https://github.com/qwe840608/agy-skill.git
cd agy-skill

# 一般使用者：僅更新與安裝至本機各 Agent 全域目錄（不執行 Git commit/push）
node scripts/update-and-sync.mjs --no-git

# 維護者：自省本機 Antigravity、同步至本機各 Agent 並自動 Commit & Push 至 GitHub
node scripts/update-and-sync.mjs

# 或使用 Windows PowerShell 啟動腳本
pwsh -File scripts/update-and-sync.ps1
```

腳本會自動將 `agy-skill` 同步部署至：
1. **Antigravity (App 2.0 / `agy` CLI / IDE)**：`~/.gemini/config/skills/agy-skill`
2. **Claude Code**：`~/.claude/skills/agy-skill`
3. **OpenAI Codex CLI**：`~/.codex/skills/agy-skill`
4. **OpenCode**：`~/.config/opencode/skills/agy-skill`

> **每次 Antigravity 更新時**：只需對任何 Agent 說「**更新 agy-skill**」或執行 `node scripts/update-and-sync.mjs`，即可自動比對新版 CLI flags、Models、Changelog 與內建文件差異，更新此 Skill 並自動推上 GitHub Repo！

---

## 授權條款 (License)

MIT
