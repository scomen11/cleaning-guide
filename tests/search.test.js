// Run: npm test
import { search, searchBest } from '../search.js';

// [query, id expected among the strong results (top group)]
const CASES = [
  ['kyte', 'kyte-footies'],
  ['kite footies', 'kyte-footies'],
  ['Kyte baby onesie', 'kyte-onesies'],
  ['kyte pajamas', 'kyte-footies'],
  ['magnetic me', 'magnetic-me-footies'],
  ['magnetic me footie', 'magnetic-me-footies'],
  ['magentic', 'magnetic-me-pram'],
  ['fleece pram', 'magnetic-me-pram'],
  ['carters onesie', 'carters-onesies'],
  ["Carter's footies", 'carters-footies'],
  ['gunamuna', 'gunamuna-footies'],
  ['gunna muna', 'gunamuna-onesies'],
  ['mori', 'mori-onesies'],
  ['footies', 'kyte-footies'],
  ['footies', 'magnetic-me-footies'],
  ['footies', 'other-footies'],
  ['bombas socks', 'bombas-socks'],
  ['zootano', 'zutano-booties'],
  ['socks', 'bombas-socks'],
  ['7 a.m. hat', '7am-hat'],
  ['seven am hat', '7am-hat'],
  ['cooper pearl', 'cooper-pearl-hat'],
  ['top knot', 'cooper-pearl-hat'],
  ['bonnet', 'domani'],
  ['domani', 'domani'],
  ['leg warmers', 'hand-knit'],
  ['knitted sweater', 'hand-knit'],
  ['swadle', 'swaddles'],
  ['halo swaddle', 'halo-swaddle'],
  ['burp cloth', 'burp-cloths'],
  ['crib sheet', 'crib-sheets'],
  ['bibs', 'bibs'],
  ['hooded towel', 'hooded-towels'],
  ['nursing pillow cover', 'nursing-pillow-cover'],
  ['solly', 'solly'],
  ['sally wrap', 'solly'],
  ['stroller blanket', 'stroller-blankets'],
  ['car seat cover', 'car-seat'],
  ['lillebaby', 'lillebaby'],
  ['lily baby carrier', 'lillebaby'],
  ['baby bjorn bouncer', 'babybjorn'],
  ['bjorn', 'babybjorn'],
  ['lily pad', 'lily-pad'],
  ['play mat', 'lily-pad'],
  ['thumbie', 'bunny-thumbie'],
  ['snuggle otter', 'snuggle-otter'],
  ['jellycat', 'jellycat-bear'],
  ['jelly cat', 'jellycat-bunny'],
  ['jely cat rattle', 'jellycat-bear'],
  ['mon ami lamb', 'mon-ami-lamb'],
  ['cuddle and kind', 'cuddle-kind-bunny'],
  ['cuddle+kind daisy', 'cuddle-kind-daisy'],
  ['lorena canal', 'lorena-canal'],
  ['handmade toy', 'handmade-toys'],
  ['pump parts', 'pump-parts'],
  ['breast pump', 'pump-parts'],
  ['flanges', 'pump-parts'],
  ['how do I clean the pump', 'pump-parts'],
  ['bottles', 'bottles'],
  ['baby bottle nipples', 'bottles'],
  ['avent sleeve', 'avent-sleeves'],
  ['maymom', 'maymom'],
  ['may mom adapter', 'maymom'],
  ['mason bottle', 'mason-bottle'],
  ['mason jars', 'mason-bottle'],
  ['milas keeper', 'milas-keeper'],
  ["mila's keeper", 'milas-keeper'],
  ['moonkie', 'moonkie'],
  ['monkey pacifier case', 'moonkie'],
  ['haakaa', 'haakaa'],
  ['hakka', 'haakaa'],
  ['ladybug', 'haakaa'],
  ['frigg', 'frigg-pacifiers'],
  ['fridge pacifier', 'frigg-pacifiers'],
  ['binky', 'frigg-pacifiers'],
  ['teether', 'frigg-teethers'],
  ['bath toys', 'bath-items'],
  ['bottle brush', 'bottle-brush'],
  ['drying rack', 'drying-rack'],
  ['lawn', 'drying-rack'],
  ['changing pad', 'vinyl-changing-pad'],
  ['diaper pail', 'diaper-pail'],
  ['wipes', 'wipe-dispensers'],
  ['nose frida', 'nosefrida'],
  ['nosefreida', 'nosefrida'],
  ['snot sucker', 'nosefrida'],
  ['thermometer', 'thermometer'],
  ['thermomter', 'thermometer'],
  ['nail clippers', 'nailfrida'],
  ['affresh', 'wm-affresh'],
  ['washing machine filter', 'wm-pump-filter'],
  ['dishwasher filter', 'dw-filter-clean'],
  ['spray arms', 'dw-spray-arms'],
  ['detergent drawer', 'wm-drawer'],
  ['dishwasher smells', 'dw-cleaner-cycle'],
  ['sterilize', 'section:dw-sterilize'],
  ['boiling', 'section:boil'],
  ['which detergent', 'section:clothing'],
  ['soft jellycat rattles', 'jellycat-bunny'],
  ['kyte pants', 'kyte-pants'],
  ['kyte mittens', 'kyte-mittens'],
  ['halo', 'halo-swaddle'],
  ['swaddle', 'swaddles'],
  ['car seat', 'car-seat'],
  ['stroller', 'stroller-fabric'],
  ['zutano booties', 'zutano-booties'],
  ['onesie', 'other-onesies'],
  ['teething', 'frigg-teethers'],
];

// Products that share steps are still different items and must not crowd each other in.
// [query, ids that must NOT be among the strong results]
const EXCLUDE = [
  ['soft jellycat rattles', ['mon-ami-lamb', 'cuddle-kind-daisy', 'cuddle-kind-bunny']],
  ['mon ami lamb', ['jellycat-bear', 'jellycat-bunny', 'cuddle-kind-daisy']],
  ['kyte pants', ['kyte-footies', 'kyte-onesies', 'kyte-mittens']],
  ['bibs', ['burp-cloths', 'crib-sheets', 'washcloths']],
  ['burp cloth', ['bibs', 'washcloths']],
  ['bjorn', ['lillebaby', 'car-seat']],
  ['snuggle otter', ['bunny-thumbie']],
  ['carters footies', ['carters-onesies', 'mori-footies']],
  ['teether', ['frigg-pacifiers']],
  ['diaper pail', ['wipe-dispensers']],
];

let fail = 0;
for (const [q, want] of CASES) {
  const res = search(q);
  const strong = res.filter((r) => r.strong).map((r) => r.id);
  if (!strong.includes(want)) {
    fail++;
    console.log(`FAIL  "${q}" → want ${want}; got strong=[${strong.join(', ')}] top=${res.slice(0, 3).map((r) => `${r.id}:${r.score.toFixed(2)}`).join(' ')}`);
  }
}

for (const [q, bad] of EXCLUDE) {
  const strong = search(q).filter((r) => r.strong).map((r) => r.id);
  const wrong = bad.filter((id) => strong.includes(id));
  if (wrong.length) { fail++; console.log(`FAIL  "${q}" should not show ${wrong.join(', ')}; strong=[${strong.join(', ')}]`); }
}

// Junk should not produce confident matches.
for (const q of ['asdfgh', 'refrigerator manual', 'xylophone']) {
  const res = search(q).filter((r) => r.strong);
  if (res.length) { fail++; console.log(`FAIL  junk "${q}" matched ${res.map((r) => r.id).join(', ')}`); }
}

// Speech alternatives: pick the best transcript.
const alt = searchBest(['night frida', 'nail frida']);
if (alt.results[0]?.id !== 'nailfrida') { fail++; console.log('FAIL  searchBest alternatives'); }

const total = CASES.length + EXCLUDE.length + 4;
console.log(`${total - fail}/${total} passed`);
process.exit(fail ? 1 : 0);
