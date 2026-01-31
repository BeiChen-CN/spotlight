/**
 * 多语言模块
 */

// 语言包数据直接嵌入
const locales = {
  'zh-CN': {
    app: { name: 'Spotlight', title: 'Spotlight - 智能点名助手' },
    nav: { home: '首页', classes: '班级管理', students: '学生管理', history: '历史记录', stats: '统计', settings: '设置' },
    home: { selectClass: '请选择班级', noClass: '暂无班级，请先创建班级', noStudents: '当前班级暂无学生', pickCount: '抽取人数', pickButton: '开始抽取', picking: '抽取中...', result: '抽取结果', pickAgain: '再抽一次' },
    classes: { title: '班级管理', addClass: '添加班级', editClass: '编辑班级', deleteClass: '删除班级', className: '班级名称', studentCount: '学生人数', actions: '操作', confirmDelete: '确定要删除班级 "{name}" 吗？该班级下的所有学生也会被删除。', inputPlaceholder: '请输入班级名称', emptyName: '班级名称不能为空' },
    students: { title: '学生管理', addStudent: '添加学生', editStudent: '编辑学生', deleteStudent: '删除学生', importTxt: '导入 TXT', importExcel: '导入 Excel', importPhotos: '批量导入照片', studentName: '姓名', studentId: '学号', photo: '照片', pickCount: '抽中次数', actions: '操作', confirmDelete: '确定要删除学生 "{name}" 吗？', namePlaceholder: '请输入学生姓名', idPlaceholder: '请输入学号（可选）', selectPhoto: '选择照片', removePhoto: '移除照片', emptyName: '学生姓名不能为空', importSuccess: '成功导入 {count} 名学生', photoImportSuccess: '成功匹配 {count} 张照片', noMatch: '未找到匹配的学生' },
    history: { title: '历史记录', time: '时间', class: '班级', pickedStudents: '抽中学生', exportExcel: '导出 Excel', exportTxt: '导出 TXT', clearHistory: '清空历史', confirmClear: '确定要清空所有历史记录吗？', noRecords: '暂无历史记录', exportSuccess: '导出成功' },
    stats: { title: '抽中次数统计', rank: '排名', studentName: '姓名', studentId: '学号', pickCount: '抽中次数', noData: '暂无统计数据' },
    settings: { title: '设置', theme: '主题设置', themeStyle: 'UI 风格', themeMode: '颜色模式', light: '浅色', dark: '深色', auto: '跟随系统', language: '语言', display: '显示设置', showStudentId: '显示学号', photoMode: '显示照片', shortcuts: '快捷键设置', pickShortcut: '抽取快捷键', pressKey: '按下快捷键...', security: '安全设置', password: '密码保护', setPassword: '设置密码', changePassword: '修改密码', removePassword: '移除密码', passwordPlaceholder: '请输入密码', confirmPassword: '确认密码', passwordMismatch: '两次输入的密码不一致', passwordSet: '密码已设置', passwordRemoved: '密码已移除', data: '数据管理', backup: '备份数据', restore: '恢复数据', backupSuccess: '备份成功', restoreSuccess: '恢复成功，应用将重新加载', restoreConfirm: '恢复数据将覆盖当前所有数据，确定继续吗？' },
    themes: { material: 'Material Design', fluent: 'Fluent Design', apple: 'Apple HIG', flat: 'Flat Design', neumorphism: 'Neumorphism', glassmorphism: 'Glassmorphism' },
    common: { save: '保存', cancel: '取消', confirm: '确定', delete: '删除', edit: '编辑', add: '添加', close: '关闭', search: '搜索', loading: '加载中...', success: '操作成功', error: '操作失败', warning: '警告', info: '提示' },
    password: { title: '请输入密码', placeholder: '密码', submit: '确定', incorrect: '密码错误' }
  },
  'en-US': {
    app: { name: 'Spotlight', title: 'Spotlight' },
    nav: { home: 'Home', classes: 'Classes', students: 'Students', history: 'History', stats: 'Statistics', settings: 'Settings' },
    home: { selectClass: 'Select Class', noClass: 'No classes yet, please create one first', noStudents: 'No students in current class', pickCount: 'Pick Count', pickButton: 'Pick', picking: 'Picking...', result: 'Result', pickAgain: 'Pick Again' },
    classes: { title: 'Class Management', addClass: 'Add Class', editClass: 'Edit Class', deleteClass: 'Delete Class', className: 'Class Name', studentCount: 'Students', actions: 'Actions', confirmDelete: 'Are you sure you want to delete class "{name}"? All students in this class will also be deleted.', inputPlaceholder: 'Enter class name', emptyName: 'Class name cannot be empty' },
    students: { title: 'Student Management', addStudent: 'Add Student', editStudent: 'Edit Student', deleteStudent: 'Delete Student', importTxt: 'Import TXT', importExcel: 'Import Excel', importPhotos: 'Import Photos', studentName: 'Name', studentId: 'Student ID', photo: 'Photo', pickCount: 'Pick Count', actions: 'Actions', confirmDelete: 'Are you sure you want to delete student "{name}"?', namePlaceholder: 'Enter student name', idPlaceholder: 'Enter student ID (optional)', selectPhoto: 'Select Photo', removePhoto: 'Remove Photo', emptyName: 'Student name cannot be empty', importSuccess: 'Successfully imported {count} students', photoImportSuccess: 'Successfully matched {count} photos', noMatch: 'No matching students found' },
    history: { title: 'History', time: 'Time', class: 'Class', pickedStudents: 'Picked Students', exportExcel: 'Export Excel', exportTxt: 'Export TXT', clearHistory: 'Clear History', confirmClear: 'Are you sure you want to clear all history records?', noRecords: 'No history records', exportSuccess: 'Export successful' },
    stats: { title: 'Pick Count Statistics', rank: 'Rank', studentName: 'Name', studentId: 'Student ID', pickCount: 'Pick Count', noData: 'No statistics data' },
    settings: { title: 'Settings', theme: 'Theme Settings', themeStyle: 'UI Style', themeMode: 'Color Mode', light: 'Light', dark: 'Dark', auto: 'System', language: 'Language', display: 'Display Settings', showStudentId: 'Show Student ID', photoMode: 'Show Photos', shortcuts: 'Shortcut Settings', pickShortcut: 'Pick Shortcut', pressKey: 'Press a key...', security: 'Security', password: 'Password Protection', setPassword: 'Set Password', changePassword: 'Change Password', removePassword: 'Remove Password', passwordPlaceholder: 'Enter password', confirmPassword: 'Confirm Password', passwordMismatch: 'Passwords do not match', passwordSet: 'Password has been set', passwordRemoved: 'Password has been removed', data: 'Data Management', backup: 'Backup Data', restore: 'Restore Data', backupSuccess: 'Backup successful', restoreSuccess: 'Restore successful, app will reload', restoreConfirm: 'Restoring data will overwrite all current data. Continue?' },
    themes: { material: 'Material Design', fluent: 'Fluent Design', apple: 'Apple HIG', flat: 'Flat Design', neumorphism: 'Neumorphism', glassmorphism: 'Glassmorphism' },
    common: { save: 'Save', cancel: 'Cancel', confirm: 'Confirm', delete: 'Delete', edit: 'Edit', add: 'Add', close: 'Close', search: 'Search', loading: 'Loading...', success: 'Success', error: 'Error', warning: 'Warning', info: 'Info' },
    password: { title: 'Enter Password', placeholder: 'Password', submit: 'Submit', incorrect: 'Incorrect password' }
  }
};

class I18n {
  constructor() {
    this.currentLocale = 'zh-CN';
    this.translations = locales;
  }

  /**
   * 初始化多语言
   */
  async init(locale = 'zh-CN') {
    this.currentLocale = locale;
  }

  /**
   * 切换语言
   */
  async setLocale(locale) {
    this.currentLocale = locale;
    this.updateAllTranslations();
  }

  /**
   * 获取翻译文本
   */
  t(key, params = {}) {
    const keys = key.split('.');
    let value = this.translations[this.currentLocale];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }

    if (value === undefined) {
      return key;
    }

    // 处理插值
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        value = value.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), paramValue);
      }
    }

    return value;
  }

  /**
   * 更新页面上所有带有 data-i18n 属性的元素
   */
  updateAllTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.title = this.t(key);
    });
  }

  getLocale() {
    return this.currentLocale;
  }

  getSupportedLocales() {
    return [
      { code: 'zh-CN', name: '中文' },
      { code: 'en-US', name: 'English' }
    ];
  }
}

// 导出单例
window.i18n = new I18n();

// 快捷函数
window.t = (key, params) => window.i18n.t(key, params);
