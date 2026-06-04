import Logger from './logger';

/**
 * 視窗建立時不做任何合併（新儲存策略：視窗關閉時逐窗儲存）
 * 保留此監聽僅用於後續可能需要的 UI 通知
 */
function addCreatedListener() {
  chrome.windows.onCreated.addListener(async (window) => {
    Logger.log(`[Windows] Window ${window.id} created (no-op under window-close save strategy).`);
  });
}

export default {
  addCreatedListener,
};
