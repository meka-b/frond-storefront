import React, { useState } from 'react';
import { json } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';
import db from '../../server/db/index.js';
import ProductSingleSelect from '../components/ProductSingleSelect.jsx';
import {
  Star,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  MessageSquare
} from 'lucide-react';

export const loader = async () => {
  const reviews = db.prepare(`
    SELECT r.*, p.title as product_title
    FROM reviews r
    JOIN products p ON r.product_id = p.id
    ORDER BY r.created_at DESC
  `).all();
  const allProducts = db.prepare(`
    SELECT p.id, p.title, p.sku,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
    FROM products p
    ORDER BY p.title ASC
  `).all();
  return json({ reviews, allProducts });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'add_review') {
    const id = `rev-${Date.now()}`;
    const product_id = formData.get('product_id');
    const author_name = formData.get('author_name') || 'Happy Plant Parent';
    const rating = Number(formData.get('rating')) || 5;
    const title = formData.get('title') || '';
    const comment = formData.get('comment');

    db.prepare(`
      INSERT INTO reviews (id, product_id, author_name, rating, title, comment, verified_purchase, status)
      VALUES (?, ?, ?, ?, ?, ?, 1, 'approved')
    `).run(id, product_id, author_name, rating, title, comment);

    // Recalculate average rating & review count for product
    const stats = db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as count
      FROM reviews
      WHERE product_id = ? AND status = 'approved'
    `).get(product_id);

    if (stats) {
      db.prepare(`
        UPDATE products SET
          rating = ROUND(?, 1),
          reviews_count = ?
        WHERE id = ?
      `).run(stats.avg_rating || 5.0, stats.count || 0, product_id);
    }

    return json({ success: true });
  }

  if (intent === 'delete_review') {
    const id = formData.get('id');
    const rev = db.prepare('SELECT product_id FROM reviews WHERE id = ?').get(id);
    db.prepare('DELETE FROM reviews WHERE id = ?').run(id);

    if (rev) {
      const stats = db.prepare('SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE product_id = ?').get(rev.product_id);
      db.prepare('UPDATE products SET rating = ROUND(COALESCE(?, 5.0), 1), reviews_count = COALESCE(?, 0) WHERE id = ?')
        .run(stats?.avg_rating, stats?.count, rev.product_id);
    }
    return json({ success: true });
  }

  return json({ success: false });
};

export default function AdminReviews() {
  const { reviews, allProducts } = useLoaderData();
  const fetcher = useFetcher();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedPid, setSelectedPid] = useState(allProducts[0]?.id || 'monstera');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1D2A1C] font-serif">Müşteri Yorumları &amp; Değerlendirmeler</h2>
          <p className="text-xs text-[#7A8377] mt-0.5">
            Ürün detay sayfasında ve puanlama rozetlerinde görünen müşteri geri bildirimleri.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-1.5 text-xs bg-[#1D2A1C] hover:bg-[#2D3E2C] text-[#FDFBF7] px-3.5 py-2 rounded-lg font-medium shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Yorum Ekle</span>
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="bg-white p-5 rounded-xl border-2 border-[#1D2A1C] shadow-md space-y-3">
          <h3 className="text-sm font-bold text-[#1D2A1C]">Yeni Müşteri Değerlendirmesi Ekle</h3>
          <fetcher.Form method="post" onSubmit={() => setShowAdd(false)} className="space-y-3">
            <input type="hidden" name="intent" value="add_review" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <ProductSingleSelect
                  name="product_id"
                  label="Ürün Seçin"
                  products={allProducts}
                  value={selectedPid}
                  onChange={setSelectedPid}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C665A] mb-1">Müşteri Adı *</label>
                <input
                  type="text"
                  name="author_name"
                  required
                  placeholder="Örn: Sarah M."
                  className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C665A] mb-1">Puan (1-5 Yıldız)</label>
                <select name="rating" defaultValue="5" className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]">
                  <option value="5">★★★★★ (5 Yıldız)</option>
                  <option value="4">★★★★☆ (4 Yıldız)</option>
                  <option value="3">★★★☆☆ (3 Yıldız)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C665A] mb-1">Yorum Başlığı</label>
              <input
                type="text"
                name="title"
                placeholder="Örn: Arrived in perfect condition!"
                className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C665A] mb-1">Yorum Metni *</label>
              <textarea
                name="comment"
                required
                rows={3}
                placeholder="Bitkinin paketlenmesi harikaydı, kökleri son derece sağlıklı geldi..."
                className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-3 py-1.5 rounded-lg border border-[#DDD] text-xs font-medium text-[#666]"
              >
                İptal
              </button>
              <button type="submit" className="px-4 py-1.5 rounded-lg bg-[#1D2A1C] text-white text-xs font-medium">
                Yorumu Kaydet
              </button>
            </div>
          </fetcher.Form>
        </div>
      )}

      {/* Reviews Table */}
      <div className="bg-white rounded-xl border border-[#E8E6DF] overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAF9F6] border-b border-[#E8E6DF] text-[#7A8377] font-mono text-[10px] uppercase">
            <tr>
              <th className="py-3 px-4">Ürün</th>
              <th className="py-3 px-3">Müşteri</th>
              <th className="py-3 px-3">Puan</th>
              <th className="py-3 px-3">Yorum</th>
              <th className="py-3 px-3">Tarih</th>
              <th className="py-3 px-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EFEB]">
            {reviews.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#7A8377]">
                  Henüz yorum eklenmedi.
                </td>
              </tr>
            ) : (
              reviews.map((r) => (
                <tr key={r.id} className="hover:bg-[#FAF9F6]">
                  <td className="py-3 px-4 font-semibold text-[#1D2A1C]">{r.product_title}</td>
                  <td className="py-3 px-3 font-medium">{r.author_name}</td>
                  <td className="py-3 px-3 text-amber-500 font-bold whitespace-nowrap">
                    {'★'.repeat(Math.round(r.rating))}
                    <span className="text-[#888] font-normal text-[11px] ml-1">({r.rating})</span>
                  </td>
                  <td className="py-3 px-3 text-[#555] max-w-xs truncate" title={r.comment}>
                    {r.title ? <b className="text-[#1D2A1C]">{r.title} — </b> : ''}
                    {r.comment}
                  </td>
                  <td className="py-3 px-3 text-[#7A8377] font-mono">
                    {new Date(r.created_at).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <fetcher.Form method="post" className="inline-block">
                      <input type="hidden" name="intent" value="delete_review" />
                      <input type="hidden" name="id" value={r.id} />
                      <button type="submit" className="p-1 text-[#888] hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </fetcher.Form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
