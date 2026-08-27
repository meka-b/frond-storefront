import { Hono } from 'hono';
import db from '../db/index.js';

const app = new Hono();

app.get('/', c => {
  const tabs = db.prepare('SELECT * FROM shade_tabs ORDER BY sort_order ASC').all();
  const rels = db.prepare('SELECT * FROM shade_tab_products ORDER BY sort_order ASC').all();

  const data = tabs.map(tab => ({
    ...tab,
    products: rels.filter(r => r.shade_tab_id === tab.id).map(r => r.product_id)
  }));

  return c.json(data);
});

app.post('/', async c => {
  const body = await c.req.json();
  const id = body.id || body.label.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  db.prepare(`
    INSERT INTO shade_tabs (id, label, image_url, sort_order, is_active)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, body.label, body.image_url || '', body.sort_order || 0, body.is_active ? 1 : 0);

  if (Array.isArray(body.products)) {
    const insertRel = db.prepare('INSERT OR IGNORE INTO shade_tab_products (shade_tab_id, product_id, sort_order) VALUES (?, ?, ?)');
    body.products.forEach((pid, i) => insertRel.run(id, pid, i + 1));
  }

  return c.json({ success: true, id }, 201);
});

app.put('/:id', async c => {
  const id = c.req.param('id');
  const body = await c.req.json();

  db.prepare(`
    UPDATE shade_tabs SET
      label = ?, image_url = ?, sort_order = ?, is_active = ?
    WHERE id = ?
  `).run(body.label, body.image_url || '', body.sort_order || 0, body.is_active ? 1 : 0, id);

  if (Array.isArray(body.products)) {
    db.prepare('DELETE FROM shade_tab_products WHERE shade_tab_id = ?').run(id);
    const insertRel = db.prepare('INSERT OR IGNORE INTO shade_tab_products (shade_tab_id, product_id, sort_order) VALUES (?, ?, ?)');
    body.products.forEach((pid, i) => insertRel.run(id, pid, i + 1));
  }

  return c.json({ success: true, id });
});

app.delete('/:id', c => {
  const id = c.req.param('id');
  db.prepare('DELETE FROM shade_tabs WHERE id = ?').run(id);
  return c.json({ success: true, id });
});

export default app;
