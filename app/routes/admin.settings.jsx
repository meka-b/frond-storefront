import React, { useState } from 'react';
import { json } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';
import db from '../../server/db/index.js';
import {
  Sliders,
  Save,
  Plus,
  Trash2,
  Menu,
  ShieldCheck,
  Truck,
  Cloud,
  Key,
  CheckCircle,
  XCircle,
  Loader,
  Eye,
  EyeOff,
  Zap
} from 'lucide-react';

const AI_SERVICES = [
  { key: 'EXA_API_KEY',              label: 'Exa.ai',           desc: 'Neural & semantik web araması, rakip analizi',    color: '#6366f1' },
  { key: 'FIRECRAWL_API_KEY',        label: 'Firecrawl',        desc: 'Web scraping, SERP bilgi çıkarımı',              color: '#f59e0b' },
  { key: 'PLANTNET_API_KEY',         label: 'PlantNet',         desc: 'Görsel botanik tür doğrulama',                   color: '#22c55e' },
  { key: 'MISTRAL_API_KEY',          label: 'Mistral AI',       desc: 'LLM akıl yürütme & içerik üretimi',             color: '#ef4444' },
  { key: 'RAGFLOW_API_KEY',          label: 'RAGFlow',          desc: 'Bulut vektör arama (opsiyonel)',                  color: '#10b981' },
  { key: 'LLAMAINDEX_CLOUD_API_KEY', label: 'LlamaIndex Cloud', desc: 'Yönetilen RAG boru hattı (opsiyonel)',           color: '#8b5cf6' },
];

export const loader = async () => {
  const settingsRows = db.prepare('SELECT * FROM site_settings').all();
  const navLinks = db.prepare('SELECT * FROM navigation_links ORDER BY sort_order ASC').all();
  const savedKeys = db.prepare('SELECT service_key, label, updated_at FROM api_credentials').all();

  const settings = {};
  settingsRows.forEach(s => {
    settings[s.key] = s.value;
  });

  return json({ settings, navLinks, savedKeys });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'save_settings') {
    const store_name = formData.get('store_name');
    const free_shipping_threshold = formData.get('free_shipping_threshold');
    const currency_symbol = formData.get('currency_symbol');
    const contact_email = formData.get('contact_email');
    const guarantee_days = formData.get('guarantee_days');
    const brand_tagline = formData.get('brand_tagline');

    const upsert = db.prepare('INSERT OR REPLACE INTO site_settings (key, value, type, description, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)');
    const transaction = db.transaction(() => {
      upsert.run('store_name', store_name, 'string', 'Mağaza Adı');
      upsert.run('free_shipping_threshold', free_shipping_threshold, 'number', 'Ücretsiz Kargo Limiti (Cent)');
      upsert.run('currency_symbol', currency_symbol, 'string', 'Para Birimi');
      upsert.run('contact_email', contact_email, 'string', 'İletişim E-Posta');
      upsert.run('guarantee_days', guarantee_days, 'number', 'Garanti Gün Sayısı');
      upsert.run('brand_tagline', brand_tagline, 'string', 'Marka Sloganı');
    });
    transaction();
    return json({ success: true });
  }

  if (intent === 'save_nav') {
    const id = formData.get('id') || `nav-${Date.now()}`;
    const menu_location = formData.get('menu_location') || 'header';
    const label = formData.get('label');
    const url = formData.get('url');

    db.prepare(`
      INSERT OR REPLACE INTO navigation_links (id, menu_location, label, url, sort_order, is_active)
      VALUES (?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM navigation_links WHERE id != ?), 1)
    `).run(id, menu_location, label, url, id);

    return json({ success: true });
  }

  if (intent === 'delete_nav') {
    const id = formData.get('id');
    db.prepare('DELETE FROM navigation_links WHERE id = ?').run(id);
    return json({ success: true });
  }

  return json({ success: false });
};

export default function AdminSettings() {
  const { settings, navLinks, savedKeys } = useLoaderData();
  const fetcher = useFetcher();

  const [newNavLoc, setNewNavLoc] = useState('header');
  const [newNavLabel, setNewNavLabel] = useState('');
  const [newNavUrl, setNewNavUrl] = useState('#');

  // AI key state
  const [keyValues, setKeyValues] = useState({});
  const [showKey, setShowKey] = useState({});
  const [testStatus, setTestStatus] = useState({});

  const savedKeyMap = Object.fromEntries(savedKeys.map(r => [r.service_key, r]));

  async function handleSaveKey(serviceKey) {
    const val = keyValues[serviceKey];
    if (!val?.trim()) return;
    setTestStatus(s => ({ ...s, [serviceKey]: 'saving' }));
    try {
      const res = await fetch('/api/ai/save-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: serviceKey, value: val.trim() }),
      });
      const d = await res.json();
      setTestStatus(s => ({ ...s, [serviceKey]: d.success ? 'saved' : 'error' }));
      setTimeout(() => setTestStatus(s => ({ ...s, [serviceKey]: null })), 3000);
    } catch {
      setTestStatus(s => ({ ...s, [serviceKey]: 'error' }));
    }
  }

  async function handleTestKey(serviceKey) {
    setTestStatus(s => ({ ...s, [serviceKey]: 'testing' }));
    try {
      const res = await fetch('/api/ai/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: serviceKey }),
      });
      const d = await res.json();
      setTestStatus(s => ({ ...s, [serviceKey]: d.ok ? 'ok' : 'fail' }));
    } catch {
      setTestStatus(s => ({ ...s, [serviceKey]: 'fail' }));
    }
  }

  return (
    <div className="space-y-10">
      {/* 1. Global Store Settings */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[#1D2A1C] font-serif">Mağaza &amp; E-Ticaret Ayarları</h2>
          <p className="text-xs text-[#7A8377]">
            Ücretsiz kargo eşiği, kök garantisi süresi, iletişim bilgileri ve Cloudflare R2 durumu.
          </p>
        </div>

        <fetcher.Form method="post" className="bg-white p-6 rounded-xl border border-[#E8E6DF] space-y-4 shadow-2xs">
          <input type="hidden" name="intent" value="save_settings" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5C665A] mb-1">Mağaza Adı</label>
              <input
                type="text"
                name="store_name"
                defaultValue={settings.store_name || 'FROND'}
                className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C665A] mb-1">Ücretsiz Kargo Limiti (Cent cinsinden, örn: $75 = 7500)</label>
              <input
                type="number"
                name="free_shipping_threshold"
                defaultValue={settings.free_shipping_threshold || '7500'}
                className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C665A] mb-1">Para Birimi Simgesi</label>
              <input
                type="text"
                name="currency_symbol"
                defaultValue={settings.currency_symbol || '$'}
                className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5] font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5C665A] mb-1">Kök Garantisi Gün Sayısı</label>
              <input
                type="number"
                name="guarantee_days"
                defaultValue={settings.guarantee_days || '7'}
                className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C665A] mb-1">İletişim &amp; Destek E-Postası</label>
              <input
                type="email"
                name="contact_email"
                defaultValue={settings.contact_email || 'hello@frond-shop.demo'}
                className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5C665A] mb-1">Marka Sloganı &amp; Footer Açıklaması</label>
            <textarea
              name="brand_tagline"
              rows={2}
              defaultValue={settings.brand_tagline || 'Slow-grown plants and quietly sculptural objects, shipped from our greenhouse to your doorstep — roots happy, floors clean.'}
              className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5]"
            ></textarea>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#1D2A1C] text-[#FDFBF7] text-xs font-medium">
              Ayarları Kaydet
            </button>
          </div>
        </fetcher.Form>
      </div>

      {/* 2. Navigation Links Manager */}
      <div className="pt-6 border-t border-[#E8E6DF]">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[#1D2A1C] font-serif">Menü &amp; Navigasyon Bağlantıları</h2>
          <p className="text-xs text-[#7A8377]">
            Header, mobil menü ve footer bölümlerindeki linklerin yönetimi.
          </p>
        </div>

        {/* Add Link Form */}
        <fetcher.Form method="post" className="bg-white p-4 rounded-xl border border-[#E8E6DF] mb-4 flex flex-col sm:flex-row gap-3 items-end shadow-2xs">
          <input type="hidden" name="intent" value="save_nav" />

          <div className="w-full sm:w-48">
            <label className="block text-[11px] font-semibold text-[#5C665A] mb-1">Menü Konumu</label>
            <select
              name="menu_location"
              value={newNavLoc}
              onChange={(e) => setNewNavLoc(e.target.value)}
              className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
            >
              <option value="header">Header (Üst Menü)</option>
              <option value="footer_shop">Footer — Shop</option>
              <option value="footer_help">Footer — Help</option>
              <option value="footer_social">Footer — Social</option>
              <option value="menu_drawer">Mobile Menu Drawer</option>
            </select>
          </div>

          <div className="flex-1 w-full">
            <label className="block text-[11px] font-semibold text-[#5C665A] mb-1">Etiket (Label) *</label>
            <input
              type="text"
              name="label"
              required
              value={newNavLabel}
              onChange={(e) => setNewNavLabel(e.target.value)}
              placeholder="Örn: Bestsellers"
              className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
            />
          </div>

          <div className="flex-1 w-full">
            <label className="block text-[11px] font-semibold text-[#5C665A] mb-1">Hedef URL *</label>
            <input
              type="text"
              name="url"
              required
              value={newNavUrl}
              onChange={(e) => setNewNavUrl(e.target.value)}
              placeholder="#shop veya /product.html"
              className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 bg-[#1D2A1C] text-[#FDFBF7] rounded-lg text-xs font-medium whitespace-nowrap"
          >
            Bağlantı Ekle
          </button>
        </fetcher.Form>

        {/* Links Table */}
        <div className="bg-white rounded-xl border border-[#E8E6DF] overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F6] border-b border-[#E8E6DF] text-[#7A8377] font-mono text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4">Konum</th>
                <th className="py-3 px-3">Etiket</th>
                <th className="py-3 px-3">URL</th>
                <th className="py-3 px-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EFEB]">
              {navLinks.map((nav) => (
                <tr key={nav.id} className="hover:bg-[#FAF9F6]">
                  <td className="py-2.5 px-4 font-mono text-[11px] text-[#5C665A]">
                    <span className="bg-[#F4F3EE] px-2 py-0.5 rounded">
                      {nav.menu_location}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-[#1D2A1C]">{nav.label}</td>
                  <td className="py-2.5 px-3 font-mono text-[#888]">{nav.url}</td>
                  <td className="py-2.5 px-3 text-right">
                    <fetcher.Form method="post" className="inline-block">
                      <input type="hidden" name="intent" value="delete_nav" />
                      <input type="hidden" name="id" value={nav.id} />
                      <button type="submit" className="p-1 text-[#888] hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </fetcher.Form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. AI Services & API Keys */}
      <div className="pt-6 border-t border-[#E8E6DF]">
        <div className="mb-5 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1D2A1C] font-serif">AI Servisleri &amp; API Anahtarları</h2>
            <p className="text-xs text-[#7A8377] mt-0.5">
              Ürün içeriği zenginleştirme pipeline'ı için gerekli servis anahtarları. Değerler şifreli olarak saklanır.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {AI_SERVICES.map(svc => {
            const saved = savedKeyMap[svc.key];
            const status = testStatus[svc.key];
            return (
              <div key={svc.key} className="bg-white rounded-xl border border-[#E8E6DF] p-4 shadow-2xs">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: svc.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#1D2A1C]">{svc.label}</span>
                      {saved && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-[#DCFCE7] text-[#166534] rounded font-mono">
                          ✓ Kayıtlı
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#7A8377] mt-0.5">{svc.desc}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Key className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#9CA3AF]" />
                    <input
                      type={showKey[svc.key] ? 'text' : 'password'}
                      placeholder={saved ? '••••••••••••••••••••• (kayıtlı)' : 'API anahtarını girin…'}
                      value={keyValues[svc.key] || ''}
                      onChange={e => setKeyValues(v => ({ ...v, [svc.key]: e.target.value }))}
                      className="w-full pl-7 pr-8 py-2 text-xs border border-[#E0DED7] rounded-lg bg-[#FAF9F5] font-mono focus:outline-none focus:border-[#1D2A1C]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(v => ({ ...v, [svc.key]: !v[svc.key] }))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#1D2A1C]"
                    >
                      {showKey[svc.key] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveKey(svc.key)}
                    disabled={!keyValues[svc.key]?.trim() || status === 'saving'}
                    className="px-3 py-2 bg-[#1D2A1C] text-white text-xs rounded-lg font-medium disabled:opacity-40 whitespace-nowrap"
                  >
                    {status === 'saving' ? <Loader className="w-3 h-3 animate-spin" /> : status === 'saved' ? '✓ Kaydedildi' : 'Kaydet'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTestKey(svc.key)}
                    disabled={!saved || status === 'testing'}
                    className="px-3 py-2 border border-[#E0DED7] text-xs rounded-lg font-medium text-[#5C665A] hover:border-[#1D2A1C] disabled:opacity-40 whitespace-nowrap flex items-center gap-1.5"
                  >
                    {status === 'testing' ? (
                      <><Loader className="w-3 h-3 animate-spin" /> Test…</>
                    ) : status === 'ok' ? (
                      <><CheckCircle className="w-3 h-3 text-green-600" /> Başarılı</>
                    ) : status === 'fail' ? (
                      <><XCircle className="w-3 h-3 text-red-500" /> Hata</>
                    ) : (
                      'Bağlantı Testi'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-[#9CA3AF] mt-3 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          Anahtarlar XOR+Base64 ile şifrelenerek veritabanında saklanır. Production ortamı için .env değişkenleri önerilir.
        </p>
      </div>
    </div>
  );
}
