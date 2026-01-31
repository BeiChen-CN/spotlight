/**
 * 备份恢复模块
 */

const backupManager = {
  /**
   * 备份数据
   */
  async backup() {
    const date = new Date().toISOString().slice(0, 10);
    const defaultName = `智能点名助手_备份_${date}.zip`;
    
    const filePath = await window.electronAPI.saveFile({
      defaultPath: defaultName,
      filters: [{ name: 'ZIP 压缩文件', extensions: ['zip'] }]
    });
    
    if (!filePath) return;
    
    try {
      await window.electronAPI.backupData(filePath);
      app.toast(t('settings.backupSuccess'), 'success');
    } catch (error) {
      console.error('备份失败:', error);
      app.toast(t('common.error'), 'error');
    }
  },

  /**
   * 恢复数据
   */
  async restore() {
    // 先确认
    const confirmed = await this.confirmRestore();
    if (!confirmed) return;
    
    const filePath = await window.electronAPI.selectFile({
      filters: [{ name: 'ZIP 压缩文件', extensions: ['zip'] }]
    });
    
    if (!filePath) return;
    
    try {
      await window.electronAPI.restoreData(filePath);
      app.toast(t('settings.restoreSuccess'), 'success');
      
      // 重新加载数据和界面
      setTimeout(async () => {
        await store.reload();
        await app.init();
      }, 500);
      
    } catch (error) {
      console.error('恢复失败:', error);
      app.toast(t('common.error'), 'error');
    }
  },

  /**
   * 确认恢复
   */
  confirmRestore() {
    return new Promise(resolve => {
      const modalBody = `<p>${t('settings.restoreConfirm')}</p>`;
      
      const modalFooter = `
        <button class="btn btn-secondary" onclick="app.closeModal(); backupManager._resolveConfirm(false)">
          ${t('common.cancel')}
        </button>
        <button class="btn btn-primary" onclick="app.closeModal(); backupManager._resolveConfirm(true)">
          ${t('common.confirm')}
        </button>
      `;
      
      this._resolveConfirm = resolve;
      app.showModal(t('settings.restore'), modalBody, modalFooter);
    });
  }
};

window.backupManager = backupManager;
