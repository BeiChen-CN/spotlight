/**
 * 积分排行榜模块
 */

const leaderboard = {
  /**
   * 渲染排行榜
   */
  renderList() {
    const students = store.getStudents();
    const listEl = document.getElementById('leaderboard-list');
    const emptyEl = document.getElementById('leaderboard-empty');
    const settings = store.getSettings();
    
    if (!listEl) return;
    
    if (students.length === 0) {
      listEl.innerHTML = '';
      if (emptyEl) emptyEl.classList.remove('hidden');
      return;
    }
    
    if (emptyEl) emptyEl.classList.add('hidden');
    
    // 按积分降序排列
    const sorted = [...students].sort((a, b) => (b.score || 0) - (a.score || 0));
    
    listEl.innerHTML = sorted.map((student, index) => {
      const rank = index + 1;
      const score = student.score || 0;
      const rankClass = rank <= 3 ? `rank-${rank}` : '';
      const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
      
      return `
        <tr class="${rankClass}">
          <td class="rank-cell">${rankIcon}</td>
          <td>${this.escapeHtml(student.name)}</td>
          <td>${settings.showStudentId ? this.escapeHtml(student.studentId || '-') : '-'}</td>
          <td>
            <span class="score-badge">${score}</span>
          </td>
          <td>
            <div class="btn-group-sm">
              <button class="btn btn-ghost btn-sm" onclick="leaderboard.addScore('${student.id}', 1)" title="+1">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
              <button class="btn btn-ghost btn-sm" onclick="leaderboard.addScore('${student.id}', -1)" title="-1">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  /**
   * 更新学生积分
   */
  async addScore(studentId, delta) {
    await store.updateStudentScore(studentId, delta);
    this.renderList();
  },

  /**
   * 导出积分
   */
  async exportScores() {
    const students = store.getStudents();
    
    if (students.length === 0) {
      app.toast('暂无数据可导出', 'warning');
      return;
    }
    
    const filePath = await window.electronAPI.saveFile({
      defaultPath: `积分排行_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`,
      filters: [{ name: 'Excel 文件', extensions: ['xlsx'] }]
    });
    
    if (!filePath) return;
    
    try {
      const XLSX = require('xlsx');
      
      // 按积分降序
      const sorted = [...students].sort((a, b) => (b.score || 0) - (a.score || 0));
      
      const data = sorted.map((student, index) => ({
        '排名': index + 1,
        '姓名': student.name,
        '学号': student.studentId || '',
        '积分': student.score || 0
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '积分排行榜');
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      await window.electronAPI.writeBinaryFile(filePath, buffer);
      
      app.toast('导出成功', 'success');
    } catch (error) {
      console.error('导出积分失败:', error);
      app.toast('导出失败', 'error');
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

window.leaderboard = leaderboard;
