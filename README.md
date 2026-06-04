# Last Session AI

> 智能分頁恢復管理 · Chrome 及 Edge 擴充功能 (MV3)

## 簡介

瀏覽器關閉後再次開啟時，原廠設定只能選擇「全部恢復」或「全部不恢復」。**Last Session AI** 讓你能夠自主選擇哪些分頁要恢復，在分頁列表中自由勾選、分批操作，不再被綁架。

不僅還原分頁，更可進行**智能去重、分組優化、跨會話管理**，讓瀏覽體驗更高效。

## 瀏覽器相容性

| 瀏覽器 | 支援狀態 | 說明 |
|--------|---------|------|
| ✅ Google Chrome | 完整支援 | 核心目標平台，Chrome 100+ (MV3) |
| ✅ Microsoft Edge | 完整支援 | Edge 111+ 完整支援；Edge 118+ 含 AI 優化功能 |
| ❌ Firefox | 不支援 | 未移植至 Manifest V2/V3 for Firefox |

### Edge 相容性細節

- **Edge 118+**：全部功能正常，含 Offscreen AI 優化
- **Edge 111~117**：AI 優化功能降級（Offscreen API 不支援），其餘功能正常
- **Edge < 111**：不支援 MV3 `type:module` Service Worker

## 功能特性

### ✅ 核心功能（已實作）

| 功能 | 說明 |
|------|------|
| **會話記錄** | 自動記錄每次視窗關閉時的分頁狀態，按時間排序瀏覽 |
| **選擇性恢復** | 在列表中自由勾選要恢復的分頁，批次開啟或刪除 |
| **多重去重** | 支援三種去重模式：完全匹配、忽略查詢參數、相同網域 |
| **分頁分組管理** | 支援 pinned、grouped、general 三區分類，可自由移動 |
| **主題切換** | 淺色 / 深色 / 跟隨系統，CSS 變數驅動即時切換 |
| **四種點擊行為** | 上次關閉分頁、最近關閉頁面、開啟 Last Session、開啟選項 |
| **最近關閉頁面** | 整合 Chrome Sessions API，一鍵恢復最近關閉的分頁 |
| **全域搜尋** | 跨所有會話依標題或網址即時篩選 |
| **區塊排序** | 各區塊分別支援依標題、網址、時間排序（正序/倒序） |
| **折疊動畫** | 會話區塊可折疊展開，CSS Grid 流暢動畫 |
| **快捷鍵支援** | 預設 `Alt+R` 開啟 Last Session |
| **國際化** | 繁體中文 + English 完整語系支援（119 keys） |

### 🚧 開發中功能

| 功能 | 進度 |
|------|------|
| 舊版儲存格式遷移 | 🔄 進行中 |
| AI 智能分組與去重（Phase 2） | ⏳ 待完善 |
| 雲端同步（Google Drive / OneDrive, Phase 2） | ⏳ 待串接 OAuth2 |
| Edge 端雲端同步解決方案（Phase 2） | 📝 列入評估 |
| 邊界情況處理（瀏覽器崩潰、快速關閉視窗） | 🔄 進行中 |

### 📋 已封存功能

- 右鍵選單
- 瀏覽器通知
- 拖放排序
- 圖標字體（已替換為內聯 SVG）

## 專案架構

### 三層架構設計

```
┌─────────────────────────────────────┐
│  UI 層 (src/popup/, src/options/)    │
│  Popup | Options | Recent           │
├─────────────────────────────────────┤
│  協調層 (src/background.js)          │
│  Message Router · 生命週期管理        │
├─────────────────────────────────────┤
│  服務層 (src/lib/)                   │
│  Sessions | Tabs | Storage | AI     │
│  Sync | Identity | OffscreenManager │
└─────────────────────────────────────┘
```

### 核心模組

| 模組 | 職責 | 檔案 |
|------|------|------|
| Sessions | 會話 CRUD、去重、優化、瀏覽器重啟偵測 | `src/lib/sessions.js` |
| Tabs | 分頁 CRUD、快取、批次操作、三區分類 | `src/lib/tabs.js` |
| TabGroups | 分頁群組 CRUD、快取 | `src/lib/tab-groups.js` |
| Storage | chrome.storage.local 封裝 | `src/lib/storage.js` |
| AI Service | OpenAI 相容 API 呼叫 | `src/lib/ai-service.js` |
| Offscreen Manager | Offscreen 文件生命週期 | `src/lib/offscreen-manager.js` |
| Sync Manager | 雲端同步協調 | `src/lib/sync-manager.js` |
| Identity Service | Google OAuth2 認證 | `src/lib/identity-service.js` |
| Action System | 四種點擊行為插件式架構 | `src/lib/action/func-type/` |

## 技術棧

| 技術 | 用途 |
|------|------|
| Chrome Extension MV3 | 擴充功能平台（Chrome / Edge 均相容） |
| ES6+ JavaScript (Modules) | 全部原始碼 |
| LESS | CSS 預處理器 |
| CSS Variables | 動態主題 |
| Chrome Offscreen API | AI 離線處理 |
| Chrome Identity API | Google OAuth2 |
| Chrome Sessions API | 最近關閉分頁 |
| Chrome Tab Groups API | 分頁群組管理 |
| OpenAI-compatible API | AI 分頁優化 |
| Google Drive REST API | 雲端同步後端 |
| Webpack | 建置工具 |
| i18n (Chrome) | 國際化 |

## 開發者指南

### 快速開始

```bash
npm install
npm run build
```

然後在 Chrome 或 Edge 的擴充功能管理頁面開啟「開發者模式」，載入 `dist/` 目錄。

### 可用指令

| 指令 | 說明 |
|------|------|
| `npm run dev` | 開發模式建置 |
| `npm run build` | 正式模式建置 |
| `npm run lint` | ESLint 程式碼檢查 |

## 離線安裝

1. 將擴充功能下載到本地
2. 開啟瀏覽器擴充功能的「開發者模式」
3. 點擊「載入已解壓縮的擴充功能」，選擇專案 `dist/` 目錄

## 授權

請參閱 [LICENSE](LICENSE) 文件。

---

## 致謝

本專案基於 [browser-extension-last-session](https://github.com/Sean-214/browser-extension-last-session) 原始項目進行改良與擴展。

因為很喜歡這個專案的想法，所以我嘗試用 Vibe Coding 的方式，從一個程式開發門外漢的角度，試著開發自己覺得可以再優化的版本。從無到有理解 Chrome Extension 的運作原理、MV3 架構、非同步訊息傳遞、甚至是 AI API 的串接，每一步都是學習。

可能還有許多不足之處，但對於一個非開發者來說，能夠從中學習成長，並把這個作品發佈出來，已經是我很大的成就感了。

感謝原始開發者 Sean-214 的靈感，也感謝這個過程中所有幫助過我的開源專案與社群資源。

---

<p align="center">
  <strong>v1.0.0</strong> · Chrome / Edge · <a href="https://github.com/ainlee/last-session_AI">GitHub</a>
</p>
