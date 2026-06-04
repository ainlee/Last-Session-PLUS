/**
 * Offscreen Document 管理工具
 * 負責 Offscreen 文件的創建、狀態檢查與消息通信
 */

const OFFSCREEN_FILE_PATH = 'offscreen.html';

/**
 * 檢查 Offscreen 文件是否已存在
 */
async function exists() {
  if (typeof chrome.runtime.getContexts !== 'function') {
    return false;
  }
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
  });
  return existingContexts.length > 0;
}

/**
 * 創建 Offscreen 文件
 */
async function create() {
  if (typeof chrome.offscreen === 'undefined') {
    console.warn('[OffscreenManager] chrome.offscreen API not supported in this browser');
    return;
  }
  if (await exists()) {
    return;
  }
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_FILE_PATH,
    reasons: ['DOM_PARSER'],
    justification: 'Needed for AI processing and complex data parsing that requires DOM environment',
  });
}

/**
 * 向 Offscreen 文件發送消息
 * @param {object} message 消息內容
 */
async function sendMessage(message, retries = 3, delay = 100) {
  console.log(`[OffscreenManager] Attempting to send message (retries left: ${retries})...`);

  try {
    // 嘗試發送消息
    return await chrome.runtime.sendMessage({
      ...message,
      target: 'offscreen',
    });
  } catch (error) {
    // 如果接收端不存在且還有重試機會
    if (error.message.includes('Could not establish connection') && retries > 0) {
      console.warn(`[OffscreenManager] Receiving end not ready, retrying in ${delay}ms...`);

      // 確保 Offscreen Document 已創建
      await create();

      // 等待一段時間讓腳本加載
      await new Promise((resolve) => setTimeout(resolve, delay));

      // 遞歸重試，增加延遲時間
      return sendMessage(message, retries - 1, delay * 2);
    }

    console.error('[OffscreenManager] sendMessage failed after retries:', error);
    throw error;
  }
}

export default {
  exists,
  create,
  sendMessage,
};
