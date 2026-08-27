import { Hono } from 'hono';
import db from '../db/index.js';

const app = new Hono();

// GET all orders
app.get('/', c => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  const items = db.prepare('SELECT * FROM order_items').all();

  const data = orders.map(ord => ({
    ...ord,
    items: items.filter(it => it.order_id === ord.id)
  }));

  return c.json(data);
});

// GET single order by id
app.get('/:id', c => {
  const id = c.req.param('id');
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return c.json({ error: 'Order not found' }, 404);

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
  return c.json({ ...order, items });
});

// POST create new order (from storefront checkout)
app.post('/', async c => {
  const body = await c.req.json();
  const orderId = `ord-${Date.now()}`;
  const orderNum = `FR-${Math.floor(100000 + Math.random() * 900000)}`;

  const insertOrder = db.prepare(`
    INSERT INTO orders (
      id, order_number, customer_name, customer_email, customer_phone,
      shipping_address, city, postal_code, country, subtotal_cents,
      discount_cents, shipping_cents, total_cents, coupon_code,
      status, payment_status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertItem = db.prepare(`
    INSERT INTO order_items (
      id, order_id, product_id, variant_id, product_title,
      variant_label, unit_price_cents, quantity, total_price_cents
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const updateInventory = db.prepare(`
    UPDATE product_variants SET
      inventory_qty = MAX(0, inventory_qty - ?)
    WHERE id = ?
  `);

  const transaction = db.transaction(() => {
    insertOrder.run(
      orderId,
      orderNum,
      body.customer_name || 'Guest Plant Lover',
      body.customer_email || 'guest@example.com',
      body.customer_phone || '',
      body.shipping_address || '123 Botanical Ave',
      body.city || 'Amsterdam',
      body.postal_code || '1012 AB',
      body.country || 'NL',
      Number(body.subtotal_cents) || 0,
      Number(body.discount_cents) || 0,
      Number(body.shipping_cents) || 0,
      Number(body.total_cents) || 0,
      body.coupon_code || null,
      'pending',
      'paid',
      body.notes || ''
    );

    if (Array.isArray(body.items)) {
      let itemIdx = 1;
      for (const it of body.items) {
        const itemId = `${orderId}-it-${itemIdx++}`;
        insertItem.run(
          itemId,
          orderId,
          it.product_id || '',
          it.variant_id || '',
          it.product_title || 'Plant',
          it.variant_label || 'Default',
          Number(it.unit_price_cents) || 0,
          Number(it.quantity) || 1,
          (Number(it.unit_price_cents) || 0) * (Number(it.quantity) || 1)
        );

        if (it.variant_id) {
          updateInventory.run(Number(it.quantity) || 1, it.variant_id);
        }
      }
    }
  });

  transaction();
  return c.json({ success: true, orderId, orderNumber: orderNum }, 201);
});

// PUT update order status
app.put('/:id', async c => {
  const id = c.req.param('id');
  const body = await c.req.json();

  db.prepare(`
    UPDATE orders SET
      status = COALESCE(?, status),
      payment_status = COALESCE(?, payment_status),
      notes = COALESCE(?, notes),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(body.status, body.payment_status, body.notes, id);

  return c.json({ success: true, id });
});

export default app;
