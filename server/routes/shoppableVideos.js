import { Hono } from 'hono';
import db from '../db/index.js';

const app = new Hono();

app.get('/', c => {
  const videos = db.prepare(`
    SELECT sv.*, p.title as product_title
    FROM shoppable_videos sv
    LEFT JOIN products p ON sv.product_id = p.id
    ORDER BY sv.sort_order ASC, sv.created_at DESC
  `).all();
  return c.json(videos);
});

app.post('/', async c => {
  const body = await c.req.json();
  const id = body.id || `seen-${Date.now()}`;

  db.prepare(`
    INSERT INTO shoppable_videos (id, product_id, title, video_url, poster_url, thumb_url, price_label, original_price_label, sort_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, body.product_id, body.title, body.video_url, body.poster_url || '',
    body.thumb_url || '', body.price_label || '', body.original_price_label || null,
    body.sort_order || 0, body.is_active ? 1 : 0
  );

  return c.json({ success: true, id }, 201);
});

app.put('/:id', async c => {
  const id = c.req.param('id');
  const body = await c.req.json();

  db.prepare(`
    UPDATE shoppable_videos SET
      product_id = ?, title = ?, video_url = ?, poster_url = ?,
      thumb_url = ?, price_label = ?, original_price_label = ?, sort_order = ?, is_active = ?
    WHERE id = ?
  `).run(
    body.product_id, body.title, body.video_url, body.poster_url || '',
    body.thumb_url || '', body.price_label || '', body.original_price_label || null,
    body.sort_order || 0, body.is_active ? 1 : 0, id
  );

  return c.json({ success: true, id });
});

app.delete('/:id', c => {
  const id = c.req.param('id');
  db.prepare('DELETE FROM shoppable_videos WHERE id = ?').run(id);
  return c.json({ success: true, id });
});

export default app;
