import { Hono } from 'hono';
import db from '../db/index.js';

const app = new Hono();

app.get('/', c => {
  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  const totalPublished = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_published = 1').get().count;
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(total_cents), 0) as total FROM orders WHERE payment_status = 'paid'").get().total;
  const totalSubscribers = db.prepare('SELECT COUNT(*) as count FROM newsletter_subscribers').get().count;
  const totalMedia = db.prepare('SELECT COUNT(*) as count FROM media_files').get().count;

  const lowStock = db.prepare(`
    SELECT pv.*, p.title as product_title
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    WHERE pv.inventory_qty <= 15
    ORDER BY pv.inventory_qty ASC
    LIMIT 6
  `).all();

  const recentOrders = db.prepare(`
    SELECT * FROM orders ORDER BY created_at DESC LIMIT 5
  `).all();

  const topProducts = db.prepare(`
    SELECT p.*, (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
    FROM products p
    WHERE p.is_bestseller = 1 OR p.is_published = 1
    ORDER BY p.rating DESC, p.reviews_count DESC
    LIMIT 5
  `).all();

  return c.json({
    kpis: {
      totalRevenue,
      totalOrders,
      totalProducts,
      totalPublished,
      totalSubscribers,
      totalMedia
    },
    lowStock,
    recentOrders,
    topProducts
  });
});

export default app;
