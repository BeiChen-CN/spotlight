const { app, BrowserWindow } = require('electron');
const { createMainWindow } = require('./src/main/window');
const FileController = require('./src/main/controllers/file');
const DialogController = require('./src/main/controllers/dialog');
const AppController = require('./src/main/controllers/app');

// 初始化控制器 (注册 IPC 处理程序)
new FileController();
new DialogController();
new AppController();

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
