import React, { useState } from 'react';
import { json } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';
import db from '../../server/db/index.js';
import R2Uploader from '../components/R2Uploader.jsx';
import ProductSingleSelect from '../components/ProductSingleSelect.jsx';
import AriaTooltip from '../components/AriaTooltip.jsx';
import {
  Video,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Play,
  Search,
  Sparkles,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
  Info,
  Maximize2
} from 'lucide-react';

export const loader = async () => {
  const posts = db.prepare(`
    SELECT u.*, p.title as product_title, p.sku as product_sku
    FROM ugc_posts u
    LEFT JOIN products p ON u.product_id = p.id
    ORDER BY u.sort_order ASC, u.created_at DESC
  `).all();
  const allProducts = db.prepare(`
    SELECT p.id, p.title, p.sku,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
    FROM products p
    ORDER BY p.title ASC
  `).all();
  return json({ posts, allProducts });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'save_ugc') {
    const id = formData.get('id') || `ugc-${Date.now()}`;
    const product_id = formData.get('product_id');
    const title = formData.get('title');
    const alt_text = formData.get('alt_text') || '';
    const video_url = formData.get('video_url');
    const poster_url = formData.get('poster_url') || '';
    const thumb_url = formData.get('thumb_url') || '';
    const price_display = formData.get('price_display') || '$299.00';

    db.prepare(`
      INSERT OR REPLACE INTO ugc_posts (id, product_id, title, alt_text, video_url, poster_url, thumb_url, price_display, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM ugc_posts WHERE id != ?), 1)
    `).run(id, product_id, title, alt_text, video_url, poster_url, thumb_url, price_display, id);

    return json({ success: true, action: 'saved' });
  }

  if (intent === 'delete_ugc') {
    const id = formData.get('id');
    db.prepare('DELETE FROM ugc_posts WHERE id = ?').run(id);
    return json({ success: true, action: 'deleted' });
  }

  return json({ success: false });
};

export default function AdminUgc() {
  const { posts, allProducts } = useLoaderData();
  const fetcher = useFetcher();

  const [search, setSearch] = useState('');
  const [filterMissingAlt, setFilterMissingAlt] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  // Form states
  const [postId, setPostId] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postAltText, setPostAltText] = useState('');
  const [postPid, setPostPid] = useState(allProducts[0]?.id || 'adansonii');
  const [postVideo, setPostVideo] = useState('');
  const [postPoster, setPostPoster] = useState('');
  const [postThumb, setPostThumb] = useState('');
  const [postPrice, setPostPrice] = useState('$299.00');

  const startEdit = (p) => {
    if (p) {
      setEditingPost(p.id);
      setPostId(p.id);
      setPostTitle(p.title);
      setPostAltText(p.alt_text || '');
      setPostPid(p.product_id);
      setPostVideo(p.video_url);
      setPostPoster(p.poster_url);
      setPostThumb(p.thumb_url);
      setPostPrice(p.price_display || '$299.00');
    } else {
      setEditingPost('new');
      setPostId('');
      setPostTitle('');
      setPostAltText('');
      setPostPid(allProducts[0]?.id || 'adansonii');
      setPostVideo('assets/video/community-story-1.mp4');
      setPostPoster('assets/img/p-adansonii-2.jpg');
      setPostThumb('assets/img/p-adansonii-1.jpg');
      setPostPrice('$299.00');
    }
  };

  const filteredPosts = posts.filter((p) => {
    const match =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.product_title && p.product_title.toLowerCase().includes(search.toLowerCase())) ||
      (p.alt_text && p.alt_text.toLowerCase().includes(search.toLowerCase()));

    if (!match) return false;
    if (filterMissingAlt) return !p.alt_text || p.alt_text.trim().length === 0;
    return true;
  });

  const missingAltCount = posts.filter((p) => !p.alt_text || p.alt_text.trim().length === 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#1D2A1C] font-serif">Topluluk Hikayeleri (UGC Video Galerisi)</h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-[#EBF3EB] text-[#2E6B2B] px-2 py-0.5 rounded border border-[#CCE2CB]">
              <Video className="w-3 h-3" />
              React Aria Photos Pattern
            </span>
          </div>
          <p className="text-xs text-[#7A8377] mt-0.5">
            Ana sayfadaki interaktif video kaydırıcısı, ürün etiketleri ve video SEO alt-text yönetimi.
          </p>
        </div>
        <button
          type="button"
          onClick={() => startEdit(null)}
          className="inline-flex items-center gap-1.5 text-xs bg-[#1D2A1C] hover:bg-[#2D3E2C] text-[#FDFBF7] px-3.5 py-2 rounded-lg font-medium shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni UGC Hikayesi Ekle</span>
        </button>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E8E6DF] space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#8C9388] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hikaye başlığı, bitki adı veya alt-text ara..."
              className="w-full text-xs bg-[#FAF9F5] border border-[#E0DED7] rounded-lg pl-9 pr-3 py-2 text-[#1D2A1C] placeholder-[#8C9388] focus:bg-white focus:outline-none focus:border-[#1D2A1C]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterMissingAlt(!filterMissingAlt)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                filterMissingAlt
                  ? 'bg-[#D87A4F] text-white border-[#D87A4F]'
                  : 'bg-white text-[#D87A4F] border-[#D87A4F]/30 hover:bg-[#FFF8F5]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>SEO Alt-Text Eksik ({missingAltCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* React Aria Photos Video Cards Grid (6 Columns) */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E8E6DF] p-12 text-center text-xs text-[#7A8377]">
          Filtre kriterlerine uygun UGC videosu bulunamadı.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {filteredPosts.map((post) => {
            const hasAlt = Boolean(post.alt_text && post.alt_text.trim().length > 0);
            return (
              <div
                key={post.id}
                className="group bg-white rounded-xl border border-[#E8E6DF] overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col"
              >
                {/* 9:16 Story Video Aspect Container */}
                <div
                  onClick={() => startEdit(post)}
                  className="aspect-[9/14] bg-[#F4F3EE] relative overflow-hidden flex items-center justify-center cursor-pointer select-none"
                >
                  <video
                    src={post.video_url}
                    poster={post.poster_url || post.thumb_url}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    muted
                    loop
                    playsInline
                  />

                  {/* Play Overlay Icon */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 flex flex-col justify-between p-3">
                    <div className="flex items-center justify-between">
                      <span className="bg-black/50 backdrop-blur-xs text-white text-[9px] px-2 py-0.5 rounded-full font-mono">
                        UGC Story
                      </span>

                      {/* SEO Alt-Text Tooltip Badge */}
                      <AriaTooltip
                        content={
                          hasAlt
                            ? `Video SEO Alt Metni: "${post.alt_text}"`
                            : "⚠️ Video için alt-text eksik! SEO için ekleyin."
                        }
                        position="left"
                      >
                        <span
                          className={`p-1 rounded-full backdrop-blur-xs flex items-center justify-center ${
                            hasAlt ? 'bg-emerald-600/90 text-white' : 'bg-amber-500/90 text-white animate-pulse'
                          }`}
                        >
                          {hasAlt ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                        </span>
                      </AriaTooltip>
                    </div>

                    {/* Bottom Metadata in Video */}
                    <div>
                      <div className="flex items-center gap-1.5 text-white text-xs font-semibold drop-shadow-sm">
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span className="truncate">{post.title}</span>
                      </div>
                      <div className="text-white/80 text-[11px] font-mono mt-0.5">
                        {post.product_title} · {post.price_display}
                      </div>
                    </div>
                  </div>

                  {/* Hover Trigger */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(post);
                      }}
                      className="p-2.5 bg-white text-[#1D2A1C] rounded-xl shadow-lg hover:scale-110 transition flex items-center gap-1 text-xs font-semibold"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Düzenle</span>
                    </button>
                  </div>
                </div>

                {/* Card Bottom Meta */}
                <div className="p-3 border-t border-[#E8E6DF] flex flex-col justify-between flex-1 bg-white space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-[#7A8377]">Ürün ID: {post.product_id}</span>
                    <span className="font-semibold text-[#1D2A1C]">{post.price_display}</span>
                  </div>

                  <AriaTooltip
                    content={hasAlt ? `Alt Metni: ${post.alt_text}` : "SEO Alt metni tanımlanmamış"}
                    position="top"
                  >
                    <div className={`text-[11px] truncate p-1.5 rounded bg-[#FAF9F5] border border-[#E8E6DF] ${hasAlt ? 'text-[#3F5E3D]' : 'text-amber-600 italic'}`}>
                      {hasAlt ? `ALT: ${post.alt_text}` : '⚠️ ALT METNİ EKSİK'}
                    </div>
                  </AriaTooltip>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#F0EFEB]">
                    <button
                      type="button"
                      onClick={() => startEdit(post)}
                      className="p-1 text-[#5C665A] hover:text-[#1D2A1C] text-xs font-medium"
                    >
                      Düzenle
                    </button>
                    <fetcher.Form method="post">
                      <input type="hidden" name="intent" value="delete_ugc" />
                      <input type="hidden" name="id" value={post.id} />
                      <button
                        type="submit"
                        onClick={(e) => {
                          if (!confirm(`"${post.title}" hikayesini silmek istiyor musunuz?`)) e.preventDefault();
                        }}
                        className="p-1 text-[#5C665A] hover:text-red-600"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </fetcher.Form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* React Aria Photos Video Inspector & SEO Alt-Text Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#E8E6DF] max-w-2xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E6DF] bg-[#FAF9F5]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D87A4F]" />
                <h3 className="font-serif font-bold text-sm text-[#1D2A1C]">
                  {editingPost === 'new' ? 'Yeni UGC Hikayesi Ekle' : 'UGC Videosu & SEO Denetçisi'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="p-1 rounded-lg text-[#7A8377] hover:text-[#1D2A1C] hover:bg-[#E8E6DF] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <fetcher.Form
                method="post"
                onSubmit={() => setEditingPost(null)}
                className="space-y-4"
              >
                <input type="hidden" name="intent" value="save_ugc" />
                <input type="hidden" name="id" value={postId} />
                <input type="hidden" name="video_url" value={postVideo} />
                <input type="hidden" name="poster_url" value={postPoster} />
                <input type="hidden" name="thumb_url" value={postThumb} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#5C665A] mb-1">Video Başlığı *</label>
                    <input
                      type="text"
                      name="title"
                      required
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      placeholder="Örn: Adansonii Swiss Cheese Vine"
                      className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5] focus:bg-white focus:outline-none focus:border-[#1D2A1C]"
                    />
                  </div>

                  <div>
                    <ProductSingleSelect
                      name="product_id"
                      label="Bağlantılı Ürün"
                      products={allProducts}
                      value={postPid}
                      onChange={setPostPid}
                      required
                    />
                  </div>
                </div>

                {/* SEO Alt-Text Field with Tooltip info */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#1D2A1C] uppercase tracking-wider font-mono">
                      Video SEO Alt Metni (Alt-Text) *
                    </label>
                    <AriaTooltip
                      content="Ekran okuyucular ve arama motorları için video içeriğini özetleyen açıklayıcı SEO metni."
                      position="left"
                    >
                      <span className="text-[11px] text-[#7A8377] flex items-center gap-1 cursor-pointer">
                        <Info className="w-3.5 h-3.5" />
                        <span>SEO Tavsiyesi</span>
                      </span>
                    </AriaTooltip>
                  </div>
                  <input
                    type="text"
                    name="alt_text"
                    value={postAltText}
                    onChange={(e) => setPostAltText(e.target.value)}
                    placeholder="Örn: Müşterinin oturma odasında sergilediği Monstera Deliciosa bitkisi inceleme videosu"
                    className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5] focus:bg-white focus:outline-none focus:border-[#1D2A1C]"
                  />
                  <p className="text-[11px] text-[#7A8377]">
                    Video posteri ve küçük resmi için arama motorlarında indekslenecek alt metin.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#5C665A] mb-1">Görünen Fiyat Etiketi</label>
                    <input
                      type="text"
                      name="price_display"
                      value={postPrice}
                      onChange={(e) => setPostPrice(e.target.value)}
                      placeholder="$299.00"
                      className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5C665A] mb-1">Video Dosyası (Cloudflare R2 MP4)</label>
                    <R2Uploader
                      label=""
                      accept="video/mp4,video/webm"
                      value={postVideo}
                      onUploadComplete={setPostVideo}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#5C665A] mb-1">Kapak / Poster Görseli</label>
                    <R2Uploader label="" value={postPoster} onUploadComplete={setPostPoster} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#5C665A] mb-1">Küçük Resim (Thumbnail)</label>
                    <R2Uploader label="" value={postThumb} onUploadComplete={setPostThumb} />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8E6DF]">
                  <button
                    type="button"
                    onClick={() => setEditingPost(null)}
                    className="px-4 py-2 rounded-lg border border-[#DDDCD5] text-xs font-medium text-[#5C665A] hover:bg-[#F4F3EE] transition"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#1D2A1C] hover:bg-[#2D3E2C] text-[#FDFBF7] text-xs font-medium shadow-sm transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>Kaydet</span>
                  </button>
                </div>
              </fetcher.Form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
