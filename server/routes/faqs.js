import { Hono } from 'hono';
import db from '../db/index.js';

const app = new Hono();

app.get('/', c => {
  const faqs = db.prepare('SELECT * FROM faqs ORDER BY sort_order ASC').all();
  return c.json(faqs);
});

app.post('/', async c => {
  const body = await c.req.json();
  const id = body.id || `faq-${Date.now()}`;
  db.prepare(`
    INSERT INTO faqs (id, category, question, answer, is_open_default, sort_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, body.category || 'General', body.question, body.answer, body.is_open_default ? 1 : 0, body.sort_order || 0, body.is_active ? 1 : 0);
  return c.json({ success: true, id }, 201);
});

app.put('/:id', async c => {
  const id = c.req.param('id');
  const body = await c.req.json();
  db.prepare(`
    UPDATE faqs SET
      category = ?, question = ?, answer = ?, is_open_default = ?, sort_order = ?, is_active = ?
    WHERE id = ?
  `).run(body.category || 'General', body.question, body.answer, body.is_open_default ? 1 : 0, body.sort_order || 0, body.is_active ? 1 : 0, id);
  return c.json({ success: true, id });
});

app.delete('/:id', c => {
  const id = c.req.param('id');
  db.prepare('DELETE FROM faqs WHERE id = ?').run(id);
  return c.json({ success: true, id });
});

export default app;
