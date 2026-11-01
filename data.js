// Cleaning guide content, transcribed from CLEANING.pdf.
// tone: "ok" = green cell, "caution" = yellow cell, "no" = pink cell (same meaning as the PDF).

export const SECTIONS = {
  clothing: {
    title: 'Clothing', group: 'Laundry', kind: 'laundry',
    rules: [
      'Always use Tide Free & Gentle detergent for machine-washed items',
      'Always use unscented Eucalan detergent for handwashed items',
      'Make sure all fasteners are closed',
      'Washing inside out is preferable for many items',
      'Do not use bleach',
    ],
  },
  accessories: { title: 'Accessories', group: 'Laundry', kind: 'laundry', rulesFrom: 'clothing' },
  linens: { title: 'Linens', group: 'Laundry', kind: 'laundry', rulesFrom: 'clothing' },
  toys: { title: 'Toys & Comfort Items', group: 'Laundry', kind: 'laundry', rulesFrom: 'clothing' },

  'dw-clean': {
    title: 'Dishwasher Cleaning', group: 'Feeding', kind: 'feeding',
    phase: 'Everyday wash', how: 'Dishwasher · Normal cycle', icon: 'dishwasher',
    rules: [
      'Wash feeding items after each use',
      'Make sure the dishwasher is cleaned regularly',
      'Prepare items by taking them apart, rinsing off any milk/residue, and putting small parts in the OXO basket on the top rack',
      'Use 7th Generation Free & Clear dish detergent and rinse aid, if needed; if a sunshine icon is indicated on the screen, rinse aid does not need to be refilled',
      'Press the Normal cycle button and make sure the Sanitize cycle is not turned on',
      'Open the dishwasher when done to let it air out and place items on the lawn drying rack to dry completely (never towel-dry)',
    ],
  },
  handwash: {
    title: 'Handwash Cleaning', group: 'Feeding', kind: 'feeding',
    phase: 'Everyday wash', how: 'Handwash · Dapple soap + bottle brush', icon: 'hands',
    rules: [
      'Wash feeding items after each use',
      'Use a sanitized bowl and clean the items using Dapple dish soap with a baby bottle brush',
      'Place items on lawn drying rack to dry completely (never towel-dry)',
    ],
  },
  'dw-sterilize': {
    title: 'Dishwasher Sterilization', group: 'Feeding', kind: 'feeding',
    phase: 'Sterilize', how: 'Dishwasher · Sanitize + Heavy Load', icon: 'dishwasher',
    rules: [
      'Sterilize used feeding items once a day for the first 2 months',
      'Make sure the dishwasher is cleaned regularly',
      'Prepare items by taking them apart, rinsing off any milk/residue, and putting small parts in the OXO basket on the top rack',
      'Use 7th Generation Free & Clear dish detergent and rinse aid, if needed; if a sunshine icon is indicated on the screen, rinse aid does not need to be refilled',
      'Press the Sanitize + Heavy Load button',
      'Open the dishwasher when done to let it air out and place items on the lawn drying rack to dry completely (never towel-dry)',
    ],
  },
  boil: {
    title: 'Boiling Sanitization', group: 'Feeding', kind: 'feeding',
    phase: 'Sterilize', how: 'Boil', icon: 'pot',
    rules: [
      'Sterilize used feeding items once a day for the first 2 months',
      'Disassemble and wash items first, including the pot or bowl that will be used, with Dapple dish soap and a baby bottle brush',
      'If putting in the pot, cover everything with water and start a timer for 5 min. once the water is brought to a rolling boil.',
      'If pouring boiling water into a bowl, make sure the bowl is clean and cover everything with boiling water for 5 min.',
      'Remove items using clean tongs and place items on the lawn drying rack to dry completely (never towel-dry)',
    ],
  },
  health: {
    title: 'Misc. Health Items', group: 'Feeding', kind: 'feeding',
    phase: 'Clean', how: 'Clean', icon: 'cross',
  },

  'wm-maint': { title: 'Washing Machine Maintenance', group: 'Maintenance', kind: 'maintenance', short: 'Washing machine' },
  'dw-maint': { title: 'Dishwasher Maintenance', group: 'Maintenance', kind: 'maintenance', short: 'Dishwasher' },
};

export const ITEMS = [
  // ───────── CLOTHING ─────────
  {
    id: 'kyte', section: 'clothing', brand: 'Kyte',
    name: 'Footies, onesies, scratch mittens, and pants',
    wash: { tone: 'ok', head: 'Delicate cycle', text: 'Cold, inside out, make sure all fasteners are closed, use delicates bag' },
    dry: { tone: 'no', head: 'No dryer', text: 'Hang or lay flat' },
    aliases: ['kite', 'kyte baby', 'kite baby', 'kight', 'pajamas', 'pjs', 'pyjamas', 'jammies', 'sleeper', 'footie', 'onesie', 'bodysuit', 'mittens', 'scratch mitts', 'pants', 'leggings', 'bamboo'],
  },
  {
    id: 'magnetic-me', section: 'clothing', brand: 'Magnetic Me',
    name: 'Footies and fleece pram',
    wash: { tone: 'ok', head: 'Delicate cycle', text: 'Cold, make sure all fasteners are closed, use delicates bag' },
    dry: { tone: 'caution', head: 'Delicate cycle', text: 'Tumble dry low for a max of 30 min. Air-dry if still damp' },
    aliases: ['magnetic', 'magnetics', 'magnet me', 'magnet', 'magnetic mi', 'magnets', 'pram suit', 'pram', 'fleece', 'bunting', 'snowsuit', 'pajamas', 'pjs', 'sleeper', 'footie'],
  },
  {
    id: 'mori-carters', section: 'clothing', brand: 'Mori, Carter’s, Gunamuna, etc.',
    name: 'Footies and onesies',
    wash: { tone: 'ok', head: 'Delicate cycle', text: 'Cold, make sure all fasteners are closed, inside out for Carter’s footies' },
    dry: { tone: 'ok', head: 'Delicate cycle', text: 'Tumble dry low' },
    aliases: ['mori', 'maury', 'morey', 'mory', 'moree', 'carters', 'carter', 'cartas', 'gunamuna', 'guna muna', 'gunna muna', 'goona muna', 'gona muna', 'other brands', 'onesie', 'bodysuit', 'footie', 'pajamas', 'pjs', 'sleeper'],
  },

  // ───────── ACCESSORIES ─────────
  {
    id: 'bombas-zutano', section: 'accessories', brand: 'Bombas, Zutano',
    name: 'Socks and booties',
    wash: { tone: 'ok', head: 'Delicate cycle', text: 'Cold, make sure all fasteners are closed' },
    dry: { tone: 'ok', head: 'Delicate cycle', text: 'Tumble dry low' },
    aliases: ['bombas', 'bomba', 'bombers', 'bambas', 'zutano', 'zootano', 'zutanos', 'sutano', 'socks', 'sock', 'booties', 'bootie', 'slippers', 'shoes'],
  },
  {
    id: '7am-cooper-pearl', section: 'accessories', brand: '7AM, Cooper Pearl',
    name: 'Fuzzy winter hats and lightweight top knot hat',
    wash: { tone: 'ok', head: 'Delicate cycle', text: 'Cold, 7AM hats inside out' },
    dry: { tone: 'ok', head: 'Delicate cycle', text: 'Tumble dry low' },
    aliases: ['7am', '7 am', 'seven am', 'seven a m', 'cooper pearl', 'cooper', 'pearl', 'hat', 'hats', 'beanie', 'winter hat', 'fuzzy hat', 'top knot', 'topknot', 'knot hat'],
  },
  {
    id: 'domani', section: 'accessories', brand: 'Domani Home',
    name: 'Cotton bonnet',
    wash: { tone: 'ok', head: 'Delicate cycle', text: 'Cold' },
    dry: { tone: 'no', head: 'No dryer', text: 'Hang or lay flat' },
    aliases: ['domani', 'domani home', 'domini', 'dominy', 'doe mani', 'bonnet', 'bonet', 'cotton hat', 'sun hat', 'hat'],
  },
  {
    id: 'hand-knit', section: 'accessories', brand: 'Hand Knit Items',
    name: 'Leg warmers, sweaters, hats, etc.',
    wash: { tone: 'no', head: 'Handwash only', text: '' },
    dry: { tone: 'no', head: 'No dryer', text: 'Hang or lay flat' },
    aliases: ['knit', 'knitted', 'hand knit', 'handknit', 'hand knitted', 'leg warmers', 'legwarmers', 'sweater', 'cardigan', 'wool', 'handmade', 'hat', 'hats', 'beanie'],
  },

  // ───────── LINENS ─────────
  {
    id: 'swaddles', section: 'linens',
    name: 'Swaddles',
    wash: { tone: 'ok', head: 'Delicate cycle', text: 'Cold, make sure all fasteners are closed, HALO swaddle inside out' },
    dry: { tone: 'ok', head: 'Delicate cycle', text: 'Tumble dry low' },
    aliases: ['swaddle', 'swaddles', 'halo', 'halo swaddle', 'hello swaddle', 'sleep sack', 'sleepsack', 'swaddle blanket', 'muslin'],
  },
  {
    id: 'bedding', section: 'linens',
    name: 'Crib mattress cover, nursing pillow cover, changing pad cover, crib/bassinet sheets, hooded towels, washcloths, burp cloths, and bibs',
    wash: { tone: 'ok', head: 'Delicate cycle', text: 'Cold, make sure all fasteners are closed' },
    dry: { tone: 'ok', head: 'Delicate cycle', text: 'Tumble dry low' },
    aliases: ['sheet', 'sheets', 'crib sheet', 'bassinet sheet', 'fitted sheet', 'mattress cover', 'mattress protector', 'nursing pillow', 'boppy', 'feeding pillow', 'changing pad cover', 'towel', 'hooded towel', 'bath towel', 'washcloth', 'wash cloth', 'burp cloth', 'burp rag', 'burp', 'bib', 'bedding'],
  },
  {
    id: 'solly', section: 'linens',
    name: 'Solly soft fabric baby carrier and stroller/carrier blankets',
    wash: { tone: 'ok', head: 'Delicate cycle', text: 'Cold, use delicates bag' },
    dry: { tone: 'ok', head: 'Delicate cycle', text: 'Tumble dry low' },
    aliases: ['solly', 'solly baby', 'sally', 'soli', 'solley', 'solly wrap', 'wrap', 'baby wrap', 'soft carrier', 'fabric carrier', 'stroller blanket', 'carrier blanket', 'blanket'],
  },
  {
    id: 'car-seat', section: 'linens',
    name: 'Car seat/stroller removable fabric, LÍLLÉbaby carrier, BabyBjörn bouncer cover',
    wash: { tone: 'ok', head: 'Delicate cycle', text: 'Cold, use delicates bag' },
    dry: { tone: 'no', head: 'No dryer', text: 'Hang or lay flat' },
    aliases: ['car seat', 'carseat', 'car seat cover', 'stroller', 'stroller fabric', 'stroller liner', 'seat cover', 'canopy', 'lillebaby', 'lille baby', 'lilly baby', 'lily baby', 'lillie baby', 'lilibaby', 'carrier', 'baby bjorn', 'babybjorn', 'bjorn', 'byorn', 'baby byorn', 'bouncer', 'bouncer cover', 'bouncy seat'],
  },
  {
    id: 'lily-pad', section: 'linens',
    name: 'Lily pad play mat',
    wash: { tone: 'ok', head: 'Delicate cycle', text: 'Cold' },
    dry: { tone: 'no', head: 'No dryer', text: 'Hang or lay flat' },
    aliases: ['lily pad', 'lilypad', 'lilly pad', 'lillypad', 'play mat', 'playmat', 'activity mat', 'play gym', 'tummy time mat', 'mat'],
  },

  // ───────── TOYS & COMFORT ─────────
  {
    id: 'thumbie-otter', section: 'toys',
    name: 'Bunny thumbie, snuggle otter',
    wash: { tone: 'ok', head: 'Delicate cycle', text: 'Cold, use delicates bag, remove electronics from snuggle otter' },
    dry: { tone: 'ok', head: 'Delicate cycle', text: 'Tumble dry low' },
    aliases: ['thumbie', 'thumby', 'thumbee', 'thumbey', 'bunny thumbie', 'snuggle otter', 'otter', 'sleep otter', 'lovey', 'heartbeat', 'bunny'],
  },
  {
    id: 'spot-clean-plush', section: 'toys',
    name: 'Soft Jellycat rattles (bear and bunny), Mon Ami lamb, Cuddle+Kind baby daisy and bunny',
    wash: { tone: 'no', head: 'Spot clean only', text: '' },
    dry: { tone: 'no', head: 'No dryer', text: 'Hang or lay flat' },
    aliases: ['jellycat', 'jelly cat', 'jelly', 'jellycats', 'rattle', 'bear', 'teddy', 'bunny', 'mon ami', 'monami', 'mon amie', 'mon army', 'lamb', 'sheep', 'cuddle and kind', 'cuddle kind', 'cuddle+kind', 'daisy', 'doll', 'stuffed animal', 'plush', 'stuffy', 'soft toy'],
  },
  {
    id: 'lorena-canal', section: 'toys',
    name: 'Lorena Canal fabric rattles',
    wash: { tone: 'ok', head: 'Delicate cycle', text: 'Cold, use delicates bag' },
    dry: { tone: 'no', head: 'No dryer', text: 'Hang or lay flat' },
    aliases: ['lorena canal', 'lorena', 'lorenna', 'canal', 'fabric rattle', 'rattle', 'soft rattle'],
  },
  {
    id: 'handmade-toys', section: 'toys',
    name: 'Handmade toys',
    wash: { tone: 'no', head: 'Handwash only', text: '' },
    dry: { tone: 'no', head: 'No dryer', text: 'Hang or lay flat' },
    aliases: ['handmade', 'hand made', 'homemade', 'crochet', 'crocheted', 'knit toy', 'toy', 'toys'],
  },

  // ───────── FEEDING, TEETHING & CARE ─────────
  {
    id: 'pump-parts', section: 'dw-clean',
    name: 'Breast pump parts',
    sub: 'Except tubing and motor',
    note: 'Disassemble all parts. All hard plastic can go in the dishwasher, but soft silicone pieces will last longer/retain better suction if handwashed or boiled',
    methods: [
      { section: 'dw-clean', row: 'Hard plastic pump parts (except for tubing and motor)', parts: 'Hard plastic parts' },
      { section: 'handwash', row: 'All pump parts (except for tubing and motor)', parts: 'All parts — best for soft silicone' },
      { section: 'dw-sterilize', row: 'Hard plastic pump parts (except for tubing and motor)', parts: 'Hard plastic parts' },
      { section: 'boil', row: 'Soft pump parts (except for tubing and motor)', parts: 'Soft silicone parts', how: 'Boil in a pot for 5 min.' },
    ],
    aliases: ['pump', 'breast pump', 'pump parts', 'pumping', 'flange', 'flanges', 'valve', 'valves', 'duckbill', 'membrane', 'membranes', 'breast shield', 'shield', 'backflow', 'connector', 'hard plastic', 'soft silicone', 'silicone parts'],
  },
  {
    id: 'bottles', section: 'dw-clean',
    name: 'Baby bottles',
    sub: 'Nipples, rings & silicone sleeves',
    methods: [
      { section: 'dw-clean', row: 'Baby bottles and silicone sleeves', notes: 'Nipples/rings and silicone sleeves in OXO basket. Replace nipples that look swollen, sticky, or torn' },
      { section: 'dw-sterilize', row: 'Baby bottles', notes: 'Nipples/rings in OXO basket' },
    ],
    aliases: ['bottle', 'bottles', 'baby bottle', 'nipple', 'nipples', 'teat', 'teats', 'ring', 'rings', 'bottle parts', 'avent', 'philips avent', 'feeding'],
  },
  {
    id: 'avent-sleeves', section: 'boil',
    name: 'Silicone sleeves for Avent bottles',
    methods: [
      { section: 'dw-clean', row: 'Baby bottles and silicone sleeves', notes: 'Nipples/rings and silicone sleeves in OXO basket' },
      { section: 'boil', row: 'Silicone sleeves for Avent bottles', how: 'Boil in a pot for 5 min.' },
    ],
    aliases: ['avent', 'a vent', 'avant', 'advent', 'events', 'avent sleeve', 'sleeve', 'sleeves', 'silicone sleeve', 'bottle sleeve', 'bottle cover'],
  },
  {
    id: 'maymom', section: 'dw-clean',
    name: 'Maymom bottle converter/adapter',
    methods: [
      { section: 'dw-clean', notes: 'OXO basket' },
      { section: 'dw-sterilize', notes: 'OXO basket' },
    ],
    aliases: ['maymom', 'may mom', 'maymon', 'may mum', 'mamom', 'maymoms', 'converter', 'adapter', 'adaptor', 'bottle adapter', 'bottle converter'],
  },
  {
    id: 'mason-bottle', section: 'dw-clean',
    name: 'Mason Bottle glass breast milk storage jars and plastic lids',
    methods: [
      { section: 'dw-clean', notes: 'Remove silicone rings from the inside of the lids and secure inside OXO basket' },
      { section: 'dw-sterilize', notes: 'Remove silicone rings from the inside of the lids and secure inside OXO basket' },
    ],
    aliases: ['mason bottle', 'mason', 'masen', 'mason jar', 'mason jars', 'jar', 'jars', 'storage jar', 'milk jar', 'glass jar', 'lid', 'lids', 'milk storage', 'breast milk storage'],
  },
  {
    id: 'milas-keeper', section: 'dw-clean',
    name: 'Mila’s Keeper glass breast milk storage',
    methods: [
      { section: 'dw-clean', notes: 'Remove and secure silicone sleeves' },
      { section: 'dw-sterilize', notes: 'Remove and secure silicone sleeves' },
    ],
    aliases: ['milas keeper', 'mila keeper', 'mila', 'milas', 'millas', 'millers keeper', 'miller keeper', 'milla', 'keeper', 'keepers', 'glass storage', 'milk storage', 'breast milk storage', 'glass bottle'],
  },
  {
    id: 'moonkie', section: 'dw-clean',
    name: 'Moonkie silicone pacifier cases',
    methods: [
      { section: 'dw-clean', notes: 'Make sure the opening is bottom facing' },
      { section: 'dw-sterilize', notes: 'Make sure the opening is bottom facing' },
    ],
    aliases: ['moonkie', 'moonky', 'moonkey', 'moon key', 'moonkies', 'monkey', 'munky', 'pacifier case', 'paci case', 'binky case', 'pacifier holder', 'case', 'cases'],
  },
  {
    id: 'haakaa', section: 'boil',
    name: 'Haakaa ladybug silicone breast milk collector',
    methods: [
      { section: 'handwash' },
      { section: 'boil', how: 'Boil in a pot for 2–3 min.', notes: 'Be careful with water that collects on the inside so you don’t burn yourself' },
    ],
    aliases: ['haakaa', 'haaka', 'hakka', 'haka', 'hacka', 'hakaa', 'haakka', 'hockey', 'ladybug', 'lady bug', 'milk collector', 'collector', 'milk catcher', 'silicone pump'],
  },
  {
    id: 'frigg', section: 'boil',
    name: 'FRIGG rubber and silicone pacifiers and teethers',
    methods: [
      { section: 'handwash', notes: 'Replace after 1–2 months or in case of any wear' },
      { section: 'boil', how: 'Pour boiling water in a bowl and let it soak for 5 min.', notes: 'Replace after 1–2 months or in case of any wear' },
    ],
    aliases: ['frigg', 'frig', 'fridge', 'frigge', 'frigs', 'friggs', 'pacifier', 'pacifiers', 'paci', 'pacis', 'binky', 'binkies', 'dummy', 'soother', 'teether', 'teethers', 'teething', 'rubber', 'nuk'],
  },
  {
    id: 'bath-items', section: 'handwash',
    name: 'Bath items',
    methods: [{ section: 'handwash', notes: 'Rinse after each use, hang to dry; mild soap weekly' }],
    aliases: ['bath', 'bath toys', 'bath toy', 'bathtub', 'bath tub', 'tub', 'baby tub', 'bath seat', 'rinse cup', 'sponge', 'bath sponge'],
  },
  {
    id: 'bottle-brush', section: 'handwash',
    name: 'Baby bottle brush with stand',
    methods: [{ section: 'handwash', notes: 'Rinse and air-dry after each use; wash every few days. Replace when bristles fray' }],
    aliases: ['bottle brush', 'brush', 'brush stand', 'bristles', 'bottle cleaner', 'nipple brush'],
  },
  {
    id: 'drying-rack', section: 'handwash',
    name: 'Lawn drying rack',
    methods: [{ section: 'handwash', notes: 'Wash every few days (daily under 2 months)' }],
    aliases: ['lawn', 'lawn rack', 'drying rack', 'dry rack', 'rack', 'grass', 'grass rack', 'bottle rack', 'boon', 'boon lawn'],
  },
  {
    id: 'vinyl-changing-pad', section: 'handwash',
    name: 'Vinyl changing pad',
    methods: [{ section: 'handwash', notes: 'Wipe with soapy water after messes' }],
    aliases: ['changing pad', 'change pad', 'changing mat', 'change mat', 'vinyl', 'changing table', 'diaper changing pad', 'keekaroo'],
  },
  {
    id: 'wipes-pail', section: 'handwash',
    name: 'Wipe dispensers and diaper pail',
    methods: [{ section: 'handwash', notes: 'Wipe weekly' }],
    aliases: ['wipe dispenser', 'wipes', 'wipes dispenser', 'wipes holder', 'wipe warmer', 'diaper pail', 'diaper bin', 'diaper can', 'ubbi', 'pail', 'diaper genie', 'trash can'],
  },
  {
    id: 'nosefrida', section: 'health',
    name: 'NoseFrida',
    methods: [{ section: 'health', notes: 'Handwash or use dishwasher for rigid parts and swirl rubbing alcohol through the tube; replace filter after each use and replace tube if discolored or musty' }],
    aliases: ['nosefrida', 'nose frida', 'nose freida', 'nose frieda', 'nose fritter', 'frida', 'snot sucker', 'snotsucker', 'snot', 'nasal aspirator', 'aspirator', 'booger', 'nose'],
  },
  {
    id: 'thermometer', section: 'health',
    name: 'Thermometer',
    methods: [{ section: 'health', notes: 'Wipe with alcohol before and after' }],
    aliases: ['thermometer', 'thermometre', 'temp', 'temperature', 'rectal thermometer', 'fever'],
  },
  {
    id: 'nailfrida', section: 'health',
    name: 'NailFrida clipper and nail files',
    methods: [{ section: 'health', notes: 'Wipe with alcohol' }],
    aliases: ['nailfrida', 'nail frida', 'nail freida', 'frida', 'nail clipper', 'nail clippers', 'clipper', 'clippers', 'nail file', 'nail files', 'nails', 'nail', 'emery'],
  },

  // ───────── WASHING MACHINE MAINTENANCE ─────────
  {
    id: 'wm-gasket-wipe', section: 'wm-maint', name: 'Wipe door gasket (rubber seal)', when: 'After each wash',
    notes: 'Wipe dry with a cloth, especially inside the folds and along the bottom where water, hair, and lint collect',
    aliases: ['gasket', 'rubber seal', 'seal', 'door seal', 'door gasket', 'washer gasket', 'washer seal'],
  },
  {
    id: 'wm-ajar', section: 'wm-maint', name: 'Leave door and detergent drawer ajar', when: 'After each wash',
    notes: 'Leave slightly open to allow moisture to evaporate and prevent mildew/odors. You can put paper towels in any areas that look like it has collected water',
    aliases: ['leave door open', 'door open', 'ajar', 'mildew', 'mold', 'odor', 'smell', 'musty', 'detergent drawer', 'moisture'],
  },
  {
    id: 'wm-affresh', section: 'wm-maint', name: 'Run tub on clean cycle with Affresh tablet', when: 'Monthly',
    notes: 'Empty washer. Place 1 Affresh washing machine tablet directly into the drum. Wipe away leftover residue afterward',
    aliases: ['affresh', 'a fresh', 'afresh', 'affresh tablet', 'clean cycle', 'tub clean', 'clean washer', 'washer cleaner', 'tablet', 'drum'],
  },
  {
    id: 'wm-pump-filter', section: 'wm-maint', name: 'Clean drain and pump filter', when: 'Monthly',
    notes: 'Open small access panel at bottom front. Place towels and a shallow tray underneath. With machine off, cool, and unplugged, drain water using small hose, then unscrew filter counterclockwise. Remove lint, hair, and debris. Rinse and reinstall securely',
    aliases: ['drain', 'drain filter', 'pump filter', 'washer filter', 'filter', 'access panel', 'drain hose', 'lint'],
  },
  {
    id: 'wm-drawer', section: 'wm-maint', name: 'Clean detergent dispenser drawer', when: 'Monthly',
    notes: 'Pull drawer out while pressing release tab. Remove inserts, rinse with warm water, and scrub buildup with a soft brush. Dry and reinstall',
    aliases: ['detergent drawer', 'dispenser drawer', 'dispenser', 'soap drawer', 'drawer', 'softener drawer'],
  },
  {
    id: 'wm-gasket-deep', section: 'wm-maint', name: 'Deep-clean rubber door gasket', when: 'Monthly',
    notes: 'Gently pull back the rubber folds with a spatula. Remove trapped debris and wipe the seal, door glass, and lower edge with vinegar solution',
    aliases: ['gasket', 'washer gasket', 'deep clean gasket', 'rubber seal', 'seal', 'door seal', 'vinegar', 'spatula', 'door glass'],
  },
  {
    id: 'wm-exterior', section: 'wm-maint', name: 'Wipe exterior and controls', when: 'Monthly',
    notes: 'Wipe with a soft, damp cloth and mild soap, then dry',
    aliases: ['exterior', 'outside', 'controls', 'buttons', 'control panel'],
  },

  // ───────── DISHWASHER MAINTENANCE ─────────
  {
    id: 'dw-filter-check', section: 'dw-maint', name: 'Check filter for food/milk residue', when: 'Weekly',
    notes: '',
    aliases: ['filter', 'dishwasher filter', 'check filter', 'residue', 'milk residue'],
  },
  {
    id: 'dw-filter-clean', section: 'dw-maint', name: 'Clean filter', when: 'Every 2–4 weeks, or sooner if dirty',
    notes: 'Remove the bottom rack, twist the filter knob left and lift it out, separate the filter from its screen and scrub each with warm, soapy water and a brush. Rinse and lock it back securely',
    aliases: ['filter', 'dishwasher filter', 'clean filter', 'filter screen', 'screen'],
  },
  {
    id: 'dw-spray-arms', section: 'dw-maint', name: 'Clean spray arms', when: 'When clogged or every few months',
    notes: 'Remove the bottom rack and the spray arm, rinse with warm water and clear clogged holes with a toothpick. Snap back in and check they spin freely',
    aliases: ['spray arm', 'spray arms', 'sprayer', 'arms', 'toothpick', 'clogged', 'holes'],
  },
  {
    id: 'dw-gasket', section: 'dw-maint', name: 'Wipe door gasket and bottom edge of the door', when: 'Monthly',
    notes: '',
    aliases: ['gasket', 'dishwasher gasket', 'door seal', 'seal', 'bottom edge', 'door edge'],
  },
  {
    id: 'dw-cleaner-cycle', section: 'dw-maint', name: 'Run a dishwasher cleaner cycle', when: 'Every 2–3 months, or when it smells',
    notes: 'Empty machine, use Bosch dishwasher cleaner; hottest cycle (heavy + sanitize)',
    aliases: ['bosch', 'bosch cleaner', 'dishwasher cleaner', 'cleaner cycle', 'clean dishwasher', 'smell', 'smells', 'stinks', 'odor'],
  },
];

// Section overviews are searchable too ("how do I sterilize", "which detergent").
export const SECTION_ALIASES = {
  clothing: ['clothes', 'clothing', 'laundry', 'detergent', 'tide', 'tide free and gentle', 'eucalan', 'bleach', 'laundry rules'],
  'dw-clean': ['dishwasher', 'dish washer', 'normal cycle', '7th generation', 'seventh generation', 'rinse aid', 'oxo basket', 'oxo', 'sunshine icon', 'everyday wash'],
  'dw-sterilize': ['sterilize', 'sterilise', 'sterilization', 'sanitize', 'sanitise', 'sanitize heavy', 'dishwasher', 'oxo basket', 'rinse aid'],
  boil: ['boil', 'boiling', 'sterilize', 'sterilise', 'sanitize', 'sanitization', 'boiling water', 'pot', 'tongs'],
  handwash: ['handwash', 'hand wash', 'dapple', 'dish soap', 'sink', 'wash by hand'],
  'wm-maint': ['washing machine', 'washer', 'laundry machine', 'washer maintenance'],
  'dw-maint': ['dishwasher', 'dish washer', 'dishwasher maintenance'],
};
