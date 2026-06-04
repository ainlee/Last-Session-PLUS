# ⚙️ Options Page Overrides (options.md)

本文件定義 `Options` 頁面相對於 [`MASTER.md`](MASTER.md) 的覆蓋規範。Options 屬於**低密度 (Low Density)** 界面，旨在提供舒適的設定體驗。

## 1. 佈局覆蓋 (Layout Overrides)
| 屬性 | 數值 | 說明 |
| :--- | :--- | :--- |
| **Max-Width** | `800px` | 限制閱讀寬度，防止視覺疲勞 |
| **Content-Width** | `92%` | 保持一致的邊緣呼吸感 |
| **Header-Height** | `60px` | 標準導航高度 |
| **Main-Padding** | `space-xl` (40px) | 寬鬆的上下邊距，營造高級感 |

## 2. 密度與間距 (Density & Spacing)
*   **分組間隙**: `space-xl` (40px) $\rightarrow$ 明確區分不同功能模組。
*   **表單項目間隙**: `space-md` (16px) $\rightarrow$ 確保標籤與輸入框有足夠的視覺分離。
*   **內部元件間隙**: `space-sm` (8px) $\rightarrow$ 保持邏輯相關元件的凝聚力。

## 3. 元件特化 (Component Specialization)
*   **Form-Item**:
    *   標籤寬度固定為 `140px` $\rightarrow$ 確保左側對齊，形成整齊的視覺線條。
    *   輸入框高度 `36px` $\rightarrow$ 舒適的點擊區域。
*   **Startup-Guide**:
    *   背景使用 `Surface L1` $\rightarrow$ 建立視覺層級，使其看起來像一個獨立的卡片。
    *   圓角使用 `radius-lg` (12px)。

## 4. 交互權重
*   **優先級**: 舒適度 $>$ 速度。
*   **反饋**: 採用較緩慢的 `0.2s ease-in-out` 過渡，增加操作的平滑感。
