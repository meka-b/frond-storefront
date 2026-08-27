import React, { useState } from 'react';
import { json } from '@remix-run/node';
import { useLoaderData, Link, useFetcher } from '@remix-run/react';
import db from '../../server/db/index.js';
import {
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  ExternalLink,
  Sparkles,
  Layers
} from 'lucide-react';

export const loader = async () => {
  const products = db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM product_variants WHERE product_id = p.id) as variant_count,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
      (SELECT MIN(price) FROM product_variants WHERE product_id = p.id) as min_price,
      (SELECT MAX(price) FROM product_variants WHERE product_id = p.id) as max_price,
      (SELECT SUM(inventory_qty) FROM product_variants WHERE product_id = p.id) as total_stock
    FROM products p
    ORDER BY p.sort_order ASC, p.created_at DESC
  `).all();

  return json({ products });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const intent = formData.get('intent');
  const productId = formData.get('productId');

  if (intent === 'toggle_publish') {
    const current = db.prepare('SELECT is_published FROM products WHERE id = ?').get(productId);
    const newStatus = current.is_published ? 0 : 1;
    db.prepare('UPDATE products SET is_published = ? WHERE id = ?').run(newStatus, productId);
    return json({ success: true });
  }

  if (intent === 'toggle_bestseller') {
    const current = db.prepare('SELECT is_bestseller FROM products WHERE id = ?').get(productId);
    const newStatus = current.is_bestseller ? 0 : 1;
    db.prepare('UPDATE products SET is_bestseller = ? WHERE id = ?').run(newStatus, productId);
    return json({ success: true });
  }

  if (intent === 'delete') {
    db.prepare('DELETE FROM products WHERE id = ?').run(productId);
    return json({ success: true });
  }

  return json({ success: false });
};

export default function AdminProductsIndex() {
  const { products } = useLoaderData();
  const fetcher = useFetcher();

  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('ALL');
  const [filterStock, setFilterStock] = useState('ALL');

  const money = (c) => '$' + (c / 100).toFixed(2);

  // Extract all unique chips / tags
  const allChips = Array.from(
    new Set(
      products.flatMap((p) => {
        try {
          return JSON.parse(p.chips || '[]');
        } catch {
          return [];
        }
      })
    )
  );

  const filtered = products.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));

    let matchTag = true;
    if (filterTag !== 'ALL') {
      try {
        const chips = JSON.parse(p.chips || '[]');
        matchTag = chips.includes(filterTag);
      } catch {
        matchTag = false;
      }
    }

    let matchStock = true;
    if (filterStock === 'IN_STOCK') matchStock = p.total_stock > 15;
    else if (filterStock === 'LOW_STOCK') matchStock = p.total_stock > 0 && p.total_stock <= 15;
    else if (filterStock === 'OUT_OF_STOCK') matchStock = p.total_stock <= 0;

    return matchSearch && matchTag && matchStock;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1D2A1C] font-serif">Ürün Kataloğu &amp; Stok</h2>
          <p className="text-xs text-[#7A8377] mt-0.5">
            Storefront'ta yer alan tüm canlı bitkiler, saksılar, varyant fiyatları ve stok adetleri.
          </p>
        </div>

        <Link
          to="/admin/products/new"
          className="inline-flex items-center gap-1.5 bg-[#1D2A1C] hover:bg-[#2D3E2C] text-[#FDFBF7] px-3.5 py-2 rounded-lg text-xs font-medium transition shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Ürün Ekle</span>
        </Link>
      </div>

      {/* Filter / Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-[#E8E6DF] shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8C9388] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ürün adı, ID veya SKU ara..."
              className="w-full text-xs bg-[#FAF9F5] border border-[#E0DED7] rounded-lg pl-9 pr-3 py-2 text-[#1D2A1C] placeholder-[#8C9388] focus:bg-white focus:outline-none focus:border-[#1D2A1C]"
            />
          </div>

          {/* Stock Filter */}
          <div className="flex items-center gap-2">
            <select
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value)}
              className="text-xs bg-[#FAF9F5] border border-[#E0DED7] rounded-lg px-3 py-2 text-[#5C665A] focus:bg-white focus:outline-none"
            >
              <option value="ALL">Tüm Stok Durumları</option>
              <option value="IN_STOCK">Stokta Var (&gt; 15)</option>
              <option value="LOW_STOCK">Kritik Stok (1 - 15)</option>
              <option value="OUT_OF_STOCK">Tükendi (0)</option>
            </select>
          </div>
        </div>

        {/* Tag Pills */}
        {allChips.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1">
            <span className="text-[11px] font-mono text-[#8C9388] mr-1 uppercase">Kategori:</span>
            <button
              onClick={() => setFilterTag('ALL')}
              className={`px-2.5 py-1 rounded-md text-xs transition ${
                filterTag === 'ALL'
                  ? 'bg-[#1D2A1C] text-[#FDFBF7] font-medium'
                  : 'bg-[#F4F3EE] text-[#5C665A] hover:bg-[#EAE8E0]'
              }`}
            >
              Tümü ({products.length})
            </button>
            {allChips.map((chip) => (
              <button
                key={chip}
                onClick={() => setFilterTag(chip)}
                className={`px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition ${
                  filterTag === chip
                    ? 'bg-[#1D2A1C] text-[#FDFBF7] font-medium'
                    : 'bg-[#F4F3EE] text-[#5C665A] hover:bg-[#EAE8E0]'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-[#E8E6DF] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F6] border-b border-[#E8E6DF] text-[#7A8377] font-mono text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4">Ürün</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3">Fiyat Aralığı</th>
                <th className="py-3 px-3">Varyant</th>
                <th className="py-3 px-3">Toplam Stok</th>
                <th className="py-3 px-3">Durum</th>
                <th className="py-3 px-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EFEB]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#7A8377]">
                    Arama kriterine uygun ürün bulunamadı.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF9F6] transition">
                    {/* Title + Media */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.primary_image ? (p.primary_image.startsWith('http') || p.primary_image.startsWith('/') ? p.primary_image : '/' + p.primary_image) : '/assets/img/p-monstera-1.jpg'}
                          alt={p.title}
                          className="w-11 h-11 rounded-lg object-cover border border-[#E8E6DF] bg-[#F4F3EE] flex-shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Link to={`/admin/products/${p.id}`} className="font-semibold text-sm text-[#1D2A1C] hover:underline">
                              {p.title}
                            </Link>
                            {p.badge && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#FBECE3] text-[#D87A4F] border border-[#F5D8C7]">
                                {p.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#7A8377] line-clamp-1">{p.subtitle || p.description}</p>
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="py-3 px-3 font-mono text-[#5C665A]">
                      {p.sku || '—'}
                    </td>

                    {/* Price Range */}
                    <td className="py-3 px-3 font-semibold text-[#1D2A1C]">
                      {p.min_price ? (
                        p.min_price === p.max_price
                          ? money(p.min_price)
                          : `${money(p.min_price)} – ${money(p.max_price)}`
                      ) : '—'}
                    </td>

                    {/* Variant Count */}
                    <td className="py-3 px-3 text-[#5C665A]">
                      <span className="bg-[#F4F3EE] px-2 py-0.5 rounded font-mono text-[11px]">
                        {p.variant_count} varyant
                      </span>
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        p.total_stock <= 0
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : p.total_stock <= 15
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {p.total_stock <= 0 ? 'Tükendi' : `${p.total_stock} adet`}
                      </span>
                    </td>

                    {/* Status Toggles */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <fetcher.Form method="post" className="inline-block">
                          <input type="hidden" name="productId" value={p.id} />
                          <input type="hidden" name="intent" value="toggle_publish" />
                          <button
                            type="submit"
                            title={p.is_published ? 'Yayından Kaldır' : 'Yayınla'}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition ${
                              p.is_published
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {p.is_published ? 'Yayında' : 'Taslak'}
                          </button>
                        </fetcher.Form>

                        {p.is_bestseller === 1 && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F4F3EE] text-[#5C665A]">
                            <Sparkles className="w-3 h-3 text-[#D87A4F]" />
                            <span>Bestseller</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/product.html?handle=${p.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-[#5C665A] hover:text-[#1D2A1C] hover:bg-[#F4F3EE] rounded transition"
                          title="Storefront'ta İncele"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        <Link
                          to={`/admin/products/${p.id}`}
                          className="p-1.5 text-[#5C665A] hover:text-[#1D2A1C] hover:bg-[#F4F3EE] rounded transition"
                          title="Düzenle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>

                        <fetcher.Form method="post" className="inline-block">
                          <input type="hidden" name="productId" value={p.id} />
                          <input type="hidden" name="intent" value="delete" />
                          <button
                            type="submit"
                            onClick={(e) => {
                              if (!confirm(`"${p.title}" ürününü silmek istediğinize emin misiniz?`)) {
                                e.preventDefault();
                              }
                            }}
                            className="p-1.5 text-[#5C665A] hover:text-red-600 hover:bg-red-50 rounded transition"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </fetcher.Form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
