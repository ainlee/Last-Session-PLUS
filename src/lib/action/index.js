import options from '../options';
import api from './api';
import { FUNC_TYPE_INFOS } from './func-type';
import { THEME_LIST, DEFAULTS } from '../constants';

// 自動匯入模組
const _funcTypeCache = new Map();
const context = require.context('./func-type', false, /^\.\/func-type-.+\.js$/);
context.keys().forEach((fileName) => {
  let component = context(fileName);
  component = component.default || component;
  _funcTypeCache.set(component.name, component);
});
// 主題
const _themeCache = new Map();
for (const item of THEME_LIST) {
  _themeCache.set(item.value, item);
}

/**
 * 獲取功能類型模組
 * @param {String} name 功能類型名稱
 * @returns 功能類型模組
 */
export function getFuncTypeComponent(name) {
  return _funcTypeCache.get(name);
}

/**
 * 選擇點擊圖示的功能列表
 */
export const FUNC_TYPE_LIST = [];
for (const item of FUNC_TYPE_INFOS) {
  const funcType = _funcTypeCache.get(item.name);
  if (funcType) {
    const value = item.name;
    const label = chrome.i18n.getMessage(item.name);
    FUNC_TYPE_LIST.push({ value, label });
  }
}

/**
 * 預設點擊圖示的功能
 */
export const DEFAULT_FUNC_TYPE = FUNC_TYPE_LIST.find((item) => item.value === DEFAULTS.FUNC_TYPE) || FUNC_TYPE_LIST[0];

/**
 * 預設最近關閉列表大小
 */
export const DEFAULT_RECENT_SIZE = DEFAULTS.RECENT_SIZE;

/**
 * 監聽擴充功能按鈕單擊事件
 */
function addClickedListener() {
  api.addClickedListener(async (tab) => {
    const funcType = await options.getFuncType(DEFAULT_FUNC_TYPE.value);
    const funcTypeOption = _funcTypeCache.get(funcType);
    if (funcTypeOption && typeof funcTypeOption.handle === 'function') {
      await funcTypeOption.handle(tab);
    }
  });
}

/**
 * 設定點擊擴充功能按鈕的功能
 * @param {Object} funcType 功能類型
 */
async function setFuncType(funcType) {
  let _funcType = funcType;
  if (funcType == null) {
    _funcType = await options.getFuncType(DEFAULT_FUNC_TYPE.value);
  }
  const funcTypeOption = _funcTypeCache.get(_funcType);
  if (funcTypeOption && typeof funcTypeOption.install === 'function') {
    await funcTypeOption.install();
  }
}

/**
 * 設定主題
 * @param {string} theme 主題
 */
async function setTheme(theme) {
  let _theme = theme;
  if (theme == null) {
    _theme = await options.getTheme();
  }

  // 更新圖示
  let iconPath = null;
  if (_theme === 'system') {
    // 系統主題預設使用淺色圖示
    iconPath = THEME_LIST[0].icon;
  } else {
    const themeOption = _themeCache.get(_theme);
    if (themeOption) {
      iconPath = themeOption.icon;
    }
  }
  if (iconPath) {
    await api.setIcon({ path: iconPath });
  }

  // 通知背景腳本廣播主題變更
  chrome.runtime.sendMessage({ command: 'updateTheme', data: _theme }).catch(() => {
    // 忽略在沒有監聽者時的錯誤（例如啟動時）
  });
}

export default {
  FUNC_TYPE_LIST,
  DEFAULT_FUNC_TYPE,
  DEFAULT_RECENT_SIZE,
  addClickedListener,
  setFuncType,
  setTheme,
};
