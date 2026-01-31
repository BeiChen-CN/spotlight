/**
 * 随机抽取模块
 */

const picker = {
  pickCount: 1,
  maxPickCount: 10,
  minPickCount: 1,
  animationStyle: 'slot', // 动画样式: scroll, wheel, flip, slot

  /**
   * 设置抽取人数
   */
  setPickCount(count) {
    this.pickCount = Math.max(this.minPickCount, Math.min(this.maxPickCount, count));
    document.getElementById('pick-count').textContent = this.pickCount;
  },

  /**
   * 增加抽取人数
   */
  increase() {
    this.setPickCount(this.pickCount + 1);
  },

  /**
   * 减少抽取人数
   */
  decrease() {
    this.setPickCount(this.pickCount - 1);
  },

  /**
   * 执行抽取
   */
  async pick() {
    const students = store.getStudents();
    
    if (students.length === 0) {
      app.toast(t('home.noStudents'), 'warning');
      return;
    }
    
    // 确定实际抽取人数
    const actualCount = Math.min(this.pickCount, students.length);
    
    // 随机抽取
    const pickedStudents = this.randomPick(students, actualCount);
    
    // 更新抽中次数
    for (const student of pickedStudents) {
      await store.incrementPickCount(student.id);
    }
    
    // 添加历史记录
    const currentClass = store.getCurrentClass();
    if (currentClass) {
      await store.addHistoryRecord(
        currentClass.id,
        currentClass.name,
        pickedStudents
      );
    }
    
    // 滚动动画
    const btn = document.getElementById('pick-button');
    btn.classList.add('picking');
    btn.disabled = true;
    
    // 根据动画样式播放对应动画
    const settings = store.getSettings();
    const style = settings.animationStyle || this.animationStyle;
    await this.playAnimation(students, pickedStudents, style);
    
    btn.classList.remove('picking');
    btn.disabled = false;

    // 显示结果
    await this.showResult(pickedStudents);
  },

  /**
   * 播放动画 (路由到具体动画)
   */
  async playAnimation(students, targetStudents, style) {
    switch (style) {
      case 'scroll':
        return this.playScrollAnimation(students, targetStudents);
      case 'wheel':
        return this.playWheelAnimation(students, targetStudents);
      case 'flip':
        return this.playFlipAnimation(students, targetStudents);
      case 'slot':
      default:
        return this.playRollingAnimation(students, targetStudents);
    }
  },

  /**
   * 滚动动画 - 名字快速滚动后定格 (修复版)
   */
  async playScrollAnimation(students, targetStudents) {
    console.log('Starting Scroll Animation');
    return new Promise((resolve) => {
      // 1. Create Overlay
      const overlay = document.createElement('div');
      overlay.className = 'animation-overlay';
      overlay.innerHTML = `
        <div class="scroll-animation-box">
          <div class="scroll-names"></div>
        </div>
      `;
      document.body.appendChild(overlay);
      
      const namesEl = overlay.querySelector('.scroll-names');
      let index = 0;
      const duration = 2000;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const delay = 50 + progress * 200;
        
        if (progress < 1) {
          const student = students[index % students.length];
          const name = student ? student.name : '???';
          namesEl.innerHTML = `<div class="scroll-name">${this.escapeHtml(name)}</div>`;
          index++;
          setTimeout(animate, delay);
        } else {
          try { soundManager.play('result'); } catch(e) { console.error(e); }
          namesEl.innerHTML = targetStudents.map(s => 
            `<div class="scroll-name final">${this.escapeHtml(s.name)}</div>`
          ).join('');
          
          setTimeout(() => {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            resolve();
          }, 800);
        }
      };
      
      try { soundManager.play('rolling'); } catch(e) { console.error(e); }
      animate();
    });
  },

  /**
   * 转盘动画 (修复版)
   */
  async playWheelAnimation(students, targetStudents) {
    console.log('Starting Wheel Animation');
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'animation-overlay';
      
      const count = Math.min(students.length, 12);
      const sliceAngle = 360 / count;
      
      overlay.innerHTML = `
        <div class="wheel-animation-box">
          <div class="wheel-pointer">▼</div>
          <div class="wheel">
            ${students.slice(0, count).map((s, i) => `
              <div class="wheel-slice" style="transform: rotate(${i * sliceAngle}deg); top: 0; left: 0;">
                <span>${this.escapeHtml(s.name)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      
      const wheel = overlay.querySelector('.wheel');
      
      const targetIndex = students.findIndex(s => s.id === targetStudents[0].id) % count;
      // Ensure positive rotation
      const targetAngle = 360 * 5 + (360 - targetIndex * sliceAngle - sliceAngle / 2);
      
      try { soundManager.play('rolling'); } catch(e) { console.error(e); }
      
      // Force reflow
      wheel.offsetHeight; 

      setTimeout(() => {
        wheel.style.transition = 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
        wheel.style.transform = `rotate(${targetAngle}deg)`;
      }, 50);
      
      setTimeout(() => {
        try { soundManager.play('result'); } catch(e) { console.error(e); }
        setTimeout(() => {
           if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          resolve();
        }, 800);
      }, 3200);
    });
  },

  /**
   * 卡片翻转动画 (修复版)
   */
  async playFlipAnimation(students, targetStudents) {
    console.log('Starting Flip Animation');
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'animation-overlay';
      
      if (!targetStudents || targetStudents.length === 0) {
          resolve(); return;
      }

      overlay.innerHTML = `
        <div class="flip-animation-box">
          ${targetStudents.map((s) => `
            <div class="flip-card">
              <div class="flip-card-inner">
                <div class="flip-card-front">?</div>
                <div class="flip-card-back">${this.escapeHtml(s.name)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      document.body.appendChild(overlay);
      
      const cards = overlay.querySelectorAll('.flip-card');
      
      try { soundManager.play('rolling'); } catch(e) { console.error(e); }
      
      cards.forEach((card, i) => {
        // Force reflow
        card.offsetHeight; 
        setTimeout(() => {
          console.log('Flipping card', i);
          card.classList.add('flipped');
          try { soundManager.play('result'); } catch(e) { console.error(e); }
        }, 800 + i * 400);
      });
      
      const totalTime = 800 + cards.length * 400 + 1000;
      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        resolve();
      }, totalTime);
    });
  },

  /**
   * 播放滚动动画
   */
  /**
   * 播放滚动动画 (老虎机样式)
   */
  async playRollingAnimation(students, targetStudents) {
    return new Promise((resolve) => {
      // 1. 准备配置常量
      const ITEM_HEIGHT = 64; // 对应 CSS .rolling-item height
      const SLOT_HEIGHT = 320; // 对应 CSS .rolling-slot height
      const SLOT_CENTER = SLOT_HEIGHT / 2;
      const VISIBLE_ITEMS = Math.ceil(SLOT_HEIGHT / ITEM_HEIGHT) + 2; // 可见区域多算一点用于预加载样式
      
      const slotsCount = targetStudents.length;
      
      // 2. 创建 DOM 结构
      const mask = document.createElement('div');
      mask.className = 'rolling-mask';
      
      const container = document.createElement('div');
      container.className = 'rolling-container';
      
      // 每个槽位的控制对象
      const slotControllers = [];
      
      for (let i = 0; i < slotsCount; i++) {
        // 2.1 创建槽位容器
        const slot = document.createElement('div');
        slot.className = 'rolling-slot';
        
        const track = document.createElement('div');
        track.className = 'rolling-track';
        
        // 2.2 生成名字列表 ( Track Data )
        // 结构: [20个随机] + [目标] + [3个随机(缓冲)]
        // 总长度需要足够长以产生快速滚动的视觉效果
        const rounds = 30; // 混淆轮数
        const trackData = [];
        for (let j = 0; j < rounds; j++) {
          trackData.push(students[Math.floor(Math.random() * students.length)]);
        }
        trackData.push(targetStudents[i]); // 目标 (Index = rounds)
        // 尾部缓冲，防止滚过头露底
        for (let j = 0; j < 3; j++) {
           trackData.push(students[Math.floor(Math.random() * students.length)]);
        }
        
        // 2.3 填充 DOM
        trackData.forEach(student => {
          const item = document.createElement('div');
          item.className = 'rolling-item';
          item.textContent = student.name;
          track.appendChild(item);
        });
        
        slot.appendChild(track);
        container.appendChild(slot);
        
        // 2.4 计算目标滚动位置
        // 目标索引是 rounds。想要让目标项的中心 对齐 槽位中心。
        // ItemTop = rounds * ITEM_HEIGHT
        // ItemCenter = ItemTop + ITEM_HEIGHT / 2
        // ScrollTop = ItemCenter - SLOT_CENTER
        const targetIndex = rounds;
        const totalHeight = trackData.length * ITEM_HEIGHT;
        const targetScrollY = (targetIndex * ITEM_HEIGHT) + (ITEM_HEIGHT / 2) - SLOT_CENTER;
        
        slotControllers.push({
          slot,
          track,
          items: Array.from(track.children),
          targetScrollY,
          currentScrollY: 0,
          duration: 2500 + i * 500, // 错开停止时间，增加节奏感
          startTime: null
        });
      }
      
      mask.appendChild(container);
      document.body.appendChild(mask);
      
      // 3. 动画循环
      // 自定义缓动函数 (Ease Out Quint - 冲刺后缓慢停下)
      const easeOutQuint = (x) => 1 - Math.pow(1 - x, 5);
      
      let animationFrameId; // NOT USED but keeps context
      
      // Resume Audio Context on interaction
      soundManager.getContext();

      const animate = (timestamp) => {
        let allFinished = true;
        
        slotControllers.forEach(ctrl => {
          if (!ctrl.startTime) {
             ctrl.startTime = timestamp;
             ctrl.lastIndex = 0; // Init tracker
          }
          const elapsed = timestamp - ctrl.startTime;
          const progress = Math.min(elapsed / ctrl.duration, 1);
          
          if (progress < 1) {
            allFinished = false;
            // 计算当前位置
            const eased = easeOutQuint(progress);
            ctrl.currentScrollY = ctrl.targetScrollY * eased;
            
            // Sound Trigger
            const currentIndex = Math.floor(ctrl.currentScrollY / ITEM_HEIGHT);
            if (currentIndex > ctrl.lastIndex) {
               // Limit tick frequency or volume?
               // Just play. The Web Audio can handle it.
               if (soundManager.enabled && Math.random() > 0.5) { // 50% chance to reduce chaos 
                 soundManager.playTick();
               }
               ctrl.lastIndex = currentIndex;
            }
          } else {
            ctrl.currentScrollY = ctrl.targetScrollY;
          }
          
          // 应用位移
          ctrl.track.style.transform = `translateY(-${ctrl.currentScrollY}px)`;
          
          // === 核心：Fisheye 放大效果 ===
          // 遍历可见区域附近的元素进行缩放
          // 优化：只遍历当前视口内的元素
          const startIndex = Math.floor(ctrl.currentScrollY / ITEM_HEIGHT);
          const endIndex = Math.min(ctrl.items.length - 1, startIndex + VISIBLE_ITEMS);
          
          // 预设范围：上下各 1 屏
          const renderStart = Math.max(0, startIndex - 2);
          const renderEnd = Math.min(ctrl.items.length - 1, endIndex + 2);

          for (let idx = renderStart; idx <= renderEnd; idx++) {
            const item = ctrl.items[idx];
            // 元素中心在 Track 中的 Y 坐标
            const itemCenterY = (idx * ITEM_HEIGHT) + (ITEM_HEIGHT / 2);
            // 元素相对于 视口(Slot) 顶部 的 Y 坐标
            const relativeY = itemCenterY - ctrl.currentScrollY;
            // 距离视口中心的距离
            const dist = Math.abs(relativeY - SLOT_CENTER);
            
            // 计算缩放 (距离越近越大)
            // 范围: 0px (中心) -> 120px (边缘)
            // Scale: 1.6 -> 1.0
            const maxDist = 140; // 影响范围
            let scale = 1;
            let opacity = 0.5;
            let color = 'rgba(255, 255, 255, 0.5)';
            let textShadow = 'none'; // Ensure no shadow

            if (dist < maxDist) {
              const ratio = 1 - (dist / maxDist);
              const powerRatio = Math.pow(ratio, 2); 
              
              scale = 1 + (0.6 * powerRatio); // Max scale 1.6
              opacity = 0.5 + (0.5 * powerRatio); // Max opacity 1.0
              
              if (dist < 40) {
                 // Center highlight
                 color = 'var(--primary)'; // Use theme primary
                 opacity = 1;
              }
            }
            
            item.style.transform = `scale(${scale})`;
            item.style.opacity = opacity;
            item.style.color = color;
            item.style.textShadow = textShadow;
          }
        });
        
        if (!allFinished) {
          requestAnimationFrame(animate);
        } else {
          // 4. 动画结束
          setTimeout(() => {
             // Play Win Sound
             soundManager.playWin();

             // 闪烁特效 - Flat style (Just Color/Scale)
             slotControllers.forEach(ctrl => {
               const rounds = 30;
               const winnerItem = ctrl.items[rounds];
               winnerItem.style.color = 'var(--primary)';
               winnerItem.style.fontWeight = '800';
               winnerItem.style.transition = 'all 0.1s';
               setTimeout(() => winnerItem.style.transform = 'scale(1.8)', 100);
             });
             
             // 延迟关闭
             setTimeout(() => {
               mask.style.opacity = '0';
               mask.style.transition = 'opacity 0.3s';
               setTimeout(() => {
                 mask.remove();
                 resolve();
               }, 300);
             }, 800);
          }, 100);
        }
      };
      
      requestAnimationFrame(animate);
    });
  },

  /**
   * 获取可参与抽取的学生 (过滤状态和冷却期)
   */
  getEligibleStudents(students) {
    const settings = store.getSettings();
    const fairness = settings.fairness || { weightedRandom: false, cooldownCount: 0 };
    const history = store.getHistory();
    
    // 1. 过滤掉非 active 状态的学生
    let eligible = students.filter(s => (s.status || 'active') === 'active');
    
    // 2. 冷却机制 - 最近 N 次抽取记录中的学生不参与
    if (fairness.cooldownCount > 0 && history.length > 0) {
      const recentRecords = history.slice(0, fairness.cooldownCount);
      const recentlyPickedIds = new Set();
      
      recentRecords.forEach(record => {
        record.pickedStudents.forEach(s => recentlyPickedIds.add(s.id));
      });
      
      eligible = eligible.filter(s => !recentlyPickedIds.has(s.id));
    }
    
    return eligible;
  },

  /**
   * 随机抽取算法 (支持加权随机)
   */
  randomPick(students, count) {
    const settings = store.getSettings();
    const fairness = settings.fairness || { weightedRandom: false, cooldownCount: 0 };
    
    // 获取可参与的学生
    let eligible = this.getEligibleStudents(students);
    
    // 如果可参与的学生不足，放宽限制（使用全部 active 学生）
    if (eligible.length < count) {
      eligible = students.filter(s => (s.status || 'active') === 'active');
    }
    
    // 如果还是不够，用全部学生
    if (eligible.length < count) {
      eligible = students;
    }
    
    // 加权随机
    if (fairness.weightedRandom && eligible.length > 0) {
      return this.weightedRandomPick(eligible, count);
    }
    
    // 简单随机
    const result = [];
    const shuffled = [...eligible].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < count && i < shuffled.length; i++) {
      result.push(shuffled[i]);
    }
    
    return result;
  },

  /**
   * 加权随机抽取 (被抽中次数少的权重更高)
   */
  weightedRandomPick(students, count) {
    const result = [];
    const pool = [...students];
    
    // 找出最大抽取次数
    const maxPick = Math.max(...pool.map(s => s.pickCount || 0), 1);
    
    while (result.length < count && pool.length > 0) {
      // 计算权重 (pickCount 越低权重越高)
      const weights = pool.map(s => {
        const pickCount = s.pickCount || 0;
        // 权重 = (最大次数 - 当前次数 + 1)，保证最少也有 1 的权重
        return maxPick - pickCount + 1;
      });
      
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let random = Math.random() * totalWeight;
      
      let selectedIndex = 0;
      for (let i = 0; i < weights.length; i++) {
        random -= weights[i];
        if (random <= 0) {
          selectedIndex = i;
          break;
        }
      }
      
      result.push(pool[selectedIndex]);
      pool.splice(selectedIndex, 1);
    }
    
    return result;
  },

  /**
   * 显示抽取结果
   */
  async showResult(students) {
    const resultContainer = document.getElementById('pick-result');
    const contentArea = document.getElementById('result-content-area');
    const settings = store.getSettings();
    
    // Refresh students to get latest score
    const freshStudents = students.map(s => store.getStudent(s.id) || s);
    
    const items = await Promise.all(freshStudents.map(async (student) => {
      let avatarHtml = '';
      if (settings.photoMode) {
        let photoHtml = '👤';
        if (student.photo) {
          const photoPath = await window.electronAPI.getPhotoPath(student.photo);
          photoHtml = `<img src="file://${photoPath}" alt="">`;
        }
        avatarHtml = `
          <div class="avatar avatar-xl">
            ${photoHtml}
          </div>
        `;
      }
      
      const currentScore = student.score || 0;
      
      return `
        <div class="pick-result-item" data-student-id="${student.id}">
          ${avatarHtml}
          <div class="pick-result-name">${this.escapeHtml(student.name)}</div>
          ${settings.showStudentId && student.studentId ? 
            `<div class="pick-result-id">${this.escapeHtml(student.studentId)}</div>` : ''
          }
          <div class="score-controls">
            <button class="btn-score btn-score-minus" onclick="picker.addScore('${student.id}', -1)" title="-1">−</button>
            <span class="score-display" id="score-${student.id}">${currentScore}</span>
            <button class="btn-score btn-score-plus" onclick="picker.addScore('${student.id}', 1)" title="+1">+</button>
          </div>
        </div>
      `;
    }));
    
    contentArea.innerHTML = items.join('');
    resultContainer.classList.remove('hidden');
    

  },

  /**
   * 更新学生积分
   */
  async addScore(studentId, delta) {
    const newScore = await store.updateStudentScore(studentId, delta);
    if (newScore !== null) {
      const scoreEl = document.getElementById('score-' + studentId);
      if (scoreEl) {
        scoreEl.textContent = newScore;
        // 闪烁动画
        scoreEl.classList.add('score-flash');
        setTimeout(() => scoreEl.classList.remove('score-flash'), 300);
      }
    }
  },

  /**
   * 重置结果显示
   */
  resetResult() {
    const resultContainer = document.getElementById('pick-result');
    const contentArea = document.getElementById('result-content-area');
    
    contentArea.innerHTML = '';
    resultContainer.classList.add('hidden');
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

window.picker = picker;

