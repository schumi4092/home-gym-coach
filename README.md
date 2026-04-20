# Home Gym Coach

居家啞鈴訓練的離線紀錄本。跑在本機瀏覽器，資料存在本機，不需要帳號也不需要網路。v0.3 起整體 UI 改採「編輯風格」設計 — 奶油色紙面 + 墨黑排版，搭配 Fraunces serif 與 IBM Plex Mono，像一本翻開的訓練手札。

![首頁截圖](docs/screenshot-home.png)
![訓練中截圖](docs/screenshot-workout.png)
![進度追蹤截圖](docs/screenshot-progress.png)

---

## 功能

### 紀錄
- 4 天課表循環（上半身 A/B、下半身 A/B），所有動作可自由編輯
- **三種方式登錄 reps**：+/− 步進、直接點數字輸入、以及排版式 quick-pick（依目標 rep range 自動產生）
- **熱身組**：「+ Warm-up set」加一組（自動置頂且標記 WU），「+ Add set」加一組正式組，「×」移除任一組；熱身組不計入訓練量、PR、RPE 與趨勢
- **課中動作替換**：訓練中可 swap 任意動作 — 從常用庫選或自訂動作（支援組數/次數/重量/單位）
- **筆記系統**：每個動作可寫單次訓練筆記；每次 session 有整體筆記欄
- **休息計時自動起跳**：登錄一組非熱身 reps 時，計時器自動依該動作的休息秒數倒數

### 分析
- 預估 1RM（Epley 公式）；每動作的訓練量 / e1RM 趨勢可切換
- 自動 Deload 建議：分析近 21 天 RPE 與 rep 走勢，首頁顯示疲勞警告橫幅
- 週 / 月趨勢：進度頁底部整體趨勢區，含訓練量柱狀圖、sessions、sets、分鐘、平均 RPE
- 智能 coaching hints：根據上次表現給出「可加重 / 先維持 / 先補下限 reps」等建議，熱身組自動排除

### 匯出 / 備份
- Markdown 報告匯出（貼到 Notion / Obsidian）
- JSON 備份 / 匯入（換電腦或清資料時用）
- 完全離線，資料存在本機 IndexedDB

---

## 安裝方式（Windows）

### 方法一：安裝版（建議）

至 [Releases](https://github.com/schumi4092/home-gym-coach/releases) 下載 `home-gym-coach-setup.exe`，雙擊執行，自動安裝並在桌面建立捷徑。

### 方法二：免安裝攜帶版

下載 `my-workout-portable` 資料夾，執行其中的 `open-workout.bat`。或自己打包：

```bash
powershell -File package-portable.ps1     # 生出 release/my-workout-portable/
powershell -File make-shortcut.ps1        # 在桌面建立捷徑
```

> **Mac / Linux**：打包版（`.exe`）僅限 Windows。Mac/Linux 請用 `npm run dev`，功能完全相同，只是沒有桌面捷徑。

> **建議瀏覽器**：請使用 Chrome 或 Edge 開啟。Opera、Brave 等瀏覽器的安全政策可能導致頁面空白。

---

## 資料儲存

- 資料存在瀏覽器的 **IndexedDB**（資料庫名稱 `home-gym`），容量可達數百 MB，不受 localStorage 5MB 限制
- 首次升級時會自動從 localStorage 遷移舊資料，無需手動操作
- 若瀏覽器不支援 IndexedDB，會自動退回 localStorage
- IndexedDB 是「origin-scoped」：資料綁在 `http://127.0.0.1:8765` 這個 origin。**dev server 也寫死跑在同一 port**，確保開發版能直接讀到打包版的舊資料
- 一般清除瀏覽器快取通常不影響資料，但若清除站點資料、重灌系統、或換電腦，資料可能遺失
- 請定期使用右上角「備份」功能匯出 JSON

### 備份與還原

| 操作 | 說明 |
|------|------|
| **備份** | 右上角「備份」→ 下載 `home-gym-backup-日期.json` |
| **匯入備份** | 右上角「匯入備份」→ 選擇 JSON 檔案 → 自動還原訓練紀錄與課表 |
| **匯出報告** | 右上角「匯出報告」→ 複製 Markdown 到剪貼簿 |

---

## 設計系統

v0.3 的編輯風格建立在這幾個 tokens 上（見 `src/constants/editorial-theme.js`）：

| Token | 值 | 用途 |
|-------|----|------|
| `TE.bg` | `#EEE8DA` | 紙面奶油底 |
| `TE.ink` | `#14130F` | 主要文字與 rule 線 |
| `TE.ink3` / `TE.ink4` | `#55534A` / `#857F6F` | 次級文字、細線 |
| `TE.accent` | `#C8501E` | 強調（警示、重點）|
| `TE.highlight` | `#F2E27A` | hover 與活躍狀態 |
| `TE.surface` | `#F5F0E2` | 面板底色 |

字體：**Fraunces**（標題、數字）+ **IBM Plex Mono**（標籤、meta、輸入框）。排版重視 hairline rule、masthead 分欄、uppercase 小標。

---

## 技術說明

### 架構

```
src/
  EditorialApp.jsx              # 主狀態容器（原 App.jsx 仍保留作為 fallback）
  views/
    EditorialHome.jsx           # 首頁 masthead + metric strip + 訓練週期 grid
    EditorialWorkout.jsx        # 三欄訓練畫面（動作列 / 專注動作 / 計時器）
    EditorialProgress.jsx       # 週月趨勢 + 單動作圖表 + session log
    EditorialProgramEditor.jsx  # 課表編輯
    EditorialHistoryEditor.jsx  # 歷史紀錄編輯
  components/
    EditorialExerciseCard.jsx   # 含 weight stepper + swap + 筆記
    EditorialSetRow.jsx         # rep stepper + click-to-type + typographic quick-pick
    EditorialTimer.jsx          # 休息計時器（autoStartKey 觸發）
  constants/editorial-theme.js  # 色票與樣式預設
  utils/
    coaching.js                 # hints + deload 偵測（熱身組已排除）
    dashboard.js                # 首頁 stats
    trends.js                   # 週/月 bucket 聚合
    workout.js                  # session schema + 正規化
  storage/index.js              # IndexedDB 封裝 + localStorage fallback
```

### 儲存機制

App 優先使用 IndexedDB，不支援時退回 localStorage。若 `window.storage` 存在則優先使用它（預留給未來原生儲存整合）。進度追蹤頁的紀錄列表在超過 8 筆時會自動啟用虛擬捲動。

### 伺服器

`serve-workout.ps1` 是一個純 PowerShell 實作的輕量 HTTP 伺服器，監聽 `127.0.0.1:8765`，用 runspaces 做併發請求處理。啟動時自動開啟瀏覽器，關閉 PowerShell 視窗即停止伺服器。若伺服器已在執行，再次點捷徑會直接開啟現有視窗。

Vite dev server 也強制綁在同樣的 `127.0.0.1:8765`（`vite.config.js` 裡的 `server.strictPort`），確保開發與打包版共用 IndexedDB origin。跑 `npm run dev` 前請確認 `open-workout.bat` 的 server 已關閉。

---

## 課表說明

預設課表為 4 天分化，適合有一組啞鈴的居家訓練：

| 天數 | 課表 | 重點 |
|------|------|------|
| 第 1 天 | 上半身 A | 胸肩推為主 |
| 第 2 天 | 下半身 A | 股四頭為主 |
| 第 3 天 | 休息 | |
| 第 4 天 | 上半身 B | 背部拉為主 |
| 第 5 天 | 下半身 B | 臀腿後側為主 |
| 第 6-7 天 | 休息 | |

課表可在「Program Editor」中自由修改動作、組數、次數範圍與重量。預設重量為初學者起始建議值，請依個人能力調整。訓練中若需臨時換動作，點動作卡右上的 **Swap** 即可。

---

## Changelog

### v0.3.0
- 整體 UI 改為編輯風格（奶油紙面 + 墨黑排版，Fraunces + IBM Plex Mono）
- 熱身組機制：用「+ Warm-up set」與「+ Add set」加組、× 移除，熱身組不計入訓練量 / PR / RPE / 趨勢 / coaching hints
- Rep 輸入強化：+/− 步進、點大數字直接打字、或從排版式 quick-pick（依目標 rep range 自動產生）選
- 新增 session note（單次訓練）與 exercise note（單次動作）欄位
- 休息計時器自動起跳：完成一組有效 reps 時自動倒數
- 課中動作替換：從常用庫選擇或自訂新動作
- Logo 重新設計為編輯風格槓鈴標記
- Vite dev server 綁定 `127.0.0.1:8765`，與打包版共用 IndexedDB 資料

### v0.2.0
- IndexedDB 儲存：取代 localStorage，容量大幅提升，自動遷移舊資料
- 預估 1RM：Epley 公式計算，進度頁新增 e1RM 統計卡片與圖表切換
- 自動 Deload 建議：分析近 21 天 RPE 趨勢與次數變化，首頁顯示疲勞警告橫幅
- 週 / 月趨勢分析：進度頁底部整體趨勢區塊，含訓練量柱狀圖、頻率與 RPE 進度條
- 虛擬捲動：進度頁紀錄列表超過 8 筆時自動啟用，提升長列表效能
- UI 優化：主題樣式重構、共用元件常數、卡片佈局改善

### v0.1.0
- JSON 備份 / 匯入功能
- 程式碼模組化拆分（components、views、utils、storage、constants）
- README 補充截圖、資料儲存說明、跨平台說明

### v0.0.1
- 首次發布：4 天課表、訓練記錄、RPE 追蹤、自動加重建議、進度圖表、Markdown 匯出、Windows 安裝檔

---

## 開發

```bash
npm install
npm run dev            # http://127.0.0.1:8765 (strict port)
npm run build          # 輸出到 dist/
npm run lint
```

### 打包

```bash
# 打包成攜帶版資料夾 (release/my-workout-portable/)
powershell -File package-portable.ps1

# 在桌面建立捷徑指向攜帶版
powershell -File make-shortcut.ps1

# 打包成 .exe 安裝檔
powershell -File package-exe.ps1
```
