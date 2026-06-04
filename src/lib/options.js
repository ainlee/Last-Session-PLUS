import storage from './storage';
import { DEFAULTS } from './constants';

const OPTIONS = { options: {} };

async function getTheme() {
  const items = await storage.get(OPTIONS);
  if (items.options.theme != null) {
    return items.options.theme;
  }
  return DEFAULTS.THEME;
}

async function setTheme(value) {
  const items = await storage.get(OPTIONS);
  items.options.theme = value;
  await storage.set(items);
  chrome.runtime.sendMessage({ command: 'setTheme', data: value }).catch(() => {});
}

async function getFuncType(defaultValue) {
  const items = await storage.get(OPTIONS);
  if (items.options.funcType != null) {
    return items.options.funcType;
  }
  return defaultValue;
}

async function setFuncType(value) {
  const items = await storage.get(OPTIONS);
  items.options.funcType = value;
  await storage.set(items);
}

async function getRecentSize(defaultValue) {
  const items = await storage.get(OPTIONS);
  if (items.options.recentSize != null) {
    return items.options.recentSize;
  }
  return defaultValue;
}

async function setRecentSize(value) {
  const items = await storage.get(OPTIONS);
  items.options.recentSize = value;
  await storage.set(items);
}

async function clear() {
  await storage.clear();
  chrome.runtime.sendMessage({ command: 'clearStorage' }).catch((err) => {
    console.error('[Options] sendMessage(clearStorage) failed:', err);
  });
}

export default {
  getTheme,
  setTheme,
  getFuncType,
  setFuncType,
  getRecentSize,
  setRecentSize,
  clear,
};
