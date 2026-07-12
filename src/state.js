import { CONFIG } from './config.js';
import { emit } from './events.js';

export let gs = null;

const DAY = 86400000;
const rand = (a, b) => a + Math.random() * (b - a);
const randMs = span => rand(span[0], span[1]);

function defaultState(now, name) {
  return {
    gecko: {
      name,
      affinity: 0,
      hunger: 80,
      weightGrams: 15,
      stage: 'juvenile',
      ageDays: 0,
      isShedding: false,
      currentActivity: 'sleeping',
      sleepPoseId: 'hide_tail',
      locationId: 'hide',
    },
    environment: {
      lightOn: false,
      viewMode: 'nightvision',
      poopPresent: false,
      poopX: 160,
      shedSkinPresent: false,
      shedX: 120,
      soundOn: true,
      musicOn: true,
    },
    timers: {
      createdAt: now,
      lastFedAt: 0,
      lastSeenAt: now,
      lastPoopAt: 0,
      nextPoopAt: 0,
      lastPoseChangeAt: now,
      nextShedAt: now + randMs(CONFIG.shed.intervalMs),
      shedEndAt: 0,
      lastCheckinDay: new Date(now).toDateString(),
      nvWatchDay: '',                 // 「安靜的陪伴」：夜視觀察的累計（每日）
      nvWatchMs: 0,
      nvRewardDay: '',
    },
    records: {
      weighHistory: [],
      handTameCount: 0,
      photosUnlocked: [],
      behaviorsUnlocked: [],
      feedCount: 0,
      shedsCollected: 0,
      diary: [],
      photos: [],
    },
  };
}

// 舊存檔補上新版欄位（新增家具／大便／脫皮／體重系統後的相容處理）
function fillMissing(target, template) {
  for (const key of Object.keys(template)) {
    if (target[key] === undefined) target[key] = template[key];
    else if (typeof template[key] === 'object' && template[key] !== null && !Array.isArray(template[key])) {
      fillMissing(target[key], template[key]);
    }
  }
}

export function initState(now) {
  let loaded = null;
  try { loaded = JSON.parse(localStorage.getItem(CONFIG.saveKey)); } catch (e) { /* 壞檔就重開 */ }
  let isNew = false;
  if (loaded && loaded.gecko) {
    gs = loaded;
    fillMissing(gs, defaultState(now, gs.gecko.name));
    settle(now);
  } else {
    // 取名字交給 ui 的遊戲內視窗（App 內建瀏覽器常會擋 window.prompt）
    gs = defaultState(now, '小肥');
    isNew = true;
  }
  refreshDerived(now);
  save(now);
  return isNew;
}

function refreshDerived(now) {
  gs.gecko.ageDays = Math.floor((now - gs.timers.createdAt) / DAY);
  gs.gecko.stage = gs.gecko.ageDays < 60 ? 'juvenile' : gs.gecko.ageDays < 180 ? 'subadult' : 'adult';
  gs.gecko.weightGrams = computeWeight();
}

// 體重 = 基礎 + 天數成長 + 餵食累積（純函數、冪等，離線也算得準）
export function computeWeight() {
  const w = CONFIG.weight.base
    + gs.gecko.ageDays * CONFIG.weight.perDay
    + (gs.records.feedCount || 0) * CONFIG.weight.perFeed;
  return Math.min(CONFIG.weight.max, Math.round(w * 10) / 10);
}

// 量體重：一天最多記一筆（同日覆蓋）
export function recordWeigh(now) {
  refreshDerived(now);
  const date = new Date(now).toISOString().slice(0, 10);
  const h = gs.records.weighHistory;
  const last = h[h.length - 1];
  if (last && last.date === date) last.grams = gs.gecko.weightGrams;
  else h.push({ date, grams: gs.gecko.weightGrams });
  save(now);
  return gs.gecko.weightGrams;
}

// 大便與脫皮的世界時鐘：離線結算與遊戲中共用，冪等
export function tickWorld(now) {
  const t = gs.timers, env = gs.environment;

  // 進食後 12–36 小時，某個時刻「嗯嗯」
  if (t.nextPoopAt && now >= t.nextPoopAt) {
    env.poopPresent = true;
    env.poopX = Math.round(60 + Math.random() * 220);
    t.lastPoopAt = t.nextPoopAt;
    t.nextPoopAt = 0;
    emit('toast', '💩「嗯…嗯——好了✨（消化很順利唷）」');
    diaryLog('在缸裡留下了一坨傑作。我很健康。', now);
  }

  if (!t.nextShedAt) t.nextShedAt = now + randMs(CONFIG.shed.intervalMs);

  // 到期開始脫皮：整條發白
  if (!gs.gecko.isShedding && now >= t.nextShedAt && !t.shedEndAt) {
    gs.gecko.isShedding = true;
    t.shedEndAt = now + randMs(CONFIG.shed.durationMs);
    emit('toast', '🤍「身體癢癢緊緊的…我要開始脫皮了，別擔心唷」');
    diaryLog('身體變得白白緊緊的。要脫皮了。', now);
  }

  // 脫完皮：缸裡留下蛻皮
  if (gs.gecko.isShedding && now >= t.shedEndAt) {
    gs.gecko.isShedding = false;
    t.shedEndAt = 0;
    t.nextShedAt = now + randMs(CONFIG.shed.intervalMs);
    env.shedSkinPresent = true;
    env.shedX = Math.round(70 + Math.random() * 180);
    emit('toast', '✨「呼——脫完了！我現在全身滑溜溜的！」');
    diaryLog('脫完皮了！全身滑溜溜，是全新的我。', now);
  }
}

// 離線結算：以 timestamp 差值計算，冪等
function settle(now) {
  const t = gs.timers;
  const dt = Math.max(0, now - t.lastSeenAt);

  // 飽食度隨離線時間下降
  const drop = dt / CONFIG.hunger.decayPer6hMs * CONFIG.hunger.decayAmount;
  gs.gecko.hunger = Math.max(CONFIG.hunger.floor, gs.gecko.hunger - drop);

  // 大便／脫皮在離線期間照樣發生
  tickWorld(now);

  // 離線期間睡姿輪換
  if (now - t.lastPoseChangeAt > CONFIG.pose.rotateMs[0]) rotateSleepPose(now);

  // 缺席懲罰：連續 3 天以上未開啟，每日 −2，但不低於當前等級底線
  const daysAway = Math.floor(dt / DAY);
  if (daysAway >= CONFIG.affinity.absenceGraceDays) {
    const floor = tierOf(gs.gecko.affinity).min;
    const penalty = (daysAway - CONFIG.affinity.absenceGraceDays + 1) * CONFIG.affinity.absencePerDay;
    const target = Math.max(floor, gs.gecko.affinity + penalty);
    if (target < gs.gecko.affinity) {
      gs.gecko.affinity = target;
      emit('toast', '「好久不見…那個…你是誰來著…？」');
      diaryLog('好多天沒有人來。…只有一點點無聊而已。', now);
    }
  }

  // 離開超過 10 分鐘：回歸預設關燈＋夜視，先「偷看」牠
  if (dt > 10 * 60 * 1000) {
    gs.environment.lightOn = false;
    gs.environment.viewMode = 'nightvision';
    gs.gecko.currentActivity = 'sleeping';
    emit('toast', '🥽「哈啊…嗯？好像有誰在看我…算了，繼續睡…」');
    if (gs.gecko.hunger <= 40) emit('toast', '「肚子咕嚕咕嚕的…好想吃蟲蟲…」');
    if (gs.environment.poopPresent) emit('toast', '「那邊有一坨我的傑作，麻煩你了嘿嘿」');
    if (gs.environment.shedSkinPresent) emit('toast', '「我脫皮了！舊的皮皮留在缸裡送你」');
  }

  // 每日簽到 +1
  const day = new Date(now).toDateString();
  if (t.lastCheckinDay !== day) {
    t.lastCheckinDay = day;
    addAffinity(CONFIG.affinity.checkin, '今天也來看我');
    diaryLog(`巨人今天也來看我了。我在${CONFIG.locations[gs.gecko.locationId]?.label ?? '缸裡'}睡覺。`, now);
  }
}

export function tierOf(aff) {
  let t = CONFIG.tiers[0];
  for (const tier of CONFIG.tiers) if (aff >= tier.min) t = tier;
  return t;
}

export function addAffinity(delta, reason) {
  const before = tierOf(gs.gecko.affinity).id;
  gs.gecko.affinity = Math.max(0, Math.min(100, Math.round((gs.gecko.affinity + delta) * 10) / 10));
  emit('affinity', { delta, reason });
  const after = tierOf(gs.gecko.affinity);
  if (delta > 0 && after.id !== before) emit('tierup', after.id);
  save(Date.now());
}

export function poseForLocation(locId, tierId) {
  // 2% 稀有睡姿（躲窩裡看不到就不浪費）
  if (locId !== 'hide' && Math.random() < 0.02) {
    if (locId === 'glass') return 'headstand';
    return Math.random() < 0.5 ? 'bellyup' : 'blep_sleep';
  }
  const q = Math.random();
  switch (locId) {
    case 'hide':    return q < 0.5 ? 'hide_tail' : q < 0.85 ? 'halfout' : 'roof';
    case 'glass':   return 'glass';
    case 'mossbox': return q < 0.7 ? 'moss' : 'buttup';
    case 'heatmat': return 'belly';
    case 'plant':   return 'leaf';
    case 'water':   return q < 0.4 ? 'soak' : 'chinrest';
    case 'rock':    return q < 0.5 ? 'perch' : q < 0.8 ? 'standlean' : 'chinrest';
    case 'driftwood': return q < 0.6 ? 'perch' : 'draped';
    case 'open':    if (tierId === 'trust') return 'open'; break;
  }
  return q < 0.3 ? 'flat' : q < 0.55 ? 'curl' : q < 0.8 ? 'donut' : 'tailmask';
}

// ---- 守宮日記：牠用自己的口吻記錄每一天 ----
const dateKey = now => {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function diaryLog(line, now = Date.now()) {
  const r = gs.records;
  r.diary ??= [];
  const key = dateKey(now);
  let entry = r.diary[r.diary.length - 1];
  if (!entry || entry.date !== key) {
    entry = { date: key, lines: [] };
    r.diary.push(entry);
    if (r.diary.length > 60) r.diary.shift();   // 只留最近 60 天
  }
  if (entry.lines.includes(line) || entry.lines.length >= 10) return;
  entry.lines.push(line);
  save(now);
}

// 行為圖鑑：親眼看到一次就解鎖
export function unlockBehavior(id) {
  const r = gs.records;
  r.behaviorsUnlocked ??= [];
  if (r.behaviorsUnlocked.includes(id)) return;
  r.behaviorsUnlocked.push(id);
  const b = CONFIG.behaviors[id];
  emit('toast', `📖 行為圖鑑＋1：${b.icon} ${b.label}`);
  emit('sfx', 'unlock');
  save(Date.now());
}

// 各好感度等級願意睡的地點；脫皮時特別愛濕濕的苔蘚盒
export function sleepLocationPool(tierId, shedding) {
  if (shedding) return ['mossbox', 'mossbox', 'mossbox', 'hide'];
  if (tierId === 'stranger' || tierId === 'wary')
    return ['hide', 'hide', 'mossbox', 'plant', 'driftwood', 'water'];
  if (tierId === 'familiar')
    return ['hide', 'mossbox', 'plant', 'driftwood', 'water', 'glass', 'rock', 'heatmat'];
  return ['hide', 'mossbox', 'plant', 'driftwood', 'water', 'glass', 'rock', 'heatmat', 'open'];
}

// 換一組「地點×睡姿」，低好感偏向躲藏處，避免連續重複
export function rotateSleepPose(now) {
  const tierId = tierOf(gs.gecko.affinity).id;
  let pool = sleepLocationPool(tierId, gs.gecko.isShedding);
  pool = pool.filter(id => id !== gs.gecko.locationId);
  const loc = pool[(Math.random() * pool.length) | 0] || 'hide';
  gs.gecko.locationId = loc;
  gs.gecko.sleepPoseId = poseForLocation(loc, tierId);
  gs.timers.lastPoseChangeAt = now;
}

// 第一次「親眼看到」某個睡姿×地點組合時解鎖圖鑑
export function unlockCombo(poseId, locId) {
  const key = `${poseId}@${locId}`;
  if (gs.records.photosUnlocked.includes(key)) return;
  gs.records.photosUnlocked.push(key);
  emit('toast', `📷 睡姿圖鑑＋1：${CONFIG.poses[poseId].label} × ${CONFIG.locations[locId].label}`);
  emit('sfx', 'unlock');
  addAffinity(CONFIG.affinity.unlock, '發現我的新睡姿');
  save(Date.now());
}

// 遊戲進行中的持續飢餓（與離線結算共用同一組參數）
let lastHungerAt = Date.now();
export function tickHunger(now) {
  const dt = Math.max(0, now - lastHungerAt);
  lastHungerAt = now;
  gs.gecko.hunger = Math.max(
    CONFIG.hunger.floor,
    gs.gecko.hunger - dt / CONFIG.hunger.decayPer6hMs * CONFIG.hunger.decayAmount
  );
}

export function save(now) {
  gs.timers.lastSeenAt = now;
  refreshDerived(now);
  try { localStorage.setItem(CONFIG.saveKey, JSON.stringify(gs)); } catch (e) { /* 存不進去就算了 */ }
}
