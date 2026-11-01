// On-phone speech recognition: records one utterance, stops by itself when the speaker
// goes quiet, and transcribes it with a small speech model (see stt-worker.js).
// Used on iPhone, whose built-in recognition goes deaf after the first use
// (https://bugs.webkit.org/show_bug.cgi?id=321436).

export const MODEL_MB = 28;
const CACHED_KEY = 'stt-model-cached';

export const supported = !!(navigator.mediaDevices?.getUserMedia && (window.AudioContext || window.webkitAudioContext) && window.Worker);

let worker = null;
let nextId = 0;
const waiting = new Map();  // id → { resolve, reject }
const fileProgress = new Map();
let progressListener = null;
let loading = null;
let ready = false;

function call(type, extra = {}, transfer = []) {
  if (!worker) {
    const url = new URL('./stt-worker.js', import.meta.url);
    if (self.__sttModel) url.searchParams.set('model', self.__sttModel);  // tests compare models
    worker = new Worker(url, { type: 'module' });
    worker.onmessage = ({ data }) => {
      if (data.type === 'progress') {
        fileProgress.set(data.file, data);
        progressListener?.(progress());
        return;
      }
      const w = waiting.get(data.id);
      if (!w) return;
      waiting.delete(data.id);
      if (data.type === 'error') w.reject(new Error(data.message));
      else w.resolve(data);
    };
    worker.onerror = (e) => {
      for (const w of waiting.values()) w.reject(new Error(e.message || 'speech worker failed'));
      waiting.clear();
    };
  }
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    waiting.set(id, { resolve, reject });
    worker.postMessage({ id, type, ...extra }, transfer);
  });
}

// Download progress across the model files, 0–1.
function progress() {
  let loaded = 0, total = 0;
  for (const p of fileProgress.values()) { loaded += p.loaded || 0; total += p.total || 0; }
  return total ? loaded / total : 0;
}

export const isReady = () => ready;
export function isCached() {
  try { return localStorage.getItem(CACHED_KEY) === '1'; } catch { return false; }
}

// Loads the model (downloading it the first time). Safe to call repeatedly.
export function loadModel(onProgress) {
  if (onProgress) progressListener = onProgress;
  if (!loading) {
    loading = call('load').then(() => {
      ready = true;
      try { localStorage.setItem(CACHED_KEY, '1'); } catch { /* private mode */ }
    });
    loading.catch(() => { loading = null; });
  }
  return loading;
}

// What the guide knows (see phrases.js), for chooseClip() to pick from.
export function setPhrases(list) {
  return call('phrases', { list });
}

// The known phrases that best fit the speech, best first: [{ text, key, score }], where
// score is the average log-probability per word-piece (0 is certain; below about -3, a guess).
export async function chooseClip({ audio, start, end }) {
  await loadModel();
  const a = Math.max(0, Math.round((start - 0.1) * 16000));
  const b = Math.min(audio.length, Math.round((end + 0.3) * 16000));
  const { choices, ms } = await call('choose', { audio: audio.slice(a, b) });
  return { choices, ms };
}

export async function transcribe(audio) {
  await loadModel();
  const { text, ms } = await call('transcribe', { audio }, [audio.buffer]);
  return { text, ms };
}

// ── Recording ──

let ctx = null;

// Call inside the tap: iOS only lets audio start from a user gesture.
export function primeAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  ctx ??= new AC();
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
}

// Records until the speaker has said something and gone quiet (or gives up).
// Returns { promise, stop, cancel }: promise resolves to a clip { audio (16 kHz mono),
// start, end (seconds of speech within it) }, or null if nothing was said.
// stop() ends now and keeps any speech; cancel() discards it.
export function recordUtterance({ onSpeech, onLevel, waitMs = 7000, tailMs = 900, maxMs = 10000 } = {}) {
  let end = null;
  const rec = { cancelled: false, stop: () => end?.(true), cancel: () => { rec.cancelled = true; end?.(false); } };
  rec.promise = (async () => {
    primeAudio();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    if (rec.cancelled) { stream.getTracks().forEach((t) => t.stop()); return null; }
    const rate = ctx.sampleRate;
    const src = ctx.createMediaStreamSource(stream);
    const proc = ctx.createScriptProcessor(2048, 1, 1);
    const chunks = [];
    let ms = 0;
    let floor = null;     // background noise level
    let loudRun = 0;      // consecutive loud chunks
    let speechAt = -1;    // ms when speech began
    let lastLoud = 0;
    let peak = 0;

    return new Promise((resolve) => {
      let done = false;
      end = (keep) => {
        if (done) return;
        done = true;
        proc.onaudioprocess = null;
        try { src.disconnect(); proc.disconnect(); } catch { /* already */ }
        // Release the mic right away: the iPhone's mic light goes off and read-aloud plays normally.
        stream.getTracks().forEach((t) => t.stop());
        onLevel?.({ floor, peak });
        resolve(keep && speechAt >= 0 ? clipOf(chunks, rate, speechAt, Math.max(lastLoud, speechAt + 200)) : null);
      };
      proc.onaudioprocess = (e) => {
        const x = e.inputBuffer.getChannelData(0);
        chunks.push(new Float32Array(x));
        ms += (x.length / rate) * 1000;
        let sum = 0;
        for (let i = 0; i < x.length; i++) sum += x[i] * x[i];
        const rms = Math.sqrt(sum / x.length);
        if (rms > peak) peak = rms;
        if (floor == null) floor = rms;
        const loud = rms > Math.max(0.01, floor * 3);
        if (!loud) floor = floor * 0.9 + rms * 0.1;
        loudRun = loud ? loudRun + 1 : 0;
        if (loud) lastLoud = ms;
        // A few loud chunks in a row is speech, not a click or a bump.
        if (speechAt < 0 && loudRun >= 3) { speechAt = ms - 3 * (x.length / rate) * 1000; onSpeech?.(); }
        if (speechAt >= 0 && ms - lastLoud > tailMs) end(true);
        else if (speechAt < 0 && ms > waitMs) end(false);
        else if (ms > maxMs) end(true);
      };
      src.connect(proc);
      proc.connect(ctx.destination);  // ScriptProcessor only runs when connected; it outputs silence
    });
  })();
  return rec;
}

// The recording as 16 kHz mono (what the model expects), from shortly before speech began.
function clipOf(chunks, rate, speechAt, speechEnd) {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const all = new Float32Array(total);
  let o = 0;
  for (const c of chunks) { all.set(c, o); o += c.length; }
  const fromMs = Math.max(0, speechAt - 500);
  const src = all.subarray(Math.floor((fromMs / 1000) * rate));
  const ratio = rate / 16000;
  const audio = new Float32Array(Math.floor(src.length / ratio));
  for (let i = 0; i < audio.length; i++) {
    const p = i * ratio;
    const j = Math.floor(p);
    const f = p - j;
    audio[i] = src[j] * (1 - f) + (src[j + 1] ?? src[j]) * f;
  }
  if (self.__keepAudio) self.__lastAudio = audio.slice();  // for tests/voice.html?apptest
  return { audio, start: (speechAt - fromMs) / 1000, end: (speechEnd - fromMs) / 1000 };
}

// The model sometimes returns nothing (or a near miss) depending on how much silence
// surrounds the words, so transcribe a tight and a looser cut, and a bare one if both
// come back empty. Returns every distinct transcript; the search picks the best match.
const CUTS = [[0.05, 0.15], [0.3, 0.6], [0, 0]];

export async function transcribeClip({ audio, start, end }) {
  const texts = [];
  let ms = 0;
  for (const [i, [before, after]] of CUTS.entries()) {
    if (i === 2 && texts.length) break;
    const a = Math.max(0, Math.round((start - before) * 16000));
    const b = Math.min(audio.length, Math.round((end + after) * 16000));
    const r = await transcribe(audio.slice(a, b));
    ms += r.ms;
    if (/[a-z0-9]/i.test(r.text) && !texts.includes(r.text)) texts.push(r.text);
  }
  return { texts, ms };
}
