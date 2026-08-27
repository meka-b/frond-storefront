import { Hono } from 'hono';
import db from '../db/index.js';

const app = new Hono();

// GET all site settings and navigation links
app.get('/', c => {
  const settings = db.prepare('SELECT * FROM site_settings').all();
  const navLinks = db.prepare('SELECT * FROM navigation_links ORDER BY sort_order ASC').all();
  return c.json({ settings, navLinks });
});

// PUT update multiple settings
app.put('/', async c => {
  const body = await c.req.json();
  const upsert = db.prepare('INSERT OR REPLACE INTO site_settings (key, value, type, description, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)');

  const transaction = db.transaction(() => {
    for (const [key, val] of Object.entries(body)) {
      const type = typeof val === 'number' ? 'number' : 'string';
      upsert.run(key, String(val), type, '');
    }
  });

  transaction();
  return c.json({ success: true });
});

// Navigation Endpoints
app.post('/navigation', async c => {
  const body = await c.req.json();
  const id = body.id || `nav-${Date.now()}`;
  db.prepare(`
    INSERT INTO navigation_links (id, menu_location, label, url, badge, sort_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, body.menu_location || 'header', body.label, body.url, body.badge || null, body.sort_order || 0, body.is_active ? 1 : 0);
  return c.json({ success: true, id }, 201);
});

app.put('/navigation/:id', async c => {
  const id = c.req.param('id');
  const body = await c.req.json();
  db.prepare(`
    UPDATE navigation_links SET
      menu_location = ?, label = ?, url = ?, badge = ?, sort_order = ?, is_active = ?
    WHERE id = ?
  `).run(body.menu_location || 'header', body.label, body.url, body.badge || null, body.sort_order || 0, body.is_active ? 1 : 0, id);
  return c.json({ success: true, id });
});

app.delete('/navigation/:id', c => {
  const id = c.req.param('id');
  db.prepare('DELETE FROM navigation_links WHERE id = ?').run(id);
  return c.json({ success: true, id });
});

export default app;
