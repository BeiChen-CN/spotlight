/**
 * 数据存储模块
 * 处理班级、学生、历史记录、设置的持久化存储
 */

class DataStore {
  constructor() {
    this.settings = null;
    this.classes = null;
    this.history = null;
    this.initialized = false;
  }

  /**
   * 初始化数据存储
   */
  async init() {
    if (this.initialized) return;

    // 加载设置
    this.settings = await window.electronAPI.readJson(Constants.FILES.SETTINGS);
    if (!this.settings) {
      this.settings = this.getDefaultSettings();
      await this.saveSettings();
    }

    // 加载班级数据
    this.classes = await window.electronAPI.readJson(Constants.FILES.CLASSES);
    if (!this.classes) {
      this.classes = this.getDefaultClasses();
      await this.saveClasses();
    }

    // 加载历史记录
    this.history = await window.electronAPI.readJson(Constants.FILES.HISTORY);
    if (!this.history) {
      this.history = this.getDefaultHistory();
      await this.saveHistory();
    }

    this.initialized = true;
  }

  /**
   * 默认设置
   */
  getDefaultSettings() {
    return {
      password: '',
      theme: {
        style: Constants.DEFAULTS.THEME_STYLE,
        mode: Constants.DEFAULTS.THEME_MODE,
        accent: 'default'
      },
      language: Constants.DEFAULTS.LANGUAGE,
      showStudentId: true,
      photoMode: true,
      shortcuts: {
        pick: 'Space'
      }
    };
  }

  /**
   * 默认班级数据
   */
  getDefaultClasses() {
    return {
      classes: [],
      currentClassId: null
    };
  }

  /**
   * 默认历史记录
   */
  getDefaultHistory() {
    return {
      records: []
    };
  }

  // ==================== 设置相关 ====================

  async saveSettings() {
    await window.electronAPI.writeJson(Constants.FILES.SETTINGS, this.settings);
  }

  getSettings() {
    return this.settings;
  }

  async updateSettings(updates) {
    this.settings = { ...this.settings, ...updates };
    await this.saveSettings();
  }

  async setTheme(style, mode) {
    this.settings.theme = { 
      ...this.settings.theme, 
      style, 
      mode 
    };
    await this.saveSettings();
  }

  async setAccentColor(accent) {
    this.settings.theme = {
      ...this.settings.theme,
      accent
    };
    await this.saveSettings();
  }

  async setLanguage(language) {
    this.settings.language = language;
    await this.saveSettings();
  }

  async setPassword(password) {
    this.settings.password = password;
    await this.saveSettings();
  }

  async setShortcut(action, key) {
    this.settings.shortcuts[action] = key;
    await this.saveSettings();
  }

  // ==================== 班级相关 ====================

  async saveClasses() {
    await window.electronAPI.writeJson(Constants.FILES.CLASSES, this.classes);
  }

  getClasses() {
    return this.classes.classes;
  }

  getCurrentClass() {
    if (!this.classes.currentClassId) return null;
    return this.classes.classes.find(c => c.id === this.classes.currentClassId);
  }

  getCurrentClassId() {
    return this.classes.currentClassId;
  }

  async setCurrentClass(classId) {
    this.classes.currentClassId = classId;
    await this.saveClasses();
  }

  async addClass(name) {
    const newClass = {
      id: this.generateId(),
      name: name,
      students: []
    };
    this.classes.classes.push(newClass);
    
    // 如果是第一个班级，自动设为当前班级
    if (this.classes.classes.length === 1) {
      this.classes.currentClassId = newClass.id;
    }
    
    await this.saveClasses();
    return newClass;
  }

  async updateClass(classId, name) {
    const cls = this.classes.classes.find(c => c.id === classId);
    if (cls) {
      cls.name = name;
      await this.saveClasses();
    }
  }

  async deleteClass(classId) {
    const index = this.classes.classes.findIndex(c => c.id === classId);
    if (index !== -1) {
      // 删除该班级所有学生的照片
      const cls = this.classes.classes[index];
      for (const student of cls.students) {
        if (student.photo) {
          await window.electronAPI.deletePhoto(student.photo);
        }
      }
      
      this.classes.classes.splice(index, 1);
      
      // 如果删除的是当前班级，切换到第一个班级
      if (this.classes.currentClassId === classId) {
        this.classes.currentClassId = this.classes.classes.length > 0 
          ? this.classes.classes[0].id 
          : null;
      }
      
      await this.saveClasses();
    }
  }

  // ==================== 学生相关 ====================

  getStudents(classId = null) {
    const id = classId || this.classes.currentClassId;
    const cls = this.classes.classes.find(c => c.id === id);
    return cls ? cls.students : [];
  }

  getStudent(studentId, classId = null) {
    const students = this.getStudents(classId);
    return students.find(s => s.id === studentId);
  }

  async addStudent(name, studentId = '', photo = '', classId = null) {
    const id = classId || this.classes.currentClassId;
    const cls = this.classes.classes.find(c => c.id === id);
    
    if (cls) {
      const newStudent = {
        id: this.generateId(),
        name: name,
        studentId: studentId,
        photo: photo,
        pickCount: 0,
        score: 0,
        status: 'active',
        lastPickedAt: null
      };
      cls.students.push(newStudent);
      await this.saveClasses();
      return newStudent;
    }
    return null;
  }

  async addStudents(students, classId = null) {
    const id = classId || this.classes.currentClassId;
    const cls = this.classes.classes.find(c => c.id === id);
    
    if (cls) {
      for (const s of students) {
        cls.students.push({
          id: this.generateId(),
          name: s.name,
          studentId: s.studentId || '',
          photo: s.photo || '',
          pickCount: 0,
          score: s.score || 0,
          status: s.status || 'active',
          lastPickedAt: null
        });
      }
      await this.saveClasses();
    }
  }

  async updateStudent(studentId, updates, classId = null) {
    const id = classId || this.classes.currentClassId;
    const cls = this.classes.classes.find(c => c.id === id);
    
    if (cls) {
      const student = cls.students.find(s => s.id === studentId);
      if (student) {
        Object.assign(student, updates);
        await this.saveClasses();
      }
    }
  }

  async deleteStudent(studentId, classId = null) {
    const id = classId || this.classes.currentClassId;
    const cls = this.classes.classes.find(c => c.id === id);
    
    if (cls) {
      const index = cls.students.findIndex(s => s.id === studentId);
      if (index !== -1) {
        const student = cls.students[index];
        // 删除照片
        if (student.photo) {
          await window.electronAPI.deletePhoto(student.photo);
        }
        cls.students.splice(index, 1);
        await this.saveClasses();
      }
    }
  }

  async incrementPickCount(studentId, classId = null) {
    const id = classId || this.classes.currentClassId;
    const cls = this.classes.classes.find(c => c.id === id);
    
    if (cls) {
      const student = cls.students.find(s => s.id === studentId);
      if (student) {
        student.pickCount = (student.pickCount || 0) + 1;
        student.lastPickedAt = new Date().toISOString();
        await this.saveClasses();
      }
    }
  }

  /**
   * 更新学生积分
   */
  async updateStudentScore(studentId, delta, classId = null) {
    const id = classId || this.classes.currentClassId;
    const cls = this.classes.classes.find(c => c.id === id);
    
    if (cls) {
      const student = cls.students.find(s => s.id === studentId);
      if (student) {
        student.score = (student.score || 0) + delta;
        await this.saveClasses();
        return student.score;
      }
    }
    return null;
  }

  /**
   * 设置学生状态 (active/absent/excluded)
   */
  async setStudentStatus(studentId, status, classId = null) {
    const id = classId || this.classes.currentClassId;
    const cls = this.classes.classes.find(c => c.id === id);
    
    if (cls) {
      const student = cls.students.find(s => s.id === studentId);
      if (student) {
        student.status = status;
        await this.saveClasses();
      }
    }
  }

  // ==================== 历史记录相关 ====================

  async saveHistory() {
    await window.electronAPI.writeJson(Constants.FILES.HISTORY, this.history);
  }

  getHistory() {
    return this.history.records;
  }

  async addHistoryRecord(classId, className, pickedStudents) {
    const record = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      classId: classId,
      className: className,
      pickedStudents: pickedStudents.map(s => ({
        id: s.id,
        name: s.name,
        studentId: s.studentId
      }))
    };
    
    this.history.records.unshift(record);
    
    // 只保留最近1000条记录
    if (this.history.records.length > 1000) {
      this.history.records = this.history.records.slice(0, 1000);
    }
    
    await this.saveHistory();
    return record;
  }

  async clearHistory() {
    this.history.records = [];
    await this.saveHistory();
  }

  // ==================== 统计相关 ====================

  getStudentStats(classId = null) {
    const students = this.getStudents(classId);
    return students
      .map(s => ({
        id: s.id,
        name: s.name,
        studentId: s.studentId,
        pickCount: s.pickCount || 0
      }))
      .sort((a, b) => b.pickCount - a.pickCount);
  }

  // ==================== 工具方法 ====================

  generateId() {
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 重新加载所有数据（用于恢复备份后）
   */
  async reload() {
    this.initialized = false;
    await this.init();
  }
}

// 导出单例
window.store = new DataStore();
