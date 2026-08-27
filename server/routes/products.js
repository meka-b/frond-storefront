import { Hono } from 'hono';
import db from '../db/index.js';

const app = new Hono();

// GET all products (with variant count, images, status for admin)
app.get('/', c => {
  const products = db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM product_variants WHERE product_id = p.id) as variant_count,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
    FROM products p
    ORDER BY p.sort_order ASC, p.created_at DESC
  `).all();

  return c.json(products);
});

// GET single product by id or handle with full variants, images, care, and recommendations
app.get('/:id', c => {
  const id = c.req.param('id');
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);

  if (!product) {
    return c.json({ error: 'Product not found' }, 404);
  }

  const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order ASC').all(id);
  const images = db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC').all(id);
  const recommendations = db.prepare(`
    SELECT pr.*, p.title as rec_title, p.badge as rec_badge,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as rec_image
    FROM product_recommendations pr
    JOIN products p ON pr.recommended_product_id = p.id
    WHERE pr.source_product_id = ?
    ORDER BY pr.sort_order ASC
  `).all(id);

  let chips = [];
  try { chips = JSON.parse(product.chips || '[]'); } catch { chips = []; }

  return c.json({
    ...product,
    chips,
    variants,
    images,
    recommendations
  });
});

// POST create a new product
app.post('/', async c => {
  const body = await c.req.json();
  const id = body.id || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
  if (existing) {
    return c.json({ error: 'A product with this ID or slug already exists' }, 400);
  }

  const insertProduct = db.prepare(`
    INSERT INTO products (
      id, title, subtitle, description, badge, badge_class, rating, reviews_count,
      sku, option_name, option_style, tags, chips, light_care, water_care, pet_care,
      video_url, is_ugc, is_bestseller, is_published, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertVariant = db.prepare(`
    INSERT INTO product_variants (id, product_id, label, hex_color, price, compare_at_price, sku, inventory_qty, is_available, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertImage = db.prepare(`
    INSERT INTO product_images (id, product_id, url, alt_text, is_primary, is_hover, is_gallery, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    insertProduct.run(
      id,
      body.title,
      body.subtitle || '',
      body.description || '',
      body.badge || '',
      body.badge_class || '',
      body.rating || 5.0,
      body.reviews_count || 0,
      body.sku || `FR-${id.substring(0, 3).toUpperCase()}`,
      body.option_name || 'Pot',
      body.option_style || 'swatch',
      body.tags || '',
      JSON.stringify(body.chips || []),
      body.light_care || '',
      body.water_care || '',
      body.pet_care || '',
      body.video_url || null,
      body.is_ugc ? 1 : 0,
      body.is_bestseller ? 1 : 0,
      body.is_published !== undefined ? (body.is_published ? 1 : 0) : 1,
      body.sort_order || 0
    );

    // Insert variants
    if (Array.isArray(body.variants) && body.variants.length > 0) {
      let vSort = 1;
      for (const v of body.variants) {
        const vid = v.id || `${id}-${v.label.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        insertVariant.run(
          vid, id, v.label, v.hex_color || '#D8D2C4',
          Number(v.price) || 4800,
          v.compare_at_price ? Number(v.compare_at_price) : null,
          v.sku || `${body.sku || id}-${vSort}`,
          v.inventory_qty !== undefined ? Number(v.inventory_qty) : 50,
          v.is_available ? 1 : 0,
          vSort++
        );
      }
    } else {
      // Default variant
      insertVariant.run(`${id}-standard`, id, 'Standard', '#D8D2C4', 4800, null, `${id}-STD`, 50, 1, 1);
    }

    // Insert images
    if (Array.isArray(body.images) && body.images.length > 0) {
      let iSort = 1;
      for (const img of body.images) {
        const imgUrl = typeof img === 'string' ? img : img.url;
        insertImage.run(
          `${id}-img-${iSort}`, id, imgUrl, `${body.title} view ${iSort}`,
          iSort === 1 ? 1 : 0, iSort === 2 ? 1 : 0, 1, iSort++
        );
      }
    }
  });

  transaction();
  return c.json({ success: true, id }, 201);
});

// PUT update an existing product
app.put('/:id', async c => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
  if (!product) {
    return c.json({ error: 'Product not found' }, 404);
  }

  const updateProduct = db.prepare(`
    UPDATE products SET
      title = ?, subtitle = ?, description = ?, badge = ?, badge_class = ?,
      rating = ?, reviews_count = ?, sku = ?, option_name = ?, option_style = ?,
      tags = ?, chips = ?, light_care = ?, water_care = ?, pet_care = ?,
      video_url = ?, is_ugc = ?, is_bestseller = ?, is_published = ?,
      sort_order = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  const deleteVariants = db.prepare('DELETE FROM product_variants WHERE product_id = ?');
  const insertVariant = db.prepare(`
    INSERT INTO product_variants (id, product_id, label, hex_color, price, compare_at_price, sku, inventory_qty, is_available, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const deleteImages = db.prepare('DELETE FROM product_images WHERE product_id = ?');
  const insertImage = db.prepare(`
    INSERT INTO product_images (id, product_id, url, alt_text, is_primary, is_hover, is_gallery, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    updateProduct.run(
      body.title,
      body.subtitle || '',
      body.description || '',
      body.badge || '',
      body.badge_class || '',
      body.rating || 5.0,
      body.reviews_count || 0,
      body.sku || '',
      body.option_name || 'Pot',
      body.option_style || 'swatch',
      body.tags || '',
      JSON.stringify(body.chips || []),
      body.light_care || '',
      body.water_care || '',
      body.pet_care || '',
      body.video_url || null,
      body.is_ugc ? 1 : 0,
      body.is_bestseller ? 1 : 0,
      body.is_published ? 1 : 0,
      body.sort_order || 0,
      id
    );

    if (Array.isArray(body.variants)) {
      deleteVariants.run(id);
      let vSort = 1;
      for (const v of body.variants) {
        const vid = v.id || `${id}-${v.label.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        insertVariant.run(
          vid, id, v.label, v.hex_color || '#D8D2C4',
          Number(v.price) || 0,
          v.compare_at_price ? Number(v.compare_at_price) : null,
          v.sku || `${body.sku || id}-${vSort}`,
          Number(v.inventory_qty) || 0,
          v.is_available ? 1 : 0,
          vSort++
        );
      }
    }

    if (Array.isArray(body.images)) {
      deleteImages.run(id);
      let iSort = 1;
      for (const img of body.images) {
        const imgUrl = typeof img === 'string' ? img : img.url;
        insertImage.run(
          `${id}-img-${Date.now()}-${iSort}`, id, imgUrl, `${body.title} view ${iSort}`,
          iSort === 1 ? 1 : 0, iSort === 2 ? 1 : 0, 1, iSort++
        );
      }
    }
  });

  transaction();
  return c.json({ success: true, id });
});

// DELETE a product
app.delete('/:id', c => {
  const id = c.req.param('id');
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  return c.json({ success: true, id });
});

export default app;
