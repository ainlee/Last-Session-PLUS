const THEME_LIGHT = {
  value: 'light',
  label: 'theme_light',
  icon: {
    16: 'assets/icons/light/icon-16.png',
    32: 'assets/icons/light/icon-32.png',
    48: 'assets/icons/light/icon-48.png',
    64: 'assets/icons/light/icon-64.png',
    128: 'assets/icons/light/icon-128.png',
  },
};
const THEME_DARK = {
  value: 'dark',
  label: 'theme_dark',
  icon: {
    16: 'assets/icons/dark/icon-16.png',
    32: 'assets/icons/dark/icon-32.png',
    48: 'assets/icons/dark/icon-48.png',
    64: 'assets/icons/dark/icon-64.png',
    128: 'assets/icons/dark/icon-128.png',
  },
};
const THEME_SYSTEM = {
  value: 'system',
  label: 'theme_system',
};

const DEFAULTS = {
  THEME: 'system',
  FUNC_TYPE: 'funcType_openInTab',
  RECENT_SIZE: 20,
  MAX_LOGS: 10000,
  LAYOUT_ORDER: ['pinned', 'grouped', 'general'],
  SECTION_SORT: {
    pinned: { criteria: 'title', direction: 'asc' },
    grouped: { criteria: 'title', direction: 'asc' },
    general: { criteria: 'timestamp', direction: 'desc' },
  },
  COLLAPSE_STATE: { pinned: false, grouped: false, general: false },
  SESSION_PAGE_SIZE: 20,
  TAB_BATCH_RENDER: 50,
  RESTORE_CHUNK_SIZE: 15,
  RESTORE_CHUNK_DELAY: 200,
  SAVE_DEBOUNCE_MS: 2000,
  CACHE_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000,
  AI: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: '',
    models: [],
  },
};

module.exports = {
  POPUP_PATH: 'popup.html',
  RECENT_PATH: 'recent.html',
  OPTIONS_PATH: 'options.html',
  THEME_DEFAULT: THEME_SYSTEM,
  THEME_LIST: [THEME_LIGHT, THEME_DARK, THEME_SYSTEM],
  STORAGE_KEYS: {
    LAST_SESSION: 'lastSession',
    SESSION_HISTORY: 'sessionHistory',
  },
  THEME_ICONS: {
    light:
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.63" y2="5.63"/><line x1="18.37" y1="18.37" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.63" y2="18.37"/><line x1="18.37" y1="4.22" x2="19.78" y2="5.63"/></svg>',
    dark: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    system:
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="20" x2="22" y2="20"/></svg>',
  },
  DEFAULTS,
};
