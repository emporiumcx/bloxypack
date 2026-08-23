const STORAGE_KEY = "bp-sfx-volume";
const DEFAULT_VOLUME = 50;
const DEFAULT_THROTTLE_MS = 45;

const CATALOG = {
  click: { src: "/sounds/games/click.mp3", gain: 0.25 },
  safe: { src: "/sounds/games/tile1.mp3", gain: 0.45 },
  bomb: { src: "/sounds/games/bomb.mp3", gain: 0.5 },
  win: { src: "/sounds/games/win.mp3", gain: 0.15 },
  spin_start: { src: "/sounds/cases/spin_start.mp3", gain: 0.1 },
  spin_tick: { src: "/sounds/cases/spin_tick.mp3", gain: 0.7 },
  hit_basic: { src: "/sounds/cases/hit_basic.mp3", gain: 1 },
  hit_purple: { src: "/sounds/cases/hit_purple.mp3", gain: 1 },
  hit_red: { src: "/sounds/cases/hit_red.mp3", gain: 1 },
  hit_gold: { src: "/sounds/cases/hit_gold.mp3", gain: 1 },
} as const;

export type SfxName = keyof typeof CATALOG;

const listeners = new Set<(volume: number) => void>();
const lastPlayed = new Map<SfxName, number>();
const buffers = new Map<SfxName, AudioBuffer>();
let cached: number | null = null;
let previewAt = 0;
let ctx: AudioContext | null = null;
const fallback: Partial<Record<SfxName, HTMLAudioElement>> = {};

function clamp(volume: number) {
  return Math.max(0, Math.min(100, Math.round(volume)));
}

function readStoredVolume() {
  if (typeof window === "undefined") return DEFAULT_VOLUME;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw == null || raw.trim() === "") return DEFAULT_VOLUME;
  const n = Number(raw);
  return Number.isFinite(n) ? clamp(n) : DEFAULT_VOLUME;
}

export function getSfxVolume() {
  if (cached !== null) return cached;
  cached = readStoredVolume();
  return cached;
}

export function setSfxVolume(volume: number) {
  cached = clamp(volume);
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, String(cached));
  listeners.forEach((fn) => fn(cached!));
}

export function subscribeSfxVolume(fn: (volume: number) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function audioContext() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

async function decode(name: SfxName) {
  const ac = audioContext();
  if (!ac || buffers.has(name)) return;
  const res = await fetch(CATALOG[name].src);
  const raw = await res.arrayBuffer();
  const buf = await ac.decodeAudioData(raw.slice(0));
  buffers.set(name, buf);
}

function canPlay(name: SfxName) {
  if (typeof document !== "undefined" && document.visibilityState === "hidden") return false;
  const now = Date.now();
  const prev = lastPlayed.get(name) ?? 0;
  if (now - prev < DEFAULT_THROTTLE_MS) return false;
  lastPlayed.set(name, now);
  return true;
}

function playBuffer(name: SfxName, volume: number) {
  const ac = audioContext();
  const buf = buffers.get(name);
  if (!ac || !buf) return false;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const gain = ac.createGain();
  gain.gain.value = volume;
  src.connect(gain);
  gain.connect(ac.destination);
  src.start();
  return true;
}

function playFallback(name: SfxName, volume: number) {
  if (name === "spin_tick") {
    let el = fallback[name];
    if (!el) {
      el = new Audio(CATALOG[name].src);
      el.preload = "auto";
      fallback[name] = el;
    }
    el.volume = volume;
    try {
      el.currentTime = 0;
    } catch {
      /* ignore */
    }
    void el.play().catch(() => {});
    return;
  }
  const audio = new Audio(CATALOG[name].src);
  audio.volume = volume;
  void audio.play().catch(() => {});
}

export function unlockSfx() {
  if (typeof window === "undefined") return;
  audioContext();
  (Object.keys(CATALOG) as SfxName[]).forEach((name) => {
    void decode(name);
  });
}

export function playSfx(name: SfxName) {
  if (typeof window === "undefined") return;
  const master = getSfxVolume() / 100;
  if (master <= 0) return;
  if (!canPlay(name)) return;
  const volume = Math.min(1, CATALOG[name].gain * master);
  if (playBuffer(name, volume)) return;
  void decode(name);
  playFallback(name, volume);
}

export function previewSfxVolume(volume: number) {
  setSfxVolume(volume);
  const now = performance.now();
  if (now - previewAt < 90) return;
  previewAt = now;
  playSfx("click");
}

export function preloadSfx() {
  unlockSfx();
}
