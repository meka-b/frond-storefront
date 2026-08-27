import React, { useState } from 'react';
import { json } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';
import db from '../../server/db/index.js';
import R2Uploader from '../components/R2Uploader.jsx';
import ProductSingleSelect from '../components/ProductSingleSelect.jsx';
import {
  Compass,
  Save,
  Check,
  Sparkles
} from 'lucide-react';

export const loader = async () => {
  const hero = db.prepare("SELECT * FROM hero_content WHERE id = 'main'").get() || {};
  const editorial = db.prepare("SELECT * FROM editorial_sections WHERE id = 'story'").get() || {};
  const allProducts = db.prepare(`
    SELECT p.id, p.title, p.sku,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
    FROM products p
    ORDER BY p.title ASC
  `).all();

  let collage = [];
  try { collage = JSON.parse(hero.collage_products || '[]'); } catch { collage = []; }

  return json({
    hero: { ...hero, collage_products: collage },
    editorial,
    allProducts
  });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'save_hero') {
    const eyebrow = (formData.get('eyebrow') || '').trim();
    const title_line_1 = (formData.get('title_line_1') || '').trim();
    const title_accent = (formData.get('title_accent') || '').trim();
    const title_line_2 = (formData.get('title_line_2') || '').trim();
    const title_line_3 = (formData.get('title_line_3') || '').trim();
    const subtitle = (formData.get('subtitle') || '').trim();
    const cta_primary_label = (formData.get('cta_primary_label') || '').trim();
    const cta_primary_link = (formData.get('cta_primary_link') || '').trim();
    const cta_secondary_label = (formData.get('cta_secondary_label') || '').trim();
    const cta_secondary_link = (formData.get('cta_secondary_link') || '').trim();
    const metric_1_value = (formData.get('metric_1_value') || '').trim();
    const metric_1_label = (formData.get('metric_1_label') || '').trim();
    const metric_2_value = (formData.get('metric_2_value') || '').trim();
    const metric_2_label = (formData.get('metric_2_label') || '').trim();
    const metric_3_value = (formData.get('metric_3_value') || '').trim();
    const metric_3_label = (formData.get('metric_3_label') || '').trim();
    const collage = formData.getAll('collage_prods');

    db.prepare(`
      UPDATE hero_content SET
        eyebrow = ?, title_line_1 = ?, title_accent = ?, title_line_2 = ?, title_line_3 = ?,
        subtitle = ?, cta_primary_label = ?, cta_primary_link = ?, cta_secondary_label = ?,
        cta_secondary_link = ?, metric_1_value = ?, metric_1_label = ?, metric_2_value = ?,
        metric_2_label = ?, metric_3_value = ?, metric_3_label = ?, collage_products = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 'main'
    `).run(
      eyebrow, title_line_1, title_accent, title_line_2, title_line_3,
      subtitle, cta_primary_label, cta_primary_link, cta_secondary_label,
      cta_secondary_link, metric_1_value, metric_1_label, metric_2_value,
      metric_2_label, metric_3_value, metric_3_label,
      JSON.stringify(collage.length ? collage : ['monstera', 'planter', 'fig', 'pothos'])
    );

    return json({ success: true, saved: 'hero' });
  }

  if (intent === 'save_editorial') {
    const tag_label = formData.get('tag_label');
    const image_url = formData.get('image_url') || 'assets/img/p-olive-1.jpg';
    const eyebrow = formData.get('eyebrow');
    const title = formData.get('title');
    const lead_text = formData.get('lead_text');
    const body_text = formData.get('body_text');
    const stat_year = formData.get('stat_year');
    const stat_varieties = formData.get('stat_varieties');
    const stat_packaging = formData.get('stat_packaging');
    const spotlight_product_id = formData.get('spotlight_product_id') || 'olive';

    db.prepare(`
      UPDATE editorial_sections SET
        tag_label = ?, image_url = ?, eyebrow = ?, title = ?, lead_text = ?,
        body_text = ?, stat_year = ?, stat_varieties = ?, stat_packaging = ?,
        spotlight_product_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 'story'
    `).run(
      tag_label, image_url, eyebrow, title, lead_text, body_text,
      stat_year, stat_varieties, stat_packaging, spotlight_product_id
    );

    return json({ success: true, saved: 'editorial' });
  }

  return json({ success: false });
};

export default function AdminHero() {
  const { hero, editorial, allProducts } = useLoaderData();
  const fetcher = useFetcher();
  const [editorialImg, setEditorialImg] = useState(editorial.image_url);
  const [spotlightPid, setSpotlightPid] = useState(editorial.spotlight_product_id || 'olive');

  return (
    <div className="space-y-10">
      {/* 1. Hero Section Form */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[#1D2A1C] font-serif">Ana Sayfa Hero Bölümü</h2>
          <p className="text-xs text-[#7A8377]">
            Kinetik başlık satırları, vurgulu kelimeler, CTA butonları ve metrik sayaçları.
          </p>
        </div>

        <fetcher.Form method="post" className="bg-white p-6 rounded-xl border border-[#E8E6DF] space-y-4 shadow-2xs">
          <input type="hidden" name="intent" value="save_hero" />

          <div>
            <label className="block text-xs font-semibold text-[#5C665A] mb-1">Üst Başlık (Eyebrow)</label>
            <input
              type="text"
              name="eyebrow"
              defaultValue={hero.eyebrow}
              className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#5C665A] mb-1">Başlık 1. Satır</label>
              <input
                type="text"
                name="title_line_1"
                defaultValue={hero.title_line_1}
                placeholder="Botanical"
                className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5C665A] mb-1">Vurgulu Kelime (Accent)</label>
              <input
                type="text"
                name="title_accent"
                defaultValue={hero.title_accent}
                placeholder="beauty"
                className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5] font-semibold text-[#D87A4F]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5C665A] mb-1">Başlık 2. Satır</label>
              <input
                type="text"
                name="title_line_2"
                defaultValue={hero.title_line_2}
                placeholder="from our greenhouse"
                className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5C665A] mb-1">Başlık 3. Satır</label>
              <input
                type="text"
                name="title_line_3"
                defaultValue={hero.title_line_3}
                placeholder="to your home."
                className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5C665A] mb-1">Hero Açıklama Metni</label>
            <textarea
              name="subtitle"
              rows={2}
              defaultValue={hero.subtitle}
              className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5]"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#5C665A]">Birincil CTA Butonu</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="cta_primary_label"
                  defaultValue={hero.cta_primary_label}
                  placeholder="Buton Adı"
                  className="w-full text-xs border border-[#E0DED7] rounded p-2 bg-[#FAF9F5]"
                />
                <input
                  type="text"
                  name="cta_primary_link"
                  defaultValue={hero.cta_primary_link}
                  placeholder="#shop"
                  className="w-full text-xs border border-[#E0DED7] rounded p-2 bg-[#FAF9F5]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#5C665A]">İkincil CTA Butonu</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="cta_secondary_label"
                  defaultValue={hero.cta_secondary_label}
                  placeholder="Buton Adı"
                  className="w-full text-xs border border-[#E0DED7] rounded p-2 bg-[#FAF9F5]"
                />
                <input
                  type="text"
                  name="cta_secondary_link"
                  defaultValue={hero.cta_secondary_link}
                  placeholder="#story"
                  className="w-full text-xs border border-[#E0DED7] rounded p-2 bg-[#FAF9F5]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-[#5C665A] mb-1">1. Metrik (Değer / Başlık)</label>
              <div className="grid grid-cols-2 gap-1.5">
                <input type="text" name="metric_1_value" defaultValue={hero.metric_1_value} className="text-xs border rounded p-1.5 font-bold" />
                <input type="text" name="metric_1_label" defaultValue={hero.metric_1_label} className="text-xs border rounded p-1.5" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5C665A] mb-1">2. Metrik (Değer / Başlık)</label>
              <div className="grid grid-cols-2 gap-1.5">
                <input type="text" name="metric_2_value" defaultValue={hero.metric_2_value} className="text-xs border rounded p-1.5 font-bold" />
                <input type="text" name="metric_2_label" defaultValue={hero.metric_2_label} className="text-xs border rounded p-1.5" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5C665A] mb-1">3. Metrik (Değer / Başlık)</label>
              <div className="grid grid-cols-2 gap-1.5">
                <input type="text" name="metric_3_value" defaultValue={hero.metric_3_value} className="text-xs border rounded p-1.5 font-bold" />
                <input type="text" name="metric_3_label" defaultValue={hero.metric_3_label} className="text-xs border rounded p-1.5" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#1D2A1C] text-[#FDFBF7] text-xs font-medium">
              Hero Ayarlarını Güncelle
            </button>
          </div>
        </fetcher.Form>
      </div>

      {/* 2. Editorial Spotlight Section */}
      <div className="pt-6 border-t border-[#E8E6DF]">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[#1D2A1C] font-serif">Editöryal Vitrin &amp; "Our Roots" Hikayesi</h2>
          <p className="text-xs text-[#7A8377]">
            Ana sayfadaki paralaks fotoğraflı marka hikayesi ve mevsime özel vitrin bitkisi modülü.
          </p>
        </div>

        <fetcher.Form method="post" className="bg-white p-6 rounded-xl border border-[#E8E6DF] space-y-4 shadow-2xs">
          <input type="hidden" name="intent" value="save_editorial" />
          <input type="hidden" name="image_url" value={editorialImg} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#5C665A] mb-1">Rozet Etiketi</label>
              <input
                type="text"
                name="tag_label"
                defaultValue={editorial.tag_label}
                placeholder="Plant of the season"
                className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5C665A] mb-1">Üst Başlık (Eyebrow)</label>
              <input
                type="text"
                name="eyebrow"
                defaultValue={editorial.eyebrow}
                placeholder="Our roots"
                className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
              />
            </div>
            <div>
              <ProductSingleSelect
                name="spotlight_product_id"
                label="Vitrin Bitkisi (Spotlight Product)"
                products={allProducts}
                value={spotlightPid}
                onChange={setSpotlightPid}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5C665A] mb-1">Ana Başlık</label>
            <input
              type="text"
              name="title"
              defaultValue={editorial.title}
              className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5C665A] mb-1">Vurgulu Giriş Paragrafı (Lead)</label>
            <textarea
              name="lead_text"
              rows={2}
              defaultValue={editorial.lead_text}
              className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5]"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5C665A] mb-1">Hikaye Metni (Body)</label>
            <textarea
              name="body_text"
              rows={3}
              defaultValue={editorial.body_text}
              className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5]"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5C665A] mb-1">Paralaks Görseli (Cloudflare R2)</label>
            <R2Uploader label="" value={editorialImg} onUploadComplete={setEditorialImg} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#5C665A] mb-1">Kuruluş Yılı</label>
              <input type="text" name="stat_year" defaultValue={editorial.stat_year} className="w-full text-xs border rounded p-2" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5C665A] mb-1">Yetiştirilen Çeşit</label>
              <input type="text" name="stat_varieties" defaultValue={editorial.stat_varieties} className="w-full text-xs border rounded p-2" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5C665A] mb-1">Ambalaj Plastik Oranı</label>
              <input type="text" name="stat_packaging" defaultValue={editorial.stat_packaging} className="w-full text-xs border rounded p-2" />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#1D2A1C] text-[#FDFBF7] text-xs font-medium">
              Vitrin Hikayesini Güncelle
            </button>
          </div>
        </fetcher.Form>
      </div>
    </div>
  );
}
