const Controller = require('./base');
const { dialog } = require('electron');
const { getMainWindow } = require('../window');

class DialogController extends Controller {
  constructor() {
    super();
  }

  init() {
    this.handle('select-file', this.selectFile);
    this.handle('select-files', this.selectFiles);
    this.handle('select-folder', this.selectFolder);
    this.handle('save-file', this.saveFile);
  }

  async selectFile(event, options) {
    const mainWindow = getMainWindow();
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: options.filters || []
    });
    return result.canceled ? null : result.filePaths[0];
  }

  async selectFiles(event, options) {
    const mainWindow = getMainWindow();
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: options.filters || []
    });
    return result.canceled ? null : result.filePaths;
  }

  async selectFolder(event) {
    const mainWindow = getMainWindow();
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
  }

  async saveFile(event, options) {
    const mainWindow = getMainWindow();
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: options.defaultPath,
      filters: options.filters || []
    });
    return result.canceled ? null : result.filePath;
  }
}

module.exports = DialogController;
