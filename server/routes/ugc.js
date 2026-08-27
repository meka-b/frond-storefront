import { Hono } from 'hono';
import db from '../db/index.js';

const app = new Hono();

app.get('/', c => {
  const posts = db.prepare(`
    SELECT u.*, p.title as product_title
    FROM ugc_posts u
    LEFT JOIN products p ON u.product_id = p.id
    ORDER BY u.sort_order ASC, u.created_at DESC
  `).all();
  return c.json(posts);
});

app.post('/', async c => {
  const body = await c.req.json();
  const id = body.id || `ugc-${Date.now()}`;

  db.prepare(`
    INSERT INTO ugc_posts (id, product_id, title, video_url, poster_url, thumb_url, price_display, sort_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, body.product_id, body.title, body.video_url, body.poster_url || '',
    body.thumb_url || '', body.price_display || '', body.sort_order || 0, body.is_active ? 1 : 0
  );

  return c.json({ success: true, id }, 201);
});

app.put('/:id', async c => {
  const id = c.req.param('id');
  const body = await c.req.json();

  db.prepare(`
    UPDATE ugc_posts SET
      product_id = ?, title = ?, video_url = ?, poster_url = ?,
      thumb_url = ?, price_display = ?, sort_order = ?, is_active = ?
    WHERE id = ?
  `).run(
    body.product_id, body.title, body.video_url, body.poster_url || '',
    body.thumb_url || '', body.price_display || '', body.sort_order || 0, body.is_active ? 1 : 0, id
  );

  return c.json({ success: true, id });
});

app.delete('/:id', c => {
  const id = c.req.param('id');
  db.prepare('DELETE FROM ugc_posts WHERE id = ?').run(id);
  return c.json({ success: true, id });
});

export default app;
