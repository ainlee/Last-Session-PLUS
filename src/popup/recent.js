import sessions from '../lib/sessions';
import tabs from '../lib/tabs';
import util from '../lib/util';
import options from '../lib/options';
import { POPUP_PATH, OPTIONS_PATH, THEME_ICONS } from '../lib/constants';
import './recent.less';

document.addEventListener('DOMContentLoaded', () => {
  // 國際化
  const MSG_TITLE_RECENT = chrome.i18n.getMessage('title_recent');
  const MSG_LAST_SESSION = chrome.i18n.getMessage('title');
  const MSG_HISTORY = chrome.i18n.getMessage('history');

  document.title = MSG_TITLE_RECENT;
  document.getElementById('title').textContent = MSG_TITLE_RECENT;

  // 上次未關閉頁面按鈕單擊事件
  const btnLastSession = document.getElementById('last-session');
  btnLastSession.textContent = MSG_LAST_SESSION;
  btnLastSession.addEventListener('click', async () => {
    await tabs.active(chrome.runtime.getURL(POPUP_PATH));
  });

  // 歷史按鈕單擊事件
  const btnHistory = document.getElementById('history');
  btnHistory.textContent = MSG_HISTORY;
  btnHistory.addEventListener('click', async () => {
    const historyUrl = navigator.userAgent.includes('Edg') ? 'edge://history' : 'chrome://history';
    await tabs.create({ url: historyUrl, active: true });
  });

  // 主題管理
  async function applyTheme(theme) {
    document.body.className = theme;
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.innerHTML = THEME_ICONS[theme] || THEME_ICONS.system;
    }
  }

  async function initTheme() {
    const theme = await options.getTheme();
    applyTheme(theme);
  }

  async function handleThemeToggle() {
    const theme = await options.getTheme();
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];

    await options.setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  initTheme();

  const themeToggle = document.getElementById('theme-toggle');
  themeToggle.addEventListener('click', handleThemeToggle);

  const openOptions = document.getElementById('open-options');
  openOptions.addEventListener('click', async () => {
    await tabs.create({ url: chrome.runtime.getURL(OPTIONS_PATH) });
  });

  // 主動獲取最近關閉列表
  chrome.runtime.sendMessage({ command: 'getRecents' }, (recents) => {
    if (chrome.runtime.lastError) {
      console.error('[Recent] sendMessage(getRecents) failed:', chrome.runtime.lastError);
      return;
    }
    refreshRecentList(recents);
  });
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.command) {
      // 被動接收主題
      case 'setTheme':
        applyTheme(message.data);
        sendResponse();
        break;
    }
  });

  // 刷新最近關閉列表
  function refreshRecentList(recents) {
    const ul = document.getElementById('recent-list');
    util.emptyElement(ul);
    for (const item of recents) {
      // 建立圖示
      let icon;
      const favIconUrl = item.favIconDateUrl || item.favIconUrl;
      if (favIconUrl && !util.isPrivilegedUrl(favIconUrl)) {
        icon = document.createElement('div');
        icon.className = 'icon';
        icon.style.backgroundImage = `url('${favIconUrl}')`;
      } else {
        icon = document.createElement('div');
        icon.className = 'icon';
        icon.innerHTML =
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>';
      }
      // 建立標題
      const title = document.createElement('span');
      title.className = 'title';
      const titleText = document.createTextNode(item.title);
      title.title = item.title;
      title.appendChild(titleText);
      // 建立列表項
      const li = document.createElement('li');
      li.dataset.sessionId = item.sessionId;
      // 列表項單擊事件
      li.addEventListener('click', async (event) => {
        event.preventDefault();
        const sessionId = li.dataset.sessionId;
        await sessions.restore(sessionId);
        window.close();
      });
      li.appendChild(icon);
      li.appendChild(title);
      ul.appendChild(li);
    }
  }
});
