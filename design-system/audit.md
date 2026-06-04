# 🔍 UI/UX Professional Audit Report (audit.md)

本報告對照 [`MASTER.md`](MASTER.md) 與 `UI/UX PRO MAX` 檢查清單，對現有界面進行深度審計。

> **2026-06-03 更新**：iconfont 已全數移除，統一為 inline SVG。
> 動畫策略已調整：預設使用 CSS transitions，取代 WAAPI 強制要求（詳見 MASTER.md §10）。
> `--color-primary-bg` 已補入 `theme.less`。

## 1. 綜合評分
| 維度 | 狀態 | 評分 | 核心問題 |
| :--- | :---: | :---: | :--- |
| **視覺一致性** | 🟡 警告 | 60/100 | 存在大量隨意值 (Hardcoded values)，缺乏系統化變數映射 |
| **交互穩定性** | 🟢 正常 | 85/100 | 基礎 Hover 效果已實作，無明顯 Layout Shift |
| **可訪問性** | 🟡 警告 | 70/100 | 部分錯誤色對比度需驗證，缺乏標準化字體階層 |
| **響應式適配** | 🟢 正常 | 80/100 | 具備基礎斷點，但間距計算不統一 |

---

## 2. 詳細缺陷清單 (Defect Log)

### 2.1 隨意值 (Hardcoded Values) $\rightarrow$ **嚴重**
現有 `.less` 文件中充斥著非系統化的數值，導致維護困難且視覺不精準。

| 文件 | 位置 | 隨意值 | 建議替換為 | 影響 |
| :--- | :--- | :--- | :--- | :--- |
| `popup.less` | Header | `calc(var(--spacing-unit) * 2.5)` | `space-md` 或 `space-lg` | 視覺比例不精準 |
| `popup.less` | Tab-Item | `padding: 0 12px` | `space-sm` (8px) 或 `space-md` (16px) | 左右對齊不統一 |
| `popup.less` | Tab-Item | `height: 36px` | `var(--item-height-sm)` | 缺乏高度標準化 |
| `popup.less` | Icon | `width/height: 18px` | `var(--icon-size-sm)` | 圖標尺寸隨意 |
| `options.less` | Group | `margin-bottom: 40px` | `space-xl` | 雖然數值正確但未變數化 |
| `options.less` | Group | `gap: 20px` | `space-lg` (24px) | 不符合 Base-8 Grid |
| `options.less` | Form | `min-width: 140px` | `var(--form-label-width)` | 缺乏全局控制 |
| `options.less` | Log | `font-size: 11px` | `Caption` (12px) | 低於可讀性底線 |

### 2.2 色彩與對比度 $\rightarrow$ **中等**
| 缺陷 | 描述 | 建議 | 優先級 |
| :--- | :--- | :--- | :--- |
| **硬編碼錯誤色** | `#ff4d4f` 直接寫死在多處 | 定義 `--color-error` 變數 | 高 |
| **對比度風險** | 淺色模式下 `#ff4d4f` 的對比度需驗證 | 確保對比度 $\ge 4.5:1$ | 中 |
| **表面色混亂** | `rgba(255, 255, 255, 0.05)` 等隨意透明度 | 統一使用 `Surface L1/L2` | 中 |

### 2.3 交互與可訪問性 $\rightarrow$ **低**
| 缺陷 | 描述 | 建議 | 優先級 |
| :--- | :--- | :--- | :--- |
| **字體階層缺失** | 直接使用 `14px`, `16px`, `18px` 而非階層定義 | 映射至 `H1`, `H2`, `Body`, `Caption` | 中 |

---

## 3. 優化路徑 (Optimization Path)

1.  **變數化 (Variablization)**: 將 `theme.less` 擴展，引入 `MASTER.md` 定義的所有 `space-`, `radius-`, `text-` 變數。
2.  **映射替換 (Mapping)**: 
    *   `12px` $\rightarrow$ `space-sm` (8px) 或 `space-md` (16px) 根據視覺調整。
    *   `20px` $\rightarrow$ `space-lg` (24px)。
    *   `#ff4d4f` $\rightarrow$ `var(--color-error)`。
3.  **結構重構**: 
    *   將 `popup.less` 與 `options.less` 中的硬編碼數值全部替換為變數。
    *   統一所有按鈕與輸入框的高度為 `36px` (Standard) 或 `32px` (Small)。
4.  **最終驗證**: 執行 `Pre-Delivery Checklist`。
