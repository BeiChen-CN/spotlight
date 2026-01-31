const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 数据存储
  readJson: (filename) => ipcRenderer.invoke('read-json', filename),
  writeJson: (filename, data) => ipcRenderer.invoke('write-json', filename, data),
  
  // 文件对话框
  selectFile: (options) => ipcRenderer.invoke('select-file', options),
  selectFiles: (options) => ipcRenderer.invoke('select-files', options),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  saveFile: (options) => ipcRenderer.invoke('save-file', options),
  
  // 文件操作
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  readTextFile: (filePath) => ipcRenderer.invoke('read-text-file', filePath),
  writeExportFile: (filePath, content) => ipcRenderer.invoke('write-export-file', filePath, content),
  writeBinaryFile: (filePath, buffer) => ipcRenderer.invoke('write-binary-file', filePath, buffer),
  
  // 照片管理
  copyPhoto: (sourcePath, targetName) => ipcRenderer.invoke('copy-photo', sourcePath, targetName),
  deletePhoto: (photoPath) => ipcRenderer.invoke('delete-photo', photoPath),
  getPhotoPath: (relativePath) => ipcRenderer.invoke('get-photo-path', relativePath),
  
  // 路径
  getDataPath: () => ipcRenderer.invoke('get-data-path'),
  
  // 主题
  getSystemTheme: () => ipcRenderer.invoke('get-system-theme'),
  onSystemThemeChanged: (callback) => {
    ipcRenderer.on('system-theme-changed', (event, theme) => callback(theme));
  },
  
  // 快捷键
  registerShortcut: (accelerator, action) => ipcRenderer.invoke('register-shortcut', accelerator, action),
  onShortcutTriggered: (callback) => {
    ipcRenderer.on('shortcut-triggered', (event, action) => callback(action));
  },
  
  // 备份恢复
  backupData: (targetPath) => ipcRenderer.invoke('backup-data', targetPath),
  restoreData: (sourcePath) => ipcRenderer.invoke('restore-data', sourcePath)
});
