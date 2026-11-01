// Run: npm test
import { search, searchBest } from '../search.js';

// [query, id expected among the strong results (top group)]
const CASES = [
  ['kyte', 'kyte'],
  ['kite footies', 'kyte'],
  ['Kyte baby onesie', 'kyte'],
  ['kyte pajamas', 'kyte'],
  ['magnetic me', 'magnetic-me'],
  ['magnetic me footie', 'magnetic-me'],
  ['magentic', 'magnetic-me'],
  ['fleece pram', 'magnetic-me'],
  ['carters onesie', 'mori-carters'],
  ['Carter\'s footies', 'mori-carters'],
  ['gunamuna', 'mori-carters'],
  ['gunna muna', 'mori-carters'],
  ['mori', 'mori-carters'],
  ['footies', 'kyte'],
  ['footies', 'magnetic-me'],
  ['footies', 'mori-carters'],
  ['bombas socks', 'bombas-zutano'],
  ['zootano', 'bombas-zutano'],
  ['socks', 'bombas-zutano'],
  ['7 a.m. hat', '7am-cooper-pearl'],
  ['seven am hat', '7am-cooper-pearl'],
  ['cooper pearl', '7am-cooper-pearl'],
  ['top knot', '7am-cooper-pearl'],
  ['bonnet', 'domani'],
  ['domani', 'domani'],
  ['leg warmers', 'hand-knit'],
  ['knitted sweater', 'hand-knit'],
  ['swadle', 'swaddles'],
  ['halo swaddle', 'swaddles'],
  ['burp cloth', 'bedding'],
  ['crib sheet', 'bedding'],
  ['bibs', 'bedding'],
  ['hooded towel', 'bedding'],
  ['nursing pillow cover', 'bedding'],
  ['solly', 'solly'],
  ['sally wrap', 'solly'],
  ['stroller blanket', 'solly'],
  ['car seat cover', 'car-seat'],
  ['lillebaby', 'car-seat'],
  ['lily baby carrier', 'car-seat'],
  ['baby bjorn bouncer', 'car-seat'],
  ['bjorn', 'car-seat'],
  ['lily pad', 'lily-pad'],
  ['play mat', 'lily-pad'],
  ['thumbie', 'thumbie-otter'],
  ['snuggle otter', 'thumbie-otter'],
  ['jellycat', 'spot-clean-plush'],
  ['jelly cat', 'spot-clean-plush'],
  ['jely cat rattle', 'spot-clean-plush'],
  ['mon ami lamb', 'spot-clean-plush'],
  ['cuddle and kind', 'spot-clean-plush'],
  ['cuddle+kind daisy', 'spot-clean-plush'],
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
  ['frigg', 'frigg'],
  ['fridge pacifier', 'frigg'],
  ['binky', 'frigg'],
  ['teether', 'frigg'],
  ['bath toys', 'bath-items'],
  ['bottle brush', 'bottle-brush'],
  ['drying rack', 'drying-rack'],
  ['lawn', 'drying-rack'],
  ['changing pad', 'vinyl-changing-pad'],
  ['diaper pail', 'wipes-pail'],
  ['wipes', 'wipes-pail'],
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

// Junk should not produce confident matches.
for (const q of ['asdfgh', 'refrigerator manual', 'xylophone']) {
  const res = search(q).filter((r) => r.strong);
  if (res.length) { fail++; console.log(`FAIL  junk "${q}" matched ${res.map((r) => r.id).join(', ')}`); }
}

// Speech alternatives: pick the best transcript.
const alt = searchBest(['night frida', 'nail frida']);
if (alt.results[0]?.id !== 'nailfrida') { fail++; console.log('FAIL  searchBest alternatives'); }

console.log(`${CASES.length + 4 - fail}/${CASES.length + 4} passed`);
process.exit(fail ? 1 : 0);
