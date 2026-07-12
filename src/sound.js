// 聲音：全部用 WebAudio 程式合成，不需要任何音檔
// - BGM：音樂盒風格的搖籃曲循環（程式生成，無版權疑慮），關燈時低通濾波變「悶悶的」
// - 音效（嗶嗶聲）：獨立開關，目前依需求保持關閉
// 瀏覽器規定要有使用者手勢後才能出聲，由 ui 在第一次點擊時呼叫 userGesture()
let ctx = null, master = null, ready = false;
let sfxOn = false, musicOn = true, dark = false;
let musicGain = null, musicFilter = null;
let cricketLoop = null, musicTimer = null, nextLoopT = 0;

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
    musicFilter.frequency.value = dark ? 650 : 2400;
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.75;
    musicGain.connect(musicFilter);
    musicFilter.connect(master);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return true;
}

export function userGesture() {
  ready = true;
  if (ensure()) { startCrickets(); startMusic(); }
}

export function setSfxOn(v) { sfxOn = v; }
export function setMusicOn(v) {
  musicOn = v;
  if (!v && musicTimer) { clearTimeout(musicTimer); musicTimer = null; }
  if (v && ready) startMusic();
}
export function isMusicOn() { return musicOn; }

// 關燈：音樂變悶（像隔著缸在夜裡聽）、蟲鳴開始
export function setDark(v) {
  dark = v;
  if (musicFilter) {
    musicFilter.frequency.cancelScheduledValues(ctx.currentTime);
    musicFilter.frequency.linearRampToValueAtTime(v ? 650 : 2400, ctx.currentTime + 1.2);
  }
}

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

// ---- BGM：音樂盒搖籃曲（16 拍循環，C 大調，I–vi–IV–V）----
const BEAT = 60 / 72;                       // 72 BPM
const LOOP_BEATS = 16;
const MELODY = [                            // [拍, 頻率, 長度(拍)]
  [0, 659.25, 1], [1, 783.99, 1], [2, 880.00, 2],
  [4, 783.99, 1], [5, 659.25, 1], [6, 523.25, 2],
  [8, 587.33, 1], [9, 659.25, 1], [10, 783.99, 2],
  [12, 659.25, 1], [13, 587.33, 1], [14, 523.25, 2.5],
];
const CHORDS = [                            // 每 4 拍換一組和弦（墊在下面的柔軟和聲）
  [0,  [261.63, 329.63, 392.00]],           // C
  [4,  [220.00, 261.63, 329.63]],           // Am
  [8,  [174.61, 261.63, 349.23]],           // F
  [12, [196.00, 246.94, 392.00]],           // G
];

// 音樂盒撥弦音：基音＋八度泛音，快起音慢衰減
function pluck(freq, t) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.value = freq;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.15, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
  o.connect(g); g.connect(musicGain);
  o.start(t); o.stop(t + 1.6);
  const o2 = ctx.createOscillator(), g2 = ctx.createGain();
  o2.type = 'sine'; o2.frequency.value = freq * 2;
  g2.gain.setValueAtTime(0, t);
  g2.gain.linearRampToValueAtTime(0.045, t + 0.008);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  o2.connect(g2); g2.connect(musicGain);
  o2.start(t); o2.stop(t + 0.8);
}

// 柔軟的和弦墊：慢起音三角波
function pad(freqs, t, durBeats) {
  const dur = durBeats * BEAT;
  for (const f of freqs) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.026, t + 0.7);
    g.gain.setValueAtTime(0.026, t + dur - 0.4);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.25);
    o.connect(g); g.connect(musicGain);
    o.start(t); o.stop(t + dur + 0.4);
  }
}

function scheduleLoop(t0) {
  if (document.hidden) return;              // 分頁在背景就這輪休息
  for (const [beat, freqs] of CHORDS) pad(freqs, t0 + beat * BEAT, 4);
  for (const [beat, f] of MELODY) pluck(f, t0 + beat * BEAT);
}

function startMusic() {
  if (!ready || !musicOn || musicTimer) return;
  nextLoopT = ctx.currentTime + 0.15;
  const tick = () => {
    if (!musicOn) { musicTimer = null; return; }
    if (nextLoopT < ctx.currentTime) nextLoopT = ctx.currentTime + 0.1;  // 背景回來重新對拍
    scheduleLoop(nextLoopT);
    nextLoopT += LOOP_BEATS * BEAT;
    musicTimer = setTimeout(tick, (nextLoopT - ctx.currentTime - 0.5) * 1000);
  };
  tick();
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
