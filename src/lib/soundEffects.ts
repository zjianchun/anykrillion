"use client";

const SOUND_STORAGE_KEY = "anykrillion_sound_v1";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return null;
    audioCtx = new AudioCtor();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const val = window.localStorage.getItem(SOUND_STORAGE_KEY);
    return val !== "0";
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SOUND_STORAGE_KEY, enabled ? "1" : "0");
    window.dispatchEvent(new Event("anykrillion-sound-change"));
  } catch {
    // ignore storage errors
  }
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.08,
  delay = 0,
  endFreq?: number,
) {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (endFreq && endFreq > 0) {
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
  }

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.02);
}

/** Crisp sonar lock-in / rung step sound */
export function playLockInSound(): void {
  playTone(540, 0.09, "triangle", 0.07, 0, 780);
}

/** Rarity reveal sound scaled to earned points (10 to 100) */
export function playRarityRevealSound(points: number): void {
  if (points >= 85) {
    // Shimmering 4-note Lydian fanfare for One in a Krillion
    playTone(523.25, 0.14, "sine", 0.09, 0);
    playTone(659.25, 0.14, "sine", 0.09, 0.08);
    playTone(783.99, 0.16, "sine", 0.1, 0.16);
    playTone(1046.5, 0.34, "triangle", 0.11, 0.24);
  } else if (points >= 60) {
    playTone(440, 0.14, "sine", 0.08, 0);
    playTone(659.25, 0.24, "triangle", 0.09, 0.09);
  } else if (points >= 35) {
    playTone(392, 0.13, "sine", 0.07, 0);
    playTone(493.88, 0.18, "sine", 0.07, 0.08);
  } else {
    // Bubbly low Plankton tone
    playTone(310, 0.14, "sine", 0.06, 0, 220);
  }
}

/** Gentle double-thud when answer misses or timer expires */
export function playInvalidOrTimeoutSound(): void {
  playTone(190, 0.12, "sawtooth", 0.045, 0, 140);
  playTone(150, 0.18, "sawtooth", 0.045, 0.1, 110);
}

/** Subtle sonar countdown tick during the last 5 seconds */
export function playTickSound(urgent = false): void {
  playTone(urgent ? 920 : 720, 0.045, "sine", urgent ? 0.055 : 0.035, 0);
}

/** Celebratory completion arpeggio */
export function playVictorySound(): void {
  playTone(523.25, 0.12, "triangle", 0.08, 0);
  playTone(659.25, 0.12, "triangle", 0.08, 0.09);
  playTone(783.99, 0.14, "triangle", 0.09, 0.18);
  playTone(1046.5, 0.38, "sine", 0.1, 0.27);
}
