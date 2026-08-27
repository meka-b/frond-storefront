import { Hono } from 'hono';
import db from '../db/index.js';

const app = new Hono();

// Helper to format currency and URLs
const money = c => '$' + (c / 100).toFixed(2);
const normalizeUrl = (u) => {
  if (!u) return '';
  if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:') || u.startsWith('/')) {
    return u;
  }
  return '/' + u;
};

/**
 * GET /api/catalog
 * Returns the entire live storefront catalog payload.
 */
app.get('/', c => {
  // 1. Fetch published products
  const productsRows = db.prepare('SELECT * FROM products WHERE is_published = 1 ORDER BY sort_order ASC').all();
  const variantsRows = db.prepare('SELECT * FROM product_variants ORDER BY sort_order ASC').all();
  const imagesRows = db.prepare('SELECT * FROM product_images ORDER BY sort_order ASC').all();

  const products = productsRows.map(p => {
    const variants = variantsRows
      .filter(v => v.product_id === p.id)
      .map(v => ({
        id: v.id,
        label: v.label,
        hex: v.hex_color,
        price: v.price,
        compareAt: v.compare_at_price || null,
        available: Boolean(v.is_available && v.inventory_qty > 0),
        sku: v.sku,
        inventory_qty: v.inventory_qty
      }));

    const prodImages = imagesRows.filter(img => img.product_id === p.id);
    const rawMain = prodImages.find(img => img.is_primary)?.url || prodImages[0]?.url || '/assets/img/p-monstera-1.jpg';
    const rawHover = prodImages.find(img => img.is_hover)?.url || prodImages[1]?.url || rawMain;
    const mainImg = normalizeUrl(rawMain);
    const hoverImg = normalizeUrl(rawHover);
    const gallery = prodImages.filter(img => img.is_gallery).map(img => normalizeUrl(img.url));

    let chips = [];
    try { chips = JSON.parse(p.chips || '[]'); } catch { chips = []; }

    return {
      id: p.id,
      title: p.title,
      subtitle: p.subtitle,
      badge: p.badge || '',
      badgeCls: p.badge_class || '',
      images: [mainImg, hoverImg],
      gallery: gallery.length ? gallery : [mainImg, hoverImg],
      video: p.video_url || null,
      rating: p.rating || 5.0,
      reviews: p.reviews_count || 0,
      sku: p.sku,
      optionName: p.option_name || 'Pot',
      optionStyle: p.option_style || 'swatch',
      variants: variants.length ? variants : [{ id: `${p.id}-std`, label: 'Standard', hex: '#D8D2C4', price: 4800, compareAt: null, available: true }],
      tags: p.tags || '',
      chips: chips,
      desc: p.description || '',
      care: {
        light: p.light_care || 'Bright, indirect light',
        water: p.water_care || 'Every 10-14 days',
        pet: p.pet_care || 'Pet friendly'
      },
      ugc: Boolean(p.is_ugc),
      bestseller: Boolean(p.is_bestseller)
    };
  });

  // 2. Fetch UGC items
  const ugcRows = db.prepare('SELECT * FROM ugc_posts WHERE is_active = 1 ORDER BY sort_order ASC').all();
  const ugc = ugcRows.map(u => ({
    handle: u.product_id,
    name: u.title,
    price: u.price_display,
    href: `product.html?handle=${u.product_id}`,
    poster: normalizeUrl(u.poster_url),
    video: u.video_url,
    thumb: normalizeUrl(u.thumb_url || u.poster_url),
    alt_text: u.alt_text || u.title
  }));

  // 3. Fetch Shade Tabs
  const shadeTabsRows = db.prepare('SELECT * FROM shade_tabs WHERE is_active = 1 ORDER BY sort_order ASC').all();
  const shadeTabProds = db.prepare('SELECT * FROM shade_tab_products ORDER BY sort_order ASC').all();
  const shadeTabs = shadeTabsRows.map(tab => ({
    id: tab.id,
    label: tab.label,
    img: normalizeUrl(tab.image_url),
    products: shadeTabProds.filter(sp => sp.shade_tab_id === tab.id).map(sp => sp.product_id)
  }));

  // 4. Fetch Announcements
  const announcements = db.prepare('SELECT * FROM announcements WHERE is_active = 1 ORDER BY sort_order ASC').all();

  // 5. Fetch Hero
  const hero = db.prepare("SELECT * FROM hero_content WHERE id = 'main'").get() || {};

  // 6. Fetch Editorial
  const editorial = db.prepare("SELECT * FROM editorial_sections WHERE id = 'story'").get() || {};
  if (editorial.image_url) editorial.image_url = normalizeUrl(editorial.image_url);

  // 7. Fetch Campaigns & Coupons
  const campaigns = db.prepare('SELECT * FROM campaigns WHERE is_active = 1 ORDER BY sort_order ASC').all();

  // 8. Fetch Collections with linked products
  const collectionsRows = db.prepare('SELECT * FROM collections WHERE is_published = 1 ORDER BY sort_order ASC').all();
  const colProductsRows = db.prepare('SELECT * FROM collection_products ORDER BY sort_order ASC').all();
  const collections = collectionsRows.map(col => ({
    ...col,
    image_url: normalizeUrl(col.image_url),
    products: colProductsRows.filter(cp => cp.collection_id === col.id).map(cp => cp.product_id)
  }));
  const moodTiles = db.prepare('SELECT * FROM mood_tiles WHERE is_active = 1 ORDER BY sort_order ASC').all()
    .map(mt => ({ ...mt, image_url: normalizeUrl(mt.image_url) }));

  // 9. Fetch FAQs
  const faqs = db.prepare('SELECT * FROM faqs WHERE is_active = 1 ORDER BY sort_order ASC').all();

  // 10. Fetch Blog Articles
  const blogs = db.prepare('SELECT * FROM blog_articles WHERE is_published = 1 ORDER BY published_at DESC').all()
    .map(b => ({ ...b, cover_image: normalizeUrl(b.cover_image) }));

  // 11. Fetch Site Settings
  const settingsRows = db.prepare('SELECT * FROM site_settings').all();
  const settings = {};
  for (const s of settingsRows) {
    settings[s.key] = s.type === 'number' ? Number(s.value) : s.value;
  }

  // 12. Shoppable Videos ("As Seen In")
  const shoppableVideos = db.prepare('SELECT * FROM shoppable_videos WHERE is_active = 1 ORDER BY sort_order ASC').all()
    .map(sv => ({
      ...sv,
      poster_url: normalizeUrl(sv.poster_url),
      thumb_url: normalizeUrl(sv.thumb_url),
      alt_text: sv.alt_text || sv.title
    }));

  return c.json({
    products,
    ugc,
    shadeTabs,
    announcements,
    hero,
    editorial,
    campaigns,
    collections,
    moodTiles,
    faqs,
    blogs,
    settings,
    shoppableVideos
  });
});

export default app;
