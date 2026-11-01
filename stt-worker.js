// Runs the on-phone speech model off the main thread, so the page stays responsive.
// Messages in:  { id, type: 'load' }
//               { id, type: 'phrases', list: [{ text, key }] }       what the guide knows
//               { id, type: 'transcribe', audio: Float32Array }      16 kHz mono
//               { id, type: 'choose', audio: Float32Array }          best-fitting known phrases
// Messages out: { type: 'progress', file, loaded, total } | { id, type: 'ready' }
//               | { id, type: 'text', text, ms } | { id, type: 'choices', choices, ms }
//               | { id, type: 'error', message }

import { pipeline, env, Tensor } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1/dist/transformers.min.js';

env.allowLocalModels = false;

// Moonshine Tiny: made for short English commands, ~28 MB quantized. Unlike Whisper it
// doesn't pad every clip to 30 seconds, so a two-word search transcribes quickly.
const MODEL = new URL(self.location.href).searchParams.get('model') || 'onnx-community/moonshine-tiny-ONNX';  // ?model= for tests

let asr = null;
function load() {
  if (!asr) {
    asr = pipeline('automatic-speech-recognition', MODEL, {
      dtype: 'q8',
      device: 'wasm',
      progress_callback: (p) => {
        if (p.status === 'progress') postMessage({ type: 'progress', file: p.file, loaded: p.loaded, total: p.total });
      },
    });
    asr.catch(() => { asr = null; });  // let a later attempt retry (e.g. once back online)
  }
  return asr;
}

// ── Choosing among known phrases ──
// Free transcription has to guess spellings ("Jillicad" for Jellycat). Asking instead
// "which of these phrases best fits the audio" (the probability the model gives each one)
// is far more forgiving of noise and brand names. The phrases are walked as a tree of
// word-pieces, following only the most promising branches, so each step costs one small
// batch through the model rather than one pass per phrase.

let phrases = [];
let tree = null;

function buildTree(tokenizer) {
  const root = { kids: new Map(), ends: [] };
  for (const p of phrases) {
    let node = root;
    for (const t of tokenizer.encode(p.text, { add_special_tokens: false })) {
      if (!node.kids.has(t)) node.kids.set(t, { kids: new Map(), ends: [] });
      node = node.kids.get(t);
    }
    node.ends.push(p);
  }
  return root;
}

function logSumExp(x, from, n) {
  let max = -Infinity;
  for (let i = from; i < from + n; i++) if (x[i] > max) max = x[i];
  let sum = 0;
  for (let i = from; i < from + n; i++) sum += Math.exp(x[i] - max);
  return max + Math.log(sum);
}

// The model's saved state for the surviving branches: row `rows[i]` of each cache tensor.
// (The audio half of the cache never changes after the first step, so it's carried over.)
function carryState(out, prev, rows) {
  const next = {};
  for (const name in out) {
    if (!name.startsWith('present')) continue;
    const key = name.replace('present', 'past_key_values');
    const src = name.includes('encoder') && prev ? prev[key] : out[name];
    const [, ...rest] = src.dims;
    const size = rest.reduce((a, b) => a * b, 1);
    const data = new src.data.constructor(rows.length * size);
    rows.forEach((r, i) => data.set(src.data.subarray(r * size, (r + 1) * size), i * size));
    next[key] = new Tensor(src.type, data, [rows.length, ...rest]);
  }
  return next;
}

async function choose(audio, { beam = 16, keep = 5 } = {}) {
  const { model, tokenizer, processor } = await load();
  tree ??= buildTree(tokenizer);
  const START = model.config.decoder_start_token_id ?? 1;
  const EOS = model.config.eos_token_id ?? 2;

  const { input_values } = await processor(audio);
  const hidden = (await model.sessions.model.run({ input_values: input_values.ort_tensor })).last_hidden_state;
  const [, S, D] = hidden.dims;

  let beams = [{ node: tree, lp: 0, depth: 0, tok: START }];
  let state = null;
  const found = [];
  while (beams.length) {
    const B = beams.length;
    const enc = new Float32Array(B * S * D);
    for (let i = 0; i < B; i++) enc.set(hidden.data, i * S * D);
    const out = await model({
      encoder_outputs: new Tensor('float32', enc, [B, S, D]),
      decoder_input_ids: new Tensor('int64', BigInt64Array.from(beams, (b) => BigInt(b.tok)), [B, 1]),
      past_key_values: state,
    });
    const logits = out.logits.data;
    const V = out.logits.dims.at(-1);
    const next = [];
    beams.forEach((b, i) => {
      const base = i * V;
      const lse = logSumExp(logits, base, V);
      // A phrase ending here: its score is the average log-probability per word-piece,
      // counting the model's "end of speech" too (so "Kite" doesn't beat "Kite pants").
      if (b.node.ends.length) {
        const score = (b.lp + logits[base + EOS] - lse) / (b.depth + 1);
        for (const p of b.node.ends) found.push({ ...p, score });
      }
      for (const [t, kid] of b.node.kids) next.push({ node: kid, lp: b.lp + logits[base + t] - lse, depth: b.depth + 1, tok: t, from: i });
    });
    next.sort((a, b) => b.lp - a.lp);
    beams = next.slice(0, beam);
    if (beams.length) state = carryState(out, state, beams.map((b) => b.from));
  }

  found.sort((a, b) => b.score - a.score);
  const seen = new Set();
  return found.filter((f) => !seen.has(f.key) && seen.add(f.key)).slice(0, keep)
    .map(({ text, key, score }) => ({ text, key, score: Math.round(score * 100) / 100 }));
}

self.onmessage = async ({ data }) => {
  const { id, type } = data;
  try {
    if (type === 'load') {
      await load();
      postMessage({ id, type: 'ready' });
    } else if (type === 'phrases') {
      phrases = data.list;
      tree = null;
      postMessage({ id, type: 'ready' });
    } else if (type === 'transcribe') {
      const run = await load();
      const t0 = performance.now();
      const out = await run(data.audio);
      postMessage({ id, type: 'text', text: (out.text || '').trim(), ms: Math.round(performance.now() - t0) });
    } else if (type === 'choose') {
      const t0 = performance.now();
      const choices = await choose(data.audio);
      postMessage({ id, type: 'choices', choices, ms: Math.round(performance.now() - t0) });
    }
  } catch (err) {
    postMessage({ id, type: 'error', message: String(err?.message || err) });
  }
};
