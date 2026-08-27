/**
 * AI Product Enrichment Service
 * Pipeline: Product Title -> Local RAG -> Exa.ai -> Firecrawl -> Mistral-Large
 * PlantNet removed - all research is done via product title.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RAG_DIR = path.resolve(__dirname, '..', '..', 'rag');

const XOR_KEY = 'FROND_AI_PIPELINE_2025';
function xorString(str, key) {
  return Array.from(str).map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))).join('');
}
export function encryptKey(v) { return Buffer.from(xorString(v, XOR_KEY)).toString('base64'); }
export function decryptKey(v) { try { return xorString(Buffer.from(v, 'base64').toString('utf-8'), XOR_KEY); } catch { return ''; } }

export function saveApiKey(serviceKey, plain, label = '') {
  db.prepare('INSERT OR REPLACE INTO api_credentials (service_key, encrypted_value, label, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)').run(serviceKey, encryptKey(plain), label);
}
export function getApiKey(serviceKey) {
  const row = db.prepare('SELECT encrypted_value FROM api_credentials WHERE service_key = ?').get(serviceKey);
  return row ? decryptKey(row.encrypted_value) : null;
}
export function getAllApiKeys() {
  return db.prepare('SELECT service_key, label, updated_at FROM api_credentials').all();
}

export const SERVICES = [
  { key: 'EXA_API_KEY',              label: 'Exa.ai - Neural Web Search' },
  { key: 'FIRECRAWL_API_KEY',        label: 'Firecrawl - Web Scraping' },
  { key: 'PLANTNET_API_KEY',         label: 'PlantNet - Visual botanical identification' },
  { key: 'MISTRAL_API_KEY',          label: 'Mistral AI - LLM Reasoning' },
  { key: 'RAGFLOW_API_KEY',          label: 'RAGFlow - Cloud Vector Search (optional)' },
  { key: 'LLAMAINDEX_CLOUD_API_KEY', label: 'LlamaIndex Cloud - RAG (optional)' },
];

function ragLocalSearch(title, maxResults = 6) {
  const terms = title.toLowerCase().split(/[\s\-_]+/).filter(t => t.length > 2);
  const hits = [];
  const FILES = [
    'cactus_species_chunks.json', 'cactus_general_care_structured_json.json',
    'cactus_cultivation.json', 'cactus_diseases_rag.json',
    'cactus_propagate_structured_json.json', 'cactus_description_chunks_json.json',
  ];
  for (const file of FILES) {
    const fp = path.join(RAG_DIR, file);
    if (!fs.existsSync(fp)) continue;
    try {
      const data = JSON.parse(fs.readFileSync(fp, 'utf-8'));
      const chunks = Array.isArray(data) ? data : (data.chunks || data.items || Object.values(data));
      for (const chunk of chunks) {
        const text = JSON.stringify(chunk).toLowerCase();
        const score = terms.reduce((s, t) => s + (text.includes(t) ? 1 : 0), 0);
        if (score > 0) hits.push({ score, text: JSON.stringify(chunk).substring(0, 700) });
      }
    } catch { /* skip malformed */ }
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, maxResults).map(r => r.text);
}

async function exaSearch(title, apiKey, n = 5) {
  if (!apiKey) return [];
  try {
    const r = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify({ query: title + ' plant care buy online', numResults: n, useAutoprompt: true, type: 'neural', contents: { text: { maxCharacters: 800 } } }),
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) return [];
    const d = await r.json();
    return (d.results || []).map(x => '[' + x.title + '] ' + (x.text || ''));
  } catch { return []; }
}

async function firecrawlScrape(title, apiKey) {
  if (!apiKey) return '';
  try {
    const sr = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
      body: JSON.stringify({ query: 'buy ' + title + ' plant online', limit: 1 }),
      signal: AbortSignal.timeout(20000),
    });
    if (!sr.ok) return '';
    const sd = await sr.json();
    const url = sd.data?.[0]?.url;
    if (!url) return '';
    const cr = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
      body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true }),
      signal: AbortSignal.timeout(20000),
    });
    if (!cr.ok) return '';
    const cd = await cr.json();
    return (cd.data?.markdown || '').substring(0, 2500);
  } catch { return ''; }
}

async function mistralReason(ctx, apiKey) {
  if (!apiKey) throw new Error('MISTRAL_API_KEY not configured');
  const sys = 'You are an expert botanical e-commerce content strategist and SEO specialist. Based on the provided research context about a plant product, produce a complete, rich, SEO-optimized product payload in strict JSON format. Rules:\n- detailedDescriptionHtml must be valid Tiptap-compatible HTML (h2/h3/p/ul/li/strong).\n- All text in Turkish.\n- seoTitle max 60 chars. metaDescription max 155 chars.\n- mediaAltTexts MUST contain 4-6 detailed, descriptive Turkish SEO alt-texts describing different photographic angles, close-ups of leaves/stems/spines, interior placement, and care/detail views for search engines and accessibility (e.g. "Eulychnia Castanea Varispiralis nadir spiral kaktüs ana vitrin görünümü", "Heykelsi kıvrımlı gövde ve diken yapısı yakın çekim").';
  const rag = ctx.ragChunks.length > 0 ? ctx.ragChunks.join('\n---\n') : '(Not available)';
  const web = ctx.webResults.length > 0 ? ctx.webResults.join('\n---\n') : '(Not available)';
  const comp = ctx.competitorContent ? 'Competitor Content:\n' + ctx.competitorContent : '';
  const schema = JSON.stringify({
    general: { title: '', slug: '', shortDescription: '', detailedDescriptionHtml: '<!-- HTML HERE -->', badge: '', badgeStyle: 'moss-green', sku: '', searchTags: '', filterChips: '', publishStorefront: true, isBestseller: false, isUgcCommunity: false },
    careGuide: { light: '', water: '', petFriendly: '' },
    mediaAltTexts: [
      'Ürün ana vitrin ve genel saksı görünümü',
      'Yaprak / gövde dokusu ve botanik detay yakın plan',
      'İç mekan salon/ofis dekoratif duruşu ve ölçek görünümü',
      'Saksı detayı ve büyüme tepe noktası açısı'
    ],
    variantsSuggestion: [{ name: '', hexColor: '#8B6F5E', price: 0, compareAtPrice: 0, stock: 10 }],
    seoAndStructuredData: { seoTitle: '', metaDescription: '', searchIntent: 'commercial', primaryKeywords: [], longTailKeywords: [], semanticKeywords: [], jsonLdSchema: {}, faqItems: [], internalLinkingSuggestions: [], relatedProductQueries: [] },
    audit: { confidenceScore: 0.85, missingInformationWarnings: [], sourceReferences: [] },
  }, null, 2);
  const user = 'Product Title: "' + ctx.title + '"\n\nRAG Knowledge:\n' + rag + '\n\nWeb Research:\n' + web + '\n\n' + comp + '\n\nFill in and return this exact JSON structure with rich Turkish content:\n' + schema;
  const modelName = 'mistral-small-latest';
  const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
    body: JSON.stringify({
      model: modelName,
      messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
      response_format: { type: 'json_object' },
      temperature: 0.35,
      max_tokens: 2500
    }),
    signal: AbortSignal.timeout(90000),
  });
  if (!r.ok) {
    const e = await r.text();
    throw new Error('Mistral error: ' + r.status + ' - ' + e.substring(0, 200));
  }
  const d = await r.json();
  const content = d.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty Mistral response');
  return JSON.parse(content);
}

export async function enrichProduct(params, onProgress = () => {}) {
  const { title, action = 'ALL' } = params;
  const keys = { EXA: getApiKey('EXA_API_KEY'), FIRECRAWL: getApiKey('FIRECRAWL_API_KEY'), MISTRAL: getApiKey('MISTRAL_API_KEY') };
  const ctx = { title, ragChunks: [], webResults: [], competitorContent: '' };
  const runRag = action === 'ALL' || action === 'RAG_SEARCH' || action === 'CARE_GUIDE';
  const runWeb = action === 'ALL' || action === 'RAG_SEARCH' || action === 'SEO_SCHEMA';
  if (runRag) {
    onProgress('RAG — Yerel bilgi tabanı aranıyor...', 20);
    ctx.ragChunks = ragLocalSearch(title, 6);
  }
  if (runWeb) {
    onProgress('Exa.ai — Web araşтирması yapılıyor...', 40);
    ctx.webResults = await exaSearch(title, keys.EXA, 5);
    onProgress('Firecrawl — Rakip sayfalar analiz ediliyor...', 60);
    ctx.competitorContent = await firecrawlScrape(title, keys.FIRECRAWL);
  }
  onProgress('Mistral-Large — İçerik oluşturuluyor...', 80);
  const payload = await mistralReason(ctx, keys.MISTRAL);
  onProgress('Tamamlandı ✓', 100);
  return payload;
}