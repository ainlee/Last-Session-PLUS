import storage from './storage';
import tabs from './tabs';
import util from './util';
import Logger from './logger';
import { DEFAULTS } from './constants';

const SESSION_HISTORY_KEY = 'session_history';
const DIAGNOSTIC_LOG = { diagnostic_log: null };

/**
 * 生成簡短 UUID v4，用於會話唯一識別
 * @returns {string} UUID 字串
 */
function generateSessionId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 獲取最近關閉的分頁和/或視窗的列表
 * @param {Object} filter - Chrome sessions API 過濾條件
 * @returns {Promise<Array>} 最近關閉的項目
 */
function getRecentlyClosed(filter = null) {
  return chrome.sessions.getRecentlyClosed(filter);
}

/**
 * 重新開啟視窗或分頁
 * @param {string} sessionId - 要恢復的 session ID
 * @returns {Promise<Object>} 恢復後的 session 物件
 */
function restore(sessionId = null) {
  return chrome.sessions.restore(sessionId);
}

/**
 * 判斷 URL 是否為雜訊（不應儲存的頁面）
 * @param {string} url - 要檢查的 URL
 * @returns {boolean} 是否為雜訊
 */
function isNoiseUrl(url) {
  if (!url) return true;
  if (url === 'about:blank') return true;
  if (
    url.startsWith('chrome://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:') ||
    url.startsWith('view-source:')
  )
    return true;
  if (util.isInnerUrl(url)) return true;
  return false;
}

/**
 * 視窗關閉時儲存該視窗的快照
 * 從 chrome.sessions.getRecentlyClosed() 取得該視窗的分頁，
 * 過濾雜訊後建立新的 SessionBlock
 * @param {number} windowId - 關閉的視窗 ID
 * @returns {Promise<Object|null>} 建立的 session 物件，若無分頁則回傳 null
 */
async function saveWindowCloseSession(windowId) {
  Logger.log(`[Sessions] saveWindowCloseSession: Saving window ${windowId}`);
  const recent = await chrome.sessions.getRecentlyClosed({ maxResults: 100 });
  const windowTabs = [];
  for (const entry of recent) {
    if (entry.tab && entry.tab.windowId === windowId) {
      windowTabs.push(entry.tab);
    }
    if (entry.window && entry.window.tabs) {
      for (const tab of entry.window.tabs) {
        if (tab.windowId === windowId) {
          windowTabs.push(tab);
        }
      }
    }
  }

  const cleanTabs = windowTabs.filter((t) => !isNoiseUrl(t.url));
  if (cleanTabs.length === 0) {
    Logger.log(`[Sessions] saveWindowCloseSession: No clean tabs for window ${windowId}, skipping.`);
    return null;
  }

  const now = Date.now();
  const session = {
    id: generateSessionId(),
    freshStartId: null,
    startTime: now,
    lastModified: now,
    tabs: cleanTabs.map((t) => ({
      url: t.url,
      title: t.title || '',
      favIconUrl: t.favIconUrl || '',
      pinned: !!t.pinned,
      groupId: t.groupId,
      windowId: t.windowId,
      timestamp: now,
    })),
  };

  const { [SESSION_HISTORY_KEY]: sessionHistory } = await storage.get({ [SESSION_HISTORY_KEY]: [] });
  const valid = (sessionHistory || []).filter(
    (item) => item && typeof item.id === 'string' && Array.isArray(item.tabs)
  );
  valid.unshift(session);
  await storage.set({ [SESSION_HISTORY_KEY]: valid });
  Logger.log(`[Sessions] saveWindowCloseSession: Saved window ${windowId} with ${cleanTabs.length} tabs`);
  return session;
}

/**
 * 將會話中的分頁批次恢復到瀏覽器中
 * @param {Object} session - 包含 tabs 陣列的會話物件
 * @returns {Promise<number>} 成功恢復的分頁數量
 */
async function restoreSessionData(session) {
  const currentTabs = await chrome.tabs.query({});
  const currentUrls = new Set(currentTabs.map((t) => t.url));
  Logger.log('[Sessions] restoreSessionData: Current open tabs count: ' + currentTabs.length);

  const CHUNK_SIZE = DEFAULTS.RESTORE_CHUNK_SIZE;
  const CHUNK_DELAY = DEFAULTS.RESTORE_CHUNK_DELAY;
  const tabsToRestore = session.tabs.filter((tab) => !tab.removed && !tab.deleted && !currentUrls.has(tab.url));
  const totalTabs = tabsToRestore.length;
  const totalChunks = Math.ceil(totalTabs / CHUNK_SIZE);

  let restoredCount = 0;

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, totalTabs);
    const chunk = tabsToRestore.slice(start, end);

    Logger.log(
      `[Sessions] restoreSessionData: 正在恢復第 ${i + 1}/${totalChunks} 批 (${start + 1}-${end} / ${totalTabs})...`
    );

    for (const tab of chunk) {
      try {
        await chrome.tabs.create({
          url: tab.url,
          pinned: tab.pinned,
        });
        restoredCount++;
      } catch (error) {
        Logger.log(`[Sessions] restoreSessionData: Failed to restore tab ${tab.url}: ${error}`, 'ERROR');
      }
    }

    if (i < totalChunks - 1) {
      await new Promise((resolve) => setTimeout(resolve, CHUNK_DELAY));
    }
  }

  Logger.log('[Sessions] restoreSessionData completed. Restored tabs: ' + restoredCount);
  return restoredCount;
}

/**
 * 獲取最後一個會話（最新的 SessionBlock）
 * @param {Function} filter - 分頁過濾函式
 * @returns {Promise<Object>} 最後一個會話物件
 */
async function getLastSession(filter) {
  let _filter = filter;
  if (!_filter) {
    _filter = (item) => !util.isInnerUrl(item.url) && !item.removed;
  }
  const history = await storage.get({ [SESSION_HISTORY_KEY]: [] });
  const sessionHistory = history[SESSION_HISTORY_KEY] || [];
  // 相容舊版扁平格式：僅取有效的 SessionBlock（具備 id 與 tabs 陣列）
  const validSessions = sessionHistory.filter(
    (item) => item && typeof item.id === 'string' && Array.isArray(item.tabs)
  );
  const session = validSessions[0] || { id: null, startTime: 0, lastModified: 0, tabs: [] };
  return {
    ...session,
    tabs: session.tabs ? session.tabs.filter(_filter) : [],
  };
}

let saveTimeout = null;
let saveInProgress = null;

/** 共享寫入鎖，防止 optimize() 與 performSave() 並發 */
let storageWriteLock = Promise.resolve();
let storageWriteLockRelease = null;

async function acquireStorageLock() {
  while (storageWriteLockRelease) {
    await storageWriteLock;
  }
  storageWriteLock = new Promise((resolve) => {
    storageWriteLockRelease = resolve;
  });
}

function releaseStorageLock() {
  if (storageWriteLockRelease) {
    storageWriteLockRelease();
    storageWriteLockRelease = null;
  }
}

/**
 * 核心儲存邏輯：增量追加分頁紀錄至當前會話，或建立新會話
 *
 * 兩層級結構：
 * - 父層 (SessionBlock)：{ id, freshStartId, startTime, lastModified, tabs[] }
 * - 子層 (TabRecord)：{ url, title, timestamp, favIconUrl, pinned, groupId, windowId }
 *
 * 會話判定：比對 chrome.storage.local 的 fresh_start_id 與最後會話的 freshStartId
 *   - 不匹配 → 瀏覽器重啟 → 新會話
 *   - 匹配 → 同一會話（合併至最新 SessionBlock）
 * 增量邏輯：同一會話內，新 URL 追加至 tabs 陣列；已存在的 URL 更新 timestamp
 */
async function performSave() {
  if (saveInProgress) {
    await saveInProgress;
    return performSave();
  }

  const startTime = Date.now();
  Logger.log('[Sessions] performSave started.');

  await acquireStorageLock();
  saveInProgress = executeSave(startTime);
  try {
    return await saveInProgress;
  } finally {
    saveInProgress = null;
    releaseStorageLock();
  }
}

async function executeSave(startTime) {
  try {
    const allTabsRaw = await chrome.tabs.query({});

    let allTabs = allTabsRaw.map((tab) => ({
      url: tab.url,
      title: tab.title,
      favIconUrl: tab.favIconUrl,
      pinned: tab.pinned,
      groupId: tab.groupId,
      windowId: tab.windowId,
    }));

    allTabs = allTabs.filter((t) => !isNoiseUrl(t.url));

    Logger.log('[Sessions] performSave: Captured tabs count (after noise filter): ' + allTabs.length);

    if (allTabs.length === 0) {
      Logger.log('[Sessions] performSave: No tabs found, skipping save to prevent data loss.', 'WARN');
      await updateDiagnosticLog(startTime, 0, 'skipped_empty');
      return;
    }

    const history = await storage.get({ [SESSION_HISTORY_KEY]: [] });
    let sessionHistory = history[SESSION_HISTORY_KEY] || [];
    sessionHistory = sessionHistory.filter((item) => item && typeof item.id === 'string' && Array.isArray(item.tabs));
    const lastSession = sessionHistory[0];
    const now = Date.now();

    let isNewSession = !lastSession;

    if (!isNewSession) {
      // 瀏覽器重啟邊界檢測：比對 fresh_start_id
      // runtime.onStartup 每次瀏覽器重啟時都會產生新的 fresh_start_id
      // 若與最後會話儲存的 freshStartId 不匹配，表示發生過瀏覽器重啟
      const { fresh_start_id } = await chrome.storage.local.get('fresh_start_id');
      if (fresh_start_id && fresh_start_id !== lastSession.freshStartId) {
        Logger.log('[Sessions] performSave: Browser restart detected (freshStartId mismatch), creating new session.');
        isNewSession = true;
      }
    }

    if (isNewSession) {
      Logger.log('[Sessions] performSave: Creating new SessionBlock.');
      const { fresh_start_id } = await chrome.storage.local.get('fresh_start_id');
      const newSession = {
        id: generateSessionId(),
        freshStartId: fresh_start_id || null,
        startTime: now,
        lastModified: now,
        tabs: allTabs.map((tab) => ({
          ...tab,
          timestamp: now,
        })),
      };
      sessionHistory.unshift(newSession);
    } else {
      Logger.log('[Sessions] performSave: Appending tabs to current session.');
      const currentSession = sessionHistory[0];
      currentSession.lastModified = now;

      const existingUrlMap = new Map();
      for (const tab of currentSession.tabs) {
        existingUrlMap.set(tab.url, tab);
      }

      for (const tab of allTabs) {
        if (existingUrlMap.has(tab.url)) {
          const existing = existingUrlMap.get(tab.url);
          existing.timestamp = existing.timestamp || now;
          if (existing.removed || existing.deleted) {
            existing.removed = false;
            existing.deleted = false;
          }
        } else {
          currentSession.tabs.push({
            ...tab,
            timestamp: now,
          });
        }
      }
    }

    const duration = Date.now() - startTime;
    const log = {
      timestamp: new Date().toISOString(),
      duration,
      tabCount: allTabs.length,
      status: 'success',
    };

    await storage.set({
      [SESSION_HISTORY_KEY]: sessionHistory,
      diagnostic_log: log,
    });

    Logger.log('[Sessions] performSave completed successfully in ' + duration + ' ms.');
  } catch (error) {
    Logger.log('[Sessions] performSave failed: ' + error, 'ERROR');
    await updateDiagnosticLog(startTime, 0, `failed: ${error.message}`);
    throw error;
  }
}

/**
 * 更新診斷日誌
 * @param {number} startTime - 操作開始時間戳
 * @param {number} tabCount - 分頁數量
 * @param {string} status - 狀態描述
 */
async function updateDiagnosticLog(startTime, tabCount, status) {
  const log = {
    timestamp: new Date().toISOString(),
    duration: Date.now() - startTime,
    tabCount,
    status,
  };
  Logger.log('[Sessions] Updating diagnostic log: ' + JSON.stringify(log));
  return storage.set({ diagnostic_log: log });
}

/**
 * 儲存當前會話（對外接口）
 * @param {boolean} force - 是否強制立即儲存
 */
async function saveCurrentSession(force = false) {
  Logger.log('[Sessions] saveCurrentSession called. Force: ' + force);
  if (force) {
    if (saveTimeout) {
      Logger.log('[Sessions] saveCurrentSession: Clearing existing timeout for forced save.');
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    return await performSave();
  }

  if (saveTimeout) {
    Logger.log('[Sessions] saveCurrentSession: Debouncing save (clearing previous timeout).');
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(async () => {
    saveTimeout = null;
    await performSave();
  }, DEFAULTS.SAVE_DEBOUNCE_MS);
}

/**
 * 更新歷史紀錄中的最近一個會話
 * 用於同步視窗建立或雲端同步後的狀態更新
 * @param {Object} sessionData - 會話數據 { lastModified, tabs, ... }
 */
async function updateSessionHistory(sessionData) {
  Logger.log('[Sessions] updateSessionHistory started.');
  try {
    const history = await storage.get({ [SESSION_HISTORY_KEY]: [] });
    let sessionHistory = history[SESSION_HISTORY_KEY] || [];
    // 清理舊版扁平格式殘留（無 id 欄位的項目）
    sessionHistory = sessionHistory.filter((item) => item && typeof item.id === 'string' && Array.isArray(item.tabs));

    if (sessionHistory.length > 0) {
      Logger.log('[Sessions] updateSessionHistory: Updating existing session entry.');
      sessionHistory[0] = {
        ...sessionHistory[0],
        ...sessionData,
        lastModified: Date.now(),
      };
    } else {
      Logger.log('[Sessions] updateSessionHistory: History empty, creating new entry.');
      sessionHistory.unshift({
        id: generateSessionId(),
        startTime: Date.now(),
        lastModified: Date.now(),
        ...sessionData,
      });
    }

    await storage.set({ [SESSION_HISTORY_KEY]: sessionHistory });
    Logger.log('[Sessions] updateSessionHistory completed successfully.');
  } catch (error) {
    Logger.log('[Sessions] updateSessionHistory failed: ' + error, 'ERROR');
    throw error;
  }
}

/**
 * 從當前會話中移除指定 URL 的紀錄
 * @param {string} url - 要移除的分頁 URL
 * @returns {Promise<void>}
 */
async function removeTabFromCurrentSession(url) {
  const history = await storage.get({ [SESSION_HISTORY_KEY]: [] });
  let sessionHistory = history[SESSION_HISTORY_KEY] || [];

  if (sessionHistory.length > 0) {
    const currentSession = sessionHistory[0];
    if (currentSession && Array.isArray(currentSession.tabs)) {
      const originalLength = currentSession.tabs.length;
      currentSession.tabs = currentSession.tabs.filter((tab) => tab.url !== url);

      if (currentSession.tabs.length !== originalLength) {
        Logger.log(`[Sessions] removeTabFromCurrentSession: Removed tab ${url} from current session.`);
        await storage.set({ [SESSION_HISTORY_KEY]: sessionHistory });
      }
    }
  }
}

/**
 * 標記分頁為已移除/已刪除狀態
 * @param {string} url - 分頁 URL
 * @param {boolean} removed - 是否標記為已移除
 */
async function setRemoved(url, removed) {
  if (!url) {
    Logger.log(`[Sessions] setRemoved: url is falsy (${url}), skipping to prevent mass-delete`, 'WARN');
    return;
  }

  const history = await storage.get({ [SESSION_HISTORY_KEY]: [] });
  const sessionHistory = history[SESSION_HISTORY_KEY];
  if (!sessionHistory || sessionHistory.length === 0) return;

  // 遍歷所有會話，標記匹配的分頁（而非僅限最新會話）
  let changed = false;
  for (const session of sessionHistory) {
    // 跳過無效的舊版扁平格式項目
    if (!session || !Array.isArray(session.tabs)) continue;
    for (const item of session.tabs) {
      if (item.url === url) {
        const isRemoved = removed == null ? !item.removed : removed;
        if (item.removed !== isRemoved) {
          item.removed = isRemoved;
          item.deleted = isRemoved;
          changed = true;
        }
      }
    }
  }
  if (changed) {
    await storage.set({ [SESSION_HISTORY_KEY]: sessionHistory });
  }
}

/**
 * 獲取最近關閉的分頁列表
 * @param {Object} filter - 過濾條件
 * @returns {Promise<Array>} 最近關閉的分頁陣列
 */
async function getRecents(filter = null) {
  const recents = [];
  const sessions = await getRecentlyClosed(filter);
  const cachedTabs = await tabs.getCachedTabs();
  const cachedTabMap = new Map();
  for (const item of cachedTabs) {
    cachedTabMap.set(item.url, item);
  }
  for (const session of sessions) {
    if (session && session.tab && session.tab.sessionId != null && !util.isInnerUrl(session.tab.url)) {
      recents.push(session.tab);
      if (!session.tab.favIconUrl) {
        const cachedTab = cachedTabMap.get(session.tab.url);
        if (cachedTab) {
          session.tab.favIconUrl = cachedTab.favIconUrl;
          session.tab.favIconDateUrl = cachedTab.favIconDateUrl;
        }
      }
    }
  }
  if (filter && filter.maxResults) {
    return recents.slice(0, filter.maxResults);
  }
  return recents;
}

/**
 * 將分頁保存至歷史紀錄（舊版相容，保留以備不時之需）
 * @param {chrome.tabs.Tab} tab - Chrome 分頁物件
 */
async function saveTabToHistory(tab) {
  // 相容舊版扁平格式：將單一分頁追加至最新 SessionBlock 的 tabs 中
  const history = await storage.get({ [SESSION_HISTORY_KEY]: [] });
  let sessionHistory = history[SESSION_HISTORY_KEY] || [];
  // 清理舊版扁平格式殘留
  sessionHistory = sessionHistory.filter((item) => item && typeof item.id === 'string' && Array.isArray(item.tabs));

  const now = Date.now();
  const tabData = {
    url: tab.url,
    title: tab.title,
    favIconUrl: tab.favIconUrl,
    timestamp: now,
    pinned: tab.pinned || false,
    groupId: tab.groupId || -1,
    windowId: tab.windowId || -1,
  };

  if (sessionHistory.length > 0) {
    const currentSession = sessionHistory[0];
    currentSession.lastModified = now;
    // URL 去重：已存在則更新 timestamp，不存在則追加
    const existingTab = currentSession.tabs.find((t) => t.url === tab.url);
    if (existingTab) {
      existingTab.timestamp = existingTab.timestamp || now;
      existingTab.title = tab.title;
    } else {
      currentSession.tabs.push(tabData);
    }
  } else {
    // 無現有會話，建立新的 SessionBlock
    sessionHistory.unshift({
      id: generateSessionId(),
      startTime: now,
      lastModified: now,
      tabs: [tabData],
    });
  }

  await storage.set({ [SESSION_HISTORY_KEY]: sessionHistory });
}

/**
 * 根據指定模式找出跨 session 的重複分頁 URL
 * @param {Array} sessionHistory - SessionBlock 陣列（會先按 startTime 倒序排列）
 * @param {string} mode - 'exact-match' | 'ignore-query' | 'domain-path'
 * @returns {Set<string>} 應被標記為重複的 URL 集合（保留最新的，回傳舊的）
 */
function findDuplicateUrls(sessionHistory, mode) {
  const sorted = [...sessionHistory]
    .filter((s) => s && Array.isArray(s.tabs))
    .sort((a, b) => (b.startTime || 0) - (a.startTime || 0));

  const keyFn = (url) => {
    if (!url) return '';
    if (mode === 'exact-match') return url;
    if (mode === 'ignore-query') return url.split('?')[0].split('#')[0];
    if (mode === 'domain-path') {
      try {
        const u = new URL(url);
        return u.hostname + u.pathname;
      } catch {
        return url;
      }
    }
    return url;
  };

  const seen = new Map();
  const duplicates = new Set();

  for (const session of sorted) {
    for (const tab of session.tabs) {
      if (tab.removed || tab.deleted) continue;
      const key = keyFn(tab.url);
      if (seen.has(key)) {
        duplicates.add(tab.url);
      } else {
        seen.set(key, true);
      }
    }
  }

  return duplicates;
}

/**
 * 標記重複分頁（保留最新，舊的標為 removed）+ 合併中繼資料
 * @param {string} mode - 'exact-match' | 'ignore-query' | 'domain-path'
 * @returns {Promise<{marked: number, merged: number}>}
 */
async function markDuplicates(mode) {
  const history = await storage.get({ [SESSION_HISTORY_KEY]: [] });
  let sessionHistory = history[SESSION_HISTORY_KEY] || [];
  sessionHistory = sessionHistory.filter((item) => item && typeof item.id === 'string' && Array.isArray(item.tabs));

  const sorted = [...sessionHistory].sort((a, b) => (b.startTime || 0) - (a.startTime || 0));

  const seen = new Map();
  let marked = 0;
  let merged = 0;

  for (const session of sorted) {
    for (const tab of session.tabs) {
      if (tab.removed || tab.deleted) continue;

      const key = (() => {
        if (!tab.url) return '';
        if (mode === 'exact-match') return tab.url;
        if (mode === 'ignore-query') return tab.url.split('?')[0].split('#')[0];
        if (mode === 'domain-path') {
          try {
            const u = new URL(tab.url);
            return u.hostname + u.pathname;
          } catch {
            return tab.url;
          }
        }
        return tab.url;
      })();

      if (seen.has(key)) {
        tab.removed = true;
        tab.deleted = true;
        marked++;

        const kept = seen.get(key);
        if (!kept.title && tab.title) {
          kept.title = tab.title;
          merged++;
        }
        if (!kept.favIconUrl && tab.favIconUrl) {
          kept.favIconUrl = tab.favIconUrl;
          merged++;
        }
      } else {
        seen.set(key, tab);
      }
    }
  }

  await storage.set({ [SESSION_HISTORY_KEY]: sessionHistory });
  Logger.log(`[Sessions] markDuplicates completed: marked=${marked}, merged=${merged}`);
  return { marked, merged };
}

/**
 * 本地優化引擎：清理已刪除分頁 + 跨 Session 去重
 * 完全本機執行，不依賴 AI
 * @returns {Promise<{cleaned: number, deduped: number}>}
 */
async function optimize() {
  Logger.log('[Sessions] optimize started');
  await acquireStorageLock();
  try {
    const history = await storage.get({ [SESSION_HISTORY_KEY]: [] });
    let sessionHistory = history[SESSION_HISTORY_KEY] || [];
    sessionHistory = sessionHistory.filter((item) => item && typeof item.id === 'string' && Array.isArray(item.tabs));

    let cleaned = 0;
    let deduped = 0;

    for (const session of sessionHistory) {
      const before = session.tabs.length;
      session.tabs = session.tabs.filter((tab) => !tab.removed && !tab.deleted);
      cleaned += before - session.tabs.length;
    }

    const seenUrls = new Map();
    for (const session of sessionHistory) {
      const dedupedTabs = [];
      for (const tab of session.tabs) {
        if (seenUrls.has(tab.url)) {
          deduped++;
          const kept = seenUrls.get(tab.url);
          if (!kept.title && tab.title) kept.title = tab.title;
          if (!kept.favIconUrl && tab.favIconUrl) kept.favIconUrl = tab.favIconUrl;
        } else {
          seenUrls.set(tab.url, tab);
          dedupedTabs.push(tab);
        }
      }
      session.tabs = dedupedTabs;
    }

    sessionHistory = sessionHistory.filter((s) => s.tabs.length > 0);

    await storage.set({ [SESSION_HISTORY_KEY]: sessionHistory });
    Logger.log(`[Sessions] optimize completed: cleaned=${cleaned}, deduped=${deduped}`);
    return { cleaned, deduped };
  } finally {
    releaseStorageLock();
  }
}

/**
 * 更新指定分頁的中繼資料（pinned／groupId）
 * 用於 popup 的「移動」功能，直接在 session_history 中修改
 * @param {string} tabUrl - 要更新的分頁 URL
 * @param {Object} updates - 更新的屬性（如 { pinned: true, groupId: null }）
 * @returns {Promise<boolean>} 是否找到並更新
 */
async function updateTabMetadata(tabUrl, updates) {
  const { [SESSION_HISTORY_KEY]: sessionHistory } = await storage.get({ [SESSION_HISTORY_KEY]: [] });
  const valid = (sessionHistory || []).filter(
    (item) => item && typeof item.id === 'string' && Array.isArray(item.tabs)
  );
  let modified = false;
  for (const session of valid) {
    for (const tab of session.tabs) {
      if (tab.url === tabUrl) {
        Object.assign(tab, updates);
        modified = true;
      }
    }
  }
  if (modified) {
    await storage.set({ [SESSION_HISTORY_KEY]: valid });
  }
  return modified;
}

export default {
  getRecentlyClosed,
  restore,
  isNoiseUrl,
  saveWindowCloseSession,
  updateTabMetadata,
  getLastSession,
  updateSessionHistory,
  removeTabFromCurrentSession,
  setRemoved,
  getRecents,
  saveTabToHistory,
  saveCurrentSession,
  optimize,
  markDuplicates,
  findDuplicateUrls,

  /**
   * 獲取所有會話歷史（兩層級結構）
   * @returns {Promise<Array>} SessionBlock 陣列，按 startTime 倒序排列
   */
  getSessionHistory: async () => {
    const history = await storage.get({ [SESSION_HISTORY_KEY]: [] });
    const raw = history[SESSION_HISTORY_KEY] || [];
    // 過濾掉舊版扁平格式（無 id 欄位），確保僅回傳 SessionBlock
    const result = raw.filter((item) => item && typeof item.id === 'string' && Array.isArray(item.tabs));
    return result;
  },

  /**
   * 獲取扁平化的分頁歷史（用於全局搜尋與舊版相容）
   * 遍歷所有會話的所有分頁，以 URL 去重，保留最新狀態
   * @returns {Promise<Array>} 扁平化的分頁陣列，附帶 sessionId 與 sessionStartTime
   */
  getFlattenedHistory: async () => {
    const history = await storage.get({ [SESSION_HISTORY_KEY]: [] });
    const sessionHistory = history[SESSION_HISTORY_KEY] || [];
    const allTabsMap = new Map();

    // 遍歷所有會話，以最新會話的狀態為準
    for (let i = 0; i < sessionHistory.length; i++) {
      const session = sessionHistory[i];
      if (!session.tabs) continue;
      for (const tab of session.tabs) {
        if (!allTabsMap.has(tab.url)) {
          allTabsMap.set(tab.url, {
            ...tab,
            sessionId: session.id,
            sessionStartTime: session.startTime,
            sessionIndex: i,
          });
        }
      }
    }

    const result = Array.from(allTabsMap.values());
    return result;
  },

  /**
   * 根據索引恢復指定會話中的所有分頁
   * @param {number} index - 會話在 sessionHistory 陣列中的索引
   * @returns {Promise<number>} 恢復的分頁數量
   */
  restoreSessionById: async (index) => {
    const history = await storage.get({ [SESSION_HISTORY_KEY]: [] });
    const sessionHistory = history[SESSION_HISTORY_KEY];
    if (!sessionHistory || !sessionHistory[index]) {
      throw new Error('Session not found');
    }
    return await restoreSessionData(sessionHistory[index]);
  },
};
