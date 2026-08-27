import db from './index.js';

export function seedDatabase() {
  const count = db.prepare('SELECT count(*) as count FROM products').get();
  if (count.count > 0) {
    console.log('Database already contains products. Skipping seed or running update...');
    return;
  }

  console.log('🌱 Seeding database with complete FROND storefront data...');

  const insertSetting = db.prepare('INSERT OR REPLACE INTO site_settings (key, value, type, description) VALUES (?, ?, ?, ?)');
  const insertProduct = db.prepare(`
    INSERT INTO products (id, title, subtitle, description, badge, badge_class, rating, reviews_count, sku, option_name, option_style, tags, chips, light_care, water_care, pet_care, video_url, is_ugc, is_bestseller, is_published, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertVariant = db.prepare(`
    INSERT INTO product_variants (id, product_id, label, hex_color, price, compare_at_price, sku, inventory_qty, is_available, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertImage = db.prepare(`
    INSERT INTO product_images (id, product_id, url, alt_text, is_primary, is_hover, is_gallery, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertCollection = db.prepare(`
    INSERT INTO collections (id, title, description, image_url, item_count_label, is_featured, sort_order, is_published)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertCollectionProduct = db.prepare(`
    INSERT OR IGNORE INTO collection_products (collection_id, product_id, sort_order) VALUES (?, ?, ?)
  `);
  const insertMoodTile = db.prepare(`
    INSERT INTO mood_tiles (id, title, image_url, link_url, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertShadeTab = db.prepare(`
    INSERT INTO shade_tabs (id, label, image_url, sort_order, is_active) VALUES (?, ?, ?, ?, ?)
  `);
  const insertShadeProduct = db.prepare(`
    INSERT OR IGNORE INTO shade_tab_products (shade_tab_id, product_id, sort_order) VALUES (?, ?, ?)
  `);
  const insertUgc = db.prepare(`
    INSERT INTO ugc_posts (id, product_id, title, video_url, poster_url, thumb_url, price_display, sort_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertShoppable = db.prepare(`
    INSERT INTO shoppable_videos (id, product_id, title, video_url, poster_url, thumb_url, price_label, original_price_label, sort_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertHero = db.prepare(`
    INSERT OR REPLACE INTO hero_content (id, eyebrow, title_line_1, title_accent, title_line_2, title_line_3, subtitle, cta_primary_label, cta_primary_link, cta_secondary_label, cta_secondary_link, metric_1_value, metric_1_label, metric_2_value, metric_2_label, metric_3_value, metric_3_label, collage_products)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertEditorial = db.prepare(`
    INSERT OR REPLACE INTO editorial_sections (id, tag_label, image_url, eyebrow, title, lead_text, body_text, stat_year, stat_varieties, stat_packaging, spotlight_product_id, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertAnnouncement = db.prepare(`
    INSERT INTO announcements (id, text, icon, link_url, speed_seconds, sort_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertCampaign = db.prepare(`
    INSERT INTO campaigns (id, kicker, title, description, card_style, coupon_code, cta_label, cta_url, countdown_hours, sort_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertCoupon = db.prepare(`
    INSERT INTO coupons (id, code, title, discount_type, discount_value, min_order_cents, usage_limit, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertBlog = db.prepare(`
    INSERT INTO blog_articles (id, title, excerpt, content, tag, cover_image, read_time, author_name, author_role, is_featured, is_published)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertFaq = db.prepare(`
    INSERT INTO faqs (id, category, question, answer, is_open_default, sort_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertNav = db.prepare(`
    INSERT INTO navigation_links (id, menu_location, label, url, badge, sort_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertReco = db.prepare(`
    INSERT OR IGNORE INTO product_recommendations (id, source_product_id, recommended_product_id, relation_type, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    // 1. Site Settings
    insertSetting.run('store_name', 'FROND', 'string', 'Mağaza Adı');
    insertSetting.run('free_shipping_threshold', '7500', 'number', 'Ücretsiz Kargo Limiti (Cent)');
    insertSetting.run('currency_symbol', '$', 'string', 'Para Birimi Simgesi');
    insertSetting.run('contact_email', 'hello@frond-shop.demo', 'string', 'İletişim E-Posta');
    insertSetting.run('guarantee_days', '7', 'number', 'Kök Garantisi Gün Sayısı');
    insertSetting.run('announcement_speed', '36s', 'string', 'Duyuru Bandı Hızı');
    insertSetting.run('brand_tagline', 'Slow-grown plants and quietly sculptural objects, shipped from our greenhouse to your doorstep — roots happy, floors clean.', 'string', 'Marka Sloganı');

    // 2. Products List
    const PRODUCTS = [
      {
        id: 'monstera', title: 'Monstera Deliciosa', subtitle: 'The icon. Big, glossy fenestrated leaves.',
        badge: 'Bestseller', badgeCls: '', rating: 4.9, reviews: 212, sku: 'FR-MON-01',
        optionName: 'Pot', optionStyle: 'swatch',
        variants: [
          { id: 'mon-nursery', label: 'Nursery', hex: '#D8D2C4', price: 4800, compareAt: null, available: true, qty: 45 },
          { id: 'mon-terra', label: 'Terracotta', hex: '#B96A45', price: 5600, compareAt: null, available: true, qty: 32 },
          { id: 'mon-stone', label: 'Stone', hex: '#A9A49A', price: 6200, compareAt: null, available: false, qty: 0 }
        ],
        images: ['assets/img/p-monstera-1.jpg', 'assets/img/p-monstera-2.jpg'],
        gallery: ['assets/img/p-monstera-1.jpg', 'assets/img/p-monstera-2.jpg', 'assets/img/hero.jpg'],
        video: null,
        tags: 'indoor large easy care statement tropical',
        chips: ['Statement', 'Easy Care'],
        desc: 'The icon. Big, glossy fenestrated leaves on a plant that forgives you more than it should. Ships at 60–80 cm tall, rooted and settled in its pot.',
        care: { light: 'Bright, indirect light — tolerates medium light', water: 'Every 10–14 days; let the top soil dry', pet: 'Not pet friendly — keep out of nibbling range' },
        is_ugc: 0, is_bestseller: 1
      },
      {
        id: 'fig', title: 'Fiddle-Leaf Fig', subtitle: 'A living sculpture for the corner that gets the good light.',
        badge: 'New', badgeCls: 'new', rating: 4.8, reviews: 96, sku: 'FR-FIG-02',
        optionName: 'Pot', optionStyle: 'swatch',
        variants: [
          { id: 'fig-nursery', label: 'Nursery', hex: '#D8D2C4', price: 6500, compareAt: null, available: true, qty: 25 },
          { id: 'fig-terra', label: 'Terracotta', hex: '#B96A45', price: 7200, compareAt: null, available: true, qty: 18 },
          { id: 'fig-stone', label: 'Stone', hex: '#A9A49A', price: 7800, compareAt: null, available: true, qty: 12 }
        ],
        images: ['assets/img/p-fig-1.jpg', 'assets/img/p-fig-2.jpg'],
        gallery: ['assets/img/p-fig-1.jpg', 'assets/img/p-fig-2.jpg'],
        video: null,
        tags: 'indoor tall tree statement ficus',
        chips: ['Tall', 'Statement'],
        desc: 'A living sculpture for the corner that gets the good light. Ours are trained on a single trunk and arrive acclimated to real indoor air — no leaf-drop drama.',
        care: { light: 'Bright light, a few hours of gentle sun is welcome', water: 'Weekly; consistently lightly moist, never soggy', pet: 'Not pet friendly' },
        is_ugc: 0, is_bestseller: 1
      },
      {
        id: 'planter', title: 'Dune Ceramic Planter', subtitle: 'Hand-thrown stoneware with a soft ribbed curve.',
        badge: '', badgeCls: '', rating: 4.9, reviews: 154, sku: 'FR-POT-03',
        optionName: 'Size', optionStyle: 'pill',
        variants: [
          { id: 'pl-s', label: 'Small', hex: '#D8D2C4', price: 3200, compareAt: null, available: true, qty: 50 },
          { id: 'pl-m', label: 'Medium', hex: '#D8D2C4', price: 3800, compareAt: null, available: true, qty: 40 },
          { id: 'pl-l', label: 'Large', hex: '#D8D2C4', price: 4600, compareAt: null, available: true, qty: 20 }
        ],
        images: ['assets/img/p-planter-1.jpg', 'assets/img/p-planter-2.jpg'],
        gallery: ['assets/img/p-planter-1.jpg', 'assets/img/p-planter-2.jpg'],
        video: null,
        tags: 'ceramic pot dune object beige ribbed decor',
        chips: ['Ceramic', 'Objects'],
        desc: 'Hand-thrown stoneware with a soft ribbed curve and a matte sand glaze. Drainage hole and matching saucer included — because pretty should also be practical.',
        care: { light: '—', water: 'Wipe clean with a damp cloth', pet: '—' },
        is_ugc: 0, is_bestseller: 1
      },
      {
        id: 'pothos', title: 'Golden Pothos', subtitle: 'The gateway plant. Trails a metre a year.',
        badge: '-25%', badgeCls: 'sale', rating: 4.9, reviews: 301, sku: 'FR-POT-04',
        optionName: 'Pot', optionStyle: 'swatch',
        variants: [
          { id: 'po-nursery', label: 'Nursery', hex: '#D8D2C4', price: 2400, compareAt: 3200, available: true, qty: 60 },
          { id: 'po-brass', label: 'Brass', hex: '#B08D4F', price: 2900, compareAt: 3800, available: true, qty: 35 },
          { id: 'po-stone', label: 'Stone', hex: '#A9A49A', price: 3400, compareAt: 4400, available: true, qty: 28 }
        ],
        images: ['assets/img/p-pothos-1.jpg', 'assets/img/p-pothos-2.jpg'],
        gallery: ['assets/img/p-pothos-1.jpg', 'assets/img/p-pothos-2.jpg'],
        video: null,
        tags: 'trailing hanging easy care pet friendly shelf',
        chips: ['Trailing', 'Pet Friendly'],
        desc: 'The gateway plant. Trails a metre a year, forgives a missed watering (or three), and propagates in a glass of tap water. Everyone should own one at least once.',
        care: { light: 'Low to bright indirect — truly unfussy', water: 'Every 1–2 weeks; droops politely when thirsty', pet: 'Mildly toxic if eaten — best on a shelf' },
        is_ugc: 0, is_bestseller: 1
      },
      {
        id: 'olive', title: 'The Olive Tree', subtitle: 'Silvery leaves, impossible calm.',
        badge: 'Spotlight', badgeCls: 'new', rating: 5.0, reviews: 64, sku: 'FR-OLI-05',
        optionName: 'Pot', optionStyle: 'swatch',
        variants: [
          { id: 'ol-nursery', label: 'Nursery', hex: '#D8D2C4', price: 8900, compareAt: null, available: true, qty: 20 },
          { id: 'ol-terra', label: 'Terracotta', hex: '#B96A45', price: 9600, compareAt: null, available: true, qty: 15 },
          { id: 'ol-stone', label: 'Stone', hex: '#A9A49A', price: 10400, compareAt: null, available: true, qty: 10 }
        ],
        images: ['assets/img/p-olive-1.jpg', 'assets/img/p-olive-1.jpg'],
        gallery: ['assets/img/p-olive-1.jpg'],
        video: null,
        tags: 'tree mediterranean sunny silver slow grown spotlight',
        chips: ['Tree', 'Sunny'],
        desc: 'Silvery leaves, impossible calm. Our olives are pruned for compact indoor life and laugh in the face of a sunny windowsill. Ships at 90–110 cm.',
        care: { light: 'The sunniest spot you have — minimum 4h direct sun', water: 'Every 7–10 days; drench then drain fully', pet: 'Pet friendly' },
        is_ugc: 0, is_bestseller: 0
      },
      {
        id: 'adansonii', title: 'Adansonii Swiss Cheese Vine', subtitle: 'The rare one everyone screenshots.',
        badge: '', badgeCls: '', rating: 4.9, reviews: 88, sku: 'FR-ADA-11',
        optionName: 'Pot', optionStyle: 'swatch',
        variants: [
          { id: 'ad-nursery', label: 'Nursery', hex: '#D8D2C4', price: 42300, compareAt: null, available: true, qty: 15 },
          { id: 'ad-terra', label: 'Terracotta', hex: '#B96A45', price: 46300, compareAt: null, available: true, qty: 10 },
          { id: 'ad-stone', label: 'Stone', hex: '#A9A49A', price: 48900, compareAt: null, available: true, qty: 8 }
        ],
        images: [
          'https://frond-theme.myshopify.com/cdn/shop/files/preview_images/c6d98e558714492b83bd9ea72ad3362a.thumbnail.0000000000_1100x.jpg?v=1785490093',
          'https://frond-theme.myshopify.com/cdn/shop/files/preview_images/c6d98e558714492b83bd9ea72ad3362a.thumbnail.0000000000_1100x.jpg?v=1785490093'
        ],
        gallery: [
          'https://frond-theme.myshopify.com/cdn/shop/files/preview_images/c6d98e558714492b83bd9ea72ad3362a.thumbnail.0000000000_1100x.jpg?v=1785490093'
        ],
        video: 'https://frond-theme.myshopify.com/cdn/shop/videos/c/vp/c6d98e558714492b83bd9ea72ad3362a/c6d98e558714492b83bd9ea72ad3362a.HD-720p-3.0Mbps-90424809.mp4?v=0',
        tags: 'swiss cheese vine trailing rare monstera adansonii',
        chips: ['Rare', 'Trailing'],
        desc: 'The rare one everyone screenshots. Hole-punched leaves on a fast-climbing vine — give it a moss pole and it will outgrow your expectations.',
        care: { light: 'Bright, indirect light', water: 'Weekly; keep slightly humid', pet: 'Not pet friendly' },
        is_ugc: 1, is_bestseller: 0
      },
      {
        id: 'fern-pot', title: 'Mini Lemon Button Fern Pot', subtitle: 'A pocket-sized cloud of tiny leaflets.',
        badge: '', badgeCls: '', rating: 4.7, reviews: 143, sku: 'FR-FER-12',
        optionName: 'Pot', optionStyle: 'swatch',
        variants: [
          { id: 'fp-nursery', label: 'Nursery', hex: '#D8D2C4', price: 29900, compareAt: null, available: true, qty: 22 },
          { id: 'fp-terra', label: 'Terracotta', hex: '#B96A45', price: 33900, compareAt: null, available: true, qty: 16 },
          { id: 'fp-stone', label: 'Stone', hex: '#A9A49A', price: 36500, compareAt: null, available: true, qty: 10 }
        ],
        images: [
          'https://frond-theme.myshopify.com/cdn/shop/files/preview_images/6a92357b7a964f8db4ccc913f7c876dd.thumbnail.0000000000_1100x.jpg?v=1785490178',
          'https://frond-theme.myshopify.com/cdn/shop/files/preview_images/6a92357b7a964f8db4ccc913f7c876dd.thumbnail.0000000000_1100x.jpg?v=1785490178'
        ],
        gallery: [
          'https://frond-theme.myshopify.com/cdn/shop/files/preview_images/6a92357b7a964f8db4ccc913f7c876dd.thumbnail.0000000000_1100x.jpg?v=1785490178'
        ],
        video: 'https://frond-theme.myshopify.com/cdn/shop/videos/c/vp/6a92357b7a964f8db4ccc913f7c876dd/6a92357b7a964f8db4ccc913f7c876dd.HD-720p-3.0Mbps-90424811.mp4?v=0',
        tags: 'fern mini button lemon small desk',
        chips: ['Mini', 'Pet Friendly'],
        desc: 'A pocket-sized cloud of tiny leaflets that smells faintly of lemon when you brush past. The desk plant that never asks for much.',
        care: { light: 'Medium, indirect light', water: 'Keep evenly moist', pet: 'Pet friendly' },
        is_ugc: 1, is_bestseller: 0
      },
      {
        id: 'marble-queen', title: 'Marble Queen Pothos Plant', subtitle: 'Cream-marbled leaves, zero attitude.',
        badge: '', badgeCls: '', rating: 4.8, reviews: 177, sku: 'FR-MAR-13',
        optionName: 'Pot', optionStyle: 'swatch',
        variants: [
          { id: 'mq-nursery', label: 'Nursery', hex: '#D8D2C4', price: 19900, compareAt: 24900, available: true, qty: 30 },
          { id: 'mq-terra', label: 'Terracotta', hex: '#B96A45', price: 23500, compareAt: 28900, available: true, qty: 24 },
          { id: 'mq-stone', label: 'Stone', hex: '#A9A49A', price: 26900, compareAt: 31900, available: true, qty: 15 }
        ],
        images: [
          'https://frond-theme.myshopify.com/cdn/shop/files/preview_images/cc70edb421ad4ee7894998e3ce6af227.thumbnail.0000000000_1100x.jpg?v=1785490136',
          'https://frond-theme.myshopify.com/cdn/shop/files/preview_images/cc70edb421ad4ee7894998e3ce6af227.thumbnail.0000000000_1100x.jpg?v=1785490136'
        ],
        gallery: [
          'https://frond-theme.myshopify.com/cdn/shop/files/preview_images/cc70edb421ad4ee7894998e3ce6af227.thumbnail.0000000000_1100x.jpg?v=1785490136'
        ],
        video: 'https://frond-theme.myshopify.com/cdn/shop/videos/c/vp/cc70edb421ad4ee7894998e3ce6af227/cc70edb421ad4ee7894998e3ce6af227.HD-1080p-3.3Mbps-90424791.mp4?v=0',
        tags: 'marble queen pothos variegated trailing easy care',
        chips: ['Variegated', 'Trailing'],
        desc: 'Cream-marbled leaves, zero attitude. Trails gloriously from shelves and only gets more variegated in good light.',
        care: { light: 'Bright indirect keeps the marble bright', water: 'Every 1–2 weeks', pet: 'Keep away from nibblers' },
        is_ugc: 1, is_bestseller: 0
      },
      {
        id: 'melano', title: 'Philodendron Melanochrysum', subtitle: 'Black-velvet leaves with gold veins.',
        badge: '', badgeCls: '', rating: 5.0, reviews: 41, sku: 'FR-MEL-14',
        optionName: 'Pot', optionStyle: 'swatch',
        variants: [
          { id: 'me-nursery', label: 'Nursery', hex: '#D8D2C4', price: 35500, compareAt: null, available: true, qty: 10 },
          { id: 'me-terra', label: 'Terracotta', hex: '#B96A45', price: 39900, compareAt: null, available: true, qty: 8 },
          { id: 'me-stone', label: 'Stone', hex: '#A9A49A', price: 44500, compareAt: null, available: true, qty: 5 }
        ],
        images: [
          'https://frond-theme.myshopify.com/cdn/shop/files/preview_images/7a5a664a42da4c95887162369f8cd7dd.thumbnail.0000000000_1100x.jpg?v=1785490097',
          'https://frond-theme.myshopify.com/cdn/shop/files/preview_images/7a5a664a42da4c95887162369f8cd7dd.thumbnail.0000000000_1100x.jpg?v=1785490097'
        ],
        gallery: [
          'https://frond-theme.myshopify.com/cdn/shop/files/preview_images/7a5a664a42da4c95887162369f8cd7dd.thumbnail.0000000000_1100x.jpg?v=1785490097'
        ],
        video: 'https://frond-theme.myshopify.com/cdn/shop/videos/c/vp/7a5a664a42da4c95887162369f8cd7dd/7a5a664a42da4c95887162369f8cd7dd.HD-720p-3.0Mbps-90424813.mp4?v=0',
        tags: 'philodendron melanochrysum velvet rare collector',
        chips: ['Rare', 'Velvet'],
        desc: 'Black-velvet leaves with gold veins — the collector piece. Slower than you want, more beautiful than you deserve.',
        care: { light: 'Bright, indirect; no harsh noon sun', water: 'When top 3 cm dries out', pet: 'Not pet friendly' },
        is_ugc: 1, is_bestseller: 0
      },
      {
        id: 'monkey', title: 'Monstera Adansonii Monkey', subtitle: 'The playful sibling of the Swiss Cheese Vine.',
        badge: '', badgeCls: '', rating: 4.8, reviews: 73, sku: 'FR-ADA-15',
        optionName: 'Pot', optionStyle: 'swatch',
        variants: [
          { id: 'mk-nursery', label: 'Nursery', hex: '#D8D2C4', price: 26600, compareAt: null, available: true, qty: 18 },
          { id: 'mk-terra', label: 'Terracotta', hex: '#B96A45', price: 29900, compareAt: null, available: true, qty: 12 },
          { id: 'mk-stone', label: 'Stone', hex: '#A9A49A', price: 32900, compareAt: null, available: true, qty: 8 }
        ],
        images: [
          'https://frond-theme.myshopify.com/cdn/shop/files/preview_images/b0d12f617ef2486793923f73acb402fa.thumbnail.0000000000_1100x.jpg?v=1785490094',
          'https://frond-theme.myshopify.com/cdn/shop/files/preview_images/b0d12f617ef2486793923f73acb402fa.thumbnail.0000000000_1100x.jpg?v=1785490094'
        ],
        gallery: [
          'https://frond-theme.myshopify.com/cdn/shop/files/preview_images/b0d12f617ef2486793923f73acb402fa.thumbnail.0000000000_1100x.jpg?v=1785490094'
        ],
        video: 'https://frond-theme.myshopify.com/cdn/shop/videos/c/vp/b0d12f617ef2486793923f73acb402fa/b0d12f617ef2486793923f73acb402fa.HD-720p-3.0Mbps-90424808.mp4?v=0',
        tags: 'monstera adansonii monkey mask trailing hoop',
        chips: ['Trailing', 'Hoop'],
        desc: 'The playful sibling of the Swiss Cheese Vine — narrower leaves, wilder climbing habit. Trained on a hoop for instant shelf presence.',
        care: { light: 'Bright, indirect light', water: 'Weekly', pet: 'Not pet friendly' },
        is_ugc: 1, is_bestseller: 0
      }
    ];

    let prodSort = 1;
    for (const p of PRODUCTS) {
      insertProduct.run(
        p.id, p.title, p.subtitle, p.desc, p.badge, p.badgeCls, p.rating, p.reviews, p.sku,
        p.optionName, p.optionStyle, p.tags, JSON.stringify(p.chips),
        p.care.light, p.care.water, p.care.pet, p.video, p.is_ugc, p.is_bestseller, 1, prodSort++
      );

      let varSort = 1;
      for (const v of p.variants) {
        insertVariant.run(
          v.id, p.id, v.label, v.hex, v.price, v.compareAt, `${p.sku}-${v.label.substring(0, 3).toUpperCase()}`,
          v.qty, v.available ? 1 : 0, varSort++
        );
      }

      let imgSort = 1;
      for (const img of p.gallery) {
        insertImage.run(
          `${p.id}-img-${imgSort}`, p.id, img, `${p.title} view ${imgSort}`,
          imgSort === 1 ? 1 : 0, imgSort === 2 ? 1 : 0, 1, imgSort++
        );
      }
    }

    // 3. Collections & Collection Products
    const COLLECTIONS = [
      { id: 'foliage-plants', title: 'Foliage Plants', desc: 'Lush leaves and architectural shapes.', img: 'assets/img/ch-big-1.jpg', count: '31', feat: 1, sort: 1, prods: ['monstera', 'fig', 'pothos', 'adansonii', 'melano'] },
      { id: 'pots-objects', title: 'Pots & Objects', desc: 'Handcrafted stoneware and ribbed vessels.', img: 'assets/img/ch-big-2.jpg', count: '12', feat: 1, sort: 2, prods: ['planter'] },
      { id: 'starter-sets', title: 'Starter Sets', desc: 'Forgiving varieties with complete care notes.', img: 'assets/img/ch-sq-1.jpg', count: '20', feat: 0, sort: 3, prods: ['pothos', 'fern-pot', 'monstera'] },
      { id: 'cacti-succulents', title: 'Cacti & Succulents', desc: 'Sun-worshippers that thrive on neglect.', img: 'assets/img/ch-sq-2.jpg', count: '10', feat: 0, sort: 4, prods: ['olive'] },
      { id: 'trailing-hanging', title: 'Trailing & Hanging', desc: 'Cascading greenery for high shelves and sills.', img: 'assets/img/ch-sq-3.jpg', count: '8', feat: 0, sort: 5, prods: ['pothos', 'adansonii', 'marble-queen', 'monkey'] },
      { id: 'rare-finds', title: 'Rare Finds', desc: 'Unusual variegations and collector specimens.', img: 'assets/img/ch-sq-4.jpg', count: '5', feat: 0, sort: 6, prods: ['melano', 'adansonii', 'monkey'] }
    ];

    for (const c of COLLECTIONS) {
      insertCollection.run(c.id, c.title, c.desc, c.img, c.count, c.feat, c.sort, 1);
      let cpSort = 1;
      for (const pid of c.prods) {
        insertCollectionProduct.run(c.id, pid, cpSort++);
      }
    }

    // 4. Mood Tiles
    const MOOD_TILES = [
      { id: 'mood-statement', title: 'Statement plants', img: 'assets/img/p-monstera-2.jpg', link: '#collections', sort: 1 },
      { id: 'mood-easy', title: 'Easy care', img: 'assets/img/p-pothos-2.jpg', link: '#collections', sort: 2 },
      { id: 'mood-pots', title: 'Pots & objects', img: 'assets/img/p-planter-2.jpg', link: '#collections', sort: 3 }
    ];
    for (const m of MOOD_TILES) {
      insertMoodTile.run(m.id, m.title, m.img, m.link, m.sort, 1);
    }

    // 5. Shade Finder Tabs
    const SHADE_TABS = [
      { id: 'low', label: 'Low Light', img: 'assets/img/p-pothos-2.jpg', prods: ['pothos', 'marble-queen', 'fern-pot', 'monkey'], sort: 1 },
      { id: 'medium', label: 'Medium Light', img: 'assets/img/ch-big-1.jpg', prods: ['monstera', 'adansonii', 'fern-pot', 'pothos'], sort: 2 },
      { id: 'bright', label: 'Bright Indirect', img: 'assets/img/p-fig-2.jpg', prods: ['fig', 'monstera', 'melano', 'adansonii'], sort: 3 },
      { id: 'sun', label: 'Direct Sun', img: 'assets/img/hero.jpg', prods: ['olive', 'fig', 'melano', 'marble-queen'], sort: 4 }
    ];
    for (const s of SHADE_TABS) {
      insertShadeTab.run(s.id, s.label, s.img, s.sort, 1);
      let spSort = 1;
      for (const pid of s.prods) {
        insertShadeProduct.run(s.id, pid, spSort++);
      }
    }

    // 6. UGC Community Posts
    const UGC_DATA = [
      { id: 'ugc-1', pid: 'adansonii', title: 'Adansonii Swiss Cheese Vine', price: '$423.00', thumb: 'https://frond-theme.myshopify.com/cdn/shop/files/69819600273777_produ.png?v=1785490000&width=200', poster: 'https://frond-theme.myshopify.com/cdn/shop/files/preview_images/c6d98e558714492b83bd9ea72ad3362a.thumbnail.0000000000_1100x.jpg?v=1785490093', video: 'https://frond-theme.myshopify.com/cdn/shop/videos/c/vp/c6d98e558714492b83bd9ea72ad3362a/c6d98e558714492b83bd9ea72ad3362a.HD-720p-3.0Mbps-90424809.mp4?v=0', sort: 1 },
      { id: 'ugc-2', pid: 'fern-pot', title: 'Mini Lemon Button Fern Pot', price: '$299.00', thumb: 'https://frond-theme.myshopify.com/cdn/shop/files/69818757513585_produ.png?v=1785489975&width=200', poster: 'https://frond-theme.myshopify.com/cdn/shop/files/preview_images/6a92357b7a964f8db4ccc913f7c876dd.thumbnail.0000000000_1100x.jpg?v=1785490178', video: 'https://frond-theme.myshopify.com/cdn/shop/videos/c/vp/6a92357b7a964f8db4ccc913f7c876dd/6a92357b7a964f8db4ccc913f7c876dd.HD-720p-3.0Mbps-90424811.mp4?v=0', sort: 2 },
      { id: 'ugc-3', pid: 'marble-queen', title: 'Marble Queen Pothos Plant', price: '$199.00', thumb: 'https://frond-theme.myshopify.com/cdn/shop/files/69818845626737_produ.png?v=1785489982&width=200', poster: 'https://frond-theme.myshopify.com/cdn/shop/files/preview_images/cc70edb421ad4ee7894998e3ce6af227.thumbnail.0000000000_1100x.jpg?v=1785490136', video: 'https://frond-theme.myshopify.com/cdn/shop/videos/c/vp/cc70edb421ad4ee7894998e3ce6af227/cc70edb421ad4ee7894998e3ce6af227.HD-1080p-3.3Mbps-90424791.mp4?v=0', sort: 3 },
      { id: 'ugc-4', pid: 'melano', title: 'Philodendron Melanochrysum', price: '$355.00', thumb: 'https://frond-theme.myshopify.com/cdn/shop/files/69819635171697_produ.png?v=1785490003&width=200', poster: 'https://frond-theme.myshopify.com/cdn/shop/files/preview_images/7a5a664a42da4c95887162369f8cd7dd.thumbnail.0000000000_1100x.jpg?v=1785490097', video: 'https://frond-theme.myshopify.com/cdn/shop/videos/c/vp/7a5a664a42da4c95887162369f8cd7dd/7a5a664a42da4c95887162369f8cd7dd.HD-720p-3.0Mbps-90424813.mp4?v=0', sort: 4 },
      { id: 'ugc-5', pid: 'monkey', title: 'Monstera Adansonii Monkey', price: '$266.00', thumb: 'https://frond-theme.myshopify.com/cdn/shop/files/69819583660401_img-4.png?v=1785489998&width=200', poster: 'https://frond-theme.myshopify.com/cdn/shop/files/preview_images/b0d12f617ef2486793923f73acb402fa.thumbnail.0000000000_1100x.jpg?v=1785490094', video: 'https://frond-theme.myshopify.com/cdn/shop/videos/c/vp/b0d12f617ef2486793923f73acb402fa/b0d12f617ef2486793923f73acb402fa.HD-720p-3.0Mbps-90424808.mp4?v=0', sort: 5 }
    ];
    for (const u of UGC_DATA) {
      insertUgc.run(u.id, u.pid, u.title, u.video, u.poster, u.thumb, u.price, u.sort, 1);
    }

    // 7. Shoppable Videos ("As Seen In")
    const SEEN_DATA = [
      { id: 'seen-1', pid: 'adansonii', title: 'Adansonii Swiss Cheese Vine', price: 'From $423.00', orig: null, thumb: 'https://frond-theme.myshopify.com/cdn/shop/files/69819600273777_produ.png?v=1785490000&width=200', poster: 'https://frond-theme.myshopify.com/cdn/shop/files/preview_images/c6d98e558714492b83bd9ea72ad3362a.thumbnail.0000000000_1100x.jpg?v=1785490093', video: 'https://frond-theme.myshopify.com/cdn/shop/videos/c/vp/c6d98e558714492b83bd9ea72ad3362a/c6d98e558714492b83bd9ea72ad3362a.HD-720p-3.0Mbps-90424809.mp4?v=0', sort: 1 },
      { id: 'seen-2', pid: 'fern-pot', title: 'Mini Lemon Button Fern Pot', price: 'From $299.00', orig: null, thumb: 'https://frond-theme.myshopify.com/cdn/shop/files/69818757513585_produ.png?v=1785489975&width=200', poster: 'https://frond-theme.myshopify.com/cdn/shop/files/preview_images/6a92357b7a964f8db4ccc913f7c876dd.thumbnail.0000000000_1100x.jpg?v=1785490178', video: 'https://frond-theme.myshopify.com/cdn/shop/videos/c/vp/6a92357b7a964f8db4ccc913f7c876dd/6a92357b7a964f8db4ccc913f7c876dd.HD-720p-3.0Mbps-90424811.mp4?v=0', sort: 2 },
      { id: 'seen-3', pid: 'marble-queen', title: 'Marble Queen Pothos Plant', price: '$199.00', orig: '$249.00', thumb: 'https://frond-theme.myshopify.com/cdn/shop/files/69818845626737_produ.png?v=1785489982&width=200', poster: 'https://frond-theme.myshopify.com/cdn/shop/files/preview_images/cc70edb421ad4ee7894998e3ce6af227.thumbnail.0000000000_1100x.jpg?v=1785490136', video: 'https://frond-theme.myshopify.com/cdn/shop/videos/c/vp/cc70edb421ad4ee7894998e3ce6af227/cc70edb421ad4ee7894998e3ce6af227.HD-1080p-3.3Mbps-90424791.mp4?v=0', sort: 3 },
      { id: 'seen-4', pid: 'melano', title: 'Philodendron Melanochrysum', price: 'From $355.00', orig: null, thumb: 'https://frond-theme.myshopify.com/cdn/shop/files/69819635171697_produ.png?v=1785490003&width=200', poster: 'https://frond-theme.myshopify.com/cdn/shop/files/preview_images/7a5a664a42da4c95887162369f8cd7dd.thumbnail.0000000000_1100x.jpg?v=1785490097', video: 'https://frond-theme.myshopify.com/cdn/shop/videos/c/vp/7a5a664a42da4c95887162369f8cd7dd/7a5a664a42da4c95887162369f8cd7dd.HD-720p-3.0Mbps-90424813.mp4?v=0', sort: 4 },
      { id: 'seen-5', pid: 'monkey', title: 'Monstera Adansonii Monkey', price: 'From $266.00', orig: null, thumb: 'https://frond-theme.myshopify.com/cdn/shop/files/69819583660401_img-4.png?v=1785489998&width=200', poster: 'https://frond-theme.myshopify.com/cdn/shop/files/preview_images/b0d12f617ef2486793923f73acb402fa.thumbnail.0000000000_1100x.jpg?v=1785490094', video: 'https://frond-theme.myshopify.com/cdn/shop/videos/c/vp/b0d12f617ef2486793923f73acb402fa/b0d12f617ef2486793923f73acb402fa.HD-720p-3.0Mbps-90424808.mp4?v=0', sort: 5 }
    ];
    for (const v of SEEN_DATA) {
      insertShoppable.run(v.id, v.pid, v.title, v.video, v.poster, v.thumb, v.price, v.orig, v.sort, 1);
    }

    // 8. Hero Content
    insertHero.run(
      'main',
      'New season — The Dune Edit',
      'Botanical',
      'beauty',
      'from our greenhouse',
      'to your home.',
      'Slow-grown plants and quietly sculptural objects, shipped from our greenhouse to your doorstep — roots happy, floors clean.',
      'Shop bestsellers',
      '#shop',
      'Our story',
      '#story',
      '50K+',
      'Plants rehomed',
      '98%',
      'Arrive happy',
      '7 days',
      'Root guarantee',
      JSON.stringify(['monstera', 'planter', 'fig', 'pothos'])
    );

    // 9. Editorial Spotlight Section
    insertEditorial.run(
      'story',
      'Plant of the season',
      'assets/img/p-olive-1.jpg',
      'Our roots',
      "A home isn't finished until something in it is growing.",
      'We started FROND in a one-bedroom apartment with forty plants and one belief: greenery isn\'t decoration — it\'s company.',
      'Every plant is grown slowly in our family greenhouse, acclimated to real indoor light, and potted by hand the day it ships. No cold storage, no plastic sleeves, no mystery soil. Just a living thing, packed like we care about it — because we do.',
      '2019',
      '140+',
      '0',
      'olive',
      1
    );

    // 10. Announcements
    const ANNOUNCEMENTS = [
      { id: 'ann-1', text: 'Free shipping on orders over $75', icon: '✦', link: '#shop', sort: 1 },
      { id: 'ann-2', text: 'New in — The Dune Collection', icon: '✦', link: '#collections', sort: 2 },
      { id: 'ann-3', text: 'Every plant ships with a 7-day root guarantee', icon: '✦', link: '#story', sort: 3 }
    ];
    for (const a of ANNOUNCEMENTS) {
      insertAnnouncement.run(a.id, a.text, a.icon, a.link, '36s', a.sort, 1);
    }

    // 11. Campaigns & Coupons
    const CAMPAIGNS = [
      { id: 'camp-1', kicker: 'First-order treat — flash deal', title: '15% off your first FROND', desc: 'Automatic discount applies at checkout or use code PLANTLOVE15.', style: 'ticket', code: 'PLANTLOVE15', ctaLabel: 'Copy', ctaUrl: '', hours: 26, sort: 1 },
      { id: 'camp-2', kicker: 'Bundle magic', title: 'Buy 2 plants, the care kit is on us', desc: 'Mist sprayer, neem oil & a moss pole — auto-added to your box.', style: 'green', code: 'CAREKITFREE', ctaLabel: 'Build your bundle', ctaUrl: 'index.html#shop', hours: 48, sort: 2 },
      { id: 'camp-3', kicker: 'Plant + pot', title: '10% off when it ships potted', desc: 'Choose any decorative pot — we pot your plant before it travels.', style: 'clay', code: 'POTTED10', ctaLabel: 'Shop pots', ctaUrl: 'index.html#collections', hours: 72, sort: 3 }
    ];
    for (const c of CAMPAIGNS) {
      insertCampaign.run(c.id, c.kicker, c.title, c.desc, c.style, c.code, c.ctaLabel, c.ctaUrl, c.hours, c.sort, 1);
    }

    const COUPONS = [
      { id: 'coup-1', code: 'PLANTLOVE15', title: '15% First Order Discount', type: 'percent', val: 15, min: 0, limit: 1000 },
      { id: 'coup-2', code: 'POTTED10', title: '10% Plant & Pot Bundle', type: 'percent', val: 10, min: 5000, limit: 500 },
      { id: 'coup-3', code: 'FREESHIP', title: 'Free Shipping Voucher', type: 'fixed', val: 1000, min: 3000, limit: 200 }
    ];
    for (const cp of COUPONS) {
      insertCoupon.run(cp.id, cp.code, cp.title, cp.type, cp.val, cp.min, cp.limit, 1);
    }

    // 12. Blog Articles
    const BLOGS = [
      { id: 'propagate-in-water', title: 'How to propagate (almost) anything in water', excerpt: 'Care Lab notes on cuttings and clean roots.', content: 'Detailed guide on water propagation rituals...', tag: 'Care Lab', img: 'assets/img/blog-1.jpg', time: '6 min read', author: 'Maya from the greenhouse', role: 'Care Lab' },
      { id: 'repotting-without-drama', title: 'Repotting without the drama: a 5-step ritual', excerpt: 'Field notes on seasonal soil refresh.', content: 'Step-by-step pot upgrade ritual without root shock...', tag: 'Guides', img: 'assets/img/blog-2.jpg', time: '4 min read', author: 'Field notes', role: 'Guides' },
      { id: 'reading-your-light', title: 'Reading your light like a plant does', excerpt: 'Deep dive into light meters and window orientations.', content: 'How to measure foot candles and orient your green friends...', tag: 'Guides', img: 'assets/img/blog-3.jpg', time: '8 min read', author: 'Deep dive', role: 'Guides' },
      { id: 'beginner-plants', title: '5 plants that forgive absolute beginners', excerpt: 'Starter pack recommendations for easy living.', content: 'Plants that smile even when watering is missed...', tag: 'Plant School', img: 'assets/img/p-pothos-2.jpg', time: '5 min read', author: 'Starter pack', role: 'Plant School' }
    ];
    for (const b of BLOGS) {
      insertBlog.run(b.id, b.title, b.excerpt, b.content, b.tag, b.img, b.time, b.author, b.role, 0, 1);
    }

    // 13. FAQs
    const FAQS = [
      { id: 'faq-1', cat: 'Shipping', q: 'How does my plant survive shipping?', a: 'Each plant is potted, watered and secured in a soil-lock insert the day it ships. Boxes are plastic-free with breathing holes, for 1–3 days in transit.', open: 1, sort: 1 },
      { id: 'faq-2', cat: 'Guarantee', q: 'What is the 7-day root guarantee?', a: 'If your plant arrives damaged or declines within 7 days, send us a photo — a replacement ships free, no return required.', open: 0, sort: 2 },
      { id: 'faq-3', cat: 'Products', q: 'Does the decorative pot come potted?', a: 'Plants ship in their nursery pots; decorative pots ship alongside. Pick "ships potted" at checkout and we pot it for you (10% bundle discount applies).', open: 0, sort: 3 },
      { id: 'faq-4', cat: 'Gifting', q: 'Can I add a gift note?', a: 'Yes — free handwritten cards, and we never include prices in the box. Add your note in the cart before checkout.', open: 0, sort: 4 },
      { id: 'faq-5', cat: 'Care', q: "I'm a serial plant-killer. Where do I start?", a: 'Start with our Easy Care collection, and read the care card in the box — each one is written for the exact plant you received, not a generic species page.', open: 0, sort: 5 },
      { id: 'faq-6', cat: 'Shipping', q: 'Do you ship internationally?', a: 'Currently EU-wide; soil regulations keep us from shipping live plants overseas. Pots & objects travel worldwide.', open: 0, sort: 6 }
    ];
    for (const f of FAQS) {
      insertFaq.run(f.id, f.cat, f.q, f.a, f.open, f.sort, 1);
    }

    // 14. Navigation Links
    const NAV_LINKS = [
      { id: 'nav-1', loc: 'header', label: 'Shop', url: '#shop', badge: null, sort: 1 },
      { id: 'nav-2', loc: 'header', label: 'Collections', url: '#collections', badge: null, sort: 2 },
      { id: 'nav-3', loc: 'header', label: 'Journal', url: '#story', badge: null, sort: 3 },
      { id: 'nav-4', loc: 'header', label: 'Community', url: '#community', badge: null, sort: 4 },
      { id: 'nav-5', loc: 'footer_shop', label: 'Bestsellers', url: '#shop', badge: null, sort: 1 },
      { id: 'nav-6', loc: 'footer_shop', label: 'Statement plants', url: '#collections', badge: null, sort: 2 },
      { id: 'nav-7', loc: 'footer_shop', label: 'Easy care', url: '#collections', badge: null, sort: 3 },
      { id: 'nav-8', loc: 'footer_shop', label: 'Pots & objects', url: '#collections', badge: null, sort: 4 },
      { id: 'nav-9', loc: 'footer_help', label: 'Shipping & returns', url: '#', badge: null, sort: 1 },
      { id: 'nav-10', loc: 'footer_help', label: 'Root guarantee', url: '#', badge: null, sort: 2 },
      { id: 'nav-11', loc: 'footer_help', label: 'Care guides', url: '#', badge: null, sort: 3 },
      { id: 'nav-12', loc: 'footer_help', label: 'Contact', url: '#', badge: null, sort: 4 }
    ];
    for (const n of NAV_LINKS) {
      insertNav.run(n.id, n.loc, n.label, n.url, n.badge, n.sort, 1);
    }

    // 15. Cross-sell Product Recommendations ("Complete the Look")
    const RECOS = [
      { id: 'rec-1', src: 'monstera', target: 'planter', type: 'complete_look', sort: 1 },
      { id: 'rec-2', src: 'monstera', target: 'fig', type: 'complete_look', sort: 2 },
      { id: 'rec-3', src: 'monstera', target: 'pothos', type: 'related', sort: 3 },
      { id: 'rec-4', src: 'fig', target: 'planter', type: 'complete_look', sort: 1 },
      { id: 'rec-5', src: 'fig', target: 'olive', type: 'related', sort: 2 },
      { id: 'rec-6', src: 'pothos', target: 'planter', type: 'complete_look', sort: 1 }
    ];
    for (const r of RECOS) {
      insertReco.run(r.id, r.src, r.target, r.type, r.sort);
    }
  });

  transaction();
  console.log('✅ Database seeded successfully with 10 products, variants, collections, campaigns, blogs, and settings!');
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase();
}
