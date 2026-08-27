import db from '../server/db/index.js';

const cols = [
  'meta_title TEXT',
  'meta_description TEXT',
  'focus_keywords TEXT',
  'canonical_url TEXT',
  'tldr_summary TEXT',
  "schema_type TEXT DEFAULT 'BlogPosting'",
  "faq_items TEXT DEFAULT '[]'"
];

for (const col of cols) {
  try {
    db.exec(`ALTER TABLE blog_articles ADD COLUMN ${col}`);
    console.log(`Added column ${col}`);
  } catch (e) {
    // Already exists
  }
}

import fs from 'fs';
import path from 'path';

const target = path.resolve('server/routes/storefrontSeo.js');
const code = `import { Hono } from 'hono';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

const router = new Hono();

export function getProductCategory(p) {
  const tags = (p?.tags || '').toLowerCase();
  const id = (p?.id || '').toLowerCase();
  if (tags.includes('cactus') || tags.includes('cacti') || tags.includes('kaktüs') || id.includes('kakt') || id.includes('cactus') || id.includes('lophocereus')) return 'cactus';
  if (tags.includes('succulent') || id.includes('succulent') || id.includes('echeveria')) return 'succulents';
  if (tags.includes('pot') || tags.includes('ceramic') || tags.includes('planter') || id.includes('planter')) return 'pots';
  if (tags.includes('tree') || id.includes('fig') || id.includes('olive')) return 'trees';
  if (tags.includes('trailing') || tags.includes('hanging') || id.includes('pothos') || id.includes('adansonii') || id.includes('monkey') || id.includes('queen')) return 'trailing';
  if (tags.includes('rare') || tags.includes('collector') || id.includes('melano')) return 'rare';
  return 'foliage';
}

export function getProductUrl(p) {
  const id = typeof p === 'string' ? p : p.id;
  const prod = typeof p === 'object' ? p : db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  const cat = getProductCategory(prod || { id });
  return '/plants/' + cat + '/' + id;
}

// 0. Root Homepage
router.get('/', c => {
  const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
  return c.html(html);
});

// 1. Redirect /index.html -> /
router.get('/index.html', c => c.redirect('/', 301));

// 2. Redirect legacy /product.html -> /plants/:category/:handle
router.get('/product.html', c => {
  const handle = c.req.query('handle') || 'monstera';
  const prod = db.prepare('SELECT * FROM products WHERE id = ?').get(handle);
  const cat = getProductCategory(prod || { id: handle });
  return c.redirect('/plants/' + cat + '/' + handle, 301);
});

// 3. /plants/:handle -> 301 redirect to /plants/:category/:handle
router.get('/plants/:handle', c => {
  const handle = c.req.param('handle');
  const prod = db.prepare('SELECT * FROM products WHERE id = ?').get(handle);
  const cat = getProductCategory(prod || { id: handle });
  return c.redirect('/plants/' + cat + '/' + handle, 301);
});

// 4. Primary SEO-Friendly Product Route: /plants/:category/:handle
router.get('/plants/:category/:handle', c => {
  const { category, handle } = c.req.param();
  const prod = db.prepare('SELECT * FROM products WHERE id = ?').get(handle);
  let html = fs.readFileSync(path.join(rootDir, 'product.html'), 'utf-8');
  if (prod) {
    const images = db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC').all(handle);
    const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order ASC').all(handle);
    const primaryImg = images.find(img => img.is_primary)?.url || images[0]?.url || '/assets/img/p-monstera-1.jpg';
    const canonicalUrl = 'http://localhost:3000/plants/' + category + '/' + handle;
    const seoTitle = prod.title + ' — Slow-Grown Plants | FROND';
    const seoDesc = prod.subtitle || (prod.title + ' slow-grown in greenhouse soil. Shipped in plastic-free packaging with 7-day root guarantee.');
    const schemaJson = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      'name': prod.title,
      'image': [primaryImg.startsWith('http') ? primaryImg : 'http://localhost:3000' + (primaryImg.startsWith('/') ? '' : '/') + primaryImg],
      'description': seoDesc,
      'sku': variants[0]?.sku || ('FROND-' + handle.toUpperCase()),
      'brand': { '@type': 'Brand', 'name': 'FROND' },
      'offers': {
        '@type': 'Offer',
        'url': canonicalUrl,
        'priceCurrency': 'USD',
        'price': (variants[0]?.price ? variants[0].price / 100 : 45.0).toFixed(2),
        'availability': 'https://schema.org/InStock',
        'itemCondition': 'https://schema.org/NewCondition'
      }
    };
    html = html.replace(/<title>.*?<\\/title>/, '<title>' + seoTitle + '</title>\\n  <meta name="description" content="' + seoDesc.replace(/"/g, '&quot;') + '">\\n  <link rel="canonical" href="' + canonicalUrl + '">\\n  <meta property="og:title" content="' + prod.title.replace(/"/g, '&quot;') + '">\\n  <meta property="og:description" content="' + seoDesc.replace(/"/g, '&quot;') + '">\\n  <meta property="og:image" content="' + primaryImg + '">\\n  <script type="application/ld+json">' + JSON.stringify(schemaJson) + '<\\/script>');
  }
  return c.html(html);
});

// 5. Canonical Storefront Pages
router.get('/collections', c => {
  let html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
  html = html.replace('</body>', '<script>window.addEventListener("DOMContentLoaded", () => { const el = document.getElementById("collections"); if (el) el.scrollIntoView({ behavior: "smooth" }); });</script></body>');
  return c.html(html);
});

router.get('/blogs', c => {
  let html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
  html = html.replace('</body>', '<script>window.addEventListener("DOMContentLoaded", () => { const el = document.getElementById("story"); if (el) el.scrollIntoView({ behavior: "smooth" }); });</script></body>');
  return c.html(html);
});

router.get('/journal', c => c.redirect('/blogs', 301));

router.get('/shop', c => {
  let html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
  html = html.replace('</body>', '<script>window.addEventListener("DOMContentLoaded", () => { const el = document.getElementById("shop"); if (el) el.scrollIntoView({ behavior: "smooth" }); });</script></body>');
  return c.html(html);
});

export default router;
`;

fs.writeFileSync(target, code, 'utf8');
console.log('Wrote storefrontSeo.js successfully to:', target);
