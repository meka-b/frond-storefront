import { Hono } from 'hono';
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

// 0. Root Homepage with WebSite & Organization JSON-LD
router.get('/', c => {
  let html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
  const homeSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://frond.ecomm-0320.workers.dev/#organization',
        'name': 'FROND',
        'url': 'https://frond.ecomm-0320.workers.dev/',
        'logo': 'https://frond.ecomm-0320.workers.dev/assets/img/hero.jpg',
        'description': 'Slow-grown plants and quietly sculptural objects. Greenhouse-direct since 2019.'
      },
      {
        '@type': 'WebSite',
        '@id': 'https://frond.ecomm-0320.workers.dev/#website',
        'url': 'https://frond.ecomm-0320.workers.dev/',
        'name': 'FROND Living Plants & Objects',
        'publisher': { '@id': 'https://frond.ecomm-0320.workers.dev/#organization' },
        'potentialAction': {
          '@type': 'SearchAction',
          'target': 'https://frond.ecomm-0320.workers.dev/collections?q={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      }
    ]
  };
  html = html.replace('</head>', `  <link rel="canonical" href="https://frond.ecomm-0320.workers.dev/">\n  <script type="application/ld+json">${JSON.stringify(homeSchema)}<\/script>\n</head>`);
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
    const rawPrice = prod.price || 4200;
    const priceFormatted = (rawPrice / 100).toFixed(2);
    const seoTitle = `${prod.title} — Living Plant Care & Order | FROND`;
    const seoDesc = prod.subtitle || prod.description || `Buy slow-grown ${prod.title} directly from our greenhouse. 7-day root health guarantee.`;
    const canonicalUrl = `https://frond.ecomm-0320.workers.dev/plants/${category}/${handle}`;
    const imgUrl = prod.images ? JSON.parse(prod.images)[0] : '/assets/img/p-monstera-1.jpg';
    const fullImgUrl = `https://frond.ecomm-0320.workers.dev${imgUrl}`;

    const schemaJson = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': prod.title,
      'image': [fullImgUrl],
      'description': seoDesc,
      'sku': prod.sku || `FR-${prod.id.toUpperCase()}`,
      'brand': {
        '@type': 'Brand',
        'name': 'FROND'
      },
      'offers': {
        '@type': 'Offer',
        'url': canonicalUrl,
        'priceCurrency': 'USD',
        'price': priceFormatted,
        'availability': 'https://schema.org/InStock',
        'itemCondition': 'https://schema.org/NewCondition'
      },
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': prod.rating || 5.0,
        'reviewCount': prod.reviews_count || 12
      }
    };

    html = html.replace(/<title>.*?<\/title>/, `<title>${seoTitle}</title>\n  <meta name="description" content="${seoDesc.replace(/"/g, '&quot;')}">\n  <link rel="canonical" href="${canonicalUrl}">\n  <meta property="og:title" content="${prod.title.replace(/"/g, '&quot;')}">\n  <meta property="og:description" content="${seoDesc.replace(/"/g, '&quot;')}">\n  <meta property="og:image" content="${fullImgUrl}">\n  <script type="application/ld+json">${JSON.stringify(schemaJson)}<\/script>`);
  }
  return c.html(html);
});

// 5. Collections
router.get('/collections', c => {
  const html = fs.readFileSync(path.join(rootDir, 'collections.html'), 'utf-8');
  return c.html(html);
});

router.get('/collections/:handle', c => {
  const handle = c.req.param('handle');
  const col = db.prepare('SELECT * FROM collections WHERE handle = ?').get(handle);
  let html = fs.readFileSync(path.join(rootDir, 'collections.html'), 'utf-8');
  if (col) {
    const seoTitle = `${col.title} — Botanical Collections | FROND`;
    const seoDesc = col.description || `Explore our curated greenhouse collection of ${col.title.toLowerCase()}.`;
    const canonicalUrl = `https://frond.ecomm-0320.workers.dev/collections/${handle}`;
    html = html.replace(/<title>.*?<\/title>/, `<title>${seoTitle}</title>\n  <meta name="description" content="${seoDesc.replace(/"/g, '&quot;')}">\n  <link rel="canonical" href="${canonicalUrl}">\n  <meta property="og:title" content="${col.title.replace(/"/g, '&quot;')}">\n  <meta property="og:description" content="${seoDesc.replace(/"/g, '&quot;')}">`);
  }
  return c.html(html);
});

router.get('/shop', c => c.redirect('/collections', 301));

router.get('/blogs', c => {
  const html = fs.readFileSync(path.join(rootDir, 'blogs.html'), 'utf-8');
  return c.html(html);
});

router.get('/blogs/:id', c => {
  const id = c.req.param('id');
  const article = db.prepare('SELECT * FROM blog_articles WHERE id = ? AND is_published = 1').get(id);
  let html = fs.readFileSync(path.join(rootDir, 'blog-detail.html'), 'utf-8');
  if (article) {
    const seoTitle = `${article.title} — FROND Journal`;
    const seoDesc = article.excerpt || article.meta_description || 'Care rituals, greenhouse stories, and plant propagation notes.';
    const canonicalUrl = `https://frond.ecomm-0320.workers.dev/blogs/${id}`;
    const coverImg = article.cover_image ? `https://frond.ecomm-0320.workers.dev${article.cover_image}` : 'https://frond.ecomm-0320.workers.dev/assets/img/hero.jpg';

    const schemaJson = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      'headline': article.title,
      'description': seoDesc,
      'image': coverImg,
      'author': {
        '@type': 'Person',
        'name': article.author_name || 'FROND Botanical Team'
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'FROND',
        'logo': { '@type': 'ImageObject', 'url': 'https://frond.ecomm-0320.workers.dev/assets/img/hero.jpg' }
      },
      'datePublished': article.published_at,
      'mainEntityOfPage': canonicalUrl
    };

    html = html.replace(/<title>.*?<\/title>/, `<title>${seoTitle}</title>\n  <meta name="description" content="${seoDesc.replace(/"/g, '&quot;')}">\n  <link rel="canonical" href="${canonicalUrl}">\n  <meta property="og:title" content="${article.title.replace(/"/g, '&quot;')}">\n  <meta property="og:description" content="${seoDesc.replace(/"/g, '&quot;')}">\n  <meta property="og:image" content="${coverImg}">\n  <script type="application/ld+json">${JSON.stringify(schemaJson)}<\/script>`);
  }
  return c.html(html);
});

router.get('/journal', c => c.redirect('/blogs', 301));
router.get('/journal/:id', c => c.redirect(`/blogs/${c.req.param('id')}`, 301));

// Storefront Dedicated Pages: Cart, Checkout, Account
router.get('/cart', c => {
  const html = fs.readFileSync(path.join(rootDir, 'cart.html'), 'utf-8');
  return c.html(html);
});

router.get('/checkout', c => {
  const html = fs.readFileSync(path.join(rootDir, 'checkout.html'), 'utf-8');
  return c.html(html);
});

router.get('/account', c => {
  const html = fs.readFileSync(path.join(rootDir, 'account.html'), 'utf-8');
  return c.html(html);
});

router.get('/profile', c => c.redirect('/account', 301));

export default router;
