import { CONFIG } from './config.js';

// 餵食 session：蟲以緩動跟隨手指／滑鼠，守宮追蟲，夠近就撲食
export class Feeder {
  constructor(stage, brain, onChange) {
    this.stage = stage;
    this.brain = brain;
    this.onChange = onChange;
    this.active = false;
    this.startedAt = 0;
    this.wormPos = { x: 160, y: 110 };
    this.pointer = { x: 160, y: 150 };
    this.el = document.getElementById('worm');
    this._move = e => {
      const r = this.stage.getBoundingClientRect();
      const sc = r.width / CONFIG.stage.w;
      // 手機：蟲浮在手指上方一段距離，才不會被自己的指頭擋住
      const lift = e.pointerType === 'touch' ? CONFIG.feed.touchLift : 0;
      this.pointer.x = Math.max(6, Math.min(CONFIG.stage.w - 6, (e.clientX - r.left) / sc));
      this.pointer.y = Math.max(6, Math.min(CONFIG.stage.h - 6, (e.clientY - r.top) / sc - lift));
    };
  }

  start(now) {
    this.active = true;
    this.wormPos = { x: 160, y: 110 };
    this.pointer = { x: 160, y: 150 };
    this.el.style.display = 'block';
    this.stage.classList.add('feeding');
    window.addEventListener('pointermove', this._move);
    window.addEventListener('pointerdown', this._move);   // 手機上「點一下」也要能移動蟲
    this.brain.startHunt(this, now);
    this.onChange();
  }

  onCaught() { this.end(); }

  cancel() {
    this.end();
    this.brain.cancelHunt(Date.now());
  }

  end() {
    this.active = false;
    this.el.style.display = 'none';
    this.stage.classList.remove('feeding');
    window.removeEventListener('pointermove', this._move);
    window.removeEventListener('pointerdown', this._move);
    this.onChange();
  }

  update(dt) {
    if (!this.active) return;
    // 幀率無關的緩動
    const k = 1 - Math.pow(1 - CONFIG.feed.wormLerp, dt * 60);
    this.wormPos.x += (this.pointer.x - this.wormPos.x) * k;
    this.wormPos.y += (this.pointer.y - this.wormPos.y) * k;
    this.el.style.transform = `translate(${this.wormPos.x - 9}px, ${this.wormPos.y - 5}px)`;
  }
}
