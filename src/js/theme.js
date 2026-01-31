/**
 * 主题管理模块
 */

class ThemeManager {
  constructor() {
    this.currentStyle = 'fluent';
    this.currentMode = 'light';
    this.systemMode = 'light';
    
    // 可用主题样式
    this.styles = [
      'material',
      'fluent',
      'apple',
      'flat',
      'neumorphism',
      'glassmorphism'
    ];
    
    // 颜色模式
    this.modes = ['light', 'dark', 'auto'];
    
    // 强调色方案 (Keys match legacy settings or new ones)
    this.currentAccent = 'cloud-dancer';
    
    this.accents = {
      'cloud-dancer': { 
        name: '云上舞白',
        primary: '#8B7355' // For UI Preview only
      },
      'corundum-blue': { 
        name: '刚玉蓝',
        primary: '#4A6670'
      },
      'kiwi-green': { 
        name: '冰猕猴桃汁绿',
        primary: '#7A9A5C'
      },
      'spicy-red': { 
        name: '辛辣红',
        primary: '#8B4049'
      },
      'teal-water': { 
        name: '明水鸭色',
        primary: '#5A8A8A'
      }
    };
    
    // Alias for backward compatibility if needed, logic handled in init
  }

  /**
   * 初始化主题
   */
  async init(settings) {
    // 获取系统主题
    this.systemMode = await window.electronAPI.getSystemTheme();
    
    // 监听系统主题变化
    window.electronAPI.onSystemThemeChanged((theme) => {
      this.systemMode = theme;
      if (this.currentMode === 'auto') {
        this.applyTheme();
      }
    });

    // 应用设置中的主题
    if (settings && settings.theme) {
      this.currentStyle = settings.theme.style || 'fluent';
      this.currentMode = settings.theme.mode || 'auto';
      
      // Map legacy IDs to new CSS IDs
      let accent = settings.theme.accent || 'cloud-dancer';
      if (accent === 'default' || accent === 'cloud') accent = 'cloud-dancer';
      if (accent === 'corundum') accent = 'corundum-blue';
      if (accent === 'kiwi') accent = 'kiwi-green';
      if (accent === 'spicy') accent = 'spicy-red';
      if (accent === 'mallard') accent = 'teal-water';
      
      this.currentAccent = accent;
    }

    this.applyTheme();
  }

  /**
   * 设置主题样式
   */
  setStyle(style) {
    if (this.styles.includes(style)) {
      this.currentStyle = style;
      this.applyTheme();
    }
  }

  /**
   * 设置颜色模式
   */
  setMode(mode) {
    if (this.modes.includes(mode)) {
      this.currentMode = mode;
      this.applyTheme();
    }
  }

  /**
   * 设置强调色
   */
  setAccent(accent) {
    // Handle aliases if passed from UI (though UI usually passes keys from accents map)
    if (this.accents[accent]) {
      this.currentAccent = accent;
      this.applyTheme();
    }
  }

  /**
   * 获取实际应用的颜色模式
   */
  getEffectiveMode() {
    if (this.currentMode === 'auto') {
      return this.systemMode;
    }
    return this.currentMode;
  }

  /**
   * 应用主题
   */
  applyTheme() {
    const effectiveMode = this.getEffectiveMode();
    const root = document.documentElement;
    
    // 设置 CSS 变量控制属性 (Data Attributes)
    root.setAttribute('data-mode', effectiveMode);
    root.setAttribute('data-theme', this.currentAccent);
    root.setAttribute('data-style', this.currentStyle);
    
    // 恢复 Body 类名 (Backward Compatibility for Layout/Shape styles)
    const themeClass = `theme-${this.currentStyle}-${effectiveMode}`;
    
    // 移除旧的主题类
    document.body.className = document.body.className
      .split(' ')
      .filter(c => !c.startsWith('theme-'))
      .join(' ');
      
    // 添加新主题类
    document.body.classList.add(themeClass);
    document.body.classList.add(`mode-${effectiveMode}`);
  }
  
  // Removed updateCSSVariables as it conflicts with data attributes logic
  
  getCurrentTheme() {
    return {
      style: this.currentStyle,
      mode: this.currentMode,
      accent: this.currentAccent,
      effectiveMode: this.getEffectiveMode()
    };
  }
  
  getAccents() {
    return this.accents;
  }


  /**
   * 获取所有可用主题样式
   */
  getStyles() {
    return this.styles;
  }

  /**
   * 获取所有颜色模式
   */
  getModes() {
    return this.modes;
  }
}

// 导出单例
window.themeManager = new ThemeManager();
