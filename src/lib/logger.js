/**
 * 持久化日誌系統 (Persistent Logger)
 * 用於在瀏覽器關閉後仍能提取日誌分析自動儲存失效的問題
 */
class Logger {
  static STORAGE_KEY = 'system_logs';
  static ENABLED_KEY = 'logging_enabled';
  static MAX_LOGS = 10000;

  /**
   * 記錄日誌（僅在啟用時寫入）
   * @param {string} message 日誌訊息
   * @param {'INFO'|'WARN'|'ERROR'} level 日誌層級
   */
  static async log(message, level = 'INFO') {
    const enabled = await this.isEnabled();
    if (!enabled) return;

    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message };

    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEY);
      let logs = result[this.STORAGE_KEY] || [];
      logs.push(logEntry);
      if (logs.length > this.MAX_LOGS) {
        logs = logs.slice(logs.length - this.MAX_LOGS);
      }
      await chrome.storage.local.set({ [this.STORAGE_KEY]: logs });
      console.log(`[${level}] ${message}`);
    } catch (error) {
      console.error('Logger failed to save log:', error);
    }
  }

  /** 日誌功能是否啟用（預設關閉） */
  static async isEnabled() {
    try {
      const result = await chrome.storage.local.get(this.ENABLED_KEY);
      return result[this.ENABLED_KEY] === true;
    } catch {
      return false;
    }
  }

  /** 開啟/關閉日誌紀錄 */
  static async setEnabled(bool) {
    await chrome.storage.local.set({ [this.ENABLED_KEY]: !!bool });
  }

  static async getLogs() {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEY);
      return result[this.STORAGE_KEY] || [];
    } catch {
      return [];
    }
  }

  static async clearLogs() {
    try {
      await chrome.storage.local.remove(this.STORAGE_KEY);
    } catch (error) {
      console.error('Logger failed to clear logs:', error);
    }
  }
}

export default Logger;
