/**
 * Procedural audio for JolliDew. No sample files: every sound is synthesised
 * with the Web Audio API, so the game stays small and works offline.
 *
 * Browsers only allow audio after a user gesture. Mainmenu.js creates/resumes
 * the shared AudioContext during the Play click; this engine reuses it and
 * also attaches a one-shot unlock listener as a fallback.
 */

const STORE_KEY = 'jollidew:audio';

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfxBus = null;
    this.musicBus = null;
    this.musicFilter = null;
    this.noiseBuffer = null;
    this.musicTimer = null;
    this.musicStep = 0;
    this.musicRunning = false;
    this.played = 0;
    this._unlockHandler = null;

    const prefs = this.loadPrefs();
    this.sfxOn = prefs.sfx !== false;
    this.musicOn = prefs.music !== false;
  }

  loadPrefs() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      return raw && typeof raw === 'object' ? raw : {};
    } catch (e) { return {}; }
  }

  savePrefs() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ sfx: this.sfxOn, music: this.musicOn }));
    } catch (e) { /* storage can be unavailable in private mode */ }
  }

  /** Create the audio graph once. Reuses the context unlocked by Play. */
  ensure() {
    if (this.ctx) return true;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    try {
      this.ctx = window.__jolliAudioCtx || new Ctx();
      window.__jolliAudioCtx = this.ctx;

      this.master = this.ctx.createGain();
      this.master.gain.value = .5;
      this.master.connect(this.ctx.destination);

      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = this.sfxOn ? .8 : 0;
      this.sfxBus.connect(this.master);

      this.musicFilter = this.ctx.createBiquadFilter();
      this.musicFilter.type = 'lowpass';
      this.musicFilter.frequency.value = 1100;
      this.musicFilter.Q.value = .4;
      this.musicFilter.connect(this.master);

      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = this.musicOn ? .35 : 0;
      this.musicBus.connect(this.musicFilter);

      // One second of white noise, reused for whooshes and door thuds.
      const len = Math.floor(this.ctx.sampleRate * .5);
      this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      return true;
    } catch (e) {
      this.ctx = null;
      return false;
    }
  }

  /** Resume after a real user gesture, then start music if it is waiting. */
  resume() {
    if (!this.ensure()) return;
    const resume = this.ctx.state === 'suspended' ? this.ctx.resume() : Promise.resolve();
    resume.then(() => {
      if (this.musicRunning && this.musicOn) this.startMusic();
    }).catch(() => {});
  }

  attachUnlock() {
    if (this._unlockHandler) return;
    if (this.ctx && this.ctx.state === 'running') return;
    this._unlockHandler = () => {
      this.detachUnlock();
      this.resume();
    };
    document.addEventListener('pointerdown', this._unlockHandler);
    document.addEventListener('keydown', this._unlockHandler);
  }

  detachUnlock() {
    if (!this._unlockHandler) return;
    document.removeEventListener('pointerdown', this._unlockHandler);
    document.removeEventListener('keydown', this._unlockHandler);
    this._unlockHandler = null;
  }

  start() {
    this.musicRunning = true;
    this.ensure();
    this.applyVolumes();
    if (this.ctx && this.ctx.state === 'running') this.startMusic();
  }

  stop() {
    this.musicRunning = false;
    this.stopMusic();
    this.detachUnlock();
  }

  applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.sfxBus.gain.setTargetAtTime(this.sfxOn ? .8 : 0, t, .02);
    this.musicBus.gain.setTargetAtTime(this.musicOn ? .35 : 0, t, .05);
  }

  setSfx(on) {
    this.sfxOn = !!on;
    this.savePrefs();
    this.ensure();
    this.applyVolumes();
    if (this.sfxOn) this.resume();
  }

  setMusic(on) {
    this.musicOn = !!on;
    this.savePrefs();
    this.ensure();
    this.applyVolumes();
    if (this.musicOn) { this.resume(); this.startMusic(); }
    else this.stopMusic();
  }

  /* ------------------------------------------------------------------ SFX */

  playTone(freq, { end = 0, dur = .12, type = 'sine', vol = .1, delay = 0, attack = .005 } = {}) {
    if (!this.sfxOn || !this.ensure()) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (end) osc.frequency.exponentialRampToValueAtTime(Math.max(20, end), t0 + dur);
    gain.gain.setValueAtTime(.0001, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.sfxBus);
    osc.start(t0);
    osc.stop(t0 + dur + .03);
    this.played++;
  }

  noise(dur = .14, vol = .045, freq = 900, q = 1.2, delay = 0) {
    if (!this.sfxOn || !this.ensure()) return;
    const t0 = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = q;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(.0001, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + .01);
    gain.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    src.connect(filter); filter.connect(gain); gain.connect(this.sfxBus);
    src.start(t0); src.stop(t0 + dur + .02);
    this.played++;
  }

  click() {
    this.playTone(620, { end: 820, dur: .04, type: 'triangle', vol: .045 });
  }

  enter() {
    this.playTone(880, { dur: .09, type: 'triangle', vol: .055 });
    this.playTone(1320, { dur: .13, type: 'sine', vol: .04, delay: .07 });
  }

  order() {
    this.playTone(740, { dur: .07, type: 'triangle', vol: .04 });
    this.playTone(988, { dur: .09, type: 'sine', vol: .035, delay: .06 });
  }

  serve() {
    this.noise(.1, .035, 1400, 1.5);
    this.playTone(660, { dur: .07, type: 'triangle', vol: .035 });
    this.playTone(990, { dur: .1, type: 'sine', vol: .045, delay: .06 });
  }

  coin() {
    this.playTone(1318, { dur: .06, type: 'sine', vol: .06 });
    this.playTone(1760, { dur: .09, type: 'sine', vol: .05, delay: .045 });
  }

  tip() {
    [1760, 2093, 2637].forEach((f, i) => {
      this.playTone(f, { dur: .08, type: 'sine', vol: .04, delay: i * .05 });
    });
  }

  leave() {
    this.noise(.12, .03, 480, 1);
    this.playTone(230, { end: 150, dur: .16, type: 'triangle', vol: .035 });
  }

  stationUnlock() {
    [392, 523, 659, 784].forEach((f, i) => {
      this.playTone(f, { dur: .1, type: 'triangle', vol: .06, delay: i * .06 });
    });
  }

  upgrade() {
    [523, 659, 784].forEach((f, i) => {
      this.playTone(f, { dur: .09, type: 'triangle', vol: .055, delay: i * .055 });
    });
  }

  purchase() {
    this.playTone(784, { dur: .07, type: 'triangle', vol: .05 });
    this.coin();
  }

  mission() {
    [880, 1174, 1568].forEach((f, i) => {
      this.playTone(f, { dur: .13, type: 'sine', vol: .045, delay: i * .07 });
    });
  }

  levelUp() {
    [523, 659, 784, 1046].forEach((f, i) => {
      this.playTone(f, { dur: .18, type: 'triangle', vol: .07, delay: i * .1 });
    });
    this.playTone(1318, { dur: .25, type: 'sine', vol: .04, delay: .42 });
  }

  deny() {
    this.playTone(170, { end: 110, dur: .18, type: 'sawtooth', vol: .035 });
  }

  /* ---------------------------------------------------------------- music */

  startMusic() {
    if (!this.musicRunning || !this.musicOn || !this.ensure()) return;
    if (this.ctx.state !== 'running' || this.musicTimer) return;
    const chords = [
      [261.63, 329.63, 392.00], // C
      [220.00, 261.63, 329.63], // Am
      [174.61, 220.00, 261.63], // F
      [196.00, 246.94, 293.66]  // G
    ];
    const step = () => {
      if (!this.musicOn || !this.musicRunning) return;
      const chord = chords[Math.floor(this.musicStep / 2) % chords.length];
      chord.forEach((f, i) => this.musicTone(f, 2.4, .06, i * .03));
      if (this.musicStep % 4 === 0) this.musicTone(chord[0] / 2, 3.2, .07, 0, 'sine');
      if (this.musicStep % 2 === 0) this.musicTone(chord[this.musicStep % 3] * 2, .9, .022, 0, 'sine', true);
      this.musicStep++;
    };
    step();
    this.musicTimer = setInterval(step, 1600);
  }

  stopMusic() {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  musicTone(freq, dur, vol, delay = 0, type = 'triangle', bell = false) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(.0001, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + (bell ? .01 : .5));
    gain.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.musicBus);
    osc.start(t0);
    osc.stop(t0 + dur + .05);
  }
}
