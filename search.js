// Forgiving search over the cleaning guide: typo-tolerant, plural-insensitive,
// sound-alike aware, and robust to speech-to-text splitting/joining words.

import { ITEMS, SECTIONS, SECTION_ALIASES } from './data.js';

const STOP = new Set(`a an the my our your his her their this that these those it its
  how do does did i we you to of for on in at with and or is are be can should would could
  what whats which where about please tell me show find search look up get some any
  wash washing clean cleaning cleaned instruction instructions care guide say again
  baby babys babies item items thing things one ones`.split(/\s+/));
// Words that are stop words in general but carry meaning when nothing else matches.
const SOFT_STOP = new Set(['wash', 'washing', 'clean', 'baby', 'babys', 'babies']);

export function normalize(s) {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[’'`]/g, '')
    .replace(/&|\+/g, ' and ')
    .replace(/(\d)\s*a\.?\s*m\.?\b/g, '$1am')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function stem(w) {
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 4 && /(ss|x|ch|sh)es$/.test(w)) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

// Rough English sound-alike key: kyte≈kite, haakaa≈hakka, frigg≈frig, moonkie≈monkey.
export function phonetic(w) {
  let s = w
    .replace(/ph/g, 'f').replace(/ck|q/g, 'k').replace(/c(?=[eiy])/g, 's').replace(/c/g, 'k')
    .replace(/x/g, 'ks').replace(/z/g, 's').replace(/dg/g, 'j').replace(/gh/g, 'g')
    .replace(/wr/g, 'r').replace(/kn/g, 'n').replace(/y/g, 'i');
  const first = s[0];
  s = first + s.slice(1).replace(/[aeiouhw]/g, '');
  s = s.replace(/(.)\1+/g, '$1');
  if (/[aeiou]/.test(first)) s = 'a' + s.slice(1);
  return s;
}

function tokens(s) {
  return normalize(s).split(' ').filter(Boolean).map(stem);
}

// Damerau-Levenshtein (optimal string alignment) with early exit.
function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev2 = new Array(b.length + 1);
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    for (let j = 0; j <= b.length; j++) prev2[j] = prev[j];
    prev = cur;
  }
  return prev[b.length];
}

function allowedEdits(len) {
  if (len <= 3) return 0;
  if (len <= 5) return 1;
  if (len <= 8) return 2;
  return 3;
}

function tokenSim(q, t, tPhon) {
  if (q === t) return 1;
  if (q.length >= 3 && t.startsWith(q)) return 0.6 + 0.3 * (q.length / t.length);
  if (t.length >= 4 && q.startsWith(t)) return 0.8;
  const max = allowedEdits(Math.min(q.length, t.length));
  let best = 0;
  if (max > 0) {
    const d = editDistance(q, t, max);
    if (d <= max) best = 0.9 - 0.15 * d;
  }
  if (q.length >= 3 && t.length >= 3 && phonetic(q) === tPhon) best = Math.max(best, 0.72);
  return best;
}

// ── Build the index ─────────────────────────────────────────────
// Context words an item inherits from where it lives ("sterilize" for bottles,
// "washer" for the washer's filter). They count, but less than the item's own words.
const INHERITED = 0.8;

function entryPhrases(e) {
  const list = [e.name, e.brand, e.sub, ...(e.aliases || [])];
  for (const m of e.methods || []) list.push(m.row);
  return list.filter(Boolean);
}

function inheritedPhrases(e) {
  const secs = e.methods ? e.methods.map((m) => m.section) : [e.section];
  return secs.flatMap((id) => SECTION_ALIASES[id] || []);
}

function buildEntries() {
  const entries = ITEMS.map((it) => ({
    type: 'item', id: it.id, item: it, phrases: entryPhrases(it), context: inheritedPhrases(it),
  }));
  for (const [id, aliases] of Object.entries(SECTION_ALIASES)) {
    const sec = SECTIONS[id];
    entries.push({ type: 'section', id: 'section:' + id, sectionId: id, phrases: [sec.title, ...aliases], context: [], weight: 0.97 });
  }
  for (const e of entries) {
    const map = new Map();
    const add = (phrases, f) => {
      for (const p of phrases) {
        const toks = tokens(p);
        if (toks.length > 1) toks.push(toks.join('')); // "jelly cat" ⇄ "jellycat"
        for (const t of toks) map.set(t, Math.max(map.get(t) || 0, f));
      }
    };
    add(e.context, INHERITED);
    add(e.phrases, 1);
    e.tokens = [...map].map(([t, f]) => ({ t, p: phonetic(t), f }));
    e.text = ' ' + e.phrases.map((p) => tokens(p).join(' ')).join(' | ') + ' ';
    e.nameTokens = e.item ? tokens(e.item.name).filter((t) => !STOP.has(t)) : [];
  }
  return entries;
}

const ENTRIES = buildEntries();

function bestTokenSim(q, entry) {
  let best = 0;
  for (const { t, p, f } of entry.tokens) {
    const s = tokenSim(q, t, p) * f;
    if (s > best) { best = s; if (s === 1) break; }
  }
  return best;
}

const dfCache = new Map();
function docFreq(q) {
  if (dfCache.has(q)) return dfCache.get(q);
  let df = 0;
  for (const e of ENTRIES) if (bestTokenSim(q, e) >= 0.7) df++;
  dfCache.set(q, df);
  return df;
}

function queryUnits(raw) {
  const all = tokens(raw);
  let toks = all.filter((t) => !STOP.has(t));
  if (!toks.length) toks = all.filter((t) => SOFT_STOP.has(t));
  return toks;
}

function scoreQuery(raw) {
  const q = queryUnits(raw);
  if (!q.length) return [];
  const N = ENTRIES.length;
  const results = [];
  const phrase = ' ' + q.join(' ') + ' ';

  for (const e of ENTRIES) {
    let num = 0, den = 0;
    for (let i = 0; i < q.length; i++) {
      const df = docFreq(q[i]);
      // Words that match nothing anywhere (filler, mis-hearings) don't count against anything.
      if (df === 0) {
        // ...unless joined with a neighbour they form a known word ("jelly"+"cat").
        const joinNext = q[i + 1] ? q[i] + q[i + 1] : null;
        const joinPrev = q[i - 1] ? q[i - 1] + q[i] : null;
        let js = 0;
        if (joinNext) js = Math.max(js, bestTokenSim(joinNext, e));
        if (joinPrev) js = Math.max(js, bestTokenSim(joinPrev, e));
        if (js >= 0.75) { const w = Math.log(1 + N); num += w * js; den += w; }
        continue;
      }
      const w = Math.log(1 + N / df);
      let s = bestTokenSim(q[i], e);
      if (q[i + 1]) {
        const js = bestTokenSim(q[i] + q[i + 1], e);
        if (js > s) s = js;
      }
      num += w * s;
      den += w;
    }
    if (!den) continue;
    let score = num / den;
    if (q.length > 1 && e.text.includes(phrase)) score += 0.1;
    // Tie-break toward items *named* for what was asked ("Baby bottles" over "Mason Bottle jars…").
    if (e.nameTokens.length) {
      const hit = e.nameTokens.filter((t) => q.some((qq) => tokenSim(qq, t, phonetic(t)) >= 0.75)).length;
      score += 0.06 * (hit / e.nameTokens.length);
    }
    score *= e.weight || 1;
    if (score >= 0.62) results.push({ entry: e, score });
  }
  results.sort((a, b) => b.score - a.score);
  return results;
}

export function search(raw, limit = 8) {
  const res = scoreQuery(raw);
  if (!res.length) return [];
  const top = res[0].score;
  return res.slice(0, limit).map((r) => ({
    type: r.entry.type,
    id: r.entry.id,
    item: r.entry.item,
    sectionId: r.entry.sectionId || r.entry.item?.section,
    score: r.score,
    strong: r.score >= top * 0.86 && r.score >= 0.6,
  }));
}

// Try each speech alternative and keep whichever transcript matches best.
export function searchBest(alternatives, limit) {
  let best = { query: alternatives[0] || '', results: [] };
  let bestScore = -1;
  for (const alt of alternatives) {
    const results = search(alt, limit);
    const s = results[0]?.score ?? 0;
    if (s > bestScore + 0.02) { best = { query: alt, results }; bestScore = s; }
  }
  return best;
}

// Which words of a label match the query (for highlighting).
export function matchedWords(raw, label) {
  const q = queryUnits(raw);
  const words = label.split(/(\s+|[,/()])/);
  return words.map((w) => {
    const n = normalize(w);
    if (!n) return { w, hit: false };
    const t = stem(n.replace(/ /g, ''));
    const hit = q.some((qq) => tokenSim(qq, t, phonetic(t)) >= 0.75);
    return { w, hit };
  });
}

export { ENTRIES };
