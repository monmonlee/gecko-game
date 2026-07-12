import { gs } from './state.js';

let geckoEl, wormEl, stageEl, poopEl, shedEl;

export function initScene() {
  stageEl = document.getElementById('stage');
  geckoEl = document.getElementById('gecko');
  wormEl = document.getElementById('worm');
  poopEl = document.getElementById('poop');
  shedEl = document.getElementById('shedskin');
  geckoEl.innerHTML = geckoSVG();
  wormEl.innerHTML = wormSVG();
  makeNoise();
}

// 缸內物件（大便／蛻皮）的顯示同步
export function drawWorld() {
  const env = gs.environment;
  poopEl.style.display = env.poopPresent ? 'block' : 'none';
  if (env.poopPresent) poopEl.style.left = env.poopX + 'px';
  shedEl.style.display = env.shedSkinPresent ? 'block' : 'none';
  if (env.shedSkinPresent) shedEl.style.left = env.shedX + 'px';
}

export function setMode(env) {
  stageEl.classList.toggle('mode-light', env.lightOn);
  stageEl.classList.toggle('mode-dark', !env.lightOn && env.viewMode === 'normal');
  stageEl.classList.toggle('mode-nv', !env.lightOn && env.viewMode === 'nightvision');
}

export function drawGecko(b) {
  const g = gs.gecko;
  const act = g.currentActivity;
  const walking =
    (act === 'active' && (b.sub === 'walk' || b.sub === 'bedtime')) ||
    (act === 'hiding' && b.sub === 'retreat') ||
    (act === 'hunting' && b.sub !== 'pounce');
  const running =
    (act === 'hunting' && b.sub === 'pounce') ||
    (act === 'hiding' && b.sub === 'retreat' && b.speed > 70);

  const cls = ['sprite'];
  if (act === 'sleeping') cls.push('eyes-closed', 'pose-' + g.sleepPoseId);
  if (act === 'frozen') cls.push('state-frozen');
  if (walking) cls.push('walking');
  if (running) cls.push('running');
  if (act === 'active' && b.sub === 'drink') cls.push('drinking');
  if (g.isShedding) cls.push('shedding');
  if (act === 'petted') {
    if (b.sub === 'happy') cls.push('eyes-closed', 'pet-happy');
    if (b.sub === 'sniff') cls.push('sniffing');
    if (b.sub === 'onhand') cls.push('onhand');
    if (['palm_go', 'climb', 'walkoff'].includes(b.sub)) cls.push('walking');
    if (b.sub === 'dodge') cls.push('walking', 'running');
  }
  geckoEl.className = cls.join(' ');
  geckoEl.style.transform =
    `translate(${(b.x - 32).toFixed(1)}px, ${(b.y - 30).toFixed(1)}px) scaleX(${b.facing})`;
}

// ---- 佔位圖形：肥尾守宮（依 spec §5.0 外觀參考）----
// PNG sprite 完成後改為 <img> fallback 機制，逐張替換
function geckoSVG() {
  return `
<svg class="gecko-svg" viewBox="0 0 64 32" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="gk-clip">
      <ellipse cx="12" cy="20.5" rx="11.5" ry="6"/>
      <ellipse cx="31" cy="19" rx="13.5" ry="8.5"/>
      <ellipse cx="48.5" cy="15.5" rx="10" ry="7.2"/>
    </clipPath>
  </defs>

  <!-- 遠側腳 -->
  <rect class="leg leg-b2" x="22.5" y="20" width="3.4" height="9" rx="1.7" fill="#c08e75"/>
  <rect class="leg leg-f2" x="40.5" y="19" width="3.4" height="9" rx="1.7" fill="#c08e75"/>

  <g class="body-group">
    <g clip-path="url(#gk-clip)">
      <rect x="0" y="0" width="64" height="32" fill="#C08552"/>
      <!-- 深棕橫帶＋乳白鑲邊 -->
      <rect x="3"    y="0" width="6"   height="32" fill="#5C3A28"/>
      <rect x="9"    y="0" width="1.2" height="32" fill="#EFE3D0"/>
      <rect x="17"   y="0" width="1.2" height="32" fill="#EFE3D0"/>
      <rect x="18.2" y="0" width="7"   height="32" fill="#5C3A28"/>
      <rect x="25.2" y="0" width="1.2" height="32" fill="#EFE3D0"/>
      <rect x="33"   y="0" width="1.2" height="32" fill="#EFE3D0"/>
      <rect x="34.2" y="0" width="7.5" height="32" fill="#5C3A28"/>
      <rect x="41.7" y="0" width="1.2" height="32" fill="#EFE3D0"/>
      <!-- 頭頂冠斑 -->
      <ellipse cx="47" cy="9.5" rx="7.5" ry="3.6" fill="#5C3A28"/>
      <!-- 腹面粉膚色 -->
      <rect x="0" y="24.5" width="64" height="7.5" fill="#D9A98F"/>
      <!-- 淺色帶上的斑點 -->
      <circle cx="13" cy="18"   r="0.8" fill="#7A4E30"/>
      <circle cx="12" cy="22"   r="0.7" fill="#7A4E30"/>
      <circle cx="29" cy="15"   r="0.9" fill="#7A4E30"/>
      <circle cx="31" cy="20.5" r="0.7" fill="#7A4E30"/>
      <circle cx="45" cy="13"   r="0.8" fill="#7A4E30"/>
      <circle cx="52" cy="19"   r="0.7" fill="#7A4E30"/>
    </g>
    <!-- 臉：乳白眼圈＋黑棕大眼（最重要的辨識特徵） -->
    <g class="eye">
      <circle cx="50.5" cy="14" r="3.3" fill="#EFE3D0"/>
      <circle cx="50.5" cy="14" r="2.4" fill="#241812"/>
      <circle cx="51.3" cy="13.1" r="0.7" fill="#fff" opacity="0.9"/>
    </g>
    <path class="eye-lid" d="M47.5 14.5 Q50.5 17 53.5 14.5" stroke="#241812" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <circle cx="55.8" cy="13.6" r="0.7" fill="#c96a5f"/>
    <path d="M57 17.5 Q53.5 19 50 18.3" stroke="#8a5b40" stroke-width="0.7" fill="none" opacity="0.6"/>
  </g>

  <!-- 近側腳 -->
  <rect class="leg leg-b1" x="24.5" y="20.5" width="3.6" height="9.5" rx="1.8" fill="#D9A98F" stroke="#b98d72" stroke-width="0.4"/>
  <rect class="leg leg-f1" x="42.5" y="19.5" width="3.6" height="9.5" rx="1.8" fill="#D9A98F" stroke="#b98d72" stroke-width="0.4"/>
</svg>`;
}

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
