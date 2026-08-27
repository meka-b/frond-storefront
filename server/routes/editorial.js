import { Hono } from 'hono';
import db from '../db/index.js';

const app = new Hono();

// GET Hero & Editorial content
app.get('/', c => {
  const hero = db.prepare("SELECT * FROM hero_content WHERE id = 'main'").get() || {};
  const editorial = db.prepare("SELECT * FROM editorial_sections WHERE id = 'story'").get() || {};
  let collage = [];
  try { collage = JSON.parse(hero.collage_products || '[]'); } catch { collage = []; }
  return c.json({ hero: { ...hero, collage_products: collage }, editorial });
});

// PUT update Hero
app.put('/hero', async c => {
  const body = await c.req.json();
  db.prepare(`
    UPDATE hero_content SET
      eyebrow = ?, title_line_1 = ?, title_accent = ?, title_line_2 = ?, title_line_3 = ?,
      subtitle = ?, cta_primary_label = ?, cta_primary_link = ?, cta_secondary_label = ?,
      cta_secondary_link = ?, metric_1_value = ?, metric_1_label = ?, metric_2_value = ?,
      metric_2_label = ?, metric_3_value = ?, metric_3_label = ?, collage_products = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = 'main'
  `).run(
    body.eyebrow, body.title_line_1, body.title_accent, body.title_line_2, body.title_line_3,
    body.subtitle, body.cta_primary_label, body.cta_primary_link, body.cta_secondary_label,
    body.cta_secondary_link, body.metric_1_value, body.metric_1_label, body.metric_2_value,
    body.metric_2_label, body.metric_3_value, body.metric_3_label,
    JSON.stringify(body.collage_products || ['monstera', 'planter', 'fig', 'pothos'])
  );
  return c.json({ success: true });
});

// PUT update Editorial
app.put('/editorial', async c => {
  const body = await c.req.json();
  db.prepare(`
    UPDATE editorial_sections SET
      tag_label = ?, image_url = ?, eyebrow = ?, title = ?, lead_text = ?,
      body_text = ?, stat_year = ?, stat_varieties = ?, stat_packaging = ?,
      spotlight_product_id = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = 'story'
  `).run(
    body.tag_label, body.image_url, body.eyebrow, body.title, body.lead_text,
    body.body_text, body.stat_year, body.stat_varieties, body.stat_packaging,
    body.spotlight_product_id || 'olive', body.is_active ? 1 : 0
  );
  return c.json({ success: true });
});

export default app;
