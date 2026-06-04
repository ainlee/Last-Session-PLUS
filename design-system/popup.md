# 📱 Popup Page Overrides (popup.md)

本文件定義 `Popup` 頁面相對於 [`MASTER.md`](MASTER.md) 的覆蓋規範。Popup 屬於**高密度 (High Density)** 界面，旨在快速提供資訊與操作。

## 1. 佈局覆蓋 (Layout Overrides)
| 屬性 | 數值 | 說明 |
| :--- | :--- | :--- |
| **Max-Width** | `960px` | 遵循現有規範，但建議在實作中針對不同螢幕寬度做更細膩的適配 |
| **Content-Width** | `92%` | 保持邊緣呼吸感 |
| **Header-Height** | `60px` | 標準導航高度 |
| **Main-Padding** | `space-md` (16px) | 緊湊的內邊距 |

## 2. 密度與間距 (Density & Spacing)
*   **列表項間隙**: `space-sm` (8px) $\rightarrow$ 增加資訊密度。
*   **元件內邊距**: 優先使用 `space-xs` (4px) 與 `space-sm` (8px)。
*   **標題間距**: `space-md` (16px) $\rightarrow$ 區分功能區塊。

## 3. 元件特化 (Component Specialization)
*   **Tab-Item**: 
    *   高度固定為 `36px`。
    *   背景使用 `Surface L2` $\rightarrow$ 懸停時切換至 `Accent-Hover` (低飽和度)。
*   **Action-Button**: 
    *   尺寸縮小至 `20px x 20px`。
    *   懸停時僅改變顏色，不觸發 `translateY` 以避免在緊湊列表中產生視覺抖動。

## 4. 交互權重
*   **優先級**: 速度 $>$ 華麗。
*   **反饋**: 點擊反饋需在 100ms 內完成。
