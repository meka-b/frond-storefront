import React, { useState } from 'react';
import { json } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';
import db from '../../server/db/index.js';
import R2Uploader from '../components/R2Uploader.jsx';
import ProductMultiPicker from '../components/ProductMultiPicker.jsx';
import {
  Sun,
  Plus,
  Trash2,
  Edit2,
  Check,
  Sparkles
} from 'lucide-react';

export const loader = async () => {
  const tabs = db.prepare('SELECT * FROM shade_tabs ORDER BY sort_order ASC').all();
  const rels = db.prepare('SELECT * FROM shade_tab_products ORDER BY sort_order ASC').all();
  const allProducts = db.prepare(`
    SELECT p.id, p.title, p.sku,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
    FROM products p
    ORDER BY p.title ASC
  `).all();

  const data = tabs.map(t => ({
    ...t,
    products: rels.filter(r => r.shade_tab_id === t.id).map(r => r.product_id)
  }));

  return json({ tabs: data, allProducts });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'save_tab') {
    const id = formData.get('id') || formData.get('label').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const label = formData.get('label');
    const image_url = formData.get('image_url') || '';
    const prodsJson = formData.get('products_data') || '[]';
    const products = JSON.parse(prodsJson);

    db.prepare(`
      INSERT OR REPLACE INTO shade_tabs (id, label, image_url, sort_order, is_active)
      VALUES (?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM shade_tabs WHERE id != ?), 1)
    `).run(id, label, image_url, id);

    db.prepare('DELETE FROM shade_tab_products WHERE shade_tab_id = ?').run(id);
    const insertRel = db.prepare('INSERT OR IGNORE INTO shade_tab_products (shade_tab_id, product_id, sort_order) VALUES (?, ?, ?)');
    products.forEach((pid, i) => insertRel.run(id, pid, i + 1));

    return json({ success: true });
  }

  if (intent === 'delete_tab') {
    const id = formData.get('id');
    db.prepare('DELETE FROM shade_tabs WHERE id = ?').run(id);
    return json({ success: true });
  }

  return json({ success: false });
};

export default function AdminShadeFinder() {
  const { tabs, allProducts } = useLoaderData();
  const fetcher = useFetcher();

  const [editingTab, setEditingTab] = useState(null);
  const [tabId, setTabId] = useState('');
  const [tabLabel, setTabLabel] = useState('');
  const [tabImg, setTabImg] = useState('');
  const [tabProds, setTabProds] = useState([]);

  const startEdit = (t) => {
    if (t) {
      setEditingTab(t.id);
      setTabId(t.id);
      setTabLabel(t.label);
      setTabImg(t.image_url);
      setTabProds(t.products || []);
    } else {
      setEditingTab('new');
      setTabId('');
      setTabLabel('');
      setTabImg('');
      setTabProds([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1D2A1C] font-serif">Işık Rehberi (Shade Finder)</h2>
          <p className="text-xs text-[#7A8377] mt-0.5">
            Storefront'ta "Choose Your Light" interaktif sekmesindeki ışık seviyeleri ve listelenen bitkiler.
          </p>
        </div>
        <button
          type="button"
          onClick={() => startEdit(null)}
          className="inline-flex items-center gap-1.5 text-xs bg-[#1D2A1C] hover:bg-[#2D3E2C] text-[#FDFBF7] px-3.5 py-2 rounded-lg font-medium shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Işık Seviyesi Ekle</span>
        </button>
      </div>

      {/* Edit Form */}
      {editingTab && (
        <div className="bg-white p-5 rounded-xl border-2 border-[#1D2A1C] shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E6DF] pb-2">
            <h3 className="text-sm font-bold text-[#1D2A1C]">
              {editingTab === 'new' ? 'Yeni Işık Seviyesi Oluştur' : `Işık Seviyesi Düzenle: ${tabLabel}`}
            </h3>
            <button onClick={() => setEditingTab(null)} className="text-xs text-[#888]">✕ Kapat</button>
          </div>

          <fetcher.Form method="post" onSubmit={() => setEditingTab(null)} className="space-y-4">
            <input type="hidden" name="intent" value="save_tab" />
            <input type="hidden" name="id" value={tabId} />
            <input type="hidden" name="image_url" value={tabImg} />
            <input type="hidden" name="products_data" value={JSON.stringify(tabProds)} />

            <div>
              <label className="block text-xs font-semibold text-[#5C665A] mb-1">Sekme Adı (Etiket) *</label>
              <input
                type="text"
                name="label"
                required
                value={tabLabel}
                onChange={(e) => setTabLabel(e.target.value)}
                placeholder="Örn: Low Light, Bright Indirect, Direct Sun"
                className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C665A] mb-1">Hap Küçük Resmi (Cloudflare R2)</label>
              <R2Uploader label="" value={tabImg} onUploadComplete={setTabImg} />
            </div>

            <div>
              <ProductMultiPicker
                label="Bu Işık Seviyesine Ait Bitkiler"
                description="Kullanıcı bu ışık filtresini seçtiğinde Storefront'ta sergilenecek bitkileri belirleyin."
                products={allProducts}
                selectedIds={tabProds}
                onChange={setTabProds}
                maxHeight="max-h-60"
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-[#E8E6DF]">
              <button type="submit" className="px-4 py-2 rounded-lg bg-[#1D2A1C] text-[#FDFBF7] text-xs font-medium">
                Kaydet
              </button>
            </div>
          </fetcher.Form>
        </div>
      )}

      {/* Tabs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tabs.map((tab) => (
          <div key={tab.id} className="bg-white rounded-xl border border-[#E8E6DF] overflow-hidden shadow-2xs p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={tab.image_url || 'assets/img/p-pothos-2.jpg'}
                  alt={tab.label}
                  className="w-12 h-12 rounded-full object-cover border border-[#E8E6DF]"
                />
                <div>
                  <h3 className="font-semibold text-sm text-[#1D2A1C]">{tab.label}</h3>
                  <span className="text-[10px] font-mono text-[#888]">{tab.id}</span>
                </div>
              </div>

              <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E8E6DF] space-y-1">
                <p className="text-[11px] font-semibold text-[#5C665A]">Eşleşen Bitkiler:</p>
                <div className="flex flex-wrap gap-1">
                  {tab.products.length === 0 ? (
                    <span className="text-[10px] text-[#999]">Bitki atanmamış</span>
                  ) : (
                    tab.products.map(pid => (
                      <span key={pid} className="bg-white border border-[#E0DED7] text-[10px] px-1.5 py-0.5 rounded text-[#1D2A1C] font-mono">
                        {pid}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 pt-2 border-t border-[#F0EFEB]">
              <button
                type="button"
                onClick={() => startEdit(tab)}
                className="p-1.5 text-[#5C665A] hover:text-[#1D2A1C] hover:bg-[#F4F3EE] rounded transition"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <fetcher.Form method="post">
                <input type="hidden" name="intent" value="delete_tab" />
                <input type="hidden" name="id" value={tab.id} />
                <button
                  type="submit"
                  onClick={(e) => { if (!confirm(`"${tab.label}" sekmesini silmek istiyor musunuz?`)) e.preventDefault(); }}
                  className="p-1.5 text-[#5C665A] hover:text-red-600 hover:bg-red-50 rounded transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </fetcher.Form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
