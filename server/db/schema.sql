-- ============================================================
-- FROND Relational Database Schema (SQLite)
-- ============================================================

PRAGMA foreign_keys = ON;

-- 1. Site Settings (Key-Value configuration)
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  type TEXT DEFAULT 'string',
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 1b. AI Service API Credentials (encrypted storage)
CREATE TABLE IF NOT EXISTS api_credentials (
  service_key TEXT PRIMARY KEY,  -- 'EXA_API_KEY', 'MISTRAL_API_KEY', etc.
  encrypted_value TEXT NOT NULL,  -- base64 obfuscated
  label TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Media Library (Cloudflare R2 & Local fallback)
CREATE TABLE IF NOT EXISTS media_files (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER DEFAULT 0,
  storage_provider TEXT DEFAULT 'r2', -- 'r2' or 'local'
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Products
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY, -- handle/slug (e.g. 'monstera', 'fig')
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  badge TEXT DEFAULT '',
  badge_class TEXT DEFAULT '', -- 'new', 'sale', ''
  rating REAL DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  sku TEXT,
  option_name TEXT DEFAULT 'Pot', -- 'Pot', 'Size', 'Color'
  option_style TEXT DEFAULT 'swatch', -- 'swatch', 'pill'
  tags TEXT DEFAULT '',
  chips TEXT DEFAULT '[]', -- JSON array of string tags
  light_care TEXT,
  water_care TEXT,
  pet_care TEXT,
  video_url TEXT,
  is_ugc INTEGER DEFAULT 0,
  is_bestseller INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY, -- e.g. 'mon-nursery'
  product_id TEXT NOT NULL,
  label TEXT NOT NULL, -- 'Nursery', 'Terracotta', 'Stone'
  hex_color TEXT, -- '#D8D2C4'
  price INTEGER NOT NULL, -- in cents: 4800 = $48.00
  compare_at_price INTEGER, -- in cents
  sku TEXT,
  inventory_qty INTEGER DEFAULT 99,
  is_available INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 5. Product Images & Gallery
CREATE TABLE IF NOT EXISTS product_images (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  url TEXT NOT NULL,
  alt_text TEXT,
  is_primary INTEGER DEFAULT 0,
  is_hover INTEGER DEFAULT 0,
  is_gallery INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 6. Collections
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY, -- slug: 'statement-plants', 'easy-care'
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  item_count_label TEXT,
  is_featured INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Collection Products (Join Table)
CREATE TABLE IF NOT EXISTS collection_products (
  collection_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (collection_id, product_id),
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 8. Mood Tiles ("Shop by Mood" tiles on homepage)
CREATE TABLE IF NOT EXISTS mood_tiles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1
);

-- 9. Shade Finder (Light level tabs)
CREATE TABLE IF NOT EXISTS shade_tabs (
  id TEXT PRIMARY KEY, -- 'low', 'medium', 'bright', 'sun'
  label TEXT NOT NULL, -- 'Low Light', 'Medium Light', etc.
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1
);

-- 10. Shade Tab Products (Join Table)
CREATE TABLE IF NOT EXISTS shade_tab_products (
  shade_tab_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (shade_tab_id, product_id),
  FOREIGN KEY (shade_tab_id) REFERENCES shade_tabs(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 11. UGC Community Stories
CREATE TABLE IF NOT EXISTS ugc_posts (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  poster_url TEXT NOT NULL,
  thumb_url TEXT NOT NULL,
  price_display TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 12. As Seen In (Shoppable Videos)
CREATE TABLE IF NOT EXISTS shoppable_videos (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  poster_url TEXT NOT NULL,
  thumb_url TEXT NOT NULL,
  price_label TEXT,
  original_price_label TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 13. Hero Content & Metrics
CREATE TABLE IF NOT EXISTS hero_content (
  id TEXT PRIMARY KEY DEFAULT 'main',
  eyebrow TEXT NOT NULL,
  title_line_1 TEXT NOT NULL,
  title_accent TEXT NOT NULL,
  title_line_2 TEXT NOT NULL,
  title_line_3 TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  cta_primary_label TEXT NOT NULL,
  cta_primary_link TEXT NOT NULL,
  cta_secondary_label TEXT NOT NULL,
  cta_secondary_link TEXT NOT NULL,
  metric_1_value TEXT NOT NULL,
  metric_1_label TEXT NOT NULL,
  metric_2_value TEXT NOT NULL,
  metric_2_label TEXT NOT NULL,
  metric_3_value TEXT NOT NULL,
  metric_3_label TEXT NOT NULL,
  collage_products TEXT DEFAULT '["monstera","planter","fig","pothos"]', -- JSON array
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 14. Editorial Spotlight Section
CREATE TABLE IF NOT EXISTS editorial_sections (
  id TEXT PRIMARY KEY DEFAULT 'story',
  tag_label TEXT NOT NULL,
  image_url TEXT NOT NULL,
  eyebrow TEXT NOT NULL,
  title TEXT NOT NULL,
  lead_text TEXT NOT NULL,
  body_text TEXT NOT NULL,
  stat_year TEXT NOT NULL,
  stat_varieties TEXT NOT NULL,
  stat_packaging TEXT NOT NULL,
  spotlight_product_id TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (spotlight_product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 15. Announcements / Marquee Bar
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  icon TEXT DEFAULT '✦',
  link_url TEXT,
  speed_seconds TEXT DEFAULT '36s',
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 16. Campaigns & Flash Deals
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  kicker TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  card_style TEXT DEFAULT 'ticket', -- 'ticket', 'green', 'clay'
  coupon_code TEXT,
  cta_label TEXT,
  cta_url TEXT,
  countdown_hours INTEGER DEFAULT 26,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 17. Coupons / Promo Codes
CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percent', -- 'percent', 'fixed'
  discount_value INTEGER NOT NULL, -- 15 (for 15%) or 1500 (for $15.00)
  min_order_cents INTEGER DEFAULT 0,
  expires_at DATETIME,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 18. Product Recommendations / Complete The Look
CREATE TABLE IF NOT EXISTS product_recommendations (
  id TEXT PRIMARY KEY,
  source_product_id TEXT NOT NULL,
  recommended_product_id TEXT NOT NULL,
  relation_type TEXT DEFAULT 'complete_look', -- 'complete_look', 'related', 'pairs_well'
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (source_product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (recommended_product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 19. Blog / Journal Articles
CREATE TABLE IF NOT EXISTS blog_articles (
  id TEXT PRIMARY KEY, -- slug: 'propagate-in-water'
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  tag TEXT NOT NULL, -- 'Care Lab', 'Guides', 'Plant School'
  cover_image TEXT NOT NULL,
  read_time TEXT NOT NULL, -- '6 min read'
  author_name TEXT NOT NULL, -- 'Maya from the greenhouse'
  author_role TEXT, -- 'Field notes', 'Deep dive', 'Starter pack'
  is_featured INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 1,
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 20. FAQs
CREATE TABLE IF NOT EXISTS faqs (
  id TEXT PRIMARY KEY,
  category TEXT DEFAULT 'General',
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_open_default INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1
);

-- 21. Newsletter Subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'unsubscribed'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 22. Navigation Links (Header & Footers)
CREATE TABLE IF NOT EXISTS navigation_links (
  id TEXT PRIMARY KEY,
  menu_location TEXT NOT NULL, -- 'header', 'footer_shop', 'footer_help', 'footer_social', 'menu_drawer'
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  badge TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1
);

-- 23. Orders
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  country TEXT DEFAULT 'US',
  subtotal_cents INTEGER NOT NULL,
  discount_cents INTEGER DEFAULT 0,
  shipping_cents INTEGER DEFAULT 0,
  total_cents INTEGER NOT NULL,
  coupon_code TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'shipped', 'delivered', 'cancelled'
  payment_status TEXT DEFAULT 'paid', -- 'pending', 'paid', 'refunded'
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 24. Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  product_title TEXT NOT NULL,
  variant_label TEXT NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  total_price_cents INTEGER NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 25. Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  rating REAL NOT NULL DEFAULT 5.0,
  title TEXT,
  comment TEXT NOT NULL,
  verified_purchase INTEGER DEFAULT 1,
  status TEXT DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
