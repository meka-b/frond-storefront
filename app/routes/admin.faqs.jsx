import React, { useState } from 'react';
import { json } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';
import db from '../../server/db/index.js';
import {
  HelpCircle,
  Plus,
  Trash2,
  Edit2
} from 'lucide-react';

export const loader = async () => {
  const faqs = db.prepare('SELECT * FROM faqs ORDER BY sort_order ASC').all();
  return json({ faqs });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'save_faq') {
    const id = formData.get('id') || `faq-${Date.now()}`;
    const category = formData.get('category') || 'General';
    const question = formData.get('question');
    const answer = formData.get('answer');
    const is_open_default = formData.get('is_open_default') === 'on' ? 1 : 0;

    db.prepare(`
      INSERT OR REPLACE INTO faqs (id, category, question, answer, is_open_default, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM faqs WHERE id != ?), 1)
    `).run(id, category, question, answer, is_open_default, id);

    return json({ success: true });
  }

  if (intent === 'delete_faq') {
    const id = formData.get('id');
    db.prepare('DELETE FROM faqs WHERE id = ?').run(id);
    return json({ success: true });
  }

  return json({ success: false });
};

export default function AdminFaqs() {
  const { faqs } = useLoaderData();
  const fetcher = useFetcher();

  const [editingFaq, setEditingFaq] = useState(null);
  const [faqId, setFaqId] = useState('');
  const [faqCat, setFaqCat] = useState('Shipping');
  const [faqQ, setFaqQ] = useState('');
  const [faqA, setFaqA] = useState('');
  const [faqOpen, setFaqOpen] = useState(false);

  const startEdit = (f) => {
    if (f) {
      setEditingFaq(f.id);
      setFaqId(f.id);
      setFaqCat(f.category);
      setFaqQ(f.question);
      setFaqA(f.answer);
      setFaqOpen(Boolean(f.is_open_default));
    } else {
      setEditingFaq('new');
      setFaqId('');
      setFaqCat('Shipping');
      setFaqQ('');
      setFaqA('');
      setFaqOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1D2A1C] font-serif">Sıkça Sorulan Sorular (FAQs)</h2>
          <p className="text-xs text-[#7A8377] mt-0.5">
            Storefront'taki "Good to know" açılır akordeon soruları ve cevapları.
          </p>
        </div>
        <button
          type="button"
          onClick={() => startEdit(null)}
          className="inline-flex items-center gap-1.5 text-xs bg-[#1D2A1C] hover:bg-[#2D3E2C] text-[#FDFBF7] px-3.5 py-2 rounded-lg font-medium shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni SSS Ekle</span>
        </button>
      </div>

      {/* Edit Form */}
      {editingFaq && (
        <div className="bg-white p-5 rounded-xl border-2 border-[#1D2A1C] shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E6DF] pb-2">
            <h3 className="text-sm font-bold text-[#1D2A1C]">
              {editingFaq === 'new' ? 'Yeni SSS Sorusu Ekle' : 'Soruyu Düzenle'}
            </h3>
            <button onClick={() => setEditingFaq(null)} className="text-xs text-[#888]">✕ Kapat</button>
          </div>

          <fetcher.Form method="post" onSubmit={() => setEditingFaq(null)} className="space-y-3">
            <input type="hidden" name="intent" value="save_faq" />
            <input type="hidden" name="id" value={faqId} />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#5C665A] mb-1">Soru *</label>
                <input
                  type="text"
                  name="question"
                  required
                  value={faqQ}
                  onChange={(e) => setFaqQ(e.target.value)}
                  placeholder="How does my plant survive shipping?"
                  className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C665A] mb-1">Kategori</label>
                <select
                  name="category"
                  value={faqCat}
                  onChange={(e) => setFaqCat(e.target.value)}
                  className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
                >
                  <option value="Shipping">Shipping (Kargo)</option>
                  <option value="Guarantee">Guarantee (Garanti)</option>
                  <option value="Products">Products (Ürünler)</option>
                  <option value="Care">Care (Bakım)</option>
                  <option value="Gifting">Gifting (Hediye)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C665A] mb-1">Cevap Metni *</label>
              <textarea
                name="answer"
                required
                rows={3}
                value={faqA}
                onChange={(e) => setFaqA(e.target.value)}
                placeholder="Each plant is potted, watered and secured in a soil-lock insert the day it ships..."
                className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
              ></textarea>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs font-medium text-[#1D2A1C] cursor-pointer">
                <input
                  type="checkbox"
                  name="is_open_default"
                  checked={faqOpen}
                  onChange={(e) => setFaqOpen(e.target.checked)}
                  className="rounded text-[#1D2A1C]"
                />
                <span>Sayfa açıldığında varsayılan olarak açık gelsin</span>
              </label>

              <button type="submit" className="px-4 py-2 rounded-lg bg-[#1D2A1C] text-[#FDFBF7] text-xs font-medium">
                Kaydet
              </button>
            </div>
          </fetcher.Form>
        </div>
      )}

      {/* FAQ List */}
      <div className="bg-white rounded-xl border border-[#E8E6DF] overflow-hidden shadow-2xs divide-y divide-[#F0EFEB]">
        {faqs.map((f) => (
          <div key={f.id} className="p-4 flex items-start justify-between gap-4 hover:bg-[#FAF9F6] transition">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase bg-[#F4F3EE] px-1.5 py-0.5 rounded text-[#5C665A]">
                  {f.category}
                </span>
                <h4 className="font-semibold text-xs text-[#1D2A1C]">{f.question}</h4>
                {f.is_open_default === 1 && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    Açık
                  </span>
                )}
              </div>
              <p className="text-xs text-[#7A8377] leading-relaxed">{f.answer}</p>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => startEdit(f)} className="p-1.5 text-[#666] hover:text-[#1D2A1C]">
                <Edit2 className="w-4 h-4" />
              </button>
              <fetcher.Form method="post">
                <input type="hidden" name="intent" value="delete_faq" />
                <input type="hidden" name="id" value={f.id} />
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
