/**
 * 音效管理模块
 * 使用 Web Audio API 合成音效，无需外部文件
 */

const soundManager = {
  ctx: null,
  enabled: true,

  /**
   * 初始化音频上下文
   */
  init() {
    this.loadSettings();
    // 用户交互后才能 resume AudioContext，但在 Web App 中通常在首次点击时处理
    // 我们可以懒加载
  },
  
  /**
   * 加载设置
   */
  loadSettings() {
    const settings = store.getSettings();
    // 默认开启
    this.enabled = settings.soundEnabled !== false; 
  },

  /**
   * 切换音效开关
   */
  toggle(enabled) {
    this.enabled = enabled;
    store.updateSettings({ soundEnabled: enabled });
  },

  /**
   * 获取或创建 AudioContext
   */
  getContext() {
    if (!this.enabled) return null;
    
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    return this.ctx;
  },

  /**
   * 播放滚动音效 (短促的高频机械声)
   */
  playTick() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine'; // 正弦波比较柔和
    // 随机一点音调变化增加真实感
    osc.frequency.setValueAtTime(800 + Math.random() * 200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  },

  /**
   * 播放中奖音效 (清脆的和弦)
   */
  playWin() {
    const ctx = this.getContext();
    if (!ctx) return;

    this.playNote(ctx, 523.25, 0, 0.4); // C5
    this.playNote(ctx, 659.25, 0.1, 0.4); // E5
    this.playNote(ctx, 783.99, 0.2, 0.6); // G5
    this.playNote(ctx, 1046.50, 0.3, 1.0); // C6
  },
  
  /**
   * 播放单个音符
   */
  playNote(ctx, freq, startTime, duration) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle'; // 三角波比较清脆
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

    gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + startTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + startTime);
    osc.stop(ctx.currentTime + startTime + duration);
  }
};

window.soundManager = soundManager;
