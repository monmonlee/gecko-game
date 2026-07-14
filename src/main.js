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

// QA 用：?pose=halfout&loc=hide 直接擺好指定睡姿，方便截圖對位（正常遊玩不會觸發）
{
  const qp = new URLSearchParams(location.search);
  if (qp.has('pose')) {
    document.getElementById('title').classList.add('hidden');
    document.getElementById('prologue').classList.add('hidden');
    gs.environment.lightOn = true;
    if (qp.get('loc')) gs.gecko.locationId = qp.get('loc');
    gs.gecko.currentActivity = 'sleeping';
    gs.gecko.sleepPoseId = qp.get('pose');
    if (qp.get('stage')) gs.gecko.stage = qp.get('stage');
    const l = CONFIG.locations[gs.gecko.locationId];
    if (l) { brain.x = l.x; brain.y = l.y; }
    render.setMode(gs.environment);
  }
  if (qp.get('hand')) {
    document.getElementById('title').classList.add('hidden');
    document.getElementById('prologue').classList.add('hidden');
    gs.environment.lightOn = true;
    brain.x = 150; brain.y = 210;
    render.setMode(gs.environment);
    const kind = qp.get('hand');
    const h = document.getElementById('hand');
    h.innerHTML = `<img class="hand-img" src="./hand.png" alt="">`;
    h.dataset.kind = kind;
    h.style.display = 'block';
    const ax = kind === 'palm' ? 34 : 30;
    h.style.transform = `translate(${brain.x - ax}px, ${brain.y - 54}px)`;
    if (kind === 'pet') h.classList.add('petting');
  }
  if (qp.get('petnow')) {
    document.getElementById('title').classList.add('hidden');
    document.getElementById('prologue').classList.add('hidden');
    gs.gecko.affinity = 90;
    gs.records.fullTrustShown = true;
    gs.environment.lightOn = true;
    gs.gecko.currentActivity = 'active';
    brain.set('active'); brain.sub = 'idle';
    brain.x = 160; brain.y = 202; brain.facing = qp.get('face') === 'l' ? -1 : 1;
    render.setMode(gs.environment);
    ui.refresh();
    setTimeout(() => {
      document.getElementById('btn-hand').click();
      setTimeout(() => document.getElementById('pet-mode').click(), 40);
    }, 40);
  }
  if (qp.get('oracle')) {
    document.getElementById('title').classList.add('hidden');
    document.getElementById('prologue').classList.add('hidden');
    gs.gecko.affinity = 88;
    gs.records.fullTrustShown = true;
    gs.environment.lightOn = true;
    render.setMode(gs.environment);
    ui.refresh();
    setTimeout(() => {
      document.getElementById('btn-oracle').click();
      setTimeout(() => document.getElementById('oracle-draw').click(), 60);
    }, 60);
  }
  if (qp.get('walkto')) {
    document.getElementById('title').classList.add('hidden');
    document.getElementById('prologue').classList.add('hidden');
    gs.environment.lightOn = true;
    brain.x = 120; brain.y = 214;
    brain.set('active');
    brain.walkToLoc(qp.get('walkto'), 60, 'walk');
    render.setMode(gs.environment);
  }
}

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

// 版本更新提醒：定期比對線上版本，不同就顯示「點一下更新」橫幅
if (import.meta.env.PROD) {
  const checkUpdate = async () => {
    try {
      const r = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' });
      const { v } = await r.json();
      if (v && v !== __BUILD_ID__) ui.showUpdateBanner();
    } catch (e) { /* 離線就算了 */ }
  };
  setTimeout(checkUpdate, 8000);            // 開遊戲 8 秒後查一次
  setInterval(checkUpdate, 5 * 60 * 1000);  // 之後每 5 分鐘查一次
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
