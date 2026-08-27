import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import crypto from 'crypto';
import db from '../db/index.js';

const app = new Hono();
const salt = 'frond_salt_2026';

function hashPassword(pwd) {
  return crypto.createHash('sha256').update(pwd + salt).digest('hex');
}

// POST /api/auth/sign-in/email
app.post('/sign-in/email', async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ error: 'Email ve şifre gereklidir' }, 400);
  }

  const user = db.prepare('SELECT * FROM admin_users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user || user.password_hash !== hashPassword(password)) {
    return c.json({ error: 'Geçersiz e-posta veya şifre' }, 401);
  }

  const token = 'frond_tok_' + crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare('INSERT INTO admin_sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)').run(
    'sess-' + Date.now(),
    user.id,
    token,
    expiresAt
  );

  setCookie(c, 'frond_admin_token', token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: 7 * 24 * 60 * 60
  });

  return c.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role }
  });
});

// GET /api/auth/get-session
app.get('/get-session', (c) => {
  const token = getCookie(c, 'frond_admin_token') || c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return c.json({ session: null, user: null });
  }

  const sess = db.prepare('SELECT * FROM admin_sessions WHERE token = ?').get(token);
  if (!sess || new Date(sess.expires_at) < new Date()) {
    return c.json({ session: null, user: null });
  }

  const user = db.prepare('SELECT id, email, name, role FROM admin_users WHERE id = ?').get(sess.user_id);
  if (!user) {
    return c.json({ session: null, user: null });
  }

  return c.json({
    session: { id: sess.id, expiresAt: sess.expires_at },
    user
  });
});

// POST /api/auth/sign-out
app.post('/sign-out', (c) => {
  const token = getCookie(c, 'frond_admin_token');
  if (token) {
    db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
  }
  deleteCookie(c, 'frond_admin_token', { path: '/' });
  return c.json({ success: true });
});

// POST /api/auth/change-password
app.post('/change-password', async (c) => {
  const token = getCookie(c, 'frond_admin_token') || c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ error: 'Yetkisiz erişim' }, 401);

  const sess = db.prepare('SELECT * FROM admin_sessions WHERE token = ?').get(token);
  if (!sess || new Date(sess.expires_at) < new Date()) return c.json({ error: 'Oturum süresi dolmuş' }, 401);

  const body = await c.req.json();
  const { currentPassword, newPassword } = body;

  const user = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(sess.user_id);
  if (!user || user.password_hash !== hashPassword(currentPassword)) {
    return c.json({ error: 'Mevcut şifre hatalı' }, 400);
  }

  db.prepare('UPDATE admin_users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
    hashPassword(newPassword),
    user.id
  );

  return c.json({ success: true, message: 'Şifreniz başarıyla güncellendi' });
});

export default app;
