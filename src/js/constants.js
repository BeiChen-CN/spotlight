/**
 * 全局常量定义
 */
const Constants = {
  // 数据文件
  FILES: {
    SETTINGS: 'settings.json',
    CLASSES: 'classes.json',
    HISTORY: 'history.json'
  },
  
  // 主题
  THEME: {
    MODES: {
      LIGHT: 'light',
      DARK: 'dark',
      AUTO: 'auto'
    },
    STYLES: [
      'material',
      'fluent',
      'apple',
      'flat',
      'neumorphism',
      'glassmorphism'
    ]
  },
  
  // 页面 ID
  PAGES: {
    HOME: 'home',
    CLASSES: 'classes',
    STUDENTS: 'students',
    HISTORY: 'history',
    STATS: 'stats',
    SETTINGS: 'settings'
  },

  // 默认设置
  DEFAULTS: {
    LANGUAGE: 'zh-CN',
    THEME_STYLE: 'fluent',
    THEME_MODE: 'auto',
    PICK_COUNT: 1,
    MAX_PICK_COUNT: 10
  }
};

// 导出到全局
window.Constants = Constants;
