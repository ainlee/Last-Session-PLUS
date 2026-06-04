import ClipboardJS from 'clipboard';
import action from '../lib/action';
import options from '../lib/options';
import util from '../lib/util';
import { POPUP_PATH, THEME_LIST, THEME_ICONS, DEFAULTS } from '../lib/constants';
import syncManager from '../lib/sync-manager';
import identityService from '../lib/identity-service';
import storage from '../lib/storage';
import Logger from '../lib/logger';
import './options.less';

document.addEventListener('DOMContentLoaded', async () => {
  // 國際化
  const t = (key, sub) => chrome.i18n.getMessage(key, sub);
  const MSG_URL_LABEL = t('options_url_label');

  document.title = t('optionsTitle');
  document.getElementById('optionsTitle').textContent = t('optionsTitle');
  document.getElementById('generalSettingsTitle').textContent = t('generalSettings');
  document.getElementById('urlLabelSuffix').textContent = t('urlLabelSuffix');
  document.getElementById('copyUrlBtn').textContent = t('copyUrlBtn');
  document.getElementById('aiConfigTitle').textContent = t('aiConfig');
  document.getElementById('aiBaseUrlLabel').textContent = t('aiBaseUrlLabel');
  document.getElementById('aiApiKeyLabel').textContent = t('aiApiKeyLabel');
  document.getElementById('aiModelLabel').textContent = t('aiModelLabel');
  document.getElementById('updateModelsBtn').textContent = t('updateModelsBtn');
  document.getElementById('cloudSyncTitle').textContent = t('cloudSync');
  document.getElementById('syncLogin').textContent = t('syncLogin');
  document.getElementById('syncLogout').textContent = t('syncLogout');
  document.getElementById('diagLogSummary').textContent = t('diagLogTitle');
  document.getElementById('copyLogsBtn').textContent = t('copyLogsBtn');
  document.getElementById('clearLogsBtn').textContent = t('clearLogsBtn');
  document.getElementById('aiBaseUrl').placeholder = t('aiBaseUrlPlaceholder');
  document.getElementById('aiApiKey').placeholder = t('aiApiKeyPlaceholder');

  // 設定 HTML title / aria-label
  document.getElementById('open-options').setAttribute('aria-label', t('returnHome'));
  document.getElementById('theme').title = t('themeLabel');
  document.getElementById('funcType').title = t('funcTypeLabel');
  document.getElementById('recentSize').title = t('recentSizeLabel');
  document.getElementById('clearData').setAttribute('aria-label', t('clearData'));
  document.getElementById('aiBaseUrl').title = t('openaiCompatibleUrl');
  document.getElementById('aiApiKey').title = t('yourApiKey');
  document.getElementById('aiModel').title = t('aiModelLabel');

  // 自定義下拉選單初始化
  function setupCustomPicker(pickerId, selectId) {
    const picker = document.getElementById(pickerId);
    const select = document.getElementById(selectId);
    if (!picker || !select) return;

    const trigger = picker.querySelector('.picker-trigger');
    const optionsList = picker.querySelector('.picker-options');

    function updateTriggerText() {
      const selectedOption = select.selectedOptions[0];
      trigger.textContent = selectedOption ? selectedOption.text : '';
    }

    function updateOptionsList() {
      util.emptyElement(optionsList);
      Array.from(select.options).forEach((option) => {
        const li = document.createElement('li');
        li.textContent = option.text;
        li.dataset.value = option.value;
        li.addEventListener('click', (e) => {
          e.stopPropagation();
          select.value = option.value;
          updateTriggerText();
          optionsList.style.display = 'none';
          select.dispatchEvent(new Event('change'));
        });
        optionsList.appendChild(li);
      });
    }

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = optionsList.style.display === 'block';
      document.querySelectorAll('.picker-options').forEach((el) => {
        el.style.display = 'none';
      });
      optionsList.style.display = isOpen ? 'none' : 'block';
    });

    // 監聽 select 的變化來更新 trigger
    select.addEventListener('change', updateTriggerText);

    // 初始更新
    updateTriggerText();
    updateOptionsList();

    // 返回更新函數以便在動態填充後調用
    return { updateOptionsList };
  }
  const MSG_COPY_TO_CLIPBOARD = chrome.i18n.getMessage('copyToClipboard');
  const MSG_THEME_LABEL = chrome.i18n.getMessage('themeLabel');
  const MSG_FUNC_TYPE_LABEL = chrome.i18n.getMessage('funcTypeLabel');
  const MSG_RECENT_SIZE_LABEL = chrome.i18n.getMessage('recentSizeLabel');
  const MSG_CLEAR_DATA = chrome.i18n.getMessage('clearData');

  document.getElementById('urlLabel').textContent = MSG_URL_LABEL;
  document.getElementById('themeLabel').textContent = MSG_THEME_LABEL;
  document.getElementById('funcTypeLabel').textContent = MSG_FUNC_TYPE_LABEL;
  document.getElementById('recentSizeLabel').textContent = MSG_RECENT_SIZE_LABEL;

  // 主題管理
  async function applyTheme(theme) {
    document.body.className = theme;
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.innerHTML = THEME_ICONS[theme] || THEME_ICONS.system;
    }
  }

  async function handleThemeToggle() {
    const theme = await options.getTheme();
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];

    await options.setTheme(nextTheme);
    await action.setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  // 獲取主題
  chrome.runtime.sendMessage({ command: 'getTheme' }, (theme) => {
    if (chrome.runtime.lastError) {
      console.error('[Options] sendMessage(getTheme) failed:', chrome.runtime.lastError);
      return;
    }
    applyTheme(theme);
  });

  const themeToggle = document.getElementById('theme-toggle');
  themeToggle.addEventListener('click', handleThemeToggle);

  const openOptions = document.getElementById('open-options');
  openOptions.addEventListener('click', () => {
    window.location.href = chrome.runtime.getURL(POPUP_PATH);
  });

  // 顯示上次未關閉頁面的 URL
  const url = document.getElementById('url');
  url.textContent = chrome.runtime.getURL(POPUP_PATH);
  url.title = MSG_COPY_TO_CLIPBOARD;
  new ClipboardJS(url, {
    text: (trigger) => url.textContent,
  });

  // 初始化主題
  const theme = document.getElementById('theme');
  util.emptyElement(theme);
  for (const item of THEME_LIST) {
    const option = document.createElement('option');
    option.value = item.value;
    option.text = chrome.i18n.getMessage(item.label);
    theme.add(option);
  }
  theme.value = await options.getTheme();
  theme.addEventListener('change', async (event) => {
    const value = event.target.value;
    await options.setTheme(value);
    await action.setTheme(value);
    document.body.className = value;
  });
  setupCustomPicker('theme-picker', 'theme');

  // 監聽主題同步訊息
  chrome.runtime.onMessage.addListener((message) => {
    if (message.command === 'setTheme') {
      const value = message.data;
      theme.value = value;
      applyTheme(value);
    }
  });
  // 初始化選擇單擊圖示的功能
  const funcType = document.getElementById('funcType');
  util.emptyElement(funcType);
  for (const item of action.FUNC_TYPE_LIST) {
    const option = document.createElement('option');
    option.value = item.value;
    option.text = item.label;
    funcType.add(option);
  }
  funcType.value = await options.getFuncType(action.DEFAULT_FUNC_TYPE.value);
  funcType.addEventListener('change', async (event) => {
    await action.setFuncType(event.target.value);
    await options.setFuncType(event.target.value);
  });
  setupCustomPicker('funcType-picker', 'funcType');
  // 初始化最近記錄數量
  const recentSize = document.getElementById('recentSize');
  recentSize.value = await options.getRecentSize(action.DEFAULT_RECENT_SIZE);
  recentSize.addEventListener('change', async (event) => {
    let value = parseInt(event.target.value, 10);
    if (isNaN(value)) {
      value = action.DEFAULT_RECENT_SIZE;
    } else if (value < 1) {
      value = 1;
    } else if (value > DEFAULTS.RECENT_SIZE + 5) {
      value = DEFAULTS.RECENT_SIZE + 5;
    }
    event.target.value = value;
    await options.setRecentSize(value);
  });
  // 清除資料
  const clearData = document.getElementById('clearData');
  clearData.textContent = MSG_CLEAR_DATA;
  clearData.addEventListener('click', async (event) => {
    await options.clear();
  });

  // AI 配置
  const aiBaseUrl = document.getElementById('aiBaseUrl');
  const aiApiKey = document.getElementById('aiApiKey');
  const aiModel = document.getElementById('aiModel');
  const updateModelsBtn = document.getElementById('updateModelsBtn');

  // UI 診斷日誌函數
  function logToUI(message, data = null) {
    const diag = document.getElementById('systemLogs');
    if (!diag) return;
    // 停用日誌時不寫入 UI
    Logger.isEnabled().then((enabled) => {
      if (!enabled) return;
      const entry = document.createElement('div');
      entry.className = 'diag-entry';
      entry.innerHTML = `<strong>[${new Date().toLocaleTimeString()}]</strong> ${message}`;
      if (data) {
        const dataDiv = document.createElement('pre');
        dataDiv.className = 'diag-data';
        dataDiv.textContent = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
        entry.appendChild(dataDiv);
      }
      diag.prepend(entry);
    });
  }

  // AI 配置讀取輔助函數
  async function getAiConfig() {
    const defaults = { ...DEFAULTS.AI };
    try {
      // 使用簡單的字串 Key 獲取，確保與其他模組 (如 func-type-ai-optimize.js) 一致
      const data = await storage.get('ai_config');
      logToUI('getAiConfig: storage.get("ai_config") returned', data);

      const config = data?.ai_config || {};
      const finalConfig = { ...defaults, ...config };

      logToUI('getAiConfig: final config', finalConfig);
      return finalConfig;
    } catch (error) {
      logToUI('getAiConfig: Error', error);
      return defaults;
    }
  }

  // 讀取 AI 配置
  const currentAiConfig = await getAiConfig();
  console.log('[Options] Initial ai_config:', currentAiConfig);

  aiBaseUrl.value = currentAiConfig.baseUrl;
  aiApiKey.value = currentAiConfig.apiKey;

  let aiModelPicker = null;
  function populateModels(models) {
    logToUI('populateModels: populating models list', models);
    util.emptyElement(aiModel);
    if (!Array.isArray(models)) {
      console.warn('[Options] models is not an array:', models);
      return;
    }
    for (const model of models) {
      const option = document.createElement('option');
      option.value = model;
      option.text = model;
      aiModel.add(option);
    }
    console.log(`[Options] Populated ${aiModel.options.length} model options`);
    if (aiModelPicker) {
      aiModelPicker.updateOptionsList();
    }
  }

  if (currentAiConfig.models && Array.isArray(currentAiConfig.models) && currentAiConfig.models.length > 0) {
    populateModels(currentAiConfig.models);

    if (currentAiConfig.model) {
      console.log('[Options] Attempting to set aiModel.value to:', currentAiConfig.model);
      aiModel.value = currentAiConfig.model;

      // 驗證賦值是否成功
      const selectedOption = Array.from(aiModel.options).find((opt) => opt.value === currentAiConfig.model);
      if (selectedOption) {
        console.log('[Options] Successfully selected model:', selectedOption.text);
      } else {
        console.error('[Options] Model value not found in populated options:', currentAiConfig.model);
      }
    } else {
      console.log('[Options] No model value specified in config, leaving selection to default');
    }
  } else {
    console.log('[Options] No saved models found or models list is empty, skipping aiModel.value assignment');
  }
  aiModelPicker = setupCustomPicker('aiModel-picker', 'aiModel');

  async function saveAiConfig() {
    const config = await getAiConfig();
    const newConfig = {
      ...config,
      baseUrl: aiBaseUrl.value,
      apiKey: aiApiKey.value,
    };

    // 只有在選單有選項時才儲存選中的模型，防止在初始化尚未填充模型時將 model 覆蓋為空字串
    if (aiModel.options.length > 0) {
      newConfig.model = aiModel.value;
    } else if (config.model) {
      // 如果選單目前是空的，但儲存中有模型，則保留原有的模型
      newConfig.model = config.model;
    }

    logToUI('saveAiConfig: Saving ai_config', newConfig);
    await storage.set({
      ai_config: newConfig,
    });
  }

  aiBaseUrl.addEventListener('input', saveAiConfig);
  aiApiKey.addEventListener('input', saveAiConfig);
  aiModel.addEventListener('change', saveAiConfig);

  // 更新模型清單
  updateModelsBtn.addEventListener('click', async () => {
    const baseUrl = aiBaseUrl.value.trim();
    const apiKey = aiApiKey.value.trim();

    if (!baseUrl || !apiKey) {
      alert(t('aiConfigMissing'));
      return;
    }

    try {
      const url = baseUrl.endsWith('/v1') ? `${baseUrl}/models` : `${baseUrl.replace(/\/$/, '')}/v1/models`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      const models = json.data || [];

      if (!Array.isArray(models)) {
        throw new Error('API 回應格式不正確，無法獲取模型列表');
      }

      const modelIds = models.map((m) => m.id);
      populateModels(modelIds);

      // 儲存模型清單
      const config = await getAiConfig();
      const updatedConfig = {
        ...config,
        models: modelIds,
      };
      logToUI('updateModelsBtn: Saving updated models list', updatedConfig);
      await storage.set({
        ai_config: updatedConfig,
      });

      // 恢復之前儲存的模型
      if (config && config.model) {
        aiModel.value = config.model;
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
      alert(t('updateModelsFailed', [error.message]));
    }
  });

  // 啟動指南
  const guideTitle = document.getElementById('guideTitle');
  const guideStep1 = document.getElementById('guideStep1');
  const guideStep2 = document.getElementById('guideStep2');
  const guideStep3 = document.getElementById('guideStep3');
  const copyUrlBtn = document.getElementById('copyUrlBtn');

  guideTitle.textContent = chrome.i18n.getMessage('startupGuideTitle');
  guideStep1.textContent = chrome.i18n.getMessage('startupGuideStep1');
  guideStep2.textContent = chrome.i18n.getMessage('startupGuideStep2');
  guideStep3.textContent = chrome.i18n.getMessage('startupGuideStep3');

  copyUrlBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(chrome.runtime.getURL(POPUP_PATH));
      const originalText = copyUrlBtn.textContent;
      copyUrlBtn.textContent = chrome.i18n.getMessage('copySuccess');
      setTimeout(() => {
        copyUrlBtn.textContent = originalText;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  });

  // 點擊頁面其他區域關閉自定義下拉列表
  document.addEventListener('click', () => {
    document.querySelectorAll('.picker-options').forEach((el) => {
      el.style.display = 'none';
    });
  });

  // 雲端同步配置
  const syncProvider = document.getElementById('syncProvider');
  const syncEnabled = document.getElementById('syncEnabled');
  const syncLogin = document.getElementById('syncLogin');
  const syncLogout = document.getElementById('syncLogout');
  const syncStatus = document.getElementById('syncStatus');

  async function updateSyncUI() {
    try {
      const config = await syncManager.getConfig();
      const statusItems = await storage.get({ [syncManager.SYNC_STATUS_KEY]: { state: 'idle' } });
      const currentStatus = statusItems[syncManager.SYNC_STATUS_KEY];

      syncProvider.value = config.provider || 'google';
      syncEnabled.checked = config.enabled;

      const statusMap = { idle: t('syncStatusIdle'), syncing: t('syncStatusSyncing') };
      const statusLabel = statusMap[currentStatus.state] || t('syncStatusError');
      let statusText = statusLabel;
      if (currentStatus.lastError) {
        statusText += ` (${currentStatus.lastError})`;
      }
      syncStatus.textContent = statusText;
      logToUI('updateSyncUI: Sync status updated', { state: currentStatus.state, error: currentStatus.lastError });
    } catch (error) {
      logToUI('updateSyncUI: Error', error);
    }
  }

  updateSyncUI();
  setupCustomPicker('syncProvider-picker', 'syncProvider');

  syncProvider.addEventListener('change', async (event) => {
    const provider = event.target.value;
    const config = await syncManager.getConfig();
    await storage.set({
      sync_config: { ...config, provider },
    });
    updateSyncUI();
  });

  syncEnabled.addEventListener('change', async (event) => {
    const enabled = event.target.checked;
    const config = await syncManager.getConfig();
    await storage.set({
      sync_config: { ...config, enabled },
    });
    if (enabled) {
      chrome.runtime.sendMessage({ command: 'sync' }).catch((err) => {
        console.error('[Options] sendMessage(sync) failed:', err);
      });
    }
    updateSyncUI();
  });

  syncLogin.addEventListener('click', async () => {
    try {
      const provider = syncProvider.value;
      await identityService.getToken(provider);
      syncStatus.textContent = t('syncLoginSuccess');
      setTimeout(updateSyncUI, 2000);
    } catch (error) {
      syncStatus.textContent = t('syncLoginFailed', [error.message]);
    }
  });

  syncLogout.addEventListener('click', async () => {
    try {
      const provider = syncProvider.value;
      await identityService.logout(provider);
      syncStatus.textContent = t('syncLogoutSuccess');
      setTimeout(updateSyncUI, 2000);
    } catch (error) {
      syncStatus.textContent = t('syncLogoutFailed', [error.message]);
    }
  });

  setInterval(updateSyncUI, 5000);

  // 系統日誌管理
  const systemLogsElement = document.getElementById('systemLogs');
  const copyLogsBtn = document.getElementById('copyLogsBtn');
  const clearLogsBtn = document.getElementById('clearLogsBtn');

  async function refreshLogs() {
    const logs = await Logger.getLogs();
    const formattedLogs = logs.map((log) => `[${log.timestamp}] [${log.level}] ${log.message}`).join('\n');
    systemLogsElement.textContent = formattedLogs || t('noLogs');
  }

  copyLogsBtn.addEventListener('click', async () => {
    const logs = await Logger.getLogs();
    const formattedLogs = logs.map((log) => `[${log.timestamp}] [${log.level}] ${log.message}`).join('\n');
    try {
      await navigator.clipboard.writeText(formattedLogs);
      const originalText = copyLogsBtn.textContent;
      copyLogsBtn.textContent = t('copySuccess');
      setTimeout(() => {
        copyLogsBtn.textContent = originalText;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy logs:', err);
    }
  });

  clearLogsBtn.addEventListener('click', async () => {
    if (confirm(t('clearLogsConfirm'))) {
      await Logger.clearLogs();
      await refreshLogs();
    }
  });

  // 日誌啟用/停用切換
  const logToggle = document.getElementById('logToggle');
  async function updateLogToggle() {
    const enabled = await Logger.isEnabled();
    logToggle.classList.toggle('on', enabled);
    logToggle.title = enabled ? t('logToggleOn') : t('logToggleOff');
  }
  logToggle.addEventListener('click', async () => {
    const enabled = await Logger.isEnabled();
    await Logger.setEnabled(!enabled);
    // 切換時清空 UI 顯示，避免殘留舊日誌
    const systemLogsEl = document.getElementById('systemLogs');
    if (systemLogsEl) systemLogsEl.innerHTML = '';
    await updateLogToggle();
    await refreshLogs();
  });
  updateLogToggle();

  // 初始化日誌顯示
  refreshLogs();
});
