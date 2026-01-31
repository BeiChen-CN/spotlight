const studentManager = {
  // 虚拟滚动阈值 - 超过此数量时延迟渲染
  virtualScrollThreshold: 50,
  
  /**
   * 渲染学生列表
   */
  async renderList() {
    const students = store.getStudents();
    const listEl = document.getElementById('student-list');
    const emptyEl = document.getElementById('student-empty');
    const settings = store.getSettings();
    
    // 控制学号列显示
    const thIdEl = document.getElementById('th-student-id');
    if (thIdEl) {
      thIdEl.style.display = settings.showStudentId ? '' : 'none';
    }
    
    if (students.length === 0) {
      listEl.innerHTML = '';
      emptyEl.classList.remove('hidden');
      return;
    }
    
    emptyEl.classList.add('hidden');
    
    // 大列表优化：分批渲染
    if (students.length > this.virtualScrollThreshold) {
      await this.renderLargeList(students, listEl, settings);
    } else {
      await this.renderNormalList(students, listEl, settings);
    }
  },

  /**
   * 普通列表渲染
   */
  async renderNormalList(students, listEl, settings) {
    const rows = await Promise.all(students.map(async (student) => {
      return this.renderStudentRow(student, settings);
    }));
    listEl.innerHTML = rows.join('');
  },

  /**
   * 大列表分批渲染 (虚拟化优化)
   */
  async renderLargeList(students, listEl, settings) {
    const batchSize = 20;
    listEl.innerHTML = '';
    
    // 先渲染前 20 条
    const firstBatch = students.slice(0, batchSize);
    const firstRows = await Promise.all(firstBatch.map(s => this.renderStudentRow(s, settings)));
    listEl.innerHTML = firstRows.join('');
    
    // 延迟渲染剩余部分
    if (students.length > batchSize) {
      setTimeout(async () => {
        const remainingStudents = students.slice(batchSize);
        const remainingRows = await Promise.all(remainingStudents.map(s => this.renderStudentRow(s, settings)));
        listEl.insertAdjacentHTML('beforeend', remainingRows.join(''));
      }, 50);
    }
  },

  /**
   * 渲染单个学生行
   */
  async renderStudentRow(student, settings) {
    let photoHtml = '';
    if (settings.photoMode) {
      if (student.photo) {
        const photoPath = await window.electronAPI.getPhotoPath(student.photo);
        photoHtml = `<img src="file://${photoPath}" alt="">`;
      } else {
        photoHtml = '👤';
      }
    } else {
      photoHtml = '👤';
    }
    
    return `
      <tr>
        <td>
          <div class="avatar">
            ${photoHtml}
          </div>
        </td>
        <td>${this.escapeHtml(student.name)}</td>
        <td style="display: ${settings.showStudentId ? '' : 'none'}">
          ${this.escapeHtml(student.studentId || '-')}
        </td>
        <td>${student.pickCount || 0}</td>
        <td class="table-actions">
          <button class="btn btn-ghost btn-sm" onclick="studentManager.showEditModal('${student.id}')">
            ${t('common.edit')}
          </button>
          <button class="btn btn-ghost btn-sm" onclick="studentManager.confirmDelete('${student.id}')">
            ${t('common.delete')}
          </button>
        </td>
      </tr>
    `;
  },

  /**
   * 显示添加学生模态框
   */
  showAddModal() {
    if (!store.getCurrentClassId()) {
      app.toast(t('home.noClass'), 'warning');
      return;
    }
    
    const modalBody = `
      <div class="form-group">
        <label class="form-label">${t('students.studentName')}</label>
        <input type="text" class="input" id="student-name-input" 
               placeholder="${t('students.namePlaceholder')}" autofocus>
      </div>
      <div class="form-group">
        <label class="form-label">${t('students.studentId')}</label>
        <input type="text" class="input" id="student-id-input" 
               placeholder="${t('students.idPlaceholder')}">
      </div>
      <div class="form-group">
        <label class="form-label">${t('students.photo')}</label>
        <div class="photo-upload">
          <div class="photo-preview" id="photo-preview">
            <span>👤</span>
          </div>
          <input type="hidden" id="student-photo-path">
          <div class="flex gap-sm">
            <button class="btn btn-secondary btn-sm" onclick="studentManager.selectPhoto()">
              ${t('students.selectPhoto')}
            </button>
            <button class="btn btn-ghost btn-sm hidden" id="remove-photo-btn" onclick="studentManager.removePhoto()">
              ${t('students.removePhoto')}
            </button>
          </div>
        </div>
      </div>
    `;
    
    const modalFooter = `
      <button class="btn btn-secondary" onclick="app.closeModal()">
        ${t('common.cancel')}
      </button>
      <button class="btn btn-primary" onclick="studentManager.add()">
        ${t('common.save')}
      </button>
    `;
    
    app.showModal(t('students.addStudent'), modalBody, modalFooter);
    
    setTimeout(() => {
      document.getElementById('student-name-input').focus();
    }, 100);
  },

  /**
   * 选择照片
   */
  async selectPhoto() {
    const filePath = await window.electronAPI.selectFile({
      filters: [
        { name: '图片', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] }
      ]
    });
    
    if (filePath) {
      const preview = document.getElementById('photo-preview');
      preview.innerHTML = `<img src="file://${filePath}" alt="">`;
      preview.classList.add('has-photo');
      document.getElementById('student-photo-path').value = filePath;
      document.getElementById('remove-photo-btn').classList.remove('hidden');
    }
  },

  /**
   * 移除照片
   */
  removePhoto() {
    const preview = document.getElementById('photo-preview');
    preview.innerHTML = '<span>👤</span>';
    preview.classList.remove('has-photo');
    document.getElementById('student-photo-path').value = '';
    document.getElementById('remove-photo-btn').classList.add('hidden');
  },

  /**
   * 添加学生
   */
  async add() {
    const nameInput = document.getElementById('student-name-input');
    const idInput = document.getElementById('student-id-input');
    const photoPath = document.getElementById('student-photo-path').value;
    
    const name = nameInput.value.trim();
    const studentId = idInput.value.trim();
    
    if (!name) {
      app.toast(t('students.emptyName'), 'error');
      nameInput.focus();
      return;
    }
    
    let photo = '';
    if (photoPath) {
      const photoId = store.generateId();
      photo = await window.electronAPI.copyPhoto(photoPath, photoId);
    }
    
    await store.addStudent(name, studentId, photo);
    app.closeModal();
    this.renderList();
    app.updateHomeState();
    app.toast(t('common.success'), 'success');
  },

  /**
   * 显示编辑学生模态框
   */
  async showEditModal(studentId) {
    if (!await app.verifyPassword()) return;

    const student = store.getStudent(studentId);
    if (!student) return;
    
    let photoHtml = '<span>👤</span>';
    let hasPhoto = false;
    if (student.photo) {
      const photoPath = await window.electronAPI.getPhotoPath(student.photo);
      photoHtml = `<img src="file://${photoPath}" alt="">`;
      hasPhoto = true;
    }
    
    const modalBody = `
      <div class="form-group">
        <label class="form-label">${t('students.studentName')}</label>
        <input type="text" class="input" id="student-name-input" 
               value="${this.escapeHtml(student.name)}" autofocus>
      </div>
      <div class="form-group">
        <label class="form-label">${t('students.studentId')}</label>
        <input type="text" class="input" id="student-id-input" 
               value="${this.escapeHtml(student.studentId || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">${t('students.photo')}</label>
        <div class="photo-upload">
          <div class="photo-preview ${hasPhoto ? 'has-photo' : ''}" id="photo-preview">
            ${photoHtml}
          </div>
          <input type="hidden" id="student-photo-path">
          <input type="hidden" id="student-old-photo" value="${student.photo || ''}">
          <div class="flex gap-sm">
            <button class="btn btn-secondary btn-sm" onclick="studentManager.selectPhoto()">
              ${t('students.selectPhoto')}
            </button>
            <button class="btn btn-ghost btn-sm ${hasPhoto ? '' : 'hidden'}" id="remove-photo-btn" onclick="studentManager.removePhoto()">
              ${t('students.removePhoto')}
            </button>
          </div>
        </div>
      </div>
    `;
    
    const modalFooter = `
      <button class="btn btn-secondary" onclick="app.closeModal()">
        ${t('common.cancel')}
      </button>
      <button class="btn btn-primary" onclick="studentManager.update('${studentId}')">
        ${t('common.save')}
      </button>
    `;
    
    app.showModal(t('students.editStudent'), modalBody, modalFooter);
    
    setTimeout(() => {
      const input = document.getElementById('student-name-input');
      input.focus();
      input.select();
    }, 100);
  },

  /**
   * 更新学生
   */
  async update(studentId) {
    const nameInput = document.getElementById('student-name-input');
    const idInput = document.getElementById('student-id-input');
    const newPhotoPath = document.getElementById('student-photo-path').value;
    const oldPhoto = document.getElementById('student-old-photo').value;
    
    const name = nameInput.value.trim();
    const studentIdVal = idInput.value.trim();
    
    if (!name) {
      app.toast(t('students.emptyName'), 'error');
      nameInput.focus();
      return;
    }
    
    const updates = {
      name: name,
      studentId: studentIdVal
    };
    
    // 处理照片更新
    if (newPhotoPath) {
      // 删除旧照片
      if (oldPhoto) {
        await window.electronAPI.deletePhoto(oldPhoto);
      }
      // 复制新照片
      const photoId = store.generateId();
      updates.photo = await window.electronAPI.copyPhoto(newPhotoPath, photoId);
    } else if (!document.getElementById('photo-preview').classList.contains('has-photo') && oldPhoto) {
      // 移除了照片
      await window.electronAPI.deletePhoto(oldPhoto);
      updates.photo = '';
    }
    
    await store.updateStudent(studentId, updates);
    app.closeModal();
    this.renderList();
    app.toast(t('common.success'), 'success');
  },

  /**
   * 确认删除学生
   */
  async confirmDelete(studentId) {
    if (!await app.verifyPassword()) return;

    const student = store.getStudent(studentId);
    if (!student) return;
    
    const message = t('students.confirmDelete', { name: student.name });
    
    const modalBody = `<p>${message}</p>`;
    
    const modalFooter = `
      <button class="btn btn-secondary" onclick="app.closeModal()">
        ${t('common.cancel')}
      </button>
      <button class="btn btn-danger" onclick="studentManager.delete('${studentId}')">
        ${t('common.delete')}
      </button>
    `;
    
    app.showModal(t('students.deleteStudent'), modalBody, modalFooter);
  },

  /**
   * 删除学生
   */
  async delete(studentId) {
    await store.deleteStudent(studentId);
    app.closeModal();
    this.renderList();
    app.updateHomeState();
    app.toast(t('common.success'), 'success');
  },

  /**
   * 显示 TXT 导入预览
   */
  async showImportTxtModal() {
    if (!store.getCurrentClassId()) {
      app.toast(t('home.noClass'), 'warning');
      return;
    }
    
    const filePath = await window.electronAPI.selectFile({
      filters: [
        { name: 'TXT 文件', extensions: ['txt'] }
      ]
    });
    
    if (!filePath) return;
    
    const content = await window.electronAPI.readTextFile(filePath);
    if (!content) {
      app.toast(t('common.error'), 'error');
      return;
    }
    
    const lines = content.split('\n').map(line => line.trim());
    
    // 解析为统一格式，并进行预检
    const parsedData = lines.map((line, index) => {
      const name = line;
      const isValid = name.length > 0;
      return {
        row: index + 1,
        name: name,
        studentId: '',
        isValid: isValid,
        error: isValid ? '' : '姓名不能为空'
      };
    });
    
    this.showImportPreview(parsedData);
  },

  /**
   * 导入 Excel (带预览)
   */
  async importExcel() {
    if (!store.getCurrentClassId()) {
      app.toast(t('home.noClass'), 'warning');
      return;
    }
    
    const filePath = await window.electronAPI.selectFile({
      filters: [
        { name: 'Excel 文件', extensions: ['xlsx', 'xls'] }
      ]
    });
    
    if (!filePath) return;
    
    try {
      const buffer = await window.electronAPI.readFile(filePath);
      const XLSX = require('xlsx');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      if (data.length === 0) {
        app.toast(t('students.noMatch'), 'warning');
        return;
      }
      
      // 自动识别列名
      const firstRow = data[0];
      const keys = Object.keys(firstRow);
      
      let nameKey = keys.find(k => 
        k.includes('姓名') || k.includes('name') || k.includes('Name') || k === '名字'
      ) || keys[0];
      
      let idKey = keys.find(k => 
        k.includes('学号') || k.includes('id') || k.includes('ID') || k.includes('编号')
      );
      
      // 解析为统一格式，并进行预检
      const parsedData = data.map((row, index) => {
        const name = String(row[nameKey] || '').trim();
        const studentId = idKey ? String(row[idKey] || '').trim() : '';
        const isValid = name.length > 0;
        return {
          row: index + 2, // Excel 第一行是标题，数据从第二行开始
          name: name,
          studentId: studentId,
          isValid: isValid,
          error: isValid ? '' : '姓名不能为空'
        };
      });
      
      this.showImportPreview(parsedData);
      
    } catch (error) {
      console.error('Excel 解析失败:', error);
      app.toast(t('common.error'), 'error');
    }
  },

  // Temporary storage for pending import data
  pendingImport: null,

  /**
   * 显示导入预览模态框
   */
  showImportPreview(parsedData) {
    this.pendingImport = parsedData;
    
    const totalCount = parsedData.length;
    const validCount = parsedData.filter(d => d.isValid).length;
    const invalidCount = totalCount - validCount;
    
    // Build table rows
    const tableRows = parsedData.map(item => {
      const rowClass = item.isValid ? '' : 'style="background: var(--danger-light, #fee2e2); color: var(--danger, #ef4444);"';
      const errorCell = item.isValid ? '' : `<span style="font-size: 0.8em; color: var(--danger);">${item.error}</span>`;
      return `
        <tr ${rowClass}>
          <td>${item.row}</td>
          <td>${this.escapeHtml(item.name) || '<i style="color:var(--text-tertiary)">(空)</i>'}</td>
          <td>${this.escapeHtml(item.studentId) || '-'}</td>
          <td>${errorCell}</td>
        </tr>
      `;
    }).join('');
    
    const modalBody = `
      <div style="margin-bottom: var(--spacing-md);">
        <span style="font-weight: 600;">文件解析完成！</span>
        <span>共 ${totalCount} 条，</span>
        <span style="color: var(--success);">有效 ${validCount} 条，</span>
        <span style="color: var(--danger);">无效 ${invalidCount} 条。</span>
      </div>
      <div style="max-height: 300px; overflow-y: auto; border: 1px solid var(--border); border-radius: var(--radius-md);">
        <table class="table" style="margin: 0;">
          <thead>
            <tr>
              <th style="width: 50px;">行号</th>
              <th>姓名</th>
              <th>学号</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
      ${invalidCount > 0 ? `<p style="margin-top: var(--spacing-sm); font-size: 0.85em; color: var(--text-secondary);"><b>提示：</b>点击"导入"将自动跳过无效行。</p>` : ''}
    `;
    
    const modalFooter = `
      <button class="btn btn-secondary" onclick="app.closeModal(); studentManager.pendingImport = null;">
        ${t('common.cancel')}
      </button>
      <button class="btn btn-primary" onclick="studentManager.confirmImport()" ${validCount === 0 ? 'disabled' : ''}>
        ${validCount > 0 ? `导入有效数据 (${validCount} 条)` : '无可导入数据'}
      </button>
    `;
    
    app.showModal('导入预览', modalBody, modalFooter, 'modal-lg');
  },

  /**
   * 确认导入 (仅导入有效数据)
   */
  async confirmImport() {
    if (!this.pendingImport) return;
    
    const validStudents = this.pendingImport
      .filter(d => d.isValid)
      .map(d => ({ name: d.name, studentId: d.studentId }));
    
    if (validStudents.length === 0) {
      app.toast('没有可导入的有效数据', 'warning');
      return;
    }
    
    await store.addStudents(validStudents);
    
    app.closeModal();
    this.pendingImport = null;
    this.renderList();
    app.updateHomeState();
    app.toast(t('students.importSuccess', { count: validStudents.length }), 'success');
  },

  /**
   * 批量导入照片
   */
  async importPhotos() {
    if (!store.getCurrentClassId()) {
      app.toast(t('home.noClass'), 'warning');
      return;
    }
    
    const filePaths = await window.electronAPI.selectFiles({
      filters: [
        { name: '图片', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] }
      ]
    });
    
    if (!filePaths || filePaths.length === 0) return;
    
    const students = store.getStudents();
    let matchCount = 0;
    
    for (const filePath of filePaths) {
      // 获取文件名（不含扩展名）
      const fileName = filePath.split(/[/\\]/).pop().replace(/\.[^.]+$/, '');
      
      // 尝试匹配学生（按姓名或学号）
      const student = students.find(s => 
        s.name === fileName || s.studentId === fileName
      );
      
      if (student) {
        // 删除旧照片
        if (student.photo) {
          await window.electronAPI.deletePhoto(student.photo);
        }
        
        // 复制新照片
        const photoId = store.generateId();
        const photo = await window.electronAPI.copyPhoto(filePath, photoId);
        
        await store.updateStudent(student.id, { photo });
        matchCount++;
      }
    }
    
    if (matchCount > 0) {
      this.renderList();
      app.toast(t('students.photoImportSuccess', { count: matchCount }), 'success');
    } else {
      app.toast(t('students.noMatch'), 'warning');
    }
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

window.studentManager = studentManager;

