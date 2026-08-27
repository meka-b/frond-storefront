import React, { useState } from 'react';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import {
  generateLlmsTxt,
  generateLlmsFullTxt,
  generateAgentIndexJson,
  generateRobotsTxt,
  getSiteInfo
} from '../../server/services/agentVisibility.js';
import db from '../../server/db/index.js';
import {
  Bot,
  Sparkles,
  FileText,
  Code2,
  Copy,
  Check,
  Globe,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Layers,
  Cpu,
  RefreshCw,
  ShoppingBag,
  BookOpen,
  CheckCircle2
} from 'lucide-react';

export const loader = async () => {
  const llmsTxt = generateLlmsTxt();
  const llmsFullTxt = generateLlmsFullTxt();
  const indexJson = generateAgentIndexJson();
  const robotsTxt = generateRobotsTxt();
  const site = getSiteInfo();

  const productsCount = db.prepare('SELECT COUNT(*) as c FROM products WHERE is_published = 1').get().c;
  const articlesCount = db.prepare('SELECT COUNT(*) as c FROM blog_articles WHERE is_published = 1').get().c;

  return json({
    llmsTxt,
    llmsFullTxt,
    indexJson,
    robotsTxt,
    site,
    stats: {
      productsCount,
      articlesCount
    }
  });
};

export default function AdminAgentVisibility() {
  const { llmsTxt, llmsFullTxt, indexJson, robotsTxt, site, stats } = useLoaderData();
  const [activeTab, setActiveTab] = useState('llms'); // 'llms' | 'llms_full' | 'index_json' | 'robots' | 'crawler_test'
  const [copied, setCopied] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('GPTBot');

  const copyContent = (text) => {
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const agentsList = [
    { name: 'GPTBot', org: 'OpenAI (ChatGPT Search)', status: 'Allowed', path: '/llms.txt, /index.json' },
    { name: 'ClaudeBot', org: 'Anthropic (Claude AI)', status: 'Allowed', path: '/llms.txt, /index.json' },
    { name: 'PerplexityBot', org: 'Perplexity AI Search', status: 'Allowed', path: '/llms.txt, /index.json' },
    { name: 'Google-Extended', org: 'Google (Gemini & SGE)', status: 'Allowed', path: '/llms.txt, /index.json' },
    { name: 'Amazonbot', org: 'Amazon AI Shopping', status: 'Allowed', path: '/llms.txt' },
    { name: 'Applebot-Extended', org: 'Apple Intelligence', status: 'Allowed', path: '/llms.txt' },
    { name: 'Bytespider', org: 'ByteDance AI', status: 'Allowed', path: '/llms.txt' },
    { name: 'cohere-ai', org: 'Cohere Command R+', status: 'Allowed', path: '/llms.txt' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#1D2A1C] font-serif">AI Agent Visibility & Commerce LLMs.txt</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-100 text-blue-800 font-semibold border border-blue-200">
              Cloudflare Standard
            </span>
          </div>
          <p className="text-xs text-[#7A8377] mt-0.5">
            Ürün kataloğunu ve bakım rehberlerini ChatGPT, Claude ve Perplexity gibi otonom yapay zeka ajanlarının okuyabileceği standart formatlarda sunun.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/llms.txt"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E0DED7] text-xs font-semibold text-[#1D2A1C] hover:bg-[#FAF9F5] transition shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Canlı /llms.txt Aç
          </a>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E0DED7] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#7A8377]">
            <span className="text-xs font-medium">İndekslenen Ürünler</span>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-[#1D2A1C] font-mono">{stats.productsCount}</p>
          <p className="text-[11px] text-[#7A8377]">Teknik özellikler & varyantlar aktif</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E0DED7] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#7A8377]">
            <span className="text-xs font-medium">Bakım & Rehberler</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-[#1D2A1C] font-mono">{stats.articlesCount}</p>
          <p className="text-[11px] text-[#7A8377]">TL;DR ve AI özetleri hazır</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E0DED7] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#7A8377]">
            <span className="text-xs font-medium">Ajan Yüzeyleri (Surfaces)</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-[#1D2A1C] font-mono">5 Aktif</p>
          <p className="text-[11px] text-[#7A8377]">/llms.txt, /index.json, *.md</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E0DED7] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#7A8377]">
            <span className="text-xs font-medium">Content-Signal Başlığı</span>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-sm font-bold text-[#1D2A1C] font-mono truncate">agents=allow</p>
          <p className="text-[11px] text-emerald-600 font-medium">Arama ve çıkarım izinleri açık</p>
        </div>
      </div>

      {/* Main Surface Explorer */}
      <div className="bg-white rounded-2xl border border-[#E0DED7] p-6 shadow-sm space-y-6">
        {/* Surface Tabs */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-px overflow-x-auto">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('llms')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap ${
                activeTab === 'llms'
                  ? 'border-[#1D2A1C] text-[#1D2A1C] bg-[#FAF9F5]'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              /llms.txt (Standart İndeks)
            </button>

            <button
              onClick={() => setActiveTab('llms_full')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap ${
                activeTab === 'llms_full'
                  ? 'border-[#1D2A1C] text-[#1D2A1C] bg-[#FAF9F5]'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              /llms-full.txt (Detaylı Katalog & Varyantlar)
            </button>

            <button
              onClick={() => setActiveTab('index_json')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap ${
                activeTab === 'index_json'
                  ? 'border-[#1D2A1C] text-[#1D2A1C] bg-[#FAF9F5]'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-blue-600" />
              /index.json (Tipik JSON İndeksi)
            </button>

            <button
              onClick={() => setActiveTab('robots')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap ${
                activeTab === 'robots'
                  ? 'border-[#1D2A1C] text-[#1D2A1C] bg-[#FAF9F5]'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-amber-600" />
              /robots.txt (AI Bot Direktifleri)
            </button>

            <button
              onClick={() => setActiveTab('crawler_test')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap ${
                activeTab === 'crawler_test'
                  ? 'border-[#1D2A1C] text-[#1D2A1C] bg-[#FAF9F5]'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-slate-600" />
              Ajan Uyumluluk & Bot Testi
            </button>
          </div>

          <button
            onClick={() => {
              if (activeTab === 'llms') copyContent(llmsTxt);
              else if (activeTab === 'llms_full') copyContent(llmsFullTxt);
              else if (activeTab === 'index_json') copyContent(indexJson);
              else if (activeTab === 'robots') copyContent(robotsTxt);
            }}
            className="inline-flex items-center gap-1 text-xs text-[#1D2A1C] bg-[#FAF9F5] border border-[#E2E8F0] px-3 py-1.5 rounded-lg hover:bg-white transition mb-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Kopyalandı' : 'Kopyala'}
          </button>
        </div>

        {/* TAB 1: /llms.txt */}
        {activeTab === 'llms' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs text-[#64748B]">
              <span>Standard LLMs.txt formatı (llmstxt.org). Mağazanın genel özeti, ürün linkleri ve bakım rehberleri.</span>
              <span className="font-mono text-[11px]">MIME: text/plain; charset=utf-8</span>
            </div>
            <pre className="bg-[#0F172A] text-[#38BDF8] p-5 rounded-2xl text-xs font-mono overflow-x-auto max-h-[500px] border border-[#1E293B] leading-relaxed">
              {llmsTxt}
            </pre>
          </div>
        )}

        {/* TAB 2: /llms-full.txt */}
        {activeTab === 'llms_full' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs text-[#64748B]">
              <span>Yapay zeka alışveriş ajanları için tüm varyantlar, stoklar, fiyatlar, ışık/sulama/evcil hayvan gereksinimleri.</span>
              <span className="font-mono text-[11px]">MIME: text/plain; charset=utf-8</span>
            </div>
            <pre className="bg-[#0F172A] text-[#4ADE80] p-5 rounded-2xl text-xs font-mono overflow-x-auto max-h-[500px] border border-[#1E293B] leading-relaxed">
              {llmsFullTxt}
            </pre>
          </div>
        )}

        {/* TAB 3: /index.json */}
        {activeTab === 'index_json' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs text-[#64748B]">
              <span>Cloudflare Agent Visibility spesifikasyonuna uygun tipik JSON indeksi.</span>
              <span className="font-mono text-[11px]">MIME: application/json; charset=utf-8</span>
            </div>
            <pre className="bg-[#0F172A] text-[#FCD34D] p-5 rounded-2xl text-xs font-mono overflow-x-auto max-h-[500px] border border-[#1E293B] leading-relaxed">
              {JSON.stringify(indexJson, null, 2)}
            </pre>
          </div>
        )}

        {/* TAB 4: /robots.txt */}
        {activeTab === 'robots' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs text-[#64748B]">
              <span>GPTBot, ClaudeBot, PerplexityBot ve Google-Extended için açık izin direktifleri.</span>
              <span className="font-mono text-[11px]">MIME: text/plain; charset=utf-8</span>
            </div>
            <pre className="bg-[#0F172A] text-[#F472B6] p-5 rounded-2xl text-xs font-mono overflow-x-auto max-h-[500px] border border-[#1E293B] leading-relaxed">
              {robotsTxt}
            </pre>
          </div>
        )}

        {/* TAB 5: Ajan Uyumluluk & Bot Testi */}
        {activeTab === 'crawler_test' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="bg-[#FAF9F5] border border-[#E2E8F0] rounded-2xl p-4 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1D2A1C] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Yapay Zeka Bot İzinleri & Protokol Durumu
                </span>
                <span className="text-[11px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                  %100 Uyumlu
                </span>
              </div>

              <div className="divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded-xl bg-white overflow-hidden">
                {agentsList.map((agent, i) => (
                  <div key={i} className="p-3 flex items-center justify-between hover:bg-[#FAF9F5] transition">
                    <div className="flex items-center gap-3">
                      <Bot className="w-4 h-4 text-[#64748B]" />
                      <div>
                        <span className="font-bold text-[#1D2A1C]">{agent.name}</span>
                        <span className="text-[11px] text-[#7A8377] block">{agent.org}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="text-[#64748B]">{agent.path}</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                        {agent.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0F172A] text-white p-4 rounded-2xl border border-[#1E293B] space-y-2 text-xs font-mono">
              <div className="text-gray-400 text-[11px]">HTTP Response Headers Injected:</div>
              <div className="text-emerald-400">Content-Signal: search=yes,ai-train=no,ai-input=yes,agents=allow</div>
              <div className="text-blue-400">X-Agent-Protocol: llms.txt/1.0, agent-visibility/1.0</div>
              <div className="text-purple-400">Access-Control-Allow-Origin: *</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
