import action from './lib/action';
import commands from './lib/commands';
import options from './lib/options';
import sessions from './lib/sessions';
import tabs from './lib/tabs';
import windows from './lib/windows';
import util from './lib/util';
import storage from './lib/storage';
import Logger from './lib/logger';

function generateId() {
  return crypto.randomUUID();
}

chrome.runtime.onInstalled.addListener(async (details) => {
  Logger.log('[Background] onInstalled triggered. Reason: ' + details.reason);

  if (details.reason === 'install') {
    Logger.log('onInstalled: ' + details.reason);
    chrome.runtime.openOptionsPage();
  } else if (details.reason === 'update' && details.previousVersion) {
    Logger.log('onInstalled: ' + details.reason + ' ' + details.previousVersion);
    // 2.0.0 版本 FuncType 配置格式變更
    if (util.compareVersion(details.previousVersion, '2.0.0') < 0) {
      options.setFuncType(action.DEFAULT_FUNC_TYPE);
      chrome.runtime.openOptionsPage();
    }
  }

  await action.setTheme();
  await action.setFuncType();

  // 安裝/更新時強制儲存（透過邊界檢測建立新會話）
  try {
    await sessions.saveCurrentSession(true);
    Logger.log('[Background] onInstalled session save completed.');
  } catch (error) {
    Logger.log('[Background] Error saving session on install: ' + error, 'WARN');
  }

  // 清除已刪除紀錄
  try {
    const result = await sessions.optimize();
    Logger.log(`[Background] onInstalled cleanup completed: cleaned=${result.cleaned}`);
  } catch (error) {
    Logger.log('[Background] onInstalled cleanup failed:', error.message);
  }
});

// 監聽瀏覽器啟動時清除已刪除紀錄
// runtime.onStartup 只在瀏覽器進程真正重啟時觸發，SW 閒置重啟不會觸發
chrome.runtime.onStartup.addListener(async () => {
  Logger.log('[Background] runtime.onStartup triggered. Generating fresh start ID...');

  // 產生唯一 freshStartId，寫入 chrome.storage.local（跨重啟持久化）
  // 後續 performSave 比對此 ID 與最後會話的 freshStartId，
  // 若不匹配即為瀏覽器重啟 → 建立新會話
  const freshStartId = generateId();
  await chrome.storage.local.set({ fresh_start_id: freshStartId });
  Logger.log('[Background] fresh_start_id set: ' + freshStartId);

  try {
    await sessions.saveCurrentSession(true);
  } catch (error) {
    Logger.log('[Background] Error saving session on startup: ' + error, 'WARN');
  }

  try {
    const result = await sessions.optimize();
    Logger.log(`[Background] Startup cleanup completed: cleaned=${result.cleaned}`);
  } catch (error) {
    Logger.log('[Background] Startup cleanup failed:', error.message);
  }

  await action.setTheme();
  await action.setFuncType();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.command) {
        case 'ping':
          sendResponse({ command: 'pong', data: 'pong' });
          break;
        case 'updateTheme':
          // 廣播主題變更給所有開啟的頁面
          chrome.runtime.sendMessage({ command: 'setTheme', data: message.data }).catch(() => {
            // 忽略沒有監聽者的錯誤
          });
          sendResponse();
          break;
        case 'getTheme':
          const theme = await options.getTheme();
          sendResponse(theme);
          break;
        case 'getLastSession':
          const lastSession = await sessions.getLastSession();
          sendResponse(lastSession);
          break;
        case 'getRecents':
          const maxResults = await options.getRecentSize(action.DEFAULT_RECENT_SIZE);
          const recents = await sessions.getRecents({ maxResults });
          sendResponse(recents);
          break;
        case 'setRemoved':
          await sessions.setRemoved(message.data.url, message.data.removed);
          sendResponse();
          break;
        case 'optimize':
          try {
            const result = await sessions.optimize();
            sendResponse({ success: true, ...result });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        case 'findDuplicates':
          try {
            const history = await sessions.getSessionHistory();
            const duplicates = sessions.findDuplicateUrls(history, message.data.mode || 'exact-match');
            sendResponse({ success: true, duplicates: Array.from(duplicates) });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        case 'markDuplicates':
          try {
            const result = await sessions.markDuplicates(message.data.mode || 'exact-match');
            sendResponse({ success: true, ...result });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        case 'sync':
          try {
            const syncManager = await import('./lib/sync-manager');
            await syncManager.default.sync();
            sendResponse({ success: true });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        case 'restoreSessionById':
          try {
            await sessions.restoreSessionById(message.data.index);
            sendResponse({ success: true });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        case 'getSessionHistory':
          const history = await sessions.getSessionHistory();
          sendResponse(history);
          break;
        case 'updateTabMetadata':
          try {
            await sessions.updateTabMetadata(message.data.url, message.data.updates);
            sendResponse({ success: true });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        case 'forceSaveSession':
          await sessions.saveCurrentSession(true);
          sendResponse({ success: true });
          break;
        case 'getFlattenedHistory':
          const flattened = await sessions.getFlattenedHistory();
          sendResponse(flattened);
          break;
        case 'diagnoseStorage':
          const raw = await storage.get({ session_history: [], diagnostic_log: null });
          const hist = raw.session_history || [];
          const sessionCount = hist.length;
          const totalTabs = hist.reduce((sum, s) => sum + (s.tabs?.length || 0), 0);
          const removedTabs = hist.reduce(
            (sum, s) => sum + (s.tabs?.filter((t) => t.removed || t.deleted)?.length || 0),
            0
          );
          sendResponse({
            sessionCount,
            totalTabs,
            removedTabs,
            diagnostic_log: raw.diagnostic_log,
            sessions: hist.map((s, i) => ({
              index: i,
              id: s.id,
              startTime: new Date(s.startTime).toISOString(),
              lastModified: s.lastModified ? new Date(s.lastModified).toISOString() : null,
              tabCount: s.tabs?.length || 0,
              removedCount: s.tabs?.filter((t) => t.removed || t.deleted)?.length || 0,
              hasTabs: Array.isArray(s.tabs) && s.tabs.length > 0,
              validStructure: typeof s.id === 'string' && Array.isArray(s.tabs),
              sampleTabs: (s.tabs || [])
                .slice(0, 3)
                .map((t) => ({ url: t.url?.slice(0, 80), removed: t.removed, deleted: t.deleted })),
            })),
          });
          break;
      }
    } catch (error) {
      Logger.log('[Background] onMessage async error: ' + error, 'ERROR');
      // 嘗試發送錯誤回應，如果 sendResponse 尚未調用
      try {
        sendResponse({ success: false, error: error.message });
      } catch (e) {
        // sendResponse 可能已經被調用或通道已關閉
      }
    }
  })();
  return true;
});

// 視窗建立後，獲取上次關閉視窗時未關閉的分頁
windows.addCreatedListener();

// 監聽視窗關閉：儲存該視窗的所有分頁快照
chrome.windows.onRemoved.addListener(async (windowId) => {
  Logger.log(`[Background] windows.onRemoved triggered for window ${windowId}. Saving snapshot...`);
  try {
    await sessions.saveWindowCloseSession(windowId);
  } catch (error) {
    Logger.log(`[Background] Error saving window close session: ${error}`, 'ERROR');
  }
});

// 分頁更新後快取分頁資訊，用於獲取"favIconUrl"
tabs.addUpdatedListener();

// 監聽擴充功能按鈕單擊事件
action.addClickedListener();

// 監聽快捷鍵啟動命令事件
commands.addCommandListener();
