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
  wormEl.innerHTML = wormSVG();
  makeNoise();
  makeDust();
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
  // 半身出窩一定頭朝外（窩口在右邊）
  const face = act === 'sleeping' && g.sleepPoseId === 'halfout' ? 1 : b.facing;
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

function wormSVG() {
  return `
<svg viewBox="0 0 18 10" width="18" height="10" xmlns="http://www.w3.org/2000/svg">
  <g class="wiggle">
    <circle cx="4"    cy="6"   r="2.6" fill="#e2977a"/>
    <circle cx="8.5"  cy="4.6" r="2.8" fill="#d98a68"/>
    <circle cx="13.5" cy="5.6" r="3"   fill="#c97a58"/>
    <circle cx="14.6" cy="4.8" r="0.5" fill="#241812"/>
  </g>
</svg>`;
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
