import { Hono } from 'hono';
import db from '../db/index.js';

const app = new Hono();

// GET all collections with linked product IDs
app.get('/', c => {
  const collections = db.prepare('SELECT * FROM collections ORDER BY sort_order ASC').all();
  const rels = db.prepare('SELECT * FROM collection_products ORDER BY sort_order ASC').all();
  const moodTiles = db.prepare('SELECT * FROM mood_tiles ORDER BY sort_order ASC').all();

  const data = collections.map(col => ({
    ...col,
    products: rels.filter(r => r.collection_id === col.id).map(r => r.product_id)
  }));

  return c.json({ collections: data, moodTiles });
});

// POST create collection
app.post('/', async c => {
  const body = await c.req.json();
  const id = body.id || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const insert = db.prepare(`
    INSERT INTO collections (id, title, description, image_url, item_count_label, is_featured, sort_order, is_published)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    id, body.title, body.description || '', body.image_url || '',
    body.item_count_label || '0', body.is_featured ? 1 : 0,
    body.sort_order || 0, body.is_published ? 1 : 0
  );

  if (Array.isArray(body.products)) {
    const insertRel = db.prepare('INSERT OR IGNORE INTO collection_products (collection_id, product_id, sort_order) VALUES (?, ?, ?)');
    body.products.forEach((pid, i) => insertRel.run(id, pid, i + 1));
  }

  return c.json({ success: true, id }, 201);
});

// PUT update collection
app.put('/:id', async c => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const update = db.prepare(`
    UPDATE collections SET
      title = ?, description = ?, image_url = ?, item_count_label = ?,
      is_featured = ?, sort_order = ?, is_published = ?
    WHERE id = ?
  `);

  update.run(
    body.title, body.description || '', body.image_url || '',
    body.item_count_label || '0', body.is_featured ? 1 : 0,
    body.sort_order || 0, body.is_published ? 1 : 0, id
  );

  if (Array.isArray(body.products)) {
    db.prepare('DELETE FROM collection_products WHERE collection_id = ?').run(id);
    const insertRel = db.prepare('INSERT OR IGNORE INTO collection_products (collection_id, product_id, sort_order) VALUES (?, ?, ?)');
    body.products.forEach((pid, i) => insertRel.run(id, pid, i + 1));
  }

  return c.json({ success: true, id });
});

// DELETE collection
app.delete('/:id', c => {
  const id = c.req.param('id');
  db.prepare('DELETE FROM collections WHERE id = ?').run(id);
  return c.json({ success: true, id });
});

// POST / PUT mood tiles
app.post('/mood-tiles', async c => {
  const body = await c.req.json();
  const id = body.id || `mood-${Date.now()}`;
  db.prepare(`
    INSERT OR REPLACE INTO mood_tiles (id, title, image_url, link_url, sort_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, body.title, body.image_url, body.link_url || '#collections', body.sort_order || 0, body.is_active ? 1 : 0);
  return c.json({ success: true, id });
});

app.delete('/mood-tiles/:id', c => {
  const id = c.req.param('id');
  db.prepare('DELETE FROM mood_tiles WHERE id = ?').run(id);
  return c.json({ success: true, id });
});

export default app;
