import './style.css';
import { CONFIG } from './config.js';
import { initState, gs, save, tickHunger, tickWorld } from './state.js';
import * as render from './render.js';
import { Brain } from './gecko.js';
import { Feeder } from './feed.js';
import * as ui from './ui.js';

ui.preInit();                          // 先掛事件，離線結算的 toast 才收得到
const bootNow = Date.now();
const isNew = initState(bootNow);
render.initScene();

const brain = new Brain(bootNow);
const feeder = new Feeder(document.getElementById('stage'), brain, () => ui.refresh());
ui.init(brain, feeder, isNew);
render.setMode(gs.environment);

// 主迴圈
let last = performance.now();
function frame(t) {
  const dt = Math.min(0.05, (t - last) / 1000);   // 分頁背景回來時不暴衝
  last = t;
  const now = Date.now();
  feeder.update(dt);
  brain.update(dt, now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// 慢速心跳：飢餓、大便／脫皮時鐘、存檔
setInterval(() => {
  const now = Date.now();
  tickHunger(now);
  tickWorld(now);
  save(now);
}, 5000);

// PWA：離線快取＋可加入主畫面
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}
window.addEventListener('beforeunload', () => save(Date.now()));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) save(Date.now());
});

// 畫面縮放：固定 320×240 邏輯解析度，整體縮放（手機直式優先）
function fit() {
  const wrap = document.getElementById('stage-wrap');
  const stage = document.getElementById('stage');
  const availW = Math.min(window.innerWidth - 20, 560);
  const otherH = document.getElementById('hud').offsetHeight
    + document.getElementById('buttons').offsetHeight + 70;
  const availH = Math.max(160, window.innerHeight - otherH);
  const s = Math.max(1, Math.min(availW / CONFIG.stage.w, availH / CONFIG.stage.h));
  stage.style.transform = `scale(${s})`;
  wrap.style.width = CONFIG.stage.w * s + 'px';
  wrap.style.height = CONFIG.stage.h * s + 'px';
}
window.addEventListener('resize', fit);
fit();
