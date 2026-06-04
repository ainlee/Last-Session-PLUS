> **2026-06-03 更新**：`--color-primary-bg` 已補入 `theme.less`。
> iconfont 已全數移除，統一為 inline SVG。
> 動畫策略已調整為預設使用 CSS transitions（詳見 MASTER.md §10）。

# 🗺️ 變數映射表 (Master $\rightarrow$ LESS Variable Mapping)

本文件定義 [`MASTER.md`](MASTER.md) 中的設計規範如何映射到 `src/assets/theme.less` 中的 CSS 變數。

## 1. 色彩變數映射

| MASTER.md | 現有變數 | 新增/變更 | 說明 |
| :--- | :--- | :--- | :--- |
| `--accent-color` | `--accent-color` | 保留 | 值不變 |
| `--accent-hover` | ❌缺失 | `--accent-hover` | 新增: `#0052A3` (Light) / `#92BCE0` (Dark) |
| `--bg-color` | `--bg-color` | 保留 | 值不變 |
| `--surface-l1` | `--header-bg` | 保留, 別名 | 現有 `--glass-bg` 保持指向 `--surface-l1` |
| `--surface-l2` | ❌缺失 | `--surface-l2` | 新增: 用於列表項、輸入框背景 |
| `--border-color` | `--border-color` | 保留 | 值不變 |
| `--glass-border` | `--glass-border` | 保留 | 值不變 |
| `--text-primary` | `--text-color` | 保留, 別名 | 可選是否增加別名 |
| `--text-muted` | `--text-color-muted` | 保留 | 值不變 |
| `--text-on-accent` | ❌缺失 | `--text-on-accent` | 新增: `#FFFFFF` |
| `--color-error` | ❌缺失 | `--color-error` | 新增: `#E53E3E` (替代硬編碼 `#ff4d4f`) |

## 2. 字體階層變數映射

| API 概念 | 現有變數 | 新增/變更 | 建議值 |
| :--- | :--- | :--- | :--- |
| `--font-family` | ❌缺失 | 新增 | `-apple-system, ...` (從現有中提取) |
| `--text-h1` | ❌缺失 | 新增 | `18px, 600, 1.4` |
| `--text-h2` | ❌缺失 | 新增 | `16px, 600, 1.4` |
| `--text-body` | ❌缺失 | 新增 | `14px, 400, 1.6` |
| `--text-caption` | ❌缺失 | 新增 | `12px, 400, 1.4` |
| `--text-mono` | ❌缺失 | 新增 | `13px, 400, 1.4` |

## 3. 間距系統變數映射 (Base-8 Grid)

| API 概念 | 建議值 | 對應現有 |
| :--- | :--- | :--- |
| `--space-xs` | `4px` | ❌缺失 |
| `--space-sm` | `8px` | 等於 `--spacing-unit` |
| `--space-md` | `16px` | 等於 `calc(var(--spacing-unit) * 2)` |
| `--space-lg` | `24px` | 等於 `calc(var(--spacing-unit) * 3)` |
| `--space-xl` | `40px` | ❌缺失 |

## 4. 圓角與陰影變數映射

| API 概念 | 建議值 | 對應現有 |
| :--- | :--- | :--- |
| `--radius-sm` | `4px` | `--radius-sm` |
| `--radius-md` | `8px` | `--radius-item` |
| `--radius-lg` | `12px` | `--radius-main` |
| `--shadow-sm` | `0 2px 4px rgba(0,0,0,0.05)` | `--shadow-sm` |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.1)` | ❌缺失 |

---

# 🎯 執行計畫 (Execution Plan)

## 步驟 1：更新 `theme.less`
- **目標**: 將上述所有新增變數注入 `:root {}` 區塊，並完善 `body.dark {}` 與 `body.system {}` 的配對。
- **關鍵**: 新增 `--surface-l2`, `--color-error`, `--accent-hover`, `--text-on-accent`, `--text-caption`, `--shadow-md`, 完整的間距系統變數。

## 步驟 2：更新 `popup.less`
- 替換所有硬編碼值：
  - `margin-left: calc(var(--spacing-unit) * 2.5)` $\rightarrow$ `margin-left: var(--space-md)`
  - `gap: calc(var(--spacing-unit) * 1.5)` $\rightarrow$ `gap: var(--space-sm)`
  - `padding: calc(var(--spacing-unit) * 2.5)` $\rightarrow$ `padding: var(--space-md)`
  - `margin-right: calc(var(--spacing-unit) * 2.5)` $\rightarrow$ `margin-right: var(--space-md)`
  - 引用 `--color-error` 替代 `#ff4d4f`

## 步驟 3：更新 `options.less`
- 替換所有非標準間距：
  - `gap: 20px` $\rightarrow$ `gap: var(--space-lg)`
  - `margin-bottom: 40px` $\rightarrow$ `margin-bottom: var(--space-xl)`
  - `padding-bottom: 8px` $\rightarrow$ `padding-bottom: var(--space-sm)`
  - `min-width: 140px` $\rightarrow$ `min-width: var(--form-label-width)`
  - `font-size: 11px` $\rightarrow$ `font-size: var(--text-caption)`
