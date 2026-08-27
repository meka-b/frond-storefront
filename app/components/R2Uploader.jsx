import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Loader2, Copy, X } from 'lucide-react';

export default function R2Uploader({ onUploadComplete, value, accept = 'image/*', label = 'Görsel Yükle (Cloudflare R2)', allowMultiple = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);

    try {
      const uploadedUrls = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Yükleme başarısız');

        uploadedUrls.push(data.file.url);
      }

      if (allowMultiple) {
        onUploadComplete(uploadedUrls);
      } else {
        onUploadComplete(uploadedUrls[0]);
      }
    } catch (err) {
      setError(err.message || 'Yükleme sırasında hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="w-full">
      {label && <label className="block text-xs font-semibold uppercase tracking-wider text-[#5C665A] mb-2">{label}</label>}

      {value && !allowMultiple ? (
        <div className="relative rounded-lg border border-[#E8E6DF] bg-white p-3 shadow-sm flex items-center gap-4">
          <div className="w-16 h-16 rounded-md overflow-hidden bg-[#F4F3EE] flex-shrink-0 border border-[#E8E6DF] flex items-center justify-center">
            {value.match(/\.(mp4|webm)$/i) ? (
              <video src={value} className="w-full h-full object-cover" muted autoPlay loop />
            ) : (
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-[#333C31] truncate">{value}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => copyToClipboard(value)}
                className="inline-flex items-center gap-1 text-[11px] text-[#5C665A] hover:text-[#1D2A1C] bg-[#F4F3EE] px-2 py-0.5 rounded transition"
              >
                <Copy className="w-3 h-3" />
                {copied ? 'Kopyalandı ✓' : 'URL Kopyala'}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] text-[#D87A4F] hover:underline"
              >
                Değiştir
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onUploadComplete('')}
            className="text-[#999] hover:text-red-500 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-[#D87A4F] bg-[#FBECE3]/40'
              : 'border-[#DDDCD5] hover:border-[#1D2A1C] bg-white hover:bg-[#FAF9F5]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={allowMultiple}
            onChange={(e) => handleUpload(e.target.files)}
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center justify-center py-2">
              <Loader2 className="w-7 h-7 text-[#D87A4F] animate-spin mb-2" />
              <p className="text-xs font-medium text-[#1D2A1C]">Cloudflare R2'ye yükleniyor...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-1">
              <div className="w-10 h-10 rounded-full bg-[#F4F3EE] flex items-center justify-center text-[#5C665A] mb-2 group-hover:scale-105 transition">
                <UploadCloud className="w-5 h-5 text-[#3F5E3D]" />
              </div>
              <p className="text-xs font-medium text-[#1D2A1C]">
                <span className="text-[#D87A4F] font-semibold">Dosya seçin</span> veya buraya sürükleyip bırakın
              </p>
              <p className="text-[11px] text-[#888B86] mt-0.5">Cloudflare R2 Küresel Depolama (JPG, PNG, WEBP, MP4)</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
