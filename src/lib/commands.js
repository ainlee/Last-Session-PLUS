import { getFuncTypeComponent } from './action';

function getAll() {
  return chrome.commands.getAll();
}

/**
 * 監聽快捷鍵啟動命令事件
 */
function addCommandListener() {
  chrome.commands.onCommand.addListener(async (command) => {
    const funcTypeOption = getFuncTypeComponent(command);
    if (funcTypeOption && typeof funcTypeOption.handle === 'function') {
      await funcTypeOption.handle();
    }
  });
}

export default {
  getAll,
  addCommandListener,
};
