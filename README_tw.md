# agy-skill

[English](README.md) | 繁體中文

[![npm](https://img.shields.io/npm/v/agy-skill.svg)](https://www.npmjs.com/package/agy-skill)
[![CI](https://github.com/qwe840608/agy-skill/actions/workflows/ci.yml/badge.svg)](https://github.com/qwe840608/agy-skill/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**教你的 AI 程式代理怎麼用 Google Antigravity CLI（`agy`）的 skill。**

裝一次，Claude Code、OpenAI Codex、OpenCode 或 Antigravity 本身就知道怎麼把工作透過 `agy` 交給 Gemini，不會卡死，也不會給過多權限。常見用途：看影片、圖片或音訊；生圖；寫草稿；請第二個模型審程式碼或計畫；操作你的 Google Chrome。

---

## 三步安裝

**1. 確認需求**

- Node.js 18 以上（`node --version`）。
- 已安裝 `agy` CLI，並在終端機執行過一次 `agy` 完成登入（[安裝說明](https://antigravity.google/docs/cli/install)）。

**2. 執行一行指令**

```bash
npx --yes agy-skill
```

這會把 skill 複製到你電腦上每個支援的 agent 的技能資料夾（Antigravity、Claude Code、Codex、OpenCode）。不會改其他東西。

**3. 檢查有沒有裝好**

```bash
npx --yes agy-skill doctor
```

應該會看到你的 `agy` 版本，和四行標著 `Installed`。重新啟動 agent 就完成了。

<details>
<summary>其他安裝選項（更新、移除、只裝一個 agent、只裝到專案、從 GitHub 而不是 npm）</summary>

```bash
# 更新到最新版
npx --yes agy-skill@latest

# 移除（只刪 agy-skill 資料夾）
npx --yes agy-skill uninstall

# 只裝給某些 agent：antigravity、claude、codex、opencode
npx --yes agy-skill install --agent claude,codex

# 只裝到目前專案（.agents/skills/agy-skill）
npx --yes agy-skill install --workspace

# 強制那行描述用英文或繁體中文
npx --yes agy-skill install --lang zh

# 直接從 GitHub 安裝（目前的 main），不經過 npm
npx --yes --allow-git=all github:qwe840608/agy-skill
```

或直接貼給你的 agent：「請執行 `npx --yes agy-skill`，再執行 `npx --yes agy-skill doctor`，把結果給我看。」

</details>

---

## 裝好之後會發生什麼

你不用自己打 `agy` 指令。照平常的方式跟 agent 說話，例如「請 Gemini 幫我摘要這支影片」或「請 Gemini 給這份計畫第二意見」，agent 會：

1. 把輸入檔放進一個工作資料夾，寫一份簡短的任務說明。
2. 執行 `agy`，權限只開那個資料夾（Chrome 任務再加上指定的瀏覽器工具和網站）。
3. 自己先讀 `agy` 的錯誤輸出和產出的檔案、核對事實，確認無誤才回報給你。

四個附完整提示詞的範例：[EXAMPLES_tw.md](EXAMPLES_tw.md)。

---

## agent 會遵守的安全規則

| 任務 | `agy` 可以… | `agy` **不可以**… | agent 要先問你才能… |
| :--- | :--- | :--- | :--- |
| 唯讀（摘要、審查） | 讀工作資料夾裡的檔案 | 寫任何東西、跑 shell 指令、讀資料夾以外的檔 | — |
| 寫檔（草稿、圖片） | 讀寫工作資料夾 | 寫到別的地方、跑 shell 指令 | 把結果送到你電腦以外的地方 |
| 瀏覽器（在你的 Chrome 用 `/browser`） | 在指定網站用列出的瀏覽器工具 | 執行網頁腳本、用萬用字元、碰其他網站 | 登入、輸入密碼或付款資料、送出表單、發文、購買、刪除 |

三種情況共通：不用 `--dangerously-skip-permissions`、權限來自明確的允許清單、exit code 0 不當作成功的證明。允許清單由 `agy` 執行；「先問你」這條線靠 agent 照指示做。完整技術細節在 [SKILL.md](SKILL.md)。

---

## 測過的環境

| | 安裝／doctor／移除 | 唯讀任務 | 寫檔 | Chrome 任務 |
| :--- | :--- | :--- | :--- | :--- |
| **Claude Code，Windows 11** | ✅ 2026-11-09，agy 1.5.3 | ✅ 2026-11-09，agy 1.5.3 | ✅ 2026-11-09，agy 1.5.3 | ✅ 2026-11-09，agy 1.5.3，Chrome 157 |
| **Antigravity／Codex／OpenCode，Windows 11** | ✅ 只測安裝，2026-11-09 | 未測 | 未測 | 未測 |
| **macOS、Linux（任何 agent）** | 🤖 僅 CI 安裝器測試 | 未測 | 未測 | 未測 |

標「未測」的格子用的是同一套指令，預期能用，但還沒有人實際跑過。若遇到問題，請開 issue 並附上作業系統、agent、`agy --version`、你跑的指令，以及 `agy-err.txt` 的內容。

---

## 更多

- [SKILL.md](SKILL.md)：skill 本體，agent 讀的就是這份（英文）。
- [EXAMPLES_tw.md](EXAMPLES_tw.md)／[references/examples.md](references/examples.md)：完整範例。
- [MAINTAINING.md](MAINTAINING.md)：測試、CI、agy 更新後的同步、發布到 npm（英文）。
- [LICENSE](LICENSE)：MIT。
