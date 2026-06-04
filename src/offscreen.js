/**
 * Offscreen Document 處理中心
 * 用於處理需要 DOM 環境的非同步任務（如 AI 處理、複雜數據解析等）
 */

import { optimizeTabs } from './lib/ai-service.js';

console.log('[Offscreen] Script loaded and listener registering...');
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Offscreen] Received message:', message);

  if (message.target === 'offscreen') {
    (async () => {
      try {
        let result;
        switch (message.command) {
          case 'ping':
            result = 'pong';
            break;
          case 'AI_OPTIMIZE_TABS':
            result = await optimizeTabs(message.tabs, message.aiConfig);
            break;
          default:
            result = { error: 'Unknown command' };
        }
        sendResponse(result);
      } catch (error) {
        console.error('Offscreen error:', error);
        sendResponse({ error: error.message });
      }
    })();
    return true; // 保持通道開啟以支持非同步回應
  }
});
