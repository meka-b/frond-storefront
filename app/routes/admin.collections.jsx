import React, { useState } from 'react';
import { json } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';
import db from '../../server/db/index.js';
import R2Uploader from '../components/R2Uploader.jsx';
import ProductMultiPicker from '../components/ProductMultiPicker.jsx';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Check,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export const loader = async () => {
  const collections = db.prepare('SELECT * FROM collections ORDER BY sort_order ASC').all();
  const rels = db.prepare('SELECT * FROM collection_products ORDER BY sort_order ASC').all();
  const moodTiles = db.prepare('SELECT * FROM mood_tiles ORDER BY sort_order ASC').all();
  const allProducts = db.prepare(`
    SELECT p.id, p.title, p.sku,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
    FROM products p
    ORDER BY p.title ASC
  `).all();

  const data = collections.map(col => ({
    ...col,
    products: rels.filter(r => r.collection_id === col.id).map(r => r.product_id)
  }));

  return json({ collections: data, moodTiles, allProducts });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'save_collection') {
    const id = formData.get('id') || formData.get('title').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const title = formData.get('title');
    const description = formData.get('description') || '';
    const image_url = formData.get('image_url') || '';
    const item_count_label = formData.get('item_count_label') || '0';
    const is_featured = formData.get('is_featured') === 'on' ? 1 : 0;
    const prodsJson = formData.get('products_data') || '[]';
    const products = JSON.parse(prodsJson);

    const upsert = db.prepare(`
      INSERT OR REPLACE INTO collections (id, title, description, image_url, item_count_label, is_featured, is_published, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, 1, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM collections WHERE id != ?))
    `);
    upsert.run(id, title, description, image_url, item_count_label, is_featured, id);

    db.prepare('DELETE FROM collection_products WHERE collection_id = ?').run(id);
    const insertRel = db.prepare('INSERT OR IGNORE INTO collection_products (collection_id, product_id, sort_order) VALUES (?, ?, ?)');
    products.forEach((pid, i) => insertRel.run(id, pid, i + 1));

    return json({ success: true });
  }

  if (intent === 'delete_collection') {
    const id = formData.get('id');
    db.prepare('DELETE FROM collections WHERE id = ?').run(id);
    return json({ success: true });
  }

  if (intent === 'save_mood_tile') {
    const id = formData.get('id') || `mood-${Date.now()}`;
    const title = formData.get('title');
    const image_url = formData.get('image_url') || '';
    const link_url = formData.get('link_url') || '#collections';
    db.prepare(`
      INSERT OR REPLACE INTO mood_tiles (id, title, image_url, link_url, sort_order, is_active)
      VALUES (?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM mood_tiles WHERE id != ?), 1)
    `).run(id, title, image_url, link_url, id);
    return json({ success: true });
  }

  if (intent === 'delete_mood_tile') {
    const id = formData.get('id');
    db.prepare('DELETE FROM mood_tiles WHERE id = ?').run(id);
    return json({ success: true });
  }

  return json({ success: false });
};

export default function AdminCollections() {
  const { collections, moodTiles, allProducts } = useLoaderData();
  const fetcher = useFetcher();

  const [editingCol, setEditingCol] = useState(null);
  const [editingMood, setEditingMood] = useState(null);

  // Form states
  const [colTitle, setColTitle] = useState('');
  const [colId, setColId] = useState('');
  const [colDesc, setColDesc] = useState('');
  const [colImg, setColImg] = useState('');
  const [colCount, setColCount] = useState('10');
  const [colFeat, setColFeat] = useState(false);
  const [colProds, setColProds] = useState([]);

  // Mood form states
  const [moodTitle, setMoodTitle] = useState('');
  const [moodId, setMoodId] = useState('');
  const [moodImg, setMoodImg] = useState('');
  const [moodLink, setMoodLink] = useState('#collections');

  const startEditCol = (col) => {
    if (col) {
      setEditingCol(col.id);
      setColId(col.id);
      setColTitle(col.title);
      setColDesc(col.description || '');
      setColImg(col.image_url || '');
      setColCount(col.item_count_label || '0');
      setColFeat(Boolean(col.is_featured));
      setColProds(col.products || []);
    } else {
      setEditingCol('new');
      setColId('');
      setColTitle('');
      setColDesc('');
      setColImg('');
      setColCount('10');
      setColFeat(false);
      setColProds([]);
    }
  };

  const startEditMood = (m) => {
    if (m) {
      setEditingMood(m.id);
      setMoodId(m.id);
      setMoodTitle(m.title);
      setMoodImg(m.image_url);
      setMoodLink(m.link_url);
    } else {
      setEditingMood('new');
      setMoodId('');
      setMoodTitle('');
      setMoodImg('');
      setMoodLink('#collections');
    }
  };

  return (
    <div className="space-y-10">
      {/* 1. Collections Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-[#1D2A1C] font-serif">Koleksiyonlar &amp; Kategoriler</h2>
            <p className="text-xs text-[#7A8377]">
              Storefront ana sayfasında ve vitrinde listelenen koleksiyonlar ve ürün eşleşmeleri.
            </p>
          </div>
          <button
            type="button"
            onClick={() => startEditCol(null)}
            className="inline-flex items-center gap-1.5 text-xs bg-[#1D2A1C] hover:bg-[#2D3E2C] text-[#FDFBF7] px-3.5 py-2 rounded-lg font-medium shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Koleksiyon Ekle</span>
          </button>
        </div>

        {/* Collection Edit Drawer / Modal */}
        {editingCol && (
          <div className="bg-white p-5 rounded-xl border-2 border-[#1D2A1C] shadow-md mb-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E6DF] pb-3">
              <h3 className="text-sm font-bold text-[#1D2A1C]">
                {editingCol === 'new' ? 'Yeni Koleksiyon Oluştur' : `Koleksiyon Düzenle: ${colTitle}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingCol(null)}
                className="text-xs text-[#888] hover:text-[#1D2A1C]"
              >
                Kapat ✕
              </button>
            </div>

            <fetcher.Form method="post" onSubmit={() => setEditingCol(null)} className="space-y-4">
              <input type="hidden" name="intent" value="save_collection" />
              <input type="hidden" name="id" value={colId} />
              <input type="hidden" name="image_url" value={colImg} />
              <input type="hidden" name="products_data" value={JSON.stringify(colProds)} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5C665A] mb-1">Koleksiyon Başlığı *</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={colTitle}
                    onChange={(e) => setColTitle(e.target.value)}
                    placeholder="Örn: Foliage Plants"
                    className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5C665A] mb-1">Ürün Sayısı Etiketi</label>
                  <input
                    type="text"
                    name="item_count_label"
                    value={colCount}
                    onChange={(e) => setColCount(e.target.value)}
                    placeholder="Örn: 31 veya 12"
                    className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C665A] mb-1">Açıklama</label>
                <input
                  type="text"
                  name="description"
                  value={colDesc}
                  onChange={(e) => setColDesc(e.target.value)}
                  placeholder="Lush leaves and architectural shapes."
                  className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C665A] mb-1">Kapak Görseli (Cloudflare R2)</label>
                <R2Uploader label="" value={colImg} onUploadComplete={setColImg} />
              </div>

              <div>
                <ProductMultiPicker
                  label="Atanan Ürünler"
                  description="Bu koleksiyonda sergilenecek bitkileri seçin."
                  products={allProducts}
                  selectedIds={colProds}
                  onChange={setColProds}
                  maxHeight="max-h-60"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#E8E6DF]">
                <label className="flex items-center gap-2 text-xs font-medium text-[#1D2A1C] cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={colFeat}
                    onChange={(e) => setColFeat(e.target.checked)}
                    className="rounded text-[#1D2A1C]"
                  />
                  <span>Ana Sayfa Vitrininde Öne Çıkar</span>
                </label>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#1D2A1C] hover:bg-[#2D3E2C] text-[#FDFBF7] text-xs font-medium"
                >
                  Kaydet
                </button>
              </div>
            </fetcher.Form>
          </div>
        )}

        {/* Collections Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {collections.map((col) => (
            <div key={col.id} className="bg-white rounded-xl border border-[#E8E6DF] overflow-hidden shadow-2xs flex flex-col">
              <div className="h-36 bg-[#F4F3EE] relative overflow-hidden">
                <img src={col.image_url || 'assets/img/ch-big-1.jpg'} alt={col.title} className="w-full h-full object-cover" />
                <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs font-mono text-[10px] px-2 py-0.5 rounded-full text-[#1D2A1C] font-bold">
                  {col.item_count_label} Bitki
                </span>
                {col.is_featured === 1 && (
                  <span className="absolute top-2 left-2 bg-[#D87A4F] text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
                    Öne Çıkan
                  </span>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-[#1D2A1C]">{col.title}</h3>
                  <p className="text-xs text-[#7A8377] mt-0.5 line-clamp-2">{col.description}</p>
                  <p className="text-[11px] font-mono text-[#3F5E3D] mt-2">
                    {col.products.length} ürün eşleşti
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 mt-4 pt-2 border-t border-[#F0EFEB]">
                  <button
                    type="button"
                    onClick={() => startEditCol(col)}
                    className="p-1.5 text-[#5C665A] hover:text-[#1D2A1C] hover:bg-[#F4F3EE] rounded transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <fetcher.Form method="post">
                    <input type="hidden" name="intent" value="delete_collection" />
                    <input type="hidden" name="id" value={col.id} />
                    <button
                      type="submit"
                      onClick={(e) => { if (!confirm(`"${col.title}" koleksiyonunu silmek istiyor musunuz?`)) e.preventDefault(); }}
                      className="p-1.5 text-[#5C665A] hover:text-red-600 hover:bg-red-50 rounded transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </fetcher.Form>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Mood Tiles ("Shop by Mood") */}
      <div className="pt-6 border-t border-[#E8E6DF]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#1D2A1C] font-serif">"Shop by Mood" Vitrin Kutuları</h2>
            <p className="text-xs text-[#7A8377]">
              Ana sayfada 3 sütunlu modüler "Statement plants", "Easy care", "Pots & objects" kutuları.
            </p>
          </div>
          <button
            type="button"
            onClick={() => startEditMood(null)}
            className="inline-flex items-center gap-1.5 text-xs bg-[#F4F3EE] hover:bg-[#EAE8E0] text-[#1D2A1C] px-3 py-1.5 rounded-lg border border-[#DDDCD5] font-medium transition"
          >
            <Plus className="w-4 h-4" />
            <span>Mood Kutusu Ekle</span>
          </button>
        </div>

        {/* Mood Edit Form */}
        {editingMood && (
          <div className="bg-white p-5 rounded-xl border-2 border-[#1D2A1C] shadow-md mb-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E6DF] pb-2">
              <h3 className="text-xs font-bold text-[#1D2A1C]">Mood Kutusu Düzenle</h3>
              <button onClick={() => setEditingMood(null)} className="text-xs text-[#888]">✕</button>
            </div>
            <fetcher.Form method="post" onSubmit={() => setEditingMood(null)} className="space-y-3">
              <input type="hidden" name="intent" value="save_mood_tile" />
              <input type="hidden" name="id" value={moodId} />
              <input type="hidden" name="image_url" value={moodImg} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5C665A] mb-1">Kutu Başlığı</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={moodTitle}
                    onChange={(e) => setMoodTitle(e.target.value)}
                    placeholder="Statement plants"
                    className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5C665A] mb-1">Bağlantı Linki</label>
                  <input
                    type="text"
                    name="link_url"
                    value={moodLink}
                    onChange={(e) => setMoodLink(e.target.value)}
                    placeholder="#collections veya /product.html"
                    className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
                  />
                </div>
              </div>

              <div>
                <R2Uploader label="Görsel (Cloudflare R2)" value={moodImg} onUploadComplete={setMoodImg} />
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-[#1D2A1C] text-[#FDFBF7] text-xs font-medium">
                  Kaydet
                </button>
              </div>
            </fetcher.Form>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {moodTiles.map((tile) => (
            <div key={tile.id} className="bg-white rounded-xl border border-[#E8E6DF] overflow-hidden shadow-2xs">
              <div className="h-32 bg-[#F4F3EE] relative overflow-hidden">
                <img src={tile.image_url} alt={tile.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-3 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-semibold text-[#1D2A1C]">{tile.title}</h4>
                  <p className="text-[11px] font-mono text-[#888]">{tile.link_url}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEditMood(tile)} className="p-1 text-[#666] hover:text-[#1D2A1C]">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <fetcher.Form method="post">
                    <input type="hidden" name="intent" value="delete_mood_tile" />
                    <input type="hidden" name="id" value={tile.id} />
                    <button type="submit" className="p-1 text-[#666] hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </fetcher.Form>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
