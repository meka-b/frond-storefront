import { Hono } from 'hono';
import db from '../db/index.js';

const app = new Hono();

app.get('/', c => {
  const articles = db.prepare('SELECT * FROM blog_articles ORDER BY published_at DESC').all();
  return c.json(articles);
});

app.get('/:id', c => {
  const id = c.req.param('id');
  const article = db.prepare('SELECT * FROM blog_articles WHERE id = ?').get(id);
  if (!article) return c.json({ error: 'Article not found' }, 404);
  return c.json(article);
});

app.post('/', async c => {
  const body = await c.req.json();
  const id = body.id || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  db.prepare(`
    INSERT INTO blog_articles (id, title, excerpt, content, tag, cover_image, read_time, author_name, author_role, is_featured, is_published)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, body.title, body.excerpt || '', body.content || '', body.tag || 'Guides',
    body.cover_image || 'assets/img/blog-1.jpg', body.read_time || '5 min read',
    body.author_name || 'FROND Team', body.author_role || 'Guides',
    body.is_featured ? 1 : 0, body.is_published ? 1 : 0
  );

  return c.json({ success: true, id }, 201);
});

app.put('/:id', async c => {
  const id = c.req.param('id');
  const body = await c.req.json();

  db.prepare(`
    UPDATE blog_articles SET
      title = ?, excerpt = ?, content = ?, tag = ?, cover_image = ?,
      read_time = ?, author_name = ?, author_role = ?, is_featured = ?,
      is_published = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    body.title, body.excerpt || '', body.content || '', body.tag || 'Guides',
    body.cover_image || 'assets/img/blog-1.jpg', body.read_time || '5 min read',
    body.author_name || 'FROND Team', body.author_role || 'Guides',
    body.is_featured ? 1 : 0, body.is_published ? 1 : 0, id
  );

  return c.json({ success: true, id });
});

app.delete('/:id', c => {
  const id = c.req.param('id');
  db.prepare('DELETE FROM blog_articles WHERE id = ?').run(id);
  return c.json({ success: true, id });
});

export default app;
