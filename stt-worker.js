// Runs the on-phone speech model off the main thread, so the page stays responsive.
// Messages in:  { id, type: 'load' } | { id, type: 'transcribe', audio: Float32Array (16 kHz mono) }
// Messages out: { type: 'progress', file, loaded, total } | { id, type: 'ready' }
//               | { id, type: 'text', text, ms } | { id, type: 'error', message }

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1/dist/transformers.min.js';

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

self.onmessage = async ({ data }) => {
  const { id, type } = data;
  try {
    if (type === 'load') {
      await load();
      postMessage({ id, type: 'ready' });
    } else if (type === 'transcribe') {
      const run = await load();
      const t0 = performance.now();
      const out = await run(data.audio);
      postMessage({ id, type: 'text', text: (out.text || '').trim(), ms: Math.round(performance.now() - t0) });
    }
  } catch (err) {
    postMessage({ id, type: 'error', message: String(err?.message || err) });
  }
};
