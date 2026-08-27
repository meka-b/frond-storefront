import { Hono } from 'hono';
import db from '../db/index.js';

const app = new Hono();

// GET all campaigns and coupons
app.get('/', c => {
  const campaigns = db.prepare('SELECT * FROM campaigns ORDER BY sort_order ASC').all();
  const coupons = db.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all();
  return c.json({ campaigns, coupons });
});

// POST / PUT campaigns
app.post('/', async c => {
  const body = await c.req.json();
  const id = body.id || `camp-${Date.now()}`;
  db.prepare(`
    INSERT INTO campaigns (id, kicker, title, description, card_style, coupon_code, cta_label, cta_url, countdown_hours, sort_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, body.kicker, body.title, body.description || '', body.card_style || 'ticket',
    body.coupon_code || '', body.cta_label || '', body.cta_url || '',
    Number(body.countdown_hours) || 26, body.sort_order || 0, body.is_active ? 1 : 0
  );
  return c.json({ success: true, id }, 201);
});

app.put('/:id', async c => {
  const id = c.req.param('id');
  const body = await c.req.json();
  db.prepare(`
    UPDATE campaigns SET
      kicker = ?, title = ?, description = ?, card_style = ?,
      coupon_code = ?, cta_label = ?, cta_url = ?, countdown_hours = ?,
      sort_order = ?, is_active = ?
    WHERE id = ?
  `).run(
    body.kicker, body.title, body.description || '', body.card_style || 'ticket',
    body.coupon_code || '', body.cta_label || '', body.cta_url || '',
    Number(body.countdown_hours) || 26, body.sort_order || 0, body.is_active ? 1 : 0, id
  );
  return c.json({ success: true, id });
});

app.delete('/:id', c => {
  const id = c.req.param('id');
  db.prepare('DELETE FROM campaigns WHERE id = ?').run(id);
  return c.json({ success: true, id });
});

// Coupons Endpoints
app.post('/coupons', async c => {
  const body = await c.req.json();
  const id = body.id || `coup-${Date.now()}`;
  db.prepare(`
    INSERT INTO coupons (id, code, title, discount_type, discount_value, min_order_cents, usage_limit, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, body.code.toUpperCase().trim(), body.title, body.discount_type || 'percent',
    Number(body.discount_value), Number(body.min_order_cents) || 0,
    body.usage_limit ? Number(body.usage_limit) : null, body.is_active ? 1 : 0
  );
  return c.json({ success: true, id }, 201);
});

app.delete('/coupons/:id', c => {
  const id = c.req.param('id');
  db.prepare('DELETE FROM coupons WHERE id = ?').run(id);
  return c.json({ success: true, id });
});

// Validate & Apply coupon at checkout
app.post('/coupons/apply', async c => {
  const body = await c.req.json();
  const code = body.code;
  const subtotal = Number(body.subtotal || body.orderTotalCents || 0);
  if (!code) return c.json({ error: 'Kupon kodu girilmedi' }, 400);

  const coupon = db.prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1').get(code.toUpperCase().trim());
  if (!coupon) {
    return c.json({ error: 'Geçersiz veya süresi dolmuş kupon kodu' }, 400);
  }

  if (coupon.min_order_cents && subtotal < coupon.min_order_cents) {
    return c.json({ error: `Bu kupon minimum $${(coupon.min_order_cents / 100).toFixed(2)} siparişlerde geçerlidir` }, 400);
  }

  let discountCents = 0;
  if (coupon.discount_type === 'percent') {
    discountCents = Math.round((subtotal * coupon.discount_value) / 100);
  } else {
    discountCents = coupon.discount_value;
  }

  return c.json({
    valid: true,
    code: coupon.code,
    title: coupon.title,
    discountCents: Math.min(discountCents, subtotal)
  });
});

export default app;
