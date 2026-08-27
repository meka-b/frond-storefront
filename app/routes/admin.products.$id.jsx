import React, { useState } from 'react';
import { json, redirect } from '@remix-run/node';
import { useLoaderData, useNavigate, Form } from '@remix-run/react';
import db from '../../server/db/index.js';
import R2Uploader from '../components/R2Uploader.jsx';
import ProductMultiPicker from '../components/ProductMultiPicker.jsx';
import TiptapEditor from '../components/TiptapEditor.jsx';
import { AIProductToolbar } from '../components/ProseKitEditor.jsx';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Check,
  ExternalLink,
  Globe,
  Code
} from 'lucide-react';

export const loader = async ({ params }) => {
  const { id } = params;
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!product) {
    throw new Response('Product Not Found', { status: 404 });
  }

  const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order ASC').all(id);
  const images = db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC').all(id);
  const allProducts = db.prepare(`
    SELECT p.id, p.title, p.sku,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
    FROM products p
    WHERE p.id != ?
    ORDER BY p.title ASC
  `).all(id);
  const recos = db.prepare('SELECT recommended_product_id FROM product_recommendations WHERE source_product_id = ?').all(id).map(r => r.recommended_product_id);

  let chips = [];
  try { chips = JSON.parse(product.chips || '[]'); } catch { chips = []; }

  return json({
    product: { ...product, chips },
    variants,
    images: images.map(img => ({ id: img.id, url: img.url, alt_text: img.alt_text || '' })),
    allProducts,
    recos
  });
};

export const action = async ({ request, params }) => {
  const { id } = params;
  const existingProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existingProduct) {
    throw new Response('Product Not Found', { status: 404 });
  }

  const formData = await request.formData();
  const title = formData.get('title') || existingProduct.title;
  const subtitle = formData.get('subtitle') !== null ? formData.get('subtitle') : (existingProduct.subtitle || '');
  const description = formData.get('description') !== null ? formData.get('description') : (existingProduct.description || '');
  const badge = formData.get('badge') !== null ? formData.get('badge') : (existingProduct.badge || '');
  const badge_class = formData.get('badge_class') !== null ? formData.get('badge_class') : (existingProduct.badge_class || '');
  const sku = formData.get('sku') || existingProduct.sku || '';
  const option_name = formData.get('option_name') || existingProduct.option_name || 'Pot';
  const option_style = formData.get('option_style') || existingProduct.option_style || 'swatch';
  const tags = formData.get('tags') !== null ? formData.get('tags') : (existingProduct.tags || '');
  const chipsRaw = formData.get('chips') !== null ? formData.get('chips') : '';
  const light_care = formData.get('light_care') !== null ? formData.get('light_care') : (existingProduct.light_care || '');
  const water_care = formData.get('water_care') !== null ? formData.get('water_care') : (existingProduct.water_care || '');
  const pet_care = formData.get('pet_care') !== null ? formData.get('pet_care') : (existingProduct.pet_care || '');
  const video_url = formData.get('video_url') || existingProduct.video_url || null;
  const is_bestseller = formData.has('is_bestseller') ? (formData.get('is_bestseller') === 'on' ? 1 : 0) : existingProduct.is_bestseller;
  const is_published = formData.has('is_published') ? (formData.get('is_published') === 'on' ? 1 : 0) : existingProduct.is_published;
  const is_ugc = formData.has('is_ugc') ? (formData.get('is_ugc') === 'on' ? 1 : 0) : existingProduct.is_ugc;

  const variantsJson = formData.get('variants_data') || '[]';
  const imagesJson = formData.get('images_data') || '[]';
  const recosJson = formData.get('recos_data') || '[]';

  const variants = JSON.parse(variantsJson);
  const images = JSON.parse(imagesJson);
  const recos = JSON.parse(recosJson);

  const priceRaw = formData.get('price') || '';
  const compareAtPriceRaw = formData.get('compare_at_price') || '';
  const hasVariants = formData.has('has_variants') ? (formData.get('has_variants') === 'on') : (variants.length > 1);

  const chips = chipsRaw ? chipsRaw.split(',').map(c => c.trim()).filter(Boolean) : (existingProduct.chips ? JSON.parse(existingProduct.chips) : []);

  const updateProduct = db.prepare(`
    UPDATE products SET
      title = ?, subtitle = ?, description = ?, badge = ?, badge_class = ?,
      sku = ?, option_name = ?, option_style = ?, tags = ?, chips = ?,
      light_care = ?, water_care = ?, pet_care = ?, video_url = ?,
      is_ugc = ?, is_bestseller = ?, is_published = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  const deleteVariants = db.prepare('DELETE FROM product_variants WHERE product_id = ?');
  const insertVariant = db.prepare(`
    INSERT INTO product_variants (id, product_id, label, hex_color, price, compare_at_price, sku, inventory_qty, is_available, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const deleteImages = db.prepare('DELETE FROM product_images WHERE product_id = ?');
  const insertImage = db.prepare(`
    INSERT INTO product_images (id, product_id, url, alt_text, is_primary, is_hover, is_gallery, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const deleteRecos = db.prepare('DELETE FROM product_recommendations WHERE source_product_id = ?');
  const insertReco = db.prepare(`
    INSERT OR IGNORE INTO product_recommendations (id, source_product_id, recommended_product_id, relation_type, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `);

  const updateMediaFileAlt = db.prepare(`
    UPDATE media_files SET alt_text = ? WHERE url = ? AND (alt_text IS NULL OR alt_text = '')
  `);

  const transaction = db.transaction(() => {
    updateProduct.run(
      title, subtitle, description, badge, badge_class,
      sku, hasVariants ? option_name : 'Pot', option_style, tags, JSON.stringify(chips),
      light_care, water_care, pet_care, video_url,
      is_ugc, is_bestseller, is_published, id
    );

    deleteVariants.run(id);
    if (hasVariants && variants.length > 0) {
      variants.forEach((v, i) => {
        const vid = v.id || `${id}-${v.label.toLowerCase().replace(/[^a-z0-9]/g, '')}-${i + 1}`;
        insertVariant.run(
          vid, id, v.label, v.hex_color || '#D8D2C4',
          Math.round(parseFloat(v.price || 0) * 100),
          v.compare_at_price ? Math.round(parseFloat(v.compare_at_price) * 100) : null,
          v.sku || `${sku}-${i + 1}`,
          parseInt(v.inventory_qty || 0),
          v.is_available ? 1 : 0,
          i + 1
        );
      });
    } else {
      const basePriceCents = priceRaw ? Math.round(parseFloat(priceRaw) * 100) : (variants[0]?.price ? Math.round(parseFloat(variants[0].price) * 100) : 4800);
      const baseCompareCents = compareAtPriceRaw ? Math.round(parseFloat(compareAtPriceRaw) * 100) : (variants[0]?.compare_at_price ? Math.round(parseFloat(variants[0].compare_at_price) * 100) : null);
      insertVariant.run(`${id}-standard`, id, 'Standard', '#D8D2C4', basePriceCents, baseCompareCents, `${sku}-01`, 50, 1, 1);
    }

    if (images.length > 0) {
      deleteImages.run(id);
      images.forEach((item, i) => {
        const imgUrl = typeof item === 'string' ? item : (item.url || '');
        const alt = (typeof item === 'object' && item.alt_text) ? item.alt_text : `${title} - Görsel ${i + 1}`;
        if (!imgUrl) return;

        insertImage.run(
          `${id}-img-${Date.now()}-${i + 1}`, id, imgUrl, alt,
          i === 0 ? 1 : 0, i === 1 ? 1 : 0, 1, i + 1
        );

        // Sync media_files library
        try {
          updateMediaFileAlt.run(alt, imgUrl);
        } catch (_) {}
      });
    }

    deleteRecos.run(id);
    recos.forEach((recId, i) => {
      insertReco.run(`rec-${id}-${recId}`, id, recId, 'complete_look', i + 1);
    });
  });

  transaction();
  return redirect('/admin/products');
};

export default function EditProduct() {
  const loaderData = useLoaderData() || {};
  const product = loaderData.product || { title: 'Ürün Düzenle', subtitle: '', description: '', chips: [] };
  const initialVariants = loaderData.variants || [];
  const initialImages = loaderData.images || [];
  const allProducts = loaderData.allProducts || [];
  const initialRecos = loaderData.recos || [];
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');

  // Form field state for AI binding
  const [title, setTitle] = useState(product.title || '');
  const [price, setPrice] = useState(initialVariants[0] ? (initialVariants[0].price / 100).toFixed(2) : '48.00');
  const [compareAtPrice, setCompareAtPrice] = useState(initialVariants[0]?.compare_at_price ? (initialVariants[0].compare_at_price / 100).toFixed(2) : '');
  const [hasVariants, setHasVariants] = useState(
    initialVariants.length > 1 || (initialVariants.length === 1 && initialVariants[0].label && !['standard', 'default', 'varsayılan'].includes(initialVariants[0].label.toLowerCase()))
  );
  const [subtitle, setSubtitle] = useState(product.subtitle || '');
  const [description, setDescription] = useState(product.description || '');
  const [badge, setBadge] = useState(product.badge || '');
  const [badgeClass, setBadgeClass] = useState(product.badge_class || '');
  const [sku, setSku] = useState(product.sku || '');
  const [tags, setTags] = useState(product.tags || '');
  const [chips, setChips] = useState((product.chips || []).join(', '));
  const [isPublished, setIsPublished] = useState(Boolean(product.is_published));
  const [isBestseller, setIsBestseller] = useState(Boolean(product.is_bestseller));
  const [isUgc, setIsUgc] = useState(Boolean(product.is_ugc));
  const [lightCare, setLightCare] = useState(product.light_care || 'Bright, indirect light — tolerates medium light');

  const [waterCare, setWaterCare] = useState(product.water_care || 'Every 10–14 days; let the top soil dry');
  const [petCare, setPetCare] = useState(product.pet_care || 'Pet friendly');

  // SEO state
  const [seoTitle, setSeoTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [jsonLd, setJsonLd] = useState('');

  // AI Pipeline state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [auditData, setAuditData] = useState(null);

  const [images, setImages] = useState(initialImages);
  const [variants, setVariants] = useState(
    initialVariants.map(v => ({
      id: v.id,
      label: v.label,
      hex_color: v.hex_color,
      price: (v.price / 100).toFixed(2),
      compare_at_price: v.compare_at_price ? (v.compare_at_price / 100).toFixed(2) : '',
      inventory_qty: v.inventory_qty,
      is_available: Boolean(v.is_available)
    }))
  );
  const [selectedRecos, setSelectedRecos] = useState(initialRecos);

  // AI Action Handler with SSE Streaming
  const handleAIAction = async (actionType) => {
    if (!title.trim()) {
      alert('Lütfen önce bir "Ürün Başlığı" girin.');
      return;
    }

    setIsGenerating(true);
    setProgressStage('Bağlantı kuruluyor...');
    setProgressPct(5);
    setAuditData(null);

    try {
      const response = await fetch('/api/ai/enrich-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), action: actionType }),
      });

      if (!response.ok) {
        throw new Error(`Sunucu hatası: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          if (!part.trim()) continue;
          const lines = part.split('\n');
          let eventType = 'message';
          let dataStr = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) eventType = line.slice(7).trim();
            if (line.startsWith('data: ')) dataStr = line.slice(6).trim();
          }

          if (!dataStr) continue;
          try {
            const data = JSON.parse(dataStr);
            if (eventType === 'progress') {
              setProgressStage(data.stage);
              setProgressPct(data.pct);
            } else if (eventType === 'complete' && data.payload) {
              applyAIPayload(data.payload);
            } else if (eventType === 'error') {
              alert(`AI Hatası: ${data.message}`);
            }
          } catch (e) {
            // Ignore parse error on partial chunks
          }
        }
      }
    } catch (err) {
      alert(`Pipeline hatası: ${err.message}`);
    } finally {
      setIsGenerating(false);
      setProgressStage('');
      setProgressPct(0);
    }
  };

  const applyAIPayload = (payload) => {
    if (!payload) return;

    // 1. General
    if (payload.general) {
      if (payload.general.title) setTitle(payload.general.title);
      if (payload.general.shortDescription) setSubtitle(payload.general.shortDescription);
      if (payload.general.detailedDescriptionHtml) setDescription(payload.general.detailedDescriptionHtml);
      if (payload.general.badge) setBadge(payload.general.badge);
      if (payload.general.badgeStyle) {
        const styleMap = { 'moss-green': 'new', 'terracotta': 'sale', 'amber': 'new' };
        setBadgeClass(styleMap[payload.general.badgeStyle] || '');
      }
      if (payload.general.sku) setSku(payload.general.sku);
      if (payload.general.searchTags) setTags(payload.general.searchTags);
      if (payload.general.filterChips) setChips(payload.general.filterChips);
      if (typeof payload.general.publishStorefront === 'boolean') setIsPublished(payload.general.publishStorefront);
      if (typeof payload.general.isBestseller === 'boolean') setIsBestseller(payload.general.isBestseller);
      if (typeof payload.general.isUgcCommunity === 'boolean') setIsUgc(payload.general.isUgcCommunity);
    }

    // 2. Care Guide
    if (payload.careGuide) {
      if (payload.careGuide.light) setLightCare(payload.careGuide.light);
      if (payload.careGuide.water) setWaterCare(payload.careGuide.water);
      if (payload.careGuide.petFriendly) setPetCare(payload.careGuide.petFriendly);
    }

    // 3. Variants Suggestion
    if (Array.isArray(payload.variantsSuggestion) && payload.variantsSuggestion.length > 0) {
      setVariants(payload.variantsSuggestion.map((v, i) => ({
        id: variants[i]?.id || `${product.id}-${i + 1}`,
        label: v.name || 'Standart',
        hex_color: v.hexColor || '#D8D2C4',
        price: v.price ? (v.price / 100).toFixed(2) : '48.00',
        compare_at_price: v.compareAtPrice ? (v.compareAtPrice / 100).toFixed(2) : '',
        inventory_qty: v.stock || 50,
        is_available: true
      })));
    }

    // 4. Media Alt Texts
    if (Array.isArray(payload.mediaAltTexts) && payload.mediaAltTexts.length > 0) {
      setImages((prevImages) => {
        return prevImages.map((img, idx) => {
          const aiAlt = payload.mediaAltTexts[idx] || `${payload.general?.title || title} - Görsel ${idx + 1}`;
          if (typeof img === 'string') {
            return { url: img, alt_text: aiAlt };
          }
          return { ...img, alt_text: img.alt_text || aiAlt };
        });
      });
    }

    // 5. SEO & Structured Data
    if (payload.seoAndStructuredData) {
      if (payload.seoAndStructuredData.seoTitle) setSeoTitle(payload.seoAndStructuredData.seoTitle);
      if (payload.seoAndStructuredData.metaDescription) setMetaDescription(payload.seoAndStructuredData.metaDescription);
      if (payload.seoAndStructuredData.jsonLdSchema) {
        setJsonLd(JSON.stringify(payload.seoAndStructuredData.jsonLdSchema, null, 2));
      }
    }

    // 6. Audit
    if (payload.audit) {
      setAuditData(payload.audit);
    }
  };

  const addVariant = () => {
    setVariants([...variants, { label: 'New Option', hex_color: '#D8D2C4', price: '48.00', compare_at_price: '', inventory_qty: 50, is_available: true }]);
  };

  const removeVariant = (idx) => {
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const updateVariant = (idx, field, value) => {
    const next = [...variants];
    next[idx][field] = value;
    setVariants(next);
  };

  const addImage = (url) => {
    if (!url) return;
    const exists = images.some(img => (typeof img === 'string' ? img === url : img.url === url));
    if (!exists) {
      const defaultAlt = title ? `${title} - Görsel ${images.length + 1}` : '';
      setImages([...images, { url, alt_text: defaultAlt }]);
    }
  };

  const updateImageAlt = (idx, alt_text) => {
    const next = [...images];
    if (typeof next[idx] === 'string') {
      next[idx] = { url: next[idx], alt_text };
    } else {
      next[idx] = { ...next[idx], alt_text };
    }
    setImages(next);
  };

  const removeImage = (idx) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/products')}
            className="p-1.5 rounded-lg border border-[#E8E6DF] bg-white hover:bg-[#F4F3EE] text-[#5C665A] transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#1D2A1C] font-serif">{title}</h2>
              <span className="text-xs font-mono text-[#7A8377] bg-[#F4F3EE] px-2 py-0.5 rounded">
                ID: {product.id}
              </span>
            </div>
            <p className="text-xs text-[#7A8377]">Ürün bilgilerini, Cloudflare R2 görsellerini ve varyant fiyatlarını düzenleyin.</p>
          </div>
        </div>

        <a
          href={`/product.html?handle=${product.id}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-[#5C665A] hover:text-[#1D2A1C] bg-[#F4F3EE] px-3 py-1.5 rounded-md border border-[#DDDCD5] transition font-medium"
        >
          <span>Storefront'ta Gör</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* AI Intelligence Action Toolbar */}
      <AIProductToolbar
        onAction={handleAIAction}
        isGenerating={isGenerating}
        progressStage={progressStage}
        progressPct={progressPct}
        auditData={auditData}
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8E6DF] text-xs font-medium">
        {[
          { id: 'general', label: 'Genel Bilgiler' },
          { id: 'variants', label: `Varyantlar & Fiyat (${variants.length})` },
          { id: 'media', label: `Görseller & R2 (${images.length})` },
          { id: 'care', label: 'Bakım Rehberi' },
          { id: 'recos', label: `Complete the Look (${selectedRecos.length})` },
          { id: 'seo', label: 'SEO & JSON-LD' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`pb-3 px-3 border-b-2 transition ${
              activeTab === t.id
                ? 'border-[#1D2A1C] text-[#1D2A1C] font-semibold'
                : 'border-transparent text-[#7A8377] hover:text-[#1D2A1C]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Form method="post" className="space-y-6">
        <input type="hidden" name="variants_data" value={JSON.stringify(variants)} />
        <input type="hidden" name="images_data" value={JSON.stringify(images)} />
        <input type="hidden" name="recos_data" value={JSON.stringify(selectedRecos)} />

        {/* Tab 1: General Info */}
        <div className={activeTab === 'general' ? 'block' : 'hidden'}>
          <div className="bg-white p-6 rounded-xl border border-[#E8E6DF] space-y-4 shadow-2xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#5C665A] mb-1">Ürün Başlığı *</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5] focus:bg-white focus:outline-none focus:border-[#1D2A1C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C665A] mb-1">SKU Kodu</label>
                <input
                  type="text"
                  name="sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5] font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#5C665A] mb-1">Normal Fiyat ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Örn: 48.00"
                  className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5] font-semibold text-[#1D2A1C] focus:bg-white focus:outline-none focus:border-[#1D2A1C]"
                />
                <p className="text-[10px] text-[#7A8377] mt-1">Ürünün ana satış fiyatı (varyant yoksa geçerlidir).</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C665A] mb-1">İndirim Öncesi Fiyat ($) (Opsiyonel)</label>
                <input
                  type="number"
                  step="0.01"
                  name="compare_at_price"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                  placeholder="Örn: 60.00"
                  className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5] text-[#888] focus:bg-white focus:outline-none focus:border-[#1D2A1C]"
                />
                <p className="text-[10px] text-[#7A8377] mt-1">Girilirse vitrinde üzeri çizili eski fiyat ve indirim yüzdesi görünür.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C665A] mb-1">Kısa Tanıtım / Alt Başlık</label>
              <input
                type="text"
                name="subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5] focus:bg-white focus:outline-none focus:border-[#1D2A1C]"
              />
            </div>

            <div>
              <TiptapEditor
                name="description"
                value={description}
                onChange={setDescription}
                label="Detaylı Açıklama (PDP)"
                description="Zengin metin & biçimlendirme (Tiptap Simple Editor)"
                placeholder="Bitkinin karakteri, boyutu, teslimat ve bakım detayları..."
                minHeight="min-h-[220px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#5C665A] mb-1">Rozet (Badge)</label>
                <input
                  type="text"
                  name="badge"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="Örn: Bestseller, New, -25%"
                  className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C665A] mb-1">Rozet Stili</label>
                <select
                  name="badge_class"
                  value={badgeClass}
                  onChange={(e) => setBadgeClass(e.target.value)}
                  className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5]"
                >
                  <option value="">Varsayılan (Kahverengi)</option>
                  <option value="new">Yeni (Yeşil)</option>
                  <option value="sale">İndirim (Terracotta)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#5C665A] mb-1">Arama Etiketleri (Boşlukla ayrılmış)</label>
                <input
                  type="text"
                  name="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="indoor large easy care statement"
                  className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C665A] mb-1">Filtre Hapları (Chips, virgülle)</label>
                <input
                  type="text"
                  name="chips"
                  value={chips}
                  onChange={(e) => setChips(e.target.value)}
                  placeholder="Statement, Easy Care, Rare"
                  className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5]"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-3 border-t border-[#E8E6DF]">
              <label className="flex items-center gap-2 text-xs font-medium text-[#1D2A1C] cursor-pointer">
                <input 
                  type="checkbox" 
                  name="is_published" 
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded text-[#1D2A1C]" 
                />
                <span>Storefront'ta Yayınla</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-[#1D2A1C] cursor-pointer">
                <input 
                  type="checkbox" 
                  name="is_bestseller" 
                  checked={isBestseller}
                  onChange={(e) => setIsBestseller(e.target.checked)}
                  className="rounded text-[#1D2A1C]" 
                />
                <span>Çok Satanlar (Bestseller) Bölümüne Ekle</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-[#1D2A1C] cursor-pointer">
                <input 
                  type="checkbox" 
                  name="is_ugc" 
                  checked={isUgc}
                  onChange={(e) => setIsUgc(e.target.checked)}
                  className="rounded text-[#1D2A1C]" 
                />
                <span>Topluluk (UGC) Bitkisi</span>
              </label>
            </div>
          </div>
        </div>

        {/* Tab 2: Variants & Pricing */}
        <div className={activeTab === 'variants' ? 'block' : 'hidden'}>
          <div className="bg-white p-6 rounded-xl border border-[#E8E6DF] space-y-5 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E6DF]">
              <div>
                <h3 className="text-sm font-semibold text-[#1D2A1C]">Varyantlı Ürün Yönetimi</h3>
                <p className="text-xs text-[#7A8377]">Ürününüzün saksı, renk veya boyut gibi varyantları varsa aktif edin.</p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="has_variants"
                  checked={hasVariants}
                  onChange={(e) => {
                    setHasVariants(e.target.checked);
                    if (e.target.checked && variants.length === 0) {
                      setVariants([
                        { label: 'Nursery', hex_color: '#D8D2C4', price: price || '48.00', compare_at_price: compareAtPrice || '', inventory_qty: 50, is_available: true },
                        { label: 'Terracotta', hex_color: '#B96A45', price: price ? (parseFloat(price) + 8).toFixed(2) : '56.00', compare_at_price: '', inventory_qty: 35, is_available: true },
                      ]);
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#E0DED7] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#DDD] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1D2A1C]"></div>
                <span className="ml-3 text-xs font-semibold text-[#1D2A1C]">
                  {hasVariants ? 'Varyantlar Açık' : 'Varyantsız (Tek Ürün)'}
                </span>
              </label>
            </div>

            {!hasVariants ? (
              <div className="p-6 text-center rounded-xl bg-[#FAF9F5] border border-dashed border-[#D8D2C4] space-y-2">
                <p className="text-xs font-medium text-[#1D2A1C]">Bu ürün varyantsız (standart) olarak kaydedilecek.</p>
                <p className="text-[11px] text-[#7A8377]">
                  Fiyatlandırma olarak <b>Genel Bilgiler</b> sekmesindeki <b>${price || '48.00'}</b> kullanılacaktır. Vitrinde seçenek seçim butonu gösterilmeyecektir.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setHasVariants(true);
                    if (variants.length === 0) {
                      setVariants([
                        { label: 'Nursery', hex_color: '#D8D2C4', price: price || '48.00', compare_at_price: compareAtPrice || '', inventory_qty: 50, is_available: true },
                        { label: 'Terracotta', hex_color: '#B96A45', price: price ? (parseFloat(price) + 8).toFixed(2) : '56.00', compare_at_price: '', inventory_qty: 35, is_available: true },
                      ]);
                    }
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E8E6DF] text-xs font-semibold text-[#1D2A1C] hover:bg-[#F4F3EE] shadow-2xs transition"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D87A4F]" />
                  <span>Varyant Ekle</span>
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-[#E8E6DF]">
                  <div>
                    <label className="block text-xs font-semibold text-[#5C665A] mb-1">Seçenek Adı</label>
                    <input
                      type="text"
                      name="option_name"
                      defaultValue={product.option_name || 'Pot'}
                      className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5C665A] mb-1">Seçenek Görünüm Stili</label>
                    <select
                      name="option_style"
                      defaultValue={product.option_style || 'swatch'}
                      className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5]"
                    >
                      <option value="swatch">Renk Paleti (Hex Swatches)</option>
                      <option value="pill">Hap Butonlar (Pill Text)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#1D2A1C] uppercase font-mono tracking-wider">Varyant Kalemleri</h4>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="inline-flex items-center gap-1 text-xs text-[#D87A4F] hover:underline font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Varyant Ekle</span>
                    </button>
                  </div>

                  {variants.map((v, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2.5 p-3 rounded-lg bg-[#FAF9F5] border border-[#E8E6DF] items-center text-xs">
                      <div className="col-span-3">
                        <label className="block text-[10px] text-[#7A8377] font-mono">Etiket</label>
                        <input
                          type="text"
                          value={v.label}
                          onChange={(e) => updateVariant(idx, 'label', e.target.value)}
                          className="w-full bg-white border border-[#DDD] rounded p-1.5 text-xs font-medium"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] text-[#7A8377] font-mono">Hex Renk</label>
                        <div className="flex items-center gap-1.5 bg-white border border-[#DDD] rounded p-1">
                          <input
                            type="color"
                            value={v.hex_color || '#D8D2C4'}
                            onChange={(e) => updateVariant(idx, 'hex_color', e.target.value)}
                            className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                          />
                          <span className="text-[11px] font-mono">{v.hex_color}</span>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] text-[#7A8377] font-mono">Fiyat ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={v.price}
                          onChange={(e) => updateVariant(idx, 'price', e.target.value)}
                          className="w-full bg-white border border-[#DDD] rounded p-1.5 text-xs font-semibold"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] text-[#7A8377] font-mono">İndirim Öncesi ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={v.compare_at_price}
                          onChange={(e) => updateVariant(idx, 'compare_at_price', e.target.value)}
                          className="w-full bg-white border border-[#DDD] rounded p-1.5 text-xs text-[#888]"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] text-[#7A8377] font-mono">Stok Adedi</label>
                        <input
                          type="number"
                          value={v.inventory_qty}
                          onChange={(e) => updateVariant(idx, 'inventory_qty', e.target.value)}
                          className="w-full bg-white border border-[#DDD] rounded p-1.5 text-xs font-mono"
                        />
                      </div>

                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeVariant(idx)}
                          disabled={variants.length === 1}
                          className="text-[#999] hover:text-red-600 p-1 disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tab 3: Media & Cloudflare R2 */}
        <div className={activeTab === 'media' ? 'block' : 'hidden'}>
          <div className="bg-white p-6 rounded-xl border border-[#E8E6DF] space-y-6 shadow-2xs">
            <div>
              <h3 className="text-sm font-semibold text-[#1D2A1C] mb-1">Ürün Görselleri (Cloudflare R2)</h3>
              <p className="text-xs text-[#7A8377] mb-4">
                İlk görsel vitrin kartında görünür, ikinci görsel hover durumunda aktif olur.
              </p>

              <R2Uploader
                label="Yeni Görsel Yükle (Cloudflare R2)"
                onUploadComplete={addImage}
              />
            </div>

            {images.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#1D2A1C] uppercase font-mono">Yüklü Galeri ({images.length})</h4>
                  <span className="text-[11px] text-[#7A8377]">Yapay Zeka otomatik SEO alt metinleri üretir.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {images.map((item, idx) => {
                    const imgUrl = typeof item === 'string' ? item : item.url;
                    const altText = typeof item === 'object' ? (item.alt_text || '') : '';

                    return (
                      <div key={idx} className="bg-[#FAF9F5] rounded-xl border border-[#E8E6DF] p-2.5 space-y-2 relative group">
                        <div className="aspect-video bg-[#F4F3EE] rounded-lg overflow-hidden relative flex items-center justify-center">
                          <img src={imgUrl} alt={altText || `View ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                            {idx === 0 ? 'Ana Görsel' : idx === 1 ? 'Hover' : `Sıra ${idx + 1}`}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#5C665A] uppercase font-mono mb-0.5">
                            SEO Alt-Text:
                          </label>
                          <input
                            type="text"
                            value={altText}
                            onChange={(e) => updateImageAlt(idx, e.target.value)}
                            placeholder={`${title || 'Ürün'} görünüm ${idx + 1}`}
                            className="w-full text-[11px] bg-white border border-[#E0DED7] rounded p-1.5 text-[#1D2A1C] focus:outline-none focus:border-[#1D2A1C]"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-[#E8E6DF]">
              <label className="block text-xs font-semibold text-[#5C665A] mb-1">Ürün Video URL (Opsiyonel MP4 / Cloudflare Stream)</label>
              <input
                type="text"
                name="video_url"
                defaultValue={product.video_url || ''}
                placeholder="https://.../video.mp4"
                className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5] font-mono"
              />
            </div>
          </div>
        </div>

        {/* Tab 4: Care Guide */}
        <div className={activeTab === 'care' ? 'block' : 'hidden'}>
          <div className="bg-white p-6 rounded-xl border border-[#E8E6DF] space-y-4 shadow-2xs">
            <h3 className="text-sm font-semibold text-[#1D2A1C]">Bakım Rehberi (Care Guide)</h3>
            <p className="text-xs text-[#7A8377]">Storefront'ta açılır akordeonda gösterilen bitki bakım gereksinimleri.</p>

            <div>
              <label className="block text-xs font-semibold text-[#5C665A] mb-1">Işık İhtiyacı (Light)</label>
              <input
                type="text"
                name="light_care"
                value={lightCare}
                onChange={(e) => setLightCare(e.target.value)}
                placeholder="Bright, indirect light — tolerates medium light"
                className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C665A] mb-1">Sulama Düzeni (Water)</label>
              <input
                type="text"
                name="water_care"
                value={waterCare}
                onChange={(e) => setWaterCare(e.target.value)}
                placeholder="Every 10–14 days; let the top soil dry"
                className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C665A] mb-1">Evcil Hayvan Uyumu (Pet)</label>
              <input
                type="text"
                name="pet_care"
                value={petCare}
                onChange={(e) => setPetCare(e.target.value)}
                placeholder="Pet friendly"
                className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5]"
              />
            </div>
          </div>
        </div>

        {/* Tab 5: Complete the Look */}
        <div className={activeTab === 'recos' ? 'block' : 'hidden'}>
          <ProductMultiPicker
            label="Görünümü Tamamla (Complete the Look)"
            description="Bu bitkinin detay sayfasında çapraz satış / kombin olarak önerilecek saksı veya diğer bitkileri seçin."
            products={allProducts}
            selectedIds={selectedRecos}
            onChange={setSelectedRecos}
          />
        </div>

        {/* Tab 6: SEO & JSON-LD */}
        <div className={activeTab === 'seo' ? 'block' : 'hidden'}>
          <div className="bg-white p-6 rounded-xl border border-[#E8E6DF] space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-[#1D2A1C]" />
              <h3 className="text-sm font-semibold text-[#1D2A1C]">Arama Motoru Optimizasyonu (SEO) &amp; Yapılandırılmış Veri</h3>
            </div>
            <p className="text-xs text-[#7A8377]">
              Google zengin arama sonuçları için meta başlık, açıklama ve JSON-LD Product &amp; FAQ Schema.
            </p>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#5C665A] mb-1">
                  SEO Başlığı (Meta Title) <span className="text-[#999] font-normal font-mono">({seoTitle.length}/60)</span>
                </label>
                <input
                  type="text"
                  name="seo_title"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Monstera Deliciosa — Geniş Yapraklı İç Mekan Bitkisi | FROND"
                  className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5] focus:bg-white focus:outline-none focus:border-[#1D2A1C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C665A] mb-1">
                  Meta Açıklaması (Meta Description) <span className="text-[#999] font-normal font-mono">({metaDescription.length}/155)</span>
                </label>
                <textarea
                  name="meta_description"
                  rows={2}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Canlı kök garantili bitki siparişi verin. Kolay bakım, şık saksı seçenekleri ile kapınıza teslim."
                  className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5] focus:bg-white focus:outline-none focus:border-[#1D2A1C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C665A] mb-1 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-[#5C665A]" />
                  JSON-LD Yapılandırılmış Veri (Schema.org / FAQPage)
                </label>
                <textarea
                  name="json_ld"
                  rows={6}
                  value={jsonLd}
                  onChange={(e) => setJsonLd(e.target.value)}
                  placeholder={`{\n  "@context": "https://schema.org",\n  "@type": "Product"\n}`}
                  className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5] font-mono focus:bg-white focus:outline-none focus:border-[#1D2A1C]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8E6DF]">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="px-4 py-2 rounded-lg border border-[#DDDCD5] text-xs font-medium text-[#5C665A] hover:bg-[#F4F3EE] transition"
          >
            İptal
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#1D2A1C] hover:bg-[#2D3E2C] text-[#FDFBF7] text-xs font-medium shadow-sm transition"
          >
            <Save className="w-4 h-4" />
            <span>Değişiklikleri Kaydet</span>
          </button>
        </div>
      </Form>
    </div>
  );
}
