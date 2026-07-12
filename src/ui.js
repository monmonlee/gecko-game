import { CONFIG } from './config.js';
import { on } from './events.js';
import { gs, tierOf, save, addAffinity, recordWeigh, tickWorld } from './state.js';
import { setMode, drawWorld } from './render.js';

let brain, feeder;
let handBusy = false;                 // 手伸進缸裡的期間鎖住其他互動
const $ = id => document.getElementById(id);

// 好感升級時牠說的話（依新等級）
const TIER_LINES = {
  wary:     '「那個巨人…好像沒有要吃我的意思…？」',
  familiar: '「是你呀。嗯，你出現的時候，好像都會有蟲蟲。」',
  trust:    '「今天也在呀。…在你旁邊睡覺，好像也不錯。」',
};

// 在 initState 之前呼叫：先掛好事件監聽，離線結算的 toast 才收得到
export function preInit() {
  on('toast', showToast);
  on('affinity', ({ delta, reason }) => {
    if (delta) showToast(`${delta > 0 ? '+' : ''}${delta} 好感${reason ? `（${reason}）` : ''}`);
  });
  on('tierup', tierId => showToast(`💛 ${TIER_LINES[tierId] ?? '「你…好像跟別人不一樣。」'}`));
}

export function init(_brain, _feeder, isNew) {
  brain = _brain;
  feeder = _feeder;
  $('g-name').textContent = gs.gecko.name;

  $('btn-light').addEventListener('click', () => {
    if (feeder.active) return showToast('「等等啦，我還在追蟲蟲！」');
    if (handBusy) return showToast('（你的手還伸在缸裡呢）');
    const now = Date.now();
    gs.environment.lightOn = !gs.environment.lightOn;
    if (gs.environment.lightOn) brain.onLightOn(now);
    else { gs.environment.viewMode = 'normal'; brain.onLightOff(now); }
    setMode(gs.environment);
    save(now);
    refresh();
  });

  $('btn-nv').addEventListener('click', () => {
    if (gs.environment.lightOn) return;
    gs.environment.viewMode = gs.environment.viewMode === 'nightvision' ? 'normal' : 'nightvision';
    setMode(gs.environment);
    save(Date.now());
    refresh();
  });

  $('btn-feed').addEventListener('click', () => {
    const now = Date.now();
    if (feeder.active) { feeder.cancel(); showToast('「咦？蟲蟲呢！？我的蟲蟲！」'); refresh(); return; }
    if (handBusy) return;
    if (!gs.environment.lightOn) return showToast('「黑漆漆的，我看不到蟲蟲啦」（開燈才能餵食）');
    const left = gs.timers.lastFedAt + CONFIG.feed.cooldownMs - now;
    if (left > 0) return showToast(`「我還很飽，肚子圓滾滾的～」（${fmt(left)} 後再餵）`);
    feeder.start(now);
    showToast('🪱 移動手指引導蟲蟲——「那是什麼！扭來扭去的！」');
    refresh();
  });

  // 夾子：清大便＋收蛻皮
  $('btn-clamp').addEventListener('click', () => {
    if (!gs.environment.lightOn) return showToast('（開燈才看得清缸裡有什麼）');
    const env = gs.environment;
    if (env.poopPresent) {
      env.poopPresent = false;
      addAffinity(CONFIG.affinity.poop, '幫我打掃');
      showToast('🗜️「便便被收走了！我的家又乾乾淨淨～我可是很健康的守宮！」');
    } else if (env.shedSkinPresent) {
      env.shedSkinPresent = false;
      gs.records.shedsCollected = (gs.records.shedsCollected || 0) + 1;
      addAffinity(CONFIG.affinity.shedCollect, '幫我收皮皮');
      showToast(`📦「那是我之前的皮皮！送你收藏～（第 ${gs.records.shedsCollected} 張）」`);
    } else {
      showToast('「缸裡很乾淨唷，沒東西要夾～」');
    }
    save(Date.now());
    refresh();
  });

  // 手：摸摸／手心朝上
  $('btn-hand').addEventListener('click', () => {
    if (handBusy) return;
    if (!gs.environment.lightOn) return showToast('（開燈才能伸手進去）');
    if (feeder.active) return showToast('「現在沒空！蟲蟲要緊！」');
    $('handmenu').classList.toggle('hidden');
  });
  $('pet-mode').addEventListener('click', startPetting);
  $('palm-mode').addEventListener('click', startPalm);
  $('hand-cancel').addEventListener('click', () => $('handmenu').classList.add('hidden'));

  // 磅秤：量體重＋成長曲線
  $('btn-scale').addEventListener('click', () => {
    if (!gs.environment.lightOn) return showToast('（開燈才好量體重）');
    const grams = recordWeigh(Date.now());
    showToast('⚖️「站上去就可以了嗎？…我有變重嗎？有嗎有嗎？」');
    openScaleModal(grams);
  });

  $('modal').addEventListener('click', e => {
    if (e.target.id === 'modal' || e.target.id === 'modal-close') $('modal').classList.add('hidden');
  });

  initDebug();
  setInterval(refresh, 300);
  refresh();
  if (isNew) openNameModal();
}

// ---- 新守宮取名字（遊戲內視窗，取代 window.prompt）----
function openNameModal() {
  $('modal-box').innerHTML = `
    <h3>🦎 牠搬進你家了</h3>
    <div class="modal-note">一隻小小的肥尾守宮，正縮在窩裡偷看你。<br>幫牠取個名字吧！</div>
    <input id="name-input" maxlength="12" placeholder="小肥" autocomplete="off">
    <button id="name-ok">就叫這個名字！</button>`;
  $('modal').classList.remove('hidden');
  const done = () => {
    const name = ($('name-input').value || '小肥').trim() || '小肥';
    gs.gecko.name = name;
    $('g-name').textContent = name;
    save(Date.now());
    $('modal').classList.add('hidden');
    showToast(`🦎「${name}…是我的名字嗎？…好，我記住了。」`);
    showToast('🥽 牠還在認識新家，先用夜視鏡靜靜陪牠吧');
  };
  $('name-ok').addEventListener('click', done);
  $('name-input').addEventListener('keydown', e => { if (e.key === 'Enter') done(); });
}

// ---- 安靜的陪伴：夜視模式下靜靜看牠，每天累計滿 3 分鐘 +2 好感 ----
let lastWatchAt = Date.now();
function tickCompanionship() {
  const now = Date.now();
  const dt = now - lastWatchAt;
  lastWatchAt = now;
  const env = gs.environment, t = gs.timers;
  // dt 太大代表分頁被切走，不算陪伴時間
  if (env.lightOn || env.viewMode !== 'nightvision' || document.hidden || dt > 2000) return;
  const day = new Date(now).toDateString();
  if (t.nvWatchDay !== day) { t.nvWatchDay = day; t.nvWatchMs = 0; }
  t.nvWatchMs += dt;
  if (t.nvWatchMs >= CONFIG.affinity.companionMinMs && t.nvRewardDay !== day) {
    t.nvRewardDay = day;
    addAffinity(CONFIG.affinity.companion, '安靜的陪伴');
    showToast('「…那個巨人今天也在，不吵也不鬧。有你在，好像可以睡得比較安心。」');
  }
}

// ---- 摸摸流程 ----
const handEl = () => $('hand');

function showHand(emoji, x, y) {
  const h = handEl();
  h.querySelector('span').textContent = emoji;
  h.style.display = 'block';
  h.style.transition = 'none';
  h.style.transform = `translate(${x - 13}px, ${y}px)`;
}

function moveHand(x, y) {
  const h = handEl();
  // 兩次 rAF：先讓起始位置生效，再開啟過渡動畫
  requestAnimationFrame(() => requestAnimationFrame(() => {
    h.style.transition = 'transform .8s ease';
    h.style.transform = `translate(${x - 13}px, ${y}px)`;
  }));
}

function hideHand() {
  const h = handEl();
  h.style.display = 'none';
  h.classList.remove('petting');
  handBusy = false;
  refresh();
}

function startPetting() {
  $('handmenu').classList.add('hidden');
  if (handBusy || feeder.active || !gs.environment.lightOn) return;
  const g = gs.gecko;
  if (g.currentActivity === 'hiding') return showToast('「我在窩裡！你的手伸不進來吧！哼哼」');
  handBusy = true;
  brain.startPetWait();
  const hx = brain.x, hy = brain.y - 54;
  showHand('🤚', hx, hy - 40);
  moveHand(hx, hy);
  setTimeout(() => {
    const jitter = (Math.random() * 2 - 1) * CONFIG.pet.rateJitter;
    const rate = Math.max(0, Math.min(100, g.affinity + jitter));
    if (Math.random() * 100 < rate) {
      handEl().classList.add('petting');
      brain.petHappy();
      addAffinity(CONFIG.affinity.pet, '摸摸');
      showToast('🥰「唔嗯…摸摸的感覺…好像、還不錯…」');
      setTimeout(hideHand, CONFIG.pet.happyMs);
    } else {
      brain.petDodge();
      addAffinity(CONFIG.affinity.petFail, '被嚇到了');
      showToast('💨「哇！不要突然摸我啦！嚇死我了！」');
      setTimeout(hideHand, 500);
    }
  }, CONFIG.pet.judgeDelayMs);
}

function startPalm() {
  $('handmenu').classList.add('hidden');
  if (handBusy || feeder.active || !gs.environment.lightOn) return;
  const g = gs.gecko;
  if (g.currentActivity === 'hiding') return showToast('「我在窩裡不出去～你的手掌看起來還是有點可怕」');
  handBusy = true;
  const px = Math.max(30, Math.min(290, brain.x + (brain.x < 160 ? 40 : -40)));
  const py = Math.min(216, Math.max(196, brain.y));
  showHand('🫴', px, py - 64);
  moveHand(px, py - 26);
  brain.palmApproach(px, py);
  showToast('🫴 你把手掌平放在牠面前，靜靜等待…');
  setTimeout(() => {
    const rate = Math.max(0, g.affinity - 50) * CONFIG.pet.palmRatePerAff;
    if (Math.random() * 100 < rate) {
      brain.palmClimb(px, py);
      gs.records.handTameCount = (gs.records.handTameCount || 0) + 1;
      addAffinity(CONFIG.affinity.handTame, '爬上你的手');
      showToast(`🎉「…你的手，暖暖的。」牠爬上你的手心了！（第 ${gs.records.handTameCount} 次）`);
      setTimeout(hideHand, 4200);
    } else {
      brain.palmOff();
      showToast('「聞起來…不是蟲蟲。嗯，今天先這樣吧。」（牠轉頭走掉了，沒有扣好感）');
      setTimeout(hideHand, 1200);
    }
  }, CONFIG.pet.palmWaitMs);
}

// ---- 磅秤視窗 ----
function openScaleModal(grams) {
  const g = gs.gecko;
  const stageLabel = { juvenile: '幼體', subadult: '亞成', adult: '成體' }[g.stage];
  $('modal-box').innerHTML = `
    <h3>⚖️ 體重紀錄</h3>
    <div class="weight-big">${grams} g</div>
    <div class="weight-meta">${stageLabel}・來到家裡第 ${g.ageDays + 1} 天・量過 ${gs.records.weighHistory.length} 次</div>
    ${chartSVG(gs.records.weighHistory)}
    <div class="modal-note">吃蟲蟲和長大都會慢慢變重，尾巴越肥越健康！</div>
    <button id="modal-close">關閉</button>`;
  $('modal').classList.remove('hidden');
}

function chartSVG(hist) {
  const data = hist.slice(-30);
  if (data.length < 2) return '<div class="chart-empty">多量幾天，這裡就會畫出牠的成長曲線囉</div>';
  const w = 280, h = 120, pad = 20;
  const min = Math.min(...data.map(d => d.grams));
  const max = Math.max(...data.map(d => d.grams));
  const span = Math.max(0.5, max - min);
  const pt = (d, i) => {
    const x = pad + (w - 2 * pad) * (data.length === 1 ? 0.5 : i / (data.length - 1));
    const y = h - pad - (h - 2 * pad) * (d.grams - min) / span;
    return [x, y];
  };
  const pts = data.map((d, i) => pt(d, i).map(v => v.toFixed(1)).join(',')).join(' ');
  const dots = data.map((d, i) => {
    const [x, y] = pt(d, i);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.4" fill="#e8c97a"/>`;
  }).join('');
  return `
  <svg class="chart" viewBox="0 0 ${w} ${h}">
    <line x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}" stroke="#4a3f2f"/>
    <polyline points="${pts}" fill="none" stroke="#c98a3e" stroke-width="2" stroke-linejoin="round"/>
    ${dots}
    <text x="${pad}" y="12" fill="#b3a184" font-size="9">${max} g</text>
    <text x="${pad}" y="${h - 6}" fill="#b3a184" font-size="9">${min} g</text>
  </svg>`;
}

// ---- HUD 更新 ----
export function refresh() {
  const g = gs.gecko, env = gs.environment;
  const tier = tierOf(g.affinity);
  $('g-tier').textContent = tier.label;
  $('g-tier').dataset.tier = tier.id;
  $('g-stagebadge').textContent = { juvenile: '幼體', subadult: '亞成', adult: '成體' }[g.stage];
  $('bar-aff').style.width = g.affinity + '%';
  $('bar-hun').style.width = g.hunger + '%';
  $('num-aff').textContent = Math.round(g.affinity);
  $('num-hun').textContent = Math.round(g.hunger);
  $('status').textContent = statusText();
  drawWorld();
  tickCompanionship();

  const btnL = $('btn-light'), btnN = $('btn-nv'), btnF = $('btn-feed');
  btnL.classList.toggle('on', env.lightOn);
  btnL.querySelector('.ico').textContent = env.lightOn ? '💡' : '🔦';
  btnN.disabled = env.lightOn;
  btnN.classList.toggle('on', !env.lightOn && env.viewMode === 'nightvision');
  const left = gs.timers.lastFedAt + CONFIG.feed.cooldownMs - Date.now();
  btnF.disabled = !feeder.active && (!env.lightOn || left > 0 || handBusy);
  btnF.querySelector('.lbl').textContent = feeder.active ? '收回' : '餵食';
  $('feed-cd').textContent = !feeder.active && left > 0 ? fmt(left) : '';

  const hasChore = env.poopPresent || env.shedSkinPresent;
  $('btn-clamp').disabled = !env.lightOn || !hasChore;
  $('clamp-sub').textContent = env.poopPresent ? '有便便!' : env.shedSkinPresent ? '有蛻皮!' : '';
  $('btn-hand').disabled = !env.lightOn || feeder.active || handBusy;
  $('btn-scale').disabled = !env.lightOn || handBusy;
}

// 狀態列＝牠的內心小劇場
function statusText() {
  const env = gs.environment, g = gs.gecko;
  if (!env.lightOn && env.viewMode === 'normal') return '🌑 一片漆黑……（戴上夜視鏡偷看牠吧）';
  const shed = g.isShedding ? '（脫皮中，白白的）' : '';
  const loc = CONFIG.locations[g.locationId]?.label ?? '';
  switch (g.currentActivity) {
    case 'sleeping': return `😴「Zzz……」${CONFIG.poses[g.sleepPoseId]?.label ?? '睡覺'}・${loc}${shed}`;
    case 'frozen':   return '❗「不要動…只要不動，就不會被發現…」';
    case 'hiding':   return brain.sub === 'peek' ? '🫣「…你還在嗎？（偷偷探頭）」' : '🕳️「我才不要出去呢。哼。」';
    case 'hunting':  return brain.sub === 'pounce' ? '💨「就是現在——！」' : '🎯「蟲蟲…蟲蟲…站住…」';
    case 'active':   return (brain.sub === 'drink' ? '💧「咕嚕咕嚕…水好好喝」' : `🐾「巡邏巡邏～這裡都是我的地盤」${shed}`);
    case 'petted':   return {
      wait:    '🤚「！？那隻大手要幹嘛…」',
      happy:   '🥰「唔嗯…再摸一下下也可以…」',
      dodge:   '💨「不要突然碰我啦！」',
      palm_go: '👀「那個手掌…放在那裡是什麼意思…」',
      sniff:   '👃「聞聞…聞聞聞…」',
      climb:   '🐾「那我就…踩上去囉…？」',
      onhand:  `🎉「${gs.gecko.name}，在你的手上。」`,
      walkoff: '「今天先這樣。掰掰。」',
    }[brain.sub] ?? '';
    default: return '';
  }
}

function fmt(ms) {
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  const mm = String(m).padStart(2, '0'), sss = String(ss).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${sss}` : `${m}:${sss}`;
}

function showToast(msg) {
  const box = $('toasts');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  box.appendChild(el);
  while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 400);
  }, 3400);
}

// ?debug=1 開啟平衡調整面板（驗收不用真等好幾天）
function initDebug() {
  if (!new URLSearchParams(location.search).has('debug')) return;
  const box = $('debug');
  box.style.display = 'flex';
  const mk = (label, fn) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.onclick = () => { fn(); refresh(); };
    box.appendChild(b);
  };
  mk('+10 好感', () => addAffinity(10, 'debug'));
  mk('−10 好感', () => addAffinity(-10, 'debug'));
  mk('肚子餓', () => { gs.gecko.hunger = 25; });
  mk('重置餵食CD', () => { gs.timers.lastFedAt = 0; });
  mk('想睡覺', () => { brain.sleepAt = Date.now(); });
  mk('換睡姿', () => { brain.nextPoseRotate = Date.now(); });
  mk('大便出現', () => { gs.timers.nextPoopAt = Date.now(); tickWorld(Date.now()); });
  mk('開始脫皮', () => { gs.timers.nextShedAt = Date.now(); gs.timers.shedEndAt = 0; gs.gecko.isShedding = false; tickWorld(Date.now()); });
  mk('完成脫皮', () => { if (gs.gecko.isShedding) { gs.timers.shedEndAt = Date.now(); tickWorld(Date.now()); } });
  mk('老 7 天', () => { gs.timers.createdAt -= 7 * 86400000; });
  mk('清除存檔', () => { localStorage.removeItem(CONFIG.saveKey); location.reload(); });
}
