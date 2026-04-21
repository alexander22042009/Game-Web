export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicTimer = null;
    this.muted = false;
    this.started = false;
    this.weaponSoundPool = {
      pistol: [],
      shotgun: [],
      ak47: [],
    };
    this.weaponSoundCursor = {
      pistol: 0,
      shotgun: 0,
      ak47: 0,
    };
  }

  ensureContext() {
    if (this.ctx) {
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      return;
    }
    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;
    this.musicGain.gain.value = 0.2;
    this.sfxGain.gain.value = 0.26;
    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
    this.loadWeaponSounds();
  }

  loadWeaponSounds() {
    this.loadWeaponFile(
      "pistol",
      "assets/sounds/fire_sounds/pistol/freesound_community-single-pistol-gunshot-33-37187.mp3"
    );
    this.loadWeaponFile(
      "shotgun",
      "assets/sounds/fire_sounds/shotgun/freesound_community-shotgun-firing-3-14483.mp3"
    );
    this.loadWeaponFile(
      "ak47",
      "assets/sounds/fire_sounds/ak-47/microsammy-ak-47-firing-8760.mp3"
    );
  }

  loadWeaponFile(key, src) {
    const audio = new Audio(src);
    audio.preload = "auto";
    audio.addEventListener("canplaythrough", () => {
      if (!this.weaponSoundPool[key].includes(audio)) {
        this.weaponSoundPool[key].push(audio);
      }
    });
    audio.load();
  }

  startMusic() {
    this.ensureContext();
    if (!this.ctx || this.started) {
      return;
    }
    this.started = true;
    const progression = [220, 277.18, 329.63, 246.94];
    let step = 0;
    this.musicTimer = setInterval(() => {
      if (this.muted) {
        return;
      }
      const now = this.ctx.currentTime;
      const base = progression[step % progression.length];
      this.playTone(base, 0.55, 0.05, "triangle", this.musicGain, now);
      this.playTone(base * 1.5, 0.32, 0.04, "sine", this.musicGain, now + 0.06);
      step += 1;
    }, 420);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.started = false;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 0.5;
    }
    return this.muted;
  }

  playShoot() {
    this.playTone(640, 0.09, 0.05, "sawtooth");
  }

  playWeaponShoot(weaponMode) {
    if (this.muted) {
      return;
    }
    const key = weaponMode === "SHOTGUN" ? "shotgun" : weaponMode === "AK-47" ? "ak47" : "pistol";
    const pool = this.weaponSoundPool[key];
    if (!pool || pool.length === 0) {
      this.playShoot();
      return;
    }
    const index = this.weaponSoundCursor[key] % pool.length;
    this.weaponSoundCursor[key] = index + 1;
    const source = pool[index];
    const clip = source.cloneNode();
    clip.volume = 0.45;
    clip.play().catch(() => {});
  }

  playHit() {
    this.playTone(180, 0.12, 0.08, "square");
  }

  playEnemyDeath() {
    this.playTone(120, 0.2, 0.09, "triangle");
  }

  playPickup() {
    this.playTone(880, 0.08, 0.06, "sine");
  }

  playUiClick() {
    this.playTone(520, 0.05, 0.03, "triangle");
  }

  playPortalUnlocked() {
    this.playTone(330, 0.2, 0.05, "sine");
    this.playTone(550, 0.18, 0.05, "triangle", this.sfxGain, this.ctx?.currentTime ? this.ctx.currentTime + 0.08 : 0);
  }

  playTone(freq, duration, volume, wave, output = null, startAt = null) {
    this.ensureContext();
    if (!this.ctx || this.muted) {
      return;
    }
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = startAt ?? this.ctx.currentTime;
    osc.frequency.value = freq;
    osc.type = wave;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(output ?? this.sfxGain);
    osc.start(now);
    osc.stop(now + duration);
  }
}
