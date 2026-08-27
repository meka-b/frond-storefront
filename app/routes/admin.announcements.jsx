import React, { useState } from 'react';
import { json } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';
import db from '../../server/db/index.js';
import {
  Megaphone,
  Plus,
  Trash2,
  Edit2
} from 'lucide-react';

export const loader = async () => {
  const items = db.prepare('SELECT * FROM announcements ORDER BY sort_order ASC').all();
  return json({ items });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'save_announcement') {
    const id = formData.get('id') || `ann-${Date.now()}`;
    const text = formData.get('text');
    const icon = formData.get('icon') || '✦';
    const link_url = formData.get('link_url') || '';
    const speed_seconds = formData.get('speed_seconds') || '36s';

    db.prepare(`
      INSERT OR REPLACE INTO announcements (id, text, icon, link_url, speed_seconds, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM announcements WHERE id != ?), 1)
    `).run(id, text, icon, link_url, speed_seconds, id);

    return json({ success: true });
  }

  if (intent === 'delete_announcement') {
    const id = formData.get('id');
    db.prepare('DELETE FROM announcements WHERE id = ?').run(id);
    return json({ success: true });
  }

  return json({ success: false });
};

export default function AdminAnnouncements() {
  const { items } = useLoaderData();
  const fetcher = useFetcher();

  const [editingItem, setEditingItem] = useState(null);
  const [annId, setAnnId] = useState('');
  const [annText, setAnnText] = useState('');
  const [annIcon, setAnnIcon] = useState('✦');
  const [annLink, setAnnLink] = useState('');
  const [annSpeed, setAnnSpeed] = useState('36s');

  const startEdit = (a) => {
    if (a) {
      setEditingItem(a.id);
      setAnnId(a.id);
      setAnnText(a.text);
      setAnnIcon(a.icon || '✦');
      setAnnLink(a.link_url || '');
      setAnnSpeed(a.speed_seconds || '36s');
    } else {
      setEditingItem('new');
      setAnnId('');
      setAnnText('');
      setAnnIcon('✦');
      setAnnLink('');
      setAnnSpeed('36s');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1D2A1C] font-serif">Duyuru Bandı (Marquee Ticker)</h2>
          <p className="text-xs text-[#7A8377] mt-0.5">
            Storefront'un en üstünde ve bölümler arasında kayan sonsuz duyuru mesajları.
          </p>
        </div>
        <button
          type="button"
          onClick={() => startEdit(null)}
          className="inline-flex items-center gap-1.5 text-xs bg-[#1D2A1C] hover:bg-[#2D3E2C] text-[#FDFBF7] px-3.5 py-2 rounded-lg font-medium shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Duyuru Ekle</span>
        </button>
      </div>

      {/* Edit Form */}
      {editingItem && (
        <div className="bg-white p-5 rounded-xl border-2 border-[#1D2A1C] shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E6DF] pb-2">
            <h3 className="text-sm font-bold text-[#1D2A1C]">
              {editingItem === 'new' ? 'Yeni Duyuru Ekle' : 'Duyuru Metnini Düzenle'}
            </h3>
            <button onClick={() => setEditingItem(null)} className="text-xs text-[#888]">✕ Kapat</button>
          </div>

          <fetcher.Form method="post" onSubmit={() => setEditingItem(null)} className="space-y-3">
            <input type="hidden" name="intent" value="save_announcement" />
            <input type="hidden" name="id" value={annId} />

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#5C665A] mb-1">Duyuru Metni *</label>
                <input
                  type="text"
                  name="text"
                  required
                  value={annText}
                  onChange={(e) => setAnnText(e.target.value)}
                  placeholder="Free shipping on orders over $75"
                  className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5C665A] mb-1">Ayrıcı İkon (Emoji / Simge)</label>
                <input
                  type="text"
                  name="icon"
                  value={annIcon}
                  onChange={(e) => setAnnIcon(e.target.value)}
                  placeholder="✦"
                  className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5] text-center font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5C665A] mb-1">Kayma Hızı (Saniye)</label>
                <input
                  type="text"
                  name="speed_seconds"
                  value={annSpeed}
                  onChange={(e) => setAnnSpeed(e.target.value)}
                  placeholder="36s"
                  className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C665A] mb-1">Tıklama Linki (Opsiyonel)</label>
              <input
                type="text"
                name="link_url"
                value={annLink}
                onChange={(e) => setAnnLink(e.target.value)}
                placeholder="#shop veya /product.html"
                className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" className="px-4 py-2 rounded-lg bg-[#1D2A1C] text-[#FDFBF7] text-xs font-medium">
                Kaydet
              </button>
            </div>
          </fetcher.Form>
        </div>
      )}

      {/* Marquee Preview Bar */}
      <div className="bg-[#1D2A1C] text-[#FDFBF7] p-3 rounded-xl overflow-hidden font-serif text-xs shadow-sm">
        <div className="flex items-center gap-8 whitespace-nowrap overflow-x-auto py-1">
          {items.map((it) => (
            <span key={it.id} className="flex items-center gap-2">
              <span>{it.text}</span>
              <i className="not-italic text-[#D87A4F]">{it.icon}</i>
            </span>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-[#E8E6DF] overflow-hidden shadow-2xs divide-y divide-[#F0EFEB]">
        {items.map((it) => (
          <div key={it.id} className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-[#FAF9F6] transition">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded bg-[#F4F3EE] flex items-center justify-center font-bold text-[#D87A4F]">
                {it.icon}
              </span>
              <div>
                <p className="font-semibold text-[#1D2A1C]">{it.text}</p>
                {it.link_url && <p className="text-[11px] font-mono text-[#888]">Link: {it.link_url}</p>}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-[#7A8377] bg-[#F4F3EE] px-2 py-0.5 rounded">
                Hız: {it.speed_seconds}
              </span>
              <button onClick={() => startEdit(it)} className="p-1.5 text-[#666] hover:text-[#1D2A1C]">
                <Edit2 className="w-4 h-4" />
              </button>
              <fetcher.Form method="post">
                <input type="hidden" name="intent" value="delete_announcement" />
                <input type="hidden" name="id" value={it.id} />
                <button type="submit" className="p-1.5 text-[#666] hover:text-red-600">
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
