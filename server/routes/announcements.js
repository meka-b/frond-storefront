import { Hono } from 'hono';
import db from '../db/index.js';

const app = new Hono();

app.get('/', c => {
  const items = db.prepare('SELECT * FROM announcements ORDER BY sort_order ASC').all();
  return c.json(items);
});

app.post('/', async c => {
  const body = await c.req.json();
  const id = body.id || `ann-${Date.now()}`;
  db.prepare(`
    INSERT INTO announcements (id, text, icon, link_url, speed_seconds, sort_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, body.text, body.icon || '✦', body.link_url || '', body.speed_seconds || '36s', body.sort_order || 0, body.is_active ? 1 : 0);
  return c.json({ success: true, id }, 201);
});

app.put('/:id', async c => {
  const id = c.req.param('id');
  const body = await c.req.json();
  db.prepare(`
    UPDATE announcements SET
      text = ?, icon = ?, link_url = ?, speed_seconds = ?, sort_order = ?, is_active = ?
    WHERE id = ?
  `).run(body.text, body.icon || '✦', body.link_url || '', body.speed_seconds || '36s', body.sort_order || 0, body.is_active ? 1 : 0, id);
  return c.json({ success: true, id });
});

app.delete('/:id', c => {
  const id = c.req.param('id');
  db.prepare('DELETE FROM announcements WHERE id = ?').run(id);
  return c.json({ success: true, id });
});

export default app;
