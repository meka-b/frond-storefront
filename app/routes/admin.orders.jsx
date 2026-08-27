import React, { useState } from 'react';
import { json } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';
import db from '../../server/db/index.js';
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Eye,
  DollarSign
} from 'lucide-react';

export const loader = async () => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  const items = db.prepare('SELECT * FROM order_items').all();

  const data = orders.map(ord => ({
    ...ord,
    items: items.filter(it => it.order_id === ord.id)
  }));

  return json({ orders: data });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const orderId = formData.get('orderId');
  const status = formData.get('status');
  const payment_status = formData.get('payment_status');

  db.prepare(`
    UPDATE orders SET
      status = COALESCE(?, status),
      payment_status = COALESCE(?, payment_status),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, payment_status, orderId);

  return json({ success: true });
};

export default function AdminOrders() {
  const { orders } = useLoaderData();
  const fetcher = useFetcher();
  const [selectedOrder, setSelectedOrder] = useState(null);

  const money = (cents) => '$' + (cents / 100).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#1D2A1C] font-serif">Sipariş Yönetimi</h2>
        <p className="text-xs text-[#7A8377] mt-0.5">
          Storefront sepetinden ve checkout akışından gelen canlı müşteri siparişleri.
        </p>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-[#E8E6DF] overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAF9F6] border-b border-[#E8E6DF] text-[#7A8377] font-mono text-[10px] uppercase">
            <tr>
              <th className="py-3 px-4">Sipariş No</th>
              <th className="py-3 px-3">Müşteri</th>
              <th className="py-3 px-3">Kalemler</th>
              <th className="py-3 px-3">Genel Toplam</th>
              <th className="py-3 px-3">Ödeme</th>
              <th className="py-3 px-3">Sipariş Durumu</th>
              <th className="py-3 px-3 text-right">Detay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EFEB]">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#7A8377]">
                  Henüz verilmiş bir sipariş bulunmuyor.
                </td>
              </tr>
            ) : (
              orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-[#FAF9F6]">
                  <td className="py-3 px-4 font-mono font-bold text-[#1D2A1C]">{ord.order_number}</td>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-[#1D2A1C]">{ord.customer_name}</p>
                    <p className="text-[11px] text-[#7A8377] font-mono">{ord.customer_email}</p>
                  </td>
                  <td className="py-3 px-3 text-[#5C665A]">
                    {ord.items.length} ürün
                  </td>
                  <td className="py-3 px-3 font-semibold text-[#1D2A1C]">
                    {money(ord.total_cents)}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      ord.payment_status === 'paid'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {ord.payment_status}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <fetcher.Form method="post" className="inline-block">
                      <input type="hidden" name="orderId" value={ord.id} />
                      <select
                        name="status"
                        defaultValue={ord.status}
                        onChange={(e) => e.target.form.requestSubmit()}
                        className="text-xs bg-[#FAF9F5] border border-[#DDD] rounded px-2 py-1 font-medium"
                      >
                        <option value="pending">Beklemede (Pending)</option>
                        <option value="paid">Hazırlanıyor (Paid)</option>
                        <option value="shipped">Kargolandı (Shipped)</option>
                        <option value="delivered">Teslim Edildi (Delivered)</option>
                        <option value="cancelled">İptal Edildi (Cancelled)</option>
                      </select>
                    </fetcher.Form>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(ord)}
                      className="p-1.5 text-[#5C665A] hover:text-[#1D2A1C] hover:bg-[#F4F3EE] rounded transition"
                      title="Sipariş Kalemlerini İncele"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E8E6DF] max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E6DF] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#1D2A1C] font-mono">Sipariş: {selectedOrder.order_number}</h3>
                <p className="text-xs text-[#7A8377]">{new Date(selectedOrder.created_at).toLocaleString('tr-TR')}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-sm font-bold text-[#888] hover:text-black">✕</button>
            </div>

            {/* Customer Info */}
            <div className="bg-[#FAF9F5] p-3 rounded-lg border border-[#E8E6DF] text-xs space-y-1">
              <p className="font-semibold text-[#1D2A1C]">Müşteri &amp; Teslimat Bilgisi</p>
              <p className="text-[#555]">{selectedOrder.customer_name} · {selectedOrder.customer_email}</p>
              <p className="text-[#555]">{selectedOrder.shipping_address}, {selectedOrder.city} {selectedOrder.postal_code}</p>
              {selectedOrder.notes && <p className="text-[#D87A4F] pt-1">Hediye Notu: "{selectedOrder.notes}"</p>}
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#1D2A1C] uppercase font-mono">Sipariş Kalemleri</p>
              <div className="divide-y divide-[#F0EFEB] max-h-48 overflow-y-auto">
                {selectedOrder.items.map((it) => (
                  <div key={it.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-[#1D2A1C]">{it.product_title}</p>
                      <p className="text-[11px] text-[#7A8377]">{it.variant_label} × {it.quantity}</p>
                    </div>
                    <span className="font-semibold">{money(it.total_price_cents)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="pt-2 border-t border-[#E8E6DF] text-xs space-y-1">
              <div className="flex justify-between text-[#7A8377]">
                <span>Ara Toplam:</span>
                <span>{money(selectedOrder.subtotal_cents)}</span>
              </div>
              {selectedOrder.discount_cents > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>İndirim ({selectedOrder.coupon_code || 'Kupon'}):</span>
                  <span>-{money(selectedOrder.discount_cents)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-[#1D2A1C] pt-1 border-t border-[#F0EFEB]">
                <span>Toplam Tutar:</span>
                <span>{money(selectedOrder.total_cents)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-lg bg-[#1D2A1C] text-[#FDFBF7] text-xs font-medium"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
