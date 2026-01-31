/**
 * 设置管理模块
 */

const settingsManager = {
  capturingShortcut: null,

  /**
   * 初始化设置界面
   */
  init() {
    this.renderThemeStyles();
    this.updateThemeModeButtons();
    this.updateLanguageSelect();
    this.updateSwitches();
    this.updateShortcutDisplay();
    this.updatePasswordButtons();
    this.updateAnimationStyle();
  },

  /**
   * 渲染主题样式网格
   */
  renderThemeStyles() {
    const grid = document.getElementById('theme-style-grid');
    const currentStyle = themeManager.currentStyle;
    
    const themes = [
      { id: 'material', name: t('themes.material'), icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="32" height="32"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>' },
      { id: 'fluent', name: t('themes.fluent'), icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="32" height="32"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>' },
      { id: 'apple', name: t('themes.apple'), icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="32" height="32"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"></path></svg>' },
      { id: 'flat', name: t('themes.flat'), icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="32" height="32"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>' },
      { id: 'neumorphism', name: t('themes.neumorphism'), icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="32" height="32"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg>' },
      { id: 'glassmorphism', name: t('themes.glassmorphism'), icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="32" height="32"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>' }
    ];
    
    grid.innerHTML = themes.map(theme => `
      <div class="theme-option ${theme.id === currentStyle ? 'active' : ''}" 
           onclick="settingsManager.setThemeStyle('${theme.id}')">
        <div style="display: flex; justify-content: center; margin-bottom: 8px; color: var(--text-primary);">${theme.icon}</div>
        <div class="theme-option-name">${theme.name}</div>
      </div>
    `).join('');
  },

  /**
   * 设置主题样式
   */
  async setThemeStyle(style) {
    themeManager.setStyle(style);
    await store.setTheme(style, themeManager.currentMode);
    this.renderThemeStyles();
  },

  /**
   * 设置颜色模式
   */
  async setThemeMode(mode) {
    themeManager.setMode(mode);
    await store.setTheme(themeManager.currentStyle, mode);
    this.updateThemeModeButtons();
  },

  /**
   * 更新模式按钮状态
   */
  updateThemeModeButtons() {
    const mode = themeManager.currentMode;
    
    document.getElementById('mode-light').classList.toggle('btn-primary', mode === 'light');
    document.getElementById('mode-light').classList.toggle('btn-secondary', mode !== 'light');
    
    document.getElementById('mode-dark').classList.toggle('btn-primary', mode === 'dark');
    document.getElementById('mode-dark').classList.toggle('btn-secondary', mode !== 'dark');
    
    document.getElementById('mode-auto').classList.toggle('btn-primary', mode === 'auto');
    document.getElementById('mode-auto').classList.toggle('btn-secondary', mode !== 'auto');
  },

  /**
   * 更新语言选择
   */
  updateLanguageSelect() {
    const select = document.getElementById('language-select');
    const settings = store.getSettings();
    select.value = settings.language;
  },

  /**
   * 设置语言
   */
  async setLanguage(language) {
    await store.setLanguage(language);
    await i18n.setLocale(language);
  },

  /**
   * 更新动画样式选择
   */
  updateAnimationStyle() {
    const select = document.getElementById('animation-style-select');
    if (select) {
      const settings = store.getSettings();
      select.value = settings.animationStyle || 'slot';
    }
  },

  /**
   * 设置动画样式
   */
  async setAnimationStyle(style) {
    await store.updateSettings({ animationStyle: style });
    picker.animationStyle = style;
  },

  /**
   * 更新开关状态
   */
  async updateSwitches() {
    const settings = store.getSettings();
    const fairness = settings.fairness || { weightedRandom: false, cooldownCount: 0 };
    
    const showIdSwitch = document.getElementById('switch-show-id');
    const photoModeSwitch = document.getElementById('switch-photo-mode');
    const soundSwitch = document.getElementById('switch-sound-effects');
    const autoLaunchSwitch = document.getElementById('switch-auto-launch');
    const weightedSwitch = document.getElementById('switch-weighted-random');
    const cooldownInput = document.getElementById('cooldown-count');
    
    if (showIdSwitch) showIdSwitch.classList.toggle('active', settings.showStudentId);
    if (photoModeSwitch) photoModeSwitch.classList.toggle('active', settings.photoMode);
    if (soundSwitch) soundSwitch.classList.toggle('active', settings.soundEnabled !== false);
    if (weightedSwitch) weightedSwitch.classList.toggle('active', fairness.weightedRandom);
    if (cooldownInput) cooldownInput.value = fairness.cooldownCount || 0;
    
    // 获取开机自启动状态
    if (autoLaunchSwitch) {
      try {
        const isAutoLaunch = await window.electronAPI.getAutoLaunch();
        autoLaunchSwitch.classList.toggle('active', isAutoLaunch);
      } catch (e) {
        console.error('获取开机自启动状态失败:', e);
      }
    }
  },

  /**
   * 切换显示学号
   */
  async toggleShowStudentId() {
    const settings = store.getSettings();
    await store.updateSettings({ showStudentId: !settings.showStudentId });
    this.updateSwitches();
    studentManager.renderList();
    historyManager.renderStats();
  },

  /**
   * 切换照片模式
   */
  async togglePhotoMode() {
    const settings = store.getSettings();
    await store.updateSettings({ photoMode: !settings.photoMode });
    this.updateSwitches();
    studentManager.renderList();
  },

  /**
   * 切换音效开关
   */
  async toggleSoundEffects() {
    const settings = store.getSettings();
    const newState = !(settings.soundEnabled !== false);
    await store.updateSettings({ soundEnabled: newState });
    soundManager.toggle(newState);
    this.updateSwitches();
  },



  /**
   * 切换开机自启动
   */
  async toggleAutoLaunch() {
    try {
      const currentState = await window.electronAPI.getAutoLaunch();
      const newState = !currentState;
      await window.electronAPI.setAutoLaunch(newState);
      this.updateSwitches();
      app.toast(newState ? '已开启开机自启动' : '已关闭开机自启动');
    } catch (e) {
      console.error('切换开机自启动失败:', e);
      app.toast('设置失败，请重试');
    }
  },

  /**
   * 切换加权随机
   */
  async toggleWeightedRandom() {
    const settings = store.getSettings();
    const fairness = settings.fairness || { weightedRandom: false, cooldownCount: 0 };
    fairness.weightedRandom = !fairness.weightedRandom;
    await store.updateSettings({ fairness });
    this.updateSwitches();
  },

  /**
   * 设置冷却期次数
   */
  async setCooldownCount(value) {
    const settings = store.getSettings();
    const fairness = settings.fairness || { weightedRandom: false, cooldownCount: 0 };
    fairness.cooldownCount = Math.max(0, Math.min(10, parseInt(value) || 0));
    await store.updateSettings({ fairness });
    this.updateSwitches();
  },

  /**
   * 更新快捷键显示
   */
  updateShortcutDisplay() {
    const settings = store.getSettings();
    const btn = document.getElementById('shortcut-pick');
    btn.textContent = settings.shortcuts.pick || 'Space';
  },

  /**
   * 捕获快捷键
   */
  captureShortcut(action) {
    const btn = document.getElementById('shortcut-' + action);
    btn.textContent = t('settings.pressKey');
    this.capturingShortcut = action;
    
    const handler = async (e) => {
      e.preventDefault();
      
      let key = e.key;
      
      // 特殊键名转换
      if (key === ' ') key = 'Space';
      if (key === 'Escape') {
        this.capturingShortcut = null;
        this.updateShortcutDisplay();
        document.removeEventListener('keydown', handler);
        return;
      }
      
      // 组合键
      let accelerator = '';
      if (e.ctrlKey) accelerator += 'Ctrl+';
      if (e.altKey) accelerator += 'Alt+';
      if (e.shiftKey) accelerator += 'Shift+';
      
      if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
        accelerator += key;
        
        await store.setShortcut(action, accelerator);
        await window.electronAPI.registerShortcut(accelerator, action);
        
        this.capturingShortcut = null;
        this.updateShortcutDisplay();
        document.removeEventListener('keydown', handler);
      }
    };
    
    document.addEventListener('keydown', handler);
  },

  /**
   * 更新密码按钮状态
   */
  updatePasswordButtons() {
    const settings = store.getSettings();
    const hasPassword = settings.password && settings.password.length > 0;
    
    const setBtn = document.getElementById('btn-set-password');
    const removeBtn = document.getElementById('btn-remove-password');
    
    if (hasPassword) {
      setBtn.innerHTML = `<span>${t('settings.changePassword')}</span>`;
      removeBtn.classList.remove('hidden');
    } else {
      setBtn.innerHTML = `<span>${t('settings.setPassword')}</span>`;
      removeBtn.classList.add('hidden');
    }
  },

  /**
   * 显示设置密码模态框
   */
  showPasswordModal() {
    const modalBody = `
      <div class="form-group">
        <label class="form-label">${t('settings.password')}</label>
        <input type="password" class="input" id="new-password-input" 
               placeholder="${t('settings.passwordPlaceholder')}">
      </div>
      <div class="form-group">
        <label class="form-label">${t('settings.confirmPassword')}</label>
        <input type="password" class="input" id="confirm-password-input" 
               placeholder="${t('settings.confirmPassword')}">
      </div>
    `;
    
    const modalFooter = `
      <button class="btn btn-secondary" onclick="app.closeModal()">
        ${t('common.cancel')}
      </button>
      <button class="btn btn-primary" onclick="settingsManager.savePassword()">
        ${t('common.save')}
      </button>
    `;
    
    app.showModal(t('settings.setPassword'), modalBody, modalFooter);
    
    setTimeout(() => {
      document.getElementById('new-password-input').focus();
    }, 100);
  },

  /**
   * 保存密码
   */
  async savePassword() {
    const password = document.getElementById('new-password-input').value;
    const confirm = document.getElementById('confirm-password-input').value;
    
    if (password !== confirm) {
      app.toast(t('settings.passwordMismatch'), 'error');
      return;
    }
    
    await store.setPassword(password);
    app.closeModal();
    this.updatePasswordButtons();
    app.toast(t('settings.passwordSet'), 'success');
  },

  /**
   * 移除密码
   */
  async removePassword() {
    await store.setPassword('');
    this.updatePasswordButtons();
    app.toast(t('settings.passwordRemoved'), 'success');
  }
};

window.settingsManager = settingsManager;
