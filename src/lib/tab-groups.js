import storage from './storage';
import { DEFAULTS } from './constants';

const CACHED_TAB_GROUPS = { cachedTabGroups: [] };
const EXPIRES = DEFAULTS.CACHE_EXPIRY_MS;

/**
 * 獲取分頁組
 */
function get(groupId) {
  return chrome.tabGroups.get(groupId);
}

/**
 * 移動分頁組
 */
function move(groupId = null, moveProperties = {}) {
  return chrome.tabGroups.move(groupId, moveProperties);
}

/**
 * 查詢分頁組
 */
function query(queryInfo = {}) {
  return chrome.tabGroups.query(queryInfo);
}

/**
 * 修改分頁組
 */
function update(groupId = null, updateProperties = {}) {
  return chrome.tabGroups.update(groupId, updateProperties);
}

/**
 * 分頁組更新後快取分頁組資訊
 */
function addUpdatedListener() {
  chrome.tabGroups.onUpdated.addListener(async (tabGroup) => {
    let cachedTabGroups = await getCachedTabGroups();
    const cachedTabGroupMap = new Map();
    for (const item of cachedTabGroups) {
      cachedTabGroupMap.set(item.id, item);
    }
    const now = Date.now();
    cachedTabGroupMap.set(tabGroup.id, { ...newTabGroup(tabGroup), expires: now });
    cachedTabGroups = [];
    for (const item of cachedTabGroupMap.values()) {
      if (now - item.expires < EXPIRES) {
        cachedTabGroups.push(item);
      }
    }
    await setCachedTabGroups(cachedTabGroups);
  });
}

async function getCachedTabGroups() {
  const items = await storage.get(CACHED_TAB_GROUPS);
  return items.cachedTabGroups;
}

function setCachedTabGroups(cachedTabGroups = []) {
  return storage.set({ cachedTabGroups });
}

function newTabGroup(tabGroup) {
  return {
    id: tabGroup.id,
    title: tabGroup.title,
    color: tabGroup.color,
  };
}

/**
 * 獲取群組元數據 (名稱, 顏色)
 * @param {number} groupId
 * @returns {Promise<{title: string, color: string}>}
 */
async function getMetadata(groupId) {
  const group = await get(groupId);
  return {
    title: group.title || '未命名群組',
    color: group.color || 'grey',
  };
}

export default {
  get,
  move,
  query,
  update,
  getMetadata,
};
