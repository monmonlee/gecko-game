// 聲音：全部用 WebAudio 程式合成，不需要任何音檔
// - BGM：音樂盒風格的搖籃曲循環（程式生成，無版權疑慮），關燈時低通濾波變「悶悶的」
// - 音效（嗶嗶聲）：獨立開關，目前依需求保持關閉
// 瀏覽器規定要有使用者手勢後才能出聲，由 ui 在第一次點擊時呼叫 userGesture()
let ctx = null, master = null, ready = false;
let sfxOn = false, musicOn = true, dark = false;
let musicGain = null, musicFilter = null;
let cricketLoop = null, musicTimer = null, nextLoopT = 0;
let track = 'ambient';                      // 'theme'（開場敘事曲）| 'ambient'（遊戲場景音景）
let liveGains = [];                         // 換曲時要淡出的活動音符

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
    musicFilter = ctx.createBiquadFilter();
    musicFilter.type = 'lowpass';
    musicFilter.frequency.value = 2600;   // 開燈關燈都一樣，柔化音色用
    musicGain = ctx.createGain();
    musicGain.gain.value = 1.6;
    musicGain.connect(musicFilter);
    musicFilter.connect(master);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return true;
}

export function userGesture() {
  ready = true;
  unlockMediaSession();
  if (ensure()) { startCrickets(); startMusic(); }
}

// iOS：側邊靜音鍵撥下時 WebAudio 會被消音；播一條無聲的 <audio> 循環
// 可以把音訊 session 切成「媒體播放」模式，繞過靜音鍵（標準做法）
let unlocked = false;
function unlockMediaSession() {
  if (unlocked) return;
  unlocked = true;
  try {
    const len = 4410;                       // 0.1 秒的無聲 wav，程式現做
    const buf = new ArrayBuffer(44 + len * 2);
    const v = new DataView(buf);
    const wr = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    wr(0, 'RIFF'); v.setUint32(4, 36 + len * 2, true); wr(8, 'WAVE'); wr(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 44100, true); v.setUint32(28, 88200, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    wr(36, 'data'); v.setUint32(40, len * 2, true);
    const a = new Audio(URL.createObjectURL(new Blob([buf], { type: 'audio/wav' })));
    a.loop = true;
    a.volume = 0.01;
    a.setAttribute('playsinline', '');
    a.play().catch(() => {});
  } catch (e) { /* 不支援就算了 */ }
}

export function setSfxOn(v) { sfxOn = v; }
export function setMusicOn(v) {
  musicOn = v;
  if (!v && musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  if (v && ready) startMusic();
}
export function isMusicOn() { return musicOn; }

// 切換曲目：把還在響的音符淡出，下一輪換新曲
export function setTrack(name) {
  if (track === name) return;
  track = name;
  if (!ctx) return;
  const now = ctx.currentTime;
  for (const g of liveGains) {
    try {
      g.gain.cancelScheduledValues(now);
      g.gain.setTargetAtTime(0, now, 0.25);
    } catch (e) { /* 已結束的音符 */ }
  }
  liveGains = [];
  nextLoopT = now + 1.4;
  if (musicTimer && musicOn) {
    scheduleLoop(nextLoopT);
    nextLoopT += loopBeats() * BEAT;
  }
}

// 關燈：只影響蟲鳴，音樂兩個模式都一樣
// （原本的「關燈音樂變悶」在手機喇叭上會悶到聽不見，拿掉了）
export function setDark(v) { dark = v; }

// ---- 音效（目前關閉） ----
function tone({ f = 440, f2, t = 0.1, type = 'sine', v = 0.12, when = 0 }) {
  if (!ready || !ensure()) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  const t0 = ctx.currentTime + when;
  o.type = type;
  o.frequency.setValueAtTime(f, t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + t);
  g.gain.setValueAtTime(v, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + t);
  o.connect(g); g.connect(master);
  o.start(t0); o.stop(t0 + t + 0.02);
}

const SFX = {
  click:   () => tone({ f: 620, t: 0.05, type: 'square', v: 0.05 }),
  light:   () => tone({ f: 300, f2: 540, t: 0.08, type: 'square', v: 0.07 }),
  nv:      () => tone({ f: 540, f2: 300, t: 0.1, type: 'square', v: 0.06 }),
  pounce:  () => tone({ f: 900, f2: 300, t: 0.12, type: 'sawtooth', v: 0.1 }),
  eat:     () => { tone({ f: 220, t: 0.05, type: 'square', v: 0.12 });
                   tone({ f: 175, t: 0.06, type: 'square', v: 0.12, when: 0.09 }); },
  success: () => [523, 659, 784].forEach((f, i) => tone({ f, t: 0.12, type: 'triangle', v: 0.1, when: i * 0.09 })),
  fanfare: () => [523, 659, 784, 1046].forEach((f, i) => tone({ f, t: 0.16, type: 'triangle', v: 0.11, when: i * 0.11 })),
  fail:    () => tone({ f: 200, f2: 140, t: 0.18, type: 'triangle', v: 0.09 }),
  unlock:  () => [880, 1318].forEach((f, i) => tone({ f, t: 0.1, type: 'sine', v: 0.07, when: i * 0.08 })),
};

export function sfx(name) { if (sfxOn) SFX[name]?.(); }

// ---- BGM：音樂盒搖籃曲（64 拍＝約 53 秒的完整段落，A A' B A'' 結構）----
const BEAT = 60 / 72;                       // 72 BPM
const MELODY = [                            // [拍, 頻率]
  // A 段
  [0, 659.25], [1, 783.99], [2, 880.00],
  [4, 783.99], [5, 659.25], [6, 523.25],
  [8, 587.33], [9, 659.25], [10, 783.99],
  [12, 659.25], [13, 587.33], [14, 523.25],
  // A' 段（爬得更高）
  [16, 659.25], [17, 783.99], [18, 1046.50],
  [20, 880.00], [21, 783.99], [22, 659.25],
  [24, 587.33], [25, 523.25], [26, 440.00],
  [28, 587.33], [29, 659.25], [30, 587.33],
  // B 段（沉下來，安靜的段落）
  [32, 440.00], [33, 523.25], [34, 659.25],
  [36, 698.46], [37, 659.25], [38, 587.33],
  [40, 659.25], [41, 523.25], [42, 392.00],
  [44, 440.00], [45, 493.88], [46, 587.33],
  // A'' 段（回家收尾）
  [48, 880.00], [49, 783.99], [50, 698.46],
  [52, 783.99], [53, 659.25], [54, 587.33],
  [56, 523.25], [57, 587.33], [58, 659.25], [59, 783.99],
  [60, 523.25],
];
const CH = {
  C:  [261.63, 329.63, 392.00],
  Am: [220.00, 261.63, 329.63],
  F:  [174.61, 261.63, 349.23],
  G:  [196.00, 246.94, 392.00],
};
const CHORDS = [                            // 每 4 拍換一組和弦（墊在下面的柔軟和聲）
  [0, CH.C], [4, CH.Am], [8, CH.F], [12, CH.G],
  [16, CH.C], [20, CH.Am], [24, CH.F], [28, CH.G],
  [32, CH.Am], [36, CH.F], [40, CH.C], [44, CH.G],
  [48, CH.F], [52, CH.G], [56, CH.C], [60, CH.C],
];

// 遊戲場景音景：溫暖的七和弦墊底＋隨機飄落的音樂盒單音（每輪都不一樣，久聽不膩）
const AMBIENT_CHORDS = [
  [261.63, 329.63, 392.00, 493.88],         // Cmaj7
  [220.00, 261.63, 329.63, 392.00],         // Am7
  [174.61, 220.00, 261.63, 329.63],         // Fmaj7
  [196.00, 246.94, 329.63, 392.00],         // G6
];
const AMBIENT_NOTES = [392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];

function loopBeats() { return track === 'theme' ? 64 : 32; }

// 音樂盒撥弦音：基音＋八度泛音，快起音慢衰減
function pluck(freq, t, vol = 0.22) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.value = freq;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
  g._end = t + 1.6;
  o.connect(g); g.connect(musicGain);
  o.start(t); o.stop(t + 1.6);
  const o2 = ctx.createOscillator(), g2 = ctx.createGain();
  o2.type = 'sine'; o2.frequency.value = freq * 2;
  g2.gain.setValueAtTime(0, t);
  g2.gain.linearRampToValueAtTime(vol * 0.32, t + 0.008);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  g2._end = t + 0.8;
  o2.connect(g2); g2.connect(musicGain);
  o2.start(t); o2.stop(t + 0.8);
  liveGains.push(g, g2);
}

// 柔軟的和弦墊：慢起音三角波
function pad(freqs, t, durBeats, vol = 0.05) {
  const dur = durBeats * BEAT;
  for (const f of freqs) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.7);
    g.gain.setValueAtTime(vol, t + dur - 0.4);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.25);
    g._end = t + dur + 0.4;
    o.connect(g); g.connect(musicGain);
    o.start(t); o.stop(t + dur + 0.4);
    liveGains.push(g);
  }
}

function scheduleLoop(t0) {
  if (document.hidden) return;              // 分頁在背景就這輪休息
  liveGains = liveGains.filter(g => g._end > (ctx ? ctx.currentTime : 0));
  if (track === 'theme') {
    for (const [beat, freqs] of CHORDS) pad(freqs, t0 + beat * BEAT, 4);
    for (const [beat, f] of MELODY) pluck(f, t0 + beat * BEAT);
  } else {
    // 場景音景：4 組 × 8 拍和弦，上面每組隨機灑 1–3 顆單音
    for (let i = 0; i < 4; i++) {
      const t = t0 + i * 8 * BEAT;
      pad(AMBIENT_CHORDS[i], t, 8, 0.038);
      const n = 1 + (Math.random() * 3 | 0);
      for (let k = 0; k < n; k++) {
        const f = AMBIENT_NOTES[(Math.random() * AMBIENT_NOTES.length) | 0];
        pluck(f, t + Math.random() * 7 * BEAT, 0.08 + Math.random() * 0.09);
      }
    }
  }
}

function startMusic() {
  if (!ready || !musicOn || musicTimer) return;
  nextLoopT = ctx.currentTime + 0.15;
  scheduleLoop(nextLoopT);
  nextLoopT += loopBeats() * BEAT;
  // 用固定心跳當看門狗：計時器被瀏覽器節流、AudioContext 被 iOS 打斷都救得回來
  musicTimer = setInterval(() => {
    if (!musicOn || document.hidden) return;
    if (ctx.state !== 'running') ctx.resume();
    if (ctx.currentTime > nextLoopT - 1.5) {           // 提前把下一輪整段排進去
      if (nextLoopT < ctx.currentTime) nextLoopT = ctx.currentTime + 0.1;
      scheduleLoop(nextLoopT);
      nextLoopT += loopBeats() * BEAT;
    }
  }, 500);
}

// ---- 關燈後的夜晚蟲鳴：隨機間隔的三連唧唧聲 ----
function chirp() {
  const base = 4100 + Math.random() * 500;
  for (let i = 0; i < 3; i++) tone({ f: base, t: 0.03, type: 'sine', v: 0.018, when: i * 0.07 });
}

function startCrickets() {
  if (cricketLoop) return;
  const loop = () => {
    cricketLoop = setTimeout(() => {
      if (dark && musicOn && !document.hidden) chirp();
      loop();
    }, 900 + Math.random() * 2400);
  };
  loop();
}
