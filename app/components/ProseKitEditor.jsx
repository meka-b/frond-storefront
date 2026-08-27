import React from 'react';
import { Toolbar, Button, Group, Separator } from 'react-aria-components';
import { Sparkles, BookOpen, Droplets, Target, Loader, ShieldAlert, CheckCircle2 } from 'lucide-react';

export function AIProductToolbar({ onAction, isGenerating, progressStage, progressPct, auditData }) {
  return (
    <div className="bg-white rounded-xl border border-[#E8E6DF] p-3 shadow-2xs space-y-2.5 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1D2A1C] to-[#3F3F46] flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#F3C6CF]" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#1D2A1C] font-serif flex items-center gap-1.5">
              AI Ürün Zekası &amp; RAG Otomasyonu
            </h3>
            <p className="text-[10px] text-[#7A8377]">
              Ürün adı üzerinden yerel RAG, Exa web araması, Firecrawl ve Mistral-Large ile otomatik doldurma
            </p>
          </div>
        </div>

        {auditData && (
          <div className="flex items-center gap-2 text-[11px]">
            <span className={`px-2 py-0.5 rounded-full font-mono font-medium flex items-center gap-1 ${
              auditData.confidenceScore >= 0.8 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {auditData.confidenceScore >= 0.8 ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              ) : (
                <ShieldAlert className="w-3 h-3 text-amber-600" />
              )}
              Güven: %{Math.round((auditData.confidenceScore || 0) * 100)}
            </span>
          </div>
        )}
      </div>

      <Toolbar aria-label="AI Intelligence Actions" className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#F0EFEB]">
        <Group aria-label="One-Click Actions" className="flex items-center">
          <Button
            onPress={() => onAction('ALL')}
            isDisabled={isGenerating}
            className="px-3 py-1.5 bg-[#1D2A1C] text-[#FDFBF7] hover:bg-[#2A3B29] pressed:bg-[#151E14] disabled:opacity-50 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <Loader className="w-3.5 h-3.5 animate-spin text-[#F3C6CF]" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-[#F3C6CF]" />
            )}
            <span>Tüm Alanları Doldur (Master AI)</span>
          </Button>
        </Group>

        <Separator orientation="vertical" className="h-5 w-[1px] bg-[#E8E6DF] mx-1" />

        <Group aria-label="Modular Actions" className="flex flex-wrap items-center gap-1.5">
          <Button
            onPress={() => onAction('RAG_SEARCH')}
            isDisabled={isGenerating}
            className="px-2.5 py-1.5 bg-[#FAF9F5] hover:bg-[#F4F3EE] pressed:bg-[#EAE8E0] disabled:opacity-50 text-[#1D2A1C] border border-[#E0DED7] text-xs font-medium rounded-lg flex items-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed"
          >
            <BookOpen className="w-3 h-3 text-[#5C665A]" />
            <span>RAG &amp; Web Araştırması (Exa + Firecrawl)</span>
          </Button>

          <Button
            onPress={() => onAction('CARE_GUIDE')}
            isDisabled={isGenerating}
            className="px-2.5 py-1.5 bg-[#FAF9F5] hover:bg-[#F4F3EE] pressed:bg-[#EAE8E0] disabled:opacity-50 text-[#1D2A1C] border border-[#E0DED7] text-xs font-medium rounded-lg flex items-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed"
          >
            <Droplets className="w-3 h-3 text-[#3B82F6]" />
            <span>Bakım Rehberi Üret</span>
          </Button>

          <Button
            onPress={() => onAction('SEO_SCHEMA')}
            isDisabled={isGenerating}
            className="px-2.5 py-1.5 bg-[#FAF9F5] hover:bg-[#F4F3EE] pressed:bg-[#EAE8E0] disabled:opacity-50 text-[#1D2A1C] border border-[#E0DED7] text-xs font-medium rounded-lg flex items-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed"
          >
            <Target className="w-3 h-3 text-[#10B981]" />
            <span>SEO &amp; JSON-LD Üret</span>
          </Button>
        </Group>
      </Toolbar>

      {isGenerating && (
        <div className="pt-2 border-t border-[#F0EFEB] space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#5C665A]">
            <span className="flex items-center gap-1.5">
              <Loader className="w-3 h-3 animate-spin text-[#1D2A1C]" />
              {progressStage || 'AI işlem yapıyor...'}
            </span>
            <span className="font-bold text-[#1D2A1C]">%{progressPct || 0}</span>
          </div>
          <div className="w-full h-1.5 bg-[#EAE8E0] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#1D2A1C] to-[#6366F1] transition-all duration-300 rounded-full"
              style={{ width: `${progressPct || 5}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default AIProductToolbar;
