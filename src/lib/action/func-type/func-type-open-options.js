import api from '../api';

const name = 'funcType_openOptions';

async function install() {
  await api.setTitle({ title: chrome.i18n.getMessage(name) });
  await api.setPopup({ popup: null });
}

async function handle() {
  await chrome.runtime.openOptionsPage();
}

export default {
  name,
  install,
  handle,
};
