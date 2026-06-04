/**
 * 同步管理器
 * 協調身份驗證、雲端儲存與本地數據，實作增量同步與衝突解決
 */

import cloudStorage from './cloud-storage';
import storage from './storage';
import sessions from './sessions';

const SYNC_CONFIG_KEY = 'sync_config'; // { provider: 'google', enabled: boolean, lastSync: number }
const SYNC_STATUS_KEY = 'sync_status'; // { state: 'idle'|'syncing'|'error', lastError: string, lastSuccess: number }

/**
 * 更新同步狀態
 */
async function updateStatus(state, error = null) {
  const status = {
    state,
    lastError: error,
    lastSuccess: state === 'idle' ? Date.now() : undefined,
  };
  await storage.set({ [SYNC_STATUS_KEY]: status });
}

/**
 * 獲取同步配置
 */
async function getConfig() {
  const items = await storage.get({ [SYNC_CONFIG_KEY]: { provider: null, enabled: false } });
  return items[SYNC_CONFIG_KEY];
}

/**
 * 執行同步流程
 * 策略：以最後修改時間戳 (lastModified) 為準的增量同步
 */
async function sync() {
  const config = await getConfig();
  if (!config.enabled || !config.provider) return;

  try {
    await updateStatus('syncing');

    // 1. 獲取本地數據
    const localData = await sessions.getLastSession();
    const localTimestamp = localData.lastModified || 0;

    // 2. 獲取雲端數據
    const cloudData = await cloudStorage.downloadData(config.provider);

    if (!cloudData) {
      // 雲端無數據，直接上傳本地數據
      await cloudStorage.uploadData(config.provider, localData);
      await updateStatus('idle');
      return;
    }

    const cloudTimestamp = cloudData.lastModified || 0;

    // 3. 衝突解決與增量同步
    if (cloudTimestamp > localTimestamp) {
      // 雲端較新 -> 下載並更新本地
      await sessions.updateSessionHistory(cloudData);
      console.log('[SyncManager] Cloud data is newer, updated local session.');
    } else if (localTimestamp > cloudTimestamp) {
      // 本地較新 -> 上傳至雲端
      await cloudStorage.uploadData(config.provider, localData);
      console.log('[SyncManager] Local data is newer, uploaded to cloud.');
    } else {
      console.log('[SyncManager] Local and cloud data are in sync.');
    }

    await updateStatus('idle');
  } catch (error) {
    console.error('[SyncManager] Sync failed:', error);
    await updateStatus('error', error.message);
    throw error;
  }
}

/**
 * 強制上傳本地數據
 */
async function forceUpload() {
  const config = await getConfig();
  if (!config.provider) throw new Error('No cloud provider configured');

  try {
    await updateStatus('syncing');
    const localData = await sessions.getLastSession();
    await cloudStorage.uploadData(config.provider, localData);
    await updateStatus('idle');
  } catch (error) {
    await updateStatus('error', error.message);
    throw error;
  }
}

/**
 * 強制從雲端下載數據
 */
async function forceDownload() {
  const config = await getConfig();
  if (!config.provider) throw new Error('No cloud provider configured');

  try {
    await updateStatus('syncing');
    const cloudData = await cloudStorage.downloadData(config.provider);
    if (cloudData) {
      await sessions.updateSessionHistory(cloudData);
    }
    await updateStatus('idle');
  } catch (error) {
    await updateStatus('error', error.message);
    throw error;
  }
}

export default {
  sync,
  forceUpload,
  forceDownload,
  getConfig,
  updateStatus,
  SYNC_STATUS_KEY,
};
