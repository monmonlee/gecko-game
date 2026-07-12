// 音效：全部用 WebAudio 程式合成，不需要任何音檔
// 瀏覽器規定要有使用者手勢後才能出聲，所以由 ui 在第一次點擊時呼叫 userGesture()
let ctx = null, master = null, ready = false, on = true, dark = false;
let cricketLoop = null;

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return true;
}

export function userGesture() {
  ready = true;
  if (ensure()) startCrickets();
}

export function setOn(v) { on = v; }
export function isOn() { return on; }
export function setDark(v) { dark = v; }

function tone({ f = 440, f2, t = 0.1, type = 'sine', v = 0.12, when = 0 }) {
  if (!on || !ready || !ensure()) return;
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

export function sfx(name) { SFX[name]?.(); }

// 關燈後的夜晚蟲鳴：隨機間隔的三連唧唧聲
function chirp() {
  const base = 4100 + Math.random() * 500;
  for (let i = 0; i < 3; i++) tone({ f: base, t: 0.03, type: 'sine', v: 0.018, when: i * 0.07 });
}

function startCrickets() {
  if (cricketLoop) return;
  const loop = () => {
    cricketLoop = setTimeout(() => {
      if (dark && on && !document.hidden) chirp();
      loop();
    }, 900 + Math.random() * 2400);
  };
  loop();
}
