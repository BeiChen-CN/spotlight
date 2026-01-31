/**
 * 班级管理模块
 */

const classManager = {
  /**
   * 渲染班级列表
   */
  renderList() {
    const classes = store.getClasses();
    const listEl = document.getElementById('class-list');
    const emptyEl = document.getElementById('class-empty');
    
    if (classes.length === 0) {
      listEl.innerHTML = '';
      emptyEl.classList.remove('hidden');
      return;
    }
    
    emptyEl.classList.add('hidden');
    
    listEl.innerHTML = classes.map(cls => `
      <tr>
        <td>${this.escapeHtml(cls.name)}</td>
        <td>${cls.students.length}</td>
        <td class="table-actions">
          <button class="btn btn-ghost btn-sm" onclick="classManager.showEditModal('${cls.id}')">
            ${t('common.edit')}
          </button>
          <button class="btn btn-ghost btn-sm" onclick="classManager.confirmDelete('${cls.id}')">
            ${t('common.delete')}
          </button>
        </td>
      </tr>
    `).join('');
  },

  /**
   * 渲染班级选择器 (Custom Dropdown)
   */
  renderSelector() {
    const classes = store.getClasses();
    const currentId = store.getCurrentClassId();
    
    // Initialize interactions once
    if (!this.selectorInitialized) {
      this.initCustomSelect();
    }
    
    const currentClass = classes.find(c => c.id === currentId);
    const displayText = currentClass ? currentClass.name : t('home.selectClass');
    
    // Update ALL custom select instances
    const containers = document.querySelectorAll('.custom-class-select-container');
    
    containers.forEach(container => {
      // Update Trigger Text
      const triggerText = container.querySelector('.custom-select-trigger-text');
      if (triggerText) {
        triggerText.textContent = displayText;
      }
      
      // Populate Options
      const optionsContainer = container.querySelector('.custom-options');
      if (optionsContainer) {
        if (classes.length === 0) {
          optionsContainer.innerHTML = `<div class="custom-option disabled" style="color:var(--text-tertiary); cursor:default;">${t('home.noClass')}</div>`;
        } else {
          optionsContainer.innerHTML = classes.map(cls => `
            <div class="custom-option ${cls.id === currentId ? 'selected' : ''}" 
                 onclick="classManager.handleClassSelect('${cls.id}')">
              ${this.escapeHtml(cls.name)}
            </div>
          `).join('');
        }
      }
    });
  },

  /**
   * 初始化自定义下拉框交互
   */
  initCustomSelect() {
    // Delegate click events for triggers (since we have multiple)
    // Actually, distinct listeners are safer if elements exist.
    const containers = document.querySelectorAll('.custom-class-select-container');
    
    containers.forEach(container => {
      const trigger = container.querySelector('.custom-select-trigger');
      const dropdown = container.querySelector('.custom-select');
      
      if (trigger && dropdown) {
        // Remove old listener if any? (Simple cloneNode or just overwrite onclick)
        trigger.onclick = (e) => {
          e.stopPropagation();
          // Close others?
          document.querySelectorAll('.custom-select.open').forEach(el => {
            if (el !== dropdown) el.classList.remove('open');
          });
          dropdown.classList.toggle('open');
        };
      }
    });
    
    // Global click outside listener (Once)
    if (!this.globalClickListenerAttached) {
      window.addEventListener('click', (e) => {
        document.querySelectorAll('.custom-select.open').forEach(dropdown => {
          if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('open');
          }
        });
      });
      this.globalClickListenerAttached = true;
    }

    this.selectorInitialized = true;
  },

  /**
   * 处理班级选择
   */
  handleClassSelect(id) {
    app.switchClass(id);
    // Close all dropdowns
    document.querySelectorAll('.custom-select.open').forEach(el => {
      el.classList.remove('open');
    });
  },

  /**
   * 显示添加班级模态框
   */
  showAddModal() {
    const modalBody = `
      <div class="form-group">
        <label class="form-label" data-i18n="classes.className">${t('classes.className')}</label>
        <input type="text" class="input" id="class-name-input" 
               placeholder="${t('classes.inputPlaceholder')}" autofocus>
      </div>
    `;
    
    const modalFooter = `
      <button class="btn btn-secondary" onclick="app.closeModal()">
        ${t('common.cancel')}
      </button>
      <button class="btn btn-primary" onclick="classManager.add()">
        ${t('common.save')}
      </button>
    `;
    
    app.showModal(t('classes.addClass'), modalBody, modalFooter);
    
    // 聚焦输入框
    setTimeout(() => {
      document.getElementById('class-name-input').focus();
    }, 100);
    
    // 回车保存
    document.getElementById('class-name-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.add();
      }
    });
  },

  /**
   * 添加班级
   */
  async add() {
    const input = document.getElementById('class-name-input');
    const name = input.value.trim();
    
    if (!name) {
      app.toast(t('classes.emptyName'), 'error');
      input.focus();
      return;
    }
    
    await store.addClass(name);
    app.closeModal();
    this.renderList();
    this.renderSelector();
    app.updateHomeState();
    app.toast(t('common.success'), 'success');
  },

  /**
   * 显示编辑班级模态框
   */
  async showEditModal(classId) {
    if (!await app.verifyPassword()) return;
    
    const classes = store.getClasses();
    const cls = classes.find(c => c.id === classId);
    
    if (!cls) return;
    
    const modalBody = `
      <div class="form-group">
        <label class="form-label" data-i18n="classes.className">${t('classes.className')}</label>
        <input type="text" class="input" id="class-name-input" 
               value="${this.escapeHtml(cls.name)}" autofocus>
      </div>
    `;
    
    const modalFooter = `
      <button class="btn btn-secondary" onclick="app.closeModal()">
        ${t('common.cancel')}
      </button>
      <button class="btn btn-primary" onclick="classManager.update('${classId}')">
        ${t('common.save')}
      </button>
    `;
    
    app.showModal(t('classes.editClass'), modalBody, modalFooter);
    
    setTimeout(() => {
      const input = document.getElementById('class-name-input');
      input.focus();
      input.select();
    }, 100);
    
    document.getElementById('class-name-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.update(classId);
      }
    });
  },

  /**
   * 更新班级
   */
  async update(classId) {
    const input = document.getElementById('class-name-input');
    const name = input.value.trim();
    
    if (!name) {
      app.toast(t('classes.emptyName'), 'error');
      input.focus();
      return;
    }
    
    await store.updateClass(classId, name);
    app.closeModal();
    this.renderList();
    this.renderSelector();
    app.toast(t('common.success'), 'success');
  },

  /**
   * 确认删除班级
   */
  async confirmDelete(classId) {
    if (!await app.verifyPassword()) return;
    
    const classes = store.getClasses();
    const cls = classes.find(c => c.id === classId);
    
    if (!cls) return;
    
    const message = t('classes.confirmDelete', { name: cls.name });
    
    const modalBody = `<p>${message}</p>`;
    
    const modalFooter = `
      <button class="btn btn-secondary" onclick="app.closeModal()">
        ${t('common.cancel')}
      </button>
      <button class="btn btn-danger" onclick="classManager.delete('${classId}')">
        ${t('common.delete')}
      </button>
    `;
    
    app.showModal(t('classes.deleteClass'), modalBody, modalFooter);
  },

  /**
   * 删除班级
   */
  async delete(classId) {
    await store.deleteClass(classId);
    app.closeModal();
    this.renderList();
    this.renderSelector();
    app.updateHomeState();
    studentManager.renderList();
    app.toast(t('common.success'), 'success');
  },

  /**
   * HTML 转义
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

window.classManager = classManager;
