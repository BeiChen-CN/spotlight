/**
 * 历史记录模块
 */

const historyManager = {
  /**
   * 渲染历史记录列表
   */
  renderList() {
    const records = store.getHistory();
    const listEl = document.getElementById('history-list');
    const emptyEl = document.getElementById('history-empty');
    
    if (records.length === 0) {
      listEl.innerHTML = '';
      emptyEl.classList.remove('hidden');
      return;
    }
    
    emptyEl.classList.add('hidden');
    
    listEl.innerHTML = records.map(record => {
      const date = new Date(record.timestamp);
      const timeStr = date.toLocaleString();
      const students = record.pickedStudents.map(s => s.name).join(', ');
      
      return `
        <tr>
          <td>${timeStr}</td>
          <td>${this.escapeHtml(record.className)}</td>
          <td>${this.escapeHtml(students)}</td>
        </tr>
      `;
    }).join('');
  },

  /**
   * 渲染统计列表
   */
  renderStats() {
    const stats = store.getStudentStats();
    const listEl = document.getElementById('stats-list');
    const emptyEl = document.getElementById('stats-empty');
    const settings = store.getSettings();
    
    // 控制学号列显示
    const thIdEl = document.getElementById('th-stats-id');
    if (thIdEl) {
      thIdEl.style.display = settings.showStudentId ? '' : 'none';
    }
    
    if (stats.length === 0) {
      listEl.innerHTML = '';
      emptyEl.classList.remove('hidden');
      this.renderChart([]); // Clear chart
      return;
    }
    
    emptyEl.classList.add('hidden');
    
    listEl.innerHTML = stats.map((student, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${this.escapeHtml(student.name)}</td>
        <td style="display: ${settings.showStudentId ? '' : 'none'}">
          ${this.escapeHtml(student.studentId || '-')}
        </td>
        <td>
          <span class="badge badge-primary">${student.pickCount}</span>
        </td>
      </tr>
    `).join('');
    
    // 渲染图表
    this.renderChart(stats);
  },

  /**
   * 渲染统计图表 (柱状图)
   */
  statsChart: null,
  
  renderChart(stats) {
    const canvas = document.getElementById('stats-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // 销毁旧图表
    if (this.statsChart) {
      this.statsChart.destroy();
      this.statsChart = null;
    }
    
    if (stats.length === 0) return;
    
    // 获取主题色
    const computedStyle = getComputedStyle(document.documentElement);
    const primaryColor = computedStyle.getPropertyValue('--primary').trim() || '#8B7355';
    const textColor = computedStyle.getPropertyValue('--text-primary').trim() || '#3d3d3d';
    const borderColor = computedStyle.getPropertyValue('--border-color').trim() || 'rgba(0,0,0,0.08)';
    
    // 限制显示前15名
    const displayStats = stats.slice(0, 15);
    
    this.statsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: displayStats.map(s => s.name),
        datasets: [{
          label: '抽中次数',
          data: displayStats.map(s => s.pickCount),
          backgroundColor: primaryColor + '80', // 50% opacity
          borderColor: primaryColor,
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              color: textColor
            },
            grid: {
              color: borderColor
            }
          },
          x: {
            ticks: {
              color: textColor,
              maxRotation: 45,
              minRotation: 0
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
  },

  /**
   * 导出为 Excel
   */
  async exportExcel() {
    const records = store.getHistory();
    
    if (records.length === 0) {
      app.toast(t('history.noRecords'), 'warning');
      return;
    }
    
    const filePath = await window.electronAPI.saveFile({
      defaultPath: `抽取历史_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`,
      filters: [{ name: 'Excel 文件', extensions: ['xlsx'] }]
    });
    
    if (!filePath) return;
    
    try {
      const XLSX = require('xlsx');
      
      const data = records.map(record => ({
        '时间': new Date(record.timestamp).toLocaleString(),
        '班级': record.className,
        '抽中学生': record.pickedStudents.map(s => s.name).join(', ')
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '历史记录');
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      await window.electronAPI.writeBinaryFile(filePath, buffer);
      
      app.toast(t('history.exportSuccess'), 'success');
    } catch (error) {
      console.error('导出 Excel 失败:', error);
      app.toast(t('common.error'), 'error');
    }
  },

  /**
   * 导出为 TXT
   */
  async exportTxt() {
    const records = store.getHistory();
    
    if (records.length === 0) {
      app.toast(t('history.noRecords'), 'warning');
      return;
    }
    
    const filePath = await window.electronAPI.saveFile({
      defaultPath: `抽取历史_${new Date().toLocaleDateString().replace(/\//g, '-')}.txt`,
      filters: [{ name: 'TXT 文件', extensions: ['txt'] }]
    });
    
    if (!filePath) return;
    
    try {
      const lines = records.map(record => {
        const time = new Date(record.timestamp).toLocaleString();
        const students = record.pickedStudents.map(s => s.name).join(', ');
        return `[${time}] ${record.className}: ${students}`;
      });
      
      const content = lines.join('\n');
      await window.electronAPI.writeExportFile(filePath, content);
      
      app.toast(t('history.exportSuccess'), 'success');
    } catch (error) {
      console.error('导出 TXT 失败:', error);
      app.toast(t('common.error'), 'error');
    }
  },

  /**
   * 确认清空历史
   */
  clearHistory() {
    const modalBody = `<p>${t('history.confirmClear')}</p>`;
    
    const modalFooter = `
      <button class="btn btn-secondary" onclick="app.closeModal()">
        ${t('common.cancel')}
      </button>
      <button class="btn btn-danger" onclick="historyManager.doClear()">
        ${t('common.confirm')}
      </button>
    `;
    
    app.showModal(t('history.clearHistory'), modalBody, modalFooter);
  },

  /**
   * 执行清空
   */
  async doClear() {
    await store.clearHistory();
    app.closeModal();
    this.renderList();
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

window.historyManager = historyManager;
