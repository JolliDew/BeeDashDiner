/**
 * Procedural audio for BeeDashDiner. No sample files: every sound is synthesised
 * with the Web Audio API, so the game stays small and works offline.
 *
 * Mixing follows a simple game-audio chain:
 *   sources -> SFX / music buses -> gentle low-pass -> compressor -> master
 * with a shared convolution reverb, music ducking under important events and
 * separate perceptual volume controls.
 */

const STORE_KEY = 'jollidew:audio';
const clamp = (v, min, max) => Math.max(min, Math.min(max, Number(v) || 0));
const gainFor = v => Math.pow(clamp(v, 0, 100) / 100, 2);

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.compressor = null;
    this.sfxBus = null;
    this.sfxFilter = null;
    this.sfxSend = null;
    this.musicBus = null;
    this.musicFilter = null;
    this.musicSend = null;
    this.reverb = null;
    this.wet = null;
    this.noiseBuffer = null;
    this.musicTimer = null;
    this.duckTimer = null;
    this.musicStep = 0;
    this.musicRunning = false;
    this.played = 0;
    this._unlockHandler = null;

    const prefs = this.loadPrefs();
    // Migrate the first version's on/off booleans.
    this.sfxVol = clamp(prefs.sfxVol ?? (prefs.sfx === false ? 0 : 70), 0, 100);
    this.musicVol = clamp(prefs.musicVol ?? (prefs.music === false ? 0 : 45), 0, 100);
  }

  get sfxOn() { return this.sfxVol > 0; }
  get musicOn() { return this.musicVol > 0; }

  loadPrefs() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      return raw && typeof raw === 'object' ? raw : {};
    } catch (e) { return {}; }
  }

  savePrefs() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ sfxVol: this.sfxVol, musicVol: this.musicVol }));
    } catch (e) { /* storage can be unavailable in private mode */ }
  }

  makeImpulse(seconds = 2.4, decay = 2.6) {
    const rate = this.ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buffer = this.ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buffer;
  }

  /** Create the audio graph once. Reuses the context unlocked by Play. */
  ensure() {
    if (this.ctx) return true;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    try {
      this.ctx = window.__jolliAudioCtx || new Ctx();
      window.__jolliAudioCtx = this.ctx;

      // Headroom + gentle limiting so overlapping coins/fanfares never clip.
      this.master = this.ctx.createGain();
      this.master.gain.value = .7;
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -18;
      this.compressor.knee.value = 24;
      this.compressor.ratio.value = 3;
      this.compressor.attack.value = .01;
      this.compressor.release.value = .25;
      this.master.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);

      this.sfxBus = this.ctx.createGain();
      this.sfxFilter = this.ctx.createBiquadFilter();
      this.sfxFilter.type = 'lowpass';
      this.sfxFilter.frequency.value = 4200;
      this.sfxFilter.Q.value = .3;
      this.sfxBus.connect(this.sfxFilter);
      this.sfxFilter.connect(this.master);

      this.musicBus = this.ctx.createGain();
      this.musicFilter = this.ctx.createBiquadFilter();
      this.musicFilter.type = 'lowpass';
      this.musicFilter.frequency.value = 1200;
      this.musicFilter.Q.value = .4;
      this.musicBus.connect(this.musicFilter);
      this.musicFilter.connect(this.master);

      // One shared, short room reverb. It takes the edge off the synthesis.
      this.reverb = this.ctx.createConvolver();
      this.reverb.buffer = this.makeImpulse();
      this.wet = this.ctx.createGain();
      this.wet.gain.value = .16;
      this.reverb.connect(this.wet);
      this.wet.connect(this.master);

      this.sfxSend = this.ctx.createGain();
      this.sfxSend.gain.value = .08;
      this.sfxFilter.connect(this.sfxSend);
      this.sfxSend.connect(this.reverb);

      this.musicSend = this.ctx.createGain();
      this.musicSend.gain.value = .18;
      this.musicFilter.connect(this.musicSend);
      this.musicSend.connect(this.reverb);

      const len = Math.floor(this.ctx.sampleRate * .5);
      this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

      this.applyVolumes();
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

  pause() {
    this.stopMusic();
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => {});
  }

  resumeFromPause() {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        if (this.musicRunning && this.musicOn) this.startMusic();
      }).catch(() => {});
    }
  }

  applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.sfxBus.gain.setTargetAtTime(gainFor(this.sfxVol), t, .02);
    this.musicBus.gain.setTargetAtTime(gainFor(this.musicVol) * .9, t, .05);
  }

  setSfxVol(v) {
    this.sfxVol = clamp(Math.round(v), 0, 100);
    this.savePrefs();
    this.ensure();
    this.applyVolumes();
    if (this.sfxOn) this.resume();
  }

  setMusicVol(v) {
    this.musicVol = clamp(Math.round(v), 0, 100);
    this.savePrefs();
    this.ensure();
    this.applyVolumes();
    if (this.musicOn) { this.resume(); this.startMusic(); }
    else this.stopMusic();
  }

  /** Briefly lower the music so an important effect can be heard. */
  duck(strength = .62, hold = 240) {
    if (!this.ctx || !this.musicOn) return;
    const t = this.ctx.currentTime;
    const base = gainFor(this.musicVol) * .9;
    this.musicBus.gain.cancelScheduledValues(t);
    this.musicBus.gain.setTargetAtTime(base * strength, t, .03);
    clearTimeout(this.duckTimer);
    this.duckTimer = setTimeout(() => {
      if (!this.ctx) return;
      this.musicBus.gain.setTargetAtTime(base, this.ctx.currentTime, .22);
    }, hold);
  }

  /* ------------------------------------------------------------------ SFX */

  playTone(freq, { end = 0, dur = .14, type = 'sine', vol = .06, delay = 0, attack = .01 } = {}) {
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
    osc.stop(t0 + dur + .04);
    this.played++;
  }

  noise(dur = .14, vol = .025, freq = 900, q = 1, delay = 0) {
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
    gain.gain.linearRampToValueAtTime(vol, t0 + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    src.connect(filter); filter.connect(gain); gain.connect(this.sfxBus);
    src.start(t0); src.stop(t0 + dur + .03);
    this.played++;
  }

  click() {
    this.noise(.025, .02, 700, 1.2);
    this.playTone(300, { end: 240, dur: .06, type: 'sine', vol: .04 });
  }

  enter() {
    this.playTone(523.25, { dur: .10, type: 'triangle', vol: .055 });
    this.playTone(783.99, { dur: .14, type: 'sine', vol: .045, delay: .08 });
  }

  order() {
    this.playTone(659.25, { dur: .08, type: 'triangle', vol: .04 });
    this.playTone(880, { dur: .10, type: 'sine', vol: .036, delay: .07 });
  }

  serve() {
    this.duck();
    this.noise(.09, .03, 1600, 1.4);
    this.playTone(523.25, { dur: .10, type: 'triangle', vol: .055 });
    this.playTone(783.99, { dur: .15, type: 'sine', vol: .05, delay: .06 });
  }

  coin() {
    this.playTone(1046.5, { dur: .07, type: 'sine', vol: .055 });
    this.playTone(1318.5, { dur: .10, type: 'sine', vol: .045, delay: .05 });
  }

  tip() {
    this.duck();
    [1318.5, 1568, 2093].forEach((f, i) => {
      this.playTone(f, { dur: .09, type: 'sine', vol: .04, delay: i * .05 });
    });
  }

  leave() {
    this.noise(.10, .03, 420, .8);
    this.playTone(196, { end: 147, dur: .18, type: 'triangle', vol: .045 });
  }

  stationUnlock() {
    this.duck(.72, 200);
    [392, 523.25, 659.25, 783.99].forEach((f, i) => {
      this.playTone(f, { dur: .12, type: 'triangle', vol: .075, delay: i * .06 });
    });
  }

  upgrade() {
    this.duck(.75, 180);
    [440, 554.37, 659.25].forEach((f, i) => {
      this.playTone(f, { dur: .11, type: 'triangle', vol: .07, delay: i * .06 });
    });
  }

  purchase() {
    this.duck(.72, 200);
    this.playTone(523.25, { dur: .09, type: 'triangle', vol: .07 });
    this.coin();
  }

  mission() {
    this.duck(.65, 280);
    [659.25, 880, 1046.5].forEach((f, i) => {
      this.playTone(f, { dur: .16, type: 'sine', vol: .06, delay: i * .08 });
    });
  }

  levelUp() {
    this.duck(.55, 450);
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      this.playTone(f, { dur: .22, type: 'triangle', vol: .08, delay: i * .12 });
    });
    this.playTone(1318.5, { dur: .3, type: 'sine', vol: .05, delay: .5 });
  }

  deny() {
    this.playTone(196, { end: 147, dur: .20, type: 'sine', vol: .05 });
  }

  /* ---------------------------------------------------------------- music */

  startMusic() {
    if (!this.musicRunning || !this.musicOn || !this.ensure()) return;
    if (this.ctx.state !== 'running' || this.musicTimer) return;

    // Cmaj7 -> Am7 -> Fmaj7 -> G6. Warm, slow and unresolved enough to loop.
    const chords = [
      [261.63, 329.63, 392.00, 493.88],
      [220.00, 261.63, 329.63, 392.00],
      [174.61, 220.00, 261.63, 329.63],
      [196.00, 246.94, 293.66, 329.63]
    ];
    const step = () => {
      if (!this.musicOn || !this.musicRunning) return;
      const chord = chords[Math.floor(this.musicStep / 2) % chords.length];
      // Long, soft pad. Slight stagger keeps it from sounding like one organ.
      chord.forEach((f, i) => this.musicTone(f, 3.6, .055, i * .12));
      if (this.musicStep % 2 === 0) this.musicTone(chord[0] / 2, 4.2, .065, 0, 'sine');
      if (this.musicStep % 2 === 1) {
        // Sparse bell on the off-bar, always a chord tone an octave up.
        this.musicTone(chord[this.musicStep % chord.length] * 2, 1.5, .018, .15, 'sine', true);
      }
      this.musicStep++;
    };
    step();
    this.musicTimer = setInterval(step, 2200);
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
    gain.gain.linearRampToValueAtTime(vol, t0 + (bell ? .03 : .9));
    gain.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.musicBus);
    osc.start(t0);
    osc.stop(t0 + dur + .06);
  }
}
