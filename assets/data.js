/* ============================================================
   FROND  data.js  (dynamic catalog with Hono REST API bridge)
   Loads instantly with fallback and hydrates live from SQLite DB
   ============================================================ */
'use strict';

const money = c => '$' + (c / 100).toFixed(2);

// Dynamic mutable store with defaults
let PRODUCTS = [
  {
    id: 'monstera', title: 'Monstera Deliciosa', badge: 'Bestseller', badgeCls: '',
    images: ['/assets/img/p-monstera-1.jpg', '/assets/img/p-monstera-2.jpg'],
    gallery: ['/assets/img/p-monstera-1.jpg', '/assets/img/p-monstera-2.jpg', '/assets/img/hero.jpg'],
    video: null, rating: 4.9, reviews: 212, sku: 'FR-MON-01',
    optionName: 'Pot', optionStyle: 'swatch',
    variants: [
      { id: 'mon-nursery', label: 'Nursery', hex: '#D8D2C4', price: 4800, compareAt: null, available: true },
      { id: 'mon-terra', label: 'Terracotta', hex: '#B96A45', price: 5600, compareAt: null, available: true },
      { id: 'mon-stone', label: 'Stone', hex: '#A9A49A', price: 6200, compareAt: null, available: false }
    ],
    tags: 'indoor large easy care statement tropical',
    chips: ['Statement', 'Easy Care'],
    desc: 'The icon. Big, glossy fenestrated leaves on a plant that forgives you more than it should. Ships at 60–80 cm tall, rooted and settled in its pot.',
    care: { light: 'Bright, indirect light  tolerates medium light', water: 'Every 10–14 days; let the top soil dry', pet: 'Not pet friendly  keep out of nibbling range' }
  },
  {
    id: 'fig', title: 'Fiddle-Leaf Fig', badge: 'New', badgeCls: 'new',
    images: ['/assets/img/p-fig-1.jpg', '/assets/img/p-fig-2.jpg'],
    gallery: ['/assets/img/p-fig-1.jpg', '/assets/img/p-fig-2.jpg'],
    video: null, rating: 4.8, reviews: 96, sku: 'FR-FIG-02',
    optionName: 'Pot', optionStyle: 'swatch',
    variants: [
      { id: 'fig-nursery', label: 'Nursery', hex: '#D8D2C4', price: 6500, compareAt: null, available: true },
      { id: 'fig-terra', label: 'Terracotta', hex: '#B96A45', price: 7200, compareAt: null, available: true },
      { id: 'fig-stone', label: 'Stone', hex: '#A9A49A', price: 7800, compareAt: null, available: true }
    ],
    tags: 'indoor tall tree statement ficus',
    chips: ['Tall', 'Statement'],
    desc: 'A living sculpture for the corner that gets the good light. Ours are trained on a single trunk and arrive acclimated to real indoor air  no leaf-drop drama.',
    care: { light: 'Bright light, a few hours of gentle sun is welcome', water: 'Weekly; consistently lightly moist, never soggy', pet: 'Not pet friendly' }
  },
  {
    id: 'planter', title: 'Dune Ceramic Planter', badge: '', badgeCls: '',
    images: ['/assets/img/p-planter-1.jpg', '/assets/img/p-planter-2.jpg'],
    gallery: ['/assets/img/p-planter-1.jpg', '/assets/img/p-planter-2.jpg'],
    video: null, rating: 4.9, reviews: 154, sku: 'FR-POT-03',
    optionName: 'Size', optionStyle: 'pill',
    variants: [
      { id: 'pl-s', label: 'Small', price: 3200, compareAt: null, available: true },
      { id: 'pl-m', label: 'Medium', price: 3800, compareAt: null, available: true },
      { id: 'pl-l', label: 'Large', price: 4600, compareAt: null, available: true }
    ],
    tags: 'ceramic pot dune object beige ribbed decor',
    chips: ['Ceramic', 'Objects'],
    desc: 'Hand-thrown stoneware with a soft ribbed curve and a matte sand glaze. Drainage hole and matching saucer included  because pretty should also be practical.',
    care: { light: '', water: 'Wipe clean with a damp cloth', pet: '' }
  },
  {
    id: 'pothos', title: 'Golden Pothos', badge: '-25%', badgeCls: 'sale',
    images: ['/assets/img/p-pothos-1.jpg', '/assets/img/p-pothos-2.jpg'],
    gallery: ['/assets/img/p-pothos-1.jpg', '/assets/img/p-pothos-2.jpg'],
    video: null, rating: 4.9, reviews: 301, sku: 'FR-POT-04',
    optionName: 'Pot', optionStyle: 'swatch',
    variants: [
      { id: 'po-nursery', label: 'Nursery', hex: '#D8D2C4', price: 2400, compareAt: 3200, available: true },
      { id: 'po-brass', label: 'Brass', hex: '#B08D4F', price: 2900, compareAt: 3800, available: true },
      { id: 'po-stone', label: 'Stone', hex: '#A9A49A', price: 3400, compareAt: 4400, available: true }
    ],
    tags: 'trailing hanging easy care pet friendly shelf',
    chips: ['Trailing', 'Pet Friendly'],
    desc: 'The gateway plant. Trails a metre a year, forgives a missed watering (or three), and propagates in a glass of tap water. Everyone should own one at least once.',
    care: { light: 'Low to bright indirect  truly unfussy', water: 'Every 1–2 weeks; droops politely when thirsty', pet: 'Mildly toxic if eaten  best on a shelf' }
  },
  {
    id: 'olive', title: 'The Olive Tree', badge: 'Spotlight', badgeCls: 'new',
    images: ['/assets/img/p-olive-1.jpg', '/assets/img/p-olive-1.jpg'],
    gallery: ['/assets/img/p-olive-1.jpg'],
    video: null, rating: 5.0, reviews: 64, sku: 'FR-OLI-05',
    optionName: 'Pot', optionStyle: 'swatch',
    variants: [
      { id: 'ol-nursery', label: 'Nursery', hex: '#D8D2C4', price: 8900, compareAt: null, available: true },
      { id: 'ol-terra', label: 'Terracotta', hex: '#B96A45', price: 9600, compareAt: null, available: true },
      { id: 'ol-stone', label: 'Stone', hex: '#A9A49A', price: 10400, compareAt: null, available: true }
    ],
    tags: 'tree mediterranean sunny silver slow grown spotlight',
    chips: ['Tree', 'Sunny'],
    desc: 'Silvery leaves, impossible calm. Our olives are pruned for compact indoor life and laugh in the face of a sunny windowsill. Ships at 90–110 cm.',
    care: { light: 'The sunniest spot you have  minimum 4h direct sun', water: 'Every 7–10 days; drench then drain fully', pet: 'Pet friendly' }
  },
  {
    id: 'adansonii', title: 'Adansonii Swiss Cheese Vine', ugc: true,
    images: ['https://frond-theme.myshopify.com/cdn/shop/files/preview_images/c6d98e558714492b83bd9ea72ad3362a.thumbnail.0000000000_1100x.jpg?v=1785490093',
             'https://frond-theme.myshopify.com/cdn/shop/files/preview_images/c6d98e558714492b83bd9ea72ad3362a.thumbnail.0000000000_1100x.jpg?v=1785490093'],
    gallery: ['https://frond-theme.myshopify.com/cdn/shop/files/preview_images/c6d98e558714492b83bd9ea72ad3362a.thumbnail.0000000000_1100x.jpg?v=1785490093'],
    video: 'https://frond-theme.myshopify.com/cdn/shop/videos/c/vp/c6d98e558714492b83bd9ea72ad3362a/c6d98e558714492b83bd9ea72ad3362a.HD-720p-3.0Mbps-90424809.mp4?v=0',
    rating: 4.9, reviews: 88, sku: 'FR-ADA-11',
    optionName: 'Pot',
    variants: [
      { id: 'ad-nursery', label: 'Nursery', hex: '#D8D2C4', price: 42300, compareAt: null, available: true },
      { id: 'ad-terra', label: 'Terracotta', hex: '#B96A45', price: 46300, compareAt: null, available: true },
      { id: 'ad-stone', label: 'Stone', hex: '#A9A49A', price: 48900, compareAt: null, available: true }
    ],
    tags: 'swiss cheese vine trailing rare monstera adansonii',
    chips: ['Rare', 'Trailing'],
    desc: 'The rare one everyone screenshots. Hole-punched leaves on a fast-climbing vine  give it a moss pole and it will outgrow your expectations.',
    care: { light: 'Bright, indirect light', water: 'Weekly; keep slightly humid', pet: 'Not pet friendly' }
  },
  {
    id: 'fern-pot', title: 'Mini Lemon Button Fern Pot', ugc: true,
    images: ['https://frond-theme.myshopify.com/cdn/shop/files/preview_images/6a92357b7a964f8db4ccc913f7c876dd.thumbnail.0000000000_1100x.jpg?v=1785490178',
             'https://frond-theme.myshopify.com/cdn/shop/files/preview_images/6a92357b7a964f8db4ccc913f7c876dd.thumbnail.0000000000_1100x.jpg?v=1785490178'],
    gallery: ['https://frond-theme.myshopify.com/cdn/shop/files/preview_images/6a92357b7a964f8db4ccc913f7c876dd.thumbnail.0000000000_1100x.jpg?v=1785490178'],
    video: 'https://frond-theme.myshopify.com/cdn/shop/videos/c/vp/6a92357b7a964f8db4ccc913f7c876dd/6a92357b7a964f8db4ccc913f7c876dd.HD-720p-3.0Mbps-90424811.mp4?v=0',
    rating: 4.7, reviews: 143, sku: 'FR-FER-12',
    optionName: 'Pot',
    variants: [
      { id: 'fp-nursery', label: 'Nursery', hex: '#D8D2C4', price: 29900, compareAt: null, available: true },
      { id: 'fp-terra', label: 'Terracotta', hex: '#B96A45', price: 33900, compareAt: null, available: true },
      { id: 'fp-stone', label: 'Stone', hex: '#A9A49A', price: 36500, compareAt: null, available: true }
    ],
    tags: 'fern mini button lemon small desk',
    chips: ['Mini', 'Pet Friendly'],
    desc: 'A pocket-sized cloud of tiny leaflets that smells faintly of lemon when you brush past. The desk plant that never asks for much.',
    care: { light: 'Medium, indirect light', water: 'Keep evenly moist', pet: 'Pet friendly' }
  },
  {
    id: 'marble-queen', title: 'Marble Queen Pothos Plant', ugc: true,
    images: ['https://frond-theme.myshopify.com/cdn/shop/files/preview_images/cc70edb421ad4ee7894998e3ce6af227.thumbnail.0000000000_1100x.jpg?v=1785490136',
             'https://frond-theme.myshopify.com/cdn/shop/files/preview_images/cc70edb421ad4ee7894998e3ce6af227.thumbnail.0000000000_1100x.jpg?v=1785490136'],
    gallery: ['https://frond-theme.myshopify.com/cdn/shop/files/preview_images/cc70edb421ad4ee7894998e3ce6af227.thumbnail.0000000000_1100x.jpg?v=1785490136'],
    video: 'https://frond-theme.myshopify.com/cdn/shop/videos/c/vp/cc70edb421ad4ee7894998e3ce6af227/cc70edb421ad4ee7894998e3ce6af227.HD-1080p-3.3Mbps-90424791.mp4?v=0',
    rating: 4.8, reviews: 177, sku: 'FR-MAR-13',
    optionName: 'Pot',
    variants: [
      { id: 'mq-nursery', label: 'Nursery', hex: '#D8D2C4', price: 19900, compareAt: 24900, available: true },
      { id: 'mq-terra', label: 'Terracotta', hex: '#B96A45', price: 23500, compareAt: 28900, available: true },
      { id: 'mq-stone', label: 'Stone', hex: '#A9A49A', price: 26900, compareAt: 31900, available: true }
    ],
    tags: 'marble queen pothos variegated trailing easy care',
    chips: ['Variegated', 'Trailing'],
    desc: 'Cream-marbled leaves, zero attitude. Trails gloriously from shelves and only gets more variegated in good light.',
    care: { light: 'Bright indirect keeps the marble bright', water: 'Every 1–2 weeks', pet: 'Keep away from nibblers' }
  },
  {
    id: 'melano', title: 'Philodendron Melanochrysum', ugc: true,
    images: ['https://frond-theme.myshopify.com/cdn/shop/files/preview_images/7a5a664a42da4c95887162369f8cd7dd.thumbnail.0000000000_1100x.jpg?v=1785490097',
             'https://frond-theme.myshopify.com/cdn/shop/files/preview_images/7a5a664a42da4c95887162369f8cd7dd.thumbnail.0000000000_1100x.jpg?v=1785490097'],
    gallery: ['https://frond-theme.myshopify.com/cdn/shop/files/preview_images/7a5a664a42da4c95887162369f8cd7dd.thumbnail.0000000000_1100x.jpg?v=1785490097'],
    video: 'https://frond-theme.myshopify.com/cdn/shop/videos/c/vp/7a5a664a42da4c95887162369f8cd7dd/7a5a664a42da4c95887162369f8cd7dd.HD-720p-3.0Mbps-90424813.mp4?v=0',
    rating: 5.0, reviews: 41, sku: 'FR-MEL-14',
    optionName: 'Pot',
    variants: [
      { id: 'me-nursery', label: 'Nursery', hex: '#D8D2C4', price: 35500, compareAt: null, available: true },
      { id: 'me-terra', label: 'Terracotta', hex: '#B96A45', price: 39900, compareAt: null, available: true },
      { id: 'me-stone', label: 'Stone', hex: '#A9A49A', price: 44500, compareAt: null, available: true }
    ],
    tags: 'philodendron melanochrysum velvet rare collector',
    chips: ['Rare', 'Velvet'],
    desc: 'Black-velvet leaves with gold veins  the collector piece. Slower than you want, more beautiful than you deserve.',
    care: { light: 'Bright, indirect; no harsh noon sun', water: 'When top 3 cm dries out', pet: 'Not pet friendly' }
  },
  {
    id: 'monkey', title: 'Monstera Adansonii Monkey', ugc: true,
    images: ['https://frond-theme.myshopify.com/cdn/shop/files/preview_images/b0d12f617ef2486793923f73acb402fa.thumbnail.0000000000_1100x.jpg?v=1785490094',
             'https://frond-theme.myshopify.com/cdn/shop/files/preview_images/b0d12f617ef2486793923f73acb402fa.thumbnail.0000000000_1100x.jpg?v=1785490094'],
    gallery: ['https://frond-theme.myshopify.com/cdn/shop/files/preview_images/b0d12f617ef2486793923f73acb402fa.thumbnail.0000000000_1100x.jpg?v=1785490094'],
    video: 'https://frond-theme.myshopify.com/cdn/shop/videos/c/vp/b0d12f617ef2486793923f73acb402fa/b0d12f617ef2486793923f73acb402fa.HD-720p-3.0Mbps-90424808.mp4?v=0',
    rating: 4.8, reviews: 73, sku: 'FR-ADA-15',
    optionName: 'Pot',
    variants: [
      { id: 'mk-nursery', label: 'Nursery', hex: '#D8D2C4', price: 26600, compareAt: null, available: true },
      { id: 'mk-terra', label: 'Terracotta', hex: '#B96A45', price: 29900, compareAt: null, available: true },
      { id: 'mk-stone', label: 'Stone', hex: '#A9A49A', price: 32900, compareAt: null, available: true }
    ],
    tags: 'monstera adansonii monkey mask trailing hoop',
    chips: ['Trailing', 'Hoop'],
    desc: 'The playful sibling of the Swiss Cheese Vine  narrower leaves, wilder climbing habit. Trained on a hoop for instant shelf presence.',
    care: { light: 'Bright, indirect light', water: 'Weekly', pet: 'Not pet friendly' }
  }
];

let UGC = [
  { handle: 'adansonii' }, { handle: 'fern-pot' }, { handle: 'marble-queen' }, { handle: 'melano' }, { handle: 'monkey' }
];

let SHADE_TABS = [
  { id: 'low', label: 'Low Light', img: '/assets/img/p-pothos-2.jpg', products: ['pothos', 'marble-queen', 'fern-pot', 'monkey'] },
  { id: 'medium', label: 'Medium Light', img: '/assets/img/ch-big-1.jpg', products: ['monstera', 'adansonii', 'fern-pot', 'pothos'] },
  { id: 'bright', label: 'Bright Indirect', img: '/assets/img/p-fig-2.jpg', products: ['fig', 'monstera', 'melano', 'adansonii'] },
  { id: 'sun', label: 'Direct Sun', img: '/assets/img/hero.jpg', products: ['olive', 'fig', 'melano', 'marble-queen'] }
];

let SITE_SETTINGS = {
  store_name: 'FROND',
  free_shipping_threshold: 7500,
  currency_symbol: '$',
  guarantee_days: 7,
  announcement_speed: '36s'
};

const findProduct = id => PRODUCTS.find(p => p.id === id);
const findVariant = vid => {
  for (const p of PRODUCTS) {
    const v = p.variants.find(v => v.id === vid);
    if (v) return { product: p, variant: v };
  }
  return null;
};

function getProductCategory(product) {
  const p = typeof product === 'object' ? product : findProduct(product);
  const tags = (p?.tags || '').toLowerCase();
  const id = (p?.id || (typeof product === 'string' ? product : '')).toLowerCase();

  if (tags.includes('cactus') || tags.includes('cacti') || tags.includes('kaktüs') || id.includes('kakt') || id.includes('cactus') || id.includes('lophocereus')) {
    return 'cactus';
  }
  if (tags.includes('succulent') || id.includes('succulent') || id.includes('echeveria')) {
    return 'succulents';
  }
  if (tags.includes('pot') || tags.includes('ceramic') || tags.includes('planter') || id.includes('planter')) {
    return 'pots';
  }
  if (tags.includes('tree') || id.includes('fig') || id.includes('olive')) {
    return 'trees';
  }
  if (tags.includes('trailing') || tags.includes('hanging') || id.includes('pothos') || id.includes('adansonii') || id.includes('monkey') || id.includes('queen')) {
    return 'trailing';
  }
  if (tags.includes('rare') || tags.includes('collector') || id.includes('melano')) {
    return 'rare';
  }
  return 'foliage';
}

function getProductUrl(product) {
  const id = typeof product === 'string' ? product : (product?.id || 'monstera');
  const cat = getProductCategory(product || id);
  return `/plants/${cat}/${id}`;
}

let COLLECTIONS = [];
let MOOD_TILES = [];
let BLOGS = [];

// Asynchronously hydrate from live Backend Hono REST API
let _catalogPromise = null;
function loadCatalogData() {
  if (!_catalogPromise) {
    _catalogPromise = fetch('/api/catalog?_t=' + Date.now(), { cache: 'no-cache' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) return;

        if (Array.isArray(data.products) && data.products.length > 0) {
          PRODUCTS.length = 0;
          PRODUCTS.push(...data.products);
        }

        if (Array.isArray(data.collections)) {
          COLLECTIONS.length = 0;
          COLLECTIONS.push(...data.collections);
        }

        if (Array.isArray(data.moodTiles)) {
          MOOD_TILES.length = 0;
          MOOD_TILES.push(...data.moodTiles);
        }

        if (Array.isArray(data.blogs)) {
          BLOGS.length = 0;
          BLOGS.push(...data.blogs);
        }

        if (Array.isArray(data.ugc) && data.ugc.length > 0) {
          UGC = data.ugc;
        }

        if (Array.isArray(data.shadeTabs) && data.shadeTabs.length > 0) {
          SHADE_TABS = data.shadeTabs;
        }

        if (data.settings) {
          SITE_SETTINGS = { ...SITE_SETTINGS, ...data.settings };
        }

        window.PRODUCTS = PRODUCTS;
        window.COLLECTIONS = COLLECTIONS;
        window.MOOD_TILES = MOOD_TILES;
        window.BLOGS = BLOGS;

        // Broadcast update so active web components can sync
        document.dispatchEvent(new CustomEvent('catalog:live', { detail: data }));
        return data;
      })
      .catch(e => {
        console.debug('Using local catalog fallback:', e.message);
      });
  }
  return _catalogPromise;
}

// Start loading live data immediately
if (typeof window !== 'undefined') {
  window.PRODUCTS = PRODUCTS;
  window.COLLECTIONS = COLLECTIONS;
  window.MOOD_TILES = MOOD_TILES;
  window.BLOGS = BLOGS;
  window.loadCatalogData = loadCatalogData;
  loadCatalogData();
}
