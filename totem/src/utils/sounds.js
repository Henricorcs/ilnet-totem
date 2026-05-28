// Sons sintetizados via Web Audio API — sem arquivos externos.
// Funciona offline e tem latência zero.

let ctx;
let enabled = true;
let resumed = false;

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

// Browsers bloqueiam audio até a primeira interação. Chame em qualquer click/touch.
export function resumeAudio() {
  if (resumed) return;
  const c = getCtx();
  if (!c) return;
  try { c.resume(); resumed = true; } catch {}
}

export function setSoundEnabled(v) { enabled = !!v; }

function tone({
  freq = 440, duration = 0.1, type = 'sine',
  gain = 0.2, attack = 0.005, release = 0.05,
  freqEnd = null,
} = {}) {
  if (!enabled) return;
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd != null) osc.frequency.linearRampToValueAtTime(freqEnd, t + duration);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration + release);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + duration + release + 0.02);
}

// Click curto pra teclado
export function playClick() {
  tone({ freq: 1200, duration: 0.025, type: 'square', gain: 0.06, release: 0.02 });
}

// Cada reel parando — thunk grave
export function playReelStop() {
  tone({ freq: 220, duration: 0.05, type: 'square', gain: 0.18, freqEnd: 80 });
  setTimeout(() => tone({ freq: 70, duration: 0.08, type: 'sine', gain: 0.12 }), 25);
}

// Whir contínuo enquanto gira
export function playSpinStart() {
  if (!enabled) return;
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(100, t);
  osc.frequency.linearRampToValueAtTime(180, t + 0.4);
  osc.frequency.linearRampToValueAtTime(150, t + 2.5);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.04, t + 0.05);
  g.gain.linearRampToValueAtTime(0.03, t + 2.0);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + 2.7);
}

// Fanfarra de vitória (C maior arpejado + sino)
export function playWin() {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
  notes.forEach((n, i) => {
    setTimeout(() => tone({
      freq: n, duration: 0.22, type: 'triangle', gain: 0.20, attack: 0.01, release: 0.15,
    }), i * 100);
  });
  // Brilho final
  setTimeout(() => tone({
    freq: 1318.5, duration: 0.5, type: 'triangle', gain: 0.22, attack: 0.02, release: 0.4,
  }), 500);
  setTimeout(() => tone({
    freq: 1568, duration: 0.6, type: 'sine', gain: 0.14, attack: 0.05, release: 0.5,
  }), 600);
}

// Som suave de "ops" pra tela de derrota
export function playLose() {
  tone({ freq: 440, duration: 0.25, type: 'triangle', gain: 0.18, freqEnd: 220, release: 0.15 });
}
