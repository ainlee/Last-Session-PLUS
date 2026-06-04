import { DEFAULTS } from './constants';

/**
 * 獲取儲存數據
 * @param {string|string[]|object} keys 鍵名或包含預設值的對象
 */
function get(keys) {
  return chrome.storage.local.get(keys);
}

async function getLayoutOrder() {
  const result = await get('layoutOrder');
  const order = result.layoutOrder;
  if (Array.isArray(order)) {
    return order;
  }
  return [...DEFAULTS.LAYOUT_ORDER];
}

async function setLayoutOrder(order) {
  return set({ layoutOrder: order });
}

async function getSectionSortConfig() {
  const result = await get('sectionSortConfig');
  return result.sectionSortConfig || { ...DEFAULTS.SECTION_SORT };
}

async function setSectionSortConfig(config) {
  return set({ sectionSortConfig: config });
}

function set(items) {
  return chrome.storage.local.set(items);
}

function remove(keys) {
  return chrome.storage.local.remove(keys);
}

function clear() {
  return chrome.storage.local.clear();
}

/**
 * 獲取全局區塊（pinned, grouped）的折疊狀態
 * @returns {Promise<Object>} { pinned: bool, grouped: bool }
 */
async function getCollapseState() {
  const result = await get('collapseState');
  const state = result.collapseState || { ...DEFAULTS.COLLAPSE_STATE };
  // 保留 sessions 屬性以支援會話級折疊狀態的傳遞
  return state;
}

/**
 * 獲取單個會話的折疊狀態
 * @param {string} sessionId
 * @returns {Promise<boolean>}
 */
async function getSessionCollapseState(sessionId) {
  const key = `collapse_session_${sessionId}`;
  const result = await get(key);
  return result[key] || false;
}

/**
 * 設定區塊的折疊狀態
 * - 若 key 為 'pinned' 或 'grouped'，更新全局狀態對象
 * - 若 key 為 sessionId，使用獨立 Key 儲存以提升效能
 * @param {string} key - 'pinned' | 'grouped' | sessionId
 * @param {boolean} collapsed - 是否折疊
 */
async function setCollapseState(key, collapsed) {
  if (key === 'pinned' || key === 'grouped') {
    const current = await getCollapseState();
    current[key] = collapsed;
    return set({ collapseState: current });
  } else {
    // 使用細粒度 Key 避免讀寫大型對象
    return set({ [`collapse_session_${key}`]: collapsed });
  }
}

export default {
  get,
  set,
  remove,
  clear,
  getLayoutOrder,
  setLayoutOrder,
  getSectionSortConfig,
  setSectionSortConfig,
  getCollapseState,
  setCollapseState,
  getSessionCollapseState,
};
