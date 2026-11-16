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
2. 執行 `agy`，權限只開那個資料夾（Chrome 任務則把用不到的瀏覽器工具擋掉）。
3. 自己先讀 `agy` 的錯誤輸出和產出的檔案、核對事實，確認無誤才回報給你。

四個附完整提示詞的範例：[EXAMPLES_tw.md](EXAMPLES_tw.md)。

---

## agent 會遵守的安全規則

| 任務 | `agy` 可以… | `agy` **不可以**… | agent 要先問你才能… |
| :--- | :--- | :--- | :--- |
| 唯讀（摘要、審查） | 讀工作資料夾裡的檔案 | 寫任何東西、跑 shell 指令、讀資料夾以外的檔 | — |
| 寫檔（草稿、圖片） | 讀寫工作資料夾 | 寫到別的地方、跑 shell 指令 | 把結果送到你電腦以外的地方 |
| 瀏覽器（在你的 Chrome 用 `/browser`） | 開網頁、讀內容、截圖；任務需要時才點擊或打字 | 執行網頁腳本、使用任務已擋掉的瀏覽器工具 | 登入、輸入密碼或付款資料、送出表單、發文、購買、刪除 |

三種情況共通：不用 `--dangerously-skip-permissions`、權限來自明確的允許清單、exit code 0 不當作成功的證明。允許清單由 `agy` 執行；「先問你」這條線靠 agent 照指示做。完整技術細節在 [SKILL.md](SKILL.md)。

在 agy 1.5.9 實測到兩個缺口（Windows 11，2026-11-16）：除了工作資料夾，`agy` 還讀得到（寫檔任務則也寫得進）「執行指令時所在的資料夾」和系統暫存資料夾底下的檔案，即使這兩處都不在允許清單上。所以這個 skill 會要 agent 從工作資料夾裡面啟動 `agy`；任務執行期間，不要把敏感資料放在暫存資料夾。我們試過的其他資料夾，讀寫都有照表格被擋下。

瀏覽器任務在 agy 1.5.9 + Chrome 157 的實測（Windows 11，2026-11-16）：`agy` 不會限制瀏覽器開哪些網站，所以「只能待在這個網站」是 agent 寫進任務、再用截圖核對的指示，不是 `agy` 幫你擋的。擋掉某個工具則有效（測過點擊、打字、按鍵、執行網頁腳本）。`agy` 每次連上 Chrome，Chrome 都會要你按 **Allow**，所以瀏覽器任務需要你人在電腦前；另外 `agy` 會把這次瀏覽器操作錄成影片，存在 `~/.gemini/antigravity-cli/brain/` 底下。

---

## 測過的環境

| | 安裝／doctor／移除 | 唯讀任務 | 寫檔 | Chrome 任務 |
| :--- | :--- | :--- | :--- | :--- |
| **Claude Code，Windows 11** | ✅ 2026-11-16，agy 1.5.9 | ✅ 2026-11-16，agy 1.5.9 | ✅ 2026-11-16，agy 1.5.9 | ✅ 2026-11-16，agy 1.5.9，Chrome 157（開頁面、打字搜尋、截圖、讀回內容） |
| **Antigravity／Codex／OpenCode，Windows 11** | ✅ 只測安裝，2026-11-09 | 未測 | 未測 | 未測 |
| **macOS、Linux（任何 agent）** | 🤖 僅 CI 安裝器測試 | 未測 | 未測 | 未測 |

標「未測」的格子用的是同一套指令，預期能用，但還沒有人實際跑過。若遇到問題，請開 issue 並附上作業系統、agent、`agy --version`、你跑的指令，以及 `agy-err.txt` 的內容。

---

## 更多

- [SKILL.md](SKILL.md)：skill 本體，agent 讀的就是這份（英文）。
- [EXAMPLES_tw.md](EXAMPLES_tw.md)／[references/examples.md](references/examples.md)：完整範例。
- [MAINTAINING.md](MAINTAINING.md)：測試、CI、agy 更新後的同步、發布到 npm（英文）。
- [LICENSE](LICENSE)：MIT。
