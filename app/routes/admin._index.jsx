import React from 'react';
import { json } from '@remix-run/node';
import { useLoaderData, Link } from '@remix-run/react';
import db from '../../server/db/index.js';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Mail,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  Layers,
  Sparkles,
  Tag
} from 'lucide-react';

export const loader = async () => {
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
    WHERE pv.inventory_qty <= 20
    ORDER BY pv.inventory_qty ASC
    LIMIT 5
  `).all();

  const recentOrders = db.prepare(`
    SELECT * FROM orders ORDER BY created_at DESC LIMIT 5
  `).all();

  const topProducts = db.prepare(`
    SELECT p.*,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
      (SELECT MIN(price) FROM product_variants WHERE product_id = p.id) as min_price
    FROM products p
    WHERE p.is_bestseller = 1 OR p.is_published = 1
    ORDER BY p.rating DESC, p.reviews_count DESC
    LIMIT 4
  `).all();

  return json({
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
};

export default function AdminDashboard() {
  const { kpis, lowStock, recentOrders, topProducts } = useLoaderData();

  const money = (cents) => '$' + (cents / 100).toFixed(2);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1D2A1C] font-serif">
            Mağaza Genel Bakış
          </h2>
          <p className="text-xs text-[#6F776C] mt-1">
            FROND e-ticaret vitrini, Cloudflare R2 medyası ve veritabanı durumu.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-1.5 text-xs bg-[#1D2A1C] hover:bg-[#2D3E2C] text-[#FDFBF7] px-3.5 py-2 rounded-lg font-medium shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Ürün Ekle</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#E8E6DF] shadow-2xs">
          <div className="flex items-center justify-between text-[#7A8377] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Toplam Gelir</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-[#1D2A1C]">{money(kpis.totalRevenue)}</p>
          <p className="text-[11px] text-[#7A8377] mt-1">Ödenen siparişlerden</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E8E6DF] shadow-2xs">
          <div className="flex items-center justify-between text-[#7A8377] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Siparişler</span>
            <ShoppingBag className="w-4 h-4 text-[#D87A4F]" />
          </div>
          <p className="text-2xl font-bold text-[#1D2A1C]">{kpis.totalOrders}</p>
          <Link to="/admin/orders" className="text-[11px] text-[#D87A4F] hover:underline mt-1 inline-block">
            Tüm siparişleri gör →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E8E6DF] shadow-2xs">
          <div className="flex items-center justify-between text-[#7A8377] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Katalog</span>
            <Package className="w-4 h-4 text-[#3F5E3D]" />
          </div>
          <p className="text-2xl font-bold text-[#1D2A1C]">{kpis.totalProducts} <span className="text-sm font-normal text-[#888]">({kpis.totalPublished} yayında)</span></p>
          <Link to="/admin/products" className="text-[11px] text-[#3F5E3D] hover:underline mt-1 inline-block">
            Ürünleri yönet →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E8E6DF] shadow-2xs">
          <div className="flex items-center justify-between text-[#7A8377] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Bülten Kitlesi</span>
            <Mail className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-[#1D2A1C]">{kpis.totalSubscribers}</p>
          <Link to="/admin/newsletter" className="text-[11px] text-blue-600 hover:underline mt-1 inline-block">
            Aboneleri listele →
          </Link>
        </div>
      </div>

      {/* Grid: Low Stock & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl border border-[#E8E6DF] p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-semibold text-[#1D2A1C]">Kritik Stok Uyarıları</h3>
            </div>
            <Link to="/admin/products" className="text-xs text-[#D87A4F] hover:underline font-medium">
              Tümü
            </Link>
          </div>

          {lowStock.length === 0 ? (
            <p className="text-xs text-[#7A8377] py-6 text-center">Tüm varyantların stoğu yeterli seviyede.</p>
          ) : (
            <div className="divide-y divide-[#F0EFEB]">
              {lowStock.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-medium text-[#1D2A1C]">{item.product_title}</p>
                    <p className="text-[11px] text-[#7A8377]">Varyant: {item.label} · Fiyat: {money(item.price)}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    item.inventory_qty === 0
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {item.inventory_qty === 0 ? 'Tükendi' : `${item.inventory_qty} adet kaldı`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Selling Products */}
        <div className="bg-white rounded-xl border border-[#E8E6DF] p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D87A4F]" />
              <h3 className="text-sm font-semibold text-[#1D2A1C]">Öne Çıkan &amp; Çok Satan Bitkiler</h3>
            </div>
            <Link to="/admin/products" className="text-xs text-[#D87A4F] hover:underline font-medium">
              Katalog
            </Link>
          </div>

          <div className="space-y-3">
            {topProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F9F8F5] transition">
                <div className="flex items-center gap-3">
                  <img
                    src={p.primary_image ? (p.primary_image.startsWith('http') || p.primary_image.startsWith('/') ? p.primary_image : '/' + p.primary_image) : '/assets/img/p-monstera-1.jpg'}
                    alt={p.title}
                    className="w-10 h-10 rounded-md object-cover border border-[#E8E6DF]"
                  />
                  <div>
                    <h4 className="text-xs font-semibold text-[#1D2A1C]">{p.title}</h4>
                    <p className="text-[11px] text-[#7A8377]">
                      ★ {p.rating.toFixed(1)} ({p.reviews_count} yorum) · {money(p.min_price || 4800)}
                    </p>
                  </div>
                </div>
                <Link
                  to={`/admin/products/${p.id}`}
                  className="text-[11px] text-[#5C665A] hover:text-[#1D2A1C] bg-[#F4F3EE] px-2.5 py-1 rounded border border-[#E5E3DC]"
                >
                  Düzenle
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl border border-[#E8E6DF] p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#1D2A1C]">Son Gelen Siparişler</h3>
          <Link to="/admin/orders" className="text-xs text-[#D87A4F] hover:underline font-medium">
            Tümünü Gör ({kpis.totalOrders})
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-xs text-[#7A8377] py-6 text-center">Henüz sipariş bulunmuyor.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E8E6DF] text-[#7A8377] font-mono text-[10px] uppercase">
                <tr>
                  <th className="py-2">Sipariş No</th>
                  <th className="py-2">Müşteri</th>
                  <th className="py-2">Tutar</th>
                  <th className="py-2">Ödeme</th>
                  <th className="py-2">Durum</th>
                  <th className="py-2">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EFEB]">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#FAF9F6]">
                    <td className="py-3 font-mono font-semibold text-[#1D2A1C]">{ord.order_number}</td>
                    <td className="py-3">{ord.customer_name}</td>
                    <td className="py-3 font-semibold">{money(ord.total_cents)}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {ord.payment_status}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 text-[#7A8377]">{new Date(ord.created_at).toLocaleDateString('tr-TR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
