import React, { useState } from 'react';
import { json } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';
import db from '../../server/db/index.js';
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Check,
  Percent,
  Clock
} from 'lucide-react';

export const loader = async () => {
  const campaigns = db.prepare('SELECT * FROM campaigns ORDER BY sort_order ASC').all();
  const coupons = db.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all();
  return json({ campaigns, coupons });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'save_campaign') {
    const id = formData.get('id') || `camp-${Date.now()}`;
    const kicker = formData.get('kicker');
    const title = formData.get('title');
    const description = formData.get('description') || '';
    const card_style = formData.get('card_style') || 'ticket';
    const coupon_code = formData.get('coupon_code') || '';
    const cta_label = formData.get('cta_label') || '';
    const cta_url = formData.get('cta_url') || '';
    const countdown_hours = Number(formData.get('countdown_hours')) || 26;

    db.prepare(`
      INSERT OR REPLACE INTO campaigns (id, kicker, title, description, card_style, coupon_code, cta_label, cta_url, countdown_hours, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM campaigns WHERE id != ?), 1)
    `).run(id, kicker, title, description, card_style, coupon_code, cta_label, cta_url, countdown_hours, id);

    return json({ success: true });
  }

  if (intent === 'delete_campaign') {
    const id = formData.get('id');
    db.prepare('DELETE FROM campaigns WHERE id = ?').run(id);
    return json({ success: true });
  }

  if (intent === 'save_coupon') {
    const id = formData.get('id') || `coup-${Date.now()}`;
    const code = formData.get('code').toUpperCase().trim();
    const title = formData.get('title');
    const discount_type = formData.get('discount_type') || 'percent';
    const discount_value = Number(formData.get('discount_value')) || 15;
    const min_order_dollars = Number(formData.get('min_order_dollars')) || 0;
    const usage_limit = formData.get('usage_limit') ? Number(formData.get('usage_limit')) : null;

    db.prepare(`
      INSERT OR REPLACE INTO coupons (id, code, title, discount_type, discount_value, min_order_cents, usage_limit, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(id, code, title, discount_type, discount_value, Math.round(min_order_dollars * 100), usage_limit);

    return json({ success: true });
  }

  if (intent === 'delete_coupon') {
    const id = formData.get('id');
    db.prepare('DELETE FROM coupons WHERE id = ?').run(id);
    return json({ success: true });
  }

  return json({ success: false });
};

export default function AdminCampaigns() {
  const { campaigns, coupons } = useLoaderData();
  const fetcher = useFetcher();

  const [editingCamp, setEditingCamp] = useState(null);
  const [editingCoup, setEditingCoup] = useState(null);

  // Campaign form
  const [campId, setCampId] = useState('');
  const [campKicker, setCampKicker] = useState('');
  const [campTitle, setCampTitle] = useState('');
  const [campDesc, setCampDesc] = useState('');
  const [campStyle, setCampStyle] = useState('ticket');
  const [campCode, setCampCode] = useState('');
  const [campCtaLabel, setCampCtaLabel] = useState('');
  const [campCtaUrl, setCampCtaUrl] = useState('');
  const [campHours, setCampHours] = useState(26);

  // Coupon form
  const [coupCode, setCoupCode] = useState('');
  const [coupTitle, setCoupTitle] = useState('');
  const [coupType, setCoupType] = useState('percent');
  const [coupVal, setCoupVal] = useState('15');
  const [coupMin, setCoupMin] = useState('0');
  const [coupLimit, setCoupLimit] = useState('');

  const startEditCamp = (c) => {
    if (c) {
      setEditingCamp(c.id);
      setCampId(c.id);
      setCampKicker(c.kicker);
      setCampTitle(c.title);
      setCampDesc(c.description || '');
      setCampStyle(c.card_style || 'ticket');
      setCampCode(c.coupon_code || '');
      setCampCtaLabel(c.cta_label || '');
      setCampCtaUrl(c.cta_url || '');
      setCampHours(c.countdown_hours || 26);
    } else {
      setEditingCamp('new');
      setCampId('');
      setCampKicker('First-order treat — flash deal');
      setCampTitle('15% off your first FROND');
      setCampDesc('Auto-applied at checkout');
      setCampStyle('ticket');
      setCampCode('PLANTLOVE15');
      setCampCtaLabel('Copy');
      setCampCtaUrl('');
      setCampHours(26);
    }
  };

  const startEditCoup = (cp) => {
    if (cp) {
      setEditingCoup(cp.id);
      setCoupCode(cp.code);
      setCoupTitle(cp.title);
      setCoupType(cp.discount_type);
      setCoupVal(String(cp.discount_value));
      setCoupMin(String(cp.min_order_cents / 100));
      setCoupLimit(cp.usage_limit ? String(cp.usage_limit) : '');
    } else {
      setEditingCoup('new');
      setCoupCode('');
      setCoupTitle('');
      setCoupType('percent');
      setCoupVal('15');
      setCoupMin('0');
      setCoupLimit('');
    }
  };

  return (
    <div className="space-y-10">
      {/* 1. PDP Campaign Cards Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-[#1D2A1C] font-serif">Kampanyalar &amp; "Offers in Bloom"</h2>
            <p className="text-xs text-[#7A8377]">
              PDP sayfasında listelenen flaş indirim geri sayım kartı, paket kampanyaları ve pot indirimleri.
            </p>
          </div>
          <button
            type="button"
            onClick={() => startEditCamp(null)}
            className="inline-flex items-center gap-1.5 text-xs bg-[#1D2A1C] hover:bg-[#2D3E2C] text-[#FDFBF7] px-3.5 py-2 rounded-lg font-medium shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Kampanya Kartı</span>
          </button>
        </div>

        {/* Campaign Form */}
        {editingCamp && (
          <div className="bg-white p-5 rounded-xl border-2 border-[#1D2A1C] shadow-md mb-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E6DF] pb-2">
              <h3 className="text-sm font-bold text-[#1D2A1C]">Kampanya Kartı Düzenle</h3>
              <button onClick={() => setEditingCamp(null)} className="text-xs text-[#888]">✕ Kapat</button>
            </div>
            <fetcher.Form method="post" onSubmit={() => setEditingCamp(null)} className="space-y-3">
              <input type="hidden" name="intent" value="save_campaign" />
              <input type="hidden" name="id" value={campId} />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5C665A] mb-1">Üst Başlık (Kicker)</label>
                  <input
                    type="text"
                    name="kicker"
                    required
                    value={campKicker}
                    onChange={(e) => setCampKicker(e.target.value)}
                    placeholder="First-order treat — flash deal"
                    className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5C665A] mb-1">Ana Başlık</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={campTitle}
                    onChange={(e) => setCampTitle(e.target.value)}
                    placeholder="15% off your first FROND"
                    className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5C665A] mb-1">Kart Görünüm Teması</label>
                  <select
                    name="card_style"
                    value={campStyle}
                    onChange={(e) => setCampStyle(e.target.value)}
                    className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
                  >
                    <option value="ticket">Ticket (Flaş Sayaçlı &amp; Kupon Kopyalamalı)</option>
                    <option value="green">Green (Yeşil Doğa Teması)</option>
                    <option value="clay">Clay (Terracotta Kil Teması)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C665A] mb-1">Açıklama</label>
                <input
                  type="text"
                  name="description"
                  value={campDesc}
                  onChange={(e) => setCampDesc(e.target.value)}
                  placeholder="Mist sprayer, neem oil & a moss pole — auto-added to your box."
                  className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5C665A] mb-1">Bağlantılı Kupon Kodu (Varsa)</label>
                  <input
                    type="text"
                    name="coupon_code"
                    value={campCode}
                    onChange={(e) => setCampCode(e.target.value)}
                    placeholder="PLANTLOVE15"
                    className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5] font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5C665A] mb-1">Buton Metni / Buton Linki</label>
                  <input
                    type="text"
                    name="cta_label"
                    value={campCtaLabel}
                    onChange={(e) => setCampCtaLabel(e.target.value)}
                    placeholder="Shop pots"
                    className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5C665A] mb-1">Geri Sayım Saati (Saat)</label>
                  <input
                    type="number"
                    name="countdown_hours"
                    value={campHours}
                    onChange={(e) => setCampHours(e.target.value)}
                    placeholder="26"
                    className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" className="px-4 py-2 rounded-lg bg-[#1D2A1C] text-[#FDFBF7] text-xs font-medium">
                  Kaydet
                </button>
              </div>
            </fetcher.Form>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {campaigns.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-[#E8E6DF] p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#D87A4F] uppercase font-bold">{c.kicker}</span>
                <h3 className="text-base font-serif font-bold text-[#1D2A1C] mt-1">{c.title}</h3>
                <p className="text-xs text-[#7A8377] mt-1">{c.description}</p>
                {c.coupon_code && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F4F3EE] rounded-md font-mono text-xs font-bold text-[#1D2A1C] border border-[#DDD]">
                    <Tag className="w-3.5 h-3.5 text-[#D87A4F]" />
                    <span>{c.coupon_code}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-2 border-t border-[#F0EFEB]">
                <button onClick={() => startEditCamp(c)} className="p-1.5 text-[#666] hover:text-[#1D2A1C]">
                  <Edit2 className="w-4 h-4" />
                </button>
                <fetcher.Form method="post">
                  <input type="hidden" name="intent" value="delete_campaign" />
                  <input type="hidden" name="id" value={c.id} />
                  <button type="submit" className="p-1.5 text-[#666] hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </fetcher.Form>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Coupons Management Section */}
      <div className="pt-6 border-t border-[#E8E6DF]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#1D2A1C] font-serif">Kupon &amp; İndirim Kodları</h2>
            <p className="text-xs text-[#7A8377]">
              Müşterilerin sepet çekmecesinde veya ödemede kullanabileceği geçerli indirim kuponları.
            </p>
          </div>
          <button
            type="button"
            onClick={() => startEditCoup(null)}
            className="inline-flex items-center gap-1.5 text-xs bg-[#F4F3EE] hover:bg-[#EAE8E0] text-[#1D2A1C] px-3.5 py-2 rounded-lg border border-[#DDDCD5] font-medium transition"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Kupon Kodu Ekle</span>
          </button>
        </div>

        {/* Coupon Form */}
        {editingCoup && (
          <div className="bg-white p-5 rounded-xl border-2 border-[#1D2A1C] shadow-md mb-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E6DF] pb-2">
              <h3 className="text-xs font-bold text-[#1D2A1C]">Kupon Oluştur / Düzenle</h3>
              <button onClick={() => setEditingCoup(null)} className="text-xs text-[#888]">✕</button>
            </div>
            <fetcher.Form method="post" onSubmit={() => setEditingCoup(null)} className="space-y-3">
              <input type="hidden" name="intent" value="save_coupon" />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5C665A] mb-1">Kupon Kodu *</label>
                  <input
                    type="text"
                    name="code"
                    required
                    value={coupCode}
                    onChange={(e) => setCoupCode(e.target.value.toUpperCase())}
                    placeholder="PLANTLOVE15"
                    className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5] font-mono uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5C665A] mb-1">Kupon Açıklaması</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={coupTitle}
                    onChange={(e) => setCoupTitle(e.target.value)}
                    placeholder="15% First Order Discount"
                    className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5C665A] mb-1">İndirim Türü</label>
                  <select
                    name="discount_type"
                    value={coupType}
                    onChange={(e) => setCoupType(e.target.value)}
                    className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
                  >
                    <option value="percent">Yüzde (%) İndirim</option>
                    <option value="fixed">Sabit Tutar ($) İndirimi</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5C665A] mb-1">
                    {coupType === 'percent' ? 'İndirim Oranı (%)' : 'İndirim Tutarı ($)'}
                  </label>
                  <input
                    type="number"
                    name="discount_value"
                    required
                    value={coupVal}
                    onChange={(e) => setCoupVal(e.target.value)}
                    placeholder="15"
                    className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5C665A] mb-1">Minimum Sepet Tutarı ($)</label>
                  <input
                    type="number"
                    name="min_order_dollars"
                    value={coupMin}
                    onChange={(e) => setCoupMin(e.target.value)}
                    placeholder="0"
                    className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5C665A] mb-1">Kullanım Limiti (Opsiyonel)</label>
                  <input
                    type="number"
                    name="usage_limit"
                    value={coupLimit}
                    onChange={(e) => setCoupLimit(e.target.value)}
                    placeholder="1000"
                    className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" className="px-4 py-2 rounded-lg bg-[#1D2A1C] text-[#FDFBF7] text-xs font-medium">
                  Kaydet
                </button>
              </div>
            </fetcher.Form>
          </div>
        )}

        <div className="bg-white rounded-xl border border-[#E8E6DF] overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F6] border-b border-[#E8E6DF] text-[#7A8377] font-mono text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4">Kupon Kodu</th>
                <th className="py-3 px-3">Başlık</th>
                <th className="py-3 px-3">İndirim</th>
                <th className="py-3 px-3">Min Sepet</th>
                <th className="py-3 px-3">Kullanım</th>
                <th className="py-3 px-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EFEB]">
              {coupons.map((cp) => (
                <tr key={cp.id} className="hover:bg-[#FAF9F6]">
                  <td className="py-3 px-4 font-mono font-bold text-[#1D2A1C]">{cp.code}</td>
                  <td className="py-3 px-3 font-medium">{cp.title}</td>
                  <td className="py-3 px-3 font-semibold text-[#D87A4F]">
                    {cp.discount_type === 'percent' ? `%${cp.discount_value}` : `$${(cp.discount_value / 100).toFixed(2)}`}
                  </td>
                  <td className="py-3 px-3 text-[#7A8377]">
                    {cp.min_order_cents ? `$${(cp.min_order_cents / 100).toFixed(2)}` : 'Yok'}
                  </td>
                  <td className="py-3 px-3 text-[#7A8377]">
                    {cp.usage_count} {cp.usage_limit ? `/ ${cp.usage_limit}` : ''}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <fetcher.Form method="post" className="inline-block">
                      <input type="hidden" name="intent" value="delete_coupon" />
                      <input type="hidden" name="id" value={cp.id} />
                      <button type="submit" className="p-1 text-[#888] hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </fetcher.Form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
