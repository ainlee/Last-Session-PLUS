# 🎨 Last Session AI - Master Design System (MASTER.md)

本文件為本專案的視覺真理來源 (Single Source of Truth)。所有 UI 實作必須嚴格遵循此規範，禁止在 `.less` 文件中定義隨意值。

---

## 1. 色彩矩陣 (Color Matrix)

所有顏色必須通過對比度檢查 (WCAG 2.1 AA 標準 $\ge 4.5:1$)。

### 1.1 核心品牌色 (Brand Colors)

| 角色 | 變數 | 淺色模式 (Light) | 深色模式 (Dark) | 對比度 (L/D) | 說明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Primary** | `--color-primary` | `#2563EB` | `#60A5FA` | 7.2:1 / 5.8:1 | 品牌主色，用於關鍵操作、CTA 按鈕 |
| **Primary-Hover** | `--color-primary-hover` | `#1D4ED8` | `#93C5FD` | - | 懸停狀態 |
| **Primary-Active** | `--color-primary-active` | `#1E40AF` | `#BFDBFE` | - | 按下狀態 |
| **On-Primary** | `--color-on-primary` | `#FFFFFF` | `#0F172A` | 9.8:1 / 8.5:1 | 主色上的文字/圖標 |

### 1.2 表面與背景 (Surface & Background)

採用毛玻璃 (Glassmorphism) 階層系統，確保清晰的視覺深度。

| 角色 | 變數 | 淺色模式 (Light) | 深色模式 (Dark) | 模糊度 | 說明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Base BG** | `--color-bg-base` | `#F8FAFC` | `#0F172A` | 0px | 頁面底層背景 |
| **Surface L1** | `--color-surface-l1` | `rgba(255,255,255,0.85)` | `rgba(30,41,59,0.85)` | 12px | Header, 高層級卡片 |
| **Surface L2** | `--color-surface-l2` | `rgba(255,255,255,0.60)` | `rgba(51,65,85,0.60)` | 8px | 列表項, 輸入框, 中層級卡片 |
| **Surface L3** | `--color-surface-l3` | `rgba(255,255,255,0.40)` | `rgba(71,85,105,0.40)` | 4px | 次要區塊, 標籤背景 |
| **Border** | `--color-border` | `rgba(148,163,184,0.20)` | `rgba(148,163,184,0.15)` | - | 分隔線, 邊框 |
| **Border-Hover** | `--color-border-hover` | `rgba(148,163,184,0.40)` | `rgba(148,163,184,0.30)` | - | 懸停邊框 |

### 1.3 文字色彩 (Typography Colors)

| 角色 | 變數 | 淺色模式 (Light) | 深色模式 (Dark) | 對比度 | 說明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Text-Primary** | `--color-text-primary` | `#0F172A` | `#F1F5F9` | 15.2:1 / 14.8:1 | 正文、標題、主要內容 |
| **Text-Secondary** | `--color-text-secondary` | `#475569` | `#CBD5E1` | 7.1:1 / 6.8:1 | 輔助文字、描述 |
| **Text-Tertiary** | `--color-text-tertiary` | `#94A3B8` | `#64748B` | 4.5:1 / 4.6:1 | 提示文字、禁用狀態 |
| **Text-Inverse** | `--color-text-inverse` | `#FFFFFF` | `#FFFFFF` | - | 深色背景上的文字 |

### 1.4 狀態色彩 (Status Colors)

| 角色 | 變數 | 淺色模式 (Light) | 深色模式 (Dark) | 對比度 | 說明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Success** | `--color-success` | `#059669` | `#34D399` | 4.8:1 / 5.2:1 | 成功、完成狀態 |
| **Success-BG** | `--color-success-bg` | `rgba(5,150,105,0.10)` | `rgba(52,211,153,0.15)` | - | 成功背景 |
| **Warning** | `--color-warning` | `#D97706` | `#FBBF24` | 4.5:1 / 4.7:1 | 警告、注意狀態 |
| **Warning-BG** | `--color-warning-bg` | `rgba(217,119,6,0.10)` | `rgba(251,191,36,0.15)` | - | 警告背景 |
| **Error** | `--color-error` | `#DC2626` | `#F87171` | 5.1:1 / 4.9:1 | 錯誤、失敗狀態 |
| **Error-BG** | `--color-error-bg` | `rgba(220,38,38,0.10)` | `rgba(248,113,113,0.15)` | - | 錯誤背景 |
| **Info** | `--color-info` | `#0891B2` | `#22D3EE` | 4.6:1 / 5.0:1 | 資訊、提示狀態 |
| **Info-BG** | `--color-info-bg` | `rgba(8,145,178,0.10)` | `rgba(34,211,238,0.15)` | - | 資訊背景 |

---

## 2. 字體階層 (Typography)

使用系統原生字體棧，確保渲染速度與原生感。

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

| 級別 | 字級 (Size) | 字重 (Weight) | 行高 (Line-height) | 字母間距 | 應用場景 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | `20px` | `600` | `1.3` | `-0.01em` | 頁面主標題 (Options) |
| **Heading** | `16px` | `600` | `1.4` | `-0.005em` | 分組標題, Popup 標題 |
| **Body** | `14px` | `400` | `1.6` | `0` | 標準正文, 表單標籤 |
| **Body-Strong** | `14px` | `500` | `1.6` | `0` | 強調正文 |
| **Caption** | `12px` | `400` | `1.5` | `0.005em` | 提示文字, 狀態欄 |
| **Mono** | `13px` | `400` | `1.5` | `0` | URL, 日誌, 代碼 |

---

## 3. 間距與佈局 (Spacing & Layout)

採用 **Base-8 Grid System**。所有間距必須是 $4px$ 的倍數。

| 標記 | 數值 | 應用場景 |
| :--- | :--- | :--- |
| `space-0` | `0px` | 無間距 |
| `space-1` | `4px` | 微小元件間隙, 圖標與文字間距 |
| `space-2` | `8px` | 元件內部間距, 列表項間隙 |
| `space-3` | `12px` | 緊密表單項目間距 |
| `space-4` | `16px` | 標準表單項目間距, 標準 Padding |
| `space-5` | `20px` | 區塊內部間距 |
| `space-6` | `24px` | 區塊間距, 大型 Padding |
| `space-8` | `32px` | 大區塊分組間距 |
| `space-10` | `40px` | 頁面級別間距 |

---

## 4. 圓角與陰影 (Radius & Elevation)

### 4.1 圓角 (Border Radius)

| 級別 | 數值 | 應用場景 |
| :--- | :--- | :--- |
| `radius-none` | `0px` | 無圓角 |
| `radius-sm` | `4px` | 滾動條, 小標籤, Badge |
| `radius-md` | `8px` | 按鈕, 輸入框, 列表項 |
| `radius-lg` | `12px` | 主容器, 卡片, Modal |
| `radius-xl` | `16px` | 大型容器, 特殊卡片 |
| `radius-full` | `9999px` | 圓形按鈕, Avatar |

### 4.2 陰影與深度 (Shadow & Elevation)

| 級別 | 淺色模式 | 深色模式 | 應用場景 |
| :--- | :--- | :--- | :--- |
| `shadow-none` | `none` | `none` | 無陰影 |
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | `0 1px 2px rgba(0,0,0,0.15)` | 懸停提升 (Hover Lift) |
| `shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.10)` | `0 4px 6px -1px rgba(0,0,0,0.25)` | 彈窗, 高層級卡片 |
| `shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.10)` | `0 10px 15px -3px rgba(0,0,0,0.30)` | Modal, Dropdown |
| `shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.10)` | `0 20px 25px -5px rgba(0,0,0,0.35)` | 全屏覆蓋層 |

---

## 5. Header 組件規範 (Header Component Specification)

### 5.1 統一 Header 規格

所有頁面 (`popup`, `recent`, `options`) 必須共用此 Header 規格。

| 屬性 | 數值 | 說明 |
| :--- | :--- | :--- |
| **高度** | `56px` | 固定高度，確保跨頁面一致性 |
| **背景** | `var(--color-surface-l1)` | Surface L1 半透明背景 |
| **模糊度** | `backdrop-filter: blur(12px)` | 統一毛玻璃效果 |
| **邊框** | `border-bottom: 1px solid var(--color-border)` | 底部邊框 |
| **內邊距** | `0 var(--space-4)` | 左右內邊距 16px |
| **定位** | `position: sticky; top: 0` | 固定在頂部 |
| **Z-Index** | `10` | 確保在內容之上 |

### 5.2 Header 內容佈局

```css
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 var(--space-4);
  background: var(--color-surface-l1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.header-title {
  font-size: var(--text-heading);
  font-weight: 600;
  color: var(--color-text-primary);
}
```

### 5.3 導航按鈕規範

| 頁面 | 左側按鈕 | 右側按鈕 | 說明 |
| :--- | :--- | :--- | :--- |
| **popup** | 無 | 設置圖標 (⚙️) | 主入口，無返回按鈕 |
| **recent** | 返回圖標 (←) | 無 | 返回 Popup |
| **options** | 返回圖標 (←) | 無 | 返回 Popup |

**導航按鈕樣式**：
```css
.nav-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-speed);
}

.nav-button:hover {
  background: var(--color-surface-l2);
  color: var(--color-text-primary);
}

.nav-button:active {
  transform: scale(0.95);
}
```

---

## 6. 圖標系統 (Icon System)

### 6.1 SVG 圖標規範

**全面禁止使用 Emoji**。所有圖標必須使用 SVG。

**圖標規格**：
- **視口大小**: `24x24`
- **描邊寬度**: `2px`
- **圓角**: `stroke-linecap="round" stroke-linejoin="round"`
- **顏色**: 繼承 `currentColor`

**圖標尺寸**：
| 尺寸 | 數值 | 應用場景 |
| :--- | :--- | :--- |
| `icon-sm` | `16px` | 小按鈕內圖標, 緊密佈局 |
| `icon-md` | `20px` | 標準按鈕, 列表項圖標 |
| `icon-lg` | `24px` | Header 圖標, 大型按鈕 |

### 6.2 圖標映射表 (Icon Mapping)

| 功能 | 圖標名稱 | SVG 路徑 | 應用場景 |
| :--- | :--- | :--- | :--- |
| **返回** | `arrow-left` | `<path d="M19 12H5M12 19l-7-7 7-7"/>` | Recent/Options 返回 Popup |
| **設置** | `settings` | `<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>` | Popup 設置按鈕 |
| **最近** | `clock` | `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>` | 最近會話 |
| **關閉** | `x` | `<path d="M18 6L6 18M6 6l12 12"/>` | 關閉按鈕 |
| **檢查** | `check` | `<polyline points="20 6 9 17 4 12"/>` | 成功狀態 |
| **警告** | `alert-triangle` | `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>` | 警告狀態 |
| **錯誤** | `alert-circle` | `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>` | 錯誤狀態 |
| **資訊** | `info` | `<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>` | 資訊提示 |
| **搜尋** | `search` | `<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>` | 搜尋功能 |
| **刪除** | `trash-2` | `<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>` | 刪除操作 |
| **編輯** | `edit-2` | `<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>` | 編輯操作 |
| **複製** | `copy` | `<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>` | 複製操作 |
| **外部連結** | `external-link` | `<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>` | 外部連結 |
| **重新整理** | `refresh-cw` | `<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>` | 重新整理 |
| **更多** | `more-vertical` | `<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>` | 更多選項 |
| **選單** | `menu` | `<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>` | 選單按鈕 |
| **星號** | `star` | `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>` | 收藏/星號 |
| **下載** | `download` | `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>` | 下載操作 |
| **上傳** | `upload` | `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>` | 上傳操作 |
| **雲端** | `cloud` | `<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>` | 雲端同步 |
| **鎖定** | `lock` | `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>` | 鎖定狀態 |
| **解鎖** | `unlock` | `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>` | 解鎖狀態 |
| **眼睛** | `eye` | `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>` | 顯示密碼 |
| **眼睛關閉** | `eye-off` | `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>` | 隱藏密碼 |
| **播放** | `play` | `<polygon points="5 3 19 12 5 21 5 3"/>` | 播放操作 |
| **暫停** | `pause` | `<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>` | 暫停操作 |
| **停止** | `square` | `<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>` | 停止操作 |
| **音量** | `volume-2` | `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>` | 音量開啟 |
| **靜音** | `volume-x` | `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>` | 靜音狀態 |
| **縮小** | `minus` | `<line x1="5" y1="12" x2="19" y2="12"/>` | 縮小/減少 |
| **放大** | `plus` | `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>` | 放大/增加 |
| **篩選** | `filter` | `<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>` | 篩選功能 |
| **排序** | `arrow-up-down` | `<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="7.5 4.21 12 6.81 16.5 4.21"/><polyline points="7.5 19.79 7.5 14.6 3 12"/><polyline points="21 12 16.5 14.6 16.5 19.79"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>` | 排序功能 |
| **箭頭上** | `arrow-up` | `<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>` | 向上箭頭 |
| **箭頭下** | `arrow-down` | `<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>` | 向下箭頭 |
| **箭頭右** | `arrow-right` | `<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>` | 向右箭頭 |
| **箭頭左** | `arrow-left` | `<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>` | 向左箭頭 |

### 6.3 圖標使用範例

```html
<!-- 返回按鈕 -->
<button class="nav-button" aria-label="返回">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
</button>

<!-- 設置按鈕 -->
<button class="nav-button" aria-label="設置">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
</button>
```

---

## 7. 交互規範 (Interaction)

### 7.1 過渡動畫 (Transitions)

| 屬性 | 數值 | 說明 |
| :--- | :--- | :--- |
| **標準速度** | `0.2s ease-in-out` | 所有狀態切換統一速度 |
| **快速速度** | `0.15s ease-out` | 微交互 (Hover) |
| **慢速速度** | `0.3s ease-in-out` | 大型動畫 (Modal, Page Transition) |

### 7.2 懸停狀態 (Hover)

```css
/* 標準懸停效果 */
.interactive:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

/* 禁止導致佈局偏移 (Layout Shift) */
/* 所有懸停效果必須預留空間或使用 transform */
```

### 7.3 按下狀態 (Active)

```css
.interactive:active {
  transform: scale(0.98);
}
```

### 7.4 焦點狀態 (Focus)

```css
/* 可聚焦元素必須有明顯的焦點指示器 */
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* 按鈕焦點樣式 */
button:focus-visible {
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
}
```

### 7.5 游標 (Cursor)

```css
/* 所有可點擊元素必須強制 cursor: pointer */
.clickable {
  cursor: pointer;
}

/* 禁用狀態 */
.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
```

---

## 8. 響應式設計 (Responsive Design)

### 8.1 斷點 (Breakpoints)

| 斷點名稱 | 數值 | 說明 |
| :--- | :--- | :--- |
| `mobile` | `max-width: 600px` | 手機端 |
| `tablet` | `min-width: 601px` and `max-width: 1024px` | 平板端 |
| `desktop` | `min-width: 1025px` | 桌面端 |

### 8.2 響應式行為

| 元件 | 桌面端 (Desktop) | 手機端 (Mobile < 600px) |
| :--- | :--- | :--- |
| **Header 佈局** | `flex-direction: row` (左右分佈) | `flex-direction: row` (保持左右分佈) |
| **內容寬度** | `width: 92%` | `width: 95%` |
| **表單項目** | `flex-direction: row` (標籤與內容並排) | `flex-direction: column` (垂直堆疊) |
| **按鈕** | 根據內容自適應寬度 | 寬度 `100%` (Stretch) |
| **Header 高度** | 固定 `56px` | 固定 `56px` |

---

## 9. 無障礙設計 (Accessibility)

### 9.1 對比度要求

- 所有文字與背景的對比度必須 $\ge 4.5:1$ (WCAG AA)
- 大型文字 (18px+) 對比度必須 $\ge 3:1$
- 圖標與背景的對比度必須 $\ge 3:1$

### 9.2 鍵盤導航

- 所有互動元素必須可通過鍵盤訪問
- Tab 鍵順序必須符合視覺順序
- 焦點指示器必須清晰可見

### 9.3 ARIA 標籤

- 所有圖標按鈕必須有 `aria-label` 或 `aria-labelledby`
- 狀態變更必須通過 `aria-live` 通知
- 表單錯誤必須與輸入框關聯 (`aria-describedby`)

---

## 10. 動畫規範 (Animation Standards)

### 10.1 動畫策略

本專案為 Chrome Extension，目標為**極致輕量化與低功耗**。動畫策略遵循以下原則：

- **預設使用 CSS Transitions**：所有狀態切換（hover、focus、active、狀態變更）優先使用 CSS `transition` 屬性。瀏覽器 compositor thread 原生處理 CSS transitions，無 JS 開銷、無 GC 壓力、DOM 脫離時自動終止。
- **CSS Transitions 適用場景**：
  - 懸停/按下/焦點狀態回饋（`translateY`, `box-shadow`, `background-color`, `color`）
  - 主題切換（`background-color` 過渡）
  - 折疊/展開動畫（CSS Grid `grid-template-rows` + `transition`）
  - 所有僅需**簡單狀態 A → B 過渡**的場景
- **WAAPI（`element.animate()`）保留給高階場景**：
  - 序列動畫（step-by-step playback）
  - 可暫停/倒帶/跳轉的動畫
  - 與 scroll timeline 聯動的效果
  - **等到真正需要這些控制力時才引入，不做預先優化**

> **效能備註**：CSS transitions 由瀏覽器 compositor thread 獨立執行，不佔用 JS 主線程。
> WAAPI 雖然控制力更強，但每個 `element.animate()` 都會建立 `Animation` 物件，
> 在大量列表（數千筆分頁）場景下會產生可觀的 GC 壓力與記憶體開銷。
> 對 Chrome Extension 這種長駐背景、記憶體敏感的環境，CSS transitions 是更合適的預設選擇。

### 10.2 過渡參數 (Transition Parameters)

| 參數 | 數值 | 說明 |
| :--- | :--- | :--- |
| **標準速度** | `0.2s ease-in-out` | 所有狀態切換統一速度 |
| **快速速度** | `0.15s ease-out` | 微交互 (Hover) |
| **慢速速度** | `0.3s ease-in-out` | 大型動畫 (折疊/展開, Modal) |

---

## 11. 元件實作標準 (Component Standards)

### 11.1 按鈕 (Buttons)

```css
/* 主按鈕 */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--color-primary);
  color: var(--color-on-primary);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-body);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-speed);
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.btn-primary:active {
  background: var(--color-primary-active);
  transform: scale(0.98);
}

/* 次要按鈕 */
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--color-surface-l2);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-body);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-speed);
}

.btn-secondary:hover {
  background: var(--color-surface-l3);
  border-color: var(--color-border-hover);
}

/* 危險按鈕 */
.btn-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: transparent;
  color: var(--color-error);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-md);
  font-size: var(--text-body);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-speed);
}

.btn-danger:hover {
  background: var(--color-error-bg);
}

/* 圖標按鈕 */
.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  color: var(--color-text-secondary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-speed);
}

.btn-icon:hover {
  background: var(--color-surface-l2);
  color: var(--color-text-primary);
}
```

### 11.2 表單輸入 (Inputs)

```css
/* 標準輸入框 */
.input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface-l2);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-body);
  transition: all var(--transition-speed);
}

.input::placeholder {
  color: var(--color-text-tertiary);
}

.input:hover {
  border-color: var(--color-border-hover);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 錯誤狀態 */
.input.error {
  border-color: var(--color-error);
}

.input.error:focus {
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}
```

### 11.3 列表項目 (List Items)

```css
/* 標準列表項 */
.list-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface-l2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-speed);
}

.list-item:hover {
  background: var(--color-surface-l3);
  border-color: var(--color-border-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.list-item:active {
  transform: scale(0.98);
}

/* 選中狀態 */
.list-item.selected {
  background: var(--color-primary);
  color: var(--color-on-primary);
  border-color: var(--color-primary);
}
```

---

## 12. 滾動條樣式 (Scrollbar Styling)

```css
/* Webkit 滾動條 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: var(--radius-sm);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-hover);
}

/* Firefox 滾動條 */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}
```

---

## 13. CSS 變數完整列表 (Complete CSS Variables)

```css
:root {
  /* Brand Colors */
  --color-primary: #2563EB;
  --color-primary-hover: #1D4ED8;
  --color-primary-active: #1E40AF;
  --color-on-primary: #FFFFFF;

  /* Surface & Background */
  --color-bg-base: #F8FAFC;
  --color-surface-l1: rgba(255,255,255,0.85);
  --color-surface-l2: rgba(255,255,255,0.60);
  --color-surface-l3: rgba(255,255,255,0.40);
  --color-border: rgba(148,163,184,0.20);
  --color-border-hover: rgba(148,163,184,0.40);

  /* Typography */
  --color-text-primary: #0F172A;
  --color-text-secondary: #475569;
  --color-text-tertiary: #94A3B8;
  --color-text-inverse: #FFFFFF;

  /* Status Colors */
  --color-success: #059669;
  --color-success-bg: rgba(5,150,105,0.10);
  --color-warning: #D97706;
  --color-warning-bg: rgba(217,119,6,0.10);
  --color-error: #DC2626;
  --color-error-bg: rgba(220,38,38,0.10);
  --color-info: #0891B2;
  --color-info-bg: rgba(8,145,178,0.10);

  /* Typography Sizes */
  --text-display: 20px;
  --text-heading: 16px;
  --text-body: 14px;
  --text-caption: 12px;
  --text-mono: 13px;

  /* Spacing */
  --space-0: 0px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;

  /* Radius */
  --radius-none: 0px;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Shadow */
  --shadow-none: none;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.10);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.10);
  --shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.10);

  /* Transition */
  --transition-speed: 0.2s;
  --transition-fast: 0.15s;
  --transition-slow: 0.3s;

  /* Icon Sizes */
  --icon-sm: 16px;
  --icon-md: 20px;
  --icon-lg: 24px;

  /* Component Heights */
  --header-height: 56px;
  --item-height-sm: 36px;
  --item-height-md: 48px;
}

/* Dark Mode */
body.dark {
  --color-primary: #60A5FA;
  --color-primary-hover: #93C5FD;
  --color-primary-active: #BFDBFE;
  --color-on-primary: #0F172A;

  --color-bg-base: #0F172A;
  --color-surface-l1: rgba(30,41,59,0.85);
  --color-surface-l2: rgba(51,65,85,0.60);
  --color-surface-l3: rgba(71,85,105,0.40);
  --color-border: rgba(148,163,184,0.15);
  --color-border-hover: rgba(148,163,184,0.30);

  --color-text-primary: #F1F5F9;
  --color-text-secondary: #CBD5E1;
  --color-text-tertiary: #64748B;

  --color-success: #34D399;
  --color-success-bg: rgba(52,211,153,0.15);
  --color-warning: #FBBF24;
  --color-warning-bg: rgba(251,191,36,0.15);
  --color-error: #F87171;
  --color-error-bg: rgba(248,113,113,0.15);
  --color-info: #22D3EE;
  --color-info-bg: rgba(34,211,238,0.15);

  --shadow-sm: 0 1px 2px rgba(0,0,0,0.15);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.25);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.30);
  --shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.35);
}
```

---

## 14. 實作檢查清單 (Implementation Checklist)

在實作任何 UI 元件時，必須確認以下項目：

- [ ] 所有顏色使用 CSS 變數，禁止硬編碼
- [ ] 所有間距使用 Base-8 Grid System
- [ ] 所有圓角使用預定義的 radius 變數
- [ ] 所有陰影使用預定義的 shadow 變數
- [ ] 所有過渡動畫使用預定義的 transition 變數
- [ ] 所有圖標使用 SVG，禁止使用 Emoji
- [ ] 所有互動元素有明確的懸停、按下、焦點狀態
- [ ] 所有文字與背景對比度 $\ge 4.5:1$
- [ ] 所有圖標按鈕有 `aria-label`
- [ ] 所有表單輸入有對應的標籤
- [ ] 所有動畫使用 CSS transitions（僅在需要序列/暫停/倒帶等高階控制時才使用 WAAPI）

---

## 15. 版本歷史 (Version History)

| 版本 | 日期 | 變更說明 |
| :--- | :--- | :--- |
| **v2.0** | 2025-05-13 | 全新視覺語言重新設計 - 專業色盤、統一 Header、SVG 圖標系統 |
| **v1.0** | 2024-XX-XX | 初始版本 |