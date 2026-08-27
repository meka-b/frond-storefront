import React, { useState, useMemo } from 'react';
import { json } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';
import db from '../../server/db/index.js';
import R2Uploader from '../components/R2Uploader.jsx';
import TiptapEditor from '../components/TiptapEditor.jsx';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Clock,
  User,
  Search,
  Globe,
  Sparkles,
  Bot,
  Share2,
  CheckCircle2,
  AlertCircle,
  Code2,
  Copy,
  Check,
  HelpCircle,
  ChevronRight,
  Laptop,
  Smartphone,
  Tag,
  Cpu,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export const loader = async () => {
  const articles = db.prepare('SELECT * FROM blog_articles ORDER BY published_at DESC').all();
  return json({ articles });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'save_article') {
    const id = formData.get('id') || formData.get('title').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const title = formData.get('title') || '';
    const excerpt = formData.get('excerpt') || '';
    const content = formData.get('content') || '';
    const tag = formData.get('tag') || 'Guides';
    const cover_image = formData.get('cover_image') || '/assets/img/blog-1.jpg';
    const read_time = formData.get('read_time') || '5 min read';
    const author_name = formData.get('author_name') || 'FROND Team';
    const author_role = formData.get('author_role') || 'Guides';
    
    // SEO & Semantic & LLM fields
    const meta_title = formData.get('meta_title') || '';
    const meta_description = formData.get('meta_description') || '';
    const focus_keywords = formData.get('focus_keywords') || '';
    const canonical_url = formData.get('canonical_url') || '';
    const tldr_summary = formData.get('tldr_summary') || '';
    const schema_type = formData.get('schema_type') || 'BlogPosting';
    const faq_items = formData.get('faq_items') || '[]';

    db.prepare(`
      INSERT OR REPLACE INTO blog_articles (
        id, title, excerpt, content, tag, cover_image, read_time, author_name, author_role,
        meta_title, meta_description, focus_keywords, canonical_url, tldr_summary, schema_type, faq_items,
        is_published, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
    `).run(
      id, title, excerpt, content, tag, cover_image, read_time, author_name, author_role,
      meta_title, meta_description, focus_keywords, canonical_url, tldr_summary, schema_type, faq_items
    );

    return json({ success: true });
  }

  if (intent === 'delete_article') {
    const id = formData.get('id');
    db.prepare('DELETE FROM blog_articles WHERE id = ?').run(id);
    return json({ success: true });
  }

  return json({ success: false });
};

export default function AdminBlog() {
  const { articles } = useLoaderData();
  const fetcher = useFetcher();

  const [editingArt, setEditingArt] = useState(null);
  const [activeTab, setActiveTab] = useState('content'); // 'content' | 'serp' | 'schema' | 'llm' | 'social'
  const [serpDevice, setSerpDevice] = useState('desktop'); // 'desktop' | 'mobile'
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Form State
  const [artId, setArtId] = useState('');
  const [artTitle, setArtTitle] = useState('');
  const [artExcerpt, setArtExcerpt] = useState('');
  const [artContent, setArtContent] = useState('');
  const [artTag, setArtTag] = useState('Guides');
  const [artImg, setArtImg] = useState('');
  const [artTime, setArtTime] = useState('5 min read');
  const [artAuthor, setArtAuthor] = useState('Maya from the greenhouse');
  const [artRole, setArtRole] = useState('Care Lab');

  // SEO & LLM State
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');
  const [focusKeywords, setFocusKeywords] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [tldrSummary, setTldrSummary] = useState('');
  const [schemaType, setSchemaType] = useState('BlogPosting');
  const [faqs, setFaqs] = useState([{ question: '', answer: '' }]);

  const startEdit = (a) => {
    if (a) {
      setEditingArt(a.id);
      setArtId(a.id);
      setArtTitle(a.title || '');
      setArtExcerpt(a.excerpt || '');
      setArtContent(a.content || '');
      setArtTag(a.tag || 'Guides');
      setArtImg(a.cover_image || '');
      setArtTime(a.read_time || '5 min read');
      setArtAuthor(a.author_name || 'Maya from the greenhouse');
      setArtRole(a.author_role || 'Care Lab');

      setMetaTitle(a.meta_title || '');
      setMetaDesc(a.meta_description || '');
      setFocusKeywords(a.focus_keywords || '');
      setCanonicalUrl(a.canonical_url || '');
      setTldrSummary(a.tldr_summary || '');
      setSchemaType(a.schema_type || 'BlogPosting');

      try {
        const parsed = JSON.parse(a.faq_items || '[]');
        setFaqs(Array.isArray(parsed) && parsed.length > 0 ? parsed : [{ question: '', answer: '' }]);
      } catch (e) {
        setFaqs([{ question: '', answer: '' }]);
      }
    } else {
      setEditingArt('new');
      setArtId('');
      setArtTitle('');
      setArtExcerpt('');
      setArtContent('');
      setArtTag('Guides');
      setArtImg('');
      setArtTime('5 min read');
      setArtAuthor('Maya from the greenhouse');
      setArtRole('Care Lab');

      setMetaTitle('');
      setMetaDesc('');
      setFocusKeywords('');
      setCanonicalUrl('');
      setTldrSummary('');
      setSchemaType('BlogPosting');
      setFaqs([{ question: '', answer: '' }]);
    }
    setActiveTab('content');
  };

  // SEO & LLM Computations
  const computedSlug = useMemo(() => {
    if (artId) return artId;
    return artTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }, [artId, artTitle]);

  const displayMetaTitle = metaTitle || (artTitle ? `${artTitle} | FROND Journal` : 'FROND Botanical Journal');
  const displayMetaDesc = metaDesc || artExcerpt || 'Bitki bakımı, toprak yenileme ve iç mekan bitkileri üzerine detaylı rehberler.';
  const displayCanonical = canonicalUrl || `https://frond.com/journal/${computedSlug}`;

  // Word count & Content analysis
  const contentText = useMemo(() => {
    return artContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }, [artContent]);

  const wordCount = useMemo(() => {
    return contentText ? contentText.split(/\s+/).filter(Boolean).length : 0;
  }, [contentText]);

  // Keyword occurrences
  const keywordStats = useMemo(() => {
    if (!focusKeywords) return [];
    const kws = focusKeywords.split(',').map(k => k.trim()).filter(Boolean);
    return kws.map(kw => {
      const regex = new RegExp(kw, 'gi');
      const inTitle = (artTitle.match(regex) || []).length;
      const inDesc = (displayMetaDesc.match(regex) || []).length;
      const inContent = (contentText.match(regex) || []).length;
      const density = wordCount > 0 ? ((inContent / wordCount) * 100).toFixed(1) : 0;
      return { kw, inTitle, inDesc, inContent, density };
    });
  }, [focusKeywords, artTitle, displayMetaDesc, contentText, wordCount]);

  // SEO & LLM Readiness Score (0 - 100)
  const seoScore = useMemo(() => {
    let score = 0;
    const checks = [];

    // Title Check (15 pts)
    const titleLen = displayMetaTitle.length;
    if (titleLen >= 30 && titleLen <= 65) {
      score += 15;
      checks.push({ label: 'Başlık uzunluğu ideal (30-65 karakter)', passed: true });
    } else {
      checks.push({ label: 'Başlık uzunluğu optimize edilmeli (30-65 karakter)', passed: false });
    }

    // Meta Desc Check (15 pts)
    const descLen = displayMetaDesc.length;
    if (descLen >= 110 && descLen <= 160) {
      score += 15;
      checks.push({ label: 'Meta açıklama uzunluğu uygun (110-160 karakter)', passed: true });
    } else {
      checks.push({ label: 'Meta açıklama 110-160 karakter olmalı', passed: false });
    }

    // Keyword in Title & Desc (15 pts)
    const firstKw = focusKeywords.split(',')[0]?.trim();
    if (firstKw && artTitle.toLowerCase().includes(firstKw.toLowerCase())) {
      score += 15;
      checks.push({ label: `Anahtar kelime "${firstKw}" başlıkta mevcut`, passed: true });
    } else {
      checks.push({ label: 'Odak anahtar kelime başlıkta yer almalı', passed: false });
    }

    // Content Length (20 pts)
    if (wordCount >= 300) {
      score += 20;
      checks.push({ label: `İçerik zenginliği yeterli (${wordCount} kelime)`, passed: true });
    } else {
      checks.push({ label: 'İçerik en az 300 kelime olmalı', passed: false });
    }

    // Headings structure (10 pts)
    const hasHeadings = /<h[1-4]/i.test(artContent);
    if (hasHeadings) {
      score += 10;
      checks.push({ label: 'H2/H3 başlık hiyerarşisi mevcut', passed: true });
    } else {
      checks.push({ label: 'İçerikte alt başlıklar (H2, H3) kullanılmalı', passed: false });
    }

    // LLM / AI Summary TL;DR (15 pts)
    if (tldrSummary && tldrSummary.trim().length >= 30) {
      score += 15;
      checks.push({ label: 'AI Overview / TL;DR özeti tanımlandı', passed: true });
    } else {
      checks.push({ label: 'AI ve LLM modelleri için TL;DR özeti ekleyin', passed: false });
    }

    // Cover Image (10 pts)
    if (artImg) {
      score += 10;
      checks.push({ label: 'Kapak görseli ve Open Graph görseli tanımlı', passed: true });
    } else {
      checks.push({ label: 'Kapak görseli ekleyin', passed: false });
    }

    return { score, checks };
  }, [displayMetaTitle, displayMetaDesc, focusKeywords, artTitle, wordCount, artContent, tldrSummary, artImg]);

  // Schema.org JSON-LD Generator
  const schemaJson = useMemo(() => {
    const validFaqs = faqs.filter(f => f.question.trim() && f.answer.trim());
    
    const schemaObj = {
      "@context": "https://schema.org",
      "@type": schemaType,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": displayCanonical
      },
      "headline": artTitle || "FROND Article",
      "description": displayMetaDesc,
      "image": artImg ? [artImg] : ["https://frond.com/assets/img/blog-1.jpg"],
      "author": {
        "@type": "Person",
        "name": artAuthor || "FROND Care Lab",
        "jobTitle": artRole || "Plant Specialist"
      },
      "publisher": {
        "@type": "Organization",
        "name": "FROND Botanic",
        "logo": {
          "@type": "ImageObject",
          "url": "https://frond.com/assets/img/logo.png"
        }
      },
      "datePublished": new Date().toISOString(),
      "dateModified": new Date().toISOString(),
      "articleSection": artTag,
      "keywords": focusKeywords,
      "wordCount": wordCount
    };

    if (tldrSummary) {
      schemaObj["abstract"] = tldrSummary;
    }

    if (validFaqs.length > 0) {
      schemaObj["hasPart"] = {
        "@type": "FAQPage",
        "mainEntity": validFaqs.map(f => ({
          "@type": "Question",
          "name": f.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": f.answer
          }
        }))
      };
    }

    return JSON.stringify(schemaObj, null, 2);
  }, [schemaType, displayCanonical, artTitle, displayMetaDesc, artImg, artAuthor, artRole, artTag, focusKeywords, wordCount, tldrSummary, faqs]);

  const copySchemaToClipboard = () => {
    navigator.clipboard.writeText(schemaJson);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  const handleAddFaq = () => {
    setFaqs([...faqs, { question: '', answer: '' }]);
  };

  const handleUpdateFaq = (index, field, value) => {
    const updated = [...faqs];
    updated[index][field] = value;
    setFaqs(updated);
  };

  const handleRemoveFaq = (index) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#1D2A1C] font-serif">Journal / Blog & SEO Hub</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300">
              AI & GEO Ready
            </span>
          </div>
          <p className="text-xs text-[#7A8377] mt-0.5">
            Makaleleri yönetin, Google SERP simülasyonunu test edin, Schema.org ve LLM özetlerini yapılandırın.
          </p>
        </div>
        <button
          onClick={() => startEdit(null)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1D2A1C] text-[#FDFBF7] text-xs font-medium shadow-2xs hover:bg-[#2A3628] transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Yeni Makale Oluştur
        </button>
      </div>

      {/* Editor Modal / Workspace */}
      {editingArt && (
        <div className="bg-white rounded-2xl border border-[#E0DED7] p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E0DED7] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FAF9F5] border border-[#E0DED7] flex items-center justify-center text-[#1D2A1C]">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1D2A1C]">
                  {editingArt === 'new' ? 'Yeni Blog Makalesi Oluştur' : `Makaleyi Düzenle: ${artTitle || artId}`}
                </h3>
                <span className="text-[11px] font-mono text-[#7A8377]">
                  {computedSlug ? `/journal/${computedSlug}` : 'Taslak Makale'}
                </span>
              </div>
            </div>

            {/* SEO & LLM Score Pill */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF9F5] border border-[#E2E8F0]">
                <div className={`w-2.5 h-2.5 rounded-full ${seoScore.score >= 80 ? 'bg-emerald-500' : seoScore.score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
                <span className="text-xs font-bold text-[#1D2A1C] font-mono">{seoScore.score}/100</span>
                <span className="text-[10px] text-[#7A8377] font-medium">SEO & LLM Skoru</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingArt(null)}
                className="text-xs text-[#7A8377] hover:text-[#1D2A1C] px-2 py-1 rounded"
              >
                Kapat
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-[#E2E8F0] overflow-x-auto pb-px">
            <button
              type="button"
              onClick={() => setActiveTab('content')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap ${
                activeTab === 'content'
                  ? 'border-[#1D2A1C] text-[#1D2A1C] bg-[#FAF9F5]'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              İçerik & Editör
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('serp')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap ${
                activeTab === 'serp'
                  ? 'border-[#1D2A1C] text-[#1D2A1C] bg-[#FAF9F5]'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-blue-600" />
              Google SERP & Meta
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('schema')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap ${
                activeTab === 'schema'
                  ? 'border-[#1D2A1C] text-[#1D2A1C] bg-[#FAF9F5]'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-purple-600" />
              Semantik Schema (JSON-LD)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('llm')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap ${
                activeTab === 'llm'
                  ? 'border-[#1D2A1C] text-[#1D2A1C] bg-[#FAF9F5]'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-emerald-600" />
              AI / LLM & GEO Özeti
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('social')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap ${
                activeTab === 'social'
                  ? 'border-[#1D2A1C] text-[#1D2A1C] bg-[#FAF9F5]'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Share2 className="w-3.5 h-3.5 text-amber-600" />
              Sosyal Kartlar (OG)
            </button>
          </div>

          <fetcher.Form method="post" className="space-y-6" onSubmit={() => setEditingArt(null)}>
            <input type="hidden" name="intent" value="save_article" />
            <input type="hidden" name="id" value={artId || computedSlug} />
            <input type="hidden" name="meta_title" value={metaTitle} />
            <input type="hidden" name="meta_description" value={metaDesc} />
            <input type="hidden" name="focus_keywords" value={focusKeywords} />
            <input type="hidden" name="canonical_url" value={canonicalUrl} />
            <input type="hidden" name="tldr_summary" value={tldrSummary} />
            <input type="hidden" name="schema_type" value={schemaType} />
            <input type="hidden" name="faq_items" value={JSON.stringify(faqs.filter(f => f.question.trim()))} />

            {/* TAB 1: CONTENT & EDITOR */}
            {activeTab === 'content' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#5C665A] mb-1">
                      Makale Başlığı *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={artTitle}
                      onChange={(e) => setArtTitle(e.target.value)}
                      placeholder="Örn: Evde Bitki Çoğaltmanın 5 Altın Kuralı"
                      required
                      className="w-full text-sm font-medium border border-[#E0DED7] rounded-xl p-3 bg-[#FAF9F5] focus:bg-white focus:outline-none focus:border-[#1D2A1C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5C665A] mb-1">
                      Kategori / Etiket
                    </label>
                    <select
                      name="tag"
                      value={artTag}
                      onChange={(e) => setArtTag(e.target.value)}
                      className="w-full text-xs border border-[#E0DED7] rounded-xl p-3 bg-[#FAF9F5] focus:bg-white focus:outline-none focus:border-[#1D2A1C]"
                    >
                      <option value="Guides">Guides (Rehberler)</option>
                      <option value="Care Lab">Care Lab (Bakım Laboratuvarı)</option>
                      <option value="Plant School">Plant School (Bitki Okulu)</option>
                      <option value="Interiors">Interiors (İç Mekan Tasarımı)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5C665A] mb-1">
                    Kısa Özet (Excerpt)
                  </label>
                  <textarea
                    name="excerpt"
                    value={artExcerpt}
                    onChange={(e) => setArtExcerpt(e.target.value)}
                    rows={2}
                    placeholder="Kartlarda ve arama sonuçlarında görünecek kısa giriş metni..."
                    className="w-full text-xs border border-[#E0DED7] rounded-xl p-3 bg-[#FAF9F5] focus:bg-white focus:outline-none focus:border-[#1D2A1C]"
                  />
                </div>

                {/* Tiptap Editor */}
                <div>
                  <TiptapEditor
                    name="content"
                    value={artContent}
                    onChange={setArtContent}
                    label="Makale İçeriği (Zengin Metin & Biçimlendirme)"
                    description="Tiptap Simple Editor (SEO Ready)"
                    placeholder="Detaylı bakım adımları, rehber metni ve bitki bakım ipuçları..."
                    minHeight="min-h-[300px]"
                  />
                </div>

                {/* Author & Cover Image */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#5C665A] mb-1">Yazar Adı</label>
                    <input
                      type="text"
                      name="author_name"
                      value={artAuthor}
                      onChange={(e) => setArtAuthor(e.target.value)}
                      className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5] focus:bg-white focus:outline-none focus:border-[#1D2A1C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5C665A] mb-1">Yazar Rolü / Unvanı</label>
                    <input
                      type="text"
                      name="author_role"
                      value={artRole}
                      onChange={(e) => setArtRole(e.target.value)}
                      className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5] focus:bg-white focus:outline-none focus:border-[#1D2A1C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5C665A] mb-1">Okuma Süresi</label>
                    <input
                      type="text"
                      name="read_time"
                      value={artTime}
                      onChange={(e) => setArtTime(e.target.value)}
                      placeholder="Örn: 6 min read"
                      className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5] focus:bg-white focus:outline-none focus:border-[#1D2A1C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5C665A] mb-1">Kapak Görseli</label>
                  <input type="hidden" name="cover_image" value={artImg} />
                  <R2Uploader
                    value={artImg}
                    onUploadComplete={(url) => setArtImg(url)}
                    label="Kapak Görseli Yükle (Cloudflare R2)"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: GOOGLE SERP & META */}
            {activeTab === 'serp' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Live SERP Simulator Box */}
                <div className="bg-[#FAF9F5] border border-[#E2E8F0] rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1D2A1C] flex items-center gap-1.5">
                      <Search className="w-4 h-4 text-blue-600" />
                      Google SERP Canlı Önizlemesi
                    </span>
                    <div className="flex items-center gap-1 bg-white border border-[#E2E8F0] p-0.5 rounded-lg text-xs">
                      <button
                        type="button"
                        onClick={() => setSerpDevice('desktop')}
                        className={`flex items-center gap-1 px-2 py-1 rounded ${serpDevice === 'desktop' ? 'bg-[#1D2A1C] text-white font-medium' : 'text-[#64748B]'}`}
                      >
                        <Laptop className="w-3.5 h-3.5" />
                        Masaüstü
                      </button>
                      <button
                        type="button"
                        onClick={() => setSerpDevice('mobile')}
                        className={`flex items-center gap-1 px-2 py-1 rounded ${serpDevice === 'mobile' ? 'bg-[#1D2A1C] text-white font-medium' : 'text-[#64748B]'}`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        Mobil
                      </button>
                    </div>
                  </div>

                  {/* Google Snippet Card */}
                  <div className={`bg-white border border-[#CBD5E1] rounded-xl p-4 shadow-sm ${serpDevice === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-full bg-[#1D2A1C] flex items-center justify-center text-white text-[10px] font-serif font-bold">
                        F
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[12px] font-semibold text-[#202124] leading-tight">FROND Botanic</span>
                        <span className="text-[10px] text-[#4d5156] font-mono leading-tight">
                          https://frond.com &gt; journal &gt; {computedSlug || 'slug'}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-[18px] text-[#1a0dab] hover:underline cursor-pointer font-medium leading-snug break-words">
                      {displayMetaTitle}
                    </h4>

                    <p className="text-[13px] text-[#4d5156] leading-relaxed mt-1 line-clamp-2">
                      <span className="text-[#70757a] text-[12px]">25 Ağu 2026 — </span>
                      {displayMetaDesc}
                    </p>
                  </div>
                </div>

                {/* Meta Inputs */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-[#5C665A]">
                        Özel Meta Başlığı (Title Tag)
                      </label>
                      <span className={`text-[11px] font-mono ${displayMetaTitle.length > 60 ? 'text-amber-600 font-bold' : 'text-[#7A8377]'}`}>
                        {displayMetaTitle.length} / 60 karakter
                      </span>
                    </div>
                    <input
                      type="text"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      placeholder={artTitle ? `${artTitle} | FROND Journal` : 'Boş bırakılırsa makale başlığı kullanılır'}
                      className="w-full text-xs border border-[#E0DED7] rounded-xl p-3 bg-[#FAF9F5] focus:bg-white focus:outline-none focus:border-[#1D2A1C]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-[#5C665A]">
                        Özel Meta Açıklaması (Meta Description)
                      </label>
                      <span className={`text-[11px] font-mono ${displayMetaDesc.length > 160 ? 'text-amber-600 font-bold' : 'text-[#7A8377]'}`}>
                        {displayMetaDesc.length} / 160 karakter
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={metaDesc}
                      onChange={(e) => setMetaDesc(e.target.value)}
                      placeholder={artExcerpt || 'Boş bırakılırsa makale özeti kullanılır'}
                      className="w-full text-xs border border-[#E0DED7] rounded-xl p-3 bg-[#FAF9F5] focus:bg-white focus:outline-none focus:border-[#1D2A1C]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#5C665A] mb-1">
                        Hedef / Odak Anahtar Kelimeler (Virgülle ayırın)
                      </label>
                      <input
                        type="text"
                        value={focusKeywords}
                        onChange={(e) => setFocusKeywords(e.target.value)}
                        placeholder="Örn: bitki çoğaltma, suda köklendirme, monstera bakımı"
                        className="w-full text-xs border border-[#E0DED7] rounded-xl p-2.5 bg-[#FAF9F5] focus:bg-white focus:outline-none focus:border-[#1D2A1C]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#5C665A] mb-1">
                        Kanonik Bağlantı (Canonical URL)
                      </label>
                      <input
                        type="text"
                        value={canonicalUrl}
                        onChange={(e) => setCanonicalUrl(e.target.value)}
                        placeholder={displayCanonical}
                        className="w-full text-xs border border-[#E0DED7] rounded-xl p-2.5 bg-[#FAF9F5] focus:bg-white focus:outline-none focus:border-[#1D2A1C]"
                      />
                    </div>
                  </div>

                  {/* Keyword Density Table */}
                  {keywordStats.length > 0 && (
                    <div className="border border-[#E2E8F0] rounded-xl overflow-hidden text-xs">
                      <div className="bg-[#FAF9F5] px-3 py-2 font-semibold text-[#1D2A1C] border-b border-[#E2E8F0]">
                        Anahtar Kelime Yoğunluğu & Analiz
                      </div>
                      <div className="divide-y divide-[#E2E8F0]">
                        {keywordStats.map((k, i) => (
                          <div key={i} className="px-3 py-2 flex items-center justify-between bg-white">
                            <span className="font-medium text-[#0F172A]">{k.kw}</span>
                            <div className="flex items-center gap-4 text-[#64748B] font-mono text-[11px]">
                              <span>Başlıkta: {k.inTitle ? '✅ Var' : '❌ Yok'}</span>
                              <span>Meta Açıklamada: {k.inDesc ? '✅ Var' : '❌ Yok'}</span>
                              <span>İçerikte: {k.inContent} kez (%{k.density})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: SCHEMA.ORG JSON-LD & KNOWLEDGE GRAPH */}
            {activeTab === 'schema' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#5C665A] mb-1">
                      Schema Türü (Schema.org)
                    </label>
                    <select
                      value={schemaType}
                      onChange={(e) => setSchemaType(e.target.value)}
                      className="w-full text-xs border border-[#E0DED7] rounded-xl p-2.5 bg-[#FAF9F5]"
                    >
                      <option value="BlogPosting">BlogPosting (Standart Blog Yazısı)</option>
                      <option value="Article">Article (Genel Makale)</option>
                      <option value="HowTo">HowTo (Nasıl Yapılır / Rehber)</option>
                      <option value="TechArticle">TechArticle (Teknik / Bakım Kılavuzu)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#5C665A] mb-1">
                      Semantik Bilgi Grafiği Varlığı (Knowledge Entity)
                    </label>
                    <div className="text-xs text-[#64748B] bg-[#FAF9F5] p-2.5 rounded-xl border border-[#E2E8F0] flex items-center justify-between">
                      <span>Publisher: <strong>FROND Botanic (Organization)</strong></span>
                      <span>Author: <strong>{artAuthor} (Person)</strong></span>
                    </div>
                  </div>
                </div>

                {/* FAQ Schema Builder */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#5C665A] flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-purple-600" />
                      Google FAQPage Yapısal Veri (Sıkça Sorulan Sorular)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddFaq}
                      className="text-xs text-[#1D2A1C] hover:underline font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Soru Ekle
                    </button>
                  </div>

                  <div className="space-y-2">
                    {faqs.map((faq, idx) => (
                      <div key={idx} className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E2E8F0] space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={faq.question}
                            onChange={(e) => handleUpdateFaq(idx, 'question', e.target.value)}
                            placeholder={`Soru #${idx + 1} (Örn: Suda köklenen bitki ne zaman toprağa dikilmeli?)`}
                            className="w-full text-xs font-semibold border border-[#E0DED7] rounded-lg p-2 bg-white"
                          />
                          {faqs.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFaq(idx)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <textarea
                          rows={2}
                          value={faq.answer}
                          onChange={(e) => handleUpdateFaq(idx, 'answer', e.target.value)}
                          placeholder="Cevap metni (Google arama sonuçlarında doğrudan snippet olarak çıkar)..."
                          className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Generated JSON-LD Code Block */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#5C665A] font-mono">
                      Oluşturulan JSON-LD Yapısal Verisi (&lt;script type=&quot;application/ld+json&quot;&gt;)
                    </span>
                    <button
                      type="button"
                      onClick={copySchemaToClipboard}
                      className="inline-flex items-center gap-1 text-xs text-[#1D2A1C] bg-[#FAF9F5] border border-[#E2E8F0] px-2.5 py-1 rounded-lg hover:bg-white transition"
                    >
                      {copiedSchema ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      {copiedSchema ? 'Kopyalandı' : 'Kodu Kopyala'}
                    </button>
                  </div>
                  <pre className="bg-[#0F172A] text-[#38BDF8] p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-64 border border-[#1E293B]">
                    {schemaJson}
                  </pre>
                </div>
              </div>
            )}

            {/* TAB 4: AI & LLM / GEO OPTIMIZATION */}
            {activeTab === 'llm' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <Cpu className="w-4 h-4" />
                    GEO (Generative Engine Optimization) & LLM Alıntılanabilirlik
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    ChatGPT, Perplexity ve Google AI Overviews gibi yapay zeka arama motorları, yapılandırılmış maddeler ve doğrudan tanımlar içeren içerikleri kaynak olarak seçer.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#5C665A] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#D87A4F]" />
                      TL;DR / AI & LLM Temel Çıkarımlar Özeti (Key Takeaways)
                    </label>
                    <span className="text-[11px] font-mono text-[#7A8377]">
                      {tldrSummary.length} karakter
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={tldrSummary}
                    onChange={(e) => setTldrSummary(e.target.value)}
                    placeholder="• Su sıcaklığı oda sıcaklığında (20-22°C) olmalı.
• Kökler 5-8 cm uzunluğa ulaştığında geçirgen toprağa aktarılmalı.
• Doğrudan yakıcı güneşten kaçınılmalı, aydınlık filtrelenmiş ışık sağlanmalı."
                    className="w-full text-xs font-mono border border-[#E0DED7] rounded-xl p-3 bg-[#FAF9F5] focus:bg-white focus:outline-none focus:border-[#1D2A1C]"
                  />
                  <p className="text-[11px] text-[#7A8377] mt-1">
                    Bu alan makale başında &quot;Özet / Önemli Noktalar&quot; kutusu olarak gösterilir ve yapay zeka botlarının doğrudan alıntı yapmasını sağlar.
                  </p>
                </div>

                {/* Audit Checklist */}
                <div className="border border-[#E2E8F0] rounded-2xl p-4 bg-white space-y-3">
                  <h4 className="text-xs font-bold text-[#1D2A1C] flex items-center gap-2">
                    <Bot className="w-4 h-4 text-emerald-600" />
                    AI & Arama Motoru Hazırlık Denetimi
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {seoScore.checks.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {c.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <span className={c.passed ? 'text-[#1E293B]' : 'text-[#64748B]'}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: SOCIAL SHARING (OPEN GRAPH) */}
            {activeTab === 'social' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="bg-[#FAF9F5] border border-[#E2E8F0] rounded-2xl p-5 space-y-3">
                  <span className="text-xs font-bold text-[#1D2A1C] flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-amber-600" />
                    Sosyal Medya Paylaşım Kartı (Open Graph / Facebook / LinkedIn / X)
                  </span>

                  <div className="max-w-lg mx-auto bg-white border border-[#CBD5E1] rounded-xl overflow-hidden shadow-sm">
                    <div className="aspect-[12/6.3] w-full bg-gray-100 relative overflow-hidden flex items-center justify-center">
                      {artImg ? (
                        <img src={artImg} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-xs text-[#94A3B8] flex items-center gap-1.5">
                          <Globe className="w-4 h-4" /> Görsel Yüklenmedi
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-1 bg-white">
                      <span className="text-[10px] font-mono text-[#94A3B8] uppercase">FROND.COM</span>
                      <h4 className="text-sm font-bold text-[#1E293B] line-clamp-1">{displayMetaTitle}</h4>
                      <p className="text-xs text-[#64748B] line-clamp-2">{displayMetaDesc}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-[#E0DED7]">
              <button
                type="button"
                onClick={() => setEditingArt(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#7A8377] hover:bg-gray-100 transition"
              >
                Vazgeç
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1D2A1C] text-[#FDFBF7] text-xs font-semibold shadow-xs hover:bg-[#2A3628] transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                Makaleyi ve SEO Verilerini Kaydet
              </button>
            </div>
          </fetcher.Form>
        </div>
      )}

      {/* Articles Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map((art) => (
          <div
            key={art.id}
            className="bg-white rounded-2xl border border-[#E0DED7] overflow-hidden flex flex-col hover:border-[#1D2A1C] transition duration-200 shadow-2xs group"
          >
            <div className="aspect-[16/9] w-full bg-[#FAF9F5] overflow-hidden relative">
              <img
                src={art.cover_image}
                alt={art.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-[#1D2A1C]/80 text-[#FDFBF7] backdrop-blur-xs">
                {art.tag}
              </span>
              {art.meta_title && (
                <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md text-[9px] font-mono font-semibold bg-emerald-600 text-white shadow-xs">
                  SEO Ready
                </span>
              )}
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] text-[#7A8377] font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {art.read_time}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 truncate">
                    <User className="w-3 h-3" /> {art.author_name}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#1D2A1C] font-serif leading-snug line-clamp-2">
                  {art.title}
                </h3>

                <p className="text-xs text-[#7A8377] line-clamp-2 leading-relaxed">
                  {art.excerpt}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#E0DED7]/60">
                <span className="text-[10px] font-mono text-[#7A8377]">
                  {art.published_at ? new Date(art.published_at).toLocaleDateString('tr-TR') : ''}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => startEdit(art)}
                    className="p-1.5 rounded-lg text-[#1D2A1C] hover:bg-[#FAF9F5] border border-[#E0DED7] transition"
                    title="Düzenle & SEO"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <fetcher.Form method="post" onSubmit={(e) => !confirm('Bu makaleyi silmek istediğinize emin misiniz?') && e.preventDefault()}>
                    <input type="hidden" name="intent" value="delete_article" />
                    <input type="hidden" name="id" value={art.id} />
                    <button
                      type="submit"
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 border border-[#E0DED7] transition"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </fetcher.Form>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
