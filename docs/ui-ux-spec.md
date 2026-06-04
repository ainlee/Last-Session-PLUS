# UI/UX 設計規範 (UI/UX Design Specification)

本文件定義了 Last Session AI 的統一視覺語言與交互規範，旨在確保所有頁面（Options, Popup, Recent）在視覺上保持一致性，並提供高品質的用戶體驗。

## 1. 配色方案 (Color Palette)

本專案採用動態主題系統，支援 **淺色 (Light)**、**深色 (Dark)** 與 **系統 (System)** 三種模式。所有顏色應優先使用 CSS 變數 (`var(--...)`)。

### 1.1 核心顏色定義

| 角色 | 變數名稱 | 淺色模式 (Light) | 深色模式 (Dark) | 說明 |
| :--- | :--- | :--- | :--- | :--- |
| **主色 (Accent)** | `--accent-color` | `#0066cc` | `#76aad4` | 用於按鈕、標題、重點文字 |
| **背景色 (BG)** | `--bg-color` | `rgba(255, 255, 255, 0.7)` | `rgba(24, 26, 27, 0.7)` | 頁面主背景 (半透明) |
| **表面色 (Surface)** | `--header-bg` | `rgba(255, 255, 255, 0.5)` | `rgba(24, 26, 27, 0.5)` | 導航欄、頁尾、輸入框背景 |
| **文字主色** | `--text-color` | `#2b2b2b` | `#cbc7bf` | 正文、標題 |
| **文字輔助色** | `--text-color-muted` | `#666666` | `#bdb8af` | 提示文字、次要資訊 |
| **邊框色** | `--border-color` | `rgba(0, 0, 0, 0.1)` | `rgba(255, 255, 255, 0.1)` | 分隔線、一般邊框 |
| **懸停背景** | `--bg-color-hover` | `rgba(231, 245, 255, 0.5)` | `rgba(44, 46, 47, 0.5)` | 列表項、按鈕懸停狀態 |

---

## 2. 樣式指南 (Style Guide)

### 2.0 視窗尺寸規範
- **最近關閉頁面 (`recent.html`)**: 統一尺寸為 `400px` (寬) x `600px` (高)。

### 2.1 圓角 (Border Radius)
- **主容器/卡片 (`--radius-main`)**: `12px` (用於大型區塊、導引指南)
- **元件/項目 (`--radius-item`)**: `8px` (用於按鈕、輸入框、列表項)
- **微小元件**: `4px` (用於滾動條 thumb、小標籤)

### 2.2 陰影與深度 (Shadow & Depth)
- **懸停提升**: 當項目被 hover 時，使用輕微陰影並向上位移。
  - `transform: translateY(-1px);`
  - `box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);`

### 2.3 間距 (Spacing)
- **頁面邊距**: 寬度 `92%`，最大寬度 `800px` (Options) / `960px` (Popup)。
- **區塊間距**: 
  - 設定分組 (`.settings-group`): `40px`
  - 表單項目 (`.form-item`): `16px`
  - 內部元件間隙: `8px` ~ `12px`
- **導航欄高度**: `60px` (Options/Popup) / `48px` (Recent)

### 2.4 動態效果 (Transitions)
- **標準速度 (`--transition-speed`)**: `0.2s`
- **適用範圍**: 背景色、文字顏色、邊框顏色、透明度、變換 (Transform)。

---

## 3. 毛玻璃效果規範 (Glassmorphism)

本專案的核心視覺特徵為「毛玻璃半透明質感」，應統一實作如下：

### 3.1 實作標準
- **背景色**: 使用 `--header-bg` (50% 透明度)。
- **模糊效果**: `backdrop-filter: blur(10px);` 及 `-webkit-backdrop-filter: blur(10px);`。
- **佈局模式**:
  - Header/Footer 採用 `position: absolute` 定位。
  - `.app-main` 增加對應的 `padding` 以防止內容被遮擋，並允許內容在下方滾動以觸發模糊效果。
- **邊框定義**:
  - 使用 `--glass-border` 增加邊緣銳利度。
  - 淺色: `1px solid rgba(255, 255, 255, 0.2)`
  - 深色: `1px solid rgba(0, 0, 0, 0.2)`

### 3.2 應用場景
- **頂部導航欄 (Header)**: 必須包含 `absolute` 定位與毛玻璃效果。
- **頁尾 (Footer)**: 必須包含 `absolute` 定位與毛玻璃效果以維持層次感。
- **列表項目 (List Item)**: 輕量級毛玻璃 (`rgba(255, 255, 255, 0.05)` + `var(--glass-border)`)。

---

## 4. RWD 自適應佈局指南

### 4.1 響應式斷點
- **手機端斷點**: `max-width: 600px`

### 4.2 佈局行為變更
| 元件 | 桌面端 (Desktop) | 手機端 (Mobile < 600px) |
| :--- | :--- | :--- |
| **Header 佈局** | `flex-direction: row` (左右分佈) | `flex-direction: column` (居中堆疊) |
| **內容寬度** | `width: 92%` | `width: 95%` |
| **表單項目** | `flex-direction: row` (標籤與內容並排) | `flex-direction: column` (垂直堆疊，寬度 100%) |
| **按鈕** | 根據內容自適應寬度 | 寬度 `100%` (Stretch) |
| **Header 高度** | 固定高度 (`60px` / `48px`) | `height: auto` (根據內容撐開) |

---

## 5. 元件實作標準

### 5.1 按鈕 (Buttons)
- **主按鈕 (`.btn`)**: 背景 `--accent-color`，文字白色，圓角 `8px`。
- **次要按鈕 (`.btn-small`)**:
  - **類名**: 統一使用 `.btn-small`。
  - **樣式**: 移除外框與底色，僅保留 `:hover` 反饋。
  - **定義位置**: `src/assets/components/header.less`。
- **危險按鈕 (`.btn-danger`)**: 邊框/文字 `#ff4d4f`，懸停時填充背景。

### 5.1.1 連結項目操作按鈕 — 狀態切換 (Link Item Action Toggle)
連結列表中的每個項目均提供刪除/復原操作按鈕，按鈕圖標根據當前 `removed` 狀態動態切換：

| 狀態 | 圖標 | 圖標類名 | 點擊行為 |
| :--- | :--- | :--- | :--- |
| **正常狀態** | 🗑️ 垃圾桶 | `icon-delete` | 發送 `setRemoved` 消息（`removed: true`），將連結標記為刪除狀態 |
| **刪除狀態** | ↩️ 復原箭頭 | `icon-restore` | 發送 `setRemoved` 消息（`removed: false`），將連結恢復為正常狀態 |

**實作要點**：
- 圖標切換由 `tab.removed` 屬性驅動，透過 `renderLinkItem` 渲染時動態決定顯示 `icon-delete` 或 `icon-restore`。
- `setRemoved` 消息 Payload 必須包含完整 `{ tabId, removed: boolean }`，否則 background 端無法正確更新狀態。
- 刪除狀態下的連結項目應有視覺區別（如降低透明度或添加刪除線），以提供清晰的狀態反饋。

### 5.2 表單輸入 (Inputs/Selects)
- **背景**: `--header-bg`
- **邊框**: `--border-color`
- **焦點狀態**: `border-color: var(--accent-color)` 且 `box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1)`
