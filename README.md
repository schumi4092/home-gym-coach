# Home Gym Coach

一個專為居家啞鈴訓練設計的離線紀錄工具，跑在本機瀏覽器，資料存在本機，不需要帳號或網路。

## 功能

- 4 天課表循環（上半身 A/B、下半身 A/B）
- 訓練中記錄每組次數與 RPE
- 自動建議下次重量（根據完成情況與 RPE）
- 進度追蹤圖表
- 匯出訓練報告（Markdown 格式，可貼到 Notion/Obsidian）
- 完全離線，資料存在本機

## 安裝方式（Windows）

### 方法一：安裝版（建議）

下載 `home-gym-coach-setup.exe`，雙擊執行，自動安裝並在桌面建立捷徑。

### 方法二：免安裝攜帶版

下載 `my-workout-portable` 資料夾，執行其中的 `open-workout.bat`。

## 開發

```bash
npm install
npm run dev
```

### 打包

```bash
# 打包成攜帶版資料夾
powershell -File package-portable.ps1

# 打包成 .exe 安裝檔
powershell -File package-exe.ps1
```

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

課表可在「編輯課表」中自由修改動作、組數、次數範圍與重量。
