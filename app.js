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
const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);

const settings = {
  theme: store.get('theme', 'auto'),   // auto | light | dark
  detail: store.get('detail', 'full'), // full | brief | name: how much an automatic answer reads aloud
  focus: store.get('focus', 'both'),   // both | wash | dry: which laundry step is read aloud
};

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

// One line naming an item: recent chips, "also matched" lists, and the name-only read-aloud.
function itemTitle(it) {
  if (it.short) return it.short;
  if (it.brand) return `${it.brand} ${lowerFirst(it.name)}`;
  const sec = SECTIONS[it.section];
  if (sec.kind === 'maintenance') return `${it.name.replace(/\s*\(.*\)/, '')} (${sec.short.toLowerCase()})`;
  return it.name.split(/,| and /)[0];
}

function shortName(r) {
  return r.type === 'section' ? SECTIONS[r.sectionId].title : itemTitle(r.item);
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
    <div class="results-meta"><button type="button" class="back" data-back>${ICON.back}Back</button><span>${esc(sec.group)}</span></div>
    ${results.map((r, i) => cardFor(r, '', i, true)).join('')}`;
  if (push) go({ section: secId });
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
function showItem(id, push = true) {
  const it = ITEM_BY_ID[id];
  const label = shortName({ type: 'item', item: it });
  input.value = label;
  const results = search(label);
  // Make sure the tapped item leads, even if its short name is shared.
  const rest = results.filter((r) => r.id !== id);
  renderResults(label, [{ type: 'item', id, item: it, strong: true, score: 9 }, ...rest.map((r) => ({ ...r, strong: false }))]);
  if (push) go({ q: label, item: id });
  window.scrollTo(0, 0);
}

// ── Back gesture ──
// Every screen is a history entry, so the phone's back swipe steps back through
// searches and sections instead of closing the app.
// States: {} home · { q, typed?, item? } results · { section } · { menu } settings open.
function go(state, replace = false) {
  const url = state.section ? `#${state.section}` : location.pathname + location.search;
  if (replace) history.replaceState(state, '', url);
  else history.pushState(state, '', url);
}

const isHomeState = (s) => !s?.q && !s?.section;

// Typing updates one entry rather than adding one per keystroke.
function noteTyped(q) {
  const s = history.state;
  if (q.trim()) go({ q, typed: true, fromHome: s?.typed ? s.fromHome : isHomeState(s) }, !!s?.typed);
  else if (s?.typed) leaveTyped();
}

// Emptying a typed search returns home without leaving a duplicate home entry behind.
function leaveTyped() {
  if (history.state.fromHome) { skipPop = true; history.back(); } else go({}, true);
}

function showState(s) {
  if (s?.section && SECTIONS[s.section]) showSection(s.section, false);
  else if (s?.item && ITEM_BY_ID[s.item]) showItem(s.item, false);
  else if (s?.q) {
    input.value = s.q;
    renderResults(s.q, search(s.q));
    window.scrollTo(0, 0);
  } else {
    input.value = '';
    showHome();
  }
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
    .replace(/\s*\(([^)]*)\)/g, ', $1')
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

const dot = (s) => (s ? s.replace(/\.?$/, '.') : '');

// The laundry steps to read, per the "Laundry: read" setting.
function laundrySteps(it) {
  return [['Wash', it.wash], ['Dry', it.dry]].filter(([label]) => settings.focus === 'both' || label.toLowerCase() === settings.focus);
}

function speechFor(r) {
  if (r.type === 'section') {
    const s = SECTIONS[r.sectionId];
    return `${s.title}. ${(rulesOf(r.sectionId) || []).map(dot).join(' ')}`;
  }
  const it = r.item;
  const sec = SECTIONS[it.section];
  if (sec.kind === 'laundry') {
    return `${dot(itemTitle(it))} ${laundrySteps(it).map(([label, c]) => `${label}: ${dot(c.head)} ${dot(c.text)}`).join(' ')}`;
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

// Straightforward mode: just the gist, e.g. "Wash: delicate cycle, cold. Dry: tumble dry low."
const BRIEF_HOW = { 'dw-clean': 'dishwasher, normal cycle', handwash: 'by hand', 'dw-sterilize': 'dishwasher, sanitize and heavy load' };

function methodGist(m) {
  let s = BRIEF_HOW[m.section];
  if (m.section === 'boil') {
    const mins = m.how?.match(/([\d–]+)\s*min/)?.[1] || '5';
    s = /bowl/i.test(m.how || '') ? `soak in boiling water, ${mins} min` : `boil ${mins} min`;
  }
  const parts = m.parts?.split(' — ')[0];
  return parts ? `${s} for ${lowerFirst(parts)}` : s;
}

function briefFor(r) {
  if (r.type === 'section') {
    const s = SECTIONS[r.sectionId];
    return `${dot(s.title)} ${dot(s.how || rulesOf(r.sectionId)?.[0])}`;
  }
  const it = r.item;
  const sec = SECTIONS[it.section];
  const title = dot(itemTitle(it));
  if (sec.kind === 'laundry') {
    return `${title} ${laundrySteps(it).map(([label, c]) => {
      const first = c.text ? lowerFirst(c.text.split(/[.,;]\s*/)[0]) : '';
      // "Tumble dry low" says more than the dryer's "Delicate cycle" heading.
      if (label === 'Dry' && c.tone !== 'no' && first) return `Dry: ${first}.`;
      return `${label}: ${lowerFirst(c.head)}${first ? `, ${first}` : ''}.`;
    }).join(' ')}`;
  }
  if (sec.kind === 'maintenance') return `${title} ${dot(it.when)}`;
  const [only] = it.methods;
  if (it.methods.length === 1 && only.notes && (only.section === 'handwash' || only.section === 'health')) {
    return `${title} ${dot(only.notes.split(/;\s*|\.\s+/)[0])}`;
  }
  return `${title} ${PHASES.map(([phase]) => {
    const ms = it.methods.filter((m) => SECTIONS[m.section].phase === phase);
    return ms.length ? `${phase === 'Everyday wash' ? 'Wash' : phase}: ${ms.map(methodGist).join(', or ')}.` : '';
  }).filter(Boolean).join(' ')}`;
}

function sayFor(r, detail = settings.detail) {
  if (detail === 'name') return dot(shortName(r));
  return detail === 'brief' ? briefFor(r) : speechFor(r);
}
// A speaker-button tap is an explicit ask, so never answer it with just the name.
const askedDetail = () => (settings.detail === 'brief' ? 'brief' : 'full');

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
  // Cancelling when nothing is playing still touches the iPhone's audio session; skip it.
  if (synth?.speaking || synth?.pending) synth.cancel();
  document.body.classList.remove('speaking');
  document.querySelectorAll('.speak.on').forEach((b) => b.classList.remove('on'));
}

function answerText(results, query) {
  // Only the top match is read; the others are on screen, and "next" reads them.
  if (!results.length) return `Sorry, I couldn't find ${query} in the guide.`;
  return sayFor(results[0]);
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
  reveal(pool[current.spoken]);
  speak(sayFor(pool[current.spoken]), onDone);
}

// Bring a result into view, opening it first if it's only a row.
function reveal(r) {
  const i = current.results.indexOf(r);
  const row = resultsEl.querySelector(`[data-expand="${i}"]`);
  const el = row ? expandRow(row) : resultsEl.querySelector(`[data-speak="${i}"]`)?.closest('.card');
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function expandRow(row) {
  const i = +row.dataset.expand;
  const wrap = document.createElement('div');
  wrap.innerHTML = cardFor(current.results[i], current.query, i);
  const card = wrap.firstElementChild;
  row.replaceWith(card);
  return card;
}

// ═════════════ Speech in ═════════════

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
// Remembered only when voice has never worked on this device/mode (a platform limit, not a hiccup).
const BROKEN_KEY = `voice-broken-v2:${standalone ? 'app' : 'browser'}`;
let voiceWorked = store.get('voice-worked', false);
let voiceIn = !!SR && !(store.get(BROKEN_KEY, false) && !voiceWorked);
let rec = null;
let listening = false;
let handsFree = false;
let autoRead = store.get('autoread', false);
let idleSince = 0;
let quickFails = 0;
let listenTimer;
let lastRec = null;  // the most recent recognizer, until it has fully ended
let startToken = 0;
let wakeLock = null;

// Recent voice events, shown by tapping the "Clean Goose" title 5 times (for debugging on a phone).
const voiceLog = [];
function logVoice(msg) {
  const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  voiceLog.push(`${t} ${msg}`);
  if (voiceLog.length > 40) voiceLog.shift();
}

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
  // A previous session that never ended (iOS can hang silently) must not block this one.
  if (rec) cancelRec(rec);
  stopSpeaking();

  // iOS holds the microphone until a session has fully ended; one started before then
  // shows "Listening…" but hears nothing. So wait (briefly) for the last one to let go.
  const token = ++startToken;
  if (lastRec && !lastRec.ended) {
    logVoice('waiting for previous session to end');
    const begin = () => { if (token === startToken) startSession(); };
    lastRec.whenEnded = begin;
    setTimeout(begin, 800);
    return;
  }
  startSession();
}

// iOS: record-and-play while listening, then back to normal playback, so an answer read
// aloud doesn't leave the audio session unable to record next time.
function audioMode(type) {
  try { if (navigator.audioSession && navigator.audioSession.type !== type) navigator.audioSession.type = type; } catch { /* unsupported */ }
}

function startSession() {
  startToken++;
  audioMode('play-and-record');
  const r = new SR();
  rec = r;
  lastRec = r;
  r.lang = /^en/i.test(navigator.language) ? navigator.language : 'en-US';
  r.interimResults = true;
  r.maxAlternatives = 5;
  r.continuous = false;

  let started = false;
  let done = false;
  let error = null;
  let heardAlts = null;
  let quietTimer;
  const audio = [];
  const t0 = Date.now();
  logVoice(`start${isIOS ? ' ios' : ''}${standalone ? ' app' : ''}${navigator.audioSession ? ` session=${navigator.audioSession.type}` : ''}`);

  // Ends the session exactly once, whichever comes first: a final result, the end
  // event, or one of the watchdogs below.
  const finish = (why) => {
    if (done) return;
    done = true;
    clearTimeout(startWatch);
    clearTimeout(quietTimer);
    if (rec === r) rec = null;
    setListening(false);
    audioMode('auto');
    logVoice(`end ${why}${error ? ` error=${error}` : ''} audio=[${audio.join(',') || 'none'}]${heardAlts ? ` heard="${heardAlts[0]}"` : ''}`);
    if (r.cancelled) return;
    // iOS often never marks results final; what it heard is still the answer.
    if (heardAlts) { handleUtterance(heardAlts); return; }
    voiceFailed(error, Date.now() - t0, started);
  };
  r.finish = finish;
  // abort, not stop: we already have what we need, and abort releases the mic at once.
  const endNow = (why) => {
    try { r.abort(); } catch { /* already ended */ }
    finish(why);
  };

  const startWatch = setTimeout(() => {
    if (started) return;
    error = error || 'start-timeout';
    endNow('no-start');
  }, 8000);
  // After speech begins, a short silence means they're done talking.
  const armQuiet = (ms) => {
    clearTimeout(quietTimer);
    quietTimer = setTimeout(() => endNow(heardAlts ? 'quiet' : 'silence'), ms);
  };

  r.onstart = () => {
    started = true;
    clearTimeout(startWatch);
    setListening(true);
    armQuiet(9000);
    setStatus(handsFree ? `Listening… <span class="hint">${handsFreeHint()}</span>` : 'Listening…');
  };
  // Logged only: shows on a phone whether the mic delivered any sound at all.
  r.onaudiostart = () => audio.push('audio');
  r.onsoundstart = () => audio.push('sound');
  r.onspeechstart = () => audio.push('speech');
  r.onresult = (e) => {
    if (done) return;
    const res = e.results[e.results.length - 1];
    const heard = Array.from(e.results).map((x) => x[0].transcript).join(' ').trim();
    const alts = Array.from(res).map((a) => a.transcript.trim()).filter(Boolean);
    if (e.results.length > 1) alts.unshift(heard);
    if (alts.length) heardAlts = alts;
    if (res.isFinal) { endNow('final'); return; }
    setStatus(`<span class="heard">“${esc(heard)}”</span>`);
    armQuiet(2000);
  };
  r.onerror = (e) => { error = e.error; logVoice(`error ${e.error}`); };
  r.onend = () => {
    r.ended = true;
    r.whenEnded?.();
    finish('onend');
  };

  try {
    r.start();
  } catch (err) {
    error = `start-threw ${err?.name || ''}`.trim();
    r.ended = true;
    finish('threw');
  }
}

function voiceFailed(error, elapsed, started) {
  const blocked = error === 'not-allowed' || error === 'service-not-allowed';
  const noStart = error === 'start-timeout' || error?.startsWith?.('start-threw');
  if ((blocked || noStart) && !voiceWorked) {
    // Has never worked here: on an iPhone Home Screen app (or a service refusal) that's the platform.
    const platform = error === 'service-not-allowed' || (isIOS && standalone);
    return voiceUnavailable(platform ? '' : blocked ? MIC_BLOCKED : 'Voice didn’t start.', platform);
  }
  if (blocked || noStart || error === 'audio-capture') {
    // Worked before, so this is a hiccup (iOS sometimes refuses a restart): keep voice on.
    stopHandsFree();
    return setStatus('Voice didn’t start that time.<span class="hint">Tap the mic to try again.</span>');
  }
  if (error === 'network') { stopHandsFree(); return setStatus('Voice needs an internet connection.<span class="hint">Typing works offline.</span>', true); }
  if (handsFree) {
    quickFails = elapsed < 700 ? quickFails + 1 : 0;
    if (quickFails > 3) { stopHandsFree(); return setStatus('Voice stopped responding. Tap the mic to try again.', true); }
    return listenSoon(150);
  }
  // Silence: say so, rather than leaving the user wondering whether it was listening.
  setStatus(started && (!error || error === 'no-speech') ? 'Didn’t catch that.<span class="hint">Tap the mic to try again.</span>' : '');
}

function cancelRec(r) {
  r.cancelled = true;
  try { r.abort(); } catch { /* ignore */ }
  r.finish?.('cancel');
}

function stopListening() {
  clearTimeout(listenTimer);
  startToken++;
  if (rec) cancelRec(rec);
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
const CMD_READ = /^(read|read it|read that|read it out|read it to me|read aloud|tell me|tell me more|more details|details|full details)$/;
// Spoken settings changes: [pattern, setting, value, confirmation].
const CMD_SETTINGS = [
  [/^(wash only|washing only|just wash|just washing|wash mode|washing mode|washing)$/, 'focus', 'wash', 'Wash only.'],
  [/^(dry only|drying only|just dry|just drying|dry mode|drying mode|drying)$/, 'focus', 'dry', 'Dry only.'],
  [/^(both|wash and dry|washing and drying|both steps)$/, 'focus', 'both', 'Wash and dry.'],
  [/^(straightforward|straight forward|straightforward mode|straight forward mode|brief|brief mode|short|short mode|keep it short)$/, 'detail', 'brief', 'Straightforward.'],
  [/^(just the name|just the names|just names|names only|name only|names|quick|quick mode|list mode)$/, 'detail', 'name', 'Just the names.'],
  [/^(everything|read everything|full|full mode|all details|every detail)$/, 'detail', 'full', 'Reading everything.'],
];

function modeTag() {
  return [{ brief: 'Straightforward', name: 'Just the name' }[settings.detail], { wash: 'Wash only', dry: 'Dry only' }[settings.focus]]
    .filter(Boolean).join(' · ');
}
function handsFreeHint() {
  const tag = modeTag();
  return `Say an item, or “${settings.detail === 'name' ? 'read it' : 'repeat'}”, “next”, “stop”${tag ? `<br>${tag}` : ''}`;
}

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
  const setting = CMD_SETTINGS.find(([re]) => re.test(n));
  if (setting) {
    const [, key, value, said] = setting;
    setSetting(key, value);
    setStatus(modeTag() || 'Reading everything, wash and dry');
    speak(said, after);
    return;
  }
  if (CMD_READ.test(n) && current.results.length) {
    setStatus('');
    speak(sayFor(spokenPool()[current.spoken], 'full'), after);
    return;
  }
  if (CMD_REPEAT.test(n) && current.results.length) {
    setStatus('');
    speak(current.spoken ? sayFor(spokenPool()[current.spoken]) : answerText(current.results, current.query), after);
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
  go({ q: query });
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
  setStatus(`Hands-free on <span class="hint">${handsFreeHint()}</span>`);
  speak('Hands-free on.', () => listenSoon(100));
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
    noteTyped(q);
  }, 90);
});

$('#searchform').addEventListener('submit', (e) => {
  e.preventDefault();
  clearTimeout(typingTimer);
  const q = input.value;
  const results = search(q);
  renderResults(q, results);
  noteTyped(q);
  remember(results[0]);
  input.blur();
  window.scrollTo(0, 0);
});

clearBtn.addEventListener('click', () => {
  input.value = '';
  showHome();
  // A half-typed search isn't worth going back to; a finished one is.
  if (history.state?.typed) leaveTyped();
  else if (!isHomeState(history.state)) go({});
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
  if (autoRead || handsFree) unlockTts();
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
  const t = e.target.closest('[data-speak],[data-expand],[data-section],[data-item],[data-back]');
  if (!t) return;
  if (t.dataset.speak != null) {
    unlockTts();
    const r = current.results[+t.dataset.speak];
    if (!r) return;
    if (t.classList.contains('on')) { stopSpeaking(); return; }
    if (listening) stopListening();
    remember(r);
    speak(sayFor(r, askedDetail()), handsFree ? () => listenSoon() : null, t);
  } else if (t.dataset.expand != null) {
    remember(current.results[+t.dataset.expand]);
    expandRow(t);
  } else if (t.dataset.section) {
    showSection(t.dataset.section);
  } else if (t.dataset.item) {
    showItem(t.dataset.item);
  } else if (t.dataset.back != null) {
    history.back();
  }
});

// ── Settings menu ──
const menuEl = $('#menu');
const THEME_COLOR = { light: '#EBF3F7', dark: '#121618' };
let skipPop = false;

function applyTheme() {
  const t = settings.theme;
  if (t === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    m.content = THEME_COLOR[t === 'auto' ? (/dark/.test(m.media) ? 'dark' : 'light') : t];
  });
}

function setSetting(key, value) {
  settings[key] = value;
  store.set(key, value);
  if (key === 'theme') applyTheme();
  syncMenu();
}

function syncMenu() {
  for (const key of Object.keys(settings)) {
    const el = menuEl.querySelector(`input[name="${key}"][value="${settings[key]}"]`);
    if (el) el.checked = true;
  }
}

$('#menu-btn').addEventListener('click', () => {
  syncMenu();
  menuEl.showModal();
  // So the back gesture closes the menu rather than leaving the page under it.
  history.pushState({ ...(history.state || {}), menu: true }, '');
});
menuEl.addEventListener('change', (e) => {
  if (e.target.name in settings) setSetting(e.target.name, e.target.value);
});
menuEl.addEventListener('click', (e) => {
  // The dialog element itself is only hit on the backdrop around the sheet.
  if (e.target === menuEl || e.target.closest('[data-close]')) menuEl.close();
});
menuEl.addEventListener('close', () => {
  if (history.state?.menu) { skipPop = true; history.back(); }
});

window.addEventListener('popstate', (e) => {
  if (skipPop) { skipPop = false; return; }
  // Back while the menu is open just closes it; the screen underneath is unchanged.
  if (menuEl.open) { menuEl.close(); return; }
  showState(e.state);
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopHandsFree();
    stopListening();
    stopSpeaking();
  }
});

let titleTaps = [];
$('.arch h1').addEventListener('click', () => {
  const now = Date.now();
  titleTaps = titleTaps.filter((t) => now - t < 3000).concat(now);
  if (titleTaps.length < 5) return;
  titleTaps = [];
  const info = `voice=${voiceIn ? 'on' : 'off'} worked=${voiceWorked} sr=${!!SR} ios=${isIOS} app=${standalone}`;
  setStatus(`<span class="hint" style="text-align:left;white-space:pre-wrap">${esc([info, ...voiceLog.slice(-15)].join('\n'))}</span>`);
});

// ═════════════ Boot ═════════════

applyTheme();
renderBrowse();
updateVoiceUi();
const startSection = location.hash.slice(1);
if (SECTIONS[startSection]) {
  go({}, true);
  showSection(startSection);
} else {
  // A reload keeps whatever screen was showing.
  showState(history.state);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
