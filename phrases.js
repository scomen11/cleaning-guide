// Everything someone might say to the app, for voice to choose among (see stt-worker.js):
// item names, brands, aliases, sections, and the spoken commands. Each phrase carries a
// key ("item:kyte-pants", "section:boil", "cmd") so the caller knows what it refers to.

import { ITEMS, SECTIONS, SECTION_ALIASES } from './data.js';
import { searchBest } from './search.js';

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);

export function knownPhrases(commands = []) {
  const phrases = new Map();  // text → key
  const add = (text, key) => {
    text = cap(text.replace(/\s+/g, ' ').trim());
    if (text && !phrases.has(text)) phrases.set(text, key);
  };
  for (const it of ITEMS) {
    const key = `item:${it.id}`;
    add(it.name, key);
    if (it.short) add(it.short, key);
    if (it.brand) {
      add(it.brand, key);
      add(`${it.brand} ${lower(it.name)}`, key);
    }
    for (const a of it.aliases || []) add(a, key);
    // How the brand sounds, with what the item is: "Kite pants", "Kai onesies".
    const own = (it.aliases || []).filter((a) => !it.brandSays?.includes(a));
    for (const b of it.brandSays || []) {
      add(`${b} ${lower(it.name)}`, key);
      for (const a of own) add(`${b} ${a}`, key);
    }
  }
  for (const [id, aliases] of Object.entries(SECTION_ALIASES)) {
    add(SECTIONS[id].title, `section:${id}`);
    for (const a of aliases) add(a, `section:${id}`);
  }
  for (const c of commands) add(c, 'cmd');
  return [...phrases].map(([text, key]) => ({ text, key }));
}

// Scores are the chooser's average log-probability per word-piece (0 = certain).
const SURE = -2.5;  // a best fit this good is taken as is
const FITS = -4;    // below this, nothing known fits

// What was said, from a recorded clip: the best-fitting known phrase when it's clear;
// otherwise a free transcription too, preferring an item both of them point at.
// Returns { texts (for the search, best first), how, ms }; `how` says which rule decided.
export async function understand(clip, stt) {
  const { choices, ms } = await stt.chooseClip(clip);
  const best = choices[0];
  if (best?.score >= SURE) return { texts: [best.text], how: 'sure', choices, ms };

  const heard = await stt.transcribeClip(clip);
  const found = heard.texts.length ? searchBest(heard.texts).results : [];
  const time = ms + heard.ms;
  const agreed = choices.find((c) => found.some((r) => r.strong && c.key === (r.type === 'item' ? `item:${r.id}` : r.id)));
  if (agreed) return { texts: [agreed.text], how: 'agreed', choices, heard: heard.texts, ms: time };
  if (found[0]?.score >= 0.9) return { texts: heard.texts, how: 'heard', choices, heard: heard.texts, ms: time };
  if (best?.score >= FITS) return { texts: [best.text], how: 'best guess', choices, heard: heard.texts, ms: time };
  return { texts: heard.texts, how: 'transcribed', choices, heard: heard.texts, ms: time };
}

// The alternatives of a command pattern like /^(next|next one|more)$/.
export function phrasesOf(re) {
  return re.source.replace(/^\^\(|\)\$$/g, '').split('|');
}
