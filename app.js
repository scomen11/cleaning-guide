import { ITEMS, SECTIONS } from './data.js';
import { search, searchBest, matchedWords, normalize } from './search.js';

const $ = (s) => document.querySelector(s);
const input = $('#q');
const clearBtn = $('#clear');
const homeEl = $('#home');
const resultsEl = $('#results');
const micBtn = $('#mic');
const hfBtn = $('#handsfree');
const readBtn = $('#autoread');
const statusEl = $('#status');

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
};

const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const ICON = {
  speaker: '<svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
  dishwasher: '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 7.5h16"/><circle cx="12" cy="14" r="3.5"/><path d="M7 5.3h.01M10 5.3h.01"/></svg>',
  hands: '<svg viewBox="0 0 24 24"><path d="M12 3c2.5 3 4 5.2 4 7a4 4 0 0 1-8 0c0-1.8 1.5-4 4-7z"/><path d="M4 20c2-1.5 4-2 8-2s6 .5 8 2"/></svg>',
  pot: '<svg viewBox="0 0 24 24"><path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M2 10h2M20 10h2"/><path d="M9 3.5c-.8 1 .8 2 0 3M12 3.5c-.8 1 .8 2 0 3M15 3.5c-.8 1 .8 2 0 3"/></svg>',
  cross: '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M12 8v8M8 12h8"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  drop: '<svg viewBox="0 0 24 24"><path d="M12 3.5c3 3.6 5 6.3 5 9a5 5 0 0 1-10 0c0-2.7 2-5.4 5-9z"/></svg>',
  ban: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/></svg>',
  rack: '<svg viewBox="0 0 24 24"><path d="M3 19h18"/><path d="M6 19c0-6 1-10 1-10M10 19c0-7 .5-12 .5-12M14 19c0-7-.5-12-.5-12M18 19c0-6-1-10-1-10"/></svg>',
  chev: '<svg class="row-chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>',
};
const METHOD_ICON = { dishwasher: ICON.dishwasher, hands: ICON.hands, pot: ICON.pot, cross: ICON.cross };

// ═════════════ Rendering ═════════════

function rulesOf(secId) {
  const s = SECTIONS[secId];
  return s.rules || (s.rulesFrom ? SECTIONS[s.rulesFrom].rules : null);
}

// Laundry cells read faster as short lines; notes keep their sentences intact.
function splitLines(text, commas) {
  const re = commas ? /\.\s+|;\s+|,\s+/ : /\.\s+|;\s+/;
  return text.split(re).map((s) => s.trim().replace(/\.$/, '')).filter(Boolean).map(cap);
}
const linesHtml = (text, commas) => `<ul class="lines">${splitLines(text, commas).map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`;

function hl(label, query) {
  if (!query) return esc(label);
  return matchedWords(query, label).map(({ w, hit }) => (hit ? `<mark>${esc(w)}</mark>` : esc(w))).join('');
}

const speakBtn = (key) => `<button type="button" class="speak" data-speak="${key}" aria-label="Read aloud">${ICON.speaker}</button>`;

function laundryCard(it, q, key) {
  const sec = SECTIONS[it.section];
  const title = it.brand
    ? `<div class="card-brand">${hl(it.brand, q)}</div><div class="card-name">${hl(it.name, q)}</div>`
    : `<div class="card-name solo">${hl(it.name, q)}</div>`;
  const cell = (label, c) => `
    <div class="cell tone-${c.tone}">
      <div class="cell-label">${label}</div>
      <div class="cell-head">${esc(c.head)}</div>
      ${c.text ? linesHtml(c.text, true) : ''}
    </div>`;
  const handwash = /handwash/i.test(it.wash.head);
  const spot = /spot/i.test(it.wash.head);
  const detergent = spot ? '' : handwash ? 'Unscented Eucalan' : 'Tide Free & Gentle';
  return `
    <article class="card laundry">
      <header class="card-h"><div class="card-titles">${title}</div>${speakBtn(key)}</header>
      <div class="cells">${cell('Wash', it.wash)}${cell('Dry', it.dry)}</div>
      <footer class="card-f">
        ${detergent ? `<span>${ICON.drop}${detergent}</span>` : ''}
        <span>${ICON.ban}No bleach</span>
        <span>${esc(sec.title)}</span>
      </footer>
    </article>`;
}

const PHASES = [
  ['Everyday wash', 'after each use'],
  ['Sterilize', 'once a day, first 2 months'],
  ['Clean', ''],
];
const DRY_ON_RACK = new Set(['dw-clean', 'dw-sterilize', 'boil']);

function methodHtml(it, m) {
  const sec = SECTIONS[m.section];
  const how = m.how || (m.section === 'health' ? '' : sec.how);
  const rules = sec.rules;
  const kind = m.section === 'boil' ? 'm-pot' : m.section === 'handwash' ? 'm-hands' : '';
  return `
    <div class="method ${kind}">
      ${how ? `<div class="method-how">${METHOD_ICON[sec.icon]}<span>${esc(how)}</span></div>` : ''}
      ${m.parts ? `<div class="method-row">${esc(m.parts)}</div>` : ''}
      ${m.notes ? linesHtml(m.notes, false) : ''}
      ${rules ? `<details class="rules"><summary>${esc(sec.title)} steps</summary><ul>${rules.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></details>` : ''}
    </div>`;
}

function feedingCard(it, q, key) {
  const phases = PHASES.map(([phase, note]) => {
    const ms = it.methods.filter((m) => SECTIONS[m.section].phase === phase);
    if (!ms.length) return '';
    return `
      <div class="phase">
        <div class="phase-label">${phase}${note ? `<small>${note}</small>` : ''}</div>
        ${ms.map((m) => methodHtml(it, m)).join('<div class="or">or</div>')}
      </div>`;
  }).join('');
  const rack = it.methods.some((m) => DRY_ON_RACK.has(m.section));
  return `
    <article class="card feeding">
      <header class="card-h">
        <div class="card-titles">
          <div class="card-name solo">${hl(it.name, q)}</div>
          ${it.sub ? `<div class="card-sub">${esc(it.sub)}</div>` : ''}
        </div>${speakBtn(key)}
      </header>
      ${it.note ? `<div class="card-note">${linesHtml(it.note, false)}</div>` : ''}
      ${phases}
      ${rack ? `<footer class="card-f"><span>${ICON.rack}Air-dry on the lawn rack — never towel-dry</span></footer>` : ''}
    </article>`;
}

function maintCard(it, q, key) {
  const sec = SECTIONS[it.section];
  const steps = it.notes ? splitLines(it.notes, false) : [];
  return `
    <article class="card maint">
      <header class="card-h">
        <div class="card-titles">
          <div class="card-kicker">${esc(sec.short)}</div>
          <div class="card-name solo">${hl(it.name, q)}</div>
          <div class="when">${ICON.clock}${esc(it.when)}</div>
        </div>${speakBtn(key)}
      </header>
      ${steps.length ? `<ol class="steps">${steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
    </article>`;
}

function sectionItems(secId) {
  return ITEMS.filter((it) => it.section === secId || it.methods?.some((m) => m.section === secId));
}

function sectionCard(secId, key, withButton) {
  const sec = SECTIONS[secId];
  const rules = rulesOf(secId);
  const count = sectionItems(secId).length;
  const isMaint = sec.kind === 'maintenance';
  return `
    <article class="card section ${isMaint ? 'maint' : ''}">
      <header class="card-h">
        <div class="card-titles">
          <div class="card-kicker">${esc(sec.group)}</div>
          <div class="section-title">${esc(sec.title)}</div>
        </div>${rules ? speakBtn(key) : ''}
      </header>
      ${rules ? `<ul class="rule-list">${rules.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
      ${withButton ? `<div class="more"><button type="button" class="btn" data-section="${secId}">See all ${count} ${isMaint ? 'tasks' : 'items'}</button></div>` : ''}
    </article>`;
}

function cardFor(r, q, key, inBrowse) {
  if (r.type === 'section') return sectionCard(r.sectionId, key, !inBrowse);
  const kind = SECTIONS[r.item.section].kind;
  if (kind === 'laundry') return laundryCard(r.item, q, key);
  if (kind === 'maintenance') return maintCard(r.item, q, key);
  return feedingCard(r.item, q, key);
}

function shortName(r) {
  if (r.type === 'section') return SECTIONS[r.sectionId].title;
  const it = r.item;
  if (it.brand) return it.brand.replace(/, etc\.$/, '');
  return it.name.split(/,| and /)[0];
}

function rowFor(r, key) {
  let title, sub = '', dots = '';
  if (r.type === 'section') {
    title = SECTIONS[r.sectionId].title;
    sub = 'Section overview';
  } else {
    const it = r.item;
    const sec = SECTIONS[it.section];
    title = it.brand ? `${it.brand} — ${it.name}` : it.name;
    if (sec.kind === 'laundry') {
      sub = `Wash: ${it.wash.head} · Dry: ${it.dry.head}`;
      dots = `<span class="dots"><i class="tone-${it.wash.tone}"></i><i class="tone-${it.dry.tone}"></i></span>`;
    } else if (sec.kind === 'maintenance') {
      sub = `${sec.short} · ${it.when}`;
    } else {
      const SHORT = { 'dw-clean': 'dishwasher', 'dw-sterilize': 'dishwasher', handwash: 'by hand', boil: 'boil' };
      sub = PHASES.map(([phase]) => {
        const how = [...new Set(it.methods.filter((m) => SECTIONS[m.section].phase === phase && SHORT[m.section]).map((m) => SHORT[m.section]))];
        return how.length ? `${phase === 'Everyday wash' ? 'Wash' : phase}: ${how.join(' or ')}` : '';
      }).filter(Boolean).join(' · ') || SECTIONS[it.section].title;
    }
  }
  return `
    <button type="button" class="row" data-expand="${key}">
      ${dots}
      <span class="row-text"><span class="row-title">${esc(title)}</span><span class="row-sub">${esc(sub)}</span></span>
      ${ICON.chev}
    </button>`;
}

// ═════════════ Views ═════════════

let current = { query: '', results: [], spoken: 0 };
const FULL_CARDS = 3;

function showHome() {
  current = { query: '', results: [], spoken: 0 };
  resultsEl.hidden = true;
  resultsEl.innerHTML = '';
  homeEl.hidden = false;
  clearBtn.hidden = true;
  renderRecents();
}

function renderResults(query, results) {
  current = { query, results, spoken: 0 };
  clearBtn.hidden = !query;
  if (!query.trim()) return showHome();
  homeEl.hidden = true;
  resultsEl.hidden = false;

  if (!results.length) {
    resultsEl.innerHTML = `
      <div class="empty">
        <strong>No match</strong>
        Nothing in the guide for “${esc(query)}”.<br>
        Try a brand (Kyte, Frigg), a type (socks, bottles, hat) or a machine (dishwasher).
      </div>`;
    return;
  }
  const strong = results.filter((r) => r.strong);
  const full = strong.slice(0, FULL_CARDS);
  // Beyond the close matches, only offer reasonably plausible ones.
  const rest = results.slice(full.length).filter((r) => r.strong || r.score >= results[0].score * 0.7);
  let html = full.map((r, i) => cardFor(r, query, i)).join('');
  if (rest.length) {
    html += `<h2 class="eyebrow also-h">${strong.length > full.length ? 'Also matching' : 'Maybe you meant'}</h2>`;
    html += rest.map((r, i) => rowFor(r, full.length + i)).join('');
  }
  resultsEl.innerHTML = html;
}

function showSection(secId, push = true) {
  const sec = SECTIONS[secId];
  const items = sectionItems(secId).map((it) => ({ type: 'item', id: it.id, item: it, strong: true }));
  const results = [{ type: 'section', sectionId: secId, strong: true }, ...items];
  current = { query: '', results, spoken: 0 };
  input.value = '';
  clearBtn.hidden = true;
  homeEl.hidden = true;
  resultsEl.hidden = false;
  resultsEl.innerHTML = `
    <div class="results-meta"><button type="button" class="back" data-home>${ICON.back}All sections</button><span>${esc(sec.group)}</span></div>
    ${results.map((r, i) => cardFor(r, '', i, true)).join('')}`;
  if (push) history.pushState({ section: secId }, '', `#${secId}`);
  window.scrollTo(0, 0);
}

const BROWSE = [
  ['Laundry', ['clothing', 'accessories', 'linens', 'toys']],
  ['Feeding, teething & care', ['dw-clean', 'handwash', 'dw-sterilize', 'boil', 'health']],
  ['Maintenance', ['wm-maint', 'dw-maint']],
];

function renderBrowse() {
  $('#browse').innerHTML = BROWSE.map(([group, ids]) => `
    <div class="browse-group">
      <h2>${esc(group)}</h2>
      <div class="browse-list">
        ${ids.map((id) => {
          const sec = SECTIONS[id];
          const n = sectionItems(id).length;
          const label = sec.short || sec.title;
          return `<button type="button" class="browse-btn ${sec.kind === 'maintenance' ? 'maint' : ''}" data-section="${id}">
            <span>${esc(label)}<small>${n} ${sec.kind === 'maintenance' ? 'tasks' : 'items'}</small></span></button>`;
        }).join('')}
      </div>
    </div>`).join('');
}

// ── Recents ──
function remember(r) {
  if (!r || r.type !== 'item') return;
  const list = store.get('recent', []).filter((id) => id !== r.id);
  list.unshift(r.id);
  store.set('recent', list.slice(0, 8));
}
function renderRecents() {
  const ids = store.get('recent', []).filter((id) => ITEM_BY_ID[id]);
  $('#recents').hidden = !ids.length;
  $('#recent-chips').innerHTML = ids.map((id) => {
    const it = ITEM_BY_ID[id];
    return `<button type="button" class="chip" data-item="${id}">${esc(shortName({ type: 'item', item: it }))}</button>`;
  }).join('');
}
function showItem(id) {
  const it = ITEM_BY_ID[id];
  const label = shortName({ type: 'item', item: it });
  input.value = label;
  const results = search(label);
  // Make sure the tapped item leads, even if its short name is shared.
  const rest = results.filter((r) => r.id !== id);
  renderResults(label, [{ type: 'item', id, item: it, strong: true, score: 9 }, ...rest.map((r) => ({ ...r, strong: false }))]);
  window.scrollTo(0, 0);
}

// ═════════════ Speech out ═════════════

const synth = window.speechSynthesis || null;
let voice = null;
let ttsUnlocked = false;
let speakToken = 0;

function pickVoice() {
  if (!synth) return;
  const vs = synth.getVoices();
  const en = vs.filter((v) => /^en[-_]/i.test(v.lang));
  voice = en.find((v) => /en[-_]US/i.test(v.lang) && /samantha|ava|allison|google us|aria|jenny/i.test(v.name))
    || en.find((v) => /en[-_]US/i.test(v.lang) && v.localService)
    || en.find((v) => v.localService) || en[0] || null;
}
if (synth) {
  pickVoice();
  synth.addEventListener?.('voiceschanged', pickVoice);
}

function unlockTts() {
  if (!synth || ttsUnlocked) return;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  synth.speak(u);
  ttsUnlocked = true;
}

function forSpeech(t) {
  return t
    .replace(/7AM/g, '7 A M')
    .replace(/LÍLLÉbaby/gi, 'Lillebaby')
    .replace(/BabyBjörn/g, 'Baby Bjorn')
    .replace(/\bOXO\b/g, 'O X O')
    .replace(/\b(FRIGG|HALO|BOMBAS)\b/g, (w) => cap(w.toLowerCase()))
    .replace(/(\d)\s*[–-]\s*(\d)/g, '$1 to $2')
    .replace(/\bmin\b/g, 'minutes')
    .replace(/Haakaa/g, 'Hakka')
    .replace(/\s*\+\s*/g, ' and ')
    .replace(/\s*·\s*/g, ', ')
    .replace(/\//g, ' or ')
    .replace(/\betc\./g, 'etcetera.');
}

function speechFor(r) {
  const dot = (s) => (s ? s.replace(/\.?$/, '.') : '');
  if (r.type === 'section') {
    const s = SECTIONS[r.sectionId];
    return `${s.title}. ${(rulesOf(r.sectionId) || []).map(dot).join(' ')}`;
  }
  const it = r.item;
  const sec = SECTIONS[it.section];
  if (sec.kind === 'laundry') {
    const part = (label, c) => `${label}: ${dot(c.head)} ${dot(c.text)}`;
    return `${it.brand ? dot(it.brand.replace(/, etc\.$/, '')) + ' ' : ''}${dot(it.name)} ${part('Wash', it.wash)} ${part('Dry', it.dry)}`;
  }
  if (sec.kind === 'maintenance') return `${sec.short}: ${dot(it.name)} ${dot(it.when)} ${dot(it.notes)}`;
  const phases = PHASES.map(([phase]) => {
    const ms = it.methods.filter((m) => SECTIONS[m.section].phase === phase);
    if (!ms.length) return '';
    const said = ms.map((m) => {
      const how = m.how || (m.section === 'health' ? '' : SECTIONS[m.section].how);
      return `${dot(how)} ${m.parts ? dot(m.parts.replace(' — ', ', ')) : ''} ${dot(m.notes)}`.trim();
    }).join(' Or, ');
    return phase === 'Clean' ? said : `${phase}: ${said}`;
  }).join(' ');
  return `${dot(it.name)} ${dot(it.note)} ${phases}`;
}

// Speak sentence by sentence: Chrome drops long utterances, and it lets us stop cleanly.
function speak(text, onDone, btn) {
  const token = ++speakToken;
  document.querySelectorAll('.speak.on').forEach((b) => b.classList.remove('on'));
  if (!synth) { onDone?.(); return; }
  synth.cancel();
  const chunks = forSpeech(text).match(/[^.!?]+[.!?]*/g)?.map((s) => s.trim()).filter(Boolean) || [];
  let i = 0;
  let watchdog;
  const finish = () => {
    clearTimeout(watchdog);
    if (token !== speakToken) return;
    document.body.classList.remove('speaking');
    btn?.classList.remove('on');
    onDone?.();
  };
  const next = () => {
    clearTimeout(watchdog);
    if (token !== speakToken) return;
    if (i >= chunks.length) return finish();
    const u = new SpeechSynthesisUtterance(chunks[i++]);
    if (voice) u.voice = voice;
    u.lang = voice?.lang || 'en-US';
    u.rate = 1;
    u.onend = next;
    u.onerror = next;
    synth.speak(u);
    // Safari occasionally never fires onend.
    watchdog = setTimeout(next, 2500 + u.text.length * 110);
  };
  document.body.classList.add('speaking');
  btn?.classList.add('on');
  next();
}

function stopSpeaking() {
  speakToken++;
  synth?.cancel();
  document.body.classList.remove('speaking');
  document.querySelectorAll('.speak.on').forEach((b) => b.classList.remove('on'));
}

function listJoin(xs) {
  return xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')}, and ${xs[xs.length - 1]}`;
}

function answerText(results, query) {
  if (!results.length) return `Sorry, I couldn't find ${query} in the guide.`;
  const strong = results.filter((r) => r.strong);
  let text = speechFor(results[0]);
  if (strong.length > 1) {
    const others = strong.slice(1, 4).map(shortName);
    text += ` Also matched: ${listJoin(others)}.${handsFree ? ' Say next to hear it.' : ''}`;
  }
  return text;
}

// What "next" / "repeat" step through: the close matches, or everything if only one was close.
function spokenPool() {
  const strong = current.results.filter((r) => r.strong);
  return strong.length > 1 ? strong : current.results;
}

function speakNext(onDone) {
  const pool = spokenPool();
  if (current.spoken + 1 >= pool.length) { speak('That was the last match.', onDone); return; }
  current.spoken++;
  speak(speechFor(pool[current.spoken]), onDone);
}

// ═════════════ Speech in ═════════════

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const BROKEN_KEY = `voice-broken:${standalone ? 'app' : 'browser'}`;
let voiceIn = !!SR && !store.get(BROKEN_KEY, false);
let voiceWorked = store.get('voice-worked', false);
let rec = null;
let listening = false;
let handsFree = false;
let autoRead = store.get('autoread', false);
let idleSince = 0;
let quickFails = 0;
let listenTimer;
let wakeLock = null;

function setStatus(html, warn = false) {
  statusEl.hidden = !html;
  statusEl.classList.toggle('warn', warn);
  statusEl.innerHTML = html || '';
}

function dictationHint() {
  const where = isIOS ? 'the 🎤 at the bottom of your keyboard' : 'the 🎤 on your keyboard';
  return `Tap the search box, then ${where} to dictate.`;
}

let voiceReason = SR ? '' : 'This browser doesn’t offer voice recognition.';
const MIC_BLOCKED = 'Microphone access is blocked for this page — allow it in your browser’s site settings.';

// persist: remember across visits (a platform limit), vs. just this visit (a denied prompt).
function voiceUnavailable(reason, persist = true) {
  voiceIn = false;
  if (persist) store.set(BROKEN_KEY, true);
  stopHandsFree();
  updateVoiceUi();
  voiceReason = reason || (isIOS && standalone
    ? 'iPhone doesn’t allow voice recognition in Home Screen apps.'
    : 'Voice recognition isn’t available here.');
  setStatus(`${voiceReason}<span class="hint">${dictationHint()}</span>`, true);
}

function updateVoiceUi() {
  hfBtn.classList.toggle('unavailable', !voiceIn);
  hfBtn.setAttribute('aria-disabled', String(!voiceIn));
  $('#arch-sub').textContent = voiceIn ? 'tap the mic and say any item' : 'type or dictate any item';
  input.placeholder = voiceIn ? 'Item or brand…' : 'Type or dictate an item…';
  readBtn.setAttribute('aria-pressed', String(autoRead));
}

function setListening(on) {
  listening = on;
  document.body.classList.toggle('listening', on);
  micBtn.setAttribute('aria-label', on ? 'Stop listening' : 'Speak an item');
}

function listen() {
  clearTimeout(listenTimer);
  if (!voiceIn) {
    input.focus();
    setStatus(dictationHint());
    return;
  }
  if (listening) return;
  stopSpeaking();

  const r = new SR();
  rec = r;
  r.lang = /^en/i.test(navigator.language) ? navigator.language : 'en-US';
  r.interimResults = true;
  r.maxAlternatives = 5;
  r.continuous = false;

  let started = false;
  let final = false;
  let error = null;
  const t0 = Date.now();

  const startWatch = setTimeout(() => {
    // Never started: on an iPhone Home Screen app that's the platform; elsewhere maybe a slow permission prompt.
    if (!started && rec === r) {
      r.abort?.();
      if (!voiceWorked) voiceUnavailable(isIOS && standalone ? '' : 'Voice didn’t start.', isIOS && standalone);
    }
  }, 8000);

  r.onstart = () => {
    started = true;
    clearTimeout(startWatch);
    setListening(true);
    setStatus(handsFree
      ? 'Listening… <span class="hint">Say an item, or “repeat”, “next”, “stop”</span>'
      : 'Listening…');
  };
  r.onresult = (e) => {
    const res = e.results[e.results.length - 1];
    const heard = Array.from(e.results).map((x) => x[0].transcript).join(' ').trim();
    if (!res.isFinal) {
      setStatus(`<span class="heard">“${esc(heard)}”</span>`);
      return;
    }
    final = true;
    const alts = Array.from(res).map((a) => a.transcript.trim()).filter(Boolean);
    if (e.results.length > 1) alts.unshift(heard);
    handleUtterance(alts);
  };
  r.onerror = (e) => { error = e.error; };
  r.onend = () => {
    clearTimeout(startWatch);
    if (rec === r) rec = null;
    setListening(false);
    if (final) return;
    if (error === 'not-allowed' || error === 'service-not-allowed') {
      if (error === 'service-not-allowed' || (isIOS && standalone)) return voiceUnavailable();
      if (!voiceWorked) return voiceUnavailable(MIC_BLOCKED, false);
      // Permission withdrawn mid-session, or a restart without a tap (iOS): pause hands-free.
      stopHandsFree();
      return setStatus('Tap the mic to keep going.');
    }
    if (error === 'network') { stopHandsFree(); return setStatus('Voice needs an internet connection.<span class="hint">Typing works offline.</span>', true); }
    if (error === 'audio-capture') { stopHandsFree(); return setStatus('No microphone found.', true); }
    if (handsFree) {
      quickFails = Date.now() - t0 < 700 ? quickFails + 1 : 0;
      if (quickFails > 3) { stopHandsFree(); return setStatus('Voice stopped responding. Tap the mic to try again.', true); }
      return listenSoon(150);
    }
    setStatus('');
  };

  try {
    r.start();
  } catch {
    clearTimeout(startWatch);
    rec = null;
    if (!voiceWorked) voiceUnavailable('', isIOS && standalone);
  }
}

function stopListening() {
  clearTimeout(listenTimer);
  rec?.abort?.();
  rec = null;
  setListening(false);
}

function listenSoon(delay = 250) {
  if (!handsFree) return;
  if (Date.now() - idleSince > 3 * 60 * 1000) {
    stopHandsFree();
    speak('Hands-free is off.');
    setStatus('Hands-free turned off after 3 quiet minutes.');
    return;
  }
  clearTimeout(listenTimer);
  listenTimer = setTimeout(listen, delay);
}

const CMD_STOP = /^(stop|stop listening|cancel|exit|quit|done|i m done|im done|that s all|thats all|that s it|thats it|goodbye|bye|turn off|hands free off|off|thank you|thanks)$/;
const CMD_REPEAT = /^(repeat|repeat that|again|say that again|say it again|what|pardon|come again|one more time)$/;
const CMD_NEXT = /^(next|next one|the next one|more|other|another|what else|skip|other one)$/;

function handleUtterance(alts) {
  if (!voiceWorked) { voiceWorked = true; store.set('voice-worked', true); }
  idleSince = Date.now();
  quickFails = 0;
  const after = () => (handsFree ? listenSoon() : undefined);
  const n = normalize(alts[0] || '');

  if (CMD_STOP.test(n) && handsFree) {
    stopHandsFree();
    speak('Okay, hands-free off.');
    return;
  }
  if (CMD_REPEAT.test(n) && current.results.length) {
    setStatus('');
    speak(current.spoken ? speechFor(spokenPool()[current.spoken]) : answerText(current.results, current.query), after);
    return;
  }
  if (CMD_NEXT.test(n) && current.results.length) {
    setStatus('');
    speakNext(after);
    return;
  }

  const { query, results } = searchBest(alts);
  input.value = query;
  renderResults(query, results);
  window.scrollTo(0, 0);
  remember(results[0]);
  setStatus(results.length ? '' : `<span class="heard">Heard “${esc(query)}”</span>`);

  if (handsFree || autoRead) speak(answerText(results, query), after);
  else after();
}

async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
    else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch { /* not supported or denied */ }
}

function startHandsFree() {
  handsFree = true;
  idleSince = Date.now();
  quickFails = 0;
  hfBtn.setAttribute('aria-pressed', 'true');
  document.body.classList.add('handsfree');
  keepAwake(true);
  setStatus('Hands-free on <span class="hint">Say an item, or “repeat”, “next”, “stop”</span>');
  speak('Hands-free on. Say an item.', () => listenSoon(100));
}

function stopHandsFree() {
  if (!handsFree) return;
  handsFree = false;
  hfBtn.setAttribute('aria-pressed', 'false');
  document.body.classList.remove('handsfree');
  stopListening();
  keepAwake(false);
  setStatus('');
}

// ═════════════ Events ═════════════

let typingTimer;
input.addEventListener('input', () => {
  clearTimeout(typingTimer);
  clearBtn.hidden = !input.value;
  typingTimer = setTimeout(() => {
    const q = input.value;
    renderResults(q, search(q));
  }, 90);
});

$('#searchform').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = input.value;
  const results = search(q);
  renderResults(q, results);
  remember(results[0]);
  input.blur();
  window.scrollTo(0, 0);
});

clearBtn.addEventListener('click', () => {
  input.value = '';
  showHome();
  input.focus();
});

// Hide the voice dock while the on-screen keyboard is up.
function updateTyping() {
  const focused = document.activeElement === input;
  const vv = window.visualViewport;
  const keyboard = vv ? window.innerHeight - vv.height > 120 : focused;
  document.body.classList.toggle('typing', focused && keyboard);
}
input.addEventListener('focus', () => { setTimeout(updateTyping, 300); });
input.addEventListener('blur', () => { document.body.classList.remove('typing'); });
window.visualViewport?.addEventListener('resize', updateTyping);

micBtn.addEventListener('click', () => {
  unlockTts();
  if (listening) {
    stopListening();
    if (handsFree) stopHandsFree();
    setStatus('');
    return;
  }
  if (document.body.classList.contains('speaking')) stopSpeaking();
  listen();
});

hfBtn.addEventListener('click', () => {
  unlockTts();
  if (!voiceIn) {
    const why = isIOS && standalone
      ? 'Hands-free needs voice recognition, which iPhone only allows in Safari — open this page in Safari instead of from the Home Screen.'
      : `Hands-free needs voice recognition. ${voiceReason || 'It isn’t available here.'}`;
    setStatus(why, true);
    return;
  }
  if (handsFree) {
    stopHandsFree();
    stopSpeaking();
  } else {
    startHandsFree();
  }
});

readBtn.addEventListener('click', () => {
  unlockTts();
  autoRead = !autoRead;
  store.set('autoread', autoRead);
  readBtn.setAttribute('aria-pressed', String(autoRead));
  if (!autoRead) stopSpeaking();
  setStatus(autoRead ? 'Answers to voice searches will be read aloud.' : '');
  clearTimeout(readBtn._t);
  readBtn._t = setTimeout(() => { if (!listening && !handsFree) setStatus(''); }, 2500);
});

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-speak],[data-expand],[data-section],[data-item],[data-home]');
  if (!t) return;
  if (t.dataset.speak != null) {
    unlockTts();
    const r = current.results[+t.dataset.speak];
    if (!r) return;
    if (t.classList.contains('on')) { stopSpeaking(); return; }
    if (listening) stopListening();
    remember(r);
    speak(speechFor(r), handsFree ? () => listenSoon() : null, t);
  } else if (t.dataset.expand != null) {
    const i = +t.dataset.expand;
    const r = current.results[i];
    remember(r);
    const wrap = document.createElement('div');
    wrap.innerHTML = cardFor(r, current.query, i);
    t.replaceWith(wrap.firstElementChild);
  } else if (t.dataset.section) {
    showSection(t.dataset.section);
  } else if (t.dataset.item) {
    showItem(t.dataset.item);
  } else if (t.dataset.home != null) {
    history.back();
  }
});

window.addEventListener('popstate', (e) => {
  if (e.state?.section) showSection(e.state.section, false);
  else { input.value = ''; showHome(); }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopHandsFree();
    stopListening();
    stopSpeaking();
  }
});

// ═════════════ Boot ═════════════

renderBrowse();
updateVoiceUi();
const startSection = location.hash.slice(1);
if (SECTIONS[startSection]) {
  history.replaceState(null, '', location.pathname);
  showSection(startSection);
} else {
  showHome();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
