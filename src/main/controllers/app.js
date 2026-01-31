const Controller = require('./base');
const { nativeTheme, globalShortcut, shell } = require('electron');
const { getMainWindow } = require('../window');
const archiver = require('archiver');
const extractZip = require('extract-zip');
const fs = require('fs');
const path = require('path');

class AppController extends Controller {
  constructor() {
    super();
    this.dataPath = path.join(process.cwd(), 'data');
    this.photosPath = path.join(this.dataPath, 'photos');
    
    // 监听系统主题变化
    nativeTheme.on('updated', () => {
      const win = getMainWindow();
      if (win && !win.isDestroyed()) {
        win.webContents.send(
          'system-theme-changed',
          nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
        );
      }
    });
  }

  init() {
    this.handle('get-system-theme', this.getSystemTheme);
    this.handle('register-shortcut', this.registerShortcut);
    this.handle('backup-data', this.backupData);
    this.handle('restore-data', this.restoreData);
    this.handle('open-external', this.openExternal);
    this.handle('set-auto-launch', this.setAutoLaunch);
    this.handle('get-auto-launch', this.getAutoLaunch);
  }

  async getSystemTheme() {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  }

  async registerShortcut(event, accelerator, action) {
    try {
      globalShortcut.unregisterAll();
      if (accelerator) {
        globalShortcut.register(accelerator, () => {
          const win = getMainWindow();
          if (win && !win.isDestroyed()) {
            win.webContents.send('shortcut-triggered', action);
          }
        });
      }
      return true;
    } catch (error) {
      console.error('注册快捷键失败:', error);
      return false;
    }
  }

  async backupData(event, targetPath) {
    return new Promise((resolve, reject) => {
      try {
        const output = fs.createWriteStream(targetPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => resolve(true));
        archive.on('error', (err) => {
          console.error('备份失败:', err);
          resolve(false);
        });

        archive.pipe(output);
        archive.directory(this.dataPath, false);
        archive.finalize();
      } catch (e) {
        console.error('备份错误:', e);
        resolve(false);
      }
    });
  }

  async restoreData(event, sourcePath) {
    try {
      // 清空现有数据目录
      if (fs.existsSync(this.dataPath)) {
        fs.rmSync(this.dataPath, { recursive: true, force: true });
      }
      fs.mkdirSync(this.dataPath, { recursive: true });

      // 解压
      await extractZip(sourcePath, { dir: this.dataPath });

      // 确保照片目录存在
      if (!fs.existsSync(this.photosPath)) {
        fs.mkdirSync(this.photosPath, { recursive: true });
      }
      return true;
    } catch (error) {
      console.error('恢复失败:', error);
      return false;
    }
  }

  async openExternal(event, url) {
    try {
      await shell.openExternal(url);
      return true;
    } catch (error) {
      console.error('打开外部链接失败:', error);
      return false;
    }
  }

  async setAutoLaunch(event, enabled) {
    try {
      const { app } = require('electron');
      app.setLoginItemSettings({
        openAtLogin: enabled,
        path: process.execPath,
        args: []
      });
      return true;
    } catch (error) {
      console.error('设置开机自启动失败:', error);
      return false;
    }
  }

  async getAutoLaunch() {
    try {
      const { app } = require('electron');
      const settings = app.getLoginItemSettings();
      return settings.openAtLogin;
    } catch (error) {
      console.error('获取开机自启动状态失败:', error);
      return false;
    }
  }
}

module.exports = AppController;
