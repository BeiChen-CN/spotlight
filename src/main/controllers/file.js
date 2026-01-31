const Controller = require('./base');
const fs = require('fs');
const path = require('path');

class FileController extends Controller {
  constructor() {
    super();
    // 数据目录位于项目根目录下的 data
    this.dataPath = path.join(process.cwd(), 'data');
    this.photosPath = path.join(this.dataPath, 'photos');
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
    if (!fs.existsSync(this.photosPath)) {
      fs.mkdirSync(this.photosPath, { recursive: true });
    }
  }

  init() {
    this.handle('read-json', this.readJson);
    this.handle('write-json', this.writeJson);
    this.handle('read-file', this.readFile);
    this.handle('read-text-file', this.readTextFile);
    this.handle('copy-photo', this.copyPhoto);
    this.handle('delete-photo', this.deletePhoto);
    this.handle('get-photo-path', this.getPhotoPath);
    this.handle('get-data-path', this.getDataPath);
    this.handle('write-export-file', this.writeExportFile);
    this.handle('write-binary-file', this.writeBinaryFile);
  }

  async readJson(event, filename) {
    const filePath = path.join(this.dataPath, filename);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
    return null;
  }

  async writeJson(event, filename, data) {
    const filePath = path.join(this.dataPath, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  }

  async readFile(event, filePath) {
    return fs.readFileSync(filePath);
  }

  async readTextFile(event, filePath) {
    return fs.readFileSync(filePath, 'utf-8');
  }

  async copyPhoto(event, sourcePath, targetName) {
    const ext = path.extname(sourcePath);
    const targetPath = path.join(this.photosPath, targetName + ext);
    fs.copyFileSync(sourcePath, targetPath);
    return 'photos/' + targetName + ext;
  }

  async deletePhoto(event, photoPath) {
    const fullPath = path.join(this.dataPath, photoPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    return true;
  }

  async getPhotoPath(event, relativePath) {
    if (!relativePath) return null;
    return path.join(this.dataPath, relativePath);
  }

  async getDataPath() {
    return this.dataPath;
  }

  async writeExportFile(event, filePath, content) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  }

  async writeBinaryFile(event, filePath, buffer) {
    fs.writeFileSync(filePath, Buffer.from(buffer));
    return true;
  }
}

module.exports = FileController;
