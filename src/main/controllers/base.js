const { ipcMain } = require('electron');

class Controller {
  constructor() {
    this.init();
  }

  init() {
    // 子类实现注册逻辑
  }

  /**
   * 注册 IPC 处理程序
   * @param {string} channel 
   * @param {Function} handler 
   */
  handle(channel, handler) {
    ipcMain.handle(channel, async (event, ...args) => {
      try {
        return await handler.call(this, event, ...args);
      } catch (error) {
        console.error(`[IPC Error] ${channel}:`, error);
        return null; // 保持原有错误处理行为
      }
    });
  }
}

module.exports = Controller;
