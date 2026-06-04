import tabs from '../lib/tabs';
import util from '../lib/util';
import options from '../lib/options';
import storage from '../lib/storage';
import { OPTIONS_PATH, THEME_ICONS, DEFAULTS } from '../lib/constants';
import './popup.less';

let highlightedUrls = null;
let _refreshTabList = null;

// ============================================================
// DEBUG: showMoveMenu 定義於檔案最頂層，確保函式提升 (Hoisting)
// ============================================================
console.log('[DEBUG] showMoveMenu defined at top level, typeof:', typeof showMoveMenu);

/**
 * 顯示分頁移動選單（全域函式，綁定至 window.showMoveMenu）
 * @param {HTMLElement} li - 分頁項目元素
 * @param {number} tabId - 分頁 ID
 */
async function showMoveMenu(li, tabUrl) {
  console.log('[DEBUG] showMoveMenu executed', { tabUrl });

  document.querySelectorAll('.move-menu, .group-submenu').forEach((m) => m.remove());

  const moveBtn = li.querySelector('.btn:not(.btn-delete)');
  if (!moveBtn) {
    return;
  }

  const rect = moveBtn.getBoundingClientRect();
  const menu = document.createElement('div');
  menu.className = 'move-menu';
  menu.style.position = 'absolute';
  menu.style.zIndex = '1000';

  function moveTab(updates) {
    chrome.runtime.sendMessage({ command: 'updateTabMetadata', data: { url: tabUrl, updates } }, () => {
      chrome.runtime.sendMessage({ command: 'getFlattenedHistory' }, (tabs) => {
        if (_refreshTabList) _refreshTabList(tabs);
      });
    });
  }

  const menuOptions = [
    { label: chrome.i18n.getMessage('move_pinned'), value: 'pinned', updates: { pinned: true, groupId: null } },
    { label: chrome.i18n.getMessage('move_general'), value: 'general', updates: { pinned: false, groupId: null } },
    { label: chrome.i18n.getMessage('move_to_group'), value: 'grouped', hasSubmenu: true },
  ];

  for (const opt of menuOptions) {
    const item = document.createElement('li');
    item.textContent = opt.label;
    if (opt.hasSubmenu) item.className = 'has-submenu';

    if (opt.hasSubmenu) {
      const submenu = document.createElement('ul');
      submenu.className = 'group-submenu';
      submenu.style.position = 'absolute';
      submenu.style.zIndex = '1001';

      try {
        const history = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ command: 'getSessionHistory' }, (r) => resolve(r || []));
        });
        const groupIds = new Set();
        for (const session of history) {
          if (!session.tabs) continue;
          for (const tab of session.tabs) {
            const gid = parseInt(tab.groupId, 10);
            if (!isNaN(gid) && gid > 0) groupIds.add(gid);
          }
        }
        if (groupIds.size > 0) {
          const sortedIds = [...groupIds].sort((a, b) => a - b);
          for (const gid of sortedIds) {
            const gi = document.createElement('li');
            const dot = document.createElement('span');
            dot.className = 'group-color-dot';
            dot.style.backgroundColor = 'var(--color-primary)';
            gi.appendChild(dot);
            gi.appendChild(document.createTextNode(chrome.i18n.getMessage('session_group_label', [gid])));
            gi.addEventListener('click', (e) => {
              e.stopPropagation();
              moveTab({ pinned: false, groupId: gid });
              menu.remove();
            });
            submenu.appendChild(gi);
          }
        } else {
          const emptyItem = document.createElement('li');
          emptyItem.textContent = chrome.i18n.getMessage('no_group');
          emptyItem.style.color = 'var(--color-text-quaternary)';
          submenu.appendChild(emptyItem);
        }
      } catch (err) {
        console.error('[DEBUG] showMoveMenu: Failed to list groups:', err);
      }

      let hideTimeout;
      item.addEventListener('mouseenter', () => {
        clearTimeout(hideTimeout);
        submenu.style.display = 'block';
        const ir = item.getBoundingClientRect();
        const sr = submenu.getBoundingClientRect();
        const vw = window.innerWidth,
          vh = window.innerHeight;
        const sx = window.scrollX || 0,
          sy = window.scrollY || 0;
        let left = ir.right + sx,
          top = ir.top + sy;
        if (left + sr.width > vw) left = ir.left + sx - sr.width;
        if (top + sr.height > vh) top = ir.bottom + sy - sr.height;
        const safe = 8;
        left = Math.max(safe, Math.min(left, vw - sr.width - safe));
        top = Math.max(safe, Math.min(top, vh - sr.height - safe));
        submenu.style.left = `${left}px`;
        submenu.style.top = `${top}px`;
      });
      item.addEventListener('mouseleave', () => {
        hideTimeout = setTimeout(() => {
          submenu.style.display = 'none';
        }, 150);
      });
      submenu.addEventListener('mouseenter', () => clearTimeout(hideTimeout));
      submenu.addEventListener('mouseleave', () => {
        submenu.style.display = 'none';
      });
      menu.appendChild(item);
      document.body.appendChild(submenu);
    } else {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        moveTab(opt.updates);
        menu.remove();
      });
      menu.appendChild(item);
    }
  }

  document.body.appendChild(menu);

  // 主選單邊界檢測與位置修正
  const menuRect = menu.getBoundingClientRect();
  const scrollX = window.scrollX || 0;
  const scrollY = window.scrollY || 0;
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  let top = rect.bottom + scrollY;
  let left = rect.left + scrollX;

  // 檢查是否超出底部邊界
  if (rect.bottom + menuRect.height > viewportH) {
    if (rect.top > menuRect.height) {
      top = rect.top + scrollY - menuRect.height;
    } else {
      top = Math.max(0, scrollY);
    }
  }

  // 檢查是否超出右側邊界
  if (rect.left + menuRect.width > viewportW) {
    left = viewportW - menuRect.width + scrollX;
  }

  // 確保不超出左側邊界
  left = Math.max(0, left);

  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;

  console.log('[DEBUG] Main menu positioned:', {
    left,
    top,
    btnRect: { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left },
    menuSize: { w: menuRect.width, h: menuRect.height },
    viewport: { w: viewportW, h: viewportH },
  });
}

// 立即綁定至 window 確保全域可見
window.showMoveMenu = showMoveMenu;
console.log('[DEBUG] window.showMoveMenu bound:', typeof window.showMoveMenu);

// ============================================================
//  CSS Grid-Template-Rows 展開/收闔動畫輔助函式
//  利用 0fr → 1fr 過渡，避免 height 動畫觸發全頁面 Reflow
// ============================================================

/**
 * 使用 CSS Grid 的 grid-template-rows 過渡執行平滑的展開/收闔動畫
 * 相較於 WAAPI height 動畫，此方案不會觸發全頁面 Layout，效能更佳
 *
 * @param {HTMLElement} element - 目標 DOM 元素（需具有 .collapsible-content 類別）
 * @param {boolean} isExpanding - true 為展開，false 為收闔
 * @returns {Promise<void>} 動畫完成後的 Promise
 */
function animateHeight(element, isExpanding) {
  if (!element) {
    return Promise.resolve();
  }

  if (element._transitionEndHandler) {
    element.removeEventListener('transitionend', element._transitionEndHandler);
    element._transitionEndHandler = null;
  }

  const TRANSITION_TIMEOUT = 500;

  function waitForTransition() {
    return new Promise((resolve) => {
      let settled = false;

      function done() {
        if (settled) return;
        settled = true;
        if (element._transitionEndHandler) {
          element.removeEventListener('transitionend', element._transitionEndHandler);
          element._transitionEndHandler = null;
        }
        clearTimeout(fallbackTimer);
        resolve();
      }

      const fallbackTimer = setTimeout(done, TRANSITION_TIMEOUT);

      const handler = () => {
        element.removeEventListener('transitionend', handler);
        element._transitionEndHandler = null;
        clearTimeout(fallbackTimer);
        resolve();
      };
      element._transitionEndHandler = handler;
      element.addEventListener('transitionend', handler);
    });
  }

  if (isExpanding) {
    element.style.display = 'grid';
    element.style.visibility = 'visible';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        element.style.gridTemplateRows = '1fr';
      });
    });

    return waitForTransition();
  } else {
    element.style.gridTemplateRows = '0fr';

    return waitForTransition().then(() => {
      element.style.display = 'none';
      element.style.visibility = 'hidden';
    });
  }
}

/**
 * 判斷元素當前是否處於折疊狀態
 * 以 display:none 或 height:0 為判斷依據
 * @param {HTMLElement} el
 * @returns {boolean}
 */
function isCurrentlyCollapsed(el) {
  if (!el) return true;
  // 優先使用 dataset 狀態，避免觸發強制同步佈局 (Forced Synchronous Layout)
  if (el.dataset.collapsed !== undefined) {
    return el.dataset.collapsed === 'true';
  }
  // 回退方案
  return el.style.display === 'none' || el.style.gridTemplateRows === '0fr';
}

/**
 * 分批渲染分頁項目，避免一次性插入大量 DOM 導致主線程卡死
 * @param {HTMLElement} container - 目標 UL 元素
 * @param {Array} tabs - 分頁資料陣列
 * @param {number} batchSize - 每批渲染數量
 */
function renderTabsInBatches(container, tabs, batchSize = DEFAULTS.TAB_BATCH_RENDER) {
  // 取消該容器先前未完成的 batch render
  if (container._batchTimerId) {
    clearTimeout(container._batchTimerId);
    container._batchTimerId = null;
  }

  if (!container || !tabs || tabs.length === 0) return;

  if (container.children.length >= tabs.length) return;

  let index = 0;
  function processBatch() {
    const end = Math.min(index + batchSize, tabs.length);
    const fragment = document.createDocumentFragment();
    for (; index < end; index++) {
      fragment.appendChild(createTabItem(tabs[index], tabs[index].removed || false));
    }
    container.appendChild(fragment);
    if (index < tabs.length) {
      container._batchTimerId = setTimeout(processBatch, 0);
    } else {
      container._batchTimerId = null;
    }
  }

  container._batchTimerId = setTimeout(processBatch, 0);
}

function getSectionName(id) {
  const names = {
    pinned: chrome.i18n.getMessage('section_pinned'),
    grouped: chrome.i18n.getMessage('section_grouped'),
    general: chrome.i18n.getMessage('section_general'),
  };
  return names[id] || id;
}

const DELETE_ICON =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';
const RESTORE_ICON =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>';

function createTabItem(tab, isRemoved) {
  const li = document.createElement('li');
  li.dataset.tabUrl = tab.url;
  li.dataset.tabId = tab.id;
  if (isRemoved) li.classList.add('removed');
  // li.draggable = true; // 拖曳功能已封存

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'tab-checkbox';
  if (highlightedUrls && highlightedUrls.has(tab.url)) {
    checkbox.checked = true;
    li.classList.add('is-selected');
  }
  checkbox.addEventListener('change', (e) => {
    li.classList.toggle('is-selected', e.target.checked);
    updateBatchBarVisibility();
  });

  let icon;
  if (tab.favIconUrl) {
    icon = document.createElement('div');
    icon.className = 'icon';
    icon.style.backgroundImage = `url('${tab.favIconUrl}')`;
  } else {
    icon = document.createElement('div');
    icon.className = 'icon';
    icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>`;
  }

  const title = document.createElement('a');
  title.className = 'title';
  title.href = tab.url || '#';
  title.textContent = tab.title || tab.url || chrome.i18n.getMessage('tab_untitled');
  title.addEventListener('click', async (event) => {
    event.preventDefault();
    li.classList.add('removed');

    // 更新 ICON 為復原圖標
    const actionBtn = li.querySelector('.btn-delete');
    if (actionBtn) {
      actionBtn.innerHTML = RESTORE_ICON;
    }

    chrome.runtime.sendMessage({ command: 'setRemoved', data: { url: tab.url, removed: true } });
    await tabs.create({ url: tab.url, active: false });
  });

  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'tab-actions';
  actionsDiv.style.display = 'flex';
  actionsDiv.style.alignItems = 'center';
  actionsDiv.style.gap = 'var(--space-1)';

  const moveBtn = document.createElement('span');
  moveBtn.className = 'btn';
  moveBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
  moveBtn.title = chrome.i18n.getMessage('move_title');
  moveBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    showMoveMenu(li, tab.url);
  });

  const btn = document.createElement('span');
  btn.className = 'btn btn-delete';
  btn.innerHTML = isRemoved ? RESTORE_ICON : DELETE_ICON;
  btn.addEventListener('click', (event) => {
    event.stopPropagation();
    li.classList.toggle('removed');
    btn.innerHTML = li.classList.contains('removed') ? RESTORE_ICON : DELETE_ICON;
    chrome.runtime.sendMessage({
      command: 'setRemoved',
      data: { url: tab.url, removed: li.classList.contains('removed') },
    });
  });

  actionsDiv.appendChild(moveBtn);
  actionsDiv.appendChild(btn);

  li.appendChild(checkbox);
  li.appendChild(icon);
  li.appendChild(title);
  li.appendChild(actionsDiv);
  return li;
}

// 批量操作列已封存，保留 stub 避免呼叫錯誤
function updateBatchBarVisibility() {}

function initPopup() {
  // 國際化
  const t = (key, sub) => chrome.i18n.getMessage(key, sub);
  const MSG_TITLE = t('title');
  const MSG_REMOVE_SELECTED = t('removeSelected');
  const MSG_OPEN_SELECTED = t('openSelected');

  document.title = MSG_TITLE;
  document.getElementById('title').textContent = MSG_TITLE;

  // 初始化優化按鈕與選單文字
  document.getElementById('ai-optimize').textContent = t('optimize_btn');
  document.querySelectorAll('.optimize-mode').forEach((el) => {
    const map = {
      'purge-removed': 'optimize_purge',
      'exact-match': 'optimize_exact',
      'ignore-query': 'optimize_ignore_query',
      'domain-path': 'optimize_domain',
    };
    el.textContent = t(map[el.dataset.mode] || el.dataset.mode);
  });
  document.getElementById('sync-now').textContent = t('sync_btn');
  document.getElementById('global-search').placeholder = t('search_placeholder');

  // 刪除選取項目按鈕單擊事件
  const removeSelected = document.getElementById('remove-selected');
  if (removeSelected) {
    removeSelected.textContent = MSG_REMOVE_SELECTED;
    removeSelected.addEventListener('click', async () => {
      const selectedItems = document.querySelectorAll('.tab-list li.is-selected');
      if (selectedItems.length === 0) return;

      for (const li of selectedItems) {
        const url = li.dataset.tabUrl;
        li.classList.add('removed');
        await chrome.runtime.sendMessage({ command: 'setRemoved', data: { url, removed: true } }).catch((err) => {
          console.error('[Popup] sendMessage(setRemoved) failed:', err);
        });
      }
      highlightedUrls = null;
      updateBatchBarVisibility();
    });
  }

  // 開啟選取項目按鈕單擊事件
  const openSelected = document.getElementById('open-selected');
  if (openSelected) {
    openSelected.textContent = MSG_OPEN_SELECTED;
    openSelected.addEventListener('click', async () => {
      const selectedItems = document.querySelectorAll('.tab-list li.is-selected');
      if (selectedItems.length === 0) return;

      for (const li of selectedItems) {
        const url = li.dataset.tabUrl;
        li.classList.add('removed');
        await tabs.create({ url, active: false });
        await chrome.runtime.sendMessage({ command: 'setRemoved', data: { url, removed: true } }).catch((err) => {
          console.error('[Popup] sendMessage(setRemoved) failed:', err);
        });
      }
    });
  }

  // 設定按鈕單擊事件
  const openOptions = document.getElementById('open-options');
  openOptions.addEventListener('click', () => {
    window.location.href = chrome.runtime.getURL(OPTIONS_PATH);
  });

  // 手動同步按鈕
  const syncNow = document.getElementById('sync-now');
  syncNow.addEventListener('click', async () => {
    const originalText = syncNow.textContent;
    syncNow.textContent = chrome.i18n.getMessage('sync_syncing');
    try {
      const response = await chrome.runtime.sendMessage({ command: 'sync' });
      if (response && response.success) {
        syncNow.textContent = chrome.i18n.getMessage('sync_done');
      } else {
        throw new Error(response?.error || chrome.i18n.getMessage('sync_error'));
      }
    } catch (error) {
      console.error('Sync Error:', error);
      syncNow.textContent = chrome.i18n.getMessage('sync_error');
    } finally {
      setTimeout(() => {
        syncNow.textContent = originalText;
      }, 2000);
    }
  });

  // ============================================================
  //  優化按鈕 + 次選單（hover 展開）
  // ============================================================
  const optimizeDropdown = document.getElementById('optimize-dropdown');
  const optimizeBtn = document.getElementById('ai-optimize');
  const optimizeSubmenu = document.getElementById('optimize-submenu');

  /** 關閉次選單 */
  function hideOptimizeSubmenu() {
    if (optimizeSubmenu) optimizeSubmenu.style.display = 'none';
  }

  /** 顯示次選單 */
  function showOptimizeSubmenu() {
    if (optimizeSubmenu) optimizeSubmenu.style.display = 'block';
  }

  // hover 展開/關閉
  if (optimizeDropdown) {
    let submenuTimer;
    optimizeDropdown.addEventListener('mouseenter', () => {
      clearTimeout(submenuTimer);
      showOptimizeSubmenu();
    });
    optimizeDropdown.addEventListener('mouseleave', () => {
      submenuTimer = setTimeout(hideOptimizeSubmenu, 200);
    });
  }

  // 主按鈕點擊 → 預設動作：URL 完全匹配去重，自動標記為刪除
  if (optimizeBtn) {
    optimizeBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const originalText = optimizeBtn.textContent;
      optimizeBtn.textContent = chrome.i18n.getMessage('optimize_running');
      optimizeBtn.style.opacity = '0.6';
      optimizeBtn.style.pointerEvents = 'none';

      try {
        const result = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({ command: 'markDuplicates', data: { mode: 'exact-match' } }, (response) => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else if (!response || !response.success)
              reject(new Error(response?.error || chrome.i18n.getMessage('optimize_failed')));
            else resolve(response);
          });
        });

        const messageParts = [];
        if (result.marked > 0) messageParts.push(chrome.i18n.getMessage('optimize_done_deleted', [result.marked]));
        if (result.merged > 0) messageParts.push(chrome.i18n.getMessage('optimize_done_merged', [result.merged]));
        optimizeBtn.textContent =
          messageParts.length > 0
            ? messageParts.join(chrome.i18n.getMessage('optimize_done_separator'))
            : chrome.i18n.getMessage('optimize_done_none');
        highlightedUrls = null;
        chrome.runtime.sendMessage({ command: 'getFlattenedHistory' }, (tabs) => {
          if (!chrome.runtime.lastError) refreshTabList(tabs);
        });
      } catch (error) {
        console.error('Optimize Error:', error);
        optimizeBtn.textContent = chrome.i18n.getMessage('optimize_failed');
      } finally {
        setTimeout(() => {
          optimizeBtn.textContent = originalText;
          optimizeBtn.style.opacity = '1';
          optimizeBtn.style.pointerEvents = 'auto';
        }, 2000);
      }
    });
  }

  // 次選單模式點擊
  document.querySelectorAll('.optimize-mode').forEach((el) => {
    el.addEventListener('click', async (e) => {
      e.stopPropagation();
      hideOptimizeSubmenu();

      const mode = el.dataset.mode;

      // 清除已刪除：直接呼叫 optimize
      if (mode === 'purge-removed') {
        const originalText = optimizeBtn.textContent;
        optimizeBtn.textContent = chrome.i18n.getMessage('purge_running');
        optimizeBtn.style.opacity = '0.6';
        optimizeBtn.style.pointerEvents = 'none';

        try {
          const result = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ command: 'optimize' }, (response) => {
              if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
              else if (!response || !response.success)
                reject(new Error(response?.error || chrome.i18n.getMessage('purge_failed')));
              else resolve(response);
            });
          });
          optimizeBtn.textContent =
            result.cleaned > 0
              ? chrome.i18n.getMessage('purge_done', [result.cleaned])
              : chrome.i18n.getMessage('purge_none');
          highlightedUrls = null;
          chrome.runtime.sendMessage({ command: 'getFlattenedHistory' }, (tabs) => {
            if (!chrome.runtime.lastError) refreshTabList(tabs);
          });
        } catch (error) {
          console.error('Purge Error:', error);
          optimizeBtn.textContent = chrome.i18n.getMessage('purge_failed');
        } finally {
          setTimeout(() => {
            optimizeBtn.textContent = originalText;
            optimizeBtn.style.opacity = '1';
            optimizeBtn.style.pointerEvents = 'auto';
          }, 2000);
        }
        return;
      }

      // 去重模式：計算重複 + 勾選（用戶須再點「刪除選取」）
      const modeLabels = {
        'exact-match': chrome.i18n.getMessage('optimize_exact'),
        'ignore-query': chrome.i18n.getMessage('optimize_ignore_query'),
        'domain-path': chrome.i18n.getMessage('optimize_domain'),
      };

      const originalText = optimizeBtn.textContent;
      optimizeBtn.textContent = chrome.i18n.getMessage('compare_running');
      optimizeBtn.style.opacity = '0.6';

      try {
        const result = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({ command: 'findDuplicates', data: { mode } }, (response) => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else if (!response || !response.success)
              reject(new Error(response?.error || chrome.i18n.getMessage('optimize_failed')));
            else resolve(response);
          });
        });

        highlightedUrls = new Set(result.duplicates || []);
        optimizeBtn.textContent =
          highlightedUrls.size > 0
            ? chrome.i18n.getMessage('compare_selected', [highlightedUrls.size])
            : chrome.i18n.getMessage('compare_none');

        chrome.runtime.sendMessage({ command: 'getFlattenedHistory' }, (tabs) => {
          if (!chrome.runtime.lastError) refreshTabList(tabs);
        });
      } catch (error) {
        console.error('FindDuplicates Error:', error);
        optimizeBtn.textContent = chrome.i18n.getMessage('compare_failed');
      } finally {
        setTimeout(() => {
          optimizeBtn.textContent = originalText;
          optimizeBtn.style.opacity = '1';
        }, 2000);
      }
    });
  });

  // 點擊頁面其他區域關閉次選單
  document.addEventListener('click', (e) => {
    if (optimizeDropdown && !optimizeDropdown.contains(e.target)) {
      hideOptimizeSubmenu();
    }
  });

  let lastSession = null;
  const SESSION_PAGE_SIZE = DEFAULTS.SESSION_PAGE_SIZE;
  let sessionLoadCount = SESSION_PAGE_SIZE;
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

  // 點擊頁面其他區域關閉自定義下拉列表
  document.addEventListener('click', () => {
    document.querySelectorAll('.picker-options').forEach((el) => {
      el.style.display = 'none';
    });
    document.querySelectorAll('.move-menu, .group-submenu').forEach((el) => {
      el.remove();
    });
  });

  // Popup 開啟時先刷寫待存資料、清理、再渲染
  (async function initSessionView() {
    // 1. 強制刷寫（flush 任何待執行的 debounced save）
    try {
      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ command: 'forceSaveSession' }, (response) => {
          if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
          else resolve(response);
        });
      });
      console.log('[Diagnostic] forceSaveSession completed');
    } catch (error) {
      console.log('[Diagnostic] forceSaveSession skipped:', error.message);
    }

    // 2. 診斷：讀取原始儲存狀態
    chrome.runtime.sendMessage({ command: 'diagnoseStorage' }, (diagnosis) => {
      if (!chrome.runtime.lastError && diagnosis) {
        console.log('[Diagnostic] Storage diagnosis:', diagnosis);
      }
    });

    // 3. 取得最新資料並渲染
    function fetchAndRender() {
      chrome.runtime.sendMessage({ command: 'getFlattenedHistory' }, (tabs) => {
        if (chrome.runtime.lastError) {
          const err = chrome.runtime.lastError;
          console.error('[Popup] sendMessage(getFlattenedHistory) failed:', err);
          if (err.message && err.message.includes('Could not establish connection')) {
            console.warn('[Popup] Service Worker might not be ready. Retrying in 500ms...');
            setTimeout(() => {
              chrome.runtime.sendMessage({ command: 'getFlattenedHistory' }, (tabs) => {
                if (!chrome.runtime.lastError) refreshTabList(tabs);
              });
            }, 500);
          }
          return;
        }
        console.log('[Diagnostic] getFlattenedHistory returned:', tabs?.length, 'tabs');
        refreshTabList(tabs);
      });
    }

    fetchAndRender();

    // 4. 若 1.5 秒後一般區塊仍為空，嘗試重新讀取（應付背景寫入延遲）
    setTimeout(() => {
      const generalContainer = document.getElementById('general-sections-container');
      const emptyMsg = generalContainer?.querySelector('.history-empty');
      const rightColumn = document.getElementById('right-column');
      const emptyMsgAlt = rightColumn?.querySelector('.history-empty');
      if (emptyMsg || emptyMsgAlt) {
        console.log('[Diagnostic] General section empty after 1.5s, re-fetching data...');
        fetchAndRender();
      }
    }, 1500);
  })();

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.command) {
      case 'setTheme':
        applyTheme(message.data);
        sendResponse();
        break;
      case 'setLastSession':
        chrome.runtime.sendMessage({ command: 'getFlattenedHistory' }, (tabs) => {
          if (!chrome.runtime.lastError) refreshTabList(tabs);
        });
        sendResponse();
        break;
      case 'clearStorage':
        const ul = document.getElementById('tab-list');
        util.emptyElement(ul);
        sendResponse();
        break;
    }
  });

  // 更新同步指示器
  async function updateSyncIndicator() {
    const indicator = document.getElementById('sync-indicator');
    const statusItems = await chrome.storage.local.get({ sync_status: { state: 'idle' } });
    const status = statusItems['sync_status'];

    const cloudIcon =
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>';
    if (status.state === 'syncing') {
      indicator.innerHTML = `${cloudIcon} ${chrome.i18n.getMessage('sync_syncing')}`;
    } else if (status.state === 'error') {
      indicator.innerHTML = `${cloudIcon} ${chrome.i18n.getMessage('sync_error')}`;
    } else {
      indicator.innerHTML = `${cloudIcon} ${chrome.i18n.getMessage('sync_done')}`;
    }
  }

  setInterval(updateSyncIndicator, 3000);
  updateSyncIndicator();

  // ============================================================
  //  全局搜尋邏輯：監聽搜尋框輸入，對所有會話進行跨會話過濾
  // ============================================================
  const globalSearchInput = document.getElementById('global-search');
  if (globalSearchInput) {
    let searchDebounceTimer;
    globalSearchInput.addEventListener('input', () => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        const query = globalSearchInput.value.toLowerCase();
        applyGlobalSearchFilter(query);
      }, 300);
    });
  }

  /**
   * 根據搜尋關鍵字過濾所有區塊（general session + pinned/grouped）的分頁
   * @param {string} query - 搜尋關鍵字（已轉小寫）
   */
  function applyGlobalSearchFilter(query) {
    const isFiltering = !!query;

    // 1. 處理 general 區塊的 session-block
    const sessionBlocks = document.querySelectorAll('.session-block');
    sessionBlocks.forEach((block) => {
      const tabItems = block.querySelectorAll('.tab-list li');
      let hasVisibleTab = false;

      if (block._tabs && tabItems.length === 0) {
        const ul = block.querySelector('.tab-list');
        if (ul) {
          const fragment = document.createDocumentFragment();
          block._tabs.forEach((tab) => {
            fragment.appendChild(createTabItem(tab, tab.removed || false));
          });
          ul.appendChild(fragment);
        }
      }

      tabItems.forEach((li) => {
        const titleEl = li.querySelector('.title');
        const url = li.dataset.tabUrl || '';
        const titleText = titleEl ? titleEl.textContent.toLowerCase() : '';
        const matches = !query || titleText.includes(query) || url.toLowerCase().includes(query);

        li.style.display = matches ? 'flex' : 'none';
        if (matches) hasVisibleTab = true;
      });

      block.style.display = hasVisibleTab ? '' : 'none';
    });

    // 2. 處理 pinned / grouped 區塊（左欄）
    const tabSections = document.querySelectorAll('.tab-section');
    tabSections.forEach((section) => {
      const sectionId = section.dataset.sectionId;
      if (sectionId === 'general') return;

      const tabItems = section.querySelectorAll('.tab-list li');
      let hasVisibleTab = false;

      tabItems.forEach((li) => {
        const titleEl = li.querySelector('.title');
        const url = li.dataset.tabUrl || '';
        const titleText = titleEl ? titleEl.textContent.toLowerCase() : '';
        const matches = !query || titleText.includes(query) || url.toLowerCase().includes(query);

        li.style.display = matches ? 'flex' : 'none';
        if (matches) hasVisibleTab = true;
      });

      section.style.display = !isFiltering || hasVisibleTab ? '' : 'none';
    });
  }

  // ============================================================
  //  兩層級渲染：SessionBlock → TabList
  // ============================================================

  /**
   * 刷新分頁列表（主入口）
   * 從扁平化資料切換為兩層級結構：獲取所有會話，按會話分組渲染
   * @param {Array} flattenedTabs - 扁平化分頁陣列（用於 pinned/grouped 區塊）
   */
  async function refreshTabList(flattenedTabs) {
    _refreshTabList = refreshTabList;
    console.log('[DEBUG] refreshTabList started');
    sessionLoadCount = SESSION_PAGE_SIZE;
    const layoutOrder = await storage.getLayoutOrder();
    console.log('[DEBUG] refreshTabList layoutOrder:', layoutOrder);

    const leftColumn = document.getElementById('left-column');
    const rightColumn = document.getElementById('right-column');
    const generalSectionsContainer = document.getElementById('general-sections-container');
    util.emptyElement(leftColumn);
    if (generalSectionsContainer) {
      util.emptyElement(generalSectionsContainer);
    } else {
      util.emptyElement(rightColumn);
    }
    // 清理殘留在 body 上的排序下拉選單（會話區塊的 scOptions）
    document.querySelectorAll('body > .picker-options').forEach((el) => el.remove());

    try {
      // 獲取兩層級會話資料
      const sessionHistory = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ command: 'getSessionHistory' }, (response) => {
          resolve(response || []);
        });
      });

      console.log('[Diagnostic] getSessionHistory returned:', {
        count: sessionHistory?.length,
        totalTabs: sessionHistory?.reduce((sum, s) => sum + (s.tabs?.length || 0), 0),
        firstSession: sessionHistory?.[0] ? { id: sessionHistory[0].id, tabs: sessionHistory[0].tabs?.length } : null,
      });

      // 對扁平化資料進行分桶（用於 pinned/grouped 區塊）
      const mergedBucketted = Array.isArray(flattenedTabs)
        ? tabs.bucket(flattenedTabs)
        : { pinned: [], general: [], grouped: new Map() };

      const sortConfig = await storage.getSectionSortConfig();

      if (!Array.isArray(layoutOrder)) return;
      for (const sectionId of layoutOrder) {
        console.log('[DEBUG] renderSection called for sectionId:', sectionId);
        const section = await renderSection(sectionId, mergedBucketted, flattenedTabs, sessionHistory, sortConfig);
        if (section) {
          if (sectionId === 'general') {
            const generalSectionsContainer = document.getElementById('general-sections-container');
            if (generalSectionsContainer) {
              console.log('[DEBUG] Appending general section to generalSectionsContainer');
              generalSectionsContainer.appendChild(section);
            } else {
              console.log('[DEBUG] Appending general section to rightColumn');
              rightColumn.appendChild(section);
            }
          } else {
            leftColumn.appendChild(section);
          }
        }
      }
    } catch (error) {
      console.error('[Popup] refreshTabList failed:', error);
    }

    // 渲染後立即應用當前的搜尋過濾
    if (globalSearchInput) {
      applyGlobalSearchFilter(globalSearchInput.value.toLowerCase());
    }

    // 確保 highlight 狀態的 batch bar 正確顯示
    updateBatchBarVisibility();
  }

  /**
   * 渲染單個區塊
   * @param {string} sectionId - 區塊 ID ('pinned', 'grouped', 'general')
   * @param {Object} bucketted - 分桶後的資料
   * @param {Array} flattenedTabs - 扁平化分頁
   * @param {Array} sessionHistory - 兩層級會話歷史
   * @param {Object} sortConfig - 排序設定
   * @returns {HTMLElement} 區塊 DOM 元素
   */
  async function renderSection(sectionId, bucketted, flattenedTabs, sessionHistory, sortConfig) {
    console.log('[DEBUG] renderSection executing for:', sectionId, {
      sessionHistoryCount: sessionHistory?.length,
    });
    const safeBucketted = {
      pinned: [],
      general: [],
      grouped: new Map(),
      ...bucketted,
    };
    if (!(safeBucketted.grouped instanceof Map)) {
      safeBucketted.grouped = new Map();
    }

    // 讀取折疊狀態
    const collapseState = await storage.getCollapseState();
    const isCollapsed = collapseState[sectionId] || false;

    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'tab-section';
    sectionDiv.dataset.sectionId = sectionId;

    const header = document.createElement('div');
    header.className = 'section-header';

    // 折疊/展開切換按鈕（section 級）
    const toggleBtn = document.createElement('span');
    toggleBtn.className = 'collapse-toggle';
    toggleBtn.innerHTML = isCollapsed ? '▶' : '▼';
    toggleBtn.title = isCollapsed ? chrome.i18n.getMessage('toggle_expand') : chrome.i18n.getMessage('toggle_collapse');

    const titleSpan = document.createElement('span');
    titleSpan.className = 'section-title';
    titleSpan.textContent = getSectionName(sectionId);

    const controls = document.createElement('div');
    controls.className = 'section-controls';

    // 排序控制項（parent 層級僅方向按鈕，子層排序在 session-block 中）
    if (sectionId === 'general') {
      const directionBtn = document.createElement('button');
      directionBtn.className = 'section-sort-direction-btn';
      const currentDir = sortConfig[sectionId]?.direction || 'desc';
      directionBtn.innerHTML = currentDir === 'asc' ? '↑' : '↓';
      directionBtn.title =
        currentDir === 'asc' ? chrome.i18n.getMessage('sort_reverse') : chrome.i18n.getMessage('sort_forward');
      directionBtn.addEventListener('click', async () => {
        const nextDir = currentDir === 'asc' ? 'desc' : 'asc';
        const newConfig = { ...sortConfig, [sectionId]: { ...sortConfig[sectionId], direction: nextDir } };
        await storage.setSectionSortConfig(newConfig);
        chrome.runtime.sendMessage({ command: 'getFlattenedHistory' }, (tabs) => refreshTabList(tabs));
      });
      controls.appendChild(directionBtn);
    }

    if (sectionId === 'pinned' || sectionId === 'grouped') {
      const sortPickerContainer = document.createElement('div');
      sortPickerContainer.className = 'custom-sort-picker';
      const trigger = document.createElement('div');
      trigger.className = 'picker-trigger';
      const optionsList = document.createElement('ul');
      optionsList.className = 'picker-options';
      optionsList.style.display = 'none';
      const criteriaMap = {
        title: chrome.i18n.getMessage('sort_title'),
        url: chrome.i18n.getMessage('sort_url'),
        timestamp: chrome.i18n.getMessage('sort_time'),
      };
      const currentCriteria = sortConfig[sectionId]?.criteria || 'title';
      trigger.textContent = criteriaMap[currentCriteria] || chrome.i18n.getMessage('sort_title');
      Object.entries(criteriaMap).forEach(([value, label]) => {
        const li = document.createElement('li');
        li.textContent = label;
        li.dataset.value = value;
        li.addEventListener('click', async (e) => {
          e.stopPropagation();
          trigger.textContent = label;
          optionsList.style.display = 'none';
          const newConfig = { ...sortConfig, [sectionId]: { ...sortConfig[sectionId], criteria: value } };
          await storage.setSectionSortConfig(newConfig);
          chrome.runtime.sendMessage({ command: 'getFlattenedHistory' }, (tabs) => refreshTabList(tabs));
        });
        optionsList.appendChild(li);
      });
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = optionsList.style.display === 'block';
        document.querySelectorAll('.picker-options').forEach((el) => {
          el.style.display = 'none';
        });
        optionsList.style.display = isOpen ? 'none' : 'block';
      });
      sortPickerContainer.appendChild(trigger);
      sortPickerContainer.appendChild(optionsList);

      const directionBtn = document.createElement('button');
      directionBtn.className = 'section-sort-direction-btn';
      const currentDir = sortConfig[sectionId]?.direction || 'asc';
      directionBtn.innerHTML = currentDir === 'asc' ? '↑' : '↓';
      directionBtn.title =
        currentDir === 'asc' ? chrome.i18n.getMessage('sort_reverse') : chrome.i18n.getMessage('sort_forward');
      directionBtn.addEventListener('click', async () => {
        const nextDir = currentDir === 'asc' ? 'desc' : 'asc';
        const newConfig = { ...sortConfig, [sectionId]: { ...sortConfig[sectionId], direction: nextDir } };
        await storage.setSectionSortConfig(newConfig);
        chrome.runtime.sendMessage({ command: 'getFlattenedHistory' }, (tabs) => refreshTabList(tabs));
      });

      controls.appendChild(sortPickerContainer);
      controls.appendChild(directionBtn);
    }

    header.appendChild(toggleBtn);
    header.appendChild(titleSpan);
    header.appendChild(controls);
    sectionDiv.appendChild(header);

    // 根據區塊類型渲染內容
    if (sectionId === 'pinned') {
      const sectionTabs = Array.isArray(safeBucketted.pinned) ? [...safeBucketted.pinned] : [];
      const config = sortConfig[sectionId];
      sectionTabs.sort((a, b) => {
        const criteria = config?.criteria || 'title';
        const dir = config?.direction === 'desc' ? -1 : 1;
        if (criteria === 'title') return a.title.localeCompare(b.title) * dir;
        if (criteria === 'url') return a.url.localeCompare(b.url) * dir;
        if (criteria === 'timestamp') return ((a.timestamp || 0) - (b.timestamp || 0)) * dir;
        return 0;
      });

      const wrapper = document.createElement('div');
      wrapper.className = 'collapsible-wrapper';
      const inner = document.createElement('div');
      inner.className = 'collapsible-inner';

      const ul = document.createElement('ul');
      ul.className = 'tab-list';
      for (const tab of sectionTabs) {
        ul.appendChild(createTabItem(tab, tab.removed || false));
      }
      inner.appendChild(ul);
      wrapper.appendChild(inner);
      sectionDiv.appendChild(wrapper);

      // 綁定 section 級 toggleBtn 點擊事件（pinned 區塊）
      toggleBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const wrapperEl = sectionDiv.querySelector(':scope > .collapsible-wrapper');
        const newCollapsed = !isCurrentlyCollapsed(wrapperEl);

        // 1. 立即更新 UI 狀態
        toggleBtn.innerHTML = newCollapsed ? '▶' : '▼';
        toggleBtn.title = newCollapsed
          ? chrome.i18n.getMessage('toggle_expand')
          : chrome.i18n.getMessage('toggle_collapse');
        wrapperEl.dataset.collapsed = newCollapsed;

        // 2. 非同步更新儲存狀態 (不 await，避免阻塞動畫)
        storage
          .setCollapseState(sectionId, newCollapsed)
          .catch((err) => console.error(`storage.setCollapseState failed for ${sectionId}:`, err));

        // 3. 執行動畫
        await animateHeight(wrapperEl, !newCollapsed);
      });

      // 初始化折疊狀態：直接設定 display:none + gridTemplateRows:0fr，不觸發動畫
      if (isCollapsed) {
        wrapper.style.display = 'none';
        wrapper.style.gridTemplateRows = '0fr';
        wrapper.dataset.collapsed = 'true';
      } else {
        wrapper.style.display = 'grid';
        wrapper.style.gridTemplateRows = '1fr';
        wrapper.dataset.collapsed = 'false';
      }
    } else if (sectionId === 'grouped') {
      const config = sortConfig[sectionId];
      const groupedMap = safeBucketted.grouped;
      const wrapper = document.createElement('div');
      wrapper.className = 'collapsible-wrapper';
      const inner = document.createElement('div');
      inner.className = 'collapsible-inner';

      const ul = document.createElement('ul');
      ul.className = 'tab-list';

      for (const [groupId, groupTabs] of groupedMap.entries()) {
        const groupHeader = document.createElement('div');
        groupHeader.className = 'group-divider';
        groupHeader.style.fontSize = 'var(--text-xs)';
        groupHeader.style.color = 'var(--color-text-tertiary)';
        groupHeader.style.padding = 'var(--space-1) var(--space-3)';
        groupHeader.textContent = chrome.i18n.getMessage('session_group_label', [groupId]);
        groupHeader.style.borderLeft = `4px solid var(--color-primary)`;
        ul.appendChild(groupHeader);

        const sortedGroupTabs = Array.isArray(groupTabs)
          ? [...groupTabs].sort((a, b) => {
              const criteria = config?.criteria || 'title';
              const dir = config?.direction === 'desc' ? -1 : 1;
              if (criteria === 'title') return a.title.localeCompare(b.title) * dir;
              if (criteria === 'url') return a.url.localeCompare(b.url) * dir;
              if (criteria === 'timestamp') return ((a.timestamp || 0) - (b.timestamp || 0)) * dir;
              return 0;
            })
          : [];
        for (const tab of sortedGroupTabs) {
          ul.appendChild(createTabItem(tab, tab.removed || false));
        }
      }
      inner.appendChild(ul);
      wrapper.appendChild(inner);
      sectionDiv.appendChild(wrapper);

      // 綁定 section 級 toggleBtn 點擊事件（grouped 區塊）
      toggleBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const wrapperEl = sectionDiv.querySelector(':scope > .collapsible-wrapper');
        const newCollapsed = !isCurrentlyCollapsed(wrapperEl);

        // 1. 立即更新 UI 狀態
        toggleBtn.innerHTML = newCollapsed ? '▶' : '▼';
        toggleBtn.title = newCollapsed
          ? chrome.i18n.getMessage('toggle_expand')
          : chrome.i18n.getMessage('toggle_collapse');
        wrapperEl.dataset.collapsed = newCollapsed;

        // 2. 非同步更新儲存狀態 (不 await，避免阻塞動畫)
        storage
          .setCollapseState(sectionId, newCollapsed)
          .catch((err) => console.error(`storage.setCollapseState failed for ${sectionId}:`, err));

        // 3. 執行動畫
        await animateHeight(wrapperEl, !newCollapsed);
      });

      // 初始化折疊狀態：直接設定 display:none + gridTemplateRows:0fr，不觸發動畫
      if (isCollapsed) {
        wrapper.style.display = 'none';
        wrapper.style.gridTemplateRows = '0fr';
        wrapper.dataset.collapsed = 'true';
      } else {
        wrapper.style.display = 'grid';
        wrapper.style.gridTemplateRows = '1fr';
        wrapper.dataset.collapsed = 'false';
      }
    } else if (sectionId === 'general') {
      // ============================================================
      //  兩層級渲染：遍歷所有會話，每個會話渲染為一個 SessionBlock
      //  所有 session-block 包裹在 .section-content.collapsible-content 中
      // ============================================================
      const config = sortConfig[sectionId] || { ...DEFAULTS.SECTION_SORT.general };

      const wrapper = document.createElement('div');
      wrapper.className = 'collapsible-wrapper';
      const inner = document.createElement('div');
      inner.className = 'collapsible-inner';

      const sectionContent = document.createElement('div');
      sectionContent.className = 'section-content';

      console.log('[Diagnostic] renderSection(general): sessionHistory check', {
        length: sessionHistory?.length,
        validSessions: (sessionHistory || []).filter((s) => s && typeof s.id === 'string' && Array.isArray(s.tabs))
          .length,
        allHaveTabs: (sessionHistory || []).every((s) => s.tabs?.length > 0),
        sampleIds: (sessionHistory || []).slice(0, 3).map((s) => ({ id: s.id, tabs: s.tabs?.length })),
      });

      if (!sessionHistory || sessionHistory.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'history-empty';
        emptyMsg.textContent = chrome.i18n.getMessage('session_empty');
        emptyMsg.style.padding = 'var(--space-4)';
        emptyMsg.style.textAlign = 'center';
        sectionContent.appendChild(emptyMsg);
      } else {
        // 父層排序：根據設定方向排序會話
        const dir = config.direction === 'desc' ? 1 : -1;
        const sortedSessions = sessionHistory
          .map((s, i) => ({ ...s, originalIndex: i }))
          .sort((a, b) => ((b.startTime || 0) - (a.startTime || 0)) * dir);

        const displaySessions = sortedSessions.slice(0, sessionLoadCount);
        for (const session of displaySessions) {
          const sessionBlock = await renderSessionBlock(session, config, session.originalIndex, collapseState);
          sectionContent.appendChild(sessionBlock);
        }

        if (sortedSessions.length > sessionLoadCount) {
          const loadMoreBtn = document.createElement('div');
          loadMoreBtn.className = 'load-more-btn';
          const remaining = sortedSessions.length - sessionLoadCount;
          loadMoreBtn.textContent = chrome.i18n.getMessage('session_load_more', [remaining]);
          loadMoreBtn.addEventListener('click', () => {
            sessionLoadCount += SESSION_PAGE_SIZE;
            chrome.runtime.sendMessage({ command: 'getFlattenedHistory' }, (tabs) => {
              if (!chrome.runtime.lastError) refreshTabList(tabs);
            });
          });
          sectionContent.appendChild(loadMoreBtn);
        }
      }
      inner.appendChild(sectionContent);
      wrapper.appendChild(inner);
      sectionDiv.appendChild(wrapper);

      // 綁定 section 級 toggleBtn 點擊事件（general 區塊）
      toggleBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const wrapperEl = sectionDiv.querySelector(':scope > .collapsible-wrapper');
        const newCollapsed = !isCurrentlyCollapsed(wrapperEl);

        // 1. 立即更新 UI 狀態
        toggleBtn.innerHTML = newCollapsed ? '▶' : '▼';
        toggleBtn.title = newCollapsed
          ? chrome.i18n.getMessage('toggle_expand')
          : chrome.i18n.getMessage('toggle_collapse');
        wrapperEl.dataset.collapsed = newCollapsed;

        // 2. 非同步更新儲存狀態 (不 await，避免阻塞動畫)
        storage
          .setCollapseState(sectionId, newCollapsed)
          .catch((err) => console.error(`storage.setCollapseState failed for ${sectionId}:`, err));

        // 3. 執行動畫
        await animateHeight(wrapperEl, !newCollapsed);
      });

      // 初始化折疊狀態：直接設定 display:none + gridTemplateRows:0fr，不觸發動畫
      if (isCollapsed) {
        wrapper.style.display = 'none';
        wrapper.style.gridTemplateRows = '0fr';
        wrapper.dataset.collapsed = 'true';
      } else {
        wrapper.style.display = 'grid';
        wrapper.style.gridTemplateRows = '1fr';
        wrapper.dataset.collapsed = 'false';
      }
    }

    return sectionDiv;
  }

  /**
   * 判斷元素當前是否處於折疊狀態
   * 以 display:none 或 height:0 為判斷依據
   * @param {HTMLElement} el
   * @returns {boolean}
   */

  /**
   * 渲染單個會話區塊（SessionBlock）
   * 包含會話標題列與該會話內的分頁列表
   * @param {Object} session - 會話物件 { id, startTime, lastModified, tabs[] }
   * @param {Object} sortConfig - 排序設定 { criteria, direction }
   * @param {number} index - 會話在歷史陣列中的原始索引
   * @param {Object} collapseState - 折疊狀態物件
   * @returns {HTMLElement} 會話區塊 DOM 元素
   */
  async function renderSessionBlock(session, sortConfig, index = null, collapseState = null) {
    console.log(`[DEBUG] renderSessionBlock starting: id=${session.id}, tabs=${session.tabs?.length}`);

    const block = document.createElement('div');
    block.className = 'session-block';
    block.dataset.sessionId = session.id;

    // 優先使用傳入的狀態，否則回退到讀取儲存（保持相容性）
    // 注意：storage.getCollapseState() 現在僅返回全局狀態，會話狀態需獨立獲取
    // 修復：使用 ?? 而非 ||，確保 collapseState.sessions 為 undefined 時能回退到 storage 讀取
    const isSessionCollapsed =
      collapseState?.sessions?.[session.id] ?? (await storage.getSessionCollapseState(session.id));

    console.log(`[DEBUG] renderSessionBlock state: id=${session.id}, collapsed=${isSessionCollapsed}`);

    // --- 會話標題列 ---
    const sessionHeader = document.createElement('div');
    sessionHeader.className = 'session-header';

    // 折疊/展開切換按鈕（session 級）
    const sessionToggleBtn = document.createElement('span');
    sessionToggleBtn.className = 'collapse-toggle';
    sessionToggleBtn.innerHTML = isSessionCollapsed ? '▶' : '▼';
    sessionToggleBtn.title = isSessionCollapsed
      ? chrome.i18n.getMessage('toggle_expand')
      : chrome.i18n.getMessage('toggle_collapse');

    const sessionInfo = document.createElement('div');
    sessionInfo.className = 'session-info';

    const sessionDate = document.createElement('span');
    sessionDate.className = 'session-date';
    sessionDate.textContent = new Date(session.startTime).toLocaleString();

    const sessionMeta = document.createElement('span');
    sessionMeta.className = 'session-meta';
    sessionMeta.textContent = chrome.i18n.getMessage('session_tab_count', [session.tabs?.length || 0]);

    sessionInfo.appendChild(sessionDate);
    sessionInfo.appendChild(sessionMeta);

    // 子層排序狀態（獨立於父層，不寫入儲存）
    const localSortConfig = {
      criteria: sortConfig?.criteria || 'timestamp',
      direction: sortConfig?.direction || 'desc',
    };

    function applySort() {
      const c = localSortConfig.criteria;
      const d = localSortConfig.direction === 'desc' ? -1 : 1;
      const sorted = [...(session.tabs || [])].sort((a, b) => {
        if (c === 'title') return (a.title || '').localeCompare(b.title || '') * d;
        if (c === 'url') return (a.url || '').localeCompare(b.url || '') * d;
        if (c === 'timestamp') return ((a.timestamp || 0) - (b.timestamp || 0)) * d;
        return 0;
      });
      ul.innerHTML = '';
      renderTabsInBatches(ul, sorted);
      block._tabs = sorted;
    }

    const sessionSortControls = document.createElement('div');
    sessionSortControls.className = 'session-sort-controls';

    const scPicker = document.createElement('div');
    scPicker.className = 'custom-sort-picker session-sort-picker';
    const scTrigger = document.createElement('div');
    scTrigger.className = 'picker-trigger';
    const scMap = {
      title: chrome.i18n.getMessage('sort_title'),
      url: chrome.i18n.getMessage('sort_url'),
      timestamp: chrome.i18n.getMessage('sort_time'),
    };
    scTrigger.textContent = scMap[localSortConfig.criteria] || chrome.i18n.getMessage('sort_time');

    const scOptions = document.createElement('ul');
    scOptions.className = 'picker-options';
    scOptions.style.position = 'fixed';
    scOptions.style.display = 'none';
    Object.entries(scMap).forEach(([v, label]) => {
      const li = document.createElement('li');
      li.textContent = label;
      li.dataset.value = v;
      li.addEventListener('click', (e) => {
        e.stopPropagation();
        scTrigger.textContent = label;
        scOptions.style.display = 'none';
        localSortConfig.criteria = v;
        applySort();
      });
      scOptions.appendChild(li);
    });
    document.body.appendChild(scOptions);

    scTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasOpen = scOptions.style.display === 'block';
      document.querySelectorAll('.picker-options').forEach((el) => {
        el.style.display = 'none';
      });
      if (!wasOpen) {
        const rect = scTrigger.getBoundingClientRect();
        scOptions.style.top = `${rect.bottom + 4}px`;
        scOptions.style.right = `${window.innerWidth - rect.right}px`;
        scOptions.style.display = 'block';
      }
    });
    scPicker.appendChild(scTrigger);

    const scDirBtn = document.createElement('button');
    scDirBtn.className = 'section-sort-direction-btn session-sort-dir-btn';
    const scDir = localSortConfig.direction;
    scDirBtn.innerHTML = scDir === 'asc' ? '↑' : '↓';
    scDirBtn.title = scDir === 'asc' ? chrome.i18n.getMessage('sort_reverse') : chrome.i18n.getMessage('sort_forward');
    scDirBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      localSortConfig.direction = localSortConfig.direction === 'asc' ? 'desc' : 'asc';
      scDirBtn.innerHTML = localSortConfig.direction === 'asc' ? '↑' : '↓';
      scDirBtn.title =
        localSortConfig.direction === 'asc'
          ? chrome.i18n.getMessage('sort_reverse')
          : chrome.i18n.getMessage('sort_forward');
      applySort();
    });

    sessionSortControls.appendChild(scPicker);
    sessionSortControls.appendChild(scDirBtn);

    const sessionActions = document.createElement('div');
    sessionActions.className = 'session-actions';

    // 進階按鈕 (dropdown container)
    const advancedDropdown = document.createElement('div');
    advancedDropdown.className = 'session-actions-dropdown';

    const advancedBtn = document.createElement('span');
    advancedBtn.className = 'btn-small session-advanced-btn';
    advancedBtn.textContent = chrome.i18n.getMessage('session_advanced');

    const advancedSubmenu = document.createElement('div');
    advancedSubmenu.className = 'session-actions-submenu';

    // 開啟：恢復會話所有分頁，並標記為刪除
    const openAction = document.createElement('div');
    openAction.className = 'session-action-item';
    openAction.textContent = chrome.i18n.getMessage('session_open');
    openAction.addEventListener('click', async (e) => {
      e.stopPropagation();
      advancedSubmenu.style.display = 'none';
      try {
        let targetIndex = index;
        if (targetIndex === null) {
          const sessionHistory = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ command: 'getSessionHistory' }, (response) => {
              resolve(response || []);
            });
          });
          targetIndex = sessionHistory.findIndex((s) => s.id === session.id);
        }
        if (targetIndex === -1) throw new Error(chrome.i18n.getMessage('session_not_found'));

        await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({ command: 'restoreSessionById', data: { index: targetIndex } }, (response) => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else if (!response || !response.success)
              reject(new Error(response?.error || chrome.i18n.getMessage('session_recover_failed')));
            else resolve();
          });
        });

        // 開啟後將該會話所有分頁標註為刪除
        for (const tab of session.tabs || []) {
          if (tab.url) {
            await chrome.runtime.sendMessage({ command: 'setRemoved', data: { url: tab.url, removed: true } });
          }
        }

        // 刷新 UI 反映刪除狀態
        chrome.runtime.sendMessage({ command: 'getFlattenedHistory' }, (tabs) => {
          if (!chrome.runtime.lastError) refreshTabList(tabs);
        });
      } catch (error) {
        console.error('[Popup] restoreSessionById failed:', error);
        advancedBtn.textContent = chrome.i18n.getMessage('session_failed');
        setTimeout(() => {
          advancedBtn.textContent = chrome.i18n.getMessage('session_advanced');
        }, 2000);
      }
    });

    // 刪除：將該會話所有分頁標註為刪除（不開啟）
    const deleteAction = document.createElement('div');
    deleteAction.className = 'session-action-item';
    deleteAction.textContent = chrome.i18n.getMessage('session_delete');
    deleteAction.addEventListener('click', async (e) => {
      e.stopPropagation();
      advancedSubmenu.style.display = 'none';
      try {
        for (const tab of session.tabs || []) {
          if (tab.url) {
            await chrome.runtime.sendMessage({ command: 'setRemoved', data: { url: tab.url, removed: true } });
          }
        }

        // 刷新 UI 反映刪除狀態
        chrome.runtime.sendMessage({ command: 'getFlattenedHistory' }, (tabs) => {
          if (!chrome.runtime.lastError) refreshTabList(tabs);
        });
      } catch (error) {
        console.error('[Popup] delete session failed:', error);
        advancedBtn.textContent = chrome.i18n.getMessage('session_failed');
        setTimeout(() => {
          advancedBtn.textContent = chrome.i18n.getMessage('session_advanced');
        }, 2000);
      }
    });

    advancedSubmenu.appendChild(openAction);
    advancedSubmenu.appendChild(deleteAction);

    // Hover 展開/關閉次選單
    let submenuTimer;
    advancedDropdown.addEventListener('mouseenter', () => {
      clearTimeout(submenuTimer);
      advancedSubmenu.style.display = 'block';
    });
    advancedDropdown.addEventListener('mouseleave', () => {
      submenuTimer = setTimeout(() => {
        advancedSubmenu.style.display = 'none';
      }, 200);
    });
    advancedSubmenu.addEventListener('click', (e) => e.stopPropagation());

    advancedDropdown.appendChild(advancedBtn);
    advancedDropdown.appendChild(advancedSubmenu);
    sessionActions.appendChild(advancedDropdown);
    sessionHeader.appendChild(sessionToggleBtn);
    sessionHeader.appendChild(sessionInfo);
    sessionHeader.appendChild(sessionSortControls);
    sessionHeader.appendChild(sessionActions);
    block.appendChild(sessionHeader);

    // --- 分頁列表（子層排序）---
    const wrapper = document.createElement('div');
    wrapper.className = 'collapsible-wrapper';
    const inner = document.createElement('div');
    inner.className = 'collapsible-inner';

    const ul = document.createElement('ul');
    ul.className = 'tab-list';

    const tabs = session.tabs || [];
    const sortedTabs = [...tabs].sort((a, b) => {
      const c = localSortConfig.criteria;
      const d = localSortConfig.direction === 'desc' ? -1 : 1;
      if (c === 'title') return (a.title || '').localeCompare(b.title || '') * d;
      if (c === 'url') return (a.url || '').localeCompare(b.url || '') * d;
      if (c === 'timestamp') return ((a.timestamp || 0) - (b.timestamp || 0)) * d;
      return 0;
    });

    // 將分頁資料掛載到 DOM 元素上，以便後續延遲渲染或搜尋過濾
    block._tabs = sortedTabs;

    /**
     * 分批渲染分頁項目，避免一次性插入大量 DOM 導致主線程卡死
     * @param {HTMLElement} container - 目標 UL 元素
     * @param {Array} tabs - 分頁資料陣列
     * @param {number} batchSize - 每批渲染數量
     */

    if (!isSessionCollapsed) {
      renderTabsInBatches(ul, sortedTabs);
    }

    inner.appendChild(ul);
    wrapper.appendChild(inner);
    block.appendChild(wrapper);
    console.log(`[DEBUG] renderSessionBlock finished: id=${session.id}, block children=${block.children.length}`);

    // 綁定 session 級 toggleBtn 點擊事件
    sessionToggleBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const wrapperEl = block.querySelector(':scope > .collapsible-wrapper');
      const newCollapsed = !isCurrentlyCollapsed(wrapperEl);

      // 1. 立即更新 UI 狀態
      sessionToggleBtn.innerHTML = newCollapsed ? '▶' : '▼';
      sessionToggleBtn.title = newCollapsed
        ? chrome.i18n.getMessage('toggle_expand')
        : chrome.i18n.getMessage('toggle_collapse');
      wrapperEl.dataset.collapsed = newCollapsed;

      // 2. 非同步更新儲存狀態 (不 await，避免阻塞動畫)
      storage
        .setCollapseState(session.id, newCollapsed)
        .catch((err) => console.error(`storage.setCollapseState failed for ${session.id}:`, err));

      // 3. 執行動畫
      await animateHeight(wrapperEl, !newCollapsed);

      // 4. 延遲渲染：僅在展開時渲染分頁，避免初始化時產生過多 DOM 節點
      if (!newCollapsed) {
        renderTabsInBatches(ul, block._tabs);
      }
    });

    // 初始化折疊狀態：直接設定 display:none + gridTemplateRows:0fr，不觸發動畫
    if (isSessionCollapsed) {
      wrapper.style.display = 'none';
      wrapper.style.gridTemplateRows = '0fr';
      wrapper.dataset.collapsed = 'true';
    } else {
      wrapper.style.display = 'grid';
      wrapper.style.gridTemplateRows = '1fr';
      wrapper.dataset.collapsed = 'false';
    }

    return block;
  }

  // 更新批量操作欄可見性

  // 批量操作按鈕綁定與分頁拖曳已封存（移至 _archive/features）
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPopup);
} else {
  initPopup();
}
