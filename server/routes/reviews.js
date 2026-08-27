import { Hono } from 'hono';
import db from '../db/index.js';

const app = new Hono();

app.get('/', c => {
  const reviews = db.prepare(`
    SELECT r.*, p.title as product_title
    FROM reviews r
    JOIN products p ON r.product_id = p.id
    ORDER BY r.created_at DESC
  `).all();
  return c.json(reviews);
});

app.post('/', async c => {
  const body = await c.req.json();
  const id = `rev-${Date.now()}`;
  db.prepare(`
    INSERT INTO reviews (id, product_id, author_name, rating, title, comment, verified_purchase, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, body.product_id, body.author_name || 'Plant Lover', Number(body.rating) || 5.0,
    body.title || '', body.comment, body.verified_purchase ? 1 : 0, body.status || 'approved'
  );
  return c.json({ success: true, id }, 201);
});

app.put('/:id', async c => {
  const id = c.req.param('id');
  const body = await c.req.json();
  db.prepare('UPDATE reviews SET status = ? WHERE id = ?').run(body.status, id);
  return c.json({ success: true, id });
});

app.delete('/:id', c => {
  const id = c.req.param('id');
  db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
  return c.json({ success: true, id });
});

export default app;
