import React, { useState } from 'react';
import { json } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';
import db from '../../server/db/index.js';
import { deleteFile } from '../../server/services/r2Storage.js';
import R2Uploader from '../components/R2Uploader.jsx';
import AriaTooltip from '../components/AriaTooltip.jsx';
import {
  FileImage,
  Video,
  Copy,
  Trash2,
  ExternalLink,
  Check,
  Search,
  Cloud,
  Edit3,
  X,
  Sparkles,
  Info,
  Maximize2,
  Filter,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const loader = async () => {
  const media = db.prepare('SELECT * FROM media_files ORDER BY created_at DESC').all();
  return json({ media });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'delete') {
    const mediaId = formData.get('mediaId');
    if (mediaId) {
      await deleteFile(mediaId);
      return json({ success: true, action: 'deleted' });
    }
  }

  if (intent === 'update_seo') {
    const mediaId = formData.get('mediaId');
    const altText = formData.get('alt_text') || '';
    const originalName = formData.get('original_name');

    if (mediaId) {
      db.prepare(`
        UPDATE media_files
        SET alt_text = ?, original_name = COALESCE(?, original_name)
        WHERE id = ?
      `).run(altText, originalName || null, mediaId);
      return json({ success: true, action: 'updated' });
    }
  }

  return json({ success: false });
};

export default function AdminMedia() {
  const { media } = useLoaderData();
  const fetcher = useFetcher();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // all | images | videos | missing_alt
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Inspector edit state
  const [editAltText, setEditAltText] = useState('');
  const [editName, setEditName] = useState('');

  const openInspector = (item) => {
    setSelectedMedia(item);
    setEditAltText(item.alt_text || '');
    setEditName(item.original_name || '');
  };

  const copyUrl = (id, url) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filtered = media.filter((m) => {
    const isVideo = m.mime_type?.includes('video') || m.filename.match(/\.(mp4|webm)$/i);
    const hasAlt = Boolean(m.alt_text && m.alt_text.trim().length > 0);

    const matchesSearch =
      m.original_name.toLowerCase().includes(search.toLowerCase()) ||
      m.filename.toLowerCase().includes(search.toLowerCase()) ||
      (m.alt_text && m.alt_text.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'images') return !isVideo;
    if (filterType === 'videos') return isVideo;
    if (filterType === 'missing_alt') return !hasAlt;
    return true;
  });

  const missingAltCount = media.filter((m) => !m.alt_text || m.alt_text.trim().length === 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#1D2A1C] font-serif">Cloudflare R2 Medya Galerisi</h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-[#EBF3EB] text-[#2E6B2B] px-2 py-0.5 rounded border border-[#CCE2CB]">
              <Cloud className="w-3 h-3" />
              React Aria Photos Pattern
            </span>
          </div>
          <p className="text-xs text-[#7A8377] mt-0.5">
            Cloudflare R2 nesne depolama, görsel &amp; video SEO alt-text yönetimi ve erişilebilir medya denetçisi.
          </p>
        </div>
      </div>

      {/* Upload Box */}
      <div className="bg-white p-5 rounded-xl border border-[#E8E6DF] shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-[#1D2A1C] uppercase font-mono">Yeni Medya Yükle (Cloudflare R2)</h3>
          <span className="text-[11px] text-[#7A8377] font-mono">Otomatik optimizasyon &amp; CDN dağıtımı</span>
        </div>
        <R2Uploader
          label=""
          accept="image/*,video/mp4,video/webm"
          allowMultiple={true}
          onUploadComplete={() => {
            window.location.reload();
          }}
        />
      </div>

      {/* React Aria Photos Toolbar & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E8E6DF] space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#8C9388] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Dosya adı, alt-text veya ID ara..."
              className="w-full text-xs bg-[#FAF9F5] border border-[#E0DED7] rounded-lg pl-9 pr-3 py-2 text-[#1D2A1C] placeholder-[#8C9388] focus:bg-white focus:outline-none focus:border-[#1D2A1C]"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition whitespace-nowrap ${
                filterType === 'all'
                  ? 'bg-[#1D2A1C] text-white border-[#1D2A1C]'
                  : 'bg-white text-[#5C665A] border-[#E0DED7] hover:bg-[#FAF9F5]'
              }`}
            >
              Hepsi ({media.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterType('images')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition whitespace-nowrap ${
                filterType === 'images'
                  ? 'bg-[#1D2A1C] text-white border-[#1D2A1C]'
                  : 'bg-white text-[#5C665A] border-[#E0DED7] hover:bg-[#FAF9F5]'
              }`}
            >
              Fotoğraflar
            </button>

            <button
              type="button"
              onClick={() => setFilterType('videos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition whitespace-nowrap ${
                filterType === 'videos'
                  ? 'bg-[#1D2A1C] text-white border-[#1D2A1C]'
                  : 'bg-white text-[#5C665A] border-[#E0DED7] hover:bg-[#FAF9F5]'
              }`}
            >
              Videolar
            </button>

            <button
              type="button"
              onClick={() => setFilterType('missing_alt')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition whitespace-nowrap ${
                filterType === 'missing_alt'
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

      {/* React Aria Photos Responsive Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E8E6DF] p-12 text-center text-xs text-[#7A8377]">
          Filtre kriterlerine uygun medya dosyası bulunamadı.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((item) => {
            const isVideo = item.mime_type?.includes('video') || item.filename.match(/\.(mp4|webm)$/i);
            const hasAlt = Boolean(item.alt_text && item.alt_text.trim().length > 0);

            return (
              <div
                key={item.id}
                className="group bg-white rounded-xl border border-[#E8E6DF] overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col"
              >
                {/* Media Container */}
                <div
                  onClick={() => openInspector(item)}
                  className="aspect-square bg-[#F4F3EE] relative overflow-hidden flex items-center justify-center cursor-pointer select-none"
                >
                  {isVideo ? (
                    <video src={item.url} className="w-full h-full object-cover" muted loop autoPlay />
                  ) : (
                    <img src={item.url} alt={item.alt_text || item.original_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  )}

                  {/* Badges Overlay */}
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span className="bg-black/60 backdrop-blur-xs text-white text-[9px] px-1.5 py-0.5 rounded font-mono uppercase">
                      {item.storage_provider}
                    </span>
                    {isVideo && (
                      <span className="bg-emerald-700/80 backdrop-blur-xs text-white text-[9px] px-1.5 py-0.5 rounded font-mono uppercase flex items-center gap-0.5">
                        <Video className="w-2.5 h-2.5" /> MP4
                      </span>
                    )}
                  </div>

                  {/* SEO Alt-Text Status Badge with React Aria Tooltip */}
                  <div className="absolute top-2 right-2">
                    <AriaTooltip
                      content={
                        hasAlt
                          ? `SEO Alt Metni: "${item.alt_text}"`
                          : "⚠️ Alt metin eksik! SEO ve erişilebilirlik için ekleyin."
                      }
                      position="left"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openInspector(item);
                        }}
                        className={`p-1 rounded-full backdrop-blur-xs transition ${
                          hasAlt
                            ? 'bg-emerald-600/90 text-white hover:bg-emerald-700'
                            : 'bg-amber-500/90 text-white hover:bg-amber-600 animate-pulse'
                        }`}
                      >
                        {hasAlt ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      </button>
                    </AriaTooltip>
                  </div>

                  {/* Hover Overlay Trigger */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openInspector(item);
                      }}
                      className="p-2 bg-white text-[#1D2A1C] rounded-lg shadow-lg hover:scale-110 transition"
                      title="SEO & Detayları Düzenle"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyUrl(item.id, item.url);
                      }}
                      className="p-2 bg-white text-[#1D2A1C] rounded-lg shadow-lg hover:scale-110 transition"
                      title="CDN URL Kopyala"
                    >
                      {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Card Meta & Quick Alt-Text preview */}
                <div className="p-3 border-t border-[#E8E6DF] flex flex-col justify-between flex-1 bg-white">
                  <div>
                    <h4 className="font-semibold text-xs text-[#1D2A1C] truncate" title={item.original_name}>
                      {item.original_name}
                    </h4>
                    <p className="text-[10px] text-[#7A8377] font-mono mt-0.5">
                      {formatBytes(item.size_bytes)} {item.width ? `· ${item.width}x${item.height}` : ''}
                    </p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#F0EFEB] flex items-center justify-between">
                    <AriaTooltip
                      content={hasAlt ? item.alt_text : "SEO Alt metni tanımlanmamış"}
                      position="top"
                    >
                      <span className={`text-[10px] truncate max-w-[110px] block ${hasAlt ? 'text-[#3F5E3D] font-medium' : 'text-amber-600 italic'}`}>
                        {hasAlt ? `ALT: ${item.alt_text}` : 'ALT EKSİK'}
                      </span>
                    </AriaTooltip>

                    <button
                      type="button"
                      onClick={() => openInspector(item)}
                      className="text-[11px] text-[#5C665A] hover:text-[#1D2A1C] font-semibold flex items-center gap-0.5"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Düzenle</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* React Aria Photos Detail & SEO Inspector Modal Dialog */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#E8E6DF] max-w-2xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E6DF] bg-[#FAF9F5]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D87A4F]" />
                <h3 className="font-serif font-bold text-sm text-[#1D2A1C]">Medya &amp; SEO Alt-Text Denetçisi</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMedia(null)}
                className="p-1 rounded-lg text-[#7A8377] hover:text-[#1D2A1C] hover:bg-[#E8E6DF] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Media Preview Box */}
              <div className="rounded-xl overflow-hidden bg-[#F4F3EE] border border-[#E8E6DF] flex items-center justify-center max-h-64 relative">
                {selectedMedia.mime_type?.includes('video') || selectedMedia.filename.match(/\.(mp4|webm)$/i) ? (
                  <video src={selectedMedia.url} controls className="max-h-64 w-full object-contain" autoPlay muted loop />
                ) : (
                  <img src={selectedMedia.url} alt={editAltText || selectedMedia.original_name} className="max-h-64 w-full object-contain" />
                )}
              </div>

              {/* Edit SEO Alt-Text Form */}
              <fetcher.Form
                method="post"
                onSubmit={() => {
                  setSelectedMedia(null);
                }}
                className="space-y-4"
              >
                <input type="hidden" name="intent" value="update_seo" />
                <input type="hidden" name="mediaId" value={selectedMedia.id} />

                {/* SEO Alt-Text Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#1D2A1C] uppercase tracking-wider font-mono">
                      SEO Alt Metni (Alt-Text) *
                    </label>
                    <AriaTooltip
                      content="Arama motorlarının ve ekran okuyucuların görseli anlamasını sağlayan açıklayıcı metin."
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
                    value={editAltText}
                    onChange={(e) => setEditAltText(e.target.value)}
                    placeholder="Örn: Geniş yapraklı Monstera Deliciosa salon bitkisi seramik saksıda"
                    className="w-full text-xs border border-[#E0DED7] rounded-lg p-2.5 bg-[#FAF9F5] focus:bg-white focus:outline-none focus:border-[#1D2A1C]"
                  />
                  <p className="text-[11px] text-[#7A8377]">
                    İpucu: Bitkinin türünü, boyutunu ve kullanım ortamını tanımlayarak Google Görseller sıralamasını yükseltin.
                  </p>
                </div>

                {/* File Title */}
                <div>
                  <label className="block text-xs font-semibold text-[#5C665A] mb-1">Görünen Başlık / Dosya Adı</label>
                  <input
                    type="text"
                    name="original_name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-xs border border-[#E0DED7] rounded-lg p-2 bg-[#FAF9F5]"
                  />
                </div>

                {/* Technical Meta Card */}
                <div className="bg-[#FAF9F5] p-3 rounded-lg border border-[#E8E6DF] text-xs font-mono space-y-1 text-[#5C665A]">
                  <div className="flex items-center justify-between">
                    <span>Dosya ID:</span>
                    <span className="text-[#1D2A1C]">{selectedMedia.id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Boyut:</span>
                    <span className="text-[#1D2A1C]">{formatBytes(selectedMedia.size_bytes)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Depolama:</span>
                    <span className="text-[#1D2A1C] font-semibold uppercase">{selectedMedia.storage_provider} (Cloudflare R2)</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span>CDN URL:</span>
                    <button
                      type="button"
                      onClick={() => copyUrl(selectedMedia.id, selectedMedia.url)}
                      className="text-[#D87A4F] hover:underline flex items-center gap-1 font-sans text-xs"
                    >
                      {copiedId === selectedMedia.id ? 'Kopyalandı!' : 'URL Kopyala'}
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-[#E8E6DF]">
                  <fetcher.Form method="post">
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="mediaId" value={selectedMedia.id} />
                    <button
                      type="submit"
                      onClick={(e) => {
                        if (!confirm('Bu medyayı silmek istediğinizden emin misiniz?')) e.preventDefault();
                      }}
                      className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Medyayı Sil</span>
                    </button>
                  </fetcher.Form>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMedia(null)}
                      className="px-4 py-2 rounded-lg border border-[#DDDCD5] text-xs font-medium text-[#5C665A] hover:bg-[#F4F3EE] transition"
                    >
                      Kapat
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#1D2A1C] hover:bg-[#2D3E2C] text-[#FDFBF7] text-xs font-medium shadow-sm transition"
                    >
                      <Check className="w-4 h-4" />
                      <span>SEO Alt-Text'i Kaydet</span>
                    </button>
                  </div>
                </div>
              </fetcher.Form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
