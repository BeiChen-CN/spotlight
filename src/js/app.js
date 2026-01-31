/**
 * 应用主入口
 */

const app = {
  currentPage: 'home',

  /**
   * 初始化应用
   */
  async init() {
    try {
      console.log('开始初始化应用...');
      
      // 初始化数据存储
      await store.init();
      console.log('数据存储初始化完成');
      
      // 获取设置
      const settings = store.getSettings();
      
      // 初始化多语言
      await i18n.init(settings.language);
      console.log('多语言初始化完成');
      
      // 初始化主题
      await themeManager.init(settings);
      console.log('主题初始化完成');
      
      // 检查密码保护 (移除启动时检查)
      // if (settings.password && settings.password.length > 0) {
      //   this.showPasswordOverlay();
      // }
      
      // 注册快捷键
      if (settings.shortcuts && settings.shortcuts.pick) {
        await window.electronAPI.registerShortcut(settings.shortcuts.pick, 'pick');
      }
      
      // 监听快捷键
      window.electronAPI.onShortcutTriggered((action) => {
        if (action === 'pick') {
          // 仅在首页且未打开模态框时响应
          if (this.currentPage === 'home' && !document.querySelector('.modal-overlay')) {
             this.pick();
          }
        }
      });
      
      // 渲染初始界面
      this.renderAll();
      
      // 初始化设置界面
      settingsManager.init();
      
      // 更新首页状态
      this.updateHomeState();
      
      console.log('应用初始化完成');
    } catch (error) {
      console.error('应用初始化失败:', error);
    }
  },

  /**
   * 渲染所有列表
   */
  renderAll() {
    classManager.renderList();
    classManager.renderSelector();
    studentManager.renderList();
    historyManager.renderList();
    historyManager.renderStats();
  },

  // 密码验证 Promise Resolver
  passwordResolver: null,

  /**
   * 请验证密码 (返回 Promise)
   */
  async verifyPassword() {
    const settings = store.getSettings();
    
    // 如果没有设置密码，直接通过
    if (!settings.password || settings.password.length === 0) {
      return true;
    }
    
    // 显示密码框
    return new Promise((resolve) => {
      this.passwordResolver = resolve;
      this.showPasswordOverlay(true);
    });
  },

  /**
   * 显示密码遮罩
   * @param {boolean} showCancel 是否显示取消按钮
   */
  showPasswordOverlay(showCancel = false) {
    const overlay = document.getElementById('password-overlay');
    const input = document.getElementById('password-input');
    const cancelBtn = document.getElementById('password-cancel');
    
    overlay.classList.remove('hidden');
    input.value = '';
    document.getElementById('password-error').classList.add('hidden');
    
    if (showCancel) {
      cancelBtn.classList.remove('hidden');
    } else {
      cancelBtn.classList.add('hidden');
    }
    
    input.focus();
    
    // 移除旧的监听器以防重复
    const newRouter = (e) => {
      if (e.key === 'Enter') {
        this.checkPassword();
      }
    };
    
    input.onkeypress = newRouter;
  },

  /**
   * 验证密码
   */
  checkPassword() {
    const input = document.getElementById('password-input');
    const errorEl = document.getElementById('password-error');
    const settings = store.getSettings();
    
    if (input.value === settings.password) {
      document.getElementById('password-overlay').classList.add('hidden');
      if (this.passwordResolver) {
        this.passwordResolver(true);
        this.passwordResolver = null;
      }
    } else {
      errorEl.textContent = t('password.incorrect');
      errorEl.classList.remove('hidden');
      input.value = '';
      input.focus();
    }
  },

  /**
   * 取消密码验证
   */
  cancelPassword() {
    document.getElementById('password-overlay').classList.add('hidden');
    if (this.passwordResolver) {
      this.passwordResolver(false);
      this.passwordResolver = null;
    }
  },

  /**
   * 切换页面
   */
  showPage(pageName) {
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active');
    });
    
    // 显示目标页面
    document.getElementById(`page-${pageName}`).classList.add('active');
    
    // 更新导航
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`.nav-item[data-page="${pageName}"]`).classList.add('active');
    
    this.currentPage = pageName;
    
    // 页面切换时刷新数据
    if (pageName === 'history') {
      historyManager.renderList();
    } else if (pageName === 'stats') {
      historyManager.renderStats();
    } else if (pageName === 'settings') {
      settingsManager.init();
    } else if (pageName === 'leaderboard') {
      leaderboard.renderList();
    }
  },

  /**
   * 切换班级
   */
  async switchClass(classId) {
    await store.setCurrentClass(classId || null);
    classManager.renderSelector();
    studentManager.renderList();
    historyManager.renderStats();
    this.updateHomeState();
    picker.resetResult();
  },

  /**
   * 更新首页状态
   */
  updateHomeState() {
    const noClassEl = document.getElementById('home-no-class');
    const noStudentsEl = document.getElementById('home-no-students');
    const pickAreaEl = document.getElementById('home-pick-area');
    
    const classes = store.getClasses();
    const students = store.getStudents();
    
    if (classes.length === 0) {
      noClassEl.classList.remove('hidden');
      noStudentsEl.classList.add('hidden');
      pickAreaEl.classList.add('hidden');
    } else if (students.length === 0) {
      noClassEl.classList.add('hidden');
      noStudentsEl.classList.remove('hidden');
      pickAreaEl.classList.add('hidden');
    } else {
      noClassEl.classList.add('hidden');
      noStudentsEl.classList.add('hidden');
      pickAreaEl.classList.remove('hidden');
    }
  },

  /**
   * 增加抽取人数
   */
  increasePickCount() {
    picker.increase();
  },

  /**
   * 减少抽取人数
   */
  decreasePickCount() {
    picker.decrease();
  },

  /**
   * 执行抽取
   */
  async pick() {
    await picker.pick();
  },

  /**
   * 显示模态框
   */
  showModal(title, body, footer) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = body;
    document.getElementById('modal-footer').innerHTML = footer;
    document.getElementById('modal-overlay').classList.add('active');
  },

  /**
   * 关闭模态框
   */
  closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
  },

  /**
   * 显示 Toast 消息
   */
  toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // 3秒后自动消失
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }
};

// 导出全局对象
window.app = app;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});

// 点击模态框外部关闭
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target.id === 'modal-overlay') {
    app.closeModal();
  }
});
