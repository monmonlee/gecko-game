import { gs } from './state.js';
import { CONFIG } from './config.js';
import { setDark } from './sound.js';

let geckoEl, wormEl, stageEl, poopEl, shedEl, emoteEl, worldEl, traceEl;

export function initScene() {
  stageEl = document.getElementById('stage');
  worldEl = document.getElementById('world');
  geckoEl = document.getElementById('gecko');
  wormEl = document.getElementById('worm');
  poopEl = document.getElementById('poop');
  shedEl = document.getElementById('shedskin');
  emoteEl = document.getElementById('emote');
  traceEl = document.getElementById('trace');
  geckoEl.innerHTML = geckoMarkup();
  wormEl.innerHTML = bugSVG('mealworm');
  // 家具全部用 SVG 畫（跟守宮同一套工法），看得出是什麼東西
  document.getElementById('water').innerHTML = waterSVG();
  document.getElementById('driftwood').innerHTML = driftwoodSVG();
  document.getElementById('plant').innerHTML = plantSVG();
  document.getElementById('rock').innerHTML = rockSVG();
  document.getElementById('mossbox').innerHTML = mossboxSVG();
  document.getElementById('heatmat').innerHTML = heatmatSVG();
  document.getElementById('hide').innerHTML = hideSVG();
  document.getElementById('camface').innerHTML = camfaceSVG();
  makeNoise();
  makeDust();
}

// 監視器彩蛋：發現鏡頭的超級大臉（懟到鏡頭前）
function camfaceSVG() {
  return `
<svg viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax slice">
  <!-- 大頭從下面擠進來 -->
  <ellipse cx="160" cy="235" rx="200" ry="175" fill="#C08552"/>
  <!-- 額頭深色帶＋乳白鑲邊 -->
  <path d="M-10 115 Q160 55 330 115 L330 75 Q160 15 -10 75 Z" fill="#5C3A28"/>
  <path d="M-10 115 Q160 55 330 115" stroke="#EFE3D0" stroke-width="7" fill="none"/>
  <!-- 斑點 -->
  <circle cx="60" cy="150" r="7" fill="#7A4E30"/>
  <circle cx="262" cy="146" r="6" fill="#7A4E30"/>
  <circle cx="105" cy="128" r="5" fill="#7A4E30"/>
  <circle cx="222" cy="126" r="5.5" fill="#7A4E30"/>
  <!-- 兩顆超大眼睛，直直盯著鏡頭 -->
  <g class="cam-eye">
    <circle cx="88" cy="132" r="40" fill="#EFE3D0"/>
    <circle cx="88" cy="134" r="31" fill="#241812"/>
    <circle cx="99" cy="122" r="9" fill="#fff"/>
    <circle cx="80" cy="142" r="3.5" fill="#fff" opacity=".8"/>
  </g>
  <g class="cam-eye">
    <circle cx="232" cy="132" r="40" fill="#EFE3D0"/>
    <circle cx="232" cy="134" r="31" fill="#241812"/>
    <circle cx="243" cy="122" r="9" fill="#fff"/>
    <circle cx="224" cy="142" r="3.5" fill="#fff" opacity=".8"/>
  </g>
  <!-- 鼻孔＋人中 -->
  <ellipse cx="146" cy="196" rx="5" ry="7" fill="#241812" opacity=".85"/>
  <ellipse cx="174" cy="196" rx="5" ry="7" fill="#241812" opacity=".85"/>
  <path d="M160 205 L160 222" stroke="#8a5b40" stroke-width="3" opacity=".6"/>
  <!-- 滿足的大嘴線 -->
  <path d="M42 216 Q160 252 278 216" stroke="#241812" stroke-width="5" fill="none" stroke-linecap="round"/>
  <!-- 鼻息呵在鏡頭上的霧氣 -->
  <ellipse class="fog" cx="146" cy="212" rx="26" ry="13" fill="#fff"/>
  <ellipse class="fog" cx="176" cy="214" rx="30" ry="15" fill="#fff"/>
</svg>`;
}

// ---- 家具 SVG ----
function waterSVG() {
  return `
<svg viewBox="0 0 56 22" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="28" cy="15.5" rx="27" ry="6" fill="#4a5058"/>
  <path d="M1 10 Q1 17 10 19.5 Q19 21.5 28 21.5 Q37 21.5 46 19.5 Q55 17 55 10 L55 9 L1 9 Z" fill="#7c848f"/>
  <ellipse cx="28" cy="9.5" rx="27" ry="7" fill="#98a1ac"/>
  <ellipse cx="28" cy="10" rx="22.5" ry="5.4" fill="#3f4a56"/>
  <ellipse class="water-surface" cx="28" cy="10.6" rx="20.5" ry="4.6" fill="#5fa7c7"/>
  <path d="M13 9.6 Q20 7.6 30 8.4" stroke="#cfeefb" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".85"/>
  <ellipse cx="37" cy="12" rx="4.5" ry="1.2" fill="#8fd0e8" opacity=".7"/>
  <circle cx="18" cy="12.5" r=".9" fill="#dff4fd" opacity=".8"/>
</svg>`;
}

function driftwoodSVG() {
  return `
<svg viewBox="0 0 104 30" xmlns="http://www.w3.org/2000/svg">
  <path d="M26 16 Q34 6 47 3 L49 7 Q38 10 31 18 Z" fill="#7d5a3c"/>
  <path d="M47 3 L52 1.5 L53 5 L49 7 Z" fill="#8a6647"/>
  <path d="M2 20 Q6 15 16 14.5 Q45 12.5 70 13.5 Q90 14 102 17.5 Q103 22 100 25 Q75 22 45 23 Q18 24 4 25 Q1 23 2 20 Z" fill="#6f4f34"/>
  <path d="M10 18 Q40 16 68 16.5 Q86 17 98 19.5" stroke="#573b25" stroke-width="1.2" fill="none" opacity=".7"/>
  <path d="M14 22 Q42 20.5 72 21" stroke="#573b25" stroke-width="1" fill="none" opacity=".5"/>
  <ellipse cx="100.5" cy="21" rx="2.8" ry="4" fill="#8a6647"/>
  <ellipse cx="100.5" cy="21" rx="1.4" ry="2" fill="#6f4f34"/>
  <circle cx="33" cy="19" r="2" fill="#573b25"/>
  <circle cx="33" cy="19" r=".8" fill="#3f2a1b"/>
  <path d="M12 24 L9 29.5 L14 28.5 L16 24 Z" fill="#5e422c"/>
  <path d="M78 23 L80 29.5 L85 28.5 L83 23 Z" fill="#5e422c"/>
</svg>`;
}

function plantSVG() {
  return `
<svg viewBox="0 0 40 76" xmlns="http://www.w3.org/2000/svg">
  <g class="leaves">
    <path d="M20 74 C14 56 6 40 8 18 Q9 14 12 17 C18 34 20 52 22 74 Z" fill="#4c7440"/>
    <path d="M21 74 C22 50 26 34 33 22 Q36 19 36 24 C33 40 27 56 24 74 Z" fill="#55813f"/>
    <path d="M19 74 C17 48 15 30 19 8 Q21 4 23 8 C26 30 23 52 22 74 Z" fill="#5d8a48"/>
    <path d="M20 74 C24 60 31 50 37 44 Q39 43 38 47 C33 56 26 66 23 74 Z" fill="#6c9c52"/>
    <path d="M19 74 C15 62 8 54 3 50 Q1 49 2 53 C6 60 13 68 17 74 Z" fill="#6c9c52"/>
    <path d="M20.5 70 C19 48 17.5 32 20 12" stroke="#7fb264" stroke-width="1" fill="none" opacity=".8"/>
  </g>
  <ellipse cx="20" cy="73" rx="14" ry="4" fill="#5a4630"/>
  <ellipse cx="20" cy="71.6" rx="14" ry="3" fill="#6b5138"/>
  <circle cx="13" cy="71.5" r="1" fill="#7d5f42"/>
  <circle cx="27" cy="72.5" r="1.2" fill="#7d5f42"/>
</svg>`;
}

function rockSVG() {
  return `
<svg viewBox="0 0 56 48" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="28" cy="45.5" rx="25" ry="3" fill="rgba(0,0,0,.18)"/>
  <path d="M4 48 L2 26 Q4 14 14 8 Q26 2 40 7 Q52 12 54 24 L54 48 Z" fill="#8a8378"/>
  <path d="M2 26 Q4 14 14 8 Q26 2 40 7 L36 14 Q22 10 12 18 Q6 22 6 30 Z" fill="#a29a8d"/>
  <path d="M54 24 Q52 12 40 7 L36 14 Q46 18 48 28 L54 48 L54 24 Z" fill="#6f695f"/>
  <path d="M20 24 L30 20 L42 26" stroke="#6f695f" stroke-width="1.2" fill="none" opacity=".6"/>
  <path d="M14 34 L24 31" stroke="#6f695f" stroke-width="1" fill="none" opacity=".5"/>
  <circle cx="18" cy="14" r="1.2" fill="#b7ae9f"/>
</svg>`;
}

function mossboxSVG() {
  return `
<svg viewBox="0 0 52 30" xmlns="http://www.w3.org/2000/svg">
  <circle cx="14" cy="11" r="6" fill="#4e7a3a"/>
  <circle cx="24" cy="8" r="7" fill="#5d8a48"/>
  <circle cx="36" cy="10" r="6.5" fill="#55813f"/>
  <circle cx="45" cy="13" r="4.5" fill="#4c7440"/>
  <circle cx="7" cy="14" r="4" fill="#456d35"/>
  <path d="M2 14 L50 14 L48 29 L4 29 Z" fill="#aeb6bb"/>
  <rect x="1" y="12" width="50" height="4" rx="2" fill="#c6cdd1"/>
  <path d="M10 17 L9 27 M42 17 L43 27" stroke="#98a1a6" stroke-width="1" opacity=".6"/>
  <circle cx="18" cy="14" r="3.5" fill="#5d8a48"/>
  <circle cx="31" cy="13.5" r="4" fill="#4e7a3a"/>
</svg>`;
}

// 躲避屋：洞口是「真的洞」（遮罩挖空），守宮的尾巴才能襯著黑洞露出來
function hideSVG() {
  return `
<svg viewBox="0 0 68 34" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="hide-g" cx="35%" cy="-10%" r="130%">
      <stop offset="0%" stop-color="#7d5a3e"/>
      <stop offset="52%" stop-color="#6b4a33"/>
      <stop offset="100%" stop-color="#503722"/>
    </radialGradient>
    <mask id="hide-m">
      <rect width="68" height="34" fill="#fff"/>
      <path d="M44 34 L44 23 Q44 15 52 15 Q60 15 60 23 L60 34 Z" fill="#000"/>
    </mask>
  </defs>
  <g mask="url(#hide-m)">
    <path d="M0 34 Q0 6 34 4 Q68 6 68 34 Z" fill="url(#hide-g)"/>
    <path d="M8 30 Q14 12 30 7" stroke="rgba(0,0,0,.15)" stroke-width="2" fill="none"/>
    <path d="M20 32 Q26 14 44 8" stroke="rgba(0,0,0,.12)" stroke-width="2" fill="none"/>
    <path d="M36 32 Q44 18 58 14" stroke="rgba(0,0,0,.12)" stroke-width="2" fill="none"/>
    <path d="M12 26 Q22 10 40 6" stroke="rgba(255,220,170,.09)" stroke-width="1.4" fill="none"/>
    <path d="M28 30 Q38 16 54 11" stroke="rgba(255,220,170,.07)" stroke-width="1.4" fill="none"/>
  </g>
  <path d="M44 33 L44 23 Q44 15 52 15 Q60 15 60 23 L60 33"
        stroke="rgba(255,235,200,.22)" stroke-width="1.6" fill="none"/>
</svg>`;
}

function heatmatSVG() {
  return `
<svg viewBox="0 0 62 16" xmlns="http://www.w3.org/2000/svg">
  <rect x="1" y="3" width="56" height="12" rx="6" fill="#7c4a3a"/>
  <rect x="4" y="5.5" width="50" height="7" rx="3.5" fill="none" stroke="#a05a42" stroke-width="1.6"/>
  <rect x="8" y="8" width="42" height="2.4" rx="1.2" fill="#8a5240"/>
  <path d="M57 9 Q61 9 61 5" stroke="#4a2f26" stroke-width="1.6" fill="none"/>
  <circle cx="61" cy="4" r="1.3" fill="#4a2f26"/>
</svg>`;
}

// 守宮的完整 SVG 組（側面＋所有專屬睡姿）——主畫面與拍立得共用
export function geckoMarkup() {
  return sideSVG() + Object.values(POSE_SVGS).join('');
}

// 開燈光束裡漂浮的灰塵
function makeDust() {
  const box = document.getElementById('dust');
  for (let i = 0; i < 14; i++) {
    const m = document.createElement('span');
    m.className = 'mote';
    m.style.left = 8 + Math.random() * 60 + '%';
    m.style.top = 25 + Math.random() * 62 + '%';
    m.style.animationDuration = 5 + Math.random() * 7 + 's';
    m.style.animationDelay = -Math.random() * 9 + 's';
    if (Math.random() < 0.4) m.style.transform = 'scale(.6)';
    box.appendChild(m);
  }
}

// ---- 觀察鏡：鏡頭放大並跟著守宮移動 ----
const ZOOM = 2.2;
let zoomOn = false;
const cam = { x: 160, y: 120 };

export function setZoom(v) {
  zoomOn = v;
  if (!v) worldEl.style.transform = '';
}
export function isZoom() { return zoomOn; }

function updateCamera(b) {
  if (!zoomOn) return;
  // 鏡頭緩緩跟上，不會暈
  cam.x += (b.x - cam.x) * 0.06;
  cam.y += (b.y - 14 - cam.y) * 0.06;
  const vw = CONFIG.stage.w / ZOOM, vh = CONFIG.stage.h / ZOOM;
  const cx = Math.max(vw / 2, Math.min(CONFIG.stage.w - vw / 2, cam.x));
  const cy = Math.max(vh / 2, Math.min(CONFIG.stage.h - vh / 2, cam.y));
  worldEl.style.transform =
    `scale(${ZOOM}) translate(${(vw / 2 - cx).toFixed(1)}px, ${(vh / 2 - cy).toFixed(1)}px)`;
}

export function setMode(env) {
  stageEl.classList.toggle('mode-light', env.lightOn);
  stageEl.classList.toggle('mode-dark', !env.lightOn && env.viewMode === 'normal');
  stageEl.classList.toggle('mode-nv', !env.lightOn && env.viewMode === 'nightvision');
  setDark(!env.lightOn);              // 關燈才有蟲鳴
}

// 缸內物件（大便／蛻皮）的顯示同步
export function drawWorld() {
  const env = gs.environment;
  poopEl.style.display = env.poopPresent ? 'block' : 'none';
  if (env.poopPresent) poopEl.style.left = env.poopX + 'px';
  shedEl.style.display = env.shedSkinPresent ? 'block' : 'none';
  if (env.shedSkinPresent) shedEl.style.left = env.shedX + 'px';
  // 夜間痕跡：牠在你不在時活動過的證據
  if (env.trace) {
    traceEl.className = env.trace.type;
    traceEl.style.display = 'block';
    traceEl.style.left = env.trace.x + 'px';
  } else {
    traceEl.style.display = 'none';
  }
}

// 某些睡姿需要偏移（睡屋頂上、泡水盆裡、貼玻璃…）
const POSE_OFF = {
  roof:      { dx: 4,   dy: -30 },
  halfout:   { dx: 40,  dy: 0 },   // 上半身探出窩外
  hide_tail: { dx: 18,  dy: 2 },   // 頭朝屋內，尾巴留在洞口
  soak:      { dx: 16,  dy: 4 },
  glass:     { dx: -6,  dy: 2 },
  headstand: { dx: -4,  dy: 2 },
  draped:    { dx: 0,   dy: 6 },   // 掛在流木高度
  standlean: { dx: -20, dy: 40 },  // 腳踩地、背靠岩石側面
};

export function drawGecko(b) {
  const g = gs.gecko;
  const act = g.currentActivity;
  const tier = g.affinity < 50;
  const walking =
    (act === 'active' && ['walk', 'bedtime', 'surf_go', 'zoom'].includes(b.sub)) ||
    (act === 'hiding' && b.sub === 'retreat') ||
    (act === 'hunting' && b.sub !== 'pounce' && b.sub !== 'crouch');
  const running =
    (act === 'active' && b.sub === 'zoom') ||
    (act === 'hunting' && b.sub === 'pounce') ||
    (act === 'hiding' && b.sub === 'retreat' && b.speed > 70);

  const cls = ['gk', 'sprite'];
  let ox = 0, oy = 0;
  if (act === 'sleeping') {
    cls.push('eyes-closed', 'pose-' + g.sleepPoseId);
    const o = POSE_OFF[g.sleepPoseId];
    if (o) { ox = o.dx; oy = o.dy; }
  }
  if (act === 'frozen') cls.push('state-frozen');
  if (walking) cls.push('walking');
  if (running) cls.push('running');
  if (act === 'active' && b.sub === 'drink') cls.push('drinking');
  if (act === 'active' && ['rest', 'lookout', 'stretch', 'dig', 'hop', 'surf', 'beg'].includes(b.sub)) {
    cls.push('act-' + b.sub);          // 日常行為：坐下／張望／伸懶腰／挖沙／彈跳／爬玻璃
  }
  if (act === 'hunting') {
    cls.push('hunt-focus');                      // 獵人鎖定眼：瞳孔縮成細線
    if (b.sub === 'pounce') cls.push('mouth-wide');
    if (b.sub === 'crouch') cls.push('crouch');  // 撲食前壓低蓄力
  }
  if (g.isShedding) cls.push('shedding');
  if (act === 'petted') {
    if (b.sub === 'happy') cls.push('pet-happy');
    if (b.sub === 'sniff') cls.push('sniffing');
    if (b.sub === 'onhand') cls.push('onhand');
    if (['palm_go', 'climb', 'walkoff'].includes(b.sub)) cls.push('walking');
    if (b.sub === 'dodge') cls.push('walking', 'running');
  }
  if (b.micro && Date.now() < b.micro.until) cls.push('micro-' + b.micro.id);
  if (tier && (act === 'active' || act === 'frozen')) cls.push('mood-low');   // 陌生／警戒期的冷淡眼神
  cls.push('stage-' + g.stage);       // 幼體色調對比較高
  geckoEl.className = cls.join(' ');
  // 窩系睡姿的方向固定：半身出窩頭朝外、窩裡露尾頭朝內（洞口在右邊）
  const face = act === 'sleeping' && g.sleepPoseId === 'halfout' ? 1
             : act === 'sleeping' && g.sleepPoseId === 'hide_tail' ? -1
             : b.facing;
  const sz = SIZE[g.stage] ?? 1;      // 幼體小小一隻，養大才變大
  // 轉身時輕輕「壓扁→彈開」，不會瞬間翻面
  if (face !== lastFace) { lastFace = face; turnAt = performance.now(); }
  const tp = Math.min(1, (performance.now() - turnAt) / 140);
  const fx = 0.3 + 0.7 * tp;
  geckoEl.style.transform =
    `translate(${(b.x - 32 + ox).toFixed(1)}px, ${(b.y - 62 + oy).toFixed(1)}px) scale(${(sz * face * fx).toFixed(3)}, ${sz})`;

  drawEmote(b, act, sz);
  updateCamera(b);
}

// 成長階段的體型（以真實天數換算）
const SIZE = { juvenile: 0.62, subadult: 0.8, adult: 1 };
let lastFace = 1, turnAt = 0;         // 轉身過渡動畫的狀態

// 頭頂心情小圖示
function drawEmote(b, act, sz = 1) {
  let e = '';
  if (act === 'sleeping') e = '💤';
  if (act === 'frozen' || (act === 'petted' && b.sub === 'dodge')) e = '❗';
  if (act === 'petted' && (b.sub === 'palm_go' || b.sub === 'sniff')) e = '❓';
  if (act === 'petted' && (b.sub === 'happy' || b.sub === 'onhand')) e = '❤️';
  emoteEl.textContent = e;
  emoteEl.style.display = e ? 'block' : 'none';
  if (e) emoteEl.style.transform = `translate(${(b.x + 8 * sz).toFixed(0)}px, ${(b.y - 38 - 28 * sz).toFixed(0)}px)`;
}

// 圖鑑縮圖：專屬睡姿用專屬圖，其餘用側面圖
export function poseThumb(poseId) {
  return POSE_SVGS[poseId] ?? sideSVG(true);
}

// ---- 拍立得匯出：把照片狀態組成獨立 SVG（內嵌必要樣式，給 canvas 轉圖用） ----
const EXPORT_CSS = `
  svg.pv{display:block;overflow:visible}
  .eye-lid,.eye-happy,.eye-flat,.eye-heart,.mouth-open,.t-blep,.t-lick,.t-lips,.d-wink-open{display:none}
  .eyes-closed .eye{display:none}.eyes-closed .eye-lid{display:block}
  .pet-happy .eye{display:none}.pet-happy .eye-happy{display:block}
  .onhand .pupil{display:none}.onhand .eye-heart{display:block}
  .mood-low .eye-flat{display:block}
  .hunt-focus .pupil{transform:scaleX(.32);transform-box:fill-box;transform-origin:center}
  .mouth-wide .mouth,.micro-yawn .mouth{display:none}
  .mouth-wide .mouth-open,.micro-yawn .mouth-open{display:block}
  .micro-yawn .eye{display:none}.micro-yawn .eye-lid{display:block}
  .micro-blep .t-blep,.pose-blep_sleep .t-blep{display:block}
  .micro-eyelick .t-lick{display:block}
  .micro-lick_lips .t-lips{display:block}
  .micro-wink .eye{display:block}.micro-wink .eye-lid{display:none}
  .micro-wink .d-wink-open{display:block}.micro-wink .d-wink-lid{display:none}
  .shedding svg.pv{filter:brightness(1.45) saturate(.45) contrast(.92)}
  .pose-curl .gecko-svg{transform:scaleY(.85) scaleX(.9)}
  .pose-flat .gecko-svg{transform:scaleY(.72) scaleX(1.08)}
  .pose-hide_tail .gecko-svg{transform:scaleY(.9)}
  .pose-halfout .gecko-svg{transform:scaleY(.88)}
  .pose-blep_sleep .gecko-svg{transform:scaleY(.8)}
  .pose-perch .gecko-svg{transform:scaleY(.8)}
  .pose-moss .gecko-svg{transform:scaleY(.82) scaleX(.88)}
  .pose-belly .gecko-svg{transform:scaleY(.68) scaleX(1.06)}
  .pose-leaf .gecko-svg{transform:scaleY(.85) scaleX(.9)}
  .pose-roof .gecko-svg{transform:scaleY(.82)}
`;

export function exportSVGString(cls, facing = 1) {
  const m = cls.match(/pose-([a-z_]+)/);
  const own = m && POSE_SVGS[m[1]];
  let body = own || sideSVG(true);
  if (facing < 0) body = `<g transform="translate(64,0) scale(-1,1)">${body}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 64 64" class="${cls}">` +
    `<style>${EXPORT_CSS}</style>${body}</svg>`;
}

/* =====================================================================
   佔位圖形：肥尾守宮（依 spec §5.0 外觀參考）
   PNG sprite 完成後改為 <img> fallback 機制，逐張替換
   共用色盤：深棕 #5C3A28 / 焦糖 #C08552 / 乳白 #EFE3D0 /
             粉膚 #D9A98F / 近黑 #241812 / 斑點 #7A4E30
===================================================================== */

// ---- 側面圖（走路、互動、大部分睡姿的基礎） ----
// 尾巴獨立成 .tail 群組：走路時左右搖、睡覺時隨呼吸微動
function sideSVG(thumb = false) {
  const sfx = thumb ? '-t' : '';
  return `
<svg class="gecko-svg pv pv-side${thumb ? ' thumb-side' : ''}" viewBox="0 0 64 32" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="gkt${sfx}">
      <ellipse cx="12" cy="20.5" rx="11.5" ry="6"/>
    </clipPath>
    <clipPath id="gkb${sfx}">
      <ellipse cx="31" cy="19" rx="13.5" ry="8.5"/>
      <ellipse cx="48.5" cy="15.5" rx="10" ry="7.2"/>
    </clipPath>
  </defs>

  <!-- 遠側腳 -->
  <rect class="leg leg-b2" x="22.5" y="20" width="3.4" height="9" rx="1.7" fill="#c08e75"/>
  <rect class="leg leg-f2" x="40.5" y="19" width="3.4" height="9" rx="1.7" fill="#c08e75"/>

  <!-- 肥尾巴（獨立擺動） -->
  <g class="tail">
    <g clip-path="url(#gkt${sfx})">
      <rect x="0" y="0" width="26" height="32" fill="#C08552"/>
      <rect x="3"    y="0" width="6"   height="32" fill="#5C3A28"/>
      <rect x="9"    y="0" width="1.2" height="32" fill="#EFE3D0"/>
      <rect x="17"   y="0" width="1.2" height="32" fill="#EFE3D0"/>
      <rect x="18.2" y="0" width="7"   height="32" fill="#5C3A28"/>
      <rect x="0" y="24.5" width="26" height="7.5" fill="#D9A98F"/>
      <circle cx="13" cy="18" r="0.8" fill="#7A4E30"/>
      <circle cx="12" cy="22" r="0.7" fill="#7A4E30"/>
    </g>
  </g>

  <g class="body-group">
    <g clip-path="url(#gkb${sfx})">
      <rect x="0" y="0" width="64" height="32" fill="#C08552"/>
      <rect x="17"   y="0" width="1.2" height="32" fill="#EFE3D0"/>
      <rect x="18.2" y="0" width="7"   height="32" fill="#5C3A28"/>
      <rect x="25.2" y="0" width="1.2" height="32" fill="#EFE3D0"/>
      <rect x="33"   y="0" width="1.2" height="32" fill="#EFE3D0"/>
      <rect x="34.2" y="0" width="7.5" height="32" fill="#5C3A28"/>
      <rect x="41.7" y="0" width="1.2" height="32" fill="#EFE3D0"/>
      <ellipse cx="47" cy="9.5" rx="7.5" ry="3.6" fill="#5C3A28"/>
      <rect x="0" y="24.5" width="64" height="7.5" fill="#D9A98F"/>
      <circle cx="29" cy="15"   r="0.9" fill="#7A4E30"/>
      <circle cx="31" cy="20.5" r="0.7" fill="#7A4E30"/>
      <circle cx="45" cy="13"   r="0.8" fill="#7A4E30"/>
      <circle cx="52" cy="19"   r="0.7" fill="#7A4E30"/>
    </g>

    <!-- 眼睛：乳白眼圈＋黑棕大眼（最重要的辨識特徵） -->
    <g class="eye">
      <circle cx="50.5" cy="14" r="3.3" fill="#EFE3D0"/>
      <circle class="pupil" cx="50.5" cy="14" r="2.4" fill="#241812"/>
      <path class="eye-heart" d="M50.5 13 c-1.3-1.5 -3.4 .3 -1.7 2 l1.7 1.6 1.7 -1.6 c1.7 -1.7 -.4 -3.5 -1.7 -2 Z" fill="#e0575f"/>
      <circle cx="51.3" cy="13.1" r="0.7" fill="#fff" opacity="0.9"/>
      <path class="eye-flat" d="M47.4 12.4 L53.6 12.4" stroke="#241812" stroke-width="1.1" stroke-linecap="round"/>
    </g>
    <path class="eye-lid" d="M47.5 14.5 Q50.5 17 53.5 14.5" stroke="#241812" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <path class="eye-happy" d="M47.5 14.8 Q50.5 11.6 53.5 14.8" stroke="#241812" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    <circle cx="55.8" cy="13.6" r="0.7" fill="#c96a5f"/>

    <!-- 嘴巴：閉／張大／舌頭三件組 -->
    <path class="mouth" d="M57 17.5 Q53.5 19 50 18.3" stroke="#8a5b40" stroke-width="0.7" fill="none" opacity="0.6"/>
    <path class="mouth-open" d="M57.2 16.6 Q53 17.2 50.6 17 Q51.4 21.2 55 20.8 Q56.8 19.2 57.2 16.6 Z" fill="#8a4a44"/>
    <ellipse class="t-blep" cx="57" cy="18.6" rx="1.5" ry="1.1" fill="#e8918a"/>
    <path class="t-lick" d="M55.5 17.8 Q53.4 16.4 52.2 14.6" stroke="#e8918a" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path class="t-lips" d="M54 18.8 Q56.5 19.4 57.4 17.6" stroke="#e8918a" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  </g>

  <!-- 近側腳 -->
  <rect class="leg leg-b1" x="24.5" y="20.5" width="3.6" height="9.5" rx="1.8" fill="#D9A98F" stroke="#b98d72" stroke-width="0.4"/>
  <rect class="leg leg-f1" x="42.5" y="19.5" width="3.6" height="9.5" rx="1.8" fill="#D9A98F" stroke="#b98d72" stroke-width="0.4"/>
</svg>`;
}

// ---- 專屬睡姿圖（viewBox 64×64，底部貼地） ----
const POSE_SVGS = {
  donut: `
<svg class="pv pv-donut" viewBox="0 0 64 64">
  <g class="breathe-g">
    <ellipse cx="32" cy="47" rx="19" ry="14" fill="#C08552"/>
    <path d="M15 45 a17 12 0 0 1 9 -10" stroke="#5C3A28" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M49 45 a17 12 0 0 0 -7 -11" stroke="#5C3A28" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M22 57 a19 13 0 0 0 20 0" stroke="#5C3A28" stroke-width="5" fill="none" stroke-linecap="round"/>
    <!-- 肥尾繞一圈碰到鼻尖 -->
    <path d="M46 53 Q57 46 50 37 Q45 31 37 33" stroke="#C08552" stroke-width="7.5" stroke-linecap="round" fill="none"/>
    <path d="M49 49 Q53 44 49 39" stroke="#5C3A28" stroke-width="7.5" fill="none" stroke-linecap="round"/>
    <!-- 頭面向玩家：兩顆眼睛，一睜一閉的家 -->
    <ellipse cx="29" cy="39" rx="10.5" ry="8.5" fill="#C08552"/>
    <ellipse cx="29" cy="34.5" rx="8.5" ry="4" fill="#5C3A28"/>
    <path class="d-wink-lid" d="M23 41 q2.6 2.2 5.2 0" stroke="#241812" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <g class="d-wink-open">
      <circle cx="25.6" cy="41" r="2.8" fill="#EFE3D0"/>
      <circle cx="25.6" cy="41" r="2" fill="#241812"/>
      <circle cx="26.3" cy="40.3" r="0.6" fill="#fff"/>
    </g>
    <path d="M31.8 41 q2.6 2.2 5.2 0" stroke="#241812" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <circle cx="27.6" cy="45.4" r="0.5" fill="#241812" opacity=".7"/>
    <circle cx="30.4" cy="45.4" r="0.5" fill="#241812" opacity=".7"/>
  </g>
</svg>`,

  tailmask: `
<svg class="pv pv-tailmask" viewBox="0 0 64 64">
  <g class="breathe-g">
    <ellipse cx="28" cy="53" rx="17" ry="8.5" fill="#C08552"/>
    <rect x="17" y="45" width="6" height="17" fill="#5C3A28" clip-path="none" opacity=".85" rx="3"/>
    <rect x="31" y="45" width="6" height="17" fill="#5C3A28" opacity=".85" rx="3"/>
    <ellipse cx="45" cy="50" rx="9.5" ry="7.5" fill="#C08552"/>
    <ellipse cx="46" cy="46" rx="7.5" ry="3.4" fill="#5C3A28"/>
    <!-- 肥尾從後面繞過來蓋住眼睛 -->
    <path d="M13 52 Q4 42 18 37 Q36 30 49 44" stroke="#C08552" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M20 38.5 Q30 34 42 40" stroke="#5C3A28" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M46 42 Q50 44 51 47" stroke="#D9A98F" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M53 54 Q50 55.5 47 55" stroke="#8a5b40" stroke-width="0.7" fill="none" opacity=".6"/>
  </g>
</svg>`,

  chinrest: `
<svg class="pv pv-chinrest" viewBox="0 0 64 64">
  <g class="breathe-g">
    <ellipse cx="26" cy="54" rx="16" ry="8" fill="#C08552"/>
    <rect x="14" y="46" width="5.5" height="16" fill="#5C3A28" opacity=".85" rx="2.7"/>
    <rect x="28" y="46" width="5.5" height="16" fill="#5C3A28" opacity=".85" rx="2.7"/>
    <path d="M11 55 Q2 52 4 46" stroke="#C08552" stroke-width="7" fill="none" stroke-linecap="round"/>
    <!-- 枕頭小石頭 -->
    <ellipse cx="48" cy="57" rx="8" ry="4.5" fill="#8a8378"/>
    <ellipse cx="48" cy="55.6" rx="8" ry="3" fill="#a29a8d"/>
    <!-- 頭枕上去 -->
    <ellipse cx="46" cy="50" rx="9" ry="6.5" fill="#C08552"/>
    <ellipse cx="47" cy="46.5" rx="7" ry="3" fill="#5C3A28"/>
    <path d="M49 51 Q52 53.4 55 51" stroke="#241812" stroke-width="1.2" fill="none" stroke-linecap="round"/>
  </g>
</svg>`,

  soak: `
<svg class="pv pv-soak" viewBox="0 0 64 64">
  <g class="breathe-g">
    <path d="M14 54 Q22 40 36 46" stroke="#C08552" stroke-width="10" fill="none" stroke-linecap="round"/>
    <ellipse cx="44" cy="47" rx="9" ry="7" fill="#C08552"/>
    <ellipse cx="45" cy="43.5" rx="7" ry="3.2" fill="#5C3A28"/>
    <path d="M47 47.5 Q50 49.8 53 47.5" stroke="#241812" stroke-width="1.2" fill="none" stroke-linecap="round"/>
  </g>
  <!-- 水面（蓋在身體前面才有泡著的感覺） -->
  <ellipse cx="30" cy="56" rx="24" ry="7" fill="#7fb7cf" opacity=".72"/>
  <path d="M12 54 Q18 52.6 24 54" stroke="#dff0f8" stroke-width="1" fill="none" opacity=".8"/>
  <path d="M34 57 Q40 55.6 46 57" stroke="#dff0f8" stroke-width="1" fill="none" opacity=".8"/>
  <path d="M52 40 q2 -3 0 -6" stroke="#dff0f8" stroke-width="1.2" fill="none" opacity=".55"/>
</svg>`,

  draped: `
<svg class="pv pv-draped" viewBox="0 0 64 64">
  <g class="breathe-g">
    <!-- 掛在流木上：拱起的身體、四腳與尾巴垂下來 -->
    <path d="M16 46 Q32 30 48 45" stroke="#C08552" stroke-width="13" fill="none" stroke-linecap="round"/>
    <path d="M24 38.5 Q32 33.5 40 38" stroke="#5C3A28" stroke-width="13" fill="none" stroke-linecap="round"/>
    <rect x="21" y="44" width="3.4" height="12" rx="1.7" fill="#D9A98F"/>
    <rect x="27" y="41" width="3.4" height="13" rx="1.7" fill="#c08e75"/>
    <rect x="35" y="41" width="3.4" height="13" rx="1.7" fill="#c08e75"/>
    <rect x="41" y="44" width="3.4" height="12" rx="1.7" fill="#D9A98F"/>
    <path d="M16 46 Q12 55 15 61" stroke="#C08552" stroke-width="6.5" fill="none" stroke-linecap="round"/>
    <!-- 頭垂在另一邊 -->
    <ellipse cx="51" cy="50" rx="8" ry="6.5" fill="#C08552"/>
    <ellipse cx="52" cy="46.6" rx="6" ry="2.8" fill="#5C3A28"/>
    <path d="M53 51 Q55.6 53 58 51" stroke="#241812" stroke-width="1.1" fill="none" stroke-linecap="round"/>
  </g>
</svg>`,

  standlean: `
<svg class="pv pv-standlean" viewBox="0 0 64 64">
  <g class="breathe-g">
    <!-- 靠著岩石站著睡：身體直立微傾 -->
    <ellipse cx="38" cy="43" rx="8.5" ry="17" fill="#C08552" transform="rotate(-10 38 43)"/>
    <path d="M31 36 Q38 32 45 37" stroke="#5C3A28" stroke-width="5.5" fill="none" stroke-linecap="round"/>
    <path d="M30 46 Q38 42 46 47" stroke="#5C3A28" stroke-width="5.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="34" cy="24" rx="8" ry="7" fill="#C08552" transform="rotate(-14 34 24)"/>
    <ellipse cx="33" cy="20.5" rx="6.4" ry="3" fill="#5C3A28" transform="rotate(-14 33 20.5)"/>
    <path d="M28.5 25.5 Q31 27.8 34 25.8" stroke="#241812" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <!-- 垂下來的前腳＋著地後腳 -->
    <rect x="29" y="30" width="3.2" height="11" rx="1.6" fill="#D9A98F" transform="rotate(6 29 30)"/>
    <rect x="34" y="56" width="10" height="4" rx="2" fill="#D9A98F"/>
    <path d="M44 56 Q52 58 56 63" stroke="#C08552" stroke-width="6" fill="none" stroke-linecap="round"/>
  </g>
</svg>`,

  buttup: `
<svg class="pv pv-buttup" viewBox="0 0 64 64">
  <g class="breathe-g">
    <!-- 頭埋進苔蘚，屁股和肥尾朝天 -->
    <ellipse cx="30" cy="50" rx="13" ry="10" fill="#C08552"/>
    <path d="M20 46 Q30 40 40 46" stroke="#5C3A28" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M36 44 Q46 32 38 25 Q33 21 28 26" stroke="#C08552" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M41 34 Q43 29 39 26" stroke="#5C3A28" stroke-width="8" fill="none" stroke-linecap="round"/>
    <rect x="20" y="52" width="3.6" height="9" rx="1.8" fill="#D9A98F"/>
    <rect x="37" y="52" width="3.6" height="9" rx="1.8" fill="#D9A98F"/>
    <!-- 埋著頭的苔蘚堆 -->
    <ellipse cx="16" cy="57" rx="10" ry="5.5" fill="#4e7a3a"/>
    <ellipse cx="12" cy="54" rx="5" ry="3" fill="#5d8a48"/>
    <ellipse cx="21" cy="54.4" rx="4" ry="2.6" fill="#5d8a48"/>
  </g>
</svg>`,

  glass: `
<svg class="pv pv-glass" viewBox="0 0 64 64">
  <g class="breathe-g">
    <!-- 貼玻璃睡：從缸外看的肚皮視角 ⭐ -->
    <ellipse cx="36" cy="38" rx="12" ry="17" fill="#C08552"/>
    <ellipse cx="36" cy="38" rx="8" ry="13.5" fill="#D9A98F"/>
    <ellipse cx="36" cy="38" rx="5.5" ry="10" fill="#EAC3AB"/>
    <!-- 壓扁的臉頰＋兩顆閉眼 -->
    <ellipse cx="36" cy="17.5" rx="10" ry="7.5" fill="#C08552"/>
    <ellipse cx="36" cy="19" rx="7" ry="4.6" fill="#D9A98F"/>
    <path d="M29 16.5 q2.6 2.4 5.2 0" stroke="#241812" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <path d="M37.8 16.5 q2.6 2.4 5.2 0" stroke="#241812" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <circle cx="34.4" cy="21.6" r="0.55" fill="#241812" opacity=".7"/>
    <circle cx="37.6" cy="21.6" r="0.55" fill="#241812" opacity=".7"/>
    <!-- 四隻腳攤開、小圓趾頭壓在玻璃上 -->
    <g fill="#D9A98F">
      <path d="M25 27 Q19 24 16 20" stroke="#D9A98F" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M47 27 Q53 24 56 20" stroke="#D9A98F" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M26 49 Q20 52 17 56" stroke="#D9A98F" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <path d="M46 49 Q52 52 55 56" stroke="#D9A98F" stroke-width="4.5" fill="none" stroke-linecap="round"/>
    </g>
    <g fill="#EAC3AB">
      <circle cx="14.5" cy="18" r="1.6"/><circle cx="17.5" cy="16.6" r="1.6"/><circle cx="20" cy="18.6" r="1.5"/>
      <circle cx="57.5" cy="18" r="1.6"/><circle cx="54.5" cy="16.6" r="1.6"/><circle cx="52" cy="18.6" r="1.5"/>
      <circle cx="15" cy="58" r="1.7"/><circle cx="18.4" cy="59.4" r="1.7"/><circle cx="21.4" cy="57.6" r="1.6"/>
      <circle cx="57" cy="58" r="1.7"/><circle cx="53.6" cy="59.4" r="1.7"/><circle cx="50.6" cy="57.6" r="1.6"/>
    </g>
    <!-- 肥尾垂在旁邊 -->
    <path d="M36 54 Q34 62 27 62" stroke="#C08552" stroke-width="6.5" fill="none" stroke-linecap="round"/>
    <path d="M32.5 60 Q30 61.8 28 61.8" stroke="#5C3A28" stroke-width="6.5" fill="none" stroke-linecap="round"/>
  </g>
</svg>`,

  headstand: `
<svg class="pv pv-headstand" viewBox="0 0 64 64">
  <g class="breathe-g">
    <!-- 角落倒栽蔥：頭抵著角落、尾巴翹到玻璃上 -->
    <ellipse cx="40" cy="40" rx="8.5" ry="16" fill="#C08552" transform="rotate(32 40 40)"/>
    <path d="M31 34 Q39 28 47 35" stroke="#5C3A28" stroke-width="5.5" fill="none" stroke-linecap="round"/>
    <path d="M34 46 Q42 40 50 47" stroke="#5C3A28" stroke-width="5.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="52" cy="53" rx="8" ry="6.8" fill="#C08552" transform="rotate(40 52 53)"/>
    <path d="M48 57.5 Q51.5 59.5 54.5 57" stroke="#241812" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <path d="M31 27 Q26 14 34 8" stroke="#C08552" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M28.5 19 Q28 13 32.5 9.5" stroke="#5C3A28" stroke-width="7" fill="none" stroke-linecap="round"/>
    <rect x="30" y="44" width="3.2" height="10" rx="1.6" fill="#D9A98F" transform="rotate(18 30 44)"/>
    <rect x="44" y="30" width="3.2" height="10" rx="1.6" fill="#D9A98F" transform="rotate(-30 44 30)"/>
  </g>
</svg>`,

  open: `
<svg class="pv pv-open" viewBox="0 0 64 64">
  <g class="breathe-g">
    <!-- 大字睡：從上面看，四肢大攤開（信任的證明） -->
    <ellipse cx="32" cy="38" rx="10.5" ry="15" fill="#C08552"/>
    <rect x="22" y="30" width="20" height="5" fill="#5C3A28" rx="2.5"/>
    <rect x="22" y="41" width="20" height="5" fill="#5C3A28" rx="2.5"/>
    <rect x="22" y="36.2" width="20" height="1" fill="#EFE3D0" rx=".5"/>
    <rect x="22" y="47.2" width="20" height="1" fill="#EFE3D0" rx=".5"/>
    <ellipse cx="32" cy="19" rx="8.5" ry="7.5" fill="#C08552"/>
    <ellipse cx="32" cy="15.5" rx="6.5" ry="3" fill="#5C3A28"/>
    <path d="M26.5 19.5 q2.4 2 4.8 0" stroke="#241812" stroke-width="1.1" fill="none" stroke-linecap="round"/>
    <path d="M32.7 19.5 q2.4 2 4.8 0" stroke="#241812" stroke-width="1.1" fill="none" stroke-linecap="round"/>
    <!-- 四肢 45° 大攤開 -->
    <path d="M24 28 Q17 24 14 18" stroke="#D9A98F" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M40 28 Q47 24 50 18" stroke="#D9A98F" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M24 48 Q17 52 14 58" stroke="#D9A98F" stroke-width="4.5" fill="none" stroke-linecap="round"/>
    <path d="M40 48 Q47 52 50 58" stroke="#D9A98F" stroke-width="4.5" fill="none" stroke-linecap="round"/>
    <path d="M32 52 Q32 60 30 63" stroke="#C08552" stroke-width="6" fill="none" stroke-linecap="round"/>
  </g>
</svg>`,

  bellyup: `
<svg class="pv pv-bellyup" viewBox="0 0 64 64">
  <g class="breathe-g">
    <!-- 翻肚睡：四腳朝天露出粉紅肚肚（傳說級的安心） -->
    <ellipse cx="30" cy="53" rx="16" ry="8.5" fill="#D9A98F"/>
    <path d="M14 56 Q30 62.5 46 56" stroke="#C08552" stroke-width="5" fill="none"/>
    <ellipse cx="30" cy="51" rx="10" ry="4.5" fill="#EAC3AB"/>
    <!-- 四腳朝天彎彎的 -->
    <path d="M20 47 q-1 -6 3 -8" stroke="#D9A98F" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <path d="M27 45 q0 -6 3.5 -7.5" stroke="#D9A98F" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <path d="M35 45 q0 -6 3.5 -7.5" stroke="#D9A98F" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <path d="M42 47 q1 -6 4 -7" stroke="#D9A98F" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <!-- 頭往後仰 -->
    <ellipse cx="49" cy="54" rx="8" ry="6.5" fill="#C08552" transform="rotate(14 49 54)"/>
    <ellipse cx="50" cy="57" rx="6" ry="2.6" fill="#D9A98F" transform="rotate(14 50 57)"/>
    <path d="M51 51.5 Q54 49.8 56.5 51.6" stroke="#241812" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <!-- 尾巴軟軟捲在旁邊 -->
    <path d="M14 53 Q6 50 8 42 Q9 38 14 39" stroke="#C08552" stroke-width="6.5" fill="none" stroke-linecap="round"/>
    <path d="M8.5 47 Q8 42 12 40.5" stroke="#5C3A28" stroke-width="6.5" fill="none" stroke-linecap="round"/>
  </g>
</svg>`,
};

// ---- 四種蟲蟲 ----
function cricketSVG(body, head, leg, eye) {
  return `
<svg viewBox="0 0 24 15" xmlns="http://www.w3.org/2000/svg">
  <g class="wiggle">
    <path d="M9 9 L4.5 3.5 L6 2.8 L11 8 Z" fill="${head}"/>
    <path d="M4.5 3.5 L2.5 9" stroke="${head}" stroke-width="1.3" fill="none"/>
    <ellipse cx="13" cy="9.5" rx="7" ry="3.4" fill="${body}"/>
    <ellipse cx="17.5" cy="8.6" rx="3" ry="2.4" fill="${head}"/>
    <path d="M7 9 Q12 7.4 16 8.4" stroke="${leg}" stroke-width=".8" fill="none" opacity=".8"/>
    <path d="M19.5 7.2 Q22 4 23 2" stroke="${head}" stroke-width=".8" fill="none"/>
    <path d="M19 8.2 Q22 6.5 23 5" stroke="${head}" stroke-width=".8" fill="none"/>
    <circle cx="18.6" cy="8" r=".8" fill="${eye}"/>
    <path d="M14 12 L13 14.5 M16.5 12 L17 14.5" stroke="${leg}" stroke-width=".9"/>
  </g>
</svg>`;
}

const BUG_SVGS = {
  mealworm: `
<svg viewBox="0 0 20 12" xmlns="http://www.w3.org/2000/svg">
  <g class="wiggle">
    <circle cx="4.5"  cy="7"   r="2.6" fill="#e0b36a"/>
    <circle cx="9"    cy="5.6" r="2.8" fill="#d3a355"/>
    <circle cx="14"   cy="6.6" r="3"   fill="#c19048"/>
    <path d="M6.8 5.4 L6.8 8.6 M11.4 4.4 L11.4 7.6" stroke="#a87c3c" stroke-width=".7" opacity=".7"/>
    <circle cx="15.4" cy="5.8" r=".55" fill="#241812"/>
  </g>
</svg>`,
  black_cricket: cricketSVG('#3d3733', '#2a2624', '#241f1c', '#0f0d0c'),
  white_cricket: cricketSVG('#e8dcc8', '#d4c2a2', '#c0ac88', '#241812'),
  pellets: `
<svg viewBox="0 0 22 13" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="5"  cy="8"  rx="2.6" ry="2" fill="#8a6a42"/>
  <ellipse cx="11" cy="6"  rx="2.8" ry="2.1" fill="#9c7a4e"/>
  <ellipse cx="16.5" cy="8.5" rx="2.6" ry="2" fill="#7d5e3a"/>
  <ellipse cx="8"  cy="10.5" rx="2.4" ry="1.9" fill="#8f6f46"/>
  <ellipse cx="14" cy="10.8" rx="2.5" ry="1.9" fill="#86663e"/>
  <circle cx="10.4" cy="5.4" r=".7" fill="#b99664" opacity=".8"/>
  <circle cx="4.4" cy="7.4" r=".6" fill="#b99664" opacity=".7"/>
</svg>`,
  paste: `
<svg viewBox="0 0 22 13" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="11" cy="11" rx="9.5" ry="2" fill="rgba(0,0,0,.15)"/>
  <path d="M3 11 Q3 7 7 6.5 Q6 4 9.5 4 Q10.5 1.5 13 3 Q16 2.5 16 5.5 Q19.5 6 19 9 Q19.5 11 17 11.5 Q11 12.5 5 11.5 Q3 11.5 3 11 Z" fill="#b56a56"/>
  <path d="M6 7.5 Q9 6 13 6.8 Q16 7.4 17 9" stroke="#9c5343" stroke-width="1" fill="none" opacity=".7"/>
  <circle cx="8.5" cy="5.8" r=".8" fill="#d18a74" opacity=".9"/>
  <circle cx="13.5" cy="4.6" r=".7" fill="#d18a74" opacity=".8"/>
</svg>`,
  roach: `
<svg viewBox="0 0 24 13" xmlns="http://www.w3.org/2000/svg">
  <g class="wiggle">
    <ellipse cx="11.5" cy="6.8" rx="8.5" ry="4" fill="#8a4a2e"/>
    <path d="M6 3.8 Q6.5 6.8 6 9.8 M9 3.2 Q9.5 6.8 9 10.3 M12 3.2 Q12.5 6.8 12 10.3 M15 3.7 Q15.4 6.8 15 9.9"
          stroke="#6d3620" stroke-width=".8" fill="none"/>
    <ellipse cx="19" cy="6.4" rx="2.2" ry="1.8" fill="#5e2d18"/>
    <path d="M20.5 5.2 Q22.5 2.6 23.2 1 M20.5 6.8 Q23 6.2 24 4.8" stroke="#6d3620" stroke-width=".7" fill="none"/>
    <path d="M6.5 10.3 L5 12.4 M10.5 10.8 L10 12.8 M14.5 10.6 L15.5 12.6" stroke="#5e2d18" stroke-width=".8"/>
    <circle cx="19.7" cy="6" r=".5" fill="#1c0f08"/>
  </g>
</svg>`,
};

export function bugSVG(id) {
  return BUG_SVGS[id] || BUG_SVGS.mealworm;
}

// 夜視雜訊貼圖（程式生成，美術不用畫）
function makeNoise() {
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(96, 96);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 46;
  }
  ctx.putImageData(img, 0, 0);
  document.getElementById('noise').style.backgroundImage = `url(${c.toDataURL()})`;
}
