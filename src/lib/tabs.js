import storage from './storage';
import util from './util';
import { DEFAULTS } from './constants';

const CACHED_TABS = { cachedTabs: [] };
const EXPIRES = DEFAULTS.CACHE_EXPIRY_MS;

/**
 * 建立分頁物件
 */
function newTab(tab) {
  return {
    id: tab.id,
    url: tab.url,
    title: tab.title,
    favIconUrl: tab.favIconUrl,
    pinned: tab.pinned,
    groupId: tab.groupId,
  };
}

/**
 * 獲取目前分頁
 */
async function getCurrent() {
  try {
    return await chrome.tabs.getCurrent();
  } catch (e) {
    // 在背景腳本中 chrome.tabs.getCurrent() 會拋出 "No current window" 錯誤
    // 回退到使用 query 獲取當前視窗的活動分頁
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab || null;
  }
}

/**
 * 查詢分頁
 */
function query(queryInfo = {}) {
  return chrome.tabs.query(queryInfo);
}

/**
 * 建立分頁
 */
function create(createProperties = {}) {
  return chrome.tabs.create(createProperties);
}

/**
 * 啟動分頁，如果不存在則建立
 */
async function active(url) {
  if (!url) {
    return;
  }
  const tabList = await query({ windowId: chrome.windows.WINDOW_ID_CURRENT, url });
  if (tabList && tabList.length) {
    await update(tabList[0].id, { active: true });
    return;
  }
  await create({ url });
}

/**
 * 修改分頁
 */
function update(tabId = null, updateProperties = {}) {
  return chrome.tabs.update(tabId, updateProperties);
}

/**
 * 關閉分頁
 */
function remove(tabIds) {
  return chrome.tabs.remove(tabIds);
}

/**
 * 關閉目前分頁
 */
async function removeCurrent() {
  const tab = await getCurrent();
  if (tab) {
    await remove(tab.id);
  }
}

/**
 * 將分頁添加到指定的分頁組
 */
function group(groupId, tabIds) {
  groupId = parseInt(groupId, 10);
  return chrome.tabs.group({ groupId, tabIds });
}

/**
 * 從各自的分頁組中刪除分頁
 */
function ungroup(tabIds) {
  return chrome.tabs.ungroup(tabIds);
}

/**
 * 分頁更新後快取分頁資訊，用於獲取"favIconUrl"
 */
function addUpdatedListener() {
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.url || changeInfo.title || changeInfo.favIconUrl) {
      let cachedTabs = await getCachedTabs();
      const cachedTabMap = new Map();
      for (const item of cachedTabs) {
        cachedTabMap.set(item.url, item);
      }
      const now = Date.now();
      if (tab.favIconUrl) {
        const favIconDateUrl = await util.getBase64ByUrl(tab.favIconUrl);
        cachedTabMap.set(tab.url, { ...newTab(tab), favIconDateUrl, expires: now });
      }
      cachedTabs = [];
      for (const item of cachedTabMap.values()) {
        if (now - item.expires < EXPIRES) {
          cachedTabs.push(item);
        }
      }
      await setCachedTabs(cachedTabs);
    }
  });
}

async function getCachedTabs() {
  const items = await storage.get(CACHED_TABS);
  return items.cachedTabs || [];
}

function setCachedTabs(cachedTabs = []) {
  return storage.set({ cachedTabs });
}

/**
 * 分頁分桶邏輯 (Pinned, Grouped, General)
 * @param {Tab[]} tabs
 * @returns {{pinned: Tab[], grouped: Map<number, Tab[]>, general: Tab[]}}
 */
function bucket(tabs) {
  console.log('[Tabs.bucket] Input tabs:', tabs);
  const result = {
    pinned: [],
    grouped: new Map(),
    general: [],
  };

  if (!Array.isArray(tabs)) {
    console.error('[Tabs.bucket] Invalid input: tabs must be an array. Received:', tabs);
    return result;
  }

  for (const tab of tabs) {
    // 確保 tab 物件存在，防止 null/undefined 導致的 TypeError
    if (!tab) continue;

    const groupId = parseInt(tab.groupId, 10);
    if (tab.pinned) {
      result.pinned.push(tab);
    } else if (!isNaN(groupId) && groupId > 0) {
      if (!result.grouped.has(groupId)) {
        result.grouped.set(groupId, []);
      }
      result.grouped.get(groupId).push(tab);
    } else {
      result.general.push(tab);
    }
  }
  console.log('[Tabs.bucket] Result:', {
    pinned: result.pinned.length,
    grouped: result.grouped.size,
    general: result.general.length,
  });

  return result;
}

/**
 * 跨區移動邏輯
 * @param {number} tabId
 * @param {'pinned' | 'grouped' | 'general'} targetSection
 * @param {number} [groupId] 分組目標 ID
 */
async function moveTabToSection(tabId, targetSection, groupId = null) {
  switch (targetSection) {
    case 'pinned':
      await update(tabId, { pinned: true });
      await ungroup([tabId]);
      break;
    case 'grouped':
      if (!groupId) throw new Error('groupId is required for grouped section');
      await group(groupId, [tabId]);
      await update(tabId, { pinned: false });
      break;
    case 'general':
      await update(tabId, { pinned: false });
      await ungroup([tabId]);
      break;
  }
}

/**
 * 批量操作執行器
 * @param {number[]} tabIds
 * @param {'pin' | 'unpin' | 'group' | 'ungroup'} action
 * @param {any} params
 */
async function batchUpdateTabs(tabIds, action, params = {}) {
  const promises = tabIds.map(async (id) => {
    switch (action) {
      case 'pin':
        return update(id, { pinned: true });
      case 'unpin':
        return update(id, { pinned: false });
      case 'group':
        return group(params.groupId, [id]);
      case 'ungroup':
        return ungroup([id]);
      default:
        return Promise.resolve();
    }
  });
  return Promise.all(promises);
}

export default {
  getCurrent,
  query,
  create,
  active,
  update,
  remove,
  removeCurrent,
  group,
  ungroup,
  addUpdatedListener,
  getCachedTabs,
  setCachedTabs,
  newTab,
  bucket,
  moveTabToSection,
  batchUpdateTabs,
};
