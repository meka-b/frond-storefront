import { Hono } from 'hono';
import db from '../db/index.js';

const app = new Hono();

app.get('/', c => {
  const subscribers = db.prepare('SELECT * FROM newsletter_subscribers ORDER BY created_at DESC').all();
  return c.json(subscribers);
});

app.post('/', async c => {
  const body = await c.req.json();
  const email = (body.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return c.json({ error: 'Geçerli bir e-posta adresi girin' }, 400);
  }

  const id = `sub-${Date.now()}`;
  db.prepare(`
    INSERT OR IGNORE INTO newsletter_subscribers (id, email, status)
    VALUES (?, ?, 'active')
  `).run(id, email);

  return c.json({ success: true, email }, 201);
});

app.delete('/:id', c => {
  const id = c.req.param('id');
  db.prepare('DELETE FROM newsletter_subscribers WHERE id = ?').run(id);
  return c.json({ success: true, id });
});

export default app;
