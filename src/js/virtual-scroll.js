/**
 * 虚拟滚动模块 - 轻量级实现
 * 只渲染可视区域的 DOM 节点，大幅提升大列表性能
 */
class VirtualScroll {
  /**
   * @param {Object} options 配置项
   * @param {HTMLElement} options.container 滚动容器
   * @param {Array} options.items 数据数组
   * @param {Function} options.renderItem 渲染函数 (item, index) => HTMLString
   * @param {number} options.itemHeight 每项高度 (px)
   * @param {number} options.buffer 缓冲区数量 (默认 5)
   */
  constructor(options) {
    this.container = options.container;
    this.items = options.items || [];
    this.renderItem = options.renderItem;
    this.itemHeight = options.itemHeight || 60;
    this.buffer = options.buffer || 5;
    
    this.scrollTop = 0;
    this.containerHeight = 0;
    this.totalHeight = 0;
    
    this.init();
  }
  
  init() {
    // 创建内部结构
    this.container.innerHTML = `
      <div class="vs-viewport" style="overflow-y: auto; height: 100%;">
        <div class="vs-spacer" style="position: relative;"></div>
      </div>
    `;
    
    this.viewport = this.container.querySelector('.vs-viewport');
    this.spacer = this.container.querySelector('.vs-spacer');
    
    // 绑定滚动事件
    this.viewport.addEventListener('scroll', this.onScroll.bind(this));
    
    // 监听容器大小变化
    this.resizeObserver = new ResizeObserver(() => this.update());
    this.resizeObserver.observe(this.container);
    
    this.update();
  }
  
  /**
   * 更新数据
   */
  setItems(items) {
    this.items = items;
    this.update();
  }
  
  /**
   * 滚动事件处理
   */
  onScroll() {
    const newScrollTop = this.viewport.scrollTop;
    if (Math.abs(newScrollTop - this.scrollTop) > this.itemHeight / 2) {
      this.scrollTop = newScrollTop;
      this.render();
    }
  }
  
  /**
   * 更新布局
   */
  update() {
    this.containerHeight = this.viewport.clientHeight;
    this.totalHeight = this.items.length * this.itemHeight;
    this.spacer.style.height = `${this.totalHeight}px`;
    this.render();
  }
  
  /**
   * 渲染可视区域
   */
  render() {
    const scrollTop = this.viewport.scrollTop;
    
    // 计算可视范围
    const startIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.buffer);
    const endIndex = Math.min(
      this.items.length,
      Math.ceil((scrollTop + this.containerHeight) / this.itemHeight) + this.buffer
    );
    
    // 渲染可视项
    const visibleItems = [];
    for (let i = startIndex; i < endIndex; i++) {
      const item = this.items[i];
      if (item) {
        const top = i * this.itemHeight;
        visibleItems.push(`
          <div class="vs-item" style="position: absolute; top: ${top}px; left: 0; right: 0; height: ${this.itemHeight}px;">
            ${this.renderItem(item, i)}
          </div>
        `);
      }
    }
    
    // 保留 spacer，更新内容
    const existingContent = this.spacer.querySelector('.vs-content');
    if (existingContent) {
      existingContent.innerHTML = visibleItems.join('');
    } else {
      this.spacer.innerHTML = `<div class="vs-content">${visibleItems.join('')}</div>`;
    }
  }
  
  /**
   * 销毁实例
   */
  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.viewport.removeEventListener('scroll', this.onScroll);
  }
}

// 导出全局
window.VirtualScroll = VirtualScroll;
